import { describe, expect, it } from "bun:test";
import { buildPortfolioCsv } from "./exports";
import type { Investment } from "./api";

const ibercaja = {
  id: 17,
  isin: "ES0147077038",
  name: "Ibercaja Gestión Audaz A FI",
  bank: "Ibercaja",
  shares: 66.893659,
  purchase_price: 14.9491,
  total_invested: 1000,
  current_price: 18.408775,
} as unknown as Investment;

describe("buildPortfolioCsv", () => {
  it("incluye cabecera y una fila por fondo", () => {
    const lines = buildPortfolioCsv([ibercaja]).split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe("ID;ISIN;Nombre;Entidad;Participaciones;Precio compra;Precio actual;Invertido;Valor actual;Ganancia;Rentabilidad %");
  });

  it("calcula valor, ganancia y rentabilidad con coma decimal (Excel en español)", () => {
    const row = buildPortfolioCsv([ibercaja]).split("\n")[1];
    expect(row).toBe('17;"ES0147077038";"Ibercaja Gestión Audaz A FI";"Ibercaja";66,893659;14,9491;18,408775;1000,00;1231,43;231,43;23,14');
  });

  it("sin precio actual usa el de compra: ganancia 0", () => {
    const row = buildPortfolioCsv([{ ...ibercaja, current_price: null } as unknown as Investment]).split("\n")[1];
    expect(row.endsWith(";1000,00;1000,00;0,00;0,00")).toBe(true);
  });

  it("escapa comillas en el nombre", () => {
    const row = buildPortfolioCsv([{ ...ibercaja, name: 'Fondo "X"' } as unknown as Investment]).split("\n")[1];
    expect(row).toContain('"Fondo ""X"""');
  });

  it("cartera vacía: solo cabecera", () => {
    expect(buildPortfolioCsv([]).split("\n")).toHaveLength(1);
  });
});
