import { describe, it, expect } from "bun:test";
import {
  parseSpanishFloat,
  parseSpanishDate,
  businessDaysDiff,
  extractQueFondosHtml,
} from "../quefondos";

describe("QueFondos Robust Parser", () => {
  it("parsea números españoles con decimales y separador de miles", () => {
    expect(parseSpanishFloat("283,805151")).toBeCloseTo(283.805151, 6);
    expect(parseSpanishFloat("1.234,56")).toBeCloseTo(1234.56, 2);
    expect(parseSpanishFloat("0,18")).toBeCloseTo(0.18, 2);
    expect(parseSpanishFloat("-5,25")).toBeCloseTo(-5.25, 2);
    expect(isNaN(parseSpanishFloat(""))).toBe(true);
  });

  it("parsea fechas en formato DD/MM/YYYY", () => {
    const d1 = parseSpanishDate("15/08/2026");
    expect(d1).not.toBeNull();
    expect(d1?.getDate()).toBe(15);
    expect(d1?.getMonth()).toBe(7); // August = 7
    expect(d1?.getFullYear()).toBe(2026);

    expect(parseSpanishDate("fecha_invalida")).toBeNull();
    expect(parseSpanishDate("")).toBeNull();
  });

  it("calcula correctamente días hábiles entre dos fechas", () => {
    // Viernes a Lunes = 1 día hábil de diferencia
    const viernes = new Date(2026, 7, 14); // 14 Aug 2026 (Friday)
    const lunes = new Date(2026, 7, 17);   // 17 Aug 2026 (Monday)
    expect(businessDaysDiff(viernes, lunes)).toBe(1);
  });

  it("extrae NAV, fecha y rentabilidades de un HTML simulado de QueFondos", () => {
    const mockHtml = `
      <html>
        <body>
          <div class="ficha">
            <span class="etiqueta">Valor liquidativo: </span>
            <span class="valor">148,321500 EUR</span>
            <span class="fecha">12/08/2026</span>
          </div>
          <table>
            <tr>
              <td>1 año</td>
              <td><span class="mas">12,45%</span></td>
            </tr>
            <tr>
              <td>3 años</td>
              <td><span class="mas">28,10%</span></td>
            </tr>
            <tr>
              <td>5 años</td>
              <td><span class="menos">-3,20%</span></td>
            </tr>
          </table>
          <script>
            var fondo = [["06/30/2026", 145.2], ["07/31/2026", 147.5], ["08/12/2026", 148.32]];
          </script>
        </body>
      </html>
    `;

    const result = extractQueFondosHtml(mockHtml);
    expect(result.currentPrice).toBeCloseTo(148.3215, 4);
    expect(result.dataDate).toBe("12/08/2026");
    expect(result.return1Y).toBeCloseTo(12.45, 2);
    expect(result.return3Y).toBeCloseTo(28.10, 2);
    expect(result.return5Y).toBeCloseTo(-3.20, 2);
    expect(result.historicalQuotes.length).toBe(3);
  });

  it("descarta páginas de plantilla o vacías de QueFondos", () => {
    const templateHtml = "<html><body>{ISIN} - {NFONDO} no encontrado</body></html>";
    const result = extractQueFondosHtml(templateHtml);
    expect(result.currentPrice).toBeNull();
  });
});
