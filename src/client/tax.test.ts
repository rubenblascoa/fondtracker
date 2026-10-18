import { describe, expect, it } from "bun:test";
import { irpfSavingsTax } from "./tax";

describe("irpfSavingsTax (base del ahorro)", () => {
  it("ganancia de Rubén: 225,48 € → 42,84 € al 19 %", () => {
    const r = irpfSavingsTax(225.48);
    expect(r.total).toBe(42.84);
    expect(r.effectiveRate).toBe(19);
    expect(r.brackets).toHaveLength(1);
    expect(r.brackets[0]).toEqual({ from: 0, to: 6000, rate: 19, base: 225.48, tax: 42.84 });
  });

  it("10.000 € → 6.000 × 19 % + 4.000 × 21 % = 1.980 €", () => {
    const r = irpfSavingsTax(10000);
    expect(r.total).toBe(1980);
    expect(r.brackets.map((b) => b.tax)).toEqual([1140, 840]);
  });

  it("tramo más alto al 30 % por encima de 300.000 € (Ley 7/2024)", () => {
    const r = irpfSavingsTax(400000);
    // 1140 + 44000*0.21 + 150000*0.23 + 100000*0.27 + 100000*0.30
    expect(r.total).toBe(1140 + 9240 + 34500 + 27000 + 30000);
    expect(r.brackets[4]).toEqual({ from: 300000, to: null, rate: 30, base: 100000, tax: 30000 });
  });

  it("cero o pérdidas → sin impuesto", () => {
    expect(irpfSavingsTax(0)).toEqual({ brackets: [], total: 0, effectiveRate: 0 });
    expect(irpfSavingsTax(-500)).toEqual({ brackets: [], total: 0, effectiveRate: 0 });
  });

  it("redondea cada tramo a céntimos", () => {
    expect(irpfSavingsTax(0.03).total).toBe(0.01);
  });
});
