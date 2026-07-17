import { pool } from "./db";

const DEFAULT_SECRET = "fondtracker-dev-secret-change-in-prod";
const JWT_SECRET = process.env.JWT_SECRET ?? DEFAULT_SECRET;
const IS_PROD = process.env.NODE_ENV === "production";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET ?? "";
const OAUTH_REDIRECT_BASE = process.env.OAUTH_REDIRECT_BASE ?? (IS_PROD ? "https://fondtracker.example.com" : "http://localhost:3741");

// Hard-fail at startup if deployed to production with the default secret
if (IS_PROD && JWT_SECRET === DEFAULT_SECRET) {
  console.error(
    "\n[FATAL] JWT_SECRET no está configurado. " +
    "Debes establecer una clave aleatoria segura en la variable de entorno JWT_SECRET " +
    "antes de arrancar en producción. Ejemplo:\n" +
    "  openssl rand -base64 48\n"
  );
  process.exit(1);
}

// 24h in production, 7d in development
const TOKEN_EXPIRY_SECONDS = IS_PROD ? 86_400 : 7 * 24 * 3600;

type UserRow = {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
};

type JwtPayload = {
  sub: number;
  username: string;
  iat: number;
  exp: number;
};

function base64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signToken(payload: { sub: number; username: string }): Promise<string> {
  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const now = Math.floor(Date.now() / 1000);
  const body = base64url(
    new TextEncoder().encode(
      JSON.stringify({ sub: payload.sub, username: payload.username, iat: now, exp: now + TOKEN_EXPIRY_SECONDS })
    )
  );
  const key = await hmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${header}.${body}`));
  return `${header}.${body}.${base64url(sig)}`;
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const key = await hmacKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64urlDecode(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(parts[1]))) as JwtPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash);
}

export async function registerUser(
  username: string,
  email: string,
  password: string
): Promise<{ user: { id: number; username: string; email: string }; token: string }> {
  const [existing] = await pool.query<UserRow[]>(
    "SELECT id, username, email FROM users WHERE email = ? OR username = ?",
    [email, username]
  );
  const conflict = (existing as any[]).find(
    (r) => r.email === email || r.username === username
  );
  if (conflict) {
    if (conflict.email === email) {
      throw new Error("Ya existe una cuenta con ese email");
    }
    throw new Error("Ese nombre de usuario ya está en uso");
  }

  const hash = await hashPassword(password);
  const [result] = await pool.query(
    "INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, NOW())",
    [username, email, hash]
  );
  const id = (result as any).insertId;
  const token = await signToken({ sub: id, username });
  return { user: { id, username, email }, token };
}

export async function loginUser(
  identifier: string,
  password: string
): Promise<{ user: { id: number; username: string; email: string }; token: string }> {
  const [rows] = await pool.query<UserRow[]>(
    "SELECT * FROM users WHERE email = ? OR username = ?",
    [identifier, identifier]
  );
  const user = rows[0];
  if (!user) throw new Error("Credenciales incorrectas");

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) throw new Error("Credenciales incorrectas");

  const token = await signToken({ sub: user.id, username: user.username });
  return { user: { id: user.id, username: user.username, email: user.email }, token };
}

export async function getUserFromRequest(req: Request): Promise<{ id: number; username: string } | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const payload = await verifyToken(auth.slice(7));
  if (!payload) return null;
  return { id: payload.sub, username: payload.username };
}

export async function getUserProfile(userId: number): Promise<{ id: number; username: string; email: string; created_at: string } | null> {
  const [rows] = await pool.query<any[]>(
    "SELECT id, username, email, created_at FROM users WHERE id = ?",
    [userId]
  );
  return rows[0] ?? null;
}

export async function changeEmail(userId: number, newEmail: string): Promise<void> {
  const [existing] = await pool.query<any[]>(
    "SELECT id FROM users WHERE email = ? AND id != ?",
    [newEmail, userId]
  );
  if (existing.length > 0) throw new Error("Ese email ya está en uso");
  await pool.query("UPDATE users SET email = ? WHERE id = ?", [newEmail, userId]);
}

export async function changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
  const [rows] = await pool.query<any[]>("SELECT password_hash FROM users WHERE id = ?", [userId]);
  if (!rows[0]) throw new Error("Usuario no encontrado");
  const valid = await verifyPassword(currentPassword, rows[0].password_hash);
  if (!valid) throw new Error("La contraseña actual no es correcta");
  const hash = await hashPassword(newPassword);
  await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, userId]);
}

export async function deleteAccount(userId: number, password: string): Promise<void> {
  const [rows] = await pool.query<any[]>("SELECT password_hash FROM users WHERE id = ?", [userId]);
  if (!rows[0]) throw new Error("Usuario no encontrado");
  if (rows[0].password_hash !== null) {
    const valid = await verifyPassword(password, rows[0].password_hash);
    if (!valid) throw new Error("La contraseña no es correcta");
  }
  await pool.query("DELETE FROM investments WHERE user_id = ?", [userId]);
  await pool.query("DELETE FROM users WHERE id = ?", [userId]);
}

// --- OAUTH LOGIC ---

export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${OAUTH_REDIRECT_BASE}/api/auth/google/callback`,
    response_type: "code",
    scope: "email profile",
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function handleGoogleCallback(code: string): Promise<string> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${OAUTH_REDIRECT_BASE}/api/auth/google/callback`,
    }),
  });
  if (!tokenRes.ok) throw new Error("Failed to exchange Google token");
  const tokenData = await tokenRes.json();
  
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!profileRes.ok) throw new Error("Failed to fetch Google user profile");
  const profile = await profileRes.json();
  const email = profile.email;
  const googleId = profile.id;
  const username = profile.name || email.split("@")[0];

  return await linkOrCreateOAuthUser(email, username, "google_id", googleId);
}

export function getGithubAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: `${OAUTH_REDIRECT_BASE}/api/auth/github/callback`,
    scope: "user:email",
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function handleGithubCallback(code: string): Promise<string> {
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Accept": "application/json" 
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${OAUTH_REDIRECT_BASE}/api/auth/github/callback`,
    }),
  });
  if (!tokenRes.ok) throw new Error("Failed to exchange GitHub token");
  const tokenData = await tokenRes.json();
  
  const userRes = await fetch("https://api.github.com/user", {
    headers: { 
      Authorization: `Bearer ${tokenData.access_token}`,
      "User-Agent": "FondTracker"
    },
  });
  if (!userRes.ok) throw new Error("Failed to fetch GitHub user profile");
  const profile = await userRes.json();
  
  let email = profile.email;
  if (!email) {
    const emailsRes = await fetch("https://api.github.com/user/emails", {
      headers: { 
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "FondTracker"
      },
    });
    if (emailsRes.ok) {
      const emails = await emailsRes.json();
      const primary = emails.find((e: any) => e.primary) || emails[0];
      if (primary) email = primary.email;
    }
  }
  
  if (!email) throw new Error("Could not retrieve email from GitHub");
  const githubId = profile.id.toString();
  const username = profile.login;

  return await linkOrCreateOAuthUser(email, username, "github_id", githubId);
}

async function linkOrCreateOAuthUser(email: string, username: string, providerColumn: "google_id" | "github_id", providerId: string): Promise<string> {
  const [rowsById] = await pool.query<any[]>(
    `SELECT id, username FROM users WHERE ${providerColumn} = ?`,
    [providerId]
  );
  if (rowsById[0]) {
    return await signToken({ sub: rowsById[0].id, username: rowsById[0].username });
  }

  const [rowsByEmail] = await pool.query<any[]>(
    "SELECT id, username FROM users WHERE email = ?",
    [email]
  );
  if (rowsByEmail[0]) {
    await pool.query(
      `UPDATE users SET ${providerColumn} = ? WHERE id = ?`,
      [providerId, rowsByEmail[0].id]
    );
    return await signToken({ sub: rowsByEmail[0].id, username: rowsByEmail[0].username });
  }

  let finalUsername = username;
  let counter = 1;
  while (true) {
    const [rowsByUsername] = await pool.query<any[]>(
      "SELECT id FROM users WHERE username = ?",
      [finalUsername]
    );
    if (rowsByUsername.length === 0) break;
    finalUsername = `${username}${counter}`;
    counter++;
  }

  const [result] = await pool.query(
    `INSERT INTO users (username, email, ${providerColumn}, created_at) VALUES (?, ?, ?, NOW())`,
    [finalUsername, email, providerId]
  );
  const id = (result as any).insertId;
  return await signToken({ sub: id, username: finalUsername });
}
