import { describe, expect, it } from "bun:test";
import { normalizeDisplayName } from "../validation";

describe("normalizeDisplayName", () => {
  it("acepta nombres normales y recorta espacios", () => {
    expect(normalizeDisplayName("  Rubén  ")).toEqual({ ok: true, value: "Rubén" });
    expect(normalizeDisplayName("María José")).toEqual({ ok: true, value: "María José" });
    expect(normalizeDisplayName("D'Angelo O'Neil-Smith")).toEqual({ ok: true, value: "D'Angelo O'Neil-Smith" });
  });

  it("junta espacios repetidos", () => {
    expect(normalizeDisplayName("Ana   Belén")).toEqual({ ok: true, value: "Ana Belén" });
  });

  it("vacío borra el nombre (se vuelve a usar el usuario)", () => {
    expect(normalizeDisplayName("   ")).toEqual({ ok: true, value: null });
  });

  it("rechaza símbolos, HTML y nombres demasiado largos", () => {
    expect(normalizeDisplayName("<script>").ok).toBe(false);
    expect(normalizeDisplayName("Rubén 😀").ok).toBe(false);
    expect(normalizeDisplayName("a".repeat(41)).ok).toBe(false);
    expect(normalizeDisplayName("123").ok).toBe(false);
  });
});
