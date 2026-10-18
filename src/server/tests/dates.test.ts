import { describe, expect, it } from "bun:test";
import { toIsoDate } from "../dates";

describe("toIsoDate", () => {
  it("convierte DD/MM/YYYY (QueFondos) a YYYY-MM-DD", () => {
    expect(toIsoDate("14/10/2026")).toBe("2026-10-14");
  });
  it("deja YYYY-MM-DD tal cual", () => {
    expect(toIsoDate("2026-10-14")).toBe("2026-10-14");
  });
  it("convierte segundos Unix (Yahoo regularMarketTime) al día UTC", () => {
    expect(toIsoDate(Math.floor(Date.UTC(2026, 9, 14, 15, 30) / 1000))).toBe("2026-10-14");
  });
  it("devuelve null para vacío o basura", () => {
    expect(toIsoDate(undefined)).toBe(null);
    expect(toIsoDate("")).toBe(null);
    expect(toIsoDate("ayer")).toBe(null);
  });
});
