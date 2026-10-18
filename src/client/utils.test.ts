import { describe, expect, it } from "bun:test";
import { formatCompactEur, formatEur, formatPct, maskPhone } from "./utils";

// Intl usa espacio duro (U+00A0) antes del símbolo; normalizamos para comparar.
const n = (s: string) => s.replace(/ | /g, " ");

describe("formatEur", () => {
  it("formatea en es-ES con miles y céntimos", () => {
    expect(n(formatEur(1755.22))).toBe("1.755,22 €");
  });

  it("formatea importes pequeños sin separador de miles", () => {
    expect(n(formatEur(225.48))).toBe("225,48 €");
  });

  it("formatea pérdidas con signo menos", () => {
    expect(n(formatEur(-5.95))).toBe("-5,95 €");
  });

  it("redondea a céntimos", () => {
    expect(n(formatEur(231.4349))).toBe("231,43 €");
    expect(n(formatEur(0.005))).toBe("0,01 €");
  });

  it("muestra cero como 0,00 €", () => {
    expect(n(formatEur(0))).toBe("0,00 €");
  });

  it("devuelve guion para NaN e infinitos", () => {
    expect(formatEur(NaN)).toBe("—");
    expect(formatEur(Infinity)).toBe("—");
  });
});

describe("formatPct", () => {
  it("pone signo + en positivos y coma decimal", () => {
    expect(n(formatPct(14.74))).toBe("+14,74 %");
  });

  it("pone signo - en negativos", () => {
    expect(n(formatPct(-1.12))).toBe("-1,12 %");
  });

  it("muestra cero sin signo", () => {
    expect(n(formatPct(0))).toBe("0,00 %");
  });

  it("devuelve guion para NaN", () => {
    expect(formatPct(NaN)).toBe("—");
  });
});

describe("maskPhone", () => {
  it("oculta todo salvo prefijo y últimas 3 cifras", () => {
    expect(maskPhone("+34622890965")).toBe("+34 ••• ••• 965");
  });

  it("devuelve cadena vacía si no hay teléfono", () => {
    expect(maskPhone(null)).toBe("");
    expect(maskPhone("")).toBe("");
  });

  it("no revela números cortos", () => {
    expect(maskPhone("1234")).toBe("•••");
  });
});

describe("formatCompactEur (eje del gráfico)", () => {
  it("menos de mil: euros enteros", () => {
    expect(n(formatCompactEur(950))).toBe("950 €");
  });
  it("miles con un decimal y sin repetir etiquetas cercanas", () => {
    expect(n(formatCompactEur(1755.22))).toBe("1,8 k €");
    expect(n(formatCompactEur(1500))).toBe("1,5 k €");
    expect(n(formatCompactEur(12480))).toBe("12,5 k €");
  });
  it("millones con dos decimales", () => {
    expect(n(formatCompactEur(1_250_000))).toBe("1,25 M €");
  });
  it("cero y no finitos", () => {
    expect(n(formatCompactEur(0))).toBe("0 €");
    expect(formatCompactEur(NaN)).toBe("—");
  });
});
