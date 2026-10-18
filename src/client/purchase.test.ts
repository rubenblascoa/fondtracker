import { describe, expect, it } from "bun:test";
import { checkBuyPrice, parseEsNumber, purchaseFromStatement, referencePrice } from "./purchase";

const day = (iso: string) => Math.floor(new Date(iso + "T00:00:00").getTime() / 1000);

describe("parseEsNumber", () => {
  it("acepta coma decimal y punto de miles", () => {
    expect(parseEsNumber("66,893659")).toBe(66.893659);
    expect(parseEsNumber("1.000,00")).toBe(1000);
    expect(parseEsNumber("1.234.567,8")).toBe(1234567.8);
  });
  it("acepta punto decimal", () => {
    expect(parseEsNumber("1000.50")).toBe(1000.5);
    expect(parseEsNumber(" 15 ")).toBe(15);
  });
  it("vacío o basura → NaN", () => {
    expect(Number.isNaN(parseEsNumber(""))).toBe(true);
    expect(Number.isNaN(parseEsNumber("abc"))).toBe(true);
  });
});

describe("purchaseFromStatement", () => {
  it("calcula el precio a partir de participaciones e importe (fondo de Rubén)", () => {
    const r = purchaseFromStatement("66,893659", "1.000,00");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.shares).toBe(66.893659);
      expect(r.amount).toBe(1000);
      expect(r.price).toBe(14.949100);
    }
  });
  it("redondea el precio a 6 decimales", () => {
    const r = purchaseFromStatement("3", "100");
    expect(r.ok && r.price).toBe(33.333333);
  });
  it("rechaza participaciones o importe no positivos", () => {
    expect(purchaseFromStatement("0", "100")).toEqual({ ok: false, error: "Indica las participaciones (mayor que cero)" });
    expect(purchaseFromStatement("10", "-5")).toEqual({ ok: false, error: "Indica el importe invertido (mayor que cero)" });
    expect(purchaseFromStatement("", "")).toEqual({ ok: false, error: "Indica las participaciones (mayor que cero)" });
  });
});

describe("referencePrice", () => {
  const quotes = [
    { timestamp: day("2025-06-30"), close: 14.949122 },
    { timestamp: day("2025-07-31"), close: 15.565241 },
  ];

  it("devuelve el dato más cercano a la fecha, con su fecha", () => {
    expect(referencePrice(quotes, "2025-07-15", 14.9491)).toEqual({ price: 14.949122, date: "2025-06-30", gapPct: 0, warn: false });
  });

  it("avisa si el precio calculado se aleja más de un 2 %", () => {
    const r = referencePrice(quotes, "2025-07-15", 16)!;
    expect(r.warn).toBe(true);
    expect(r.gapPct).toBe(7.03);
  });

  it("sin datos o sin precio calculado → null", () => {
    expect(referencePrice([], "2025-07-15", 15)).toBe(null);
    expect(referencePrice(quotes, "", 15)).toBe(null);
  });
});

describe("checkBuyPrice", () => {
  // Valores liquidativos diarios reales (FT) alrededor de las compras
  const audaz = [["2025-07-11", 15.12], ["2025-07-14", 15.14], ["2025-07-15", 15.18], ["2025-07-16", 15.14], ["2025-07-17", 15.28], ["2025-07-18", 15.26]].map(([d, c]) => ({ timestamp: day(d as string), close: c as number }));
  const smallCaps = [["2026-07-07", 546.98], ["2026-07-08", 529.74], ["2026-07-09", 534.54], ["2026-07-10", 532.9]].map(([d, c]) => ({ timestamp: day(d as string), close: c as number }));

  it("da por buena una compra al valor liquidativo de ese día", () => {
    expect(checkBuyPrice(smallCaps, "2026-07-08", 529.74)).toEqual({ ok: true });
  });

  it("acepta el valor del día siguiente (orden dada tras la hora de corte)", () => {
    expect(checkBuyPrice(audaz, "2025-07-15", 15.14)).toEqual({ ok: true });
  });

  it("admite el redondeo de importe ÷ participaciones", () => {
    expect(checkBuyPrice(smallCaps, "2026-07-08", Math.round((529.74 / 1.000002) * 1e6) / 1e6)).toEqual({ ok: true });
  });

  it("detecta un precio de compra que no coincide con ningún valor de esos días (cierre del mes anterior)", () => {
    const r = checkBuyPrice(audaz, "2025-07-15", 14.9491);
    expect(r).toEqual({ ok: false, nav: { date: "2025-07-15", price: 15.18 } });
    expect(checkBuyPrice(smallCaps, "2026-07-08", 536.1863)).toEqual({ ok: false, nav: { date: "2026-07-08", price: 529.74 } });
  });

  it("no opina si la serie no tiene datos cerca de la fecha", () => {
    expect(checkBuyPrice(audaz, "2023-01-10", 12)).toBeNull();
    expect(checkBuyPrice([], "2025-07-15", 15)).toBeNull();
  });
});
