import { digestStatus, previewDigest, runDigest, runScheduledDigest } from "../digest";
import { saveWhatsAppConfig, sendWhatsApp } from "../whatsapp";
import { queries } from "../db";
import {
  checkCSRF,
  getClientIp,
  rateLimit,
  tooManyRequests,
  badRequest,
  json,
  safeJson,
  safeError,
} from "../middleware/security.middleware";
import { requireUser } from "../middleware/auth.middleware";

const IS_PROD = process.env.NODE_ENV === "production";

export const notifyRoutes = {
  "/api/notify/preview": {
    async GET(req: Request) {
      const user = await requireUser(req);
      if (user instanceof Response) return user;
      const ip = getClientIp(req);
      if (rateLimit("notify-preview", ip, 10)) return tooManyRequests();
      const cfg = (await digestStatus(user.id)).config;
      const message = await previewDigest(
        {
          slot: "manual",
          timezone: cfg.timezone,
        },
        user.id
      );
      return json({ message, messages: [message] });
    },
  },

  "/api/whatsapp/config": {
    async GET(req: Request) {
      const user = await requireUser(req);
      if (user instanceof Response) return user;
      const digest = await digestStatus(user.id);
      return json({
        ...digest.config,
        lastSent: digest.lastSent,
        nextRunAt: digest.nextRunAt,
        lastTestAt: digest.lastTestAt,
        lastStatus: digest.lastStatus,
      });
    },

    async PUT(req: Request) {
      const user = await requireUser(req);
      if (user instanceof Response) return user;
      if (!checkCSRF(req)) return json({ error: "Origen no permitido" }, { status: 403 });
      try {
        const body = (await safeJson(req)) as {
          api_key?: string;
          timezone?: string;
          enabled?: boolean;
          phone?: string;
          hours?: number[];
        };
        await saveWhatsAppConfig(user.id, body);
        return json({ ok: true });
      } catch (err) {
        return badRequest(safeError(err));
      }
    },
  },

  "/api/whatsapp/test": {
    async POST(req: Request) {
      const user = await requireUser(req);
      if (user instanceof Response) return user;
      const ip = getClientIp(req);
      if (rateLimit("wa-test", ip, 3)) return tooManyRequests();
      try {
        const cfg = (await digestStatus(user.id)).config;
        if (!cfg.configured) {
          return badRequest("WhatsApp no configurado. Guarda primero tu número y API key.");
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
    async POST(req: Request) {
      const user = await requireUser(req);
      if (user instanceof Response) return user;
      try {
        const cfg = (await digestStatus(user.id)).config;
        if (!cfg.configured) {
          return badRequest("WhatsApp no configurado. Guarda primero tu número y API key.");
        }
        const result = await runDigest(
          {
            slot: "manual",
            timezone: cfg.timezone,
          },
          user.id
        );
        return json({ ok: true, ...result });
      } catch (err) {
        return json({ error: safeError(err) }, { status: 500 });
      }
    },
  },

  "/api/digest/trigger": {
    async POST(req: Request) {
      const secret = process.env.CRON_SECRET;
      if (!secret) return json({ error: "CRON_SECRET not configured" }, { status: 500 });
      const provided = req.headers.get("x-cron-secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");
      if (!provided || provided !== secret) return json({ error: "Unauthorized" }, { status: 401 });
      try {
        const before = Date.now();
        await runScheduledDigest();
        const elapsed = Date.now() - before;
        return json({ ok: true, elapsed_ms: elapsed });
      } catch (err) {
        console.error("[digest] trigger error:", err);
        return json({ error: "Digest execution failed" }, { status: 500 });
      }
    },

    async GET(req: Request) {
      const secret = process.env.CRON_SECRET;
      if (!secret) return json({ error: "CRON_SECRET not configured" }, { status: 500 });
      const url = new URL(req.url);
      const provided = url.searchParams.get("secret") ?? req.headers.get("x-cron-secret");
      if (!provided || provided !== secret) return json({ error: "Unauthorized" }, { status: 401 });
      try {
        const before = Date.now();
        await runScheduledDigest();
        const elapsed = Date.now() - before;
        return json({ ok: true, elapsed_ms: elapsed });
      } catch (err) {
        console.error("[digest] trigger error:", err);
        return json({ error: "Digest execution failed" }, { status: 500 });
      }
    },
  },
};
