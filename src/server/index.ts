import { serve } from "bun";
import { join, normalize, resolve, sep } from "node:path";
import index from "../client/index.html";
import { closeDatabase, ensureSchema } from "./db";
import {
  addInvestment,
  deleteInvestment,
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
} from "./auth";

const PORT = Number(process.env.PORT ?? 3741);
const HOST = process.env.HOST ?? "127.0.0.1";
const IDLE_TIMEOUT_SECONDS = positiveInt(
  process.env.SERVER_IDLE_TIMEOUT_SECONDS,
  60
);

const PROJECT_ROOT = process.cwd();
const PUBLIC_DIR = resolve(PROJECT_ROOT, "public");
const STARTED_AT = Date.now();

await ensureSchema();

function json(data: unknown, init?: ResponseInit) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function serveStatic(req: Request) {
  const url = new URL(req.url);
  const pathname = decodeURIComponent(url.pathname);
  const safe = normalize(pathname).replace(/^([/\\])+/, "");
  const full = join(PUBLIC_DIR, safe);
  if (!full.startsWith(PUBLIC_DIR + sep) && full !== PUBLIC_DIR) {
    return new Response("Forbidden", { status: 403 });
  }
  return new Response(Bun.file(full), {
    headers: {
      "Cache-Control":
        process.env.NODE_ENV === "production"
          ? "public, max-age=31536000, immutable"
          : "no-cache",
    },
  });
}

async function requireUser(req: Request): Promise<{ id: number; username: string } | Response> {
  const user = await getUserFromRequest(req);
  if (!user) return unauthorized();
  return user;
}

const server = serve({
  port: PORT,
  hostname: HOST,
  idleTimeout: IDLE_TIMEOUT_SECONDS,

  error(err) {
    console.error(`[tracker] ${ts()} unhandled server error:`, err);
    return new Response("Internal Server Error", { status: 500 });
  },

  fetch(req) {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
    return new Response("Not Found", { status: 404 });
  },

  routes: {
    "/favicon.svg": (req) => serveStatic(req),
    "/favicon.ico": (req) => serveStatic(req),
    "/": () => new Response(Bun.file(join(PROJECT_ROOT, "index.html")), { headers: { "Content-Type": "text/html" } }),
    "/dashboard": index,
    "/dashboard/*": index,
    "/login": index,
    "/login/*": index,
    "/register": index,
    "/register/*": index,

    "/api/health": {
      GET() {
        return json({
          ok: true,
          uptime: Math.round((Date.now() - STARTED_AT) / 1000),
          pid: process.pid,
          platform: process.platform,
          bun: Bun.version,
        });
      },
    },

    "/api/auth/register": {
      async POST(req) {
        try {
          const body = (await req.json()) as {
            username?: string;
            email?: string;
            password?: string;
          };
          const username = (body.username ?? "").trim();
          const email = (body.email ?? "").trim().toLowerCase();
          const password = body.password ?? "";

          if (username.length < 3) {
            return badRequest("El usuario necesita al menos 3 caracteres");
          }
          if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return badRequest("El usuario solo puede tener letras, números y guión bajo");
          }
          if (!email.includes("@") || !email.includes(".")) {
            return badRequest("Introduce un email válido");
          }
          if (password.length < 6) {
            return badRequest("La contraseña necesita al menos 6 caracteres");
          }

          const result = await registerUser(username, email, password);
          return json(result, { status: 201 });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return badRequest(msg);
        }
      },
    },

    "/api/auth/login": {
      async POST(req) {
        try {
          const body = (await req.json()) as {
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
          const msg = err instanceof Error ? err.message : String(err);
          return badRequest(msg);
        }
      },
    },

    "/api/auth/me": {
      async GET(req) {
        const user = await requireUser(req);
        if (user instanceof Response) return user;
        const { getUserProfile } = await import("./auth");
        const profile = await getUserProfile(user.id);
        if (!profile) return unauthorized("Usuario no encontrado");
        return json(profile);
      },
      async PUT(req) {
        const user = await requireUser(req);
        if (user instanceof Response) return user;
        try {
          const body = (await req.json()) as { email?: string; currentPassword?: string; newPassword?: string };
          if (body.email) {
            await changeEmail(user.id, body.email.trim().toLowerCase());
          }
          if (body.currentPassword && body.newPassword) {
            if (body.newPassword.length < 6) return badRequest("La nueva contraseña necesita al menos 6 caracteres");
            await changePassword(user.id, body.currentPassword, body.newPassword);
          }
          return json({ ok: true });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return badRequest(msg);
        }
      },
      async DELETE(req) {
        const user = await requireUser(req);
        if (user instanceof Response) return user;
        try {
          const body = (await req.json()) as { password?: string };
          if (!body.password) return badRequest("Falta la contraseña");
          await deleteAccount(user.id, body.password);
          return json({ ok: true });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return badRequest(msg);
        }
      },
    },

    "/api/status": {
      async GET(req) {
        const user = await requireUser(req);
        if (user instanceof Response) return user;
        const digest = await digestStatus();
        const totals = await getPortfolioTotals(user.id);
        return json({
          ...totals,
          whatsapp: {
            ...digest.config,
            lastSent: digest.lastSent,
            nextRunAt: digest.nextRunAt,
            lastTestAt: digest.lastTestAt,
            lastStatus: digest.lastStatus,
          },
          platform: process.platform,
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
        const url = new URL(req.url);
        const q = url.searchParams.get("q") ?? "";
        const bank = url.searchParams.get("bank") ?? undefined;
        const category = url.searchParams.get("category") ?? undefined;

        const results = await queries.searchFundCatalog(q, bank, category, 10000);
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
        const isin = req.params.isin;
        const fund = await queries.getFundCatalogByIsin(isin);
        if (!fund) return json({ error: "fondo no encontrado" }, { status: 404 });
        return json(fund);
      },
    },

    "/api/funds/chart/:ticker": {
      async GET(req) {
        const ticker = req.params.ticker;
        const url = new URL(req.url);
        const range = (url.searchParams.get("range") ?? "1y") as YahooRange;
        const interval = (url.searchParams.get("interval") ?? "1d") as "1d" | "1wk" | "1mo" | "5m" | "15m";

        const yahooData = await fetchYahooChart(ticker, range, interval);
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
        try {
          const body = (await req.json()) as {
            isin?: string;
            shares?: number;
            purchase_price?: number;
            purchase_date?: string;
            notes?: string;
          };
          if (!body.isin) return badRequest("Falta 'isin'");
          if (body.shares == null || !Number.isFinite(body.shares) || body.shares <= 0) {
            return badRequest("Falta 'shares' (número positivo)");
          }
          if (body.purchase_price == null || !Number.isFinite(body.purchase_price) || body.purchase_price <= 0) {
            return badRequest("Falta 'purchase_price' (número positivo)");
          }
          if (!body.purchase_date) return badRequest("Falta 'purchase_date' (YYYY-MM-DD)");

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
          const msg = err instanceof Error ? err.message : String(err);
          return badRequest(msg);
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
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) return badRequest("id inválido");
        try {
          const body = (await req.json()) as {
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

          const { editInvestment } = await import("./sentinel");
          const fund = await editInvestment(id, user.id, {
            shares: body.shares,
            purchase_price: body.purchase_price,
            purchase_date: body.purchase_date,
            notes: body.notes,
          });
          if (!fund) return json({ error: "fondo no encontrado" }, { status: 404 });
          return json(fund);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return badRequest(msg);
        }
      },
      async DELETE(req) {
        const user = await requireUser(req);
        if (user instanceof Response) return user;
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) return badRequest("id inválido");
        const ok = await deleteInvestment(id, user.id);
        if (!ok) return json({ error: "fondo no encontrado" }, { status: 404 });
        return json({ ok: true });
      },
    },

    "/api/notify/preview": {
      async GET() {
        const cfg = (await digestStatus()).config;
        const message = await previewDigest({
          slot: "manual",
          timezone: cfg.timezone,
        });
        return json({ message, messages: [message] });
      },
    },

    "/api/whatsapp/config": {
      async PUT(req) {
        const user = await requireUser(req);
        if (user instanceof Response) return user;
        try {
          const body = (await req.json()) as {
            phone?: string;
            api_key?: string;
            timezone?: string;
            cron?: string;
            enabled?: boolean;
          };
          await saveWhatsAppConfig(body);

          stopDigestScheduler();
          await startDigestScheduler();

          return json({ ok: true });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return badRequest(msg);
        }
      },
    },

    "/api/whatsapp/test": {
      async POST(req) {
        const user = await requireUser(req);
        if (user instanceof Response) return user;
        try {
          const cfg = (await digestStatus()).config;
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
          await sendWhatsApp(testMsg);
          await queries.setSetting("digest:last_test_at", new Date().toISOString());
          await queries.setSetting("digest:last_status", "ok");
          return json({ ok: true });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          await queries.setSetting("digest:last_status", msg);
          return json({ error: msg }, { status: 500 });
        }
      },
    },

    "/api/notify/test": {
      async POST() {
        try {
          const cfg = (await digestStatus()).config;
          if (!cfg.configured) {
            return badRequest(
              "WhatsApp no configurado. Define WHATSAPP_PHONE y CALLMEBOT_API_KEY."
            );
          }
          const result = await runDigest({
            slot: "manual",
            timezone: cfg.timezone,
          });
          return json({ ok: true, ...result });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return json({ error: msg }, { status: 500 });
        }
      },
    },

    "/*": () => new Response(Bun.file(join(PROJECT_ROOT, "index.html")), { headers: { "Content-Type": "text/html" } }),
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

await startDigestScheduler();

function ts() {
  return new Date().toISOString();
}

console.log(`\n  FondTracker`);
console.log(`  ───────────`);
console.log(`  url      ${server.url}`);
console.log(`  platform ${process.platform} · bun ${Bun.version}`);
console.log(`  mysql    ${process.env.MYSQL_HOST ?? "127.0.0.1"}:${process.env.MYSQL_PORT ?? 3306}`);
console.log(`  db       ${process.env.MYSQL_DATABASE ?? "fondtracker"}`);
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
    process.exit(0);
  } catch (err) {
    console.error(`[tracker] error durante el cierre:`, err);
    process.exit(1);
  }
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
