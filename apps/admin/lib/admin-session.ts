import crypto from "node:crypto";

export const ADMIN_SESSION_COOKIE = "admin_session";
export const WEEK_IN_SECONDS = 60 * 60 * 24 * 7;

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET ?? "luyaji-admin-session-secret";

export type SessionPayload = {
  userId: string;
  issuedAt: number;
};

function sign(encodedPayload: string) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(encodedPayload).digest("hex");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }
  try {
    const aBuffer = Buffer.from(a, "hex");
    const bBuffer = Buffer.from(b, "hex");
    if (aBuffer.length !== bBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(aBuffer, bBuffer);
  } catch {
    return false;
  }
}

export function encodeAdminSession(userId: string): string {
  const payload: SessionPayload = { userId, issuedAt: Date.now() };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function decodeAdminSession(token?: string | null): SessionPayload | null {
  if (!token) {
    return null;
  }
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }
  const expectedSignature = sign(encoded);
  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }
}
