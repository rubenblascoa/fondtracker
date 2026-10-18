import { describe, expect, it } from "bun:test";
import { greeting, lastChange, monthlyResults, recentMovements } from "./overview";

const p = (date: string, invested: number, value: number) => ({ date, invested, value });

describe("greeting", () => {
  it("saluda según la hora", () => {
    expect(greeting(7)).toBe("Buenos días");
    expect(greeting(13)).toBe("Buenos días");
    expect(greeting(14)).toBe("Buenas tardes");
    expect(greeting(20)).toBe("Buenas tardes");
    expect(greeting(21)).toBe("Buenas noches");
    expect(greeting(3)).toBe("Buenas noches");
  });
});

describe("monthlyResults", () => {
  it("resultado de cada mes = cambio de valor menos lo aportado ese mes", () => {
    const points = [
      p("2026-07-08", 536.19, 536.19),
      p("2026-07-31", 536.19, 540),
      p("2026-08-15", 1536.19, 1545), // aportación de 1.000 € a mitad de mes
      p("2026-08-31", 1536.19, 1530),
      p("2026-09-30", 1536.19, 1560),
    ];
    expect(monthlyResults(points)).toEqual([
      { month: "2026-07", label: "jul", result: 3.81 },
      { month: "2026-08", label: "ago", result: -10 },
      { month: "2026-09", label: "sep", result: 30 },
    ]);
  });

  it("se queda con los últimos N meses", () => {
    const points = ["01", "02", "03", "04", "05"].map((m, i) => p(`2026-${m}-28`, 100, 100 + i));
    expect(monthlyResults(points, 2).map((r) => r.month)).toEqual(["2026-04", "2026-05"]);
  });

  it("sin puntos no hay meses", () => {
    expect(monthlyResults([])).toEqual([]);
  });
});

describe("lastChange", () => {
  it("cambio entre los dos últimos puntos, sin contar lo aportado", () => {
    expect(lastChange([p("2026-10-13", 1536.19, 1755.2), p("2026-10-14", 1536.19, 1751.59)])).toEqual({
      date: "2026-10-14",
      since: "2026-10-13",
      change: -3.61,
      pct: -0.21,
    });
  });

  it("una aportación no cuenta como ganancia", () => {
    expect(lastChange([p("2026-10-13", 1000, 1100), p("2026-10-14", 1500, 1610)])?.change).toBe(10);
  });

  it("con menos de dos puntos no hay cambio", () => {
    expect(lastChange([p("2026-10-14", 1, 1)])).toBeNull();
  });
});

describe("recentMovements", () => {
  it("junta los movimientos de todos los fondos, del más reciente al más antiguo", () => {
    const tx = (id: number, date: string) => ({ id, fund_id: 0, type: "BUY" as const, shares: 1, price: 1, amount: 1, date, fees: 0, notes: null, created_at: "" });
    const out = recentMovements(
      [
        { fund: { id: 17, name: "Audaz" }, transactions: [tx(1, "2025-07-15")] },
        { fund: { id: 19, name: "Small Caps" }, transactions: [tx(2, "2026-07-08"), tx(3, "2026-01-02")] },
      ],
      2,
    );
    expect(out.map((m) => [m.fundName, m.date])).toEqual([
      ["Small Caps", "2026-07-08"],
      ["Small Caps", "2026-01-02"],
    ]);
  });
});
