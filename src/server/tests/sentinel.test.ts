import { describe, it, expect } from "bun:test";
import { computeInvestmentStats, computePortfolioTotals } from "../sentinel";
import type { InvestmentRow } from "../db";

describe("computeInvestmentStats", () => {
  const baseInvestment: InvestmentRow = {
    id: 1,
    user_id: 1,
    isin: "ES0123456789",
    name: "Test Fund",
    bank: "Test Bank",
    category: "Test Category",
    ticker: "TEST.MC",
    shares: 10,
    purchase_price: 100,
    purchase_date: "2023-01-01",
    currency: "EUR",
    notes: "",
    created_at: "2023-01-01 00:00:00",
    updated_at: "2023-01-01 00:00:00",
  };

  it("calcula profit/loss correctamente", () => {
    // shares=10, purchase_price=100, current_price=120
    // total_invested = 1000, current_value = 1200, profit_loss = 200, pct = 20%
    const stats = computeInvestmentStats(baseInvestment, 120, "TEST.MC");
    expect(stats.total_invested).toBe(1000);
    expect(stats.current_value).toBe(1200);
    expect(stats.profit_loss).toBe(200);
    expect(stats.profit_loss_pct).toBe(20);
    expect(stats.current_price).toBe(120);
    expect(stats.ticker).toBe("TEST.MC");
  });

  it("devuelve total_invested como current_value si no hay precio", () => {
    // current_price = null -> current_value = total_invested
    const stats = computeInvestmentStats(baseInvestment, null, null);
    expect(stats.total_invested).toBe(1000);
    expect(stats.current_value).toBe(1000);
    expect(stats.profit_loss).toBe(0);
    expect(stats.profit_loss_pct).toBe(0);
    expect(stats.current_price).toBe(null);
    expect(stats.ticker).toBe(null);
  });

  it("calcula pérdidas con signo negativo", () => {
    const stats = computeInvestmentStats(baseInvestment, 80, null);
    expect(stats.current_value).toBe(800);
    expect(stats.profit_loss).toBe(-200);
    expect(stats.profit_loss_pct).toBe(-20);
  });

  it("con 0 participaciones todo es 0 y el porcentaje no es NaN", () => {
    const stats = computeInvestmentStats({ ...baseInvestment, shares: 0 }, 120, null);
    expect(stats.total_invested).toBe(0);
    expect(stats.current_value).toBe(0);
    expect(stats.profit_loss_pct).toBe(0);
  });

  it("guarda la fecha y la fuente del precio usado", () => {
    const stats = computeInvestmentStats(baseInvestment, 120, null, { date: "2026-10-14", source: "quefondos" });
    expect(stats.price_date).toBe("2026-10-14");
    expect(stats.price_source).toBe("quefondos");
  });

  it("sin información del precio deja fecha y fuente a null", () => {
    const stats = computeInvestmentStats(baseInvestment, 120, null);
    expect(stats.price_date).toBe(null);
    expect(stats.price_source).toBe(null);
  });
});

describe("computePortfolioTotals", () => {
  it("cartera vacía: todo a 0 sin NaN", () => {
    const t = computePortfolioTotals([]);
    expect(t).toEqual({ total_initial: 0, total_current: 0, total_profit_loss: 0, total_profit_loss_pct: 0, fund_count: 0 });
  });

  it("suma los dos fondos de Rubén", () => {
    const inv = (shares: number, price: number, current: number) =>
      computeInvestmentStats({ id: 1, user_id: 1, isin: "X", name: "", bank: "", category: "", ticker: null, shares, purchase_price: price, purchase_date: "2025-01-01", currency: "EUR", notes: null } as any, current, null);
    const t = computePortfolioTotals([inv(66.893659, 14.9491, 18.408775), inv(0.987977, 536.1863, 530.159)]);
    expect(Math.round(t.total_initial * 100) / 100).toBe(1529.74);
    expect(Math.round(t.total_current * 100) / 100).toBe(1755.22);
    expect(Math.round(t.total_profit_loss * 100) / 100).toBe(225.48);
    expect(Math.round(t.total_profit_loss_pct * 100) / 100).toBe(14.74);
  });
});
