import type { HandlerEvent, HandlerResponse } from "@netlify/functions";
import crypto from "node:crypto";
import dns from "node:dns/promises";
import net from "node:net";

export interface VerifiedFirebaseUser {
  uid: string;
  email?: string;
  emailVerified: boolean;
  claims: Record<string, unknown>;
}

const GOOGLE_SECURETOKEN_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

let cachedCerts: Record<string, string> | null = null;
let cachedCertsExpiresAt = 0;

const ALLOWED_SMTP_PORTS = new Set([25, 465, 587, 2525]);

// Sliding-window rate limit buckets across warm lambda invocations
const rateLimitBuckets = new Map<string, number[]>();

function getFirebaseProjectId(): string {
  return (process.env.FIREBASE_PROJECT_ID || "benchmark-jescode-2e842").trim();
}

function getAllowedOrigins(): Set<string> {
  const origins = new Set<string>([
    "https://jayqms.netlify.app",
    `https://${getFirebaseProjectId()}.web.app`,
    `https://${getFirebaseProjectId()}.firebaseapp.com`,
  ]);

  for (const envVar of [
    process.env.URL,
    process.env.DEPLOY_PRIME_URL,
    process.env.DEPLOY_URL,
  ]) {
    if (envVar && envVar.trim()) {
      try {
        origins.add(new URL(envVar.trim()).origin);
      } catch {
        // Ignore malformed URL env
      }
    }
  }

  if (process.env.ALLOWED_ORIGINS) {
    for (const raw of process.env.ALLOWED_ORIGINS.split(",")) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      try {
        origins.add(new URL(trimmed).origin);
      } catch {
        origins.add(trimmed.replace(/\/+$/, ""));
      }
    }
  }

  // Allow localhost origins for local development / netlify dev
  if (
    process.env.NETLIFY_DEV === "true" ||
    process.env.NODE_ENV !== "production"
  ) {
    origins.add("http://localhost:3000");
    origins.add("http://localhost:5173");
    origins.add("http://localhost:8888");
    origins.add("http://127.0.0.1:3000");
    origins.add("http://127.0.0.1:5173");
    origins.add("http://127.0.0.1:8888");
  }

  return origins;
}

export function getRequestOrigin(event: HandlerEvent): string {
  return (event.headers?.origin || event.headers?.Origin || "").trim();
}

export function isOriginAllowed(event: HandlerEvent): boolean {
  const origin = getRequestOrigin(event);
  if (!origin) {
    // Same-origin fetch calls from some browsers omit Origin on non-CORS or server calls
    return true;
  }
  const allowed = getAllowedOrigins();
  if (allowed.has(origin)) return true;

  // Also permit localhost when host header itself is localhost
  const host = (event.headers?.host || event.headers?.Host || "").toLowerCase();
  if (
    (host.startsWith("localhost:") || host.startsWith("127.0.0.1:")) &&
    (origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:"))
  ) {
    return true;
  }

  return false;
}

export function buildCorsHeaders(
  event: HandlerEvent,
  methods = "POST, OPTIONS",
): Record<string, string> {
  const origin = getRequestOrigin(event);
  const allowed = getAllowedOrigins();
  let resolvedOrigin = "https://jayqms.netlify.app";

  if (origin && isOriginAllowed(event)) {
    resolvedOrigin = origin;
  } else if (process.env.URL) {
    try {
      resolvedOrigin = new URL(process.env.URL).origin;
    } catch {
      // keep default
    }
  } else if (allowed.size > 0) {
    resolvedOrigin = Array.from(allowed)[0];
  }

  return {
    "Access-Control-Allow-Origin": resolvedOrigin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": methods,
    Vary: "Origin",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  };
}

export function jsonResponse(
  event: HandlerEvent,
  statusCode: number,
  payload: Record<string, unknown>,
  methods = "POST, OPTIONS",
): HandlerResponse {
  return {
    statusCode,
    headers: buildCorsHeaders(event, methods),
    body: JSON.stringify(payload),
  };
}

function decodeBase64Url(segment: string): Buffer {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(normalized + "=".repeat(padLen), "base64");
}

async function getGooglePublicCerts(
  forceRefresh = false,
): Promise<Record<string, string>> {
  const now = Date.now();
  if (!forceRefresh && cachedCerts && now < cachedCertsExpiresAt) {
    return cachedCerts;
  }

  const res = await fetch(GOOGLE_SECURETOKEN_CERTS_URL);
  if (!res.ok) {
    throw new Error(`Unable to fetch Google JWT public keys (${res.status}).`);
  }

  const cacheControl = res.headers.get("cache-control") || "";
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSec = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;

  const certs = (await res.json()) as Record<string, string>;
  cachedCerts = certs;
  cachedCertsExpiresAt = now + Math.max(60, maxAgeSec - 60) * 1000;
  return certs;
}

/**
 * Cryptographically verifies a Firebase Auth ID token (RS256) against Google's X.509 keys.
 */
export async function verifyFirebaseRequest(
  event: HandlerEvent,
): Promise<VerifiedFirebaseUser> {
  if (!isOriginAllowed(event)) {
    throw new HttpSecurityError(403, "Origin not permitted.");
  }

  const authHeader =
    event.headers?.authorization || event.headers?.Authorization || "";
  const match = authHeader.match(/^Bearer\s+([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)$/i);
  if (!match) {
    throw new HttpSecurityError(
      401,
      "Missing or malformed Authorization Bearer token.",
    );
  }

  const token = match[1];
  const [rawHeader, rawPayload, rawSignature] = token.split(".");

  let header: { alg?: string; kid?: string };
  let payload: Record<string, any>;
  try {
    header = JSON.parse(decodeBase64Url(rawHeader).toString("utf8"));
    payload = JSON.parse(decodeBase64Url(rawPayload).toString("utf8"));
  } catch {
    throw new HttpSecurityError(401, "Invalid JWT encoding.");
  }

  if (header.alg !== "RS256" || !header.kid) {
    throw new HttpSecurityError(401, "Unsupported JWT signature algorithm.");
  }

  const projectId = getFirebaseProjectId();
  const expectedIssuer = `https://securetoken.google.com/${projectId}`;
  const nowSec = Math.floor(Date.now() / 1000);

  if (payload.aud !== projectId) {
    throw new HttpSecurityError(401, "Invalid token audience.");
  }
  if (payload.iss !== expectedIssuer) {
    throw new HttpSecurityError(401, "Invalid token issuer.");
  }
  if (
    typeof payload.sub !== "string" ||
    payload.sub.length === 0 ||
    payload.sub.length > 128
  ) {
    throw new HttpSecurityError(401, "Invalid token subject.");
  }
  if (typeof payload.exp !== "number" || nowSec >= payload.exp) {
    throw new HttpSecurityError(401, "Authentication token has expired.");
  }
  if (typeof payload.iat !== "number" || payload.iat > nowSec + 60) {
    throw new HttpSecurityError(401, "Invalid token issued-at timestamp.");
  }

  let certs = await getGooglePublicCerts(false);
  let certPem = certs[header.kid];
  if (!certPem) {
    certs = await getGooglePublicCerts(true);
    certPem = certs[header.kid];
  }
  if (!certPem) {
    throw new HttpSecurityError(401, "Signing key not recognized.");
  }

  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(`${rawHeader}.${rawPayload}`);
  verifier.end();

  const signatureBuffer = decodeBase64Url(rawSignature);
  const isValid = verifier.verify(certPem, signatureBuffer);
  if (!isValid) {
    throw new HttpSecurityError(401, "Invalid token cryptographic signature.");
  }

  return {
    uid: payload.sub,
    email: typeof payload.email === "string" ? payload.email : undefined,
    emailVerified: Boolean(payload.email_verified),
    claims: payload,
  };
}

export class HttpSecurityError extends Error {
  public readonly statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "HttpSecurityError";
    this.statusCode = statusCode;
  }
}

export function assertBodySize(event: HandlerEvent, maxBytes: number): void {
  if (!event.body) return;
  const byteLength = Buffer.byteLength(
    event.body,
    event.isBase64Encoded ? "base64" : "utf8",
  );
  if (byteLength > maxBytes) {
    throw new HttpSecurityError(
      413,
      `Request payload exceeds maximum allowed size (${Math.round(maxBytes / 1024)} KB).`,
    );
  }
}

export function checkRateLimit(
  scope: string,
  identifier: string,
  maxRequests: number,
  windowMs: number,
): void {
  const now = Date.now();
  const key = `${scope}:${identifier}`;
  const existing = rateLimitBuckets.get(key) || [];
  const active = existing.filter((ts) => now - ts < windowMs);

  if (active.length >= maxRequests) {
    throw new HttpSecurityError(
      429,
      "Rate limit exceeded. Please wait a moment before retrying.",
    );
  }

  active.push(now);
  rateLimitBuckets.set(key, active);

  // Periodic bucket cleanup to bound memory
  if (rateLimitBuckets.size > 1000) {
    for (const [k, timestamps] of rateLimitBuckets.entries()) {
      const fresh = timestamps.filter((ts) => now - ts < windowMs);
      if (fresh.length === 0) {
        rateLimitBuckets.delete(k);
      } else {
        rateLimitBuckets.set(k, fresh);
      }
    }
  }
}

function isPrivateOrReservedIPv4(ip: string): boolean {
  const parts = ip.split(".").map((n) => Number(n));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true; // 0.0.0.0/8, 10.0.0.0/8, 127.0.0.0/8
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 cloud metadata & link-local
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmark
  if (a >= 224) return true; // multicast & reserved
  return false;
}

function isPrivateOrReservedIP(ip: string): boolean {
  const normalized = ip.trim().toLowerCase();
  const version = net.isIP(normalized);
  if (version === 4) {
    return isPrivateOrReservedIPv4(normalized);
  }
  if (version === 6) {
    if (normalized === "::1" || normalized === "::") return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // fc00::/7 ULA
    if (
      normalized.startsWith("fe8") ||
      normalized.startsWith("fe9") ||
      normalized.startsWith("fea") ||
      normalized.startsWith("feb")
    ) {
      return true; // fe80::/10 link-local
    }
    if (normalized.startsWith("::ffff:")) {
      const mappedV4 = normalized.slice("::ffff:".length);
      if (net.isIP(mappedV4) === 4) {
        return isPrivateOrReservedIPv4(mappedV4);
      }
    }
    return false;
  }
  return true;
}

/**
 * Validates that an outbound SMTP host & port cannot be abused for SSRF against
 * localhost, RFC1918 internal networks, or cloud metadata endpoints.
 */
export async function validateSafeSmtpEndpoint(
  rawHost: string,
  rawPort: number,
): Promise<{ host: string; port: number }> {
  const host = rawHost.trim().toLowerCase();
  const port = Number(rawPort);

  if (!ALLOWED_SMTP_PORTS.has(port)) {
    throw new HttpSecurityError(
      400,
      `Invalid SMTP port (${rawPort}). Allowed SMTP ports are 25, 465, 587, or 2525.`,
    );
  }

  if (
    !host ||
    host.length > 253 ||
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /[\s/@\\]/.test(host)
  ) {
    throw new HttpSecurityError(400, "Invalid or restricted SMTP hostname.");
  }

  if (net.isIP(host) !== 0) {
    if (isPrivateOrReservedIP(host)) {
      throw new HttpSecurityError(
        400,
        "Private, loopback, or reserved IP addresses are not permitted for SMTP.",
      );
    }
    return { host, port };
  }

  let resolved: Array<{ address: string; family: number }>;
  try {
    resolved = await dns.lookup(host, { all: true, verbatim: true });
  } catch {
    throw new HttpSecurityError(
      400,
      `Unable to resolve SMTP hostname "${host}".`,
    );
  }

  if (!resolved || resolved.length === 0) {
    throw new HttpSecurityError(
      400,
      `No DNS records found for SMTP hostname "${host}".`,
    );
  }

  for (const record of resolved) {
    if (isPrivateOrReservedIP(record.address)) {
      throw new HttpSecurityError(
        400,
        "SMTP hostname resolves to a restricted internal or loopback IP address.",
      );
    }
  }

  return { host, port };
}

const ENCRYPTED_PREFIX = "enc:v1:";

function getEncryptionKeyBuffer(): Buffer {
  const rawKey = (
    process.env.SMTP_ENCRYPTION_KEY ||
    "jqms-enterprise-benchmark-jescode-2e842-aes256gcm-key"
  ).trim();
  return crypto.createHash("sha256").update(rawKey, "utf8").digest();
}

/**
 * Encrypts a secret with AES-256-GCM bound to the owner's Firebase UID (`aad`).
 */
export function encryptSecret(plaintext: string, ownerUid: string): string {
  if (plaintext.startsWith(ENCRYPTED_PREFIX)) {
    return plaintext;
  }
  const key = getEncryptionKeyBuffer();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(ownerUid, "utf8"));

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${ENCRYPTED_PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function isEncryptedSecret(value?: string | null): boolean {
  return typeof value === "string" && value.startsWith(ENCRYPTED_PREFIX);
}

/**
 * Decrypts an `enc:v1:...` token bound to `ownerUid`.
 */
export function decryptSecret(ciphertext: string, ownerUid: string): string {
  if (!ciphertext.startsWith(ENCRYPTED_PREFIX)) {
    throw new HttpSecurityError(
      400,
      "Unencrypted SMTP credentials are not accepted. Re-save your SMTP password in Profile Settings to encrypt it.",
    );
  }
  const parts = ciphertext.slice(ENCRYPTED_PREFIX.length).split(".");
  if (parts.length !== 3) {
    throw new HttpSecurityError(400, "Malformed encrypted credential token.");
  }

  try {
    const key = getEncryptionKeyBuffer();
    const iv = Buffer.from(parts[0], "base64url");
    const tag = Buffer.from(parts[1], "base64url");
    const data = Buffer.from(parts[2], "base64url");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAAD(Buffer.from(ownerUid, "utf8"));
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    throw new HttpSecurityError(
      400,
      "Failed to decrypt stored SMTP password. Please re-enter and save your SMTP password in Profile Settings.",
    );
  }
}
