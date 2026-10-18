import { describe, it, expect } from "bun:test";
import { calculatePmp } from "../transactions";
import type { TransactionRow } from "../db";

describe("DCA & PMP Calculation Engine", () => {
  it("calcula PMP correcto para una única compra inicial", () => {
    const txs: TransactionRow[] = [
      {
        id: 1,
        user_id: 1,
        fund_id: 10,
        type: "BUY",
        shares: 10,
        price: 100,
        amount: 1000,
        date: "2023-01-15",
        fees: 0,
        notes: null,
        created_at: "2023-01-15",
      },
    ];

    const result = calculatePmp(txs);
    expect(result.currentShares).toBe(10);
    expect(result.pmp).toBe(100);
    expect(result.totalCostBasis).toBe(1000);
    expect(result.realizedGain).toBe(0);
    expect(result.transactionCount).toBe(1);
  });

  it("calcula PMP ponderado exacto con compras periódicas (DCA) a diferentes precios", () => {
    // Mes 1: Compra 10 part. a 100 € = 1.000 €
    // Mes 2: Compra 10 part. a 120 € = 1.200 €
    // Mes 3: Compra 20 part. a 80 €  = 1.600 €
    // Total participaciones = 40
    // Total invertido = 3.800 €
    // PMP = 3.800 / 40 = 95 €
    const txs: TransactionRow[] = [
      {
        id: 1,
        user_id: 1,
        fund_id: 10,
        type: "BUY",
        shares: 10,
        price: 100,
        amount: 1000,
        date: "2023-01-15",
        fees: 0,
        notes: "DCA Mes 1",
        created_at: "2023-01-15",
      },
      {
        id: 2,
        user_id: 1,
        fund_id: 10,
        type: "BUY",
        shares: 10,
        price: 120,
        amount: 1200,
        date: "2023-02-15",
        fees: 0,
        notes: "DCA Mes 2",
        created_at: "2023-02-15",
      },
      {
        id: 3,
        user_id: 1,
        fund_id: 10,
        type: "BUY",
        shares: 20,
        price: 80,
        amount: 1600,
        date: "2023-03-15",
        fees: 0,
        notes: "DCA Mes 3",
        created_at: "2023-03-15",
      },
    ];

    const result = calculatePmp(txs);
    expect(result.currentShares).toBe(40);
    expect(result.pmp).toBe(95);
    expect(result.totalCostBasis).toBe(3800);
    expect(result.transactionCount).toBe(3);
  });

  it("incluye comisiones de suscripción en el coste base y PMP", () => {
    // Compra 10 part. a 100 € + 10 € de comisión = 1.010 €
    // PMP = 1.010 / 10 = 101 €
    const txs: TransactionRow[] = [
      {
        id: 1,
        user_id: 1,
        fund_id: 10,
        type: "BUY",
        shares: 10,
        price: 100,
        amount: 1000,
        date: "2023-01-15",
        fees: 10,
        notes: null,
        created_at: "2023-01-15",
      },
    ];

    const result = calculatePmp(txs);
    expect(result.currentShares).toBe(10);
    expect(result.pmp).toBe(101);
    expect(result.totalCostBasis).toBe(1010);
    expect(result.totalFees).toBe(10);
  });

  it("mantiene el PMP constante tras una venta parcial y calcula la plusvalía realizada", () => {
    // Compra 10 part. a 100 € (Coste = 1.000 €)
    // Venta de 4 part. a 150 € (Ingreso = 600 €, Coste retirado = 4 * 100 € = 400 €)
    // Plusvalía realizada = 200 €
    // Participaciones restantes = 6
    // Coste restante = 600 €
    // PMP sigue siendo 100 €
    const txs: TransactionRow[] = [
      {
        id: 1,
        user_id: 1,
        fund_id: 10,
        type: "BUY",
        shares: 10,
        price: 100,
        amount: 1000,
        date: "2023-01-15",
        fees: 0,
        notes: null,
        created_at: "2023-01-15",
      },
      {
        id: 2,
        user_id: 1,
        fund_id: 10,
        type: "SELL",
        shares: 4,
        price: 150,
        amount: 600,
        date: "2023-06-15",
        fees: 0,
        notes: null,
        created_at: "2023-06-15",
      },
    ];

    const result = calculatePmp(txs);
    expect(result.currentShares).toBe(6);
    expect(result.pmp).toBe(100);
    expect(result.totalCostBasis).toBe(600);
    expect(result.realizedGain).toBe(200);
  });

  it("gestiona reembolsos totales correctamente (saldo cero)", () => {
    const txs: TransactionRow[] = [
      {
        id: 1,
        user_id: 1,
        fund_id: 10,
        type: "BUY",
        shares: 10,
        price: 100,
        amount: 1000,
        date: "2023-01-15",
        fees: 0,
        notes: null,
        created_at: "2023-01-15",
      },
      {
        id: 2,
        user_id: 1,
        fund_id: 10,
        type: "SELL",
        shares: 10,
        price: 120,
        amount: 1200,
        date: "2023-06-15",
        fees: 0,
        notes: null,
        created_at: "2023-06-15",
      },
    ];

    const result = calculatePmp(txs);
    expect(result.currentShares).toBe(0);
    expect(result.pmp).toBe(0);
    expect(result.totalCostBasis).toBe(0);
    expect(result.realizedGain).toBe(200);
  });
});
