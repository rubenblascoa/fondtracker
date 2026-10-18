import { useMemo, useState } from "react";
import { Check, Copy, Database, Play, Search, Server, ShieldCheck, Smartphone } from "lucide-react";
import { getToken } from "../api";
import { Card, Label, Tag } from "./ui";

// Documentación de la API de FondTracker. Cada ruta, protección y límite sale del código
// del servidor (src/server/index.ts y src/server/routes/*.ts); al cambiar una ruta, actualízala aquí.

type Method = "GET" | "POST" | "PUT" | "DELETE";
type Access = "público" | "usuario" | "admin" | "cron";
type Endpoint = {
  method: Method;
  path: string;
  access: Access;
  description: string;
  /** Límite por minuto (por IP o por usuario) */
  limit?: number;
  /** Comprueba Origin/Referer contra ALLOWED_ORIGIN */
  csrf?: boolean;
  params?: string;
  body?: string;
  returns?: string;
};

const GROUPS: { title: string; endpoints: Endpoint[] }[] = [
  {
    title: "Cuenta y acceso",
    endpoints: [
      { method: "POST", path: "/api/auth/register", access: "público", csrf: true, limit: 5, description: "Crea una cuenta.", body: '{ "username", "email", "password", "phone"? }', returns: "{ user, token }" },
      { method: "POST", path: "/api/auth/login", access: "público", csrf: true, limit: 10, description: "Entra con email o usuario.", body: '{ "identifier", "password" }', returns: "{ user, token }" },
      { method: "POST", path: "/api/auth/logout", access: "público", description: "Cierra la sesión y borra la cookie ft_session." },
      { method: "GET", path: "/api/auth/google", access: "público", description: "Empieza el acceso con Google (redirección OAuth)." },
      { method: "GET", path: "/api/auth/google/callback", access: "público", description: "Vuelta de Google: crea o enlaza la cuenta y deja la sesión iniciada." },
      { method: "GET", path: "/api/auth/github", access: "público", description: "Empieza el acceso con GitHub (redirección OAuth)." },
      { method: "GET", path: "/api/auth/github/callback", access: "público", description: "Vuelta de GitHub: crea o enlaza la cuenta y deja la sesión iniciada." },
      { method: "GET", path: "/api/auth/me", access: "usuario", limit: 30, description: "Perfil del usuario.", returns: "{ id, username, display_name, email, phone, is_admin, created_at }" },
      {
        method: "PUT",
        path: "/api/auth/me",
        access: "usuario",
        csrf: true,
        limit: 5,
        description: "Actualiza el perfil. Cada campo es opcional; el límite de 5/min aplica al cambio de contraseña.",
        body: '{ "display_name"?, "phone"?, "currentEmail"? + "email"?, "currentPassword"? + "newPassword"? }',
        returns: "{ ok: true }",
      },
      { method: "DELETE", path: "/api/auth/me", access: "usuario", csrf: true, description: "Desactiva la cuenta: marca deleted_at en el usuario y en sus fondos, y borra su fund_history.", body: '{ "password" }', returns: "{ ok: true }" },
    ],
  },
  {
    title: "Cartera",
    endpoints: [
      { method: "GET", path: "/api/portfolio", access: "usuario", limit: 30, description: "Fondos del usuario con su valor actual y los totales, en una sola llamada.", returns: "{ funds: Investment[], status }" },
      { method: "GET", path: "/api/portfolio/history", access: "usuario", limit: 20, params: "range = 1m | 3m | 6m | 1y | max", description: "Evolución del patrimonio: fotos diarias guardadas y, antes de la primera, reconstrucción con precios históricos.", returns: '{ points: [{ date, invested, value }], source: "snapshots" | "reconstructed" | "mixed" }' },
      { method: "GET", path: "/api/funds", access: "usuario", description: "Fondos del usuario (sin totales)." },
      { method: "POST", path: "/api/funds", access: "usuario", csrf: true, limit: 30, description: "Añade un fondo con lo que dice el extracto del banco.", body: '{ "isin", "name", "shares", "purchase_price", "purchase_date", "bank"?, "category"?, "ticker"?, "notes"? }' },
      { method: "GET", path: "/api/funds/:id", access: "usuario", description: "Un fondo del usuario." },
      { method: "PUT", path: "/api/funds/:id", access: "usuario", csrf: true, description: "Edita un fondo. Si solo tiene la compra inicial, también la actualiza; con más movimientos se editan desde ellos.", body: '{ "shares"?, "purchase_price"?, "purchase_date"?, "notes"? … }' },
      { method: "DELETE", path: "/api/funds/:id", access: "usuario", csrf: true, description: "Borra el fondo y, con él, todos sus movimientos." },
      { method: "GET", path: "/api/funds/:id/transactions", access: "usuario", description: "Movimientos del fondo y su precio medio ponderado.", returns: "{ transactions, summary: { currentShares, pmp, totalCostBasis, … } }" },
      { method: "POST", path: "/api/funds/:id/transactions", access: "usuario", csrf: true, description: "Añade una compra, venta o traspaso.", body: '{ "type": "BUY" | "SELL" | "TRANSFER_IN" | "TRANSFER_OUT", "shares", "price", "date", "fees"?, "notes"? }' },
      { method: "DELETE", path: "/api/funds/:id/transactions/:txId", access: "usuario", csrf: true, description: "Borra un movimiento y recalcula el fondo." },
    ],
  },
  {
    title: "Fondos y precios",
    endpoints: [
      { method: "GET", path: "/api/funds/search", access: "usuario", params: "q, bank?, category?", description: "Busca en el catálogo por nombre o ISIN." },
      { method: "GET", path: "/api/funds/catalog/:isin", access: "usuario", description: "Ficha de un fondo del catálogo." },
      { method: "GET", path: "/api/funds/chart/:ticker", access: "usuario", params: "range = 1d | 5d | 1mo | 3mo | 6mo | 1y | 2y | 5y | max, interval?", description: "Precio actual y serie histórica de un fondo (por ISIN) o ETF (ticker de Yahoo).", returns: "{ currentPrice, dataDate, quotes, return1Y, return3Y, return5Y, dataSource, … }" },
      { method: "GET", path: "/api/banks", access: "público", description: "Entidades presentes en el catálogo." },
      { method: "GET", path: "/api/health", access: "público", description: "Estado del servidor." },
    ],
  },
  {
    title: "Avisos por WhatsApp",
    endpoints: [
      { method: "GET", path: "/api/whatsapp/config", access: "usuario", description: "Configuración del resumen: teléfono, clave de CallMeBot, horas y zona horaria." },
      { method: "PUT", path: "/api/whatsapp/config", access: "usuario", csrf: true, description: "Guarda la configuración del resumen." },
      { method: "POST", path: "/api/whatsapp/test", access: "usuario", limit: 3, description: "Envía un mensaje de prueba." },
      { method: "GET", path: "/api/notify/preview", access: "usuario", limit: 10, description: "Vista previa del resumen que se enviaría ahora." },
      { method: "POST", path: "/api/notify/test", access: "usuario", description: "Envía el resumen completo ahora." },
      { method: "GET", path: "/api/digest/trigger", access: "cron", params: "secret (o cabecera x-cron-secret)", description: "Lanza el envío programado. Pensado para un cron externo; exige CRON_SECRET." },
      { method: "POST", path: "/api/digest/trigger", access: "cron", description: "Igual que el GET, por POST." },
    ],
  },
  {
    title: "Administración",
    endpoints: [
      { method: "GET", path: "/api/admin/overview", access: "admin", description: "Cifras generales de la plataforma." },
      { method: "GET", path: "/api/admin/users", access: "admin", params: "search?, status?, offset?", description: "Usuarios, con búsqueda y paginación." },
      { method: "GET", path: "/api/admin/users/:id", access: "admin", description: "Detalle de un usuario y su cartera." },
      { method: "POST", path: "/api/admin/users/:id/test-whatsapp", access: "admin", description: "Envía un WhatsApp de prueba a ese usuario." },
      { method: "POST", path: "/api/admin/users/:id/promote", access: "admin", description: "Da o quita permisos de administración.", body: '{ "is_admin": boolean }' },
      { method: "POST", path: "/api/admin/users/:id/delete", access: "admin", description: "Desactiva la cuenta (borrado lógico)." },
      { method: "POST", path: "/api/admin/users/:id/restore", access: "admin", description: "Reactiva una cuenta desactivada." },
      { method: "GET", path: "/api/admin/catalog", access: "admin", params: "q?, bank?, page?, limit?", description: "Catálogo de fondos." },
      { method: "POST", path: "/api/admin/catalog", access: "admin", description: "Añade un fondo al catálogo." },
      { method: "PUT", path: "/api/admin/catalog/:isin", access: "admin", description: "Edita un fondo del catálogo." },
      { method: "DELETE", path: "/api/admin/catalog/:isin", access: "admin", description: "Quita un fondo del catálogo." },
      { method: "PUT", path: "/api/admin/catalog/:isin/ticker", access: "admin", description: "Fija el ticker de Yahoo de un fondo." },
      { method: "POST", path: "/api/admin/catalog/:isin/refresh-price", access: "admin", description: "Vuelve a pedir el precio de un fondo." },
      { method: "POST", path: "/api/admin/catalog/:isin/invalidate-price", access: "admin", description: "Descarta el precio guardado de un fondo." },
      { method: "POST", path: "/api/admin/catalog/refresh-all-prices", access: "admin", description: "Actualiza el precio de todo el catálogo." },
      { method: "POST", path: "/api/admin/catalog-refresh-all", access: "admin", description: "Refresca los datos del catálogo." },
      { method: "GET", path: "/api/admin/notifications", access: "admin", description: "Estado de los envíos de WhatsApp." },
      { method: "GET", path: "/api/admin/notifications/preview", access: "admin", description: "Vista previa de los resúmenes de todos los usuarios." },
      { method: "GET", path: "/api/admin/notifications/preview/:id", access: "admin", description: "Vista previa del resumen de un usuario." },
      { method: "POST", path: "/api/admin/notifications/trigger", access: "admin", description: "Lanza el envío de resúmenes ahora." },
      { method: "GET", path: "/api/admin/activity-logs", access: "admin", description: "Registro de actividad." },
      { method: "GET", path: "/api/admin/system", access: "admin", description: "Estado del servidor, la base de datos y las cachés." },
      { method: "POST", path: "/api/admin/system/clear-cache", access: "admin", csrf: true, description: "Vacía las cachés en memoria." },
    ],
  },
];

const TABLES: { name: string; purpose: string; columns: string }[] = [
  { name: "users", purpose: "Cuentas", columns: "id PK, username, display_name?, email, password_hash?, google_id?, github_id?, phone?, is_admin, created_at, deleted_at?" },
  { name: "investments", purpose: "Fondos de cada usuario (posición actual)", columns: "id PK, user_id, isin, name, bank, category, ticker?, shares, purchase_price, purchase_date, currency, notes?, created_at, updated_at, deleted_at?" },
  { name: "fund_transactions", purpose: "Compras, ventas y traspasos", columns: "id PK, user_id, fund_id → investments, type, shares, price, amount, date, fees, notes?, created_at" },
  { name: "portfolio_snapshots", purpose: "Foto diaria del patrimonio", columns: "(user_id, snap_date) PK, invested, value" },
  { name: "fund_catalog", purpose: "Catálogo de fondos buscables", columns: "id PK, isin UNIQUE, name, bank, category, risk_level, currency, yahoo_ticker?" },
  { name: "fund_prices", purpose: "Último precio conocido por ISIN", columns: "isin PK → fund_catalog, price, currency, updated_at" },
  { name: "fund_history", purpose: "Valores guardados de cada fondo", columns: "id PK, fund_id → investments, value, recorded_at" },
  { name: "settings", purpose: "Configuración (WhatsApp, horas, zona horaria…)", columns: "setting_key PK, setting_value" },
];

const METHOD_TONE: Record<Method, string> = {
  GET: "bg-emerald-500/12 text-emerald-400",
  POST: "bg-sky-500/12 text-sky-400",
  PUT: "bg-amber-500/12 text-amber-400",
  DELETE: "bg-red-500/12 text-red-400",
};
const ACCESS_TONE: Record<Access, "neutral" | "accent" | "loss" | "profit"> = { público: "neutral", usuario: "accent", admin: "loss", cron: "profit" };

type Section = "endpoints" | "how" | "database" | "whatsapp";
const SECTIONS: { id: Section; label: string; icon: typeof Server }[] = [
  { id: "endpoints", label: "Endpoints", icon: Server },
  { id: "how", label: "Cómo funciona", icon: ShieldCheck },
  { id: "database", label: "Base de datos", icon: Database },
  { id: "whatsapp", label: "Avisos por WhatsApp", icon: Smartphone },
];

function Code({ children }: { children: string }) {
  return <code className="rounded-md bg-[var(--color-surface)] px-1.5 py-0.5 font-mono text-[12px] text-[var(--color-fg-1)]">{children}</code>;
}

export function DocsTab() {
  const [section, setSection] = useState<Section>("endpoints");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [consolePath, setConsolePath] = useState("/api/portfolio");
  const [consoleState, setConsoleState] = useState<{ loading: boolean; status?: number; ms?: number; body?: string }>({ loading: false });

  const total = GROUPS.reduce((n, g) => n + g.endpoints.length, 0);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GROUPS;
    return GROUPS.map((g) => ({
      ...g,
      endpoints: g.endpoints.filter((e) => `${e.method} ${e.path} ${e.description} ${e.access}`.toLowerCase().includes(q)),
    })).filter((g) => g.endpoints.length > 0);
  }, [query]);

  // Rutas GET de usuario sin parámetros de ruta: se pueden probar con la sesión actual
  const testable = GROUPS.flatMap((g) => g.endpoints).filter((e) => e.method === "GET" && e.access !== "cron" && !e.path.includes(":") && !/(google|github)/.test(e.path));

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1600);
  };

  const runConsole = async () => {
    setConsoleState({ loading: true });
    const t0 = performance.now();
    try {
      const token = getToken();
      const res = await fetch(consolePath, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const text = await res.text();
      let body = text;
      try {
        body = JSON.stringify(JSON.parse(text), null, 2);
      } catch {}
      setConsoleState({ loading: false, status: res.status, ms: Math.round(performance.now() - t0), body: body.length > 20000 ? body.slice(0, 20000) + "\n…" : body });
    } catch (err) {
      setConsoleState({ loading: false, status: 0, ms: Math.round(performance.now() - t0), body: err instanceof Error ? err.message : "Error de red" });
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-5 fade-in">
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
              section === id ? "bg-[var(--color-fg-1)] text-[var(--color-ink-0)]" : "border border-[var(--color-border)] text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)]"
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {section === "endpoints" && (
        <>
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-fg-1)]">Probar con tu sesión</h2>
                <p className="text-xs text-[var(--color-fg-4)]">Lanza una petición GET con tu token actual y mira la respuesta real.</p>
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                <select
                  value={consolePath}
                  onChange={(e) => setConsolePath(e.target.value)}
                  className="min-w-0 flex-1 rounded-full border border-[var(--color-border)] bg-[var(--color-ink-2)] px-4 py-2 font-mono text-xs text-[var(--color-fg-1)] outline-none sm:w-72"
                >
                  {testable.map((e) => (
                    <option key={e.path} value={e.path}>
                      GET {e.path}
                    </option>
                  ))}
                </select>
                <button
                  onClick={runConsole}
                  disabled={consoleState.loading}
                  className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--color-btn-bg)] px-4 py-2 text-[13px] font-semibold text-[var(--color-btn-fg)] hover:opacity-85 disabled:opacity-50"
                >
                  <Play size={14} /> {consoleState.loading ? "Enviando…" : "Enviar"}
                </button>
              </div>
            </div>
            {consoleState.body !== undefined && (
              <div className="mt-4">
                <p className="mb-2 font-mono text-[11px] text-[var(--color-fg-4)]">
                  <span className={consoleState.status && consoleState.status < 400 ? "text-[var(--color-profit)]" : "text-[var(--color-loss)]"}>{consoleState.status || "ERR"}</span> · {consoleState.ms} ms
                </p>
                <pre className="max-h-80 overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-ink-0)] p-4 font-mono text-[11px] leading-relaxed text-[var(--color-fg-2)]">{consoleState.body}</pre>
              </div>
            )}
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--color-fg-3)]">
              {total} rutas. Las de <b className="text-[var(--color-fg-1)]">usuario</b> y <b className="text-[var(--color-fg-1)]">admin</b> piden la cabecera <Code>Authorization: Bearer &lt;token&gt;</Code>.
            </p>
            <label className="relative w-full sm:w-72">
              <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-fg-4)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar ruta o descripción…"
                aria-label="Buscar endpoint"
                className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-ink-2)] py-2 pl-9 pr-4 text-sm text-[var(--color-fg-1)] outline-none focus:border-[var(--color-accent)]"
              />
            </label>
          </div>

          {filtered.map((group) => (
            <Card key={group.title} padded={false}>
              <h2 className="px-5 pb-3 pt-5 text-base font-semibold text-[var(--color-fg-1)]">{group.title}</h2>
              <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
                {group.endpoints.map((e) => {
                  const id = `${e.method} ${e.path}`;
                  const curl = `curl -X ${e.method} "${origin}${e.path}"${e.access === "usuario" || e.access === "admin" ? ' -H "Authorization: Bearer $TOKEN"' : ""}${e.body ? ` -H "Content-Type: application/json" -d '{…}'` : ""}`;
                  return (
                    <li key={id} className="px-5 py-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`w-16 shrink-0 rounded-md py-0.5 text-center font-mono text-[11px] font-bold ${METHOD_TONE[e.method]}`}>{e.method}</span>
                        <code className="min-w-0 break-all font-mono text-[13px] text-[var(--color-fg-1)]">{e.path}</code>
                        <span className="ml-auto flex items-center gap-1.5">
                          {e.limit && <Tag tone="neutral">{e.limit}/min</Tag>}
                          {e.csrf && <Tag tone="neutral">CSRF</Tag>}
                          <Tag tone={ACCESS_TONE[e.access]}>{e.access}</Tag>
                          <button onClick={() => copy(curl, id)} title="Copiar como curl" className="rounded-lg p-1.5 text-[var(--color-fg-4)] hover:bg-[var(--color-surface)] hover:text-[var(--color-fg-1)]">
                            {copied === id ? <Check size={14} className="text-[var(--color-profit)]" /> : <Copy size={14} />}
                          </button>
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-[var(--color-fg-3)] sm:pl-[4.5rem]">{e.description}</p>
                      {(e.params || e.body || e.returns) && (
                        <dl className="mt-2 grid gap-1 text-xs sm:pl-[4.5rem]">
                          {e.params && (
                            <div className="flex gap-2">
                              <dt className="w-20 shrink-0 text-[var(--color-fg-4)]">Parámetros</dt>
                              <dd className="font-mono text-[var(--color-fg-2)]">{e.params}</dd>
                            </div>
                          )}
                          {e.body && (
                            <div className="flex gap-2">
                              <dt className="w-20 shrink-0 text-[var(--color-fg-4)]">Cuerpo</dt>
                              <dd className="break-all font-mono text-[var(--color-fg-2)]">{e.body}</dd>
                            </div>
                          )}
                          {e.returns && (
                            <div className="flex gap-2">
                              <dt className="w-20 shrink-0 text-[var(--color-fg-4)]">Devuelve</dt>
                              <dd className="break-all font-mono text-[var(--color-fg-2)]">{e.returns}</dd>
                            </div>
                          )}
                        </dl>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
          {filtered.length === 0 && <p className="text-sm text-[var(--color-fg-4)]">Ninguna ruta coincide con «{query}».</p>}
        </>
      )}

      {section === "how" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <Label>Autenticación</Label>
            <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-[var(--color-fg-2)]">
              <li>Al entrar o registrarte, la API devuelve un <b>token JWT</b>. El panel lo guarda en la pestaña y en la cookie <Code>ft_session</Code>.</li>
              <li>Las rutas protegidas leen la cabecera <Code>Authorization: Bearer &lt;token&gt;</Code>.</li>
              <li>En cada petición se vuelve a mirar en la base de datos si la cuenta existe y si es administradora, así que quitar permisos surte efecto al momento.</li>
              <li>También se puede entrar con Google o GitHub (OAuth).</li>
            </ul>
          </Card>
          <Card>
            <Label>Protección</Label>
            <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-[var(--color-fg-2)]">
              <li><b>CSRF:</b> las rutas que cambian datos comprueban que <Code>Origin</Code> o <Code>Referer</Code> coincidan con <Code>ALLOWED_ORIGIN</Code>.</li>
              <li><b>Límites:</b> ventanas de 60 s por IP (o por usuario al escribir fondos). Al pasarse, responde <Code>429</Code>.</li>
              <li><b>Cabeceras:</b> CSP con nonce por petición, <Code>X-Frame-Options: DENY</Code>, <Code>nosniff</Code> y HSTS en producción.</li>
              <li><b>Cuentas:</b> al desactivar un usuario se marca con <Code>deleted_at</Code>; un administrador puede restaurarlo.</li>
            </ul>
          </Card>
          <Card className="lg:col-span-2">
            <Label>De dónde salen los precios</Label>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              {[
                { name: "QueFondos", what: "Fondos españoles (por ISIN)", detail: "Valor liquidativo vigente con 6 decimales y su fecha oficial, rentabilidades a 1, 3 y 5 años y serie mensual de 10 años. Caché de 5 minutos." },
                { name: "Financial Times", what: "Histórico diario (2 años)", detail: "Valor de cada día hábil, con 2 decimales. Se une a la serie mensual y el último día conserva el valor exacto de QueFondos. Caché de 6 horas; si falla, queda la serie mensual." },
                { name: "Yahoo Finance", what: "ETFs y fondos con ticker", detail: "Cotización y serie histórica cuando el ISIN no está en QueFondos. Caché de 5 minutos." },
              ].map((s) => (
                <div key={s.name} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <p className="font-semibold text-[var(--color-fg-1)]">{s.name}</p>
                  <p className="text-xs text-[var(--color-accent)]">{s.what}</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-fg-3)]">{s.detail}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-[var(--color-fg-3)]">
              Con la serie diaria, cada compra se compara con el valor publicado entre el día anterior y los 4 siguientes (margen del 0,15 %). Si no coincide, la tarjeta del fondo avisa para revisarla con el extracto.
            </p>
          </Card>
        </div>
      )}

      {section === "database" && (
        <Card padded={false}>
          <div className="px-5 pb-3 pt-5">
            <h2 className="text-lg font-semibold text-[var(--color-fg-1)]">Tablas</h2>
            <p className="text-xs text-[var(--color-fg-4)]">
              MySQL 8 o TiDB Cloud (TLS opcional con <Code>MYSQL_SSL=true</Code>). Las tablas y columnas se crean o migran solas al arrancar (<Code>src/server/db.ts</Code>). <Code>?</Code> = puede ser nulo.
            </p>
          </div>
          <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
            {TABLES.map((t) => (
              <li key={t.name} className="grid gap-1 px-5 py-3.5 md:grid-cols-[14rem_1fr] md:gap-4">
                <div>
                  <p className="font-mono text-sm font-semibold text-[var(--color-fg-1)]">{t.name}</p>
                  <p className="text-xs text-[var(--color-fg-4)]">{t.purpose}</p>
                </div>
                <p className="font-mono text-xs leading-relaxed text-[var(--color-fg-2)]">{t.columns}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {section === "whatsapp" && (
        <Card>
          <Label>Resumen diario por WhatsApp</Label>
          <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-[var(--color-fg-2)]">
            <li>Se envía con <b>CallMeBot</b>: cada usuario pone su teléfono y su clave gratuita en la sección WhatsApp.</li>
            <li>El servidor revisa cada <b>15 minutos</b> qué usuarios tienen esa hora elegida (en su zona horaria) y les manda el resumen: valor de la cartera, cambio del día y detalle por fondo.</li>
            <li>En servidores que se duermen (como Render gratis), un cron externo puede llamar a <Code>GET /api/digest/trigger?secret=…</Code> con el valor de <Code>CRON_SECRET</Code>.</li>
            <li>El saludo usa el nombre de Ajustes → Perfil, o el usuario si no lo hay.</li>
          </ul>
        </Card>
      )}
    </div>
  );
}
