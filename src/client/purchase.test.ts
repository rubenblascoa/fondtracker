import { describe, expect, it } from "bun:test";
import { parseEsNumber, purchaseFromStatement, referencePrice } from "./purchase";

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
