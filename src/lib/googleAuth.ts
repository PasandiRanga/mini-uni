/**
 * Google sign-in (identity only)
 * ------------------------------
 * Lets a user log in or sign up with their Google account. This is separate
 * from the Calendar connection in googleCalendar.ts: it asks only for the
 * non-sensitive `openid email profile` scopes (no verification needed, works
 * for everyone immediately) and keeps no tokens — we just read the verified
 * email and name once, then issue our own session.
 *
 * It reuses the same OAuth client as the Calendar flow, so it needs its own
 * redirect URI (/api/auth/google/callback) registered in the Cloud Console.
 */

import { createRemoteJWKSet, jwtVerify } from "jose";

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || "";

/** The OAuth client id is public (it ships to the browser for One Tap). */
export const googleClientId = () => CLIENT_ID;

const LOGIN_SCOPES = ["openid", "email", "profile"].join(" ");

export const isGoogleAuthConfigured = () => Boolean(CLIENT_ID && CLIENT_SECRET);

/** Where Google sends the user back after they sign in. Must match a redirect URI on the OAuth client. */
export const loginRedirectUri = (origin: string) => `${origin}/api/auth/google/callback`;

/** The consent screen URL for signing in. `select_account` lets the user pick which Google account. */
export function buildLoginAuthUrl(origin: string, state: string) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: loginRedirectUri(origin),
    response_type: "code",
    scope: LOGIN_SCOPES,
    access_type: "online",
    prompt: "select_account",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export interface GoogleProfile {
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
}

/** Swaps the one-time code for tokens, then reads the signed-in Google profile. */
export async function exchangeCodeForProfile(code: string, origin: string): Promise<GoogleProfile> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: loginRedirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  const token = await tokenRes.json();
  if (!tokenRes.ok || !token.access_token) {
    throw new Error(token.error_description || token.error || "Google sign-in failed");
  }

  const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const info = await infoRes.json();
  if (!infoRes.ok || !info?.email) {
    throw new Error("Couldn't read your Google profile");
  }

  return {
    email: String(info.email).toLowerCase(),
    emailVerified: Boolean(info.verified_email ?? info.email_verified ?? true),
    firstName: info.given_name || (info.name ? String(info.name).split(" ")[0] : "") || "Student",
    lastName: info.family_name || "",
  };
}

// Google's public keys for verifying One Tap ID tokens. jose caches and refreshes this.
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

/**
 * Verifies a Google One Tap credential (a signed ID token) and returns the
 * profile. The signature, issuer and audience are all checked, so a token
 * minted for another app or by anyone but Google is rejected.
 */
export async function verifyGoogleIdToken(credential: string): Promise<GoogleProfile> {
  const { payload } = await jwtVerify(credential, GOOGLE_JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: CLIENT_ID,
  });
  if (!payload.email) throw new Error("No email in Google token");
  const name = typeof payload.name === "string" ? payload.name : "";
  return {
    email: String(payload.email).toLowerCase(),
    emailVerified: Boolean((payload as any).email_verified ?? true),
    firstName: (payload as any).given_name || (name ? name.split(" ")[0] : "") || "User",
    lastName: (payload as any).family_name || "",
  };
}
