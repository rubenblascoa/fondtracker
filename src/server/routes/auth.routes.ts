import {
  registerUser,
  loginUser,
  getUserProfile,
  changeEmail,
  changePassword,
  deleteAccount,
  getGoogleAuthUrl,
  handleGoogleCallback,
  getGithubAuthUrl,
  handleGithubCallback,
  buildSessionCookie,
  buildLogoutCookie,
} from "../auth";
import { validatePassword } from "../validation";
import {
  checkCSRF,
  getClientIp,
  rateLimit,
  tooManyRequests,
  badRequest,
  unauthorized,
  json,
  safeJson,
  safeError,
  securityHeaders,
} from "../middleware/security.middleware";
import { requireUser } from "../middleware/auth.middleware";
import { pool } from "../db";

export const authRoutes = {
  "/api/auth/register": {
    async POST(req: Request) {
      if (!checkCSRF(req)) return json({ error: "Origen no permitido" }, { status: 403 });
      const ip = getClientIp(req);
      if (rateLimit("register", ip, 5)) return tooManyRequests();
      try {
        const body = (await safeJson(req)) as {
          username?: string;
          email?: string;
          password?: string;
          phone?: string;
        };
        const username = (body.username ?? "").trim();
        const email = (body.email ?? "").trim().toLowerCase();
        const password = body.password ?? "";
        const phone = (body.phone ?? "").trim();

        if (username.length < 3) return badRequest("El usuario necesita al menos 3 caracteres");
        if (!/^[a-zA-Z0-9_]+$/.test(username)) return badRequest("El usuario solo puede tener letras, números y guión bajo");
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) return badRequest("Introduce un email válido");
        const pwError = validatePassword(password);
        if (pwError) return badRequest(pwError);
        if (phone && !/^\+[1-9]\d{6,14}$/.test(phone.replace(/[\s-]/g, ""))) {
          return badRequest("Teléfono inválido. Formato: +34123456789");
        }

        const result = await registerUser(username, email, password, phone);
        const cookie = buildSessionCookie(result.token);
        return json(result, {
          status: 201,
          headers: { "Set-Cookie": cookie },
        });
      } catch (err) {
        return badRequest(safeError(err));
      }
    },
  },

  "/api/auth/login": {
    async POST(req: Request) {
      if (!checkCSRF(req)) return json({ error: "Origen no permitido" }, { status: 403 });
      const ip = getClientIp(req);
      if (rateLimit("login", ip, 10)) return tooManyRequests();
      try {
        const body = (await safeJson(req)) as {
          identifier?: string;
          password?: string;
        };
        const identifier = (body.identifier ?? "").trim();
        const password = body.password ?? "";

        if (!identifier) return badRequest("Introduce tu email o usuario");
        if (!password) return badRequest("Introduce tu contraseña");

        const result = await loginUser(identifier, password);
        const cookie = buildSessionCookie(result.token);
        return json(result, {
          headers: { "Set-Cookie": cookie },
        });
      } catch {
        return badRequest("Credenciales incorrectas");
      }
    },
  },

  "/api/auth/logout": {
    async POST() {
      return json(
        { ok: true },
        { headers: { "Set-Cookie": buildLogoutCookie() } }
      );
    },
  },

  "/api/auth/google": {
    async GET() {
      return Response.redirect(getGoogleAuthUrl(), 302);
    },
  },

  "/api/auth/google/callback": {
    async GET(req: Request) {
      const url = new URL(req.url);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state") ?? "";
      if (!code) return badRequest("Missing code");
      try {
        const token = await handleGoogleCallback(code, state);
        const cookie = buildSessionCookie(token);
        return new Response(null, {
          status: 302,
          headers: {
            Location: "/dashboard",
            "Set-Cookie": cookie,
            ...securityHeaders(),
          },
        });
      } catch (err: any) {
        return json({ error: safeError(err) }, { status: 500 });
      }
    },
  },

  "/api/auth/github": {
    async GET() {
      return Response.redirect(getGithubAuthUrl(), 302);
    },
  },

  "/api/auth/github/callback": {
    async GET(req: Request) {
      const url = new URL(req.url);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state") ?? "";
      if (!code) return badRequest("Missing code");
      try {
        const token = await handleGithubCallback(code, state);
        const cookie = buildSessionCookie(token);
        return new Response(null, {
          status: 302,
          headers: {
            Location: "/dashboard",
            "Set-Cookie": cookie,
            ...securityHeaders(),
          },
        });
      } catch (err: any) {
        return json({ error: safeError(err) }, { status: 500 });
      }
    },
  },

  "/api/auth/me": {
    async GET(req: Request) {
      const user = await requireUser(req);
      if (user instanceof Response) return user;
      const ip = getClientIp(req);
      if (rateLimit("auth-me", ip, 30)) return tooManyRequests();
      const profile = await getUserProfile(user.id);
      if (!profile) return unauthorized("Usuario no encontrado");
      return json(profile);
    },

    async PUT(req: Request) {
      const user = await requireUser(req);
      if (user instanceof Response) return user;
      if (!checkCSRF(req)) return json({ error: "Origen no permitido" }, { status: 403 });
      try {
        const body = (await safeJson(req)) as {
          email?: string;
          currentEmail?: string;
          currentPassword?: string;
          newPassword?: string;
          phone?: string;
        };
        if (body.email) {
          if (!body.currentEmail) return badRequest("Falta el email actual");
          const email = (body.email as string).trim().toLowerCase();
          const currentEmail = (body.currentEmail as string).trim().toLowerCase();
          if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            return badRequest("Email inválido");
          }

          const [rows] = await pool.query<any[]>(
            "SELECT email FROM users WHERE id = ? AND deleted_at IS NULL",
            [user.id]
          );
          if (!rows[0]) return badRequest("Usuario no encontrado");
          if (rows[0].email.trim().toLowerCase() !== currentEmail) {
            return badRequest("El email actual es incorrecto");
          }
          await changeEmail(user.id, email);
        }
        if (body.phone !== undefined) {
          const clean = body.phone.trim();
          if (clean && !/^\+[1-9]\d{6,14}$/.test(clean.replace(/[\s-]/g, ""))) {
            return badRequest("Teléfono inválido. Formato: +34123456789");
          }
          await pool.query(
            "UPDATE users SET phone = ? WHERE id = ?",
            [clean.replace(/[^\d+]/g, "") || null, user.id]
          );
        }
        if (body.currentPassword && body.newPassword) {
          const ip = getClientIp(req);
          if (rateLimit("pwchange", ip, 5)) return tooManyRequests();
          const newPw = body.newPassword as string;
          const pwError = validatePassword(newPw);
          if (pwError) return badRequest(pwError);
          await changePassword(user.id, body.currentPassword as string, newPw);
        }
        return json({ ok: true });
      } catch (err) {
        return badRequest(safeError(err));
      }
    },

    async DELETE(req: Request) {
      const user = await requireUser(req);
      if (user instanceof Response) return user;
      if (!checkCSRF(req)) return json({ error: "Origen no permitido" }, { status: 403 });
      try {
        const body = (await safeJson(req)) as { password?: string };
        if (!body.password) return badRequest("Falta la contraseña");
        await deleteAccount(user.id, body.password as string);
        return json({ ok: true }, { headers: { "Set-Cookie": buildLogoutCookie() } });
      } catch (err) {
        return badRequest(safeError(err));
      }
    },
  },
};
