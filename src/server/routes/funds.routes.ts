import { queries } from "../db";
import {
  listInvestments,
  getInvestmentWithStats,
  addInvestment,
  editInvestment,
  deleteInvestment,
  computePortfolioTotals,
} from "../sentinel";
import { fetchYahooChart, type YahooRange } from "../yahoo";
import { digestStatus } from "../digest";
import { computePortfolioAssetAllocation, getFundMetadata } from "../metadata";
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

export const fundRoutes = {
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
    async GET(req: Request) {
      const user = await requireUser(req);
      if (user instanceof Response) return user;

      const url = new URL(req.url);
      const q = url.searchParams.get("q") ?? "";
      const bank = url.searchParams.get("bank") ?? undefined;
      const category = url.searchParams.get("category") ?? undefined;

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
    async GET(req: Request) {
      const user = await requireUser(req);
      if (user instanceof Response) return user;
      const isin = (req as any).params?.isin;
      if (!isin || !/^[A-Z]{2}[A-Z0-9]{10}$/i.test(isin)) return badRequest("ISIN inválido");
      const fund = await queries.getFundCatalogByIsin(isin.toUpperCase());
      if (!fund) return json({ error: "fondo no encontrado" }, { status: 404 });
      return json(fund);
    },
  },

  "/api/funds/chart/:ticker": {
    async GET(req: Request) {
      const user = await requireUser(req);
      if (user instanceof Response) return user;
      const ticker = (req as any).params?.ticker;
      if (!ticker || (!/^[A-Z0-9.^=-]{1,20}$/i.test(ticker) && !/^[A-Z]{2}[A-Z0-9]{10}$/i.test(ticker))) {
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
    async GET(req: Request) {
      const user = await requireUser(req);
      if (user instanceof Response) return user;
      return json(await listInvestments(user.id));
    },

    async POST(req: Request) {
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
    async GET(req: Request) {
      const user = await requireUser(req);
      if (user instanceof Response) return user;
      const id = Number((req as any).params?.id);
      if (!Number.isFinite(id)) return badRequest("id inválido");
      const fund = await getInvestmentWithStats(id, user.id);
      if (!fund) return json({ error: "fondo no encontrado" }, { status: 404 });
      return json(fund);
    },

    async PUT(req: Request) {
      const user = await requireUser(req);
      if (user instanceof Response) return user;
      if (!checkCSRF(req)) return json({ error: "Origen no permitido" }, { status: 403 });
      if (rateLimit("funds-write", String(user.id), 30)) return tooManyRequests();
      const id = Number((req as any).params?.id);
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

    async DELETE(req: Request) {
      const user = await requireUser(req);
      if (user instanceof Response) return user;
      if (!checkCSRF(req)) return json({ error: "Origen no permitido" }, { status: 403 });
      if (rateLimit("funds-write", String(user.id), 30)) return tooManyRequests();
      const id = Number((req as any).params?.id);
      if (!Number.isFinite(id)) return badRequest("id inválido");
      const ok = await deleteInvestment(id, user.id);
      if (!ok) return json({ error: "fondo no encontrado" }, { status: 404 });
      return json({ ok: true });
    },
  },

  "/api/portfolio": {
    async GET(req: Request) {
      const user = await requireUser(req);
      if (user instanceof Response) return user;
      const ip = getClientIp(req);
      if (rateLimit("portfolio", ip, 30)) return tooManyRequests();
      const [investments, digest] = await Promise.all([
        listInvestments(user.id),
        digestStatus(user.id),
      ]);
      const totals = computePortfolioTotals(investments);
      const assetAllocation = computePortfolioAssetAllocation(investments);

      return json({
        funds: investments,
        status: {
          ...totals,
          whatsapp: {
            ...digest.config,
            lastSent: digest.lastSent,
            nextRunAt: digest.nextRunAt,
            lastTestAt: digest.lastTestAt,
            lastStatus: digest.lastStatus,
          },
        },
        assetAllocation,
      });
    },
  },
};
