import {
  addTransaction,
  removeTransaction,
  getFundTransactions,
} from "../transactions";
import { queries } from "../db";
import { getFundMetadata } from "../metadata";
import {
  checkCSRF,
  rateLimit,
  tooManyRequests,
  badRequest,
  json,
  safeJson,
  safeError,
} from "../middleware/security.middleware";
import { requireUser } from "../middleware/auth.middleware";

export const transactionRoutes = {
  "/api/funds/:id/transactions": {
    async GET(req: Request) {
      const user = await requireUser(req);
      if (user instanceof Response) return user;
      const fundId = Number((req as any).params?.id);
      if (!Number.isFinite(fundId) || fundId <= 0) return badRequest("ID de fondo inválido");

      try {
        const data = await getFundTransactions(user.id, fundId);
        return json(data);
      } catch (err) {
        return badRequest(safeError(err));
      }
    },

    async POST(req: Request) {
      const user = await requireUser(req);
      if (user instanceof Response) return user;
      if (!checkCSRF(req)) return json({ error: "Origen no permitido" }, { status: 403 });
      if (rateLimit("tx-write", String(user.id), 30)) return tooManyRequests();

      const fundId = Number((req as any).params?.id);
      if (!Number.isFinite(fundId) || fundId <= 0) return badRequest("ID de fondo inválido");

      try {
        const body = (await safeJson(req)) as {
          type?: "BUY" | "SELL" | "TRANSFER_IN" | "TRANSFER_OUT";
          shares?: number;
          price?: number;
          date?: string;
          fees?: number;
          notes?: string;
        };

        if (!body.shares || !Number.isFinite(body.shares) || body.shares <= 0) {
          return badRequest("El número de participaciones debe ser mayor que cero");
        }
        if (!body.price || !Number.isFinite(body.price) || body.price <= 0) {
          return badRequest("El precio liquidativo debe ser mayor que cero");
        }
        if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
          return badRequest("Formato de fecha inválido (YYYY-MM-DD)");
        }

        const result = await addTransaction(user.id, fundId, {
          type: body.type || "BUY",
          shares: Number(body.shares),
          price: Number(body.price),
          date: body.date,
          fees: body.fees != null ? Number(body.fees) : 0,
          notes: body.notes,
        });

        return json(result, { status: 201 });
      } catch (err) {
        return badRequest(safeError(err));
      }
    },
  },

  "/api/funds/:id/transactions/:txId": {
    async DELETE(req: Request) {
      const user = await requireUser(req);
      if (user instanceof Response) return user;
      if (!checkCSRF(req)) return json({ error: "Origen no permitido" }, { status: 403 });
      if (rateLimit("tx-write", String(user.id), 30)) return tooManyRequests();

      const fundId = Number((req as any).params?.id);
      const txId = Number((req as any).params?.txId);
      if (!Number.isFinite(fundId) || fundId <= 0) return badRequest("ID de fondo inválido");
      if (!Number.isFinite(txId) || txId <= 0) return badRequest("ID de transacción inválido");

      try {
        const summary = await removeTransaction(user.id, fundId, txId);
        return json({ ok: true, summary });
      } catch (err) {
        return badRequest(safeError(err));
      }
    },
  },

  "/api/funds/:isin/metadata": {
    async GET(req: Request) {
      const user = await requireUser(req);
      if (user instanceof Response) return user;
      const isin = ((req as any).params?.isin || "").toUpperCase().trim();
      if (!/^[A-Z]{2}[A-Z0-9]{10}$/.test(isin)) return badRequest("ISIN inválido");

      const meta = await getFundMetadata(isin);
      return json(meta);
    },

    async PUT(req: Request) {
      const user = await requireUser(req);
      if (user instanceof Response) return user;
      if (!checkCSRF(req)) return json({ error: "Origen no permitido" }, { status: 403 });

      const isin = ((req as any).params?.isin || "").toUpperCase().trim();
      if (!/^[A-Z]{2}[A-Z0-9]{10}$/.test(isin)) return badRequest("ISIN inválido");

      try {
        const body = (await safeJson(req)) as {
          ter?: number;
          category?: string;
          sectors?: { name: string; weight: number }[];
          geography?: { name: string; weight: number }[];
          topHoldings?: { name: string; ticker?: string; weight: number }[];
        };

        await queries.updateFundMetadata(isin, {
          ter: body.ter,
          category: body.category,
          sectors: body.sectors,
          geography: body.geography,
          topHoldings: body.topHoldings,
          isCustom: true,
        });

        const updated = await getFundMetadata(isin);
        return json({ ok: true, metadata: updated });
      } catch (err) {
        return badRequest(safeError(err));
      }
    },
  },
};
