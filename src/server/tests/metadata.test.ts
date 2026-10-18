import { describe, it, expect } from "bun:test";
import {
  getFundExtraMetadata,
  computePortfolioAssetAllocation,
} from "../metadata";

describe("Asset Allocation & Metadata Engine", () => {
  it("genera metadatos y marca isPlaceholder=true si son estimados", () => {
    const meta = getFundExtraMetadata("ES0138797007", "Renta Variable España", "Santander Acciones Españolas");
    expect(meta.isPlaceholder).toBe(true);
    expect(meta.ter).toBeGreaterThan(0);
    expect(meta.sectors?.length).toBeGreaterThan(0);
    expect(meta.geography?.length).toBeGreaterThan(0);
    expect(meta.topHoldings?.length).toBeGreaterThan(0);
  });

  it("calcula asignación de activos ponderada exacta para una cartera", () => {
    const portfolio = [
      {
        isin: "IE00B03HD191",
        name: "Vanguard S&P 500",
        current_value: 6000, // 60% of portfolio
        metadata: {
          ter: 0.07,
          sectors: [
            { name: "Tecnología", weight: 30 },
            { name: "Finanzas", weight: 20 },
          ],
          geography: [
            { name: "Estados Unidos", weight: 100 },
          ],
          topHoldings: [
            { name: "Microsoft", weight: 7 },
            { name: "Apple", weight: 6 },
          ],
        },
      },
      {
        isin: "IE00B4L5Y983",
        name: "iShares Core MSCI World",
        current_value: 4000, // 40% of portfolio
        metadata: {
          ter: 0.20,
          sectors: [
            { name: "Tecnología", weight: 25 },
            { name: "Salud", weight: 15 },
          ],
          geography: [
            { name: "Estados Unidos", weight: 70 },
            { name: "Europa", weight: 20 },
          ],
          topHoldings: [
            { name: "Microsoft", weight: 5 },
            { name: "Nvidia", weight: 4 },
          ],
        },
      },
    ];

    const allocation = computePortfolioAssetAllocation(portfolio);

    // TER ponderado: (0.07 * 0.6) + (0.20 * 0.4) = 0.042 + 0.08 = 0.122%
    expect(allocation.weightedTer).toBeCloseTo(0.122, 2);

    // Sector Tecnología ponderado: (30 * 0.6) + (25 * 0.4) = 18 + 10 = 28%
    const tech = allocation.sectors.find((s) => s.name === "Tecnología");
    expect(tech?.weight).toBeCloseTo(28, 1);

    // Geografía Estados Unidos ponderado: (100 * 0.6) + (70 * 0.4) = 60 + 28 = 88%
    const usa = allocation.geography.find((g) => g.name === "Estados Unidos");
    expect(usa?.weight).toBeCloseTo(88, 1);

    // Top holding Microsoft: (7 * 0.6) + (5 * 0.4) = 4.2 + 2.0 = 6.2%
    const msft = allocation.topHoldings.find((h) => h.name === "Microsoft");
    expect(msft?.weight).toBeCloseTo(6.2, 1);
  });

  it("devuelve asignación vacía si el valor total de la cartera es 0", () => {
    const emptyAllocation = computePortfolioAssetAllocation([]);
    expect(emptyAllocation.weightedTer).toBe(0);
    expect(emptyAllocation.sectors).toHaveLength(0);
    expect(emptyAllocation.geography).toHaveLength(0);
  });
});
