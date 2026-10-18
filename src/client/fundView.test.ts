import { describe, expect, it } from "bun:test";
import { chartRangesFor, fundView, periodReturn } from "./fundView";
import type { Investment } from "./api";

const n = (s: string | null) => (s ?? "").replace(/ | /g, " ");
const NOW = new Date("2026-10-18T10:00:00Z");

const ibercaja = {
  isin: "ES0147077038",
  shares: 66.893659,
  purchase_price: 14.9491,
  total_invested: 1000,
  current_price: 18.408775,
  price_date: "2026-10-14",
  price_source: "quefondos",
} as unknown as Investment;

describe("fundView", () => {
  it("fondo de Rubén: precio, ganancia y fecha del valor liquidativo", () => {
    const v = fundView(ibercaja, NOW);
    expect(v.hasPrice).toBe(true);
    expect(n(v.priceLabel)).toBe("18,4088 €");
    expect(n(v.plLabel)).toBe("+231,43 €");
    expect(n(v.plPctLabel)).toBe("+23,14 %");
    expect(v.plPositive).toBe(true);
    expect(v.navDateLabel).toBe("14 oct");
    expect(v.stale).toBe(false);
  });

  it("sin precio: no inventa ganancia", () => {
    const v = fundView({ ...ibercaja, current_price: null, price_date: null, price_source: null } as Investment, NOW);
    expect(v.hasPrice).toBe(false);
    expect(v.priceLabel).toBe("Sin precio");
    expect(v.plLabel).toBe(null);
    expect(v.plPctLabel).toBe(null);
    expect(v.plPositive).toBe(null);
  });

  it("pérdida: signo menos y plPositive false", () => {
    const v = fundView({ ...ibercaja, current_price: 14 } as Investment, NOW);
    expect(n(v.plLabel)).toBe("-63,49 €");
    expect(v.plPositive).toBe(false);
  });

  it("marca como antiguo un precio de hace más de 6 días", () => {
    expect(fundView({ ...ibercaja, price_date: "2026-10-05" } as Investment, NOW).stale).toBe(true);
    expect(fundView({ ...ibercaja, price_date: "2026-10-13" } as Investment, NOW).stale).toBe(false);
  });

  it("precio de caché sin fecha: etiqueta 'guardado' y no se marca antiguo", () => {
    const v = fundView({ ...ibercaja, price_date: null, price_source: "cache" } as Investment, NOW);
    expect(v.navDateLabel).toBe("guardado");
    expect(v.stale).toBe(false);
  });
});

describe("chartRangesFor", () => {
  it("datos mensuales (QueFondos): sin rangos de días", () => {
    expect(chartRangesFor("quefondos").map((r) => r.label)).toEqual(["6M", "1A", "2A", "5A", "Máx"]);
  });

  it("datos diarios (Yahoo): incluye 1M", () => {
    expect(chartRangesFor("yahoo").map((r) => r.label)).toContain("1M");
  });

  it("los valores son rangos que entiende la API", () => {
    expect(chartRangesFor("quefondos").map((r) => r.value)).toEqual(["6mo", "1y", "2y", "5y", "max"]);
  });
});

describe("periodReturn", () => {
  const q = (close: number) => ({ timestamp: 0, close });
  it("rentabilidad entre el primer y el último precio del periodo", () => {
    expect(periodReturn([q(14.949122), q(16), q(18.408775)])).toBe(23.14);
  });
  it("menos de dos precios → null", () => {
    expect(periodReturn([q(10)])).toBe(null);
    expect(periodReturn([])).toBe(null);
  });
  it("ignora precios no válidos al principio", () => {
    expect(periodReturn([q(0), q(10), q(11)])).toBe(10);
  });
});
