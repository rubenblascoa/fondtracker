import { describe, it, expect } from "bun:test";
import { computeInvestmentStats } from "../sentinel";
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
});
