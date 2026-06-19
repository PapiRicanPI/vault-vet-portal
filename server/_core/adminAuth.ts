import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import type { Express, Request, Response } from "express";
import { SignJWT } from "jose";
import crypto from "node:crypto";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";

// ---- Password hashing (scrypt, no external deps) ----

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const candidateHash = hashPassword(password, salt);
  const a = Buffer.from(candidateHash, "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// ---- Session signing (reuses existing cookie secret + pattern) ----

function getSessionSecret() {
  const secret = ENV.cookieSecret; // reads process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

async function signAdminSession(openId: string, name: string): Promise<string> {
  const issuedAt = Date.now();
  const expirationSeconds = Math.floor((issuedAt + ONE_YEAR_MS) / 1000);
  const secretKey = getSessionSecret();

  return new SignJWT({
    openId,
    appId: "vault-admin-local",
    name,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

export function registerAdminAuthRoutes(app: Express) {
  app.post("/api/auth/admin-login", async (req: Request, res: Response) => {
    try {
      const { password } = req.body ?? {};

      if (!password || typeof password !== "string") {
        res.status(400).json({ error: "Password is required" });
        return;
      }

      const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
      const adminPasswordSalt = process.env.ADMIN_PASSWORD_SALT;

      if (!adminPasswordHash || !adminPasswordSalt) {
        console.error("[AdminAuth] ADMIN_PASSWORD_HASH / ADMIN_PASSWORD_SALT not configured");
        res.status(500).json({ error: "Admin login not configured" });
        return;
      }

      const isValid = verifyPassword(password, adminPasswordHash, adminPasswordSalt);

      if (!isValid) {
        // Deliberately slow + vague response to resist brute-force / enumeration
        await new Promise(resolve => setTimeout(resolve, 500));
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const openId = "admin-local";
      const signedInAt = new Date();

      await db.upsertUser({
        openId,
        name: "Vault Archivist",
        email: null,
        loginMethod: "local-password",
        lastSignedIn: signedInAt,
      });

      // Ensure role is admin (idempotent, only this code path can ever set it)
      await db.setUserRole(openId, "admin");

      const sessionToken = await signAdminSession(openId, "Vault Archivist");
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true });
    } catch (error) {
      console.error("[AdminAuth] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/admin-logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.json({ success: true });
  });
}
