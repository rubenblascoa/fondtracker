import { pool } from "./db";

const JWT_SECRET = process.env.JWT_SECRET ?? "fondtracker-dev-secret-change-in-prod";
const TOKEN_EXPIRY = "7d";

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
      JSON.stringify({ sub: payload.sub, username: payload.username, iat: now, exp: now + 7 * 24 * 3600 })
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
  const valid = await verifyPassword(password, rows[0].password_hash);
  if (!valid) throw new Error("La contraseña no es correcta");
  await pool.query("DELETE FROM investments WHERE user_id = ?", [userId]);
  await pool.query("DELETE FROM digest_config WHERE user_id = ?", [userId]);
  await pool.query("DELETE FROM users WHERE id = ?", [userId]);
}
