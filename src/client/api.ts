const TOKEN_KEY = "fondtracker_token";
const COOKIE_KEY = "ft_session";
const authChannel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("ft_auth") : null;

export function getToken(): string | null {
  try {
    const fromSession = sessionStorage.getItem(TOKEN_KEY);
    if (fromSession) return fromSession;
    // Fallback: try to restore from cookie (cross-tab / fresh load)
    const match = document.cookie.match(/(?:^|;\s*)ft_session=([^;]+)/);
    if (match) {
      const token = decodeURIComponent(match[1]);
      try { sessionStorage.setItem(TOKEN_KEY, token); } catch {}
      return token;
    }
    return null;
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    // Also set a cookie so the server can inject user data on page load
    document.cookie = `${COOKIE_KEY}=${encodeURIComponent(token)}; path=/; SameSite=Strict; max-age=86400`;
    authChannel?.postMessage({ type: "login", token });
  } catch {
    // sessionStorage full or unavailable
  }
}

export function clearToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    // Clear cookie across paths to prevent ghost sessions
    document.cookie = `${COOKIE_KEY}=; path=/; SameSite=Strict; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `${COOKIE_KEY}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `${COOKIE_KEY}=; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    authChannel?.postMessage({ type: "logout" });
  } catch {
    // ignore
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore
  } finally {
    clearToken();
  }
}

export function onAuthChange(cb: (type: "login" | "logout", token?: string) => void): () => void {
  if (!authChannel) return () => {};
  const handler = (e: MessageEvent) => cb(e.data.type, e.data.token);
  authChannel.addEventListener("message", handler);
  return () => authChannel.removeEventListener("message", handler);
}

export type User = {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  is_admin: boolean;
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

export let BANK_URLS: Record<string, string> = {};

export function getBankUrl(bank: string): string | null {
  if (!bank) return null;
  const target = bank.toLowerCase().replace(/[^a-z0-9]/g, "");
  const matchKey = Object.keys(BANK_URLS).find((k) => {
    const keyNorm = k.toLowerCase().replace(/[^a-z0-9]/g, "");
    return keyNorm === target || keyNorm.includes(target) || target.includes(keyNorm);
  });
  return matchKey ? BANK_URLS[matchKey] : null;
}

export function getSpecificFundUrl(isin: string, bank?: string, name?: string): string {
  const normBank = typeof bank === "string" ? bank.toLowerCase().trim() : "";
  const cleanIsin = typeof isin === "string" ? isin.toUpperCase().trim() : "";
  const cleanName = typeof name === "string" ? name.trim() : "";

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

  getBanks: async () => {
    const res = await request<Record<string, string>>("/api/banks");
    BANK_URLS = res;
    return res;
  },

  // ─── Admin API ─────────────────────────────────────────────────────────────
  admin: {
    overview: () => request<any>("/api/admin/overview"),
    users: (search?: string, status?: string, offset?: number) => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (offset) params.set("offset", String(offset));
      return request<{ users: any[]; total: number }>(`/api/admin/users?${params}`);
    },
    deleteUser: (id: number) =>
      request<{ ok: true }>(`/api/admin/users/${id}/delete`, { method: "POST" }),
    restoreUser: (id: number) =>
      request<{ ok: true }>(`/api/admin/users/${id}/restore`, { method: "POST" }),
    promoteUser: (id: number, is_admin: boolean) =>
      request<{ ok: true }>(`/api/admin/users/${id}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_admin }),
      }),
    catalog: (q?: string) => {
      const params = q ? `?q=${encodeURIComponent(q)}` : "";
      return request<any>(`/api/admin/catalog${params}`);
    },
    updateTicker: (isin: string, ticker: string) =>
      request<{ ok: true }>(`/api/admin/catalog/${isin}/ticker`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker }),
      }),
    invalidatePrice: (isin: string) =>
      request<{ ok: true }>(`/api/admin/catalog/${isin}/invalidate-price`, { method: "POST" }),
    notifications: () => request<any>("/api/admin/notifications"),
    triggerDigest: () =>
      request<{ ok: true; message: string }>("/api/admin/notifications/trigger", { method: "POST" }),
    system: () => request<any>("/api/admin/system"),
  },

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

  whatsapp: {
    getConfig: () =>
      request<Status["whatsapp"]>("/api/whatsapp/config", { method: "GET" }),
    saveConfig: (data: { api_key?: string; timezone?: string; enabled?: boolean; phone?: string; hours?: number[] }) =>
      request<{ ok: true }>("/api/whatsapp/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    test: () =>
      request<{ ok: true }>("/api/whatsapp/test", { method: "POST" }),
    preview: () =>
      request<{ ok: true; message: string }>("/api/notify/preview"),
  },
};
