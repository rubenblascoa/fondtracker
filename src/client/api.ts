const TOKEN_KEY = "fondtracker_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage full or unavailable
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export type User = {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  created_at: string;
};

export type AuthResponse = {
  user: { id: number; username: string; email: string; phone: string | null };
  token: string;
};

export type FundCatalogEntry = {
  isin: string;
  name: string;
  bank: string;
  category: string;
  riskLevel: number;
  currency: string;
  yahooTicker: string | null;
};

export type FundSearchResult = {
  results: FundCatalogEntry[];
  total: number;
  banks: string[];
  categories: string[];
};

export type Investment = {
  id: number;
  isin: string;
  name: string;
  bank: string;
  category: string;
  ticker: string | null;
  shares: number;
  purchase_price: number;
  purchase_date: string;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  total_invested: number;
  current_value: number;
  profit_loss: number;
  profit_loss_pct: number;
  current_price: number | null;
};

export type YahooChartData = {
  symbol: string;
  currency: string;
  name: string;
  currentPrice: number;
  previousClose: number;
  weekHigh52: number;
  weekLow52: number;
  dataPoints: number;
  quotes: Array<{
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  dataDate?: string;       // DD/MM/YYYY (quefondos) or YYYY-MM-DD (yahoo)
  isStale?: boolean;       // true if data is > 3 business days old
  staleWarning?: string;   // human-readable warning
  dataSource?: "yahoo" | "quefondos";
  verificationLog?: string; // cross-source verification description
  return1Y?: number;
  return3Y?: number;
  return5Y?: number;
  ter?: number;
  sectors?: { name: string; weight: number }[];
  geography?: { name: string; weight: number }[];
  topHoldings?: { name: string; ticker?: string; weight: number }[];
};

export type Status = {
  total_initial: number;
  total_current: number;
  total_profit_loss: number;
  total_profit_loss_pct: number;
  fund_count: number;
  whatsapp: {
    enabled: boolean;
    configured: boolean;
    phone: string | null;
    timezone: string;
    cron: string;
    hours: number[];
    api_key?: string | null;
    lastSent: string | null;
    nextRunAt: string | null;
    lastTestAt: string | null;
    lastStatus: string | null;
  };
  platform: string;
};

export type DigestPreview = {
  message: string;
  messages: string[];
};

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (init?.headers) {
    const h =
      init.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : init.headers;
    Object.assign(headers, h);
  }

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor", 0);
  }

  if (res.status === 401) {
    clearToken();
    // Small delay so state can update before reload
    setTimeout(() => window.location.reload(), 100);
    throw new ApiError("Sesión expirada", 401);
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(
      data.error ?? `Error ${res.status}: ${res.statusText}`,
      res.status
    );
  }

  return (await res.json()) as T;
}

export const BANK_URLS: Record<string, string> = {
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
};

export function getBankUrl(bank: string): string | null {
  if (!bank) return null;
  const target = bank.toLowerCase().replace(/[^a-z0-9]/g, "");
  const matchKey = Object.keys(BANK_URLS).find((k) => {
    const keyNorm = k.toLowerCase().replace(/[^a-z0-9]/g, "");
    return keyNorm === target || keyNorm.includes(target) || target.includes(keyNorm);
  });
  return matchKey ? BANK_URLS[matchKey] : null;
}

export function getSpecificFundUrl(isin: string, bank: string, name: string): string {
  const normBank = (bank || "").toLowerCase().trim();
  const cleanIsin = (isin || "").toUpperCase().trim();
  const cleanName = (name || "").trim();

  // 1. Ibercaja specific dynamic routing
  if (normBank.includes("ibercaja")) {
    let slug = cleanName.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // remove accents

    // Clean common suffixes like " a fi", " fi a", " fi", " fi b"
    slug = slug.replace(/,?\s+fi\s+[a-z]$/g, "")
               .replace(/,?\s+[a-z]\s+fi$/g, "")
               .replace(/,?\s+fi$/g, "")
               .replace(/[^a-z0-9\s-]/g, "")
               .trim()
               .replace(/\s+/g, "-")
               .replace(/-+/g, "-");

    return `https://www.ibercaja.es/fondos-de-inversion/ficha/${slug}-fi/`;
  }

  // 2. Hardcoded exact pages for popular funds on the bank's main site
  const hardcoded: Record<string, string> = {
    "ES0109360000": "https://www.bancosantander.es/particulares/fondos-inversion/santander-dividendo-europa-clase-b-es0109360000",
    "ES0175224031": "https://www.bancosantander.es/particulares/fondos-inversion/santander-small-caps-espana-fi-clase-a-es0175224031",
    "ES0113691010": "https://www.abanca.com/es/fondos-inversion/abanca-ahorro/",
    "ES0113691002": "https://www.abanca.com/es/fondos-inversion/abanca-ahorro/",
    "ES0113691036": "https://www.abanca.com/es/fondos-inversion/abanca-ahorro/",
    "ES0106933007": "https://www.abanca.com/es/fondos-inversion/abanca-ahorro/",
    "ES0106933031": "https://www.abanca.com/es/fondos-inversion/abanca-ahorro/",
    "ES0106933023": "https://www.abanca.com/es/fondos-inversion/abanca-ahorro/",
    "ES0147597035": "https://www.abanca.com/es/fondos-inversion/abanca-bonos-corporativos/",
    "ES0147597019": "https://www.abanca.com/es/fondos-inversion/abanca-bonos-corporativos/",
    "ES0147597001": "https://www.abanca.com/es/fondos-inversion/abanca-bonos-corporativos/"
  };

  if (hardcoded[cleanIsin]) {
    return hardcoded[cleanIsin];
  }

  // 2. Known ETF managers search portals
  if (normBank.includes("ishares") || normBank.includes("blackrock")) {
    return `https://www.blackrock.com/es/productos/buscador-de-productos#!type=all&style=All&view=perf&search=${cleanIsin}`;
  }
  if (normBank.includes("vanguard")) {
    return `https://www.vanguard.com/es/productos/buscador-de-productos?search=${cleanIsin}`;
  }
  if (normBank.includes("amundi")) {
    return `https://www.amundi.es/particular/search/securities?q=${cleanIsin}`;
  }
  if (normBank.includes("dws") || normBank.includes("xtrackers")) {
    return `https://etf.dws.com/es-es/buscar/?q=${cleanIsin}`;
  }

  // 3. Known Spanish bank domains for Google Search redirect to exact page
  const domains: Record<string, string> = {
    "santander": "bancosantander.es",
    "bbva": "bbva.es",
    "caixabank": "caixabank.es",
    "bankinter": "bankinter.com",
    "sabadell": "bancsabadell.com",
    "kutxabank": "kutxabank.es",
    "ibercaja": "ibercaja.es",
    "unicaja": "unicajabanco.es",
    "abanca": "abanca.com",
    "ing": "ing.es",
    "openbank": "openbank.es",
    "myinvestor": "myinvestor.es",
    "renta 4": "r4.com",
    "bestinver": "bestinver.es",
    "cobas": "cobasam.com",
    "azvalor": "azvalor.com",
    "magallanes": "magallanesvalueinvestors.com"
  };

  for (const [key, domain] of Object.entries(domains)) {
    if (normBank.includes(key)) {
      return `https://www.google.com/search?q=site:${domain}+${cleanIsin}`;
    }
  }

  // 4. Default fallbacks
  const isIsin = /^[A-Z]{2}[A-Z0-9]{10}$/.test(cleanIsin);
  if (isIsin) {
    return `https://www.quefondos.com/es/fondos/ficha/index.html?isin=${cleanIsin}`;
  }

  return `https://finance.yahoo.com/quote/${encodeURIComponent(cleanIsin)}/`;
}

export const api = {
  register: (data: { username: string; email: string; password: string; phone?: string }) =>
    request<AuthResponse>("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  login: (data: { identifier: string; password: string }) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  me: () => request<User>("/api/auth/me"),

  status: () => request<Status>("/api/status"),

  searchFunds: (q: string, bank?: string, category?: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (bank) params.set("bank", bank);
    if (category) params.set("category", category);
    return request<FundSearchResult>(`/api/funds/search?${params}`);
  },

  getFundCatalog: (isin: string) =>
    request<FundCatalogEntry>(`/api/funds/catalog/${isin}`),

  getChartData: (ticker: string, range = "1y", interval = "1d") => {
    const url = `/api/funds/chart/${encodeURIComponent(ticker)}?range=${range}&interval=${interval}`;
    return request<YahooChartData>(url);
  },

  listFunds: () => request<Investment[]>("/api/funds"),

  /** Single request returning both funds and status — use instead of status()+listFunds() */
  portfolio: () =>
    request<{ funds: Investment[]; status: Status }>("/api/portfolio"),

  addFund: (data: {
    isin: string;
    shares: number;
    purchase_price: number;
    purchase_date: string;
    notes?: string;
  }) =>
    request<Investment>("/api/funds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  removeFund: (id: number) =>
    request<{ ok: true }>(`/api/funds/${id}`, { method: "DELETE" }),

  editFund: (
    id: number,
    data: {
      shares: number;
      purchase_price: number;
      purchase_date: string;
      notes?: string;
    }
  ) =>
    request<Investment>(`/api/funds/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  previewDigest: () => request<DigestPreview>("/api/notify/preview"),

  sendDigest: () =>
    request<{ ok: true; message: string; sent: number }>(
      "/api/notify/test",
      { method: "POST" }
    ),

  updateAccount: (data: { email?: string; currentEmail?: string; currentPassword?: string; newPassword?: string; phone?: string | null }) =>
    request<{ ok: true }>("/api/auth/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  deleteAccount: (password: string) =>
    request<{ ok: true }>("/api/auth/me", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }),

  getWhatsAppConfig: () =>
    request<Status["whatsapp"]>("/api/whatsapp/config", { method: "GET" }),

  updateWhatsAppConfig: (data: { api_key?: string; timezone?: string; enabled?: boolean; phone?: string; hours?: number[] }) =>
    request<{ ok: true }>("/api/whatsapp/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  testWhatsApp: () =>
    request<{ ok: true }>("/api/whatsapp/test", { method: "POST" }),
};
