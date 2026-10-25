import type { Handler, HandlerEvent } from "@netlify/functions";
import crypto from "node:crypto";
import {
  assertBodySize,
  buildCorsHeaders,
  checkRateLimit,
  HttpSecurityError,
  isOriginAllowed,
  jsonResponse,
  verifyFirebaseRequest,
} from "./_security";

interface SignCloudinaryRequest {
  companyId?: string;
  projectId?: string;
  category?: string;
  mimeType?: string;
  bytes?: number;
}

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB hard ceiling

const ALLOWED_CATEGORIES = new Set([
  "photos",
  "documents",
  "avatars",
  "logos",
  "chat",
  "signatures",
  "snapshots",
  "voice",
]);

function isAllowedMimeType(mime: string): boolean {
  const normalized = mime.trim().toLowerCase();
  if (!normalized) return false;
  if (
    normalized.startsWith("image/") &&
    normalized !== "image/svg+xml" // Prevent stored XSS via uploaded SVG scripts on shared CDN
  ) {
    return true;
  }
  if (normalized.startsWith("audio/")) {
    return true;
  }
  const allowedExact = new Set([
    "application/pdf",
    "text/csv",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip",
    "application/acad",
    "image/vnd.dwg",
    "application/dxf",
  ]);
  return allowedExact.has(normalized);
}

function sanitizeSegment(raw: string, fallback: string): string {
  const cleaned = raw
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "_")
    .slice(0, 64);
  return cleaned || fallback;
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === "OPTIONS") {
    if (!isOriginAllowed(event)) {
      return jsonResponse(event, 403, { error: "Origin not permitted." });
    }
    return {
      statusCode: 200,
      headers: buildCorsHeaders(event),
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(event, 405, { error: "Method Not Allowed. Use POST." });
  }

  try {
    assertBodySize(event, 16 * 1024);
    const verifiedUser = await verifyFirebaseRequest(event);
    checkRateLimit("sign-cloudinary", verifiedUser.uid, 60, 60_000);

    const payload: SignCloudinaryRequest = JSON.parse(event.body || "{}");
    const mimeType = (payload.mimeType || "application/octet-stream").trim();
    const bytes = Number(payload.bytes || 0);

    if (bytes < 0 || bytes > MAX_UPLOAD_BYTES) {
      return jsonResponse(event, 413, {
        error: "File exceeds maximum allowed upload size of 25 MB.",
      });
    }

    if (!isAllowedMimeType(mimeType)) {
      return jsonResponse(event, 400, {
        error: `Unsupported or restricted file type (${mimeType}).`,
      });
    }

    const safeCompanyId = sanitizeSegment(payload.companyId || "", "");
    if (!safeCompanyId) {
      return jsonResponse(event, 400, {
        error: "Tenant companyId is required for media uploads.",
      });
    }

    const safeProjectId = sanitizeSegment(payload.projectId || "company", "company");
    const rawCat = (payload.category || "photos").trim().toLowerCase();
    const safeCategory = ALLOWED_CATEGORIES.has(rawCat) ? rawCat : "documents";

    const cloudName = (
      process.env.CLOUDINARY_CLOUD_NAME || "dpcnanmjl"
    ).trim();
    const apiKey = (process.env.CLOUDINARY_API_KEY || "").trim();
    const apiSecret = (process.env.CLOUDINARY_API_SECRET || "").trim();

    if (!cloudName || !apiKey || !apiSecret) {
      return jsonResponse(event, 503, {
        configured: false,
        fallback: "firebase_storage",
        reason:
          "Cloudinary server signing credentials (CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET) are not configured; falling back to Firebase Cloud Storage.",
      });
    }

    const folder = `jqms/${safeCompanyId}/${safeProjectId}/${safeCategory}`;
    const timestamp = Math.floor(Date.now() / 1000);

    // Cloudinary parameter signature: alphabetical key=value joined by '&' + apiSecret
    const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto
      .createHash("sha1")
      .update(stringToSign, "utf8")
      .digest("hex");

    const isImage = mimeType.startsWith("image/");
    const resourceType = isImage ? "image" : "auto";

    return jsonResponse(event, 200, {
      configured: true,
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature,
      resourceType,
    });
  } catch (error: any) {
    if (error instanceof HttpSecurityError) {
      return jsonResponse(event, error.statusCode, { error: error.message });
    }
    console.error("sign-cloudinary error:", error);
    return jsonResponse(event, 500, {
      error: "Failed to generate upload signature.",
    });
  }
};
