import { describe, it, expect } from "bun:test";
import { getFundExtraMetadata } from "../metadata";

describe("Asset Allocation & Metadata Engine", () => {
  it("genera metadatos y marca isPlaceholder=true si son estimados", () => {
    const meta = getFundExtraMetadata("ES0138797007", "Renta Variable España", "Santander Acciones Españolas");
    expect(meta.isPlaceholder).toBe(true);
    expect(meta.ter).toBeGreaterThan(0);
    expect(meta.sectors?.length).toBeGreaterThan(0);
    expect(meta.geography?.length).toBeGreaterThan(0);
    expect(meta.topHoldings?.length).toBeGreaterThan(0);
  });

});
