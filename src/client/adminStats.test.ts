import { describe, expect, it } from "bun:test";
import { investedOverTime } from "./adminStats";

describe("investedOverTime", () => {
  const raw = [
    { date: "2026-07-15T10:00:00Z", amount: 1000 },
    { date: "2026-07-08T10:00:00Z", amount: 529.74 },
  ];
  const today = new Date("2026-10-18T12:00:00Z");

  it("acumula lo invertido hasta cada día (orden de entrada indiferente)", () => {
    const pts = investedOverTime(raw, 120, today);
    expect(pts).toHaveLength(120);
    const at = (iso: string) => pts.find((p) => p.date === iso)!.value;
    expect(at("2026-07-07")).toBe(0);
    expect(at("2026-07-08")).toBe(529.74);
    expect(at("2026-07-15")).toBe(1529.74);
    expect(pts[pts.length - 1]).toEqual({ date: "2026-10-18", value: 1529.74 });
  });

  it("sin datos → serie a cero", () => {
    expect(investedOverTime([], 3, today).map((p) => p.value)).toEqual([0, 0, 0]);
  });
});
