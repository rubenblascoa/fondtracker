import { describe, it, expect } from "bun:test";
import { calculatePmp, initialBuyFromInvestment, planInvestmentEdit, validateRemoval, validateTransaction } from "../transactions";
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

describe("validateTransaction", () => {
  const ok = { type: "BUY" as const, shares: 1, price: 10, date: "2026-10-18" };

  it("rechaza vender más participaciones de las que tienes", () => {
    expect(() => validateTransaction(66.893659, { ...ok, type: "SELL", shares: 70 })).toThrow("No tienes tantas participaciones (tienes 66,893659)");
  });

  it("rechaza un traspaso de salida mayor que la posición", () => {
    expect(() => validateTransaction(0, { ...ok, type: "TRANSFER_OUT", shares: 1 })).toThrow("No tienes tantas participaciones (tienes 0)");
  });

  it("permite vender exactamente todo", () => {
    expect(() => validateTransaction(66.893659, { ...ok, type: "SELL", shares: 66.893659 })).not.toThrow();
  });

  it("rechaza participaciones, precio o comisiones no válidos", () => {
    expect(() => validateTransaction(10, { ...ok, shares: 0 })).toThrow("participaciones");
    expect(() => validateTransaction(10, { ...ok, price: -1 })).toThrow("precio");
    expect(() => validateTransaction(10, { ...ok, fees: -1 })).toThrow("comisión");
    expect(() => validateTransaction(10, { ...ok, date: "18/10/2026" })).toThrow("fecha");
  });

  it("rechaza tipos desconocidos", () => {
    expect(() => validateTransaction(10, { ...ok, type: "GIFT" as any })).toThrow("Tipo");
  });
});

describe("initialBuyFromInvestment", () => {
  const inv = { id: 17, user_id: 1, shares: 66.893659, purchase_price: 14.9491, purchase_date: "2025-07-15" } as any;

  it("convierte una inversión existente en su compra inicial sin cambiar sus cifras", () => {
    const tx = initialBuyFromInvestment(inv);
    expect(tx).toEqual({ user_id: 1, fund_id: 17, type: "BUY", shares: 66.893659, price: 14.9491, amount: 1000, date: "2025-07-15", fees: 0, notes: "Compra inicial" });
    const summary = calculatePmp([{ ...tx, id: 1, created_at: "2026-10-18" }]);
    expect(summary.currentShares).toBe(66.893659);
    expect(summary.pmp).toBe(14.9491);
  });

  it("acepta fechas con hora (DATETIME de MySQL)", () => {
    expect(initialBuyFromInvestment({ ...inv, purchase_date: "2025-07-15 00:00:00" }).date).toBe("2025-07-15");
  });
});

describe("planInvestmentEdit", () => {
  const base = { id: 1, user_id: 1, fund_id: 17, type: "BUY" as const, shares: 66.893659, price: 14.9491, amount: 1000, date: "2025-07-15", fees: 0, notes: "Compra inicial", created_at: "" };
  const edit = { shares: 66, purchase_price: 15.15, purchase_date: "2025-07-15" };

  it("sin movimientos: editar sin más", () => {
    expect(planInvestmentEdit([], edit)).toEqual({ action: "none" });
  });

  it("solo la compra inicial: se actualiza con los datos editados", () => {
    expect(planInvestmentEdit([base], edit)).toEqual({ action: "update", txId: 1, shares: 66, price: 15.15, amount: 999.9, date: "2025-07-15" });
  });

  it("con más movimientos: se rechaza", () => {
    const r = planInvestmentEdit([base, { ...base, id: 2, date: "2026-01-10" }], edit);
    expect(r.action).toBe("reject");
  });
});

describe("validateRemoval", () => {
  const tx = (id: number, type: "BUY" | "SELL", shares: number, date: string) =>
    ({ id, user_id: 1, fund_id: 1, type, shares, price: 10, amount: shares * 10, date, fees: 0, notes: null, created_at: "" });

  it("no deja borrar el único movimiento (hay que borrar el fondo)", () => {
    expect(() => validateRemoval([tx(1, "BUY", 10, "2026-01-01")], 1)).toThrow("borra el fondo");
  });

  it("no deja borrar una compra si una venta posterior quedaría sin participaciones", () => {
    const txs = [tx(1, "BUY", 10, "2026-01-01"), tx(2, "BUY", 5, "2026-02-01"), tx(3, "SELL", 12, "2026-03-01")];
    expect(() => validateRemoval(txs, 2)).toThrow("venta");
  });

  it("permite borrar una aportación si todo sigue cuadrando", () => {
    const txs = [tx(1, "BUY", 10, "2026-01-01"), tx(2, "BUY", 5, "2026-02-01"), tx(3, "SELL", 8, "2026-03-01")];
    expect(() => validateRemoval(txs, 2)).not.toThrow();
  });

  it("movimiento inexistente", () => {
    expect(() => validateRemoval([tx(1, "BUY", 10, "2026-01-01")], 99)).toThrow("no encontrado");
  });
});
