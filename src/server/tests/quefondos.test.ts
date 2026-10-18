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

  it("lee las rentabilidades de la tabla actual de la ficha (fila rXm_row, celdas <td>)", () => {
    // Estructura real de quefondos.com (oct 2026): el botón «1 año» del gráfico aparece antes
    // que la tabla y lleva otro porcentaje cerca; no debe confundirse con la rentabilidad.
    const html = `
      <span class="floatleft">Valor liquidativo: </span><span class="floatright">18,408775 EUR</span>
      <span class="label">Fecha</span><span class="fecha">14/10/2026</span>
      <label title="1 a&ntilde;o" for="diffm_12" class="opt" id="diffm_12_label">1 a&ntilde;o</label>
      <p>Volatilidad <span class="mas">1,17%</span></p>
      <table>
        <thead><tr><th class="first"></th><th>1 mes</th><th>3 meses</th><th>1 a&ntilde;o</th><th>3 a&ntilde;os</th><th class="last">5 a&ntilde;os</th></tr></thead>
        <tbody>
          <tr id="rXm_row" class="par">
            <td class="label">Fondo</td><td class="mas">3,59%</td><td class="mas">2,41%</td><td class="mas">14,68%</td><td class="mas">44,14%</td><td class="menos">-4,02%</td>
          </tr>
          <tr id="gfi_rXm_row" class="impar">
            <td class="label">Categor&iacute;a</td><td class="mas">2,88%</td><td class="mas">2,35%</td><td class="mas">17,18%</td><td class="mas">57,90%</td><td class="mas">58,42%</td>
          </tr>
        </tbody>
      </table>`;
    const result = extractQueFondosHtml(html);
    expect(result.return1Y).toBeCloseTo(14.68, 2);
    expect(result.return3Y).toBeCloseTo(44.14, 2);
    expect(result.return5Y).toBeCloseTo(-4.02, 2);
  });

  it("fecha el último punto de la serie con la fecha oficial del valor liquidativo", () => {
    // La serie marca el NAV del 14/10 como «10/15/2026» (día de publicación)
    const html = `
      <span class="floatleft">Valor liquidativo: </span><span class="floatright">18,408775 EUR</span>
      <span class="fecha">14/10/2026</span>
      <script>var fondo = [["09/30/2026",18.152267],["10/15/2026",18.408775]];</script>`;
    const { historicalQuotes } = extractQueFondosHtml(html);
    const last = historicalQuotes[historicalQuotes.length - 1];
    const d = new Date(last.timestamp * 1000);
    expect([d.getFullYear(), d.getMonth() + 1, d.getDate()]).toEqual([2026, 10, 14]);
    expect(last.close).toBe(18.408775);
  });

  it("deja en 0 las rentabilidades que la ficha no publica (fondo reciente)", () => {
    const html = `
      <span class="floatleft">Valor liquidativo: </span><span class="floatright">10,000000 EUR</span>
      <tr id="rXm_row" class="par"><td class="label">Fondo</td><td class="mas">1,00%</td><td class="mas">2,00%</td><td class="mas">5,00%</td><td class="igual">-</td><td class="igual">-</td></tr>`;
    const result = extractQueFondosHtml(html);
    expect(result.return1Y).toBeCloseTo(5, 2);
    expect(result.return3Y).toBe(0);
    expect(result.return5Y).toBe(0);
  });

  it("descarta páginas de plantilla o vacías de QueFondos", () => {
    const templateHtml = "<html><body>{ISIN} - {NFONDO} no encontrado</body></html>";
    const result = extractQueFondosHtml(templateHtml);
    expect(result.currentPrice).toBeNull();
  });
});
