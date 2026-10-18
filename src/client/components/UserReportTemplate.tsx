import { forwardRef, type CSSProperties, type ReactNode } from "react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import type { Investment, Status, User, YahooChartData } from "../api";
import { allocationBy } from "../allocation";
import { fundView, periodReturn } from "../fundView";
import { formatEur, formatPct, sanitizeFundName } from "../utils";

// Informe imprimible: fondo claro, A4 a 96 ppp (794 × 1123 px), solo cifras reales.
const C = {
  ink: "#14130f",
  ink2: "#4d4a43",
  ink3: "#8a857b",
  line: "#e7e3da",
  soft: "#f7f5f0",
  violet: "#7c3aed",
  gold: "#b7791f",
  profit: "#15803d",
  loss: "#dc2626",
};
const PAGE: CSSProperties = {
  width: 794,
  height: 1123,
  padding: "48px 52px",
  boxSizing: "border-box",
  background: "#ffffff",
  color: C.ink,
  fontFamily: "Inter, system-ui, sans-serif",
  display: "flex",
  flexDirection: "column",
  position: "relative",
};
const H = (size: number): CSSProperties => ({ fontFamily: "'Space Grotesk', Inter, sans-serif", fontWeight: 700, fontSize: size, letterSpacing: "-0.02em", margin: 0, color: C.ink });
const LABEL: CSSProperties = { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: C.ink3 };
const MONO: CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const FUNDS_PER_PAGE = 3;

const signed = (n: number) => `${n > 0 ? "+" : ""}${formatEur(n)}`;

function Header({ user, page }: { user: User | null; page: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.line}`, paddingBottom: 14, marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: "linear-gradient(90deg,#e3b25b,#c084fc)" }} />
        <span style={H(16)}>FondTracker</span>
      </div>
      <span style={LABEL}>
        {user?.username ?? ""} · {page}
      </span>
    </div>
  );
}

function Footer({ n, total }: { n: number; total: number }) {
  return (
    <div style={{ marginTop: "auto", paddingTop: 14, borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", fontSize: 9, color: C.ink3 }}>
      <span>Valores liquidativos de QueFondos y cotizaciones de Yahoo Finance. Cada precio indica su fecha. No es asesoramiento financiero.</span>
      <span style={MONO}>
        {n}/{total}
      </span>
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 14, padding: "14px 16px" }}>
      <div style={LABEL}>{label}</div>
      <div style={{ ...H(22), marginTop: 6, color: color ?? C.ink }}>{value}</div>
    </div>
  );
}

function Bars({ title, items }: { title: string; items: { name: string; value: number; pct: number }[] }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ ...LABEL, marginBottom: 10 }}>{title}</div>
      {items.map((it) => (
        <div key={it.name} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
            <span>{it.name}</span>
            <span style={{ ...MONO, color: C.ink2 }}>
              {it.pct.toFixed(1).replace(".", ",")} % · {formatEur(it.value)}
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: C.soft }}>
            <div style={{ height: 6, borderRadius: 3, width: `${it.pct}%`, background: "linear-gradient(90deg,#e3b25b,#c084fc)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Cell({ children, right, style }: { children: ReactNode; right?: boolean; style?: CSSProperties }) {
  return <td style={{ padding: "8px 6px", borderBottom: `1px solid ${C.line}`, textAlign: right ? "right" : "left", fontSize: 10.5, ...style }}>{children}</td>;
}

type Props = { user: User | null; status: Status | null; funds: Investment[]; chartsMap?: Record<string, YahooChartData> };

export const UserReportTemplate = forwardRef<HTMLDivElement, Props>(({ user, status, funds, chartsMap = {} }, ref) => {
  const invested = status?.total_initial ?? 0;
  const current = status?.total_current ?? 0;
  const pl = status?.total_profit_loss ?? 0;
  const plPct = status?.total_profit_loss_pct ?? 0;
  const date = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  const rows = funds.map((f) => ({ fund: f, view: fundView(f) })).sort((a, b) => b.view.value - a.view.value);
  const fundPages: (typeof rows)[] = [];
  for (let i = 0; i < rows.length; i += FUNDS_PER_PAGE) fundPages.push(rows.slice(i, i + FUNDS_PER_PAGE));
  const totalPages = 1 + fundPages.length;

  return (
    <div ref={ref}>
      {/* Página 1: resumen */}
      <div className="report-page" style={PAGE}>
        <Header user={user} page="Resumen" />
        <div style={LABEL}>Informe de cartera · {date}</div>
        <h1 style={{ ...H(34), marginTop: 6, marginBottom: 22 }}>Tu cartera, de un vistazo</h1>

        <div style={{ display: "flex", gap: 10, marginBottom: 26 }}>
          <Kpi label="Patrimonio" value={formatEur(current)} />
          <Kpi label="Invertido" value={formatEur(invested)} />
          <Kpi label="Ganancia" value={signed(pl)} color={pl >= 0 ? C.profit : C.loss} />
          <Kpi label="Rentabilidad" value={formatPct(plPct)} color={pl >= 0 ? C.profit : C.loss} />
        </div>

        <div style={{ display: "flex", gap: 28, marginBottom: 26 }}>
          <Bars title="Por entidad" items={allocationBy(funds, "bank")} />
          <Bars title="Por tipo de fondo" items={allocationBy(funds, "category")} />
        </div>

        <div style={{ ...LABEL, marginBottom: 6 }}>Posiciones</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Fondo", "Participaciones", "Invertido", "Valor", "Ganancia", "Precio"].map((h, i) => (
                <th key={h} style={{ ...LABEL, textAlign: i ? "right" : "left", padding: "6px", borderBottom: `1px solid ${C.ink}` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ fund, view }) => (
              <tr key={fund.id}>
                <Cell>
                  <div style={{ fontWeight: 600 }}>{sanitizeFundName(fund.name)}</div>
                  <div style={{ ...MONO, fontSize: 9, color: C.ink3 }}>
                    {fund.isin} · {fund.bank}
                  </div>
                </Cell>
                <Cell right style={MONO}>
                  {String(fund.shares).replace(".", ",")}
                </Cell>
                <Cell right style={MONO}>
                  {formatEur(view.invested)}
                </Cell>
                <Cell right style={MONO}>
                  {formatEur(view.value)}
                </Cell>
                <Cell right style={{ ...MONO, color: view.plPositive === false ? C.loss : C.profit }}>
                  {view.plLabel ? `${view.plLabel} (${view.plPctLabel})` : "Sin precio"}
                </Cell>
                <Cell right style={MONO}>
                  {view.priceLabel}
                  {view.navDateLabel && <div style={{ fontSize: 8.5, color: view.stale ? C.gold : C.ink3 }}>{view.navDateLabel}</div>}
                </Cell>
              </tr>
            ))}
          </tbody>
        </table>
        <Footer n={1} total={totalPages} />
      </div>

      {/* Páginas siguientes: ficha de cada fondo */}
      {fundPages.map((group, gi) => (
        <div key={gi} className="report-page" style={PAGE}>
          <Header user={user} page="Fondos" />
          {group.map(({ fund, view }) => {
            const quotes = chartsMap[fund.isin]?.quotes ?? [];
            const ret1y = periodReturn(quotes);
            const data = quotes.map((q) => ({ v: q.close }));
            return (
              <div key={fund.id} style={{ border: `1px solid ${C.line}`, borderRadius: 16, padding: 18, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={H(16)}>{sanitizeFundName(fund.name)}</div>
                    <div style={{ ...MONO, fontSize: 9.5, color: C.ink3, marginTop: 3 }}>
                      {fund.isin} · {fund.bank} · {fund.category}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ ...H(18), color: view.plPositive === false ? C.loss : C.profit }}>{view.plLabel ?? "Sin precio"}</div>
                    <div style={{ ...MONO, fontSize: 9.5, color: C.ink2 }}>{view.plPctLabel ?? ""}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 18, margin: "14px 0 10px", fontSize: 10.5 }}>
                  {[
                    ["Participaciones", String(fund.shares).replace(".", ",")],
                    ["Precio medio", formatEur(fund.purchase_price, 4)],
                    ["Precio actual", `${view.priceLabel}${view.navDateLabel ? ` (${view.navDateLabel})` : ""}`],
                    ["Invertido", formatEur(view.invested)],
                    ["Valor", formatEur(view.value)],
                    ["Fondo en 1 año", ret1y == null ? "—" : formatPct(ret1y)],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={LABEL}>{k}</div>
                      <div style={{ ...MONO, marginTop: 3 }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ height: 140 }}>
                  {data.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`rp${fund.id}`} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0" stopColor="#7c3aed" stopOpacity={0.18} />
                            <stop offset="1" stopColor="#7c3aed" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <YAxis hide domain={["auto", "auto"]} />
                        <Area type="monotone" dataKey="v" stroke="#7c3aed" strokeWidth={1.8} fill={`url(#rp${fund.id})`} isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: "100%", display: "grid", placeItems: "center", fontSize: 10, color: C.ink3, background: C.soft, borderRadius: 10 }}>
                      Sin histórico disponible
                    </div>
                  )}
                </div>
                <div style={{ ...LABEL, marginTop: 6 }}>Valor liquidativo · último año</div>
              </div>
            );
          })}
          <Footer n={gi + 2} total={totalPages} />
        </div>
      ))}
    </div>
  );
});
