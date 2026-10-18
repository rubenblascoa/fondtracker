import {
  getAdminOverview,
  getAdminUsers,
  getAdminUserDetail,
  adminSoftDeleteUser,
  adminRestoreUser,
  adminSetAdmin,
  getAdminCatalogStats,
  adminSearchCatalog,
  adminAddCatalogFund,
  adminUpdateCatalogFund,
  adminDeleteCatalogFund,
  adminUpdateTicker,
  adminInvalidatePrice,
  adminRefreshFundPrice,
  adminRefreshAllPrices,
  getAdminNotificationStats,
  getAdminNotificationPreview,
  getActivityLogs,
  addActivityLog,
} from "../admin";
import { runScheduledDigest } from "../digest";
import { invalidatePriceCache } from "../sentinel";
import {
  badRequest,
  notFound,
  json,
  safeJson,
} from "../middleware/security.middleware";
import { requireAdmin } from "../middleware/auth.middleware";

export const adminRoutes = {
  "/api/admin/overview": {
    async GET(req: Request) {
      const admin = await requireAdmin(req);
      if (admin instanceof Response) return admin;
      const overview = await getAdminOverview();

      let customEnv: Record<string, string> = {};
      try {
        const fs = await import("fs");
        if (fs.existsSync(".env")) {
          const envContent = fs.readFileSync(".env", "utf-8");
          const lines = envContent.split("\n");
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith("#")) {
              const parts = trimmed.split("=");
              if (parts.length > 0) {
                const key = parts[0].trim();
                customEnv[key] = process.env[key] || "";
              }
            }
          }
        }
      } catch {}

      return json({
        ...overview,
        uptime: Math.round(process.uptime()),
        node_env: process.env.NODE_ENV || "development",
        bun_version: process.versions?.bun || "N/A",
        price_cache_size: overview.cached_prices,
        env: customEnv,
      });
    },
  },

  "/api/admin/users": {
    async GET(req: Request) {
      const admin = await requireAdmin(req);
      if (admin instanceof Response) return admin;
      const url = new URL(req.url);
      const search = url.searchParams.get("search") ?? undefined;
      const status = url.searchParams.get("status") ?? undefined;
      const offset = Number(url.searchParams.get("offset") ?? 0);
      return json(await getAdminUsers(search, status, 50, offset));
    },
  },

  "/api/admin/users/:id/test-whatsapp": {
    async POST(req: Request) {
      const admin = await requireAdmin(req);
      if (admin instanceof Response) return admin;
      const id = Number((req as any).params?.id);
      if (!Number.isFinite(id) || id <= 0) return badRequest("ID inválido");
      try {
        const detail = await getAdminUserDetail(id);
        if (!detail) return notFound("Usuario no encontrado");
        const phone = detail.whatsapp.phone;
        if (!phone) return badRequest("El usuario no tiene teléfono registrado");

        const { sendWhatsAppDirect } = await import("../whatsapp");
        const msg = `🔔 *FondTracker Admin Test*\n\nHola *${detail.user.username}*, este es un mensaje de prueba emitido desde el Panel de Administración.\n\n✅ Tu canal de notificaciones está operativo.`;
        const res = await sendWhatsAppDirect(phone, msg);
        addActivityLog("DIGEST_TRIGGER", `Enviado WhatsApp de prueba al usuario ${detail.user.username} (${phone})`);
        return json({ ok: true, sent_to: phone, response: res });
      } catch (e: any) {
        return json({ error: e?.message || "Error al enviar WhatsApp" }, { status: 500 });
      }
    },
  },

  "/api/admin/users/:id/delete": {
    async POST(req: Request) {
      const admin = await requireAdmin(req);
      if (admin instanceof Response) return admin;
      const id = Number((req as any).params?.id);
      if (!Number.isFinite(id) || id <= 0) return badRequest("ID inválido");
      if (id === admin.id) return json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 });
      try {
        await adminSoftDeleteUser(id);
        return json({ ok: true });
      } catch (e: any) {
        return json({ error: e?.message || "Error al eliminar usuario" }, { status: 500 });
      }
    },
  },

  "/api/admin/users/:id/restore": {
    async POST(req: Request) {
      const admin = await requireAdmin(req);
      if (admin instanceof Response) return admin;
      const id = Number((req as any).params?.id);
      if (!Number.isFinite(id) || id <= 0) return badRequest("ID inválido");
      try {
        await adminRestoreUser(id);
        return json({ ok: true });
      } catch (e: any) {
        return json({ error: e?.message || "Error al restaurar usuario" }, { status: 500 });
      }
    },
  },

  "/api/admin/users/:id/promote": {
    async POST(req: Request) {
      const admin = await requireAdmin(req);
      if (admin instanceof Response) return admin;
      const id = Number((req as any).params?.id);
      if (!Number.isFinite(id) || id <= 0) return badRequest("ID inválido");
      const body = (await safeJson(req)) as { is_admin: boolean };
      if (id === admin.id && !body.is_admin) return json({ error: "No puedes quitarte el rol de admin" }, { status: 400 });
      try {
        await adminSetAdmin(id, body.is_admin);
        return json({ ok: true });
      } catch (e: any) {
        return json({ error: e?.message || "Error al modificar rol" }, { status: 500 });
      }
    },
  },

  "/api/admin/users/:id": {
    async GET(req: Request) {
      const admin = await requireAdmin(req);
      if (admin instanceof Response) return admin;
      const id = Number((req as any).params?.id);
      if (!Number.isFinite(id) || id <= 0) return badRequest("ID de usuario inválido");
      try {
        const detail = await getAdminUserDetail(id);
        if (!detail) return notFound("Usuario no encontrado");
        return json(detail);
      } catch (err: any) {
        console.error("[admin] error getting user detail:", err);
        return json({ error: err?.message || "Error al obtener detalle del usuario" }, { status: 500 });
      }
    },
  },

  "/api/admin/catalog": {
    async GET(req: Request) {
      const admin = await requireAdmin(req);
      if (admin instanceof Response) return admin;
      const url = new URL(req.url);
      const q = url.searchParams.get("q") ?? "";
      if (q) {
        const results = await adminSearchCatalog(q);
        return json({ results });
      }
      return json(await getAdminCatalogStats());
    },

    async POST(req: Request) {
      const admin = await requireAdmin(req);
      if (admin instanceof Response) return admin;
      const body = (await safeJson(req)) as any;
      if (!body.isin || !/^[A-Z]{2}[A-Z0-9]{10}$/i.test(body.isin)) {
        return badRequest("ISIN inválido (formato esperado: 12 caracteres alfanuméricos)");
      }
      if (!body.name || body.name.trim().length === 0) {
        return badRequest("El nombre del fondo es obligatorio");
      }
      const res = await adminAddCatalogFund(body);
      return json(res, { status: 201 });
    },
  },

  "/api/admin/catalog-refresh-all": {
    async POST(req: Request) {
      const admin = await requireAdmin(req);
      if (admin instanceof Response) return admin;
      try {
        const res = await adminRefreshAllPrices();
        return json(res);
      } catch (e: any) {
        return json({ error: e?.message || "Error al refrescar precios" }, { status: 500 });
      }
    },
  },

  "/api/admin/catalog/refresh-all-prices": {
    async POST(req: Request) {
      const admin = await requireAdmin(req);
      if (admin instanceof Response) return admin;
      try {
        const res = await adminRefreshAllPrices();
        return json(res);
      } catch (e: any) {
        return json({ error: e?.message || "Error al refrescar precios" }, { status: 500 });
      }
    },
  },

  "/api/admin/catalog/:isin/ticker": {
    async PUT(req: Request) {
      const admin = await requireAdmin(req);
      if (admin instanceof Response) return admin;
      const isin = ((req as any).params?.isin || "").toUpperCase();
      if (!/^[A-Z]{2}[A-Z0-9]{10}$/.test(isin)) return badRequest("ISIN inválido");
      const body = (await safeJson(req)) as { ticker?: string };
      try {
        await adminUpdateTicker(isin, body.ticker ?? null);
        return json({ ok: true });
      } catch (e: any) {
        return json({ error: e?.message || "Error al actualizar ticker" }, { status: 500 });
      }
    },
  },

  "/api/admin/catalog/:isin/refresh-price": {
    async POST(req: Request) {
      const admin = await requireAdmin(req);
      if (admin instanceof Response) return admin;
      const isin = ((req as any).params?.isin || "").toUpperCase();
      if (!/^[A-Z]{2}[A-Z0-9]{10}$/.test(isin)) return badRequest("ISIN inválido");
      try {
        const res = await adminRefreshFundPrice(isin);
        return json(res);
      } catch (e: any) {
        return json({ error: e?.message || "No se pudo actualizar el precio" }, { status: 400 });
      }
    },
  },

  "/api/admin/catalog/:isin/invalidate-price": {
    async POST(req: Request) {
      const admin = await requireAdmin(req);
      if (admin instanceof Response) return admin;
      const isin = ((req as any).params?.isin || "").toUpperCase();
      if (!/^[A-Z]{2}[A-Z0-9]{10}$/.test(isin)) return badRequest("ISIN inválido");
      try {
        await adminInvalidatePrice(isin);
        invalidatePriceCache(isin);
        return json({ ok: true });
      } catch (e: any) {
        return json({ error: e?.message || "Error al invalidar precio" }, { status: 500 });
      }
    },
  },

  "/api/admin/catalog/:isin": {
    async PUT(req: Request) {
      const admin = await requireAdmin(req);
      if (admin instanceof Response) return admin;
      const isin = ((req as any).params?.isin || "").toUpperCase();
      if (!/^[A-Z]{2}[A-Z0-9]{10}$/.test(isin)) return badRequest("ISIN inválido");
      const body = (await safeJson(req)) as any;
      try {
        const res = await adminUpdateCatalogFund(isin, body);
        return json(res);
      } catch (e: any) {
        return json({ error: e?.message || "Error al actualizar fondo" }, { status: 500 });
      }
    },

    async DELETE(req: Request) {
      const admin = await requireAdmin(req);
      if (admin instanceof Response) return admin;
      const isin = ((req as any).params?.isin || "").toUpperCase();
      if (!/^[A-Z]{2}[A-Z0-9]{10}$/.test(isin)) return badRequest("ISIN inválido");
      try {
        const res = await adminDeleteCatalogFund(isin);
        return json(res);
      } catch (e: any) {
        return json({ error: e?.message || "Error al eliminar fondo" }, { status: 400 });
      }
    },
  },

  "/api/admin/notifications": {
    async GET(req: Request) {
      const admin = await requireAdmin(req);
      if (admin instanceof Response) return admin;
      try {
        return json(await getAdminNotificationStats());
      } catch (e: any) {
        return json({ error: e?.message || "Error al obtener estadísticas de notificaciones" }, { status: 500 });
      }
    },
  },

  "/api/admin/notifications/preview": {
    async GET(req: Request) {
      const admin = await requireAdmin(req);
      if (admin instanceof Response) return admin;
      try {
        return json(await getAdminNotificationPreview());
      } catch (e: any) {
        return json({ error: e?.message || "Error al generar vista previa" }, { status: 500 });
      }
    },
  },

  "/api/admin/notifications/preview/:id": {
    async GET(req: Request) {
      const admin = await requireAdmin(req);
      if (admin instanceof Response) return admin;
      const id = Number((req as any).params?.id);
      if (!Number.isFinite(id) || id <= 0) return badRequest("ID inválido");
      try {
        return json(await getAdminNotificationPreview(id));
      } catch (e: any) {
        return json({ error: e?.message || "Error al generar vista previa" }, { status: 500 });
      }
    },
  },

  "/api/admin/notifications/trigger": {
    async POST(req: Request) {
      const admin = await requireAdmin(req);
      if (admin instanceof Response) return admin;
      addActivityLog("DIGEST_TRIGGER", `Disparado envío de WhatsApp global por admin ${admin.username}`);
      void runScheduledDigest(true);
      return json({ ok: true, message: "Digest global iniciado" });
    },
  },

  "/api/admin/activity-logs": {
    async GET(req: Request) {
      const admin = await requireAdmin(req);
      if (admin instanceof Response) return admin;
      return json({ logs: getActivityLogs() });
    },
  },

  "/api/admin/system": {
    async GET(req: Request) {
      const admin = await requireAdmin(req);
      if (admin instanceof Response) return admin;
      const { priceCache } = (await import("../sentinel")) as any;
      const mem = process.memoryUsage ? process.memoryUsage() : { rss: 0, heapUsed: 0, heapTotal: 0 };
      return json({
        uptime: Math.round(process.uptime()),
        bun_version: typeof Bun !== "undefined" ? Bun.version : process.versions?.node || "N/A",
        platform: process.platform,
        pid: process.pid,
        memory_rss_mb: Math.round(mem.rss / (1024 * 1024)),
        memory_heap_mb: Math.round(mem.heapUsed / (1024 * 1024)),
        node_env: process.env.NODE_ENV ?? "development",
        price_cache_size: (priceCache as Map<any, any>)?.size ?? 0,
        cron_secret_set: Boolean(process.env.CRON_SECRET),
        jwt_default: process.env.JWT_SECRET === "fondtracker-dev-secret-change-in-prod",
        admin_emails_set: Boolean(process.env.ADMIN_EMAILS),
        cloudflare_beacon_set: Boolean(process.env.CLOUDFLARE_BEACON_TOKEN),
      });
    },
  },

  "/api/admin/system/clear-cache": {
    async POST(req: Request) {
      const admin = await requireAdmin(req);
      if (admin instanceof Response) return admin;
      invalidatePriceCache();
      addActivityLog("CACHE_CLEAR", `Caché en memoria purgada por admin ${admin.username}`);
      return json({ ok: true, message: "Caché de precios purgada correctamente" });
    },
  },
};
