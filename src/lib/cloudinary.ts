import imageCompression from "browser-image-compression";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from "@/firebase";

/**
 * Default Cloudinary public cloud identifier (used only for read/transform URLs;
 * all uploads go through server-signed /api/sign-cloudinary or Firebase Storage backup).
 */
export const CLOUD_NAME = "dpcnanmjl";

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  originalFilename?: string;
  resourceType?: string;
  provider?: "cloudinary" | "firebase_storage";
}

export interface UploadMediaOptions {
  companyId?: string;
  projectId?: string;
  category?:
    | "photos"
    | "documents"
    | "avatars"
    | "logos"
    | "chat"
    | "signatures"
    | "snapshots"
    | "voice";
  folder?: string;
  filename?: string;
  skipCompression?: boolean;
  preserveAlpha?: boolean;
  maxBytes?: number;
}

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB hard limit

function getActiveContextIds(options?: UploadMediaOptions): {
  companyId: string;
  projectId: string;
  category: NonNullable<UploadMediaOptions["category"]>;
} {
  let companyId = options?.companyId || "";
  let projectId = options?.projectId || "";

  // Read active project store if registered globally without introducing circular imports
  if (typeof window !== "undefined") {
    try {
      const projStore = (window as any).__JQMS_PROJECT_STORE__;
      if (!projectId && projStore?.getState) {
        projectId = projStore.getState()?.activeProject?.id || "";
      }
      if (!companyId && projStore?.getState) {
        companyId = projStore.getState()?.activeProject?.companyId || "";
      }
    } catch {
      // ignore
    }
    if (!companyId) {
      try {
        const cachedUserRaw = localStorage.getItem("jqms_current_user");
        if (cachedUserRaw) {
          const parsed = JSON.parse(cachedUserRaw);
          if (parsed?.companyId) companyId = String(parsed.companyId);
        }
      } catch {
        // ignore
      }
    }
  }

  // Extract category from legacy folder strings like "jqms/photos" or "jqms/documents"
  let category: NonNullable<UploadMediaOptions["category"]> =
    options?.category || "photos";
  if (!options?.category && options?.folder) {
    const f = options.folder.toLowerCase();
    if (f.includes("avatar")) category = "avatars";
    else if (f.includes("logo")) category = "logos";
    else if (f.includes("chat")) category = "chat";
    else if (f.includes("voice")) category = "voice";
    else if (f.includes("sign")) category = "signatures";
    else if (f.includes("snap")) category = "snapshots";
    else if (f.includes("doc")) category = "documents";
  }

  return {
    companyId: companyId || auth.currentUser?.uid || "tenant",
    projectId: projectId || "company",
    category,
  };
}

/**
 * Converts a base64 `data:...;base64,...` string into a browser `File` object.
 */
export function dataUrlToFile(
  dataUrl: string,
  defaultFilename = "asset.png",
): File {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid data URL format.");
  }
  const mimeType = match[1];
  const base64Data = match[2];
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], defaultFilename, { type: mimeType });
}

function normalizeInputToFile(
  input: File | Blob | string,
  filename?: string,
): File {
  if (typeof input === "string") {
    return dataUrlToFile(input, filename || `upload-${Date.now()}.png`);
  }
  if (input instanceof File) {
    return input;
  }
  const ext = (input.type.split("/")[1] || "bin").replace(/[^a-z0-9]/gi, "");
  return new File(
    [input],
    filename || `upload-${Date.now()}.${ext}`,
    { type: input.type || "application/octet-stream" },
  );
}

/**
 * Compresses an image file client-side before cloud upload while preserving PNG transparency when needed.
 */
export async function compressFile(
  file: File,
  preserveAlpha = false,
): Promise<File> {
  if (!file.type || !file.type.startsWith("image/")) {
    return file;
  }

  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    return file;
  }

  const keepPng = preserveAlpha || file.type === "image/png";

  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: keepPng ? "image/png" : "image/jpeg",
  };

  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.warn(
      "Image compression failed, proceeding with original file:",
      error,
    );
    return file;
  }
}

async function uploadToFirebaseStorageBackup(
  file: File,
  companyId: string,
  projectId: string,
  category: string,
): Promise<UploadResult> {
  const safeCompany = companyId.replace(/[^A-Za-z0-9_-]/g, "_") || "tenant";
  const safeProject = projectId.replace(/[^A-Za-z0-9_-]/g, "_") || "company";
  const safeCategory = category.replace(/[^A-Za-z0-9_-]/g, "_") || "assets";
  const safeName = (file.name || "asset")
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .slice(-80);
  const randomSuffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  const objectPath = `companies/${safeCompany}/projects/${safeProject}/${safeCategory}/${Date.now()}_${randomSuffix}_${safeName}`;
  const fileRef = storageRef(storage, objectPath);
  const snap = await uploadBytes(fileRef, file, {
    contentType: file.type || "application/octet-stream",
  });
  const downloadUrl = await getDownloadURL(snap.ref);

  return {
    url: downloadUrl,
    publicId: objectPath,
    bytes: file.size,
    format: file.name.split(".").pop(),
    originalFilename: file.name,
    resourceType: file.type.startsWith("image/") ? "image" : "raw",
    provider: "firebase_storage",
  };
}

/**
 * Unified secure media upload pipeline:
 * 1. Validates size & normalizes `File | Blob | dataURL`.
 * 2. Requests a short-lived server-generated signature from `/api/sign-cloudinary`.
 * 3. Uploads directly to Cloudinary with tenant-scoped folder isolation.
 * 4. Automatically falls back to Firebase Cloud Storage (`storage.rules` protected) if
 *    Cloudinary server signing secrets are unconfigured or unreachable.
 */
export async function uploadMediaAsset(
  input: File | Blob | string,
  options?: UploadMediaOptions,
): Promise<UploadResult> {
  // If already a remote HTTPS URL, return as-is without re-uploading
  if (typeof input === "string" && /^https?:\/\//i.test(input.trim())) {
    return {
      url: input.trim(),
      publicId: input.trim(),
    };
  }

  let file = normalizeInputToFile(input, options?.filename);
  const maxBytes = options?.maxBytes || MAX_UPLOAD_BYTES;
  if (file.size > maxBytes) {
    throw new Error(
      `File "${file.name}" exceeds maximum allowed size (${Math.round(maxBytes / (1024 * 1024))} MB).`,
    );
  }

  const { companyId, projectId, category } = getActiveContextIds(options);
  const preserveAlpha =
    options?.preserveAlpha ||
    category === "logos" ||
    category === "signatures";

  if (!options?.skipCompression && file.type.startsWith("image/")) {
    file = await compressFile(file, preserveAlpha);
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("You must be signed in to upload media files.");
  }

  const idToken = await currentUser.getIdToken();

  // Attempt authenticated server-signed Cloudinary upload first
  const signEndpoints = [
    "/api/sign-cloudinary",
    "/.netlify/functions/sign-cloudinary",
  ];

  for (const endpoint of signEndpoints) {
    try {
      const signRes = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          companyId,
          projectId,
          category,
          mimeType: file.type || "application/octet-stream",
          bytes: file.size,
        }),
      });

      const contentType = signRes.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        continue;
      }

      const signData = await signRes.json();
      if (signRes.status === 503 && signData?.fallback === "firebase_storage") {
        break;
      }
      if (!signRes.ok) {
        if (signRes.status === 400 || signRes.status === 413) {
          throw new Error(signData?.error || "Upload rejected by security policy.");
        }
        break;
      }

      if (signData?.configured && signData?.signature) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", String(signData.apiKey));
        formData.append("timestamp", String(signData.timestamp));
        formData.append("folder", String(signData.folder));
        formData.append("signature", String(signData.signature));

        const resourceType = signData.resourceType || "auto";
        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${signData.cloudName}/${resourceType}/upload`,
          {
            method: "POST",
            body: formData,
          },
        );

        if (uploadRes.ok) {
          const data = await uploadRes.json();
          return {
            url: data.secure_url || data.url,
            publicId: data.public_id,
            width: data.width,
            height: data.height,
            format: data.format,
            bytes: data.bytes,
            originalFilename: data.original_filename || file.name,
            resourceType: data.resource_type || resourceType,
            provider: "cloudinary",
          };
        }
      }
      break;
    } catch (err: any) {
      if (
        err?.message?.includes("Upload rejected") ||
        err?.message?.includes("Unsupported or restricted") ||
        err?.message?.includes("maximum allowed")
      ) {
        throw err;
      }
      // Otherwise fall through to Firebase Storage backup
    }
  }

  // Automatic backup: Firebase Cloud Storage under tenant-scoped path
  return uploadToFirebaseStorageBackup(file, companyId, projectId, category);
}

/**
 * Uploads an image with automatic client-side compression via signed Cloudinary / Firebase Storage backup.
 */
export async function uploadImage(
  file: File,
  folder = "jqms/photos",
): Promise<UploadResult> {
  return uploadMediaAsset(file, { folder });
}

/**
 * Uploads a document (PDF, Excel, CAD, Image, Audio, etc.) via signed Cloudinary / Firebase Storage backup.
 */
export async function uploadDocument(
  file: File,
  folder = "jqms/documents",
): Promise<UploadResult> {
  return uploadMediaAsset(file, { folder, category: "documents" });
}

/**
 * Upload multiple image files concurrently.
 */
export async function uploadMultiple(
  files: File[],
  folder = "jqms/photos",
): Promise<UploadResult[]> {
  return Promise.all(files.map((f) => uploadImage(f, folder)));
}

/**
 * Upload multiple documents concurrently.
 */
export async function uploadMultipleDocuments(
  files: File[],
  folder = "jqms/documents",
): Promise<UploadResult[]> {
  return Promise.all(files.map((f) => uploadDocument(f, folder)));
}

/**
 * Returns a high-performance resized thumbnail URL from Cloudinary (or original URL for Firebase Storage).
 */
export function getThumbnail(url: any, size = 200): string {
  if (!url) return "";
  const actualUrl =
    typeof url === "string"
      ? url
      : url?.url || url?.thumbnailUrl || url?.secure_url || "";
  if (!actualUrl || typeof actualUrl !== "string") return "";
  if (!actualUrl.includes("cloudinary.com")) return actualUrl;
  return actualUrl.replace(
    "/upload/",
    `/upload/w_${size},h_${size},c_fill,q_auto,f_auto/`,
  );
}

/**
 * Returns an optimized width URL from Cloudinary with auto format and compression.
 */
export function getOptimized(url: any, width = 800): string {
  if (!url) return "";
  const actualUrl =
    typeof url === "string"
      ? url
      : url?.url || url?.optimizedUrl || url?.secure_url || "";
  if (!actualUrl || typeof actualUrl !== "string") return "";
  if (!actualUrl.includes("cloudinary.com")) return actualUrl;
  return actualUrl.replace(
    "/upload/",
    `/upload/w_${width},q_auto,f_auto/`,
  );
}
