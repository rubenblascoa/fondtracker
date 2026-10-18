import { describe, expect, it } from "bun:test";
import { reconstructHistory, mergeHistory } from "../history";
import type { InvestmentRow } from "../db";
import type { YahooQuote } from "../yahoo";

const ts = (d: string) => Math.floor(new Date(d + "T00:00:00Z").getTime() / 1000);
const q = (d: string, close: number): YahooQuote => ({ timestamp: ts(d), open: close, high: close, low: close, close, volume: 0 });

const ibercaja = {
  id: 17,
  isin: "ES0147077038",
  shares: 66.893659,
  purchase_price: 14.9491,
  purchase_date: "2025-07-15",
} as unknown as InvestmentRow;

const santander = {
  id: 19,
  isin: "ES0175224031",
  shares: 0.987977,
  purchase_price: 536.1863,
  purchase_date: "2026-07-08",
} as unknown as InvestmentRow;

const quotes = new Map<string, YahooQuote[]>([
  ["ES0147077038", [q("2025-06-30", 14.949122), q("2025-07-31", 15.565241), q("2026-07-31", 17.73447), q("2026-10-15", 18.408775)]],
  ["ES0175224031", [q("2026-07-31", 540), q("2026-10-15", 530.159)]],
]);

const from = new Date("2025-01-01T00:00:00Z");
const to = new Date("2026-10-18T00:00:00Z");

describe("reconstructHistory", () => {
  it("cartera vacía → sin puntos", () => {
    expect(reconstructHistory([], quotes, from, to)).toEqual([]);
  });

  it("no hay puntos antes de la primera compra", () => {
    const pts = reconstructHistory([ibercaja], quotes, from, to);
    expect(pts[0].date >= "2025-07-15").toBe(true);
  });

  it("el último punto vale participaciones × último precio, redondeado a céntimos", () => {
    const pts = reconstructHistory([ibercaja], quotes, from, to);
    const last = pts[pts.length - 1];
    expect(last.date).toBe("2026-10-15");
    expect(last.value).toBe(1231.43);
    expect(last.invested).toBe(1000);
  });

  it("solo suma las inversiones ya compradas en cada fecha", () => {
    const pts = reconstructHistory([ibercaja, santander], quotes, from, to);
    const julio2025 = pts.find((p) => p.date === "2025-07-31")!;
    expect(julio2025.invested).toBe(1000);
    expect(julio2025.value).toBe(1041.22);
    const oct2026 = pts.find((p) => p.date === "2026-10-15")!;
    expect(oct2026.invested).toBe(1529.74);
    expect(oct2026.value).toBe(1755.22);
  });

  it("para un fondo sin cotización en una fecha usa su último precio conocido", () => {
    const pts = reconstructHistory([ibercaja, santander], quotes, from, to);
    // 2026-07-31: Ibercaja 17,73447 y Santander 540
    const p = pts.find((x) => x.date === "2026-07-31")!;
    expect(p.value).toBe(Math.round((66.893659 * 17.73447 + 0.987977 * 540) * 100) / 100);
  });

  it("ignora fechas fuera del rango", () => {
    const pts = reconstructHistory([ibercaja], quotes, new Date("2026-08-01T00:00:00Z"), to);
    expect(pts.map((p) => p.date)).toEqual(["2026-10-15"]);
  });
});

describe("mergeHistory", () => {
  const rec = [
    { date: "2026-08-31", invested: 1000, value: 1205 },
    { date: "2026-09-30", invested: 1000, value: 1214 },
    { date: "2026-10-15", invested: 1529.74, value: 1755.22 },
  ];

  it("sin fotos guardadas: reconstruido + punto de hoy", () => {
    const r = mergeHistory(rec, [], { date: "2026-10-18", invested: 1529.74, value: 1760 });
    expect(r.source).toBe("reconstructed");
    expect(r.points.map((p) => p.date)).toEqual(["2026-08-31", "2026-09-30", "2026-10-15", "2026-10-18"]);
  });

  it("las fotos guardadas sustituyen a lo reconstruido desde la primera foto", () => {
    const snaps = [
      { date: "2026-10-01", invested: 1000, value: 1220 },
      { date: "2026-10-17", invested: 1529.74, value: 1750 },
    ];
    const r = mergeHistory(rec, snaps, null);
    expect(r.source).toBe("mixed");
    expect(r.points.map((p) => p.date)).toEqual(["2026-08-31", "2026-09-30", "2026-10-01", "2026-10-17"]);
  });

  it("el punto de hoy reemplaza una foto del mismo día", () => {
    const r = mergeHistory([], [{ date: "2026-10-18", invested: 1, value: 1 }], { date: "2026-10-18", invested: 2, value: 3 });
    expect(r.source).toBe("snapshots");
    expect(r.points).toEqual([{ date: "2026-10-18", invested: 2, value: 3 }]);
  });

  it("todo vacío → sin puntos", () => {
    expect(mergeHistory([], [], null)).toEqual({ points: [], source: "snapshots" });
  });
});

describe("reconstructHistory · fechas", () => {
  it("una cotización a medianoche hora de Madrid cuenta para ese día, no el anterior", () => {
    // QueFondos crea las fechas en hora local: 31/10/2025 00:00 Madrid = 30/10/2025 23:00 UTC
    const madridMidnight = Math.floor(new Date("2025-10-30T23:00:00Z").getTime() / 1000);
    const quotesTz = new Map([["ES0147077038", [{ timestamp: madridMidnight, open: 16.378261, high: 16.378261, low: 16.378261, close: 16.378261, volume: 0 }]]]);
    const pts = reconstructHistory([ibercaja], quotesTz, from, to);
    expect(pts[0].date).toBe("2025-10-31");
  });

  it("una cotización de Yahoo con hora de apertura americana (14:30 UTC) cuenta para ese día", () => {
    const usOpen = Math.floor(new Date("2026-10-15T14:30:00Z").getTime() / 1000);
    const quotesUs = new Map([["ES0147077038", [{ timestamp: usOpen, open: 18, high: 18, low: 18, close: 18, volume: 0 }]]]);
    expect(reconstructHistory([ibercaja], quotesUs, from, to)[0].date).toBe("2026-10-15");
  });
});
