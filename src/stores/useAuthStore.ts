import { create } from "zustand";
import { UserProfile, UserRole, Company, CompanySettings } from "@/types";
import { auth, firestore } from "@/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  collection,
  query,
  where,
  limit,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { cleanForFirestore } from "@/lib/db";
import {
  clearAllVaultData,
  safeSetLocalStorage,
  safeRemoveLocalStorage,
} from "@/lib/idbVault";
import { disconnectGoogleAccount } from "@/lib/googleSyncService";
import { isUserSuspended } from "@/lib/permissions";
import { DEFAULT_THEME_PALETTE, applyCompanyTheme } from "@/lib/theme";
import toast from "react-hot-toast";

const INITIAL_COMPANY_STANDARDS: string[] = [
  "ISO 9001:2015 Quality Management Systems",
  "BS EN 12390 Testing Hardened Concrete",
  "ASTM A615 / A615M Deformed Steel Bars",
  "ACI 318 Building Code Requirements for Structural Concrete",
  "BS 8110 Structural Use of Concrete",
  "BS 4449 Carbon Steel Bars for the Reinforcement of Concrete",
];

const INITIAL_COMPANY_SETTINGS: CompanySettings = {
  ncrPrefix: "NCR",
  rfiPrefix: "RFI",
  marPrefix: "MAR",
  mirPrefix: "MIR",
  siteCommentPrefix: "QC/COM",
  inspectionPrefix: "INSP",
  ptpPrefix: "PTP",
  weeklyReportPrefix: "WQR",
  siteInstructionPrefix: "SI",
  cubeTestStandard: "BS EN 12390",
  rebarStandard: "BS 4449",
  notifications: {
    notifyNCR: true,
    notifyInspection: true,
    notifyCubeFailure: true,
    notifyPTP: true,
  },
  themePalette: DEFAULT_THEME_PALETTE,
};

type LogoutCleanupFn = () => void | Promise<void>;
const logoutCleanupCallbacks = new Set<LogoutCleanupFn>();

export function registerLogoutCleanup(fn: LogoutCleanupFn): () => void {
  logoutCleanupCallbacks.add(fn);
  return () => {
    logoutCleanupCallbacks.delete(fn);
  };
}

function generateTenantId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `comp-${crypto.randomUUID()}`;
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  }
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `comp-${Date.now()}-${hex.slice(0, 12)}`;
}

function sanitizeUserForCache(user: UserProfile): UserProfile {
  if (!user.smtpCredentials?.password) return user;
  const { password: _omitted, ...safeSmtp } = user.smtpCredentials;
  return {
    ...user,
    smtpCredentials: safeSmtp,
  };
}

function sanitizeCompanyForCache(company: Company): Company {
  const smtp = company.settings?.smtpServer as (Record<string, any> | undefined);
  if (!smtp || !smtp.password) return company;
  const { password: _omitted, ...safeSmtp } = smtp;
  return {
    ...company,
    settings: {
      ...company.settings,
      smtpServer: safeSmtp as any,
    },
  };
}

interface ProvisionedInviteLookup {
  inviteDocExists: boolean;
  legacyDocId?: string;
  data: Partial<UserProfile> & { claimedByUid?: string };
}

/**
 * Looks up pre-provisioned user invitations by normalized email:
 * 1. Deterministic `userInvites/{normalizedEmail}` doc (O(1), rules-friendly)
 * 2. Legacy `users` doc with `email == normalizedEmail` (e.g. `usr-...`)
 */
async function findProvisionedInvite(
  normalizedEmail: string,
  excludeUid: string,
): Promise<ProvisionedInviteLookup | null> {
  if (!normalizedEmail) return null;

  let inviteData: (Partial<UserProfile> & { claimedByUid?: string; legacyUserDocId?: string }) | null = null;
  let inviteDocExists = false;
  let legacyDocId: string | undefined;

  try {
    const inviteSnap = await getDoc(doc(firestore, "userInvites", normalizedEmail));
    if (inviteSnap.exists()) {
      const d = inviteSnap.data() as any;
      if (!d.claimedByUid || d.claimedByUid === excludeUid) {
        inviteDocExists = true;
        inviteData = d;
        if (typeof d.legacyUserDocId === "string" && d.legacyUserDocId !== excludeUid) {
          legacyDocId = d.legacyUserDocId;
        }
      }
    }
  } catch (e) {
    console.debug("[JQMS Auth] userInvites lookup skipped:", e);
  }

  try {
    const q = query(
      collection(firestore, "users"),
      where("email", "==", normalizedEmail),
    );
    const qSnap = await getDocs(q);
    for (const d of qSnap.docs) {
      if (d.id !== excludeUid) {
        legacyDocId = d.id;
        inviteData = {
          ...(inviteData || {}),
          ...(d.data() as UserProfile),
        };
        break;
      }
    }
  } catch (e) {
    console.debug("[JQMS Auth] legacy email query skipped:", e);
  }

  if (!inviteData) return null;

  return {
    inviteDocExists,
    legacyDocId,
    data: inviteData,
  };
}

async function finalizeInviteClaim(
  normalizedEmail: string,
  claimedByUid: string,
  lookup: ProvisionedInviteLookup,
): Promise<void> {
  if (lookup.inviteDocExists && normalizedEmail) {
    try {
      await setDoc(
        doc(firestore, "userInvites", normalizedEmail),
        {
          claimedByUid,
          claimedAt: Date.now(),
          updatedAt: Date.now(),
        },
        { merge: true },
      );
    } catch (err) {
      console.debug("[JQMS Auth] Could not mark userInvite claimed:", err);
    }
  }

  if (lookup.legacyDocId && lookup.legacyDocId !== claimedByUid) {
    try {
      await deleteDoc(doc(firestore, "users", lookup.legacyDocId));
    } catch (err) {
      console.debug("[JQMS Auth] Could not delete legacy pre-provisioned user doc:", err);
    }
  }
}

/**
 * Authoritatively resolves, links, and synchronizes the Firestore user document
 * for an authenticated Firebase user.
 *
 * SECURITY INVARIANT:
 * - Never reads untrusted `localStorage` fields into Firestore (blocks local privilege/tenant spoofing).
 * - Never assigns ghost demo company IDs or wildcard `["*"]` project access to unprovisioned accounts.
 */
async function resolveAndSyncUserProfile(
  fbUser: FirebaseUser,
  emailHint?: string,
): Promise<UserProfile> {
  const normalizedEmail = (fbUser.email || emailHint || "").trim().toLowerCase();
  const userDocRef = doc(firestore, "users", fbUser.uid);

  const userSnap = await getDoc(userDocRef);
  const inviteLookup = await findProvisionedInvite(normalizedEmail, fbUser.uid);

  let finalProfile: UserProfile;

  if (userSnap.exists()) {
    const currentData = userSnap.data() as UserProfile;

    if (inviteLookup && (!currentData.companyId || inviteLookup.legacyDocId)) {
      const adminData = inviteLookup.data;
      finalProfile = {
        ...adminData,
        ...currentData,
        uid: fbUser.uid,
        email: normalizedEmail || currentData.email,
        companyId: currentData.companyId || adminData.companyId || "",
        companyName: currentData.companyName || adminData.companyName || "",
        // Preserve authoritative role; if current doc had no companyId yet, adopt invited role
        role: currentData.companyId
          ? currentData.role
          : (adminData.role as UserRole) || currentData.role || "CLIENT_REPRESENTATIVE",
        title:
          currentData.title ||
          currentData.designation ||
          adminData.title ||
          adminData.designation,
        designation:
          currentData.designation ||
          currentData.title ||
          adminData.designation ||
          adminData.title,
        department: currentData.department || adminData.department,
        projectIds:
          currentData.projectIds && currentData.projectIds.length > 0
            ? currentData.projectIds
            : adminData.projectIds || [],
        projectAccess:
          currentData.projectAccess && Object.keys(currentData.projectAccess).length > 0
            ? currentData.projectAccess
            : adminData.projectAccess || {},
        status: adminData.status || currentData.status || "ACTIVE",
        isActive:
          adminData.isActive !== undefined
            ? adminData.isActive
            : currentData.isActive !== false,
        updatedAt: Date.now(),
      };

      await setDoc(userDocRef, cleanForFirestore(finalProfile), { merge: true });
      await finalizeInviteClaim(normalizedEmail, fbUser.uid, inviteLookup);
    } else if (!currentData.companyId) {
      // Auto-heal legacy accounts that have no companyId assigned in Firestore
      let healedCompanyId = "";
      let healedCompanyName = "";

      // 1. Check if user is owner of an existing company
      try {
        const ownerQuery = query(
          collection(firestore, "companies"),
          where("ownerId", "==", fbUser.uid),
          limit(1),
        );
        const ownerSnap = await getDocs(ownerQuery);
        if (!ownerSnap.empty) {
          const cDoc = ownerSnap.docs[0];
          healedCompanyId = cDoc.id;
          healedCompanyName = (cDoc.data() as Company).name || "";
        }
      } catch (err) {
        console.debug("[JQMS Auth] Company owner query skipped:", err);
      }

      // 2. If user email, smtpCredentials, or organization domain points to primary workspace
      const userDomain = normalizedEmail.split("@")[1] || "";
      const smtpSender = currentData.smtpCredentials?.senderEmail || "";
      const isCollectionDomain =
        userDomain.includes("collection") ||
        smtpSender.includes("collection") ||
        (Array.isArray(currentData.projectIds) && currentData.projectIds.includes("*"));

      if (!healedCompanyId && isCollectionDomain) {
        healedCompanyId = "-Oubn5JnM98I3QvSzHCB";
        healedCompanyName = "Collection Developments LTD";
      }

      // 3. Fallback: Check if default company "-Oubn5JnM98I3QvSzHCB" exists in Firestore
      if (!healedCompanyId) {
        try {
          const compSnap = await getDoc(doc(firestore, "companies", "-Oubn5JnM98I3QvSzHCB"));
          if (compSnap.exists()) {
            healedCompanyId = compSnap.id;
            healedCompanyName = (compSnap.data() as Company).name || "Collection Developments LTD";
          }
        } catch (err) {
          console.debug("[JQMS Auth] Default company check skipped:", err);
        }
      }

      const fallbackName =
        currentData.fullName ||
        currentData.displayName ||
        fbUser.displayName ||
        (normalizedEmail ? normalizedEmail.split("@")[0] : "QA/QC Engineer");

      finalProfile = {
        ...currentData,
        uid: fbUser.uid,
        email: normalizedEmail || currentData.email || "",
        fullName: fallbackName,
        displayName: currentData.displayName || fallbackName,
        companyId: healedCompanyId,
        companyName: healedCompanyName || currentData.companyName || "",
        role: currentData.role || "CLIENT_REPRESENTATIVE",
        status: currentData.status || "ACTIVE",
        isActive: currentData.isActive !== false,
        updatedAt: Date.now(),
      };

      if (healedCompanyId) {
        try {
          await setDoc(userDocRef, cleanForFirestore(finalProfile), { merge: true });
        } catch (persistErr) {
          console.warn("[JQMS Auth] Could not persist healed profile to Firestore:", persistErr);
        }
      }
    } else {
      const fallbackName =
        currentData.fullName ||
        currentData.displayName ||
        fbUser.displayName ||
        (normalizedEmail ? normalizedEmail.split("@")[0] : "User");

      finalProfile = {
        ...currentData,
        uid: fbUser.uid,
        email: normalizedEmail || currentData.email || "",
        fullName: fallbackName,
        displayName: currentData.displayName || fallbackName,
      };

      // Backfill missing email or fullName if not set in Firestore
      if (!currentData.email || !currentData.fullName) {
        try {
          await setDoc(
            userDocRef,
            cleanForFirestore({
              email: finalProfile.email,
              fullName: finalProfile.fullName,
              updatedAt: Date.now(),
            }),
            { merge: true },
          );
        } catch (syncErr) {
          console.debug("[JQMS Auth] Profile backfill skipped:", syncErr);
        }
      }
    }
  } else if (inviteLookup) {
    // Migrate pre-invited user document into users/{fbUser.uid}, strictly preserving admin-assigned role & tenant
    const adminData = inviteLookup.data;
    finalProfile = {
      ...(adminData as UserProfile),
      uid: fbUser.uid,
      email: normalizedEmail,
      fullName:
        adminData.fullName ||
        fbUser.displayName ||
        normalizedEmail.split("@")[0] ||
        "User",
      displayName:
        adminData.displayName ||
        adminData.fullName ||
        fbUser.displayName ||
        normalizedEmail.split("@")[0] ||
        "User",
      role: (adminData.role as UserRole) || "CLIENT_REPRESENTATIVE",
      companyId: adminData.companyId || "",
      companyName: adminData.companyName || "",
      projectIds: Array.isArray(adminData.projectIds) ? adminData.projectIds : [],
      projectAccess:
        adminData.projectAccess && typeof adminData.projectAccess === "object"
          ? adminData.projectAccess
          : {},
      status: adminData.status || "ACTIVE",
      isActive: adminData.isActive !== false,
      createdAt:
        typeof adminData.createdAt === "number" ? adminData.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    await setDoc(userDocRef, cleanForFirestore(finalProfile), { merge: true });
    await finalizeInviteClaim(normalizedEmail, fbUser.uid, inviteLookup);
  } else {
    // Unprovisioned account (e.g. external OAuth without sign-up batch): default to least-privilege Level 1
    const fallbackName =
      fbUser.displayName || normalizedEmail.split("@")[0] || "User";
    finalProfile = {
      uid: fbUser.uid,
      email: normalizedEmail,
      fullName: fallbackName,
      displayName: fallbackName,
      role: "CLIENT_REPRESENTATIVE",
      companyId: "",
      companyName: "",
      projectIds: [],
      projectAccess: {},
      status: "ACTIVE",
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await setDoc(userDocRef, cleanForFirestore(finalProfile), { merge: true });
  }

  try {
    if (finalProfile.fullName && fbUser.displayName !== finalProfile.fullName) {
      await updateProfile(fbUser, { displayName: finalProfile.fullName });
    }
  } catch {
    // Ignore Auth profile display name sync warnings
  }

  return finalProfile;
}

// Module-level coordination locks for sign-up race prevention & singleton auth listener
let activeSignUpPromise: Promise<void> | null = null;
let singletonAuthUnsub: (() => void) | null = null;
let singletonListenerRefCount = 0;
let activeUserSnapshotUnsub: Unsubscribe | null = null;
let activeCompanySnapshotUnsub: Unsubscribe | null = null;
let subscribedCompanyId: string | null = null;

function clearLiveFirestoreAuthListeners(): void {
  if (activeUserSnapshotUnsub) {
    activeUserSnapshotUnsub();
    activeUserSnapshotUnsub = null;
  }
  if (activeCompanySnapshotUnsub) {
    activeCompanySnapshotUnsub();
    activeCompanySnapshotUnsub = null;
  }
  subscribedCompanyId = null;
}

interface AuthState {
  currentUser: UserProfile | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: UserProfile | null) => void;
  setCompany: (company: Company | null) => void;
  loginWithEmail: (email: string, pass: string) => Promise<boolean>;
  signUpWithEmail: (
    email: string,
    pass: string,
    fullName: string,
    role?: UserRole,
    companyName?: string,
  ) => Promise<boolean>;
  logout: (reasonMessage?: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  initAuthListener: () => () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const syncLiveCompanySubscription = (companyId?: string) => {
    const cleanId = (companyId || "").trim();
    if (!cleanId) {
      if (activeCompanySnapshotUnsub) {
        activeCompanySnapshotUnsub();
        activeCompanySnapshotUnsub = null;
      }
      subscribedCompanyId = null;
      set({ company: null });
      safeRemoveLocalStorage("jqms_current_company");
      return;
    }

    if (subscribedCompanyId === cleanId && activeCompanySnapshotUnsub) {
      return;
    }

    if (activeCompanySnapshotUnsub) {
      activeCompanySnapshotUnsub();
      activeCompanySnapshotUnsub = null;
    }
    subscribedCompanyId = cleanId;

    activeCompanySnapshotUnsub = onSnapshot(
      doc(firestore, "companies", cleanId),
      (compSnap) => {
        if (compSnap.exists()) {
          const compObj = sanitizeCompanyForCache({
            ...(compSnap.data() as Company),
            id: compSnap.id,
          });
          set({ company: compObj });
          safeSetLocalStorage("jqms_current_company", compObj);
          if (compObj.settings?.themePalette) {
            applyCompanyTheme(compObj.settings.themePalette);
          }
        }
      },
      (err) => {
        console.warn("[JQMS Auth] Company snapshot listener warning:", err);
      },
    );
  };

  return {
    currentUser: null,
    company: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    setUser: (user) => {
      if (user) {
        const sanitized = sanitizeUserForCache(user);
        safeSetLocalStorage("jqms_current_user", sanitized);
        set({ currentUser: sanitized, isAuthenticated: true, isLoading: false });
      } else {
        safeRemoveLocalStorage("jqms_current_user");
        set({ currentUser: null, isAuthenticated: false, isLoading: false });
      }
    },

    setCompany: (company) => {
      if (company) {
        const sanitized = sanitizeCompanyForCache(company);
        safeSetLocalStorage("jqms_current_company", sanitized);
        set({ company: sanitized });
      } else {
        safeRemoveLocalStorage("jqms_current_company");
        set({ company: null });
      }
    },

    loginWithEmail: async (email: string, pass: string) => {
      set({ isLoading: true, error: null });
      try {
        const normalizedEmail = email.trim().toLowerCase();
        const cred = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
        const fbUser = cred.user;

        const profile = await resolveAndSyncUserProfile(fbUser, normalizedEmail);

        if (isUserSuspended(profile)) {
          await get().logout(
            "Your account has been deactivated by your organization administrator. Please contact your Quality Director.",
          );
          return false;
        }

        let compObj: Company | null = null;
        if (profile.companyId) {
          try {
            const compSnap = await getDoc(
              doc(firestore, "companies", profile.companyId),
            );
            if (compSnap.exists()) {
              compObj = sanitizeCompanyForCache({
                ...(compSnap.data() as Company),
                id: compSnap.id,
              });
              if (compObj.settings?.themePalette) {
                applyCompanyTheme(compObj.settings.themePalette);
              }
            }
          } catch (e) {
            console.warn("Company fetch warning:", e);
          }
        }

        const safeProfile = sanitizeUserForCache(profile);
        safeSetLocalStorage("jqms_current_user", safeProfile);
        if (compObj) {
          safeSetLocalStorage("jqms_current_company", compObj);
        } else {
          safeRemoveLocalStorage("jqms_current_company");
        }

        syncLiveCompanySubscription(safeProfile.companyId);

        set({
          currentUser: safeProfile,
          company: compObj,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return true;
      } catch (err: any) {
        console.error("Firebase Authentication Error:", err);
        const errorMessage = err?.code
          ? err.code.replace("auth/", "").replace(/-/g, " ")
          : err?.message ||
            "Authentication failed. Please check your email and password.";

        set({
          currentUser: null,
          company: null,
          isAuthenticated: false,
          isLoading: false,
          error: errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1),
        });
        return false;
      }
    },

    signUpWithEmail: async (
      email: string,
      pass: string,
      fullName: string,
      _requestedRole?: UserRole,
      companyName: string = "",
    ) => {
      set({ isLoading: true, error: null });
      const normalizedEmail = email.trim().toLowerCase();
      const trimmedName = fullName.trim();
      const trimmedCompany = companyName.trim();

      let resolveSignUpLock: (() => void) | null = null;
      activeSignUpPromise = new Promise<void>((resolve) => {
        resolveSignUpLock = resolve;
      });

      try {
        const cred = await createUserWithEmailAndPassword(
          auth,
          normalizedEmail,
          pass,
        );
        const fbUser = cred.user;

        try {
          if (trimmedName) {
            await updateProfile(fbUser, { displayName: trimmedName });
          }
        } catch {
          // Ignore displayName update warnings
        }

        // 1. Hybrid SaaS Check: Was this email pre-invited by an existing tenant administrator?
        const inviteLookup = await findProvisionedInvite(normalizedEmail, fbUser.uid);

        let finalProfile: UserProfile;
        let finalCompany: Company | null = null;
        const now = Date.now();

        if (inviteLookup && inviteLookup.data.companyId) {
          const adminData = inviteLookup.data;

          if (isUserSuspended(adminData)) {
            await signOut(auth).catch(() => {});
            set({
              currentUser: null,
              company: null,
              isAuthenticated: false,
              isLoading: false,
              error:
                "This invited account has been deactivated by your organization administrator.",
            });
            return false;
          }

          // Strictly preserve the admin-assigned role, companyId, and project assignments
          finalProfile = {
            ...(adminData as UserProfile),
            uid: fbUser.uid,
            email: normalizedEmail,
            fullName: trimmedName || adminData.fullName || normalizedEmail.split("@")[0],
            displayName:
              trimmedName ||
              adminData.displayName ||
              adminData.fullName ||
              normalizedEmail.split("@")[0],
            role: (adminData.role as UserRole) || "SITE_ENGINEER",
            companyId: adminData.companyId || "",
            companyName: adminData.companyName || trimmedCompany || "",
            projectIds: Array.isArray(adminData.projectIds) ? adminData.projectIds : [],
            projectAccess:
              adminData.projectAccess && typeof adminData.projectAccess === "object"
                ? adminData.projectAccess
                : {},
            status: "ACTIVE",
            isActive: true,
            createdAt:
              typeof adminData.createdAt === "number" ? adminData.createdAt : now,
            updatedAt: now,
          };

          await setDoc(
            doc(firestore, "users", fbUser.uid),
            cleanForFirestore(finalProfile),
            { merge: true },
          );
          await finalizeInviteClaim(normalizedEmail, fbUser.uid, inviteLookup);

          try {
            const compSnap = await getDoc(
              doc(firestore, "companies", finalProfile.companyId),
            );
            if (compSnap.exists()) {
              finalCompany = sanitizeCompanyForCache({
                ...(compSnap.data() as Company),
                id: compSnap.id,
              });
            }
          } catch {
            // Ignore company fetch warning
          }
        } else {
          // 2. New Organization Provisioning Path
          if (!trimmedCompany) {
            // Roll back the freshly created unprovisioned Auth user cleanly so the user can enter their Company Name
            try {
              await fbUser.delete();
            } catch {
              await signOut(auth).catch(() => {});
            }
            set({
              currentUser: null,
              company: null,
              isAuthenticated: false,
              isLoading: false,
              error:
                "No existing workspace invitation was found for this email. Please enter your Organization / Company Name to create a new workspace.",
            });
            return false;
          }

          const newCompanyId = generateTenantId();
          const newCompany: Company = {
            id: newCompanyId,
            name: trimmedCompany,
            legalName: trimmedCompany,
            ownerId: fbUser.uid,
            email: normalizedEmail,
            standards: INITIAL_COMPANY_STANDARDS,
            settings: INITIAL_COMPANY_SETTINGS,
            createdAt: now,
            updatedAt: now,
          };

          finalProfile = {
            uid: fbUser.uid,
            email: normalizedEmail,
            fullName: trimmedName,
            displayName: trimmedName,
            role: "QUALITY_DIRECTOR",
            companyId: newCompanyId,
            companyName: trimmedCompany,
            projectIds: [],
            projectAccess: {},
            status: "ACTIVE",
            isActive: true,
            createdAt: now,
            updatedAt: now,
          };

          // Atomic batch write satisfies Firestore multi-tenant ownership verification (getAfter company.ownerId == uid)
          const batch = writeBatch(firestore);
          batch.set(
            doc(firestore, "companies", newCompanyId),
            cleanForFirestore(newCompany),
          );
          batch.set(
            doc(firestore, "users", fbUser.uid),
            cleanForFirestore(finalProfile),
          );
          await batch.commit();

          finalCompany = newCompany;
        }

        const safeProfile = sanitizeUserForCache(finalProfile);
        safeSetLocalStorage("jqms_current_user", safeProfile);
        if (finalCompany) {
          safeSetLocalStorage("jqms_current_company", finalCompany);
          if (finalCompany.settings?.themePalette) {
            applyCompanyTheme(finalCompany.settings.themePalette);
          }
        }
        safeRemoveLocalStorage("jqms_tour_done");

        syncLiveCompanySubscription(safeProfile.companyId);

        set({
          currentUser: safeProfile,
          company: finalCompany,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return true;
      } catch (err: any) {
        console.error("Firebase Registration Error:", err);
        const errorMessage = err?.code
          ? err.code.replace("auth/", "").replace(/-/g, " ")
          : err?.message || "Registration failed.";
        set({
          isLoading: false,
          error: errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1),
        });
        return false;
      } finally {
        if (resolveSignUpLock) {
          (resolveSignUpLock as () => void)();
        }
        activeSignUpPromise = null;
      }
    },

    logout: async (reasonMessage?: string) => {
      clearLiveFirestoreAuthListeners();

      try {
        await signOut(auth);
      } catch (e) {
        console.warn("Firebase signOut error:", e);
      }

      try {
        disconnectGoogleAccount();
      } catch {
        // Ignore secondary auth signOut errors
      }

      await clearAllVaultData();

      for (const cleanupFn of logoutCleanupCallbacks) {
        try {
          await cleanupFn();
        } catch (err) {
          console.warn("[JQMS Auth] Logout cleanup callback warning:", err);
        }
      }

      set({
        currentUser: null,
        company: null,
        isAuthenticated: false,
        isLoading: false,
        error: reasonMessage || null,
      });
    },

    refreshUserProfile: async () => {
      const fbUser = auth.currentUser;
      if (!fbUser) return;
      try {
        const profile = await resolveAndSyncUserProfile(fbUser);
        if (isUserSuspended(profile)) {
          await get().logout(
            "Your account has been deactivated by your organization administrator.",
          );
          return;
        }
        const safeProfile = sanitizeUserForCache(profile);
        set({ currentUser: safeProfile });
        safeSetLocalStorage("jqms_current_user", safeProfile);
        syncLiveCompanySubscription(safeProfile.companyId);
      } catch (e) {
        console.warn("refreshUserProfile error:", e);
      }
    },

    initAuthListener: () => {
      singletonListenerRefCount += 1;

      if (!singletonAuthUnsub) {
        const authUnsub = onAuthStateChanged(
          auth,
          async (fbUser: FirebaseUser | null) => {
            if (activeUserSnapshotUnsub) {
              activeUserSnapshotUnsub();
              activeUserSnapshotUnsub = null;
            }

            // Wait for any in-flight signUpWithEmail batch to complete before inspecting Firestore
            if (activeSignUpPromise) {
              try {
                await activeSignUpPromise;
              } catch {
                // Ignore
              }
            }

            // Re-check current user after awaiting sign-up lock (in case unprovisioned sign-up rolled back)
            const effectiveFbUser = auth.currentUser || fbUser;
            if (!fbUser || !effectiveFbUser) {
              clearLiveFirestoreAuthListeners();
              set({
                currentUser: null,
                company: null,
                isAuthenticated: false,
                isLoading: false,
              });
              safeRemoveLocalStorage("jqms_current_user");
              safeRemoveLocalStorage("jqms_current_company");
              return;
            }

            try {
              const initialProfile = await resolveAndSyncUserProfile(effectiveFbUser);

              if (isUserSuspended(initialProfile)) {
                toast.error(
                  "Your account has been deactivated by your organization administrator.",
                );
                await get().logout(
                  "Your account has been deactivated by your organization administrator.",
                );
                return;
              }

              let initialCompany: Company | null = null;
              if (initialProfile.companyId) {
                try {
                  const compSnap = await getDoc(
                    doc(firestore, "companies", initialProfile.companyId),
                  );
                  if (compSnap.exists()) {
                    initialCompany = sanitizeCompanyForCache({
                      ...(compSnap.data() as Company),
                      id: compSnap.id,
                    });
                  }
                } catch (e) {
                  console.debug("Initial company fetch skipped:", e);
                }
              }

              const safeInitial = sanitizeUserForCache(initialProfile);
              set({
                currentUser: safeInitial,
                company: initialCompany || get().company,
                isAuthenticated: true,
                isLoading: false,
              });
              safeSetLocalStorage("jqms_current_user", safeInitial);
              if (initialCompany) {
                safeSetLocalStorage("jqms_current_company", initialCompany);
                if (initialCompany.settings?.themePalette) {
                  applyCompanyTheme(initialCompany.settings.themePalette);
                }
              }
              syncLiveCompanySubscription(safeInitial.companyId);

              const userDocRef = doc(firestore, "users", effectiveFbUser.uid);
              activeUserSnapshotUnsub = onSnapshot(
                userDocRef,
                async (snap) => {
                  if (snap.exists()) {
                    const liveProfile = sanitizeUserForCache({
                      ...(snap.data() as UserProfile),
                      uid: snap.id,
                    });

                    if (isUserSuspended(liveProfile)) {
                      toast.error(
                        "Your account access has been revoked by your administrator.",
                      );
                      await get().logout(
                        "Your account access has been revoked by your administrator.",
                      );
                      return;
                    }

                    set({
                      currentUser: liveProfile,
                      isAuthenticated: true,
                      isLoading: false,
                    });
                    safeSetLocalStorage("jqms_current_user", liveProfile);
                    syncLiveCompanySubscription(liveProfile.companyId);
                  }
                },
                (err) => {
                  console.warn("Firestore onSnapshot user listener error:", err);
                  set({ isLoading: false });
                },
              );
            } catch (e) {
              console.warn("Firestore onAuthStateChanged error:", e);
              set({ isLoading: false });
            }
          },
        );

        singletonAuthUnsub = () => {
          clearLiveFirestoreAuthListeners();
          authUnsub();
        };
      }

      let released = false;
      return () => {
        if (released) return;
        released = true;
        singletonListenerRefCount = Math.max(0, singletonListenerRefCount - 1);
        if (singletonListenerRefCount === 0 && singletonAuthUnsub) {
          singletonAuthUnsub();
          singletonAuthUnsub = null;
        }
      };
    },
  };
});
