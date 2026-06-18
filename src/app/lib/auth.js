import { cookies } from "next/headers";
import crypto from "crypto";

const SECRET = process.env.AUTH_SECRET;
const TOKEN_MAX_AGE = 86400; // 1 day in seconds
const COOKIE_NAME = "auth_token";

if (!SECRET) {
  throw new Error("Please define the AUTH_SECRET environment variable in .env");
}

function createToken(userId) {
  const expiry = Math.floor(Date.now() / 1000) + TOKEN_MAX_AGE;
  const payload = `${userId}:${expiry}`;
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex");
  const token = Buffer.from(`${payload}:${signature}`).toString("base64url");
  return token;
}

function verifyToken(token) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon === -1) return null;

    const payload = decoded.slice(0, lastColon);
    const signature = decoded.slice(lastColon + 1);

    const expectedSig = crypto
      .createHmac("sha256", SECRET)
      .update(payload)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const [userId, expiryStr] = payload.split(":");
    const expiry = parseInt(expiryStr, 10);

    if (Date.now() / 1000 > expiry) return null;

    return userId;
  } catch {
    return null;
  }
}

export async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setAuthCookie(userId) {
  const token = createToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TOKEN_MAX_AGE,
    path: "/",
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export function requireAuth(handler) {
  return async (...args) => {
    const userId = await getAuthUser();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handler(userId, ...args);
  };
}
