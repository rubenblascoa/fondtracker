import { describe, expect, it } from "bun:test";
import { allocationBy, concentration, performers, rebalancePlan } from "./allocation";
import type { Investment } from "./api";

const f = (over: Partial<Investment>) =>
  ({ bank: "", category: "", shares: 1, purchase_price: 1, total_invested: 0, current_price: 1, ...over }) as Investment;

const ibercaja = f({ name: "Ibercaja Audaz", bank: "Ibercaja", category: "Mixto Flexible", shares: 66.893659, purchase_price: 14.9491, total_invested: 1000, current_price: 18.408775 });
const santander = f({ name: "Santander Small Caps", bank: "Santander", category: "Renta Variable España", shares: 0.987977, purchase_price: 536.1863, total_invested: 0.987977 * 536.1863, current_price: 530.159 });

describe("allocationBy", () => {
  it("reparte por entidad con el valor actual (cartera de Rubén)", () => {
    const a = allocationBy([santander, ibercaja], "bank");
    expect(a.map((x) => x.name)).toEqual(["Ibercaja", "Santander"]);
    expect(a[0].pct).toBe(70.16);
    expect(a[1].pct).toBe(29.84);
    expect(a[0].value).toBe(1231.43);
  });

  it("los porcentajes suman 100", () => {
    const sum = allocationBy([ibercaja, santander], "category").reduce((s, x) => s + x.pct, 0);
    expect(Math.abs(sum - 100)).toBeLessThan(0.02);
  });

  it("agrupa los fondos sin entidad como 'Otros'", () => {
    expect(allocationBy([f({ bank: "" })], "bank")[0].name).toBe("Otros");
  });

  it("sin precio usa el valor invertido", () => {
    const a = allocationBy([f({ bank: "A", total_invested: 300, current_price: null }), f({ bank: "B", total_invested: 100, current_price: null, shares: 100 })], "bank");
    expect(a[0]).toEqual({ name: "A", value: 300, pct: 75 });
  });

  it("cartera vacía → lista vacía", () => {
    expect(allocationBy([], "bank")).toEqual([]);
  });
});

describe("performers", () => {
  it("mejor y peor por rentabilidad %", () => {
    const p = performers([santander, ibercaja]);
    expect(p.best?.fund.name).toBe("Ibercaja Audaz");
    expect(p.best?.pl).toBe(231.43);
    expect(p.worst?.fund.name).toBe("Santander Small Caps");
    expect(p.worst?.pl).toBe(-5.95);
  });

  it("con un solo fondo no hay peor", () => {
    expect(performers([ibercaja]).worst).toBe(null);
  });

  it("ignora fondos sin precio", () => {
    expect(performers([f({ current_price: null })]).best).toBe(null);
  });
});

describe("concentration (índice HHI sobre el valor actual)", () => {
  it("cartera de Rubén: 70,16 % y 29,84 % → HHI 5813, concentrada", () => {
    const c = concentration([ibercaja, santander]);
    expect(c.hhi).toBe(5813);
    expect(c.label).toBe("Concentrada");
  });
  it("cuatro fondos iguales → 2500, moderada", () => {
    const four = [1, 2, 3, 4].map((i) => f({ id: i, current_price: 10, shares: 10 } as any));
    expect(concentration(four)).toEqual({ hhi: 2500, label: "Moderada" });
  });
  it("cartera vacía → 0", () => {
    expect(concentration([])).toEqual({ hhi: 0, label: "Sin fondos" });
  });
});

describe("rebalancePlan", () => {
  const a = f({ id: 1, name: "A", shares: 70, current_price: 10 } as any); // 700 €
  const b = f({ id: 2, name: "B", shares: 30, current_price: 10 } as any); // 300 €

  it("sin objetivos: reparto a partes iguales", () => {
    const plan = rebalancePlan([a, b], {}, 0);
    expect(plan.map((p) => [p.id, p.targetPct, p.deltaEur, p.action])).toEqual([
      [1, 50, -200, "Vender"],
      [2, 50, 200, "Comprar"],
    ]);
  });

  it("con aportación extra, el objetivo se calcula sobre el total nuevo", () => {
    const plan = rebalancePlan([a, b], { 1: 60, 2: 40 }, 500);
    // total 1.500 → A 900 (+200), B 600 (+300)
    expect(plan.map((p) => p.deltaEur)).toEqual([200, 300]);
  });

  it("diferencias de 5 € o menos: mantener", () => {
    const plan = rebalancePlan([a, b], { 1: 70.4, 2: 29.6 }, 0);
    expect(plan.map((p) => p.action)).toEqual(["Mantener", "Mantener"]);
  });

  it("los importes van en céntimos", () => {
    const plan = rebalancePlan([a, b], { 1: 33.333, 2: 66.667 }, 0);
    expect(plan[0].deltaEur).toBe(-366.67);
  });
});
