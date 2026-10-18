import { describe, it, expect } from "bun:test";
import { parseFtSymbolId, parseFtHistoricalHtml } from "../ft";
import { mergeDailyQuotes, lastYearRange } from "../quefondos";
import type { YahooQuote } from "../yahoo";

const q = (iso: string, close: number): YahooQuote => {
  const ts = Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 1000;
  return { timestamp: ts, open: close, high: close, low: close, close, volume: 0 };
};
const isoOf = (x: YahooQuote) => new Date((x.timestamp + 6 * 3600) * 1000).toISOString().slice(0, 10);

describe("FT · ficha histórica", () => {
  it("saca el identificador interno del FT de la ficha", () => {
    const html = `<div data-mod-config="{&quot;inception&quot;:&quot;2001-08-10T00:00:00Z&quot;,&quot;symbol&quot;:&quot;10063&quot;}"></div>`;
    expect(parseFtSymbolId(html)).toBe("10063");
    expect(parseFtSymbolId("<html>sin datos</html>")).toBeNull();
  });

  it("lee fecha y cierre de cada fila del histórico (formato real)", () => {
    const html =
      `<tr><td class="mod-ui-table__cell--text"><span class="mod-ui-hide-small-below">Wednesday, October 14, 2026</span><span class="mod-ui-hide-medium-above">Wed, Oct 14, 2026</span></td><td>18.41</td><td>18.41</td><td>18.41</td><td>18.41</td><td><span class="mod-ui-hide-small-below">0</span><span class="mod-ui-hide-medium-above">0.00</span></td></tr>` +
      `<tr><td class="mod-ui-table__cell--text"><span class="mod-ui-hide-small-below">Tuesday, July 15, 2025</span><span class="mod-ui-hide-medium-above">Tue, Jul 15, 2025</span></td><td>15.18</td><td>15.18</td><td>15.18</td><td>15.18</td><td><span class="mod-ui-hide-small-below">0</span></td></tr>` +
      `<tr><td class="mod-ui-table__cell--text"><span class="mod-ui-hide-small-below">Friday, January 02, 2026</span></td><td>1,234.50</td><td>1,234.50</td><td>1,234.50</td><td>1,234.50</td><td>0</td></tr>`;
    const rows = parseFtHistoricalHtml(html);
    expect(rows.map(isoOf)).toEqual(["2025-07-15", "2026-01-02", "2026-10-14"]);
    expect(rows.map((r) => r.close)).toEqual([15.18, 1234.5, 18.41]);
  });

  it("ignora filas sin precio válido", () => {
    const html = `<tr><td><span class="mod-ui-hide-small-below">Monday, October 12, 2026</span></td><td>--</td><td>--</td><td>--</td><td>--</td><td>0</td></tr>`;
    expect(parseFtHistoricalHtml(html)).toEqual([]);
  });
});

describe("Unión de la serie mensual de QueFondos con la diaria del FT", () => {
  const monthly = [q("2024-06-30", 13.0), q("2025-06-29", 14.949122), q("2025-07-30", 15.565241), q("2026-10-14", 18.408775)];

  it("sin datos diarios deja la serie mensual tal cual", () => {
    expect(mergeDailyQuotes(monthly, [])).toEqual(monthly);
  });

  it("usa lo diario desde que empieza y lo mensual antes", () => {
    const daily = [q("2025-07-14", 15.14), q("2025-07-15", 15.18), q("2025-07-16", 15.14), q("2026-10-13", 18.5), q("2026-10-14", 18.41)];
    const merged = mergeDailyQuotes(monthly, daily);
    expect(merged.map(isoOf)).toEqual(["2024-06-30", "2025-06-29", "2025-07-14", "2025-07-15", "2025-07-16", "2026-10-13", "2026-10-14"]);
  });

  it("el último día conserva el valor exacto de QueFondos (6 decimales) en vez del redondeado del FT", () => {
    const daily = [q("2026-10-13", 18.5), q("2026-10-14", 18.41)];
    const merged = mergeDailyQuotes(monthly, daily);
    expect(merged[merged.length - 1].close).toBe(18.408775);
  });

  it("si QueFondos tiene un día más reciente que el FT, lo añade al final", () => {
    const daily = [q("2026-10-12", 18.45), q("2026-10-13", 18.5)];
    const merged = mergeDailyQuotes(monthly, daily);
    expect(merged.map(isoOf).slice(-2)).toEqual(["2026-10-13", "2026-10-14"]);
    expect(merged[merged.length - 1].close).toBe(18.408775);
  });
});

describe("Máximo y mínimo de 52 semanas", () => {
  it("solo mira el último año, no toda la serie", () => {
    const quotes = [q("2016-10-31", 9.78), q("2021-01-29", 25), q("2025-11-28", 16.1), q("2026-04-30", 17.2), q("2026-10-14", 18.41)];
    expect(lastYearRange(quotes)).toEqual({ high: 18.41, low: 16.1 });
  });
});
