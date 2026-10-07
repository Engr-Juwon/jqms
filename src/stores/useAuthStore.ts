import { create } from "zustand";
import { UserProfile, UserRole, Company } from "@/types";
import { auth, firestore } from "@/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";

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
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  initAuthListener: () => () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  return {
    currentUser: null,
    company: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    setUser: (user) => {
      if (user) {
        localStorage.setItem("jqms_current_user", JSON.stringify(user));
      } else {
        localStorage.removeItem("jqms_current_user");
      }
      set({ currentUser: user, isAuthenticated: !!user, isLoading: false });
    },

    setCompany: (company) => {
      if (company) {
        localStorage.setItem("jqms_current_company", JSON.stringify(company));
      } else {
        localStorage.removeItem("jqms_current_company");
      }
      set({ company });
    },

    loginWithEmail: async (email: string, pass: string) => {
      set({ isLoading: true, error: null });
      try {
        // 1. Authenticate with real Firebase Authentication
        const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
        const fbUser = cred.user;

        // 2. Fetch User Profile Document from Cloud Firestore
        const userDocRef = doc(firestore, "users", fbUser.uid);
        const userSnap = await getDoc(userDocRef);

        let profile: UserProfile;

        if (userSnap.exists()) {
          profile = userSnap.data() as UserProfile;
        } else {
          // If first-time authenticated user without firestore doc yet, create record
          profile = {
            uid: fbUser.uid,
            email: fbUser.email || email,
            fullName: fbUser.displayName || email.split("@")[0],
            displayName: fbUser.displayName || email.split("@")[0],
            role: "QAQC_ENGINEER",
            companyId: "",
            companyName: "",
            status: "ACTIVE",
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          await setDoc(userDocRef, profile);
        }

        // 3. Fetch Company Document from Cloud Firestore if assigned
        let compObj: Company | null = null;
        if (profile.companyId) {
          try {
            const compSnap = await getDoc(
              doc(firestore, "companies", profile.companyId),
            );
            if (compSnap.exists()) {
              compObj = { ...compSnap.data(), id: compSnap.id } as Company;
            }
          } catch (e) {
            console.warn("Company fetch warning:", e);
          }
        }

        if (profile) {
          localStorage.setItem("jqms_current_user", JSON.stringify(profile));
        }
        if (compObj) {
          localStorage.setItem("jqms_current_company", JSON.stringify(compObj));
        }

        set({
          currentUser: profile,
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
      role: UserRole = "QAQC_ENGINEER",
      companyName: string = "",
    ) => {
      set({ isLoading: true, error: null });
      try {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          pass,
        );
        const fbUser = cred.user;

        const newProfile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || email,
          fullName,
          displayName: fullName,
          role,
          companyId: "",
          companyName,
          status: "ACTIVE",
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        await setDoc(doc(firestore, "users", fbUser.uid), newProfile);

        localStorage.setItem("jqms_current_user", JSON.stringify(newProfile));
        // Clear tour flag so the onboarding tour auto-fires on first dashboard visit
        localStorage.removeItem("jqms_tour_done");

        set({
          currentUser: newProfile,
          company: null,
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
      }
    },

    logout: async () => {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn("Firebase signOut error:", e);
      }
      localStorage.removeItem("jqms_current_user");
      localStorage.removeItem("jqms_current_company");
      set({
        currentUser: null,
        company: null,
        isAuthenticated: false,
        isLoading: false,
      });
    },

    refreshUserProfile: async () => {
      const fbUser = auth.currentUser;
      if (!fbUser) return;
      try {
        const snap = await getDoc(doc(firestore, "users", fbUser.uid));
        if (snap.exists()) {
          const profile = { ...snap.data(), uid: snap.id } as UserProfile;
          set({ currentUser: profile });
          localStorage.setItem("jqms_current_user", JSON.stringify(profile));
        }
      } catch (e) {
        console.warn("refreshUserProfile error:", e);
      }
    },

    initAuthListener: () => {
      let activeUserUnsub: Unsubscribe | null = null;

      const authUnsub = onAuthStateChanged(
        auth,
        async (fbUser: FirebaseUser | null) => {
          if (activeUserUnsub) {
            activeUserUnsub();
            activeUserUnsub = null;
          }

          if (fbUser) {
            try {
              const userDocRef = doc(firestore, "users", fbUser.uid);
              // Real-time snapshot listener on the user's profile
              activeUserUnsub = onSnapshot(
                userDocRef,
                async (snap) => {
                  if (snap.exists()) {
                    const profile = {
                      ...snap.data(),
                      uid: snap.id,
                    } as UserProfile;
                    set({
                      currentUser: profile,
                      isAuthenticated: true,
                      isLoading: false,
                    });
                    localStorage.setItem(
                      "jqms_current_user",
                      JSON.stringify(profile),
                    );

                    if (profile.companyId) {
                      try {
                        const compSnap = await getDoc(
                          doc(firestore, "companies", profile.companyId),
                        );
                        if (compSnap.exists()) {
                          const compObj = {
                            ...compSnap.data(),
                            id: compSnap.id,
                          } as Company;
                          set({ company: compObj });
                          localStorage.setItem(
                            "jqms_current_company",
                            JSON.stringify(compObj),
                          );
                        }
                      } catch (e) {
                        console.warn("Company fetch warning:", e);
                      }
                    }
                  } else {
                    // Fallback for new authenticated account without a Firestore record
                    const fallbackProfile: UserProfile = {
                      uid: fbUser.uid,
                      email: fbUser.email || "",
                      fullName:
                        fbUser.displayName ||
                        fbUser.email?.split("@")[0] ||
                        "User",
                      displayName:
                        fbUser.displayName ||
                        fbUser.email?.split("@")[0] ||
                        "User",
                      role: "QAQC_ENGINEER",
                      companyId: "",
                      status: "ACTIVE",
                      isActive: true,
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                    };
                    try {
                      await setDoc(userDocRef, fallbackProfile);
                    } catch (e) {
                      console.warn(
                        "Failed to auto-create user profile doc:",
                        e,
                      );
                    }
                    set({
                      currentUser: fallbackProfile,
                      isAuthenticated: true,
                      isLoading: false,
                    });
                    localStorage.setItem(
                      "jqms_current_user",
                      JSON.stringify(fallbackProfile),
                    );
                  }
                },
                (err) => {
                  console.warn(
                    "Firestore onSnapshot user listener error:",
                    err,
                  );
                  set({ isLoading: false });
                },
              );
            } catch (e) {
              console.warn("Firestore onAuthStateChanged error:", e);
              set({ isLoading: false });
            }
          } else {
            set({
              currentUser: null,
              company: null,
              isAuthenticated: false,
              isLoading: false,
            });
            localStorage.removeItem("jqms_current_user");
            localStorage.removeItem("jqms_current_company");
          }
        },
      );

      return () => {
        if (activeUserUnsub) {
          activeUserUnsub();
          activeUserUnsub = null;
        }
        authUnsub();
      };
    },
  };
});
