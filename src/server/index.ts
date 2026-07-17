import { serve } from "bun";
import { join, normalize, resolve, sep } from "node:path";
import index from "../client/index.html";
import { closeDatabase, ensureSchema } from "./db";
import {
  addInvestment,
  computePortfolioTotals,
  deleteInvestment,
  editInvestment,
  getInvestmentWithStats,
  getPortfolioTotals,
  listInvestments,
} from "./sentinel";
import { queries } from "./db";
import { fetchYahooChart, type YahooRange } from "./yahoo";
import {
  digestStatus,
  previewDigest,
  runDigest,
  startDigestScheduler,
  stopDigestScheduler,
} from "./digest";
import { saveWhatsAppConfig, sendWhatsApp } from "./whatsapp";
import {
  registerUser,
  loginUser,
  getUserFromRequest,
  changeEmail,
  changePassword,
  deleteAccount,
  getGoogleAuthUrl,
  handleGoogleCallback,
  getGithubAuthUrl,
  handleGithubCallback,
} from "./auth";

const PORT = Number(process.env.PORT ?? 3741);
const HOST = process.env.HOST ?? "0.0.0.0";
const IDLE_TIMEOUT_SECONDS = positiveInt(
  process.env.SERVER_IDLE_TIMEOUT_SECONDS,
  60
);
const IS_PROD = process.env.NODE_ENV === "production";
// Allowed origin for CORS. In production set to your real domain, e.g. https://fondtracker.example.com
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? (IS_PROD ? "" : "http://localhost:3741");

const PROJECT_ROOT = process.cwd();
const PUBLIC_DIR = resolve(PROJECT_ROOT, "public");
const DIST_DIR = resolve(PROJECT_ROOT, "dist");
const STARTED_AT = Date.now();
const MAX_BODY_BYTES = 65_536; // 64 KB
let serverInstance: any = null; // For Bun.requestIP access
let cachedIndexHtml: string | null = null;

// ─── Rate Limiter ──────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_ENTRIES = 10_000;

function rateLimit(namespace: string, ip: string, maxRequests = 10): boolean {
  const key = `${namespace}:${ip}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now >= entry.resetAt) {
    if (rateLimitMap.size >= RATE_LIMIT_MAX_ENTRIES) {
      const oldest = rateLimitMap.entries().next().value;
      if (oldest) rateLimitMap.delete(oldest[0]);
    }
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  if (entry.count > maxRequests) return true;
  return false;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now >= val.resetAt) rateLimitMap.delete(key);
  }
}, 60_000).unref();

// ─── Security headers ──────────────────────────────────────────────────────
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "");
}

let cachedNonce = generateNonce();
setInterval(() => { cachedNonce = generateNonce(); }, 60_000).unref();

function securityHeaders(extra?: Record<string, string>): Record<string, string> {
  const nonce = cachedNonce;
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://cdn.tailwindcss.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://assets.landinghero.app",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Content-Security-Policy": csp,
    ...(IS_PROD ? { "Strict-Transport-Security": "max-age=31536000; includeSubDomains" } : {}),
    ...extra,
  };
}

function getClientIp(req: Request): string {
  // Prefer direct TCP connection IP (not spoofable)
  if (serverInstance) {
    try {
      const addr = serverInstance.requestIP(req);
      if (addr) return addr.family === "IPv6" ? addr.address : addr.address;
    } catch {}
  }
  // Trust X-Forwarded-For only if behind a known proxy (env TRUST_PROXY=1)
  if (process.env.TRUST_PROXY === "1") {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function corsHeaders(): Record<string, string> {
  if (!ALLOWED_ORIGIN) return {};
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  };
}

/** Validate Origin/Referer header to prevent CSRF on mutating requests */
function checkCSRF(req: Request): boolean {
  if (!ALLOWED_ORIGIN) return true; // no origin configured, skip check
  const origin = req.headers.get("Origin");
  const referer = req.headers.get("Referer");
  // If neither header is present, allow (browsers always send Origin/Referer on cross-origin requests)
  if (!origin && !referer) return true;
  // Check Origin first, then Referer as fallback
  const check = (origin || referer || "").replace(/\/+$/, "");
  return check === ALLOWED_ORIGIN.replace(/\/+$/, "");
}

function json(data: unknown, init?: ResponseInit) {
  const headers: Record<string, string> = {
    ...corsHeaders(),
    ...securityHeaders(),
    ...(init?.headers as Record<string, string> ?? {}),
  };
  return Response.json(data, { ...init, headers });
}

function badRequest(message: string) {
  return json({ error: message }, { status: 400 });
}

function unauthorized(message = "No autenticado") {
  return json({ error: message }, { status: 401 });
}

function tooManyRequests() {
  return json({ error: "Demasiados intentos. Espera un momento." }, { status: 429 });
}

/** Safely read request body with streaming size limit to prevent OOM DoS */
async function safeJson(req: Request): Promise<unknown> {
  if (!req.body) throw new Error("Body ausente");
  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let totalSize = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalSize += value.length;
    if (totalSize > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new Error("Payload demasiado grande");
    }
    chunks.push(decoder.decode(value, { stream: true }));
  }
  chunks.push(decoder.decode()); // flush

  const text = chunks.join("");
  if (text.length > MAX_BODY_BYTES) throw new Error("Payload demasiado grande");
  return JSON.parse(text);
}

/** Sanitize error messages for client — never expose SQL/internals in production */
const SAFE_ERROR_PREFIXES = [
  "Credenciales incorrectas", "Mínimo 8 caracteres", "Requiere al menos una mayúscula",
  "Requiere al menos una minúscula", "Requiere al menos un número",
  "El email o nombre de usuario ya está registrado", "Usuario no encontrado",
  "El usuario necesita al menos 3 caracteres", "El usuario solo puede tener letras, números y guión bajo",
  "Introduce un email válido", "Introduce tu email o usuario", "Introduce tu contraseña",
  "Payload demasiado grande", "Body ausente", "Falta ", "Email inválido",
  "ISIN inválido", "Ticker inválido", "Rango inválido", "Intervalo inválido",
  "fondo no encontrado", "datos de mercado no disponibles para este fondo",
  "Demasiados intentos", "No autenticado",
  "La contraseña actual no es correcta", "No se pudo actualizar el email",
  "Faltan WHATSAPP_PHONE", "WhatsApp no configurado",
];
function safeError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (IS_PROD && !SAFE_ERROR_PREFIXES.some(p => msg.startsWith(p))) {
    return "Error interno del servidor";
  }
  return msg;
}

async function requireUser(req: Request): Promise<{ id: number; username: string } | Response> {
  const user = await getUserFromRequest(req);
  if (!user) return unauthorized();
  return user;
}

function serveStatic(req: Request) {
  const url = new URL(req.url);
  const pathname = decodeURIComponent(url.pathname);
  const safe = normalize(pathname).replace(/^([/\\])+/, "");
  const full = resolve(join(PUBLIC_DIR, safe));
  // Prevent path traversal: resolved path must be within PUBLIC_DIR
  if (!full.startsWith(PUBLIC_DIR + sep) && full !== PUBLIC_DIR) {
    return new Response("Forbidden", { status: 403 });
  }
  // Block Windows reserved device names
  if (/^(con|nul|prn|aux|com[1-9]|lpt[1-9])($|\/|\\)/i.test(safe)) {
    return new Response("Forbidden", { status: 403 });
  }
  return new Response(Bun.file(full), {
    headers: {
      ...securityHeaders(),
      "Cache-Control":
        IS_PROD
          ? "public, max-age=31536000, immutable"
          : "no-cache",
    },
  });
}

/** Serve index.html with nonce injection for CSP */
function serveIndexHtml(): Response {
  const html = cachedIndexHtml?.replace(/\{nonce\}/g, cachedNonce) ?? "";
  return new Response(html, {
    headers: {
      "Content-Type": "text/html",
      ...securityHeaders(),
    },
  });
}

try {
  await ensureSchema();
} catch (err) {
  console.error(`[tracker] ERROR: No se pudo conectar a la base de datos.`, err);
  console.error(`[tracker] La landing page seguirá funcionando, pero las funciones que requieren DB no estarán disponibles.`);
}

// Pre-cache index.html for CSP nonce injection
try {
  cachedIndexHtml = await Bun.file(join(PROJECT_ROOT, "index.html")).text();
} catch {
  console.error("[tracker] ERROR: index.html no encontrado. Ejecuta 'bun run build' primero.");
  process.exit(1);
}

const server = serve({
  port: PORT,
  hostname: HOST,
  idleTimeout: IDLE_TIMEOUT_SECONDS,

  error(err) {
    console.error(`[tracker] ${ts()} unhandled server error:`, err);
    return new Response("Internal Server Error", { status: 500 });
  },

  fetch(req, server) {
    serverInstance = server;
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders(),
          "Access-Control-Max-Age": "86400",
        },
      });
    }
    return new Response("Not Found", { status: 404 });
  },

  routes: {
    "/favicon.svg": (req) => serveStatic(req),
    "/favicon.ico": (req) => serveStatic(req),
    "/": () => serveIndexHtml(),
    "/dashboard": index,
    "/dashboard/*": index,
    "/login": index,
    "/login/*": index,
    "/register": index,
    "/register/*": index,
    "/legal": index,
    "/legal/*": index,

    "/api/health": {
      async GET(req) {
        // In production, require a valid verified JWT to view health details (VULN-12 fix)
        let showDetails = !IS_PROD;
        if (IS_PROD) {
          const auth = req.headers.get("Authorization");
          if (auth?.startsWith("Bearer ")) {
            const { verifyToken } = await import("./auth");
            const payload = await verifyToken(auth.slice(7));
            showDetails = payload !== null;
          }
        }
        return json({
          ok: true,
          uptime: Math.round((Date.now() - STARTED_AT) / 1000),
          ...(showDetails ? {
            pid: process.pid,
            
            bun: Bun.version,
          } : {}),
        });
      },
    },

    "/api/auth/register": {
      async POST(req) {
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

          if (username.length < 3) {
            return badRequest("El usuario necesita al menos 3 caracteres");
          }
          if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return badRequest("El usuario solo puede tener letras, números y guión bajo");
          }
          if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            return badRequest("Introduce un email válido");
          }
          if (password.length < 8) return badRequest("Mínimo 8 caracteres");
          if (!/[A-Z]/.test(password)) return badRequest("Requiere al menos una mayúscula");
          if (!/[a-z]/.test(password)) return badRequest("Requiere al menos una minúscula");
          if (!/[0-9]/.test(password)) return badRequest("Requiere al menos un número");
          if (phone && !/^\+[1-9]\d{6,14}$/.test(phone.replace(/[\s-]/g, ""))) {
            return badRequest("Teléfono inválido. Formato: +34123456789");
          }

          const result = await registerUser(username, email, password, phone);
          return json(result, { status: 201 });
        } catch (err) {
          return badRequest(safeError(err));
        }
      },
    },

    "/api/auth/login": {
      async POST(req) {
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
          return json(result);
        } catch (err) {
          // Always return the same generic message to prevent user enumeration
          return badRequest("Credenciales incorrectas");
        }
      },
    },

    "/api/auth/google": {
      async GET() {
        return Response.redirect(getGoogleAuthUrl(), 302);
      }
    },

    "/api/auth/google/callback": {
      async GET(req) {
        const url = new URL(req.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state") ?? "";
        if (!code) return badRequest("Missing code");
        try {
          const token = await handleGoogleCallback(code, state);
          // VULN-02 fix: pass token via URL fragment (#) so it never appears in server logs,
          // Referer headers, or browser history as a query parameter.
          return Response.redirect(`/dashboard#token=${token}`, 302);
        } catch (err: any) {
          // VULN-06 fix: sanitize error message and use json() for security headers
          return json({ error: safeError(err) }, { status: 500 });
        }
      }
    },

    "/api/auth/github": {
      async GET() {
        return Response.redirect(getGithubAuthUrl(), 302);
      }
    },

    "/api/auth/github/callback": {
      async GET(req) {
        const url = new URL(req.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state") ?? "";
        if (!code) return badRequest("Missing code");
        try {
          const token = await handleGithubCallback(code, state);
          // VULN-02 fix: pass token via URL fragment (#) so it never appears in server logs,
          // Referer headers, or browser history as a query parameter.
          return Response.redirect(`/dashboard#token=${token}`, 302);
        } catch (err: any) {
          // VULN-06 fix: sanitize error message and use json() for security headers
          return json({ error: safeError(err) }, { status: 500 });
        }
      }
    },

    "/api/auth/me": {
      async GET(req) {
        const user = await requireUser(req);
        if (user instanceof Response) return user;
        const ip = getClientIp(req);
        if (rateLimit("auth-me", ip, 30)) return tooManyRequests();
        const { getUserProfile } = await import("./auth");
        const profile = await getUserProfile(user.id);
        if (!profile) return unauthorized("Usuario no encontrado");
        return json(profile);
      },
      async PUT(req) {
        const user = await requireUser(req);
        if (user instanceof Response) return user;
        if (!checkCSRF(req)) return json({ error: "Origen no permitido" }, { status: 403 });
        try {
          const body = (await safeJson(req)) as { email?: string; currentEmail?: string; currentPassword?: string; newPassword?: string; phone?: string };
          if (body.email) {
            if (!body.currentEmail) return badRequest("Falta el email actual");
            const email = (body.email as string).trim().toLowerCase();
            const currentEmail = (body.currentEmail as string).trim().toLowerCase();
            if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) return badRequest("Email inválido");

            const [rows] = await (await import("./db")).pool.query<any[]>(
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
            await (await import("./db")).pool.query(
              "UPDATE users SET phone = ? WHERE id = ?",
              [clean.replace(/[^\d+]/g, "") || null, user.id]
            );
          }
          if (body.currentPassword && body.newPassword) {
            const ip = getClientIp(req);
            if (rateLimit("pwchange", ip, 5)) return tooManyRequests();
            const newPw = body.newPassword as string;
            if (newPw.length < 8) return badRequest("Mínimo 8 caracteres");
            if (!/[A-Z]/.test(newPw)) return badRequest("Requiere al menos una mayúscula");
            if (!/[a-z]/.test(newPw)) return badRequest("Requiere al menos una minúscula");
            if (!/[0-9]/.test(newPw)) return badRequest("Requiere al menos un número");
            await changePassword(user.id, body.currentPassword as string, newPw);
          }
          return json({ ok: true });
        } catch (err) {
          return badRequest(safeError(err));
        }
      },
      async DELETE(req) {
        const user = await requireUser(req);
        if (user instanceof Response) return user;
        if (!checkCSRF(req)) return json({ error: "Origen no permitido" }, { status: 403 });
        try {
          const body = (await safeJson(req)) as { password?: string };
          if (!body.password) return badRequest("Falta la contraseña");
          await deleteAccount(user.id, body.password as string);
          return json({ ok: true });
        } catch (err) {
          return badRequest(safeError(err));
        }
      },
    },

    "/api/status": {
      async GET(req) {
        const user = await requireUser(req);
        if (user instanceof Response) return user;
        const [investments, digest] = await Promise.all([
          listInvestments(user.id),
          digestStatus(user.id),
        ]);
        const totals = computePortfolioTotals(investments);
        return json({
          ...totals,
          whatsapp: {
            ...digest.config,
            lastSent: digest.lastSent,
            nextRunAt: null,
            lastTestAt: digest.lastTestAt,
            lastStatus: digest.lastStatus,
          },
        });
      },
    },

    // Unified endpoint: returns funds + totals + whatsapp status in one request.
    "/api/portfolio": {
      async GET(req) {
        const user = await requireUser(req);
        if (user instanceof Response) return user;
        const ip = getClientIp(req);
        if (rateLimit("portfolio", ip, 30)) return tooManyRequests();
        const [investments, digest] = await Promise.all([
          listInvestments(user.id),
          digestStatus(user.id),
        ]);
        const totals = computePortfolioTotals(investments);
        return json({
          funds: investments,
          status: {
            ...totals,
            whatsapp: {
              ...digest.config,
              lastSent: digest.lastSent,
              nextRunAt: null,
              lastTestAt: digest.lastTestAt,
              lastStatus: digest.lastStatus,
            },
            
          },
        });
      },
    },

    "/api/banks": {
      GET() {
        return json({
          "Santander": "https://www.bancosantander.es/particulares/fondos-inversion",
          "BBVA": "https://www.bbva.es/personas/productos/fondos-inversion.html",
          "CaixaBank": "https://www.caixabank.es/particular/fondos-inversion/fondos-inversion_es.html",
          "Bankinter": "https://www.bankinter.com/fondos-inversion",
          "Sabadell": "https://www.bancsabadell.com/fondos-inversion",
          "Unicaja": "https://www.unicajabanco.es/fondos-inversion",
          "Kutxabank": "https://www.kutxabank.es/fondos-inversion",
          "Ibercaja": "https://www.ibercaja.es/fondos-inversion",
          "Abanca": "https://www.abanca.com/fondos-inversion",
          "ING": "https://www.ing.es/fondos-inversion",
          "Openbank": "https://www.openbank.es/fondos-inversion",
          "EVO Banco": "https://www.evobanco.com/fondos-inversion",
          "MyInvestor": "https://www.myinvestor.es/fondos",
          "Indexa Capital": "https://indexacapital.com",
          "Finizens": "https://finizens.com",
          "Renta 4": "https://www.r4.com/fondos",
          "GPM": "https://www.gpm.es",
          "Andbank": "https://www.andbank.es/fondos-inversion",
          "Banca March": "https://www.bancamarch.es/fondos-inversion",
          "Caja Ingenieros": "https://www.cajaingenieros.es/fondos-inversion",
          "Arquia Banca": "https://www.arquiabanca.com/fondos-inversion",
          "Deutsche Bank": "https://www.deutschebank.es/fondos-inversion",
          "Tressis": "https://www.tressis.com/fondos-inversion",
          "Singular Bank": "https://www.singularbank.es/fondos-inversion",
          "Mapfre": "https://www.mapfre.es/fondos-inversion",
          "Carmignac": "https://www.carmignac.es",
          "Magallanes": "https://www.magallanes.es",
          "iShares": "https://www.ishares.com/es",
          "Vanguard": "https://www.vanguard.com/es",
          "Xtrackers": "https://www.xtrackers.com/es",
          "Amundi": "https://www.amundi.es",
          "Invesco": "https://www.invesco.com/es",
          "SPDR": "https://www.spdrs.com/es",
          "Pictet": "https://www.pictet.com/es",
          "Allianz": "https://www.allianz.es/fondos-inversion",
          "Nordea": "https://www.nordea.com/es",
          "Robeco": "https://www.robeco.com/es",
          "Fidelity": "https://www.fidelity.es",
          "JP Morgan": "https://www.jpmorgan.com/es/fondos",
          "PIMCO": "https://www.pimco.com/es",
          "Schroder": "https://www.schroders.com/es",
          "Franklin Templeton": "https://www.franklintempleton.es",
          "M&G": "https://www.mandg.com/es",
          "BNP Paribas": "https://www.bnpparibas.es/fondos",
          "AXA": "https://www.axa.es/fondos-inversion",
          "BlackRock": "https://www.blackrock.com/es",
          "HSBC": "https://www.hsbc.es/fondos-inversion",
        });
      },
    },

    "/api/funds/search": {
      async GET(req) {
        // VULN-04 fix: require authentication — prevents unauthenticated full catalog dumps
        const user = await requireUser(req);
        if (user instanceof Response) return user;

        const url = new URL(req.url);
        const q = url.searchParams.get("q") ?? "";
        const bank = url.searchParams.get("bank") ?? undefined;
        const category = url.searchParams.get("category") ?? undefined;

        // Limit results per request to prevent bulk scraping
        const MAX_RESULTS = 500;
        const results = await queries.searchFundCatalog(q, bank, category, MAX_RESULTS);
        const banks = await queries.getFundCatalogBanks();
        const categories = await queries.getFundCatalogCategories();

        return json({
          results,
          total: results.length,
          banks,
          categories,
        });
      },
    },

    "/api/funds/catalog/:isin": {
      async GET(req) {
        const user = await requireUser(req);
        if (user instanceof Response) return user;
        const isin = req.params.isin;
        // Validate ISIN format — 2 letters + 10 alphanumeric chars
        if (!/^[A-Z]{2}[A-Z0-9]{10}$/i.test(isin)) return badRequest("ISIN inválido");
        const fund = await queries.getFundCatalogByIsin(isin.toUpperCase());
        if (!fund) return json({ error: "fondo no encontrado" }, { status: 404 });
        return json(fund);
      },
    },

    "/api/funds/chart/:ticker": {
      async GET(req) {
        const user = await requireUser(req);
        if (user instanceof Response) return user;
        const ticker = req.params.ticker;
        // Validate ticker — allow alphanumeric, dot, dash, caret (Yahoo format)
        if (!/^[A-Z0-9.^=-]{1,20}$/i.test(ticker) && !/^[A-Z]{2}[A-Z0-9]{10}$/i.test(ticker)) {
          return badRequest("Ticker inválido");
        }
        const url = new URL(req.url);
        const allowedRanges = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "max"];
        const range = url.searchParams.get("range") ?? "1y";
        if (!allowedRanges.includes(range)) return badRequest("Rango inválido");
        const allowedIntervals = ["1d", "1wk", "1mo", "5m", "15m"];
        const interval = url.searchParams.get("interval") ?? "1d";
        if (!allowedIntervals.includes(interval)) return badRequest("Intervalo inválido");

        const yahooData = await fetchYahooChart(ticker, range as YahooRange, interval as "1d" | "1wk" | "1mo" | "5m" | "15m");
        if (yahooData) return json(yahooData);

        return json({ error: "datos de mercado no disponibles para este fondo" }, { status: 404 });
      },
    },

    "/api/funds": {
      async GET(req) {
        const user = await requireUser(req);
        if (user instanceof Response) return user;
        return json(await listInvestments(user.id));
      },
       async POST(req) {
         const user = await requireUser(req);
         if (user instanceof Response) return user;
         if (!checkCSRF(req)) return json({ error: "Origen no permitido" }, { status: 403 });
         if (rateLimit("funds-write", String(user.id), 30)) return tooManyRequests();
         try {
           const body = (await safeJson(req)) as {
             isin?: string;
             shares?: number;
             purchase_price?: number;
             purchase_date?: string;
             notes?: string;
           };
           if (!body.isin) return badRequest("Falta 'isin'");
          if (!/^[A-Z]{2}[A-Z0-9]{10}$/i.test(body.isin)) return badRequest("ISIN inválido");
          if (body.shares == null || !Number.isFinite(body.shares) || body.shares <= 0) {
            return badRequest("Falta 'shares' (número positivo)");
          }
          if (body.purchase_price == null || !Number.isFinite(body.purchase_price) || body.purchase_price <= 0) {
            return badRequest("Falta 'purchase_price' (número positivo)");
          }
          if (!body.purchase_date) return badRequest("Falta 'purchase_date' (YYYY-MM-DD)");
          if (!/^\d{4}-\d{2}-\d{2}$/.test(body.purchase_date)) return badRequest("Formato de fecha inválido (YYYY-MM-DD)");
          if (body.notes && String(body.notes).length > 500) return badRequest("Las notas no pueden superar 500 caracteres");

          const fund = await addInvestment(
            user.id,
            body.isin,
            body.shares,
            body.purchase_price,
            body.purchase_date,
            body.notes
          );
          return json(fund, { status: 201 });
        } catch (err) {
          return badRequest(safeError(err));
        }
      },
    },

    "/api/funds/:id": {
      async GET(req) {
        const user = await requireUser(req);
        if (user instanceof Response) return user;
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) return badRequest("id inválido");
        const fund = await getInvestmentWithStats(id, user.id);
        if (!fund) return json({ error: "fondo no encontrado" }, { status: 404 });
        return json(fund);
      },
      async PUT(req) {
        const user = await requireUser(req);
        if (user instanceof Response) return user;
        if (!checkCSRF(req)) return json({ error: "Origen no permitido" }, { status: 403 });
        if (rateLimit("funds-write", String(user.id), 30)) return tooManyRequests();
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) return badRequest("id inválido");
        try {
          const body = (await safeJson(req)) as {
            shares?: number;
            purchase_price?: number;
            purchase_date?: string;
            notes?: string;
          };
          if (body.shares == null || !Number.isFinite(body.shares) || body.shares <= 0) {
            return badRequest("Falta 'shares' (número positivo)");
          }
          if (body.purchase_price == null || !Number.isFinite(body.purchase_price) || body.purchase_price <= 0) {
            return badRequest("Falta 'purchase_price' (número positivo)");
          }
          if (!body.purchase_date) return badRequest("Falta 'purchase_date' (YYYY-MM-DD)");
          if (!/^\d{4}-\d{2}-\d{2}$/.test(body.purchase_date as string)) return badRequest("Formato de fecha inválido (YYYY-MM-DD)");
          if (body.notes && String(body.notes).length > 500) return badRequest("Las notas no pueden superar 500 caracteres");

          const fund = await editInvestment(id, user.id, {
            shares: body.shares,
            purchase_price: body.purchase_price,
            purchase_date: body.purchase_date,
            notes: body.notes,
          });
          if (!fund) return json({ error: "fondo no encontrado" }, { status: 404 });
          return json(fund);
        } catch (err) {
          return badRequest(safeError(err));
        }
      },
      async DELETE(req) {
        const user = await requireUser(req);
        if (user instanceof Response) return user;
        if (!checkCSRF(req)) return json({ error: "Origen no permitido" }, { status: 403 });
        if (rateLimit("funds-write", String(user.id), 30)) return tooManyRequests();
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) return badRequest("id inválido");
        const ok = await deleteInvestment(id, user.id);
        if (!ok) return json({ error: "fondo no encontrado" }, { status: 404 });
        return json({ ok: true });
      },
    },

    "/api/notify/preview": {
      async GET(req) {
        const user = await requireUser(req);
        if (user instanceof Response) return user;
        const ip = getClientIp(req);
        if (rateLimit("notify-preview", ip, 10)) return tooManyRequests();
        const cfg = (await digestStatus(user.id)).config;
        const message = await previewDigest({
          slot: "manual",
          timezone: cfg.timezone,
        }, user.id);
        return json({ message, messages: [message] });
      },
    },

    "/api/whatsapp/config": {
      async PUT(req) {
        const user = await requireUser(req);
        if (user instanceof Response) return user;
        if (!checkCSRF(req)) return json({ error: "Origen no permitido" }, { status: 403 });
        try {
          const body = (await safeJson(req)) as {
            api_key?: string;
            timezone?: string;
            enabled?: boolean;
            phone?: string;
          };
          await saveWhatsAppConfig(user.id, body);

          return json({ ok: true });
        } catch (err) {
          return badRequest(safeError(err));
        }
      },
    },

    "/api/whatsapp/test": {
      async POST(req) {
        const user = await requireUser(req);
        if (user instanceof Response) return user;
        const ip = getClientIp(req);
        if (rateLimit("wa-test", ip, 3)) return tooManyRequests();
        try {
          const cfg = (await digestStatus(user.id)).config;
          if (!cfg.configured) {
            return badRequest(
              "WhatsApp no configurado. Guarda primero tu número y API key."
            );
          }
          const testMsg = [
            "╔══ *FONDTRACKER* ═══════╗",
            "║     🧪 Test de conexión",
            `║     ${new Date().toLocaleString("es-ES", { timeZone: cfg.timezone })}`,
            "╚════════════════════════╝",
            "",
            "✅ *Todo funciona correctamente*",
            "",
            "Tu configuración de WhatsApp está operativa.",
            "Recibirás los resúmenes automáticos según tu horario configurado.",
            "",
            "───",
            `_FondTracker · test ${new Date().toISOString().slice(0, 10)}_`,
          ].join("\n");
          await sendWhatsApp(user.id, testMsg);
          await queries.setSetting(`digest:last_test_at:${user.id}`, new Date().toISOString());
          await queries.setSetting(`digest:last_status:${user.id}`, "ok");
          return json({ ok: true });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          await queries.setSetting(`digest:last_status:${user.id}`, msg);
          return json({ error: IS_PROD ? "Error al enviar WhatsApp" : msg }, { status: 500 });
        }
      },
    },

    "/api/notify/test": {
      async POST(req) {
        const user = await requireUser(req);
        if (user instanceof Response) return user;
        try {
          const cfg = (await digestStatus(user.id)).config;
          if (!cfg.configured) {
            return badRequest(
              "WhatsApp no configurado. Guarda primero tu número y API key."
            );
          }
          const result = await runDigest({
            slot: "manual",
            timezone: cfg.timezone,
          }, user.id);
          return json({ ok: true, ...result });
        } catch (err) {
          return json({ error: safeError(err) }, { status: 500 });
        }
      },
    },

    "/*": () => serveIndexHtml(),
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

await startDigestScheduler();

// Data retention: purge soft-deleted records older than 7 days
(async () => {
  try {
    const { pool } = await import("./db");
    const [userResult] = await pool.query(
      "DELETE FROM users WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL 7 DAY"
    );
    const [invResult] = await pool.query(
      "DELETE FROM investments WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL 7 DAY"
    );
    const affected = (userResult as any).affectedRows + (invResult as any).affectedRows;
    if (affected > 0) {
      console.log(`[tracker] limpieza: ${affected} registros soft-delete purgados (>7 días)`);
    }
  } catch (err) {
    console.error(`[tracker] error en limpieza de datos:`, err);
  }
})();

const KEEP_ALIVE_URL = process.env.RENDER_EXTERNAL_URL || process.env.OAUTH_REDIRECT_BASE;
if (IS_PROD && KEEP_ALIVE_URL) {
  try {
    const u = new URL(KEEP_ALIVE_URL);
    if (u.protocol !== "https:") throw new Error("Keep-alive URL must be HTTPS");
  } catch (e) {
    console.error(`[tracker] KEEP_ALIVE_URL inválida:`, e);
  }
  console.log(`[tracker] activando keep-alive automático cada 30s`);
  setInterval(() => {
    fetch(`${KEEP_ALIVE_URL}/api/health`).catch(() => {});
  }, 30_000);
}

function ts() {
  return new Date().toISOString();
}

console.log(`\n  FondTracker`);
console.log(`  ───────────`);
console.log(`  url      ${server.url}`);
console.log(`  platform ${process.platform} · bun ${Bun.version}`);
if (!IS_PROD) {
  console.log(`  mysql    ${process.env.MYSQL_HOST ?? "127.0.0.1"}:${process.env.MYSQL_PORT ?? 3306}`);
  console.log(`  db       ${process.env.MYSQL_DATABASE ?? "fondtracker"}`);
}
console.log(`  pid      ${process.pid}\n`);

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n[tracker] ${ts()} ${signal} recibido, cerrando…`);
  try {
    stopDigestScheduler();
    await server.stop(true);
    await closeDatabase();
    console.log(`[tracker] ${ts()} cierre limpio. bye.`);
  } catch (err) {
    console.error(`[tracker] error durante el cierre:`, err);
  }
  // Let the event loop drain naturally
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
if (process.platform === "win32") {
  process.on("SIGBREAK", () => void shutdown("SIGBREAK"));
  process.on("SIGHUP", () => void shutdown("SIGHUP"));
}

process.on("uncaughtException", (err) => {
  console.error(`[tracker] ${ts()} uncaughtException:`, err);
});
process.on("unhandledRejection", (reason) => {
  console.error(`[tracker] ${ts()} unhandledRejection:`, reason);
});
