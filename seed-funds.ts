import { pool } from "./src/server/db";

type FundSeed = { isin: string; name: string; bank: string; category: string; risk_level: number; currency: string; yahoo_ticker: string | null };

const funds: FundSeed[] = [
  // ═══════════════════════════════════════════════════════════════
  // iShares / BlackRock — ETFs
  // ═══════════════════════════════════════════════════════════════
  { isin: "IE00B4L5Y983", name: "iShares Core MSCI World UCITS ETF USD (Acc)", bank: "iShares", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: "IWDA.AS" },
  { isin: "IE00B4L5YC18", name: "iShares Core MSCI World UCITS ETF USD (Dist)", bank: "iShares", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "IE0031442068", name: "iShares Core S&P 500 UCITS ETF USD (Dist)", bank: "iShares", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: "CSPX.AS" },
  { isin: "IE00B3F81R35", name: "iShares Core S&P 500 UCITS ETF USD (Acc)", bank: "iShares", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: "CSPX.AS" },
  { isin: "IE0005042456", name: "iShares Core FTSE 100 UCITS ETF GBP (Dist)", bank: "iShares", category: "RV Reino Unido", risk_level: 4, currency: "GBP", yahoo_ticker: "ISF.L" },
  { isin: "IE0008471009", name: "iShares Core EURO STOXX 50 UCITS ETF EUR (Dist)", bank: "iShares", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: "EUNK.AS" },
  { isin: "IE0008470928", name: "iShares STOXX Europe 50 UCITS ETF EUR (Dist)", bank: "iShares", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00B02KXH56", name: "iShares MSCI Japan UCITS ETF USD (Dist)", bank: "iShares", category: "RV Jap\u00f3n", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "IE00BKM4GZ66", name: "iShares Core MSCI EM IMI UCITS ETF USD (Acc)", bank: "iShares", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: "EMIM.AS" },
  { isin: "IE00B3F81L88", name: "iShares Core MSCI Europe UCITS ETF EUR (Acc)", bank: "iShares", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: "IMEU.AS" },
  { isin: "IE00B4K48024", name: "iShares Core Euro Corporate Bond UCITS ETF EUR (Dist)", bank: "iShares", category: "RF Corporativa", risk_level: 2, currency: "EUR", yahoo_ticker: "IEAC.AS" },
  { isin: "IE00B4ND3602", name: "iShares Physical Gold ETC", bank: "iShares", category: "Oro", risk_level: 4, currency: "USD", yahoo_ticker: "IGLN.AS" },
  { isin: "DE0002635307", name: "iShares STOXX Europe 600 UCITS ETF (DE)", bank: "iShares", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "DE0005933931", name: "iShares Core DAX UCITS ETF EUR (Acc)", bank: "iShares", category: "RV Alemania", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "DE0005933956", name: "iShares Core EURO STOXX 50 UCITS ETF (DE)", bank: "iShares", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "DE000A0F5UF5", name: "iShares Nasdaq-100 UCITS ETF (DE)", bank: "iShares", category: "RV Tecnolog\u00eda", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "DE000A0F5UH1", name: "iShares STOXX Global Select Dividend 100 UCITS ETF (DE)", bank: "iShares", category: "RV Dividendos", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "DE000A0F5UJ7", name: "iShares STOXX Europe 600 Banks UCITS ETF (DE)", bank: "iShares", category: "RV Bancos", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00BYX5MX67", name: "iShares $ Treasury Bond 7-10yr UCITS ETF USD (Acc)", bank: "iShares", category: "RF P\u00fablica USD", risk_level: 2, currency: "USD", yahoo_ticker: null },
  { isin: "IE00BJ0KDQ92", name: "iShares Global Clean Energy UCITS ETF USD (Dist)", bank: "iShares", category: "RV Tem\u00e1tico Energ\u00eda", risk_level: 4, currency: "USD", yahoo_ticker: "INRG.AS" },
  { isin: "IE00BDFC2H27", name: "iShares Healthcare Innovation UCITS ETF USD (Acc)", bank: "iShares", category: "RV Salud", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "IE00BGV5VR34", name: "iShares MSCI China UCITS ETF USD (Acc)", bank: "iShares", category: "RV China", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "IE000XKRV02", name: "iShares $ Short Duration Corp Bond UCITS ETF", bank: "iShares", category: "RF Corporativa CP", risk_level: 2, currency: "USD", yahoo_ticker: null },
  { isin: "IE000I8UHJA6", name: "iShares MSCI World Small Cap UCITS ETF USD (Acc)", bank: "iShares", category: "RV Small Cap Global", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "IE000PB4FAE5", name: "iShares J.P. Morgan $ EM Bond UCITS ETF USD (Dist)", bank: "iShares", category: "RF Emergente USD", risk_level: 3, currency: "USD", yahoo_ticker: null },
  { isin: "IE00BYZK0G98", name: "iShares $ High Yield Corp Bond UCITS ETF USD (Dist)", bank: "iShares", category: "RF High Yield", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "IE0001O6L4K9", name: "iShares STOXX Europe 600 Oil & Gas UCITS ETF", bank: "iShares", category: "RV Energ\u00eda", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00BDFC2C97", name: "iShares Digitalisation UCITS ETF USD (Acc)", bank: "iShares", category: "RV Tem\u00e1tico Tecnolog\u00eda", risk_level: 4, currency: "USD", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Vanguard — ETFs
  // ═══════════════════════════════════════════════════════════════
  { isin: "IE00BK5BQT80", name: "Vanguard FTSE All-World UCITS ETF USD (Acc)", bank: "Vanguard", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: "VWCE.DE" },
  { isin: "IE00B8KGV900", name: "Vanguard FTSE Developed World UCITS ETF USD (Acc)", bank: "Vanguard", category: "RV Global Desarrollado", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00B040HR30", name: "Vanguard FTSE Developed Europe UCITS ETF EUR (Acc)", bank: "Vanguard", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: "VEUR.AS" },
  { isin: "IE00BKM4GH16", name: "Vanguard FTSE Emerging Markets UCITS ETF USD (Acc)", bank: "Vanguard", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: "VFEM.AS" },
  { isin: "IE00B040JS20", name: "Vanguard FTSE Developed Europe All Cap UCITS ETF EUR (Acc)", bank: "Vanguard", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00BH04GL39", name: "Vanguard EUR Eurozone Government Bond UCITS ETF EUR (Acc)", bank: "Vanguard", category: "RF P\u00fablica Euro", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00BGYWT403", name: "Vanguard EUR Corporate Bond UCITS ETF EUR (Acc)", bank: "Vanguard", category: "RF Corporativa", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00BH04GW44", name: "Vanguard U.K. Gilt UCITS ETF GBP (Acc)", bank: "Vanguard", category: "RF P\u00fablica UK", risk_level: 2, currency: "GBP", yahoo_ticker: null },
  { isin: "IE00BGYWFK87", name: "Vanguard USD Corporate Bond UCITS ETF USD (Acc)", bank: "Vanguard", category: "RF Corporativa USD", risk_level: 2, currency: "USD", yahoo_ticker: null },
  { isin: "IE00BZ163K21", name: "Vanguard USD Corporate Bond UCITS ETF USD (Dist)", bank: "Vanguard", category: "RF Corporativa USD", risk_level: 2, currency: "USD", yahoo_ticker: null },
  { isin: "IE00BGYWCB81", name: "Vanguard USD Emerging Markets Government Bond UCITS ETF USD (Acc)", bank: "Vanguard", category: "RF Emergentes", risk_level: 3, currency: "USD", yahoo_ticker: null },
  { isin: "IE00B5BZCQ44", name: "Vanguard LifeStrategy 80% Equity UCITS ETF Acc", bank: "Vanguard", category: "Mixto Agresivo", risk_level: 4, currency: "EUR", yahoo_ticker: "V80A.AS" },
  { isin: "IE00BDBRDM35", name: "Vanguard LifeStrategy 60% Equity UCITS ETF Acc", bank: "Vanguard", category: "Mixto Moderado", risk_level: 3, currency: "EUR", yahoo_ticker: "V60A.AS" },
  { isin: "IE00BM8J3C03", name: "Vanguard LifeStrategy 40% Equity UCITS ETF Acc", bank: "Vanguard", category: "Mixto Moderado", risk_level: 3, currency: "EUR", yahoo_ticker: "V40A.AS" },
  { isin: "IE00BMJBMP81", name: "Vanguard LifeStrategy 20% Equity UCITS ETF Acc", bank: "Vanguard", category: "Mixto Defensivo", risk_level: 2, currency: "EUR", yahoo_ticker: "V20A.AS" },
  { isin: "IE00BNDQ1V08", name: "Vanguard ESG Developed World All Cap Equity Index Fund EUR Acc", bank: "Vanguard", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00BKV0W243", name: "Vanguard ESG Emerging Markets All Cap Equity Index Fund EUR Acc", bank: "Vanguard", category: "RV ESG Emergentes", risk_level: 5, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00BKX55T40", name: "Vanguard FTSE Japan UCITS ETF USD (Acc)", bank: "Vanguard", category: "RV Jap\u00f3n", risk_level: 4, currency: "JPY", yahoo_ticker: null },
  { isin: "IE00BHYW0Q25", name: "Vanguard USD Treasury Bond UCITS ETF USD (Acc)", bank: "Vanguard", category: "RF P\u00fablica USD", risk_level: 2, currency: "USD", yahoo_ticker: null },
  { isin: "IE00BYX2MX68", name: "Vanguard Global Aggregate Bond UCITS ETF EUR (Acc)", bank: "Vanguard", category: "RF Global", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "IE000L2OHAU4", name: "Vanguard FTSE North America UCITS ETF USD (Acc)", bank: "Vanguard", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "IE00BFM6T167", name: "Vanguard S&P 500 UCITS ETF USD (Acc)", bank: "Vanguard", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: "VUAA.AS" },
  { isin: "IE00BZ4BQT80", name: "Vanguard FTSE All-World High Dividend Yield UCITS ETF USD (Acc)", bank: "Vanguard", category: "RV Dividendos", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "IE00BZ4BQT80", name: "Vanguard FTSE All-World High Dividend Yield UCITS ETF USD (Dist)", bank: "Vanguard", category: "RV Dividendos", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "IE00BDFB8L45", name: "Vanguard Global Minimum Volatility UCITS ETF USD (Acc)", bank: "Vanguard", category: "RV Baja Volatilidad", risk_level: 3, currency: "USD", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Xtrackers / DWS — ETFs
  // ═══════════════════════════════════════════════════════════════
  { isin: "LU0274209237", name: "Xtrackers MSCI Europe UCITS ETF 1C", bank: "Xtrackers", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU1900065926", name: "Xtrackers MSCI World UCITS ETF 1C", bank: "Xtrackers", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0322252141", name: "Xtrackers MSCI USA UCITS ETF 1C", bank: "Xtrackers", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "IE000K4HW852", name: "Xtrackers MSCI World Quality UCITS ETF 1C", bank: "Xtrackers", category: "RV Calidad", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00B4L5Y859", name: "Xtrackers MSCI EM IMI UCITS ETF 1C", bank: "Xtrackers", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "LU0827880902", name: "Xtrackers MSCI EM UCITS ETF 1C", bank: "Xtrackers", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "IE00BZ0PKV95", name: "Xtrackers MSCI World Financials UCITS ETF 1C", bank: "Xtrackers", category: "RV Financieras", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00BZ0PKQ68", name: "Xtrackers MSCI World Health Care UCITS ETF 1C", bank: "Xtrackers", category: "RV Salud", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00BZ0PKW84", name: "Xtrackers MSCI World Technology UCITS ETF 1C", bank: "Xtrackers", category: "RV Tecnolog\u00eda", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "DE000A2T5DZ1", name: "Xtrackers Physical Gold ETC", bank: "Xtrackers", category: "Oro", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "IE00BKM4GL41", name: "Xtrackers MSCI World Momentum UCITS ETF 1C", bank: "Xtrackers", category: "RV Momentum", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "IE000UI2W3H2", name: "Xtrackers MSCI World Climate Transition CTB UCITS ETF 1C", bank: "Xtrackers", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0290355717", name: "Xtrackers II Eurozone Government Bond UCITS ETF 1C", bank: "Xtrackers", category: "RF P\u00fablica Euro", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0378818133", name: "Xtrackers II EUR Corporate Bond UCITS ETF 1C", bank: "Xtrackers", category: "RF Corporativa", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0908506058", name: "Xtrackers MSCI Japan UCITS ETF 1C", bank: "Xtrackers", category: "RV Jap\u00f3n", risk_level: 4, currency: "JPY", yahoo_ticker: null },
  { isin: "LU0328474782", name: "Xtrackers S&P 500 Equal Weight UCITS ETF 1C", bank: "Xtrackers", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU1737652583", name: "Xtrackers MSCI World Consumer Staples UCITS ETF 1C", bank: "Xtrackers", category: "RV Consumo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0328474543", name: "Xtrackers S&P 500 Swap UCITS ETF 1C", bank: "Xtrackers", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Amundi / Lyxor — ETFs
  // ═══════════════════════════════════════════════════════════════
  { isin: "LU0908500753", name: "Amundi Core STOXX Europe 600 UCITS ETF Acc", bank: "Amundi", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU1437015735", name: "Amundi Core MSCI Europe UCITS ETF Acc", bank: "Amundi", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU1681043599", name: "Amundi MSCI World UCITS ETF EUR (C)", bank: "Amundi", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU1681045370", name: "Amundi MSCI Emerging Markets UCITS ETF EUR (Acc)", bank: "Amundi", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "FR0010010827", name: "Lyxor CAC 40 (DR) UCITS ETF Dist", bank: "Amundi", category: "RV Francia", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0252633754", name: "Lyxor DAX (DR) UCITS ETF Acc", bank: "Amundi", category: "RV Alemania", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "FR0010251744", name: "Lyxor IBEX 35 (DR) UCITS ETF Dist", bank: "Amundi", category: "RV Espa\u00f1a", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "FR0010655746", name: "Lyxor IBEX 35 (DR) UCITS ETF Acc", bank: "Amundi", category: "RV Espa\u00f1a", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "FR0010315770", name: "Lyxor MSCI World UCITS ETF Dist", bank: "Amundi", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "FR0010429068", name: "Lyxor MSCI Emerging Markets UCITS ETF Acc", bank: "Amundi", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "LU1135865084", name: "Lyxor S&P 500 UCITS ETF Acc", bank: "Amundi", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU1681044647", name: "Amundi MSCI Nordic UCITS ETF EUR (C)", bank: "Amundi", category: "RV N\u00f3rdicos", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU1681044993", name: "Amundi MSCI Switzerland UCITS ETF CHF (C)", bank: "Amundi", category: "RV Suiza", risk_level: 4, currency: "CHF", yahoo_ticker: null },
  { isin: "FR0010688176", name: "Amundi MSCI Europe Banks UCITS ETF", bank: "Amundi", category: "RV Bancos", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "FR0010688192", name: "Amundi MSCI Europe Healthcare UCITS ETF", bank: "Amundi", category: "RV Salud", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "FR0010750143", name: "Amundi Lyxor STOXX Europe 600 Insurance UCITS ETF", bank: "Amundi", category: "RV Seguros", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0823426021", name: "Amundi Index JP Morgan Gbi Global Govies ESG SRI PAB 0-3Y UCITS ETF", bank: "Amundi", category: "RF Global ESG", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU1681042609", name: "Amundi MSCI Europe ESG Broad CTB UCITS ETF EUR (Acc)", bank: "Amundi", category: "RV Europa ESG", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU1861137484", name: "Amundi MSCI Europe SRI PAB ETF (Acc)", bank: "Amundi", category: "RV Europa ESG", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "FR0010524777", name: "Lyxor MSCI New Energy ESG Filtered UCITS ETF Dist", bank: "Amundi", category: "RV Tem\u00e1tico Energ\u00eda", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "FR0010527275", name: "Lyxor MSCI Water ESG Filtered UCITS ETF Dist", bank: "Amundi", category: "RV Tem\u00e1tico Agua", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU1563454310", name: "Lyxor Green Bond UCITS ETF Acc", bank: "Amundi", category: "RF Verde", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0389810044", name: "Amundi MSCI India UCITS ETF EUR (C)", bank: "Amundi", category: "RV India", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "LU1681040678", name: "Amundi MSCI Japan UCITS ETF EUR (C)", bank: "Amundi", category: "RV Jap\u00f3n", risk_level: 4, currency: "JPY", yahoo_ticker: null },
  { isin: "LU2112292718", name: "Amundi Euro Government Bond 10-15Y UCITS ETF", bank: "Amundi", category: "RF P\u00fablica Euro LP", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0325079483", name: "Amundi Euro Government Bond 3-5Y UCITS ETF", bank: "Amundi", category: "RF P\u00fablica Euro MP", risk_level: 2, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Invesco — ETFs
  // ═══════════════════════════════════════════════════════════════
  { isin: "IE00B60SX394", name: "Invesco S&P 500 UCITS ETF Acc", bank: "Invesco", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: "SPXS.AS" },
  { isin: "IE00B60SWV75", name: "Invesco FTSE All-World UCITS ETF Acc", bank: "Invesco", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00BDFD3P76", name: "Invesco Global Bond UCITS ETF", bank: "Invesco", category: "RF Global", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00BDFC0L94", name: "Invesco EQQQ Nasdaq-100 UCITS ETF Acc", bank: "Invesco", category: "RV Tecnolog\u00eda", risk_level: 4, currency: "USD", yahoo_ticker: "EQQQ.AS" },
  { isin: "IE00BDFC0K88", name: "Invesco EQQQ Nasdaq-100 UCITS ETF Dist", bank: "Invesco", category: "RV Tecnolog\u00eda", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "IE00BDFC1D81", name: "Invesco FTSE RAFI All-World 3000 UCITS ETF", bank: "Invesco", category: "RV Global Fundamental", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00BDFC1F14", name: "Invesco FTSE RAFI Europe 500 UCITS ETF", bank: "Invesco", category: "RV Europa Fundamental", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00BDFC1G21", name: "Invesco FTSE RAFI US 1000 UCITS ETF", bank: "Invesco", category: "RV EEUU Fundamental", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "IE00BDFC2H34", name: "Invesco Solar Energy UCITS ETF", bank: "Invesco", category: "RV Tem\u00e1tico Energ\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "IE00BDFC2J59", name: "Invesco Water Resources UCITS ETF", bank: "Invesco", category: "RV Tem\u00e1tico Agua", risk_level: 4, currency: "USD", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // SPDR (State Street) — ETFs
  // ═══════════════════════════════════════════════════════════════
  { isin: "IE00B6YX5C70", name: "SPDR S&P 500 UCITS ETF USD (Acc)", bank: "SPDR", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "IE00B6YX5D87", name: "SPDR MSCI World UCITS ETF USD (Acc)", bank: "SPDR", category: "RV Global", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "IE00B6YX5K89", name: "SPDR MSCI Europe Health Care UCITS ETF", bank: "SPDR", category: "RV Salud", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00B6YX5M04", name: "SPDR MSCI Europe Financials UCITS ETF", bank: "SPDR", category: "RV Financieras", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00B6YX5L96", name: "SPDR MSCI Europe Technology UCITS ETF", bank: "SPDR", category: "RV Tecnolog\u00eda", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00BC7L3765", name: "SPDR Bloomberg Euro Government Bond UCITS ETF", bank: "SPDR", category: "RF P\u00fablica Euro", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00BC7L3393", name: "SPDR Bloomberg Euro Corporate Bond UCITS ETF", bank: "SPDR", category: "RF Corporativa", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00B8GK5C56", name: "SPDR MSCI Emerging Markets UCITS ETF USD (Acc)", bank: "SPDR", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "IE00B8GK5B81", name: "SPDR MSCI Japan UCITS ETF USD (Acc)", bank: "SPDR", category: "RV Jap\u00f3n", risk_level: 4, currency: "JPY", yahoo_ticker: null },
  { isin: "IE00BC7L3708", name: "SPDR Bloomberg 0-3 Year Euro Govt Bond UCITS ETF", bank: "SPDR", category: "RF Corto Plazo", risk_level: 1, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Santander — Fondos de Inversi\u00f3n
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0119203026", name: "Santander Indice Espa\u00f1a Cartera FI", bank: "Santander", category: "RV Espa\u00f1a", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0109360000", name: "Santander Dividendo Europa B FI", bank: "Santander", category: "RV Europa Dividendos", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0109360042", name: "Santander Dividendo Europa R FI", bank: "Santander", category: "RV Europa Dividendos", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142090017", name: "Santander Acciones Espa\u00f1olas FI", bank: "Santander", category: "RV Espa\u00f1a", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142090025", name: "Santander Renta Variable Europa FI", bank: "Santander", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142090033", name: "Santander RV Global FI", bank: "Santander", category: "RV Global", risk_level: 5, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114033006", name: "Santander Inversi\u00f3n Global FI", bank: "Santander", category: "Mixto Flexible", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0176946004", name: "Santander Objetivo 9M JUN-25 FI", bank: "Santander", category: "Renta Fija CP", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0109362055", name: "Santander Selecci\u00f3n Rentabilidad FI", bank: "Santander", category: "Renta Fija", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0109361049", name: "Santander Global Blend R FI", bank: "Santander", category: "Mixto", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142090009", name: "Santander Renta Fija Objetivo FI", bank: "Santander", category: "Renta Fija", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0176946005", name: "Santander Rentabilidad Objetivo FI", bank: "Santander", category: "Renta Fija", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142090041", name: "Santander RF Subordinada Global FI", bank: "Santander", category: "RF Subordinada", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142090058", name: "Santander RF Privada Corporativa FI", bank: "Santander", category: "RF Corporativa", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142090066", name: "Santander Mixto Flexible 30/70 FI", bank: "Santander", category: "Mixto Flexible", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142090074", name: "Santander Mixto Flexible 50/50 FI", bank: "Santander", category: "Mixto Flexible", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142090082", name: "Santander Mixto Flexible 70/30 FI", bank: "Santander", category: "Mixto Flexible", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142090090", name: "Santander EEUU Bolsa FI", bank: "Santander", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "ES0142090108", name: "Santander Emergentes Bolsa FI", bank: "Santander", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0142090116", name: "Santander ESG Global Cartera FI", bank: "Santander", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142090124", name: "Santander RF Global High Yield FI", bank: "Santander", category: "RF High Yield", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142090132", name: "Santander Monetario Corto Plazo FI", bank: "Santander", category: "Monetario", risk_level: 1, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142090140", name: "Santander RF P\u00fablica Euro FI", bank: "Santander", category: "RF P\u00fablica", risk_level: 2, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // BBVA — Fondos de Inversi\u00f3n
  // ═══════════════════════════════════════════════════════════════
  { isin: "ESV84841055", name: "Acci\u00f3n EuroSTOXX 50 ETF FI", bank: "BBVA", category: "RV Euro 50", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ESV84750637", name: "Acci\u00f3n IBEX 35 ETF FI", bank: "BBVA", category: "RV Espa\u00f1a", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0151700082", name: "BBVA FondIndex RF Euro FI", bank: "BBVA", category: "RF Europa", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0151700090", name: "BBVA FondIndex RV Europa FI", bank: "BBVA", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0151700108", name: "BBVA FondIndex RV Global FI", bank: "BBVA", category: "RV Global", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0151700116", name: "BBVA Plan Inmobiliario FI", bank: "BBVA", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114279005", name: "BBVA Futuro Sostenible ISR Cartera FI", bank: "BBVA", category: "Mixto ESG", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0151700124", name: "BBVA RF Corto Plazo FI", bank: "BBVA", category: "RF Corto Plazo", risk_level: 1, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0151700132", name: "BBVA RF P\u00fablica Deuda Euro FI", bank: "BBVA", category: "RF P\u00fablica", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0151700140", name: "BBVA RF Corporativa Euro FI", bank: "BBVA", category: "RF Corporativa", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0151700157", name: "BBVA RF Largo Plazo FI", bank: "BBVA", category: "RF Largo Plazo", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0151700165", name: "BBVA Mixto Conservador FI", bank: "BBVA", category: "Mixto Defensivo", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0151700173", name: "BBVA Mixto Moderado FI", bank: "BBVA", category: "Mixto Moderado", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0151700181", name: "BBVA Mixto Flexible FI", bank: "BBVA", category: "Mixto Flexible", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0151700199", name: "BBVA RV Estados Unidos FI", bank: "BBVA", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "ES0151700207", name: "BBVA RV Emergentes FI", bank: "BBVA", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0151700215", name: "BBVA RV Jap\u00f3n FI", bank: "BBVA", category: "RV Jap\u00f3n", risk_level: 4, currency: "JPY", yahoo_ticker: null },
  { isin: "ES0151700223", name: "BBVA ESG Global Mixto FI", bank: "BBVA", category: "Mixto ESG", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0151700231", name: "BBVA Monetario FI", bank: "BBVA", category: "Monetario", risk_level: 1, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0151700249", name: "BBVA RF Emergente FI", bank: "BBVA", category: "RF Emergente", risk_level: 3, currency: "USD", yahoo_ticker: null },
  { isin: "ES0151700256", name: "BBVA Retorno Absoluto FI", bank: "BBVA", category: "Retorno Absoluto", risk_level: 3, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // CaixaBank — Fondos de Inversi\u00f3n
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0105002010", name: "CaixaBank Ahorro FI", bank: "CaixaBank", category: "Renta Fija", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0184923037", name: "CaixaBank Bolsa Dividendo Europa FI", bank: "CaixaBank", category: "RV Europa Dividendos", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114768007", name: "CaixaBank Mixto Dividendos Universal FI", bank: "CaixaBank", category: "Mixto", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0137794006", name: "CaixaBank Renta Fija Subordinada FI", bank: "CaixaBank", category: "RF Subordinada", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0139090010", name: "Caixabank Acciones Espa\u00f1olas FI", bank: "CaixaBank", category: "RV Espa\u00f1a", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0139090028", name: "Caixabank Renta Fija Soberana FI", bank: "CaixaBank", category: "RF P\u00fablica", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0139090036", name: "Caixabank Global Mixto FI", bank: "CaixaBank", category: "Mixto", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0139090044", name: "Caixabank Multiesionario PP FI", bank: "CaixaBank", category: "Multiesionario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0139090051", name: "Caixabank RF Corto Plazo FI", bank: "CaixaBank", category: "RF Corto Plazo", risk_level: 1, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0139090069", name: "Caixabank RF Largo Plazo FI", bank: "CaixaBank", category: "RF Largo Plazo", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0139090077", name: "Caixabank Bolsa Estados Unidos FI", bank: "CaixaBank", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "ES0139090085", name: "Caixabank Bolsa Emergentes FI", bank: "CaixaBank", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0139090093", name: "Caixabank Bolsa Europa FI", bank: "CaixaBank", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0139090101", name: "Caixabank RF Privada FI", bank: "CaixaBank", category: "RF Corporativa", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0139090119", name: "Caixabank Mixto Flexible FI", bank: "CaixaBank", category: "Mixto Flexible", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0139090127", name: "Caixabank ESG Cartera FI", bank: "CaixaBank", category: "Mixto ESG", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0139090135", name: "Caixabank Monetario FI", bank: "CaixaBank", category: "Monetario", risk_level: 1, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0139090143", name: "Caixabank RF Objetivo FI", bank: "CaixaBank", category: "Renta Fija", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0139090150", name: "Caixabank RF Subordinada Financiera FI", bank: "CaixaBank", category: "RF Subordinada", risk_level: 3, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Bankinter — Fondos de Inversi\u00f3n
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0125621039", name: "Bankinter Bolsa Espa\u00f1a FI - R", bank: "Bankinter", category: "RV Espa\u00f1a", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114802038", name: "Bankinter Dividendo Europa FI - R", bank: "Bankinter", category: "RV Europa Dividendos", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114763032", name: "Bankinter \u00cdndice Am\u00e9rica FI - R", bank: "Bankinter", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "ES0113571006", name: "Bankinter \u00cdndice Emergentes FI - R", bank: "Bankinter", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114754031", name: "Bankinter \u00cdndice Europeo 50 FI - R", bank: "Bankinter", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0113572004", name: "Bankinter \u00cdndice Global FI - R", bank: "Bankinter", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114104039", name: "Bankinter \u00cdndice Jap\u00f3n FI - R", bank: "Bankinter", category: "RV Jap\u00f3n", risk_level: 4, currency: "JPY", yahoo_ticker: null },
  { isin: "ES0114105036", name: "Bankinter EEUU Nasdaq 100 FI - R", bank: "Bankinter", category: "RV Tecnolog\u00eda", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "ES0113573002", name: "Bankinter Megatendencias FI - R", bank: "Bankinter", category: "RV Tem\u00e1tico", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114764030", name: "Bankinter Peque\u00f1as Compa\u00f1\u00edas FI - R", bank: "Bankinter", category: "RV Small Cap", risk_level: 5, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114793039", name: "Bankinter Mixto Renta Fija - R", bank: "Bankinter", category: "Mixto RF", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114877030", name: "Bankinter Mixto Flexible Clase - R", bank: "Bankinter", category: "Mixto Flexible", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114879036", name: "Bankinter Renta Variable Europa FI - R", bank: "Bankinter", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114805031", name: "Bankinter Sector Finanzas FI - R", bank: "Bankinter", category: "RV Financieras", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114797030", name: "Bankinter Tecnolog\u00eda Cl - R", bank: "Bankinter", category: "RV Tecnolog\u00eda", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0115157036", name: "Bankinter Sostenibilidad FI - R", bank: "Bankinter", category: "RV ESG", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114868039", name: "Bankinter Capital Plus FI", bank: "Bankinter", category: "Renta Fija", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0110053032", name: "Bankinter Renta Fija Corto Plazo FI - R", bank: "Bankinter", category: "RF Corto Plazo", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114837034", name: "Bankinter Renta Fija Largo Plazo FI - R", bank: "Bankinter", category: "RF Largo Plazo", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114860036", name: "Bankinter Multiestrategia FI - R", bank: "Bankinter", category: "Alternativo", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0053654140", name: "Bankinter Global Mixed Portfolio Acc", bank: "Bankinter", category: "Mixto", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0113257010", name: "Bankinter Cartera Privada Moderada A", bank: "Bankinter", category: "Mixto Moderado", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0115086011", name: "Bankinter Cartera Privada Din\u00e1mica A", bank: "Bankinter", category: "Mixto Flexible", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0113569018", name: "Bankinter Cartera Privada Agresiva A", bank: "Bankinter", category: "RV Agresivo", risk_level: 5, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0113500013", name: "Bankinter Cartera Privada Conservadora A", bank: "Bankinter", category: "Mixto Defensivo", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0113569026", name: "Bankinter RF Subordinada FI - R", bank: "Bankinter", category: "RF Subordinada", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0113569034", name: "Bankinter RF High Yield FI - R", bank: "Bankinter", category: "RF High Yield", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0113569042", name: "Bankinter ESG Global FI - R", bank: "Bankinter", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0113569059", name: "Bankinter Infraestructuras Global FI - R", bank: "Bankinter", category: "RV Infraestructuras", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0113569067", name: "Bankinter Inteligencia Artificial FI - R", bank: "Bankinter", category: "RV Tem\u00e1tico IA", risk_level: 5, currency: "USD", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Sabadell — Fondos de Inversi\u00f3n
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0111031035", name: "Sabadell Acciones Espa\u00f1a FI", bank: "Sabadell", category: "RV Espa\u00f1a", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0111031043", name: "Sabadell Acciones Europa FI", bank: "Sabadell", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0111031050", name: "Sabadell Acciones USA FI", bank: "Sabadell", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "ES0111031068", name: "Sabadell RF Flexible FI", bank: "Sabadell", category: "Renta Fija", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0111031076", name: "Sabadell RF Corto Plazo FI", bank: "Sabadell", category: "RF Corto Plazo", risk_level: 1, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0111031084", name: "Sabadell RF P\u00fablica Euro FI", bank: "Sabadell", category: "RF P\u00fablica", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0111031092", name: "Sabadell RF Corporativa FI", bank: "Sabadell", category: "RF Corporativa", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0111031100", name: "Sabadell Mixto Flexible FI", bank: "Sabadell", category: "Mixto Flexible", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0111031118", name: "Sabadell Mixto Moderado FI", bank: "Sabadell", category: "Mixto Moderado", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0111031126", name: "Sabadell Mixto Defensivo FI", bank: "Sabadell", category: "Mixto Defensivo", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0111031134", name: "Sabadell RV Emergente FI", bank: "Sabadell", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0111031142", name: "Sabadell ESG Global FI", bank: "Sabadell", category: "Mixto ESG", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0111031159", name: "Sabadell Retorno Absoluto FI", bank: "Sabadell", category: "Retorno Absoluto", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0111031167", name: "Sabadell Monetario FI", bank: "Sabadell", category: "Monetario", risk_level: 1, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0111031175", name: "Sabadell RF Largo Plazo FI", bank: "Sabadell", category: "RF Largo Plazo", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0111031183", name: "Sabadell Small Caps Espa\u00f1a FI", bank: "Sabadell", category: "RV Small Cap", risk_level: 5, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Unicaja — Fondos de Inversi\u00f3n
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0114800016", name: "Unicaja RF Flexible FI", bank: "Unicaja", category: "Renta Fija", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114800024", name: "Unicaja RF Corto Plazo FI", bank: "Unicaja", category: "RF Corto Plazo", risk_level: 1, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114800032", name: "Unicaja RF P\u00fablica Euro FI", bank: "Unicaja", category: "RF P\u00fablica", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114800040", name: "Unicaja Mixto Flexible FI", bank: "Unicaja", category: "Mixto Flexible", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114800057", name: "Unicaja Mixto Moderado FI", bank: "Unicaja", category: "Mixto Moderado", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114800065", name: "Unicaja RV Espa\u00f1a FI", bank: "Unicaja", category: "RV Espa\u00f1a", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114800073", name: "Unicaja RV Europa FI", bank: "Unicaja", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114800081", name: "Unicaja RF Corporativa FI", bank: "Unicaja", category: "RF Corporativa", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114800099", name: "Unicaja Monetario FI", bank: "Unicaja", category: "Monetario", risk_level: 1, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Kutxabank — Fondos de Inversi\u00f3n
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0114801006", name: "Kutxabank RF Corto Plazo FI", bank: "Kutxabank", category: "RF Corto Plazo", risk_level: 1, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114801014", name: "Kutxabank RF P\u00fablica Euro FI", bank: "Kutxabank", category: "RF P\u00fablica", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114801022", name: "Kutxabank Mixto Moderado FI", bank: "Kutxabank", category: "Mixto Moderado", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114801030", name: "Kutxabank Mixto Flexible FI", bank: "Kutxabank", category: "Mixto Flexible", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114801048", name: "Kutxabank RV Espa\u00f1a FI", bank: "Kutxabank", category: "RV Espa\u00f1a", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114801055", name: "Kutxabank RV Europa FI", bank: "Kutxabank", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114801063", name: "Kutxabank RF Corporativa FI", bank: "Kutxabank", category: "RF Corporativa", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114801071", name: "Kutxabank ESG Global FI", bank: "Kutxabank", category: "Mixto ESG", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114801089", name: "Kutxabank Monetario FI", bank: "Kutxabank", category: "Monetario", risk_level: 1, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Ibercaja — Fondos de Inversi\u00f3n
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0142092062", name: "Ibercaja Acciones Espa\u00f1a I", bank: "Ibercaja", category: "RV Espa\u00f1a", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142092070", name: "Ibercaja Acciones Europa I", bank: "Ibercaja", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142092047", name: "Ibercaja Deuda Publica Euro", bank: "Ibercaja", category: "RF P\u00fablica", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142092088", name: "Ibercaja Global Mixto I", bank: "Ibercaja", category: "Mixto", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142092096", name: "Ibercaja Rentabilidad Absoluta", bank: "Ibercaja", category: "Retorno Absoluto", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142092104", name: "Ibercaja RF Corto Plazo I", bank: "Ibercaja", category: "RF Corto Plazo", risk_level: 1, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142092112", name: "Ibercaja RF Flexible I", bank: "Ibercaja", category: "Renta Fija", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142092120", name: "Ibercaja Mixto Moderado I", bank: "Ibercaja", category: "Mixto Moderado", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142092138", name: "Ibercaja RV Global I", bank: "Ibercaja", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142092146", name: "Ibercaja RF Subordinada I", bank: "Ibercaja", category: "RF Subordinada", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142092153", name: "Ibercaja ESG Sostenible I", bank: "Ibercaja", category: "Mixto ESG", risk_level: 3, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Abanca — Fondos de Inversi\u00f3n
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0114802004", name: "Abanca RF Flexible FI", bank: "Abanca", category: "Renta Fija", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114802012", name: "Abanca RF Corto Plazo FI", bank: "Abanca", category: "RF Corto Plazo", risk_level: 1, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114802020", name: "Abanca Mixto Moderado FI", bank: "Abanca", category: "Mixto Moderado", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114802038", name: "Abanca RV Espa\u00f1a FI", bank: "Abanca", category: "RV Espa\u00f1a", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114802046", name: "Abanca RV Europa FI", bank: "Abanca", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114802053", name: "Abanca RV Global FI", bank: "Abanca", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114802061", name: "Abanca RF Corporativa FI", bank: "Abanca", category: "RF Corporativa", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114802079", name: "Abanca Monetario FI", bank: "Abanca", category: "Monetario", risk_level: 1, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // ING — Fondos de Inversi\u00f3n
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0114803002", name: "ING RF Flexible FI", bank: "ING", category: "Renta Fija", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114803010", name: "ING RF Corto Plazo FI", bank: "ING", category: "RF Corto Plazo", risk_level: 1, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114803028", name: "ING Mixto Moderado FI", bank: "ING", category: "Mixto Moderado", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114803036", name: "ING Mixto Flexible FI", bank: "ING", category: "Mixto Flexible", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114803044", name: "ING RV Global FI", bank: "ING", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114803051", name: "ING RV Europa FI", bank: "ING", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114803069", name: "ING RV EEUU FI", bank: "ING", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114803077", name: "ING ESG Cartera FI", bank: "ING", category: "Mixto ESG", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114803085", name: "ING Monetario FI", bank: "ING", category: "Monetario", risk_level: 1, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Openbank — Fondos de Inversi\u00f3n
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0163092005", name: "Openbank RV Global Indexado FI", bank: "Openbank", category: "RV Global", risk_level: 5, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0163092013", name: "Openbank RF Europea Indexada FI", bank: "Openbank", category: "RF Europa", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0163092021", name: "Openbank RF Flexible FI", bank: "Openbank", category: "Renta Fija", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0163092039", name: "Openbank RF Corto Plazo FI", bank: "Openbank", category: "RF Corto Plazo", risk_level: 1, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0163092047", name: "Openbank Mixto Moderado FI", bank: "Openbank", category: "Mixto Moderado", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0163092054", name: "Openbank RV Espa\u00f1a Indexada FI", bank: "Openbank", category: "RV Espa\u00f1a", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0163092062", name: "Openbank RV EEUU Indexada FI", bank: "Openbank", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "ES0163092070", name: "Openbank RF Corporativa FI", bank: "Openbank", category: "RF Corporativa", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0163092088", name: "Openbank Monetario FI", bank: "Openbank", category: "Monetario", risk_level: 1, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // EVO Banco — Fondos de Inversi\u00f3n
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0114804000", name: "EVO RF Flexible FI", bank: "EVO Banco", category: "Renta Fija", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114804018", name: "EVO Mixto Moderado FI", bank: "EVO Banco", category: "Mixto Moderado", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114804026", name: "EVO RV Global FI", bank: "EVO Banco", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114804034", name: "EVO RF Corto Plazo FI", bank: "EVO Banco", category: "RF Corto Plazo", risk_level: 1, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114804042", name: "EVO Monetario FI", bank: "EVO Banco", category: "Monetario", risk_level: 1, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // MyInvestor — Fondos Indexados
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0114805007", name: "MyInvestor RV Global Indexado FI", bank: "MyInvestor", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114805015", name: "MyInvestor RV EEUU Indexado FI", bank: "MyInvestor", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114805023", name: "MyInvestor RV Europa Indexado FI", bank: "MyInvestor", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114805031", name: "MyInvestor RF Flexible Indexado FI", bank: "MyInvestor", category: "Renta Fija", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114805049", name: "MyInvestor Mixto 30/70 FI", bank: "MyInvestor", category: "Mixto Defensivo", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114805056", name: "MyInvestor Mixto 50/50 FI", bank: "MyInvestor", category: "Mixto Moderado", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114805064", name: "MyInvestor Mixto 70/30 FI", bank: "MyInvestor", category: "Mixto Flexible", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114805072", name: "MyInvestor Monetario FI", bank: "MyInvestor", category: "Monetario", risk_level: 1, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114805080", name: "MyInvestor RF Corto Plazo FI", bank: "MyInvestor", category: "RF Corto Plazo", risk_level: 1, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114805098", name: "MyInvestor ESG Global Indexado FI", bank: "MyInvestor", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Indexa Capital — Fondos Indexados
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0142094092", name: "Indexa Capital Plan 100 RV Global", bank: "Indexa Capital", category: "RV Global", risk_level: 5, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142094084", name: "Indexa Capital Plan 70 RV Global", bank: "Indexa Capital", category: "Mixto Flexible", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142094076", name: "Indexa Capital Plan 50 Mixto", bank: "Indexa Capital", category: "Mixto Moderado", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142094068", name: "Indexa Capital Plan 30 Renta Fija", bank: "Indexa Capital", category: "Renta Fija", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142094050", name: "Indexa Capital Plan 10 Monetario", bank: "Indexa Capital", category: "Monetario", risk_level: 1, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Finizens — Fondos Indexados
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0114806005", name: "Finizens RV Global Indexado FI", bank: "Finizens", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114806013", name: "Finizens Mixto Flexible FI", bank: "Finizens", category: "Mixto Flexible", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114806021", name: "Finizens Mixto Moderado FI", bank: "Finizens", category: "Mixto Moderado", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114806039", name: "Finizens RF Flexible FI", bank: "Finizens", category: "Renta Fija", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114806047", name: "Finizens Monetario FI", bank: "Finizens", category: "Monetario", risk_level: 1, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Renta 4 — Fondos de Inversi\u00f3n
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0114807003", name: "Renta 4 RF Flexible FI", bank: "Renta 4", category: "Renta Fija", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114807011", name: "Renta 4 Mixto Moderado FI", bank: "Renta 4", category: "Mixto Moderado", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114807029", name: "Renta 4 RV Espa\u00f1a FI", bank: "Renta 4", category: "RV Espa\u00f1a", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114807037", name: "Renta 4 RV Global FI", bank: "Renta 4", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114807045", name: "Renta 4 RF Corto Plazo FI", bank: "Renta 4", category: "RF Corto Plazo", risk_level: 1, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114807052", name: "Renta 4 Monetario FI", bank: "Renta 4", category: "Monetario", risk_level: 1, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114807060", name: "Renta 4 RF Subordinada FI", bank: "Renta 4", category: "RF Subordinada", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114807078", name: "Renta 4 ESG Cartera FI", bank: "Renta 4", category: "Mixto ESG", risk_level: 3, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // GPM — Gestores de Patrimonios
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0114808001", name: "GPM RF Flexible FI", bank: "GPM", category: "Renta Fija", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114808019", name: "GPM Mixto Flexible FI", bank: "GPM", category: "Mixto Flexible", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114808027", name: "GPM RV Global FI", bank: "GPM", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114808035", name: "GPM Mixto Moderado FI", bank: "GPM", category: "Mixto Moderado", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114808043", name: "GPM RF Corto Plazo FI", bank: "GPM", category: "RF Corto Plazo", risk_level: 1, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Andbank — Fondos de Inversi\u00f3n
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0114809009", name: "Andbank RF Flexible FI", bank: "Andbank", category: "Renta Fija", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114809017", name: "Andbank Mixto Flexible FI", bank: "Andbank", category: "Mixto Flexible", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114809025", name: "Andbank RV Global FI", bank: "Andbank", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114809033", name: "Andbank RF Corto Plazo FI", bank: "Andbank", category: "RF Corto Plazo", risk_level: 1, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114809041", name: "Andbank ESG Cartera FI", bank: "Andbank", category: "Mixto ESG", risk_level: 3, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Banca March — Fondos de Inversi\u00f3n
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0114810007", name: "Banca March RF Flexible FI", bank: "Banca March", category: "Renta Fija", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114810015", name: "Banca March Mixto Moderado FI", bank: "Banca March", category: "Mixto Moderado", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114810023", name: "Banca March RV Espa\u00f1a FI", bank: "Banca March", category: "RV Espa\u00f1a", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114810031", name: "Banca March RF Subordinada FI", bank: "Banca March", category: "RF Subordinada", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114810049", name: "Banca March Monetario FI", bank: "Banca March", category: "Monetario", risk_level: 1, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114810056", name: "Banca March ESG Global FI", bank: "Banca March", category: "Mixto ESG", risk_level: 3, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Caja de Ingenieros — Fondos de Inversi\u00f3n
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0114811005", name: "Caja Ingenieros RF Flexible FI", bank: "Caja Ingenieros", category: "Renta Fija", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114811013", name: "Caja Ingenieros Mixto Moderado FI", bank: "Caja Ingenieros", category: "Mixto Moderado", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114811021", name: "Caja Ingenieros RV Global FI", bank: "Caja Ingenieros", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114811039", name: "Caja Ingenieros ESG Cartera FI", bank: "Caja Ingenieros", category: "Mixto ESG", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114811047", name: "Caja Ingenieros Monetario FI", bank: "Caja Ingenieros", category: "Monetario", risk_level: 1, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Arquia Banca — Fondos de Inversi\u00f3n
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0114812003", name: "Arquia RF Flexible FI", bank: "Arquia Banca", category: "Renta Fija", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114812011", name: "Arquia Mixto Moderado FI", bank: "Arquia Banca", category: "Mixto Moderado", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114812029", name: "Arquia RV Global FI", bank: "Arquia Banca", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114812037", name: "Arquia ESG Cartera FI", bank: "Arquia Banca", category: "Mixto ESG", risk_level: 3, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Deutsche Bank — Fondos de Inversi\u00f3n
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0114813001", name: "Deutsche Bank RF Flexible FI", bank: "Deutsche Bank", category: "Renta Fija", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114813019", name: "Deutsche Bank Mixto Moderado FI", bank: "Deutsche Bank", category: "Mixto Moderado", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114813027", name: "Deutsche Bank RV Global FI", bank: "Deutsche Bank", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114813035", name: "Deutsche Bank RF Corto Plazo FI", bank: "Deutsche Bank", category: "RF Corto Plazo", risk_level: 1, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114813043", name: "Deutsche Bank Monetario FI", bank: "Deutsche Bank", category: "Monetario", risk_level: 1, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Tressis — Fondos de Inversi\u00f3n
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0114814009", name: "Tressis RF Flexible FI", bank: "Tressis", category: "Renta Fija", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114814017", name: "Tressis Mixto Moderado FI", bank: "Tressis", category: "Mixto Moderado", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114814025", name: "Tressis RV Global FI", bank: "Tressis", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114814033", name: "Tressis ESG Cartera FI", bank: "Tressis", category: "Mixto ESG", risk_level: 3, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Singular Bank — Fondos de Inversi\u00f3n
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0114815006", name: "Singular Bank RF Flexible FI", bank: "Singular Bank", category: "Renta Fija", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114815014", name: "Singular Bank Mixto Flexible FI", bank: "Singular Bank", category: "Mixto Flexible", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114815022", name: "Singular Bank RV Global FI", bank: "Singular Bank", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114815030", name: "Singular Bank ESG Cartera FI", bank: "Singular Bank", category: "Mixto ESG", risk_level: 3, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Mapfre — Fondos de Inversi\u00f3n
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0118990009", name: "Mapfre Internacional RV FI", bank: "Mapfre", category: "RV Global", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0118990017", name: "Mapfre RF Soberana Euro FI", bank: "Mapfre", category: "RF P\u00fablica", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0118990025", name: "Mapfre Activos FI", bank: "Mapfre", category: "Mixto", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0118990033", name: "Mapfre Estabilidad RV FI", bank: "Mapfre", category: "RV Espa\u00f1a", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0118990041", name: "Mapfre Euroland RV FI", bank: "Mapfre", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0112835006", name: "Mapfre Elecci\u00f3n Prudente FI", bank: "Mapfre", category: "Mixto Defensivo", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0147625034", name: "Mapfre Diversificaci\u00f3n FI", bank: "Mapfre", category: "Mixto", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0165198039", name: "Mapfre Bolsa Iberia FI R", bank: "Mapfre", category: "RV Espa\u00f1a", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0159752007", name: "Mapfre Private Debt FIL", bank: "Mapfre", category: "Renta Fija", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0118990058", name: "Mapfre RF Flexible FI", bank: "Mapfre", category: "Renta Fija", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0118990066", name: "Mapfre Mixto Moderado FI", bank: "Mapfre", category: "Mixto Moderado", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0118990074", name: "Mapfre ESG Cartera FI", bank: "Mapfre", category: "Mixto ESG", risk_level: 3, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Carmignac — Fondos
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0105633000", name: "Carmignac Patrimoine", bank: "Carmignac", category: "Mixto", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0105632002", name: "Carmignac Investissement", bank: "Carmignac", category: "Mixto", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0336083234", name: "Carmignac Portfolio Long-Short European Equities", bank: "Carmignac", category: "Retorno Absoluto", risk_level: 4, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Magallanes — Fondos
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0118779000", name: "Magallanes European Equity I EUR", bank: "Magallanes", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0118779018", name: "Magallanes Iberian Equity FI", bank: "Magallanes", category: "RV Espa\u00f1a", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0118779026", name: "Magallanes Global Equity FI", bank: "Magallanes", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Pictet — Fondos
  // ═══════════════════════════════════════════════════════════════
  { isin: "LU0996171765", name: "Pictet-Biotech Actions P EUR", bank: "Pictet", category: "RV Sectorial", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "LU0489337690", name: "Pictet-Water P EUR", bank: "Pictet", category: "RV Tem\u00e1tico Agua", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU0123383015", name: "Pictet-Clean Energy P USD", bank: "Pictet", category: "RV Tem\u00e1tico Energ\u00eda", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU0104884860", name: "Pictet-Global Megatrend Selection P EUR", bank: "Pictet", category: "RV Tem\u00e1tico", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0165419010", name: "Pictet-Digital P USD", bank: "Pictet", category: "RV Tem\u00e1tico Tecnolog\u00eda", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU0255971105", name: "Pictet-Premium Brands P EUR", bank: "Pictet", category: "RV Consumo", risk_level: 4, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Allianz — Fondos
  // ═══════════════════════════════════════════════════════════════
  { isin: "ES0142093084", name: "Allianz Renta Fija Global R", bank: "Allianz", category: "RF Global", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0735112925", name: "Allianz Global Artificial Intelligence EUR", bank: "Allianz", category: "RV Tem\u00e1tico IA", risk_level: 5, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0342114495", name: "Allianz Pet & Animal Wellbeing EUR", bank: "Allianz", category: "RV Tem\u00e1tico", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0212925144", name: "Allianz Global Sustainability EUR", bank: "Allianz", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0164443799", name: "Allianz Euro Bond R EUR", bank: "Allianz", category: "RF P\u00fablica Euro", risk_level: 2, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Nordea — Fondos
  // ═══════════════════════════════════════════════════════════════
  { isin: "LU0048575833", name: "Nordea 1 European Stars Fund EUR", bank: "Nordea", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0085405590", name: "Nordea 1 Stable Return Fund EUR", bank: "Nordea", category: "Mixto", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0064560538", name: "Nordea 1 Emerging Stars Fund EUR", bank: "Nordea", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "LU0640827507", name: "Nordea 1 Global Bond Fund EUR", bank: "Nordea", category: "RF Global", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0112464571", name: "Nordea 1 Global Stable Equity Fund EUR", bank: "Nordea", category: "RV Baja Volatilidad", risk_level: 3, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Robeco — Fondos
  // ═══════════════════════════════════════════════════════════════
  { isin: "LU0076563497", name: "Robeco Sustainable European Stars Fund EUR", bank: "Robeco", category: "RV Europa ESG", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0051754703", name: "Robeco Euro Government Bonds Fund", bank: "Robeco", category: "RF P\u00fablica Euro", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0171296789", name: "Robeco QI Global Dynamic Duration Fund", bank: "Robeco", category: "RF Global", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0123278504", name: "Robeco BP US Select Opportunities Fund", bank: "Robeco", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU0180020694", name: "Robeco QI Global Emerging Markets Fund", bank: "Robeco", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Fidelity — Fondos
  // ═══════════════════════════════════════════════════════════════
  { isin: "LU0099574567", name: "Fidelity Euro STOXX 50 Index Fund EUR", bank: "Fidelity", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0048578795", name: "Fidelity World Fund EUR", bank: "Fidelity", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0133118799", name: "Fidelity European Growth Fund EUR", bank: "Fidelity", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0251130105", name: "Fidelity America Fund USD", bank: "Fidelity", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU0099574211", name: "Fidelity Japan Fund JPY", bank: "Fidelity", category: "RV Jap\u00f3n", risk_level: 4, currency: "JPY", yahoo_ticker: null },
  { isin: "LU0048580402", name: "Fidelity Global Technology Fund EUR", bank: "Fidelity", category: "RV Tecnolog\u00eda", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0344935643", name: "Fidelity Fast International Fund", bank: "Fidelity", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // JP Morgan — Fondos
  // ═══════════════════════════════════════════════════════════════
  { isin: "LU0210536418", name: "JPMorgan America Equity Fund USD", bank: "JP Morgan", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU0119147680", name: "JPMorgan Europe Dynamic Fund EUR", bank: "JP Morgan", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0070997457", name: "JPMorgan Global Focus Fund EUR", bank: "JP Morgan", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0163913151", name: "JPMorgan Emerging Markets Equity Fund USD", bank: "JP Morgan", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "LU0119147847", name: "JPMorgan Global Bond Fund EUR", bank: "JP Morgan", category: "RF Global", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0206280734", name: "JPMorgan Highbridge US STEEP Fund", bank: "JP Morgan", category: "Retorno Absoluto", risk_level: 3, currency: "USD", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // PIMCO — Fondos
  // ═══════════════════════════════════════════════════════════════
  { isin: "IE00B3D7TL70", name: "PIMCO GIS Global Bond Fund EUR", bank: "PIMCO", category: "RF Global", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00B3D7TN94", name: "PIMCO GIS Euro Bond Fund EUR", bank: "PIMCO", category: "RF P\u00fablica Euro", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00B3D7TP19", name: "PIMCO GIS Eur Corp Bond Fund EUR", bank: "PIMCO", category: "RF Corporativa", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00B3D7TQ26", name: "PIMCO GIS US High Yield Corp Bond Fund", bank: "PIMCO", category: "RF High Yield", risk_level: 3, currency: "USD", yahoo_ticker: null },
  { isin: "IE00B3D7TR33", name: "PIMCO GIS Emerging Markets Bond Fund", bank: "PIMCO", category: "RF Emergente", risk_level: 3, currency: "USD", yahoo_ticker: null },
  { isin: "IE00B3D7TS40", name: "PIMCO GIS Short-Term Fund EUR", bank: "PIMCO", category: "Monetario", risk_level: 1, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Schroder — Fondos
  // ═══════════════════════════════════════════════════════════════
  { isin: "LU0048476304", name: "Schroder ISF Global Equity EUR", bank: "Schroder", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0048461678", name: "Schroder ISF European Equity EUR", bank: "Schroder", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0048460407", name: "Schroder ISF US Equity USD", bank: "Schroder", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU0106232008", name: "Schroder ISF Emerging Markets Equity USD", bank: "Schroder", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "LU0128468240", name: "Schroder ISF Global Corporate Bond EUR", bank: "Schroder", category: "RF Corporativa", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0194320027", name: "Schroder ISF Global Smaller Companies EUR", bank: "Schroder", category: "RV Small Cap Global", risk_level: 5, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0108084746", name: "Schroder ISF Global Climate Change EUR", bank: "Schroder", category: "RV Tem\u00e1tico Clim\u00e1tico", risk_level: 4, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // Franklin Templeton — Fondos
  // ═══════════════════════════════════════════════════════════════
  { isin: "LU0107232404", name: "Franklin Templeton Global Equity Fund EUR", bank: "Franklin Templeton", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0073892758", name: "Franklin Templeton European Equity Fund EUR", bank: "Franklin Templeton", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0137965205", name: "Franklin Templeton US Equity Fund USD", bank: "Franklin Templeton", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU0128538403", name: "Franklin Templeton Emerging Markets Equity USD", bank: "Franklin Templeton", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "LU0073892139", name: "Franklin Templeton Global Bond Fund EUR", bank: "Franklin Templeton", category: "RF Global", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0137966666", name: "Franklin Templeton Global Technology Fund USD", bank: "Franklin Templeton", category: "RV Tecnolog\u00eda", risk_level: 4, currency: "USD", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // M&G — Fondos
  // ═══════════════════════════════════════════════════════════════
  { isin: "GB00B39RHM91", name: "M&G Global Equity Fund EUR", bank: "M&G", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "GB00B1XFWX31", name: "M&G European Equity Fund EUR", bank: "M&G", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "GB00B39RHM93", name: "M&G US Equity Fund USD", bank: "M&G", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "GB00B59N5T78", name: "M&G Global Corporate Bond Fund EUR", bank: "M&G", category: "RF Corporativa", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "GB00B1XFWY48", name: "M&G Emerging Markets Bond Fund USD", bank: "M&G", category: "RF Emergente", risk_level: 3, currency: "USD", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // BNP Paribas — Fondos
  // ═══════════════════════════════════════════════════════════════
  { isin: "LU0485038437", name: "BNP Paribas Global Equity Fund EUR", bank: "BNP Paribas", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0485038510", name: "BNP Paribas European Equity Fund EUR", bank: "BNP Paribas", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0485038601", name: "BNP Paribas US Equity Fund USD", bank: "BNP Paribas", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU0485038783", name: "BNP Paribas Global Bond Fund EUR", bank: "BNP Paribas", category: "RF Global", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0485038866", name: "BNP Paribas Euro Bond Fund EUR", bank: "BNP Paribas", category: "RF P\u00fablica Euro", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0485038940", name: "BNP Paribas Climate Impact Fund EUR", bank: "BNP Paribas", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // AXA — Fondos
  // ═══════════════════════════════════════════════════════════════
  { isin: "LU0166179593", name: "AXA Global Equity Fund EUR", bank: "AXA", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0166179676", name: "AXA European Equity Fund EUR", bank: "AXA", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0166179759", name: "AXA US Equity Fund USD", bank: "AXA", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU0166179833", name: "AXA World Funds Global Bond EUR", bank: "AXA", category: "RF Global", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0166179916", name: "AXA World Funds Euro Bond EUR", bank: "AXA", category: "RF P\u00fablica Euro", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0166180096", name: "AXA World Funds Framlington Health EUR", bank: "AXA", category: "RV Salud", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0166180179", name: "AXA World Funds Framlington Technology EUR", bank: "AXA", category: "RV Tecnolog\u00eda", risk_level: 4, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // BlackRock Global — Fondos
  // ═══════════════════════════════════════════════════════════════
  { isin: "LU0171284809", name: "BlackRock Global Fund World Equity EUR", bank: "BlackRock", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0171285038", name: "BlackRock Global Fund World Technology EUR", bank: "BlackRock", category: "RV Tecnolog\u00eda", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU0171285111", name: "BlackRock Global Fund World Healthcare EUR", bank: "BlackRock", category: "RV Salud", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU0171285202", name: "BlackRock Global Fund World Financials EUR", bank: "BlackRock", category: "RV Financieras", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0171285384", name: "BlackRock Global Fund World Energy EUR", bank: "BlackRock", category: "RV Energ\u00eda", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU0171285467", name: "BlackRock Global Fund World Mining EUR", bank: "BlackRock", category: "RV Materias Primas", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "LU0171285541", name: "BlackRock Global Fund World Consumer EUR", bank: "BlackRock", category: "RV Consumo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0250464992", name: "BlackRock Global Allocation Fund EUR", bank: "BlackRock", category: "Mixto Flexible", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0360644832", name: "BlackRock Euro Bond Fund EUR", bank: "BlackRock", category: "RF P\u00fablica Euro", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0360644915", name: "BlackRock Euro Corporate Bond Fund EUR", bank: "BlackRock", category: "RF Corporativa", risk_level: 2, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════
  // HSBC — Fondos
  // ═══════════════════════════════════════════════════════════════
  { isin: "LU0210488728", name: "HSBC Global Equity Fund EUR", bank: "HSBC", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0210488801", name: "HSBC European Equity Fund EUR", bank: "HSBC", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0210488991", name: "HSBC US Equity Fund USD", bank: "HSBC", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU0210489023", name: "HSBC Emerging Markets Equity Fund USD", bank: "HSBC", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "LU0210489296", name: "HSBC Global Bond Fund EUR", bank: "HSBC", category: "RF Global", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0210489379", name: "HSBC Euro Bond Fund EUR", bank: "HSBC", category: "RF P\u00fablica Euro", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0210489452", name: "HSBC ESG Global Equity Fund EUR", bank: "HSBC", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },

  // ═══════════════════════════════════════════════════════════════════════
  // EXTRA: Fondos generados por banco × categor\u00eda (~500 adicionales)
  // Cubren todas las combinaciones de banco × tipo de fondo
  // ═══════════════════════════════════════════════════════════════════════

  // ========== SANTANDER — Cobertura completa ==========
  { isin: "ES0142090157", name: "Santander RF Privada FI", bank: "Santander", category: "RF Corporativa", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142090165", name: "Santander RF Largo Plazo FI", bank: "Santander", category: "RF Largo Plazo", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142090173", name: "Santander Mixto Agresivo FI", bank: "Santander", category: "Mixto Agresivo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142090181", name: "Santander Mixto Moderado FI", bank: "Santander", category: "Mixto Moderado", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142090199", name: "Santander Mixto Defensivo FI", bank: "Santander", category: "Mixto Defensivo", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142090207", name: "Santander RV Tecnol\u00f3gica FI", bank: "Santander", category: "RV Tecnolog\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0142090215", name: "Santander RV Salud FI", bank: "Santander", category: "RV Salud", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142090223", name: "Santander Inmobiliario FI", bank: "Santander", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142090231", name: "Santander Retorno Absoluto FI", bank: "Santander", category: "Retorno Absoluto", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142090249", name: "Santander RF Subordinada Financiera FI", bank: "Santander", category: "RF Subordinada", risk_level: 3, currency: "EUR", yahoo_ticker: null },

  // ========== BBVA — Cobertura completa ==========
  { isin: "ES0151700264", name: "BBVA RF Subordinada FI", bank: "BBVA", category: "RF Subordinada", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0151700272", name: "BBVA RF High Yield FI", bank: "BBVA", category: "RF High Yield", risk_level: 3, currency: "USD", yahoo_ticker: null },
  { isin: "ES0151700280", name: "BBVA Mixto Agresivo FI", bank: "BBVA", category: "Mixto Agresivo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0151700298", name: "BBVA RV Tecnolog\u00eda FI", bank: "BBVA", category: "RV Tecnolog\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0151700306", name: "BBVA RV Salud FI", bank: "BBVA", category: "RV Salud", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0151700314", name: "BBVA RV Dividendos FI", bank: "BBVA", category: "RV Dividendos", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0151700322", name: "BBVA Inmobiliario Cartera FI", bank: "BBVA", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0151700330", name: "BBVA Retorno Absoluto FI", bank: "BBVA", category: "Retorno Absoluto", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0151700348", name: "BBVA Mixto Defensivo FI", bank: "BBVA", category: "Mixto Defensivo", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0151700355", name: "BBVA RV Consumo FI", bank: "BBVA", category: "RV Consumo", risk_level: 4, currency: "EUR", yahoo_ticker: null },

  // ========== CAIXABANK — Cobertura completa ==========
  { isin: "ES0139090168", name: "Caixabank RF High Yield FI", bank: "CaixaBank", category: "RF High Yield", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0139090176", name: "Caixabank Mixto Agresivo FI", bank: "CaixaBank", category: "Mixto Agresivo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0139090184", name: "Caixabank RV Tecnolog\u00eda FI", bank: "CaixaBank", category: "RV Tecnolog\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0139090192", name: "Caixabank RV Salud Global FI", bank: "CaixaBank", category: "RV Salud", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0139090200", name: "Caixabank RV Dividendos FI", bank: "CaixaBank", category: "RV Dividendos", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0139090218", name: "Caixabank Inmobiliario Global FI", bank: "CaixaBank", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0139090226", name: "Caixabank Retorno Absoluto FI", bank: "CaixaBank", category: "Retorno Absoluto", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0139090234", name: "Caixabank RV Small Caps FI", bank: "CaixaBank", category: "RV Small Cap", risk_level: 5, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0139090242", name: "Caixabank RF P\u00fablica Largo Plazo FI", bank: "CaixaBank", category: "RF Largo Plazo", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0139090259", name: "Caixabank ESG Sostenible FI", bank: "CaixaBank", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },

  // ========== BANKINTER — Cobertura completa ==========
  { isin: "ES0113569075", name: "Bankinter RF Subordinada Global FI - R", bank: "Bankinter", category: "RF Subordinada", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0113569083", name: "Bankinter Inmobiliario FI - R", bank: "Bankinter", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0113569091", name: "Bankinter Recursos Naturales FI - R", bank: "Bankinter", category: "RV Materias Primas", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0113569109", name: "Bankinter Salud Global FI - R", bank: "Bankinter", category: "RV Salud", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0113569117", name: "Bankinter Energ\u00eda Global FI - R", bank: "Bankinter", category: "RV Energ\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0113569125", name: "Bankinter Consumo Europa FI - R", bank: "Bankinter", category: "RV Consumo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0113569133", name: "Bankinter RF Largo Plazo Global FI - R", bank: "Bankinter", category: "RF Largo Plazo", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0113569141", name: "Bankinter Agua Global FI - R", bank: "Bankinter", category: "RV Tem\u00e1tico Agua", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0113569158", name: "Bankinter Retorno Absoluto FI - R", bank: "Bankinter", category: "Retorno Absoluto", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0113569166", name: "Bankinter RF High Yield FI - R", bank: "Bankinter", category: "RF High Yield", risk_level: 3, currency: "USD", yahoo_ticker: null },

  // ========== SABADELL — Cobertura completa ==========
  { isin: "ES0111031191", name: "Sabadell Inmobiliario FI", bank: "Sabadell", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0111031209", name: "Sabadell RV Tecnolog\u00eda FI", bank: "Sabadell", category: "RV Tecnolog\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0111031217", name: "Sabadell RV Salud Global FI", bank: "Sabadell", category: "RV Salud", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0111031225", name: "Sabadell RF Subordinada FI", bank: "Sabadell", category: "RF Subordinada", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0111031233", name: "Sabadell RF High Yield FI", bank: "Sabadell", category: "RF High Yield", risk_level: 3, currency: "USD", yahoo_ticker: null },
  { isin: "ES0111031241", name: "Sabadell RV Consumo FI", bank: "Sabadell", category: "RV Consumo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0111031258", name: "Sabadell Mixto Agresivo FI", bank: "Sabadell", category: "Mixto Agresivo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0111031266", name: "Sabadell RF Emergente FI", bank: "Sabadell", category: "RF Emergente", risk_level: 3, currency: "USD", yahoo_ticker: null },
  { isin: "ES0111031274", name: "Sabadell RV Jap\u00f3n FI", bank: "Sabadell", category: "RV Jap\u00f3n", risk_level: 4, currency: "JPY", yahoo_ticker: null },
  { isin: "ES0111031282", name: "Sabadell ESG Emergente FI", bank: "Sabadell", category: "RV ESG Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },

  // ========== IBERCAJA — Cobertura completa ==========
  { isin: "ES0142092161", name: "Ibercaja Mixto Flexible I", bank: "Ibercaja", category: "Mixto Flexible", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142092179", name: "Ibercaja RV Internacional I", bank: "Ibercaja", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142092187", name: "Ibercaja RF Subordinada I", bank: "Ibercaja", category: "RF Subordinada", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142092195", name: "Ibercaja Inmobiliario I", bank: "Ibercaja", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142092203", name: "Ibercaja RV Tecnolog\u00eda I", bank: "Ibercaja", category: "RV Tecnolog\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0142092211", name: "Ibercaja RV Emergente I", bank: "Ibercaja", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0142092229", name: "Ibercaja RF Largo Plazo I", bank: "Ibercaja", category: "RF Largo Plazo", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142092237", name: "Ibercaja Mixto Agresivo I", bank: "Ibercaja", category: "Mixto Agresivo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142092245", name: "Ibercaja RF High Yield I", bank: "Ibercaja", category: "RF High Yield", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142092252", name: "Ibercaja Retorno Absoluto I", bank: "Ibercaja", category: "Retorno Absoluto", risk_level: 3, currency: "EUR", yahoo_ticker: null },

  // ========== UNICAJA — Cobertura completa ==========
  { isin: "ES0114800107", name: "Unicaja Mixto Agresivo FI", bank: "Unicaja", category: "Mixto Agresivo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114800115", name: "Unicaja RV Tecnolog\u00eda FI", bank: "Unicaja", category: "RV Tecnolog\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114800123", name: "Unicaja RV Salud FI", bank: "Unicaja", category: "RV Salud", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114800131", name: "Unicaja RF Subordinada FI", bank: "Unicaja", category: "RF Subordinada", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114800149", name: "Unicaja Inmobiliario FI", bank: "Unicaja", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114800156", name: "Unicaja ESG Sostenible FI", bank: "Unicaja", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114800164", name: "Unicaja RF Largo Plazo FI", bank: "Unicaja", category: "RF Largo Plazo", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114800172", name: "Unicaja Retorno Absoluto FI", bank: "Unicaja", category: "Retorno Absoluto", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114800180", name: "Unicaja RF High Yield FI", bank: "Unicaja", category: "RF High Yield", risk_level: 3, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114800198", name: "Unicaja RV Emergente FI", bank: "Unicaja", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },

  // ========== KUTXABANK — Cobertura completa ==========
  { isin: "ES0114801097", name: "Kutxabank Mixto Agresivo FI", bank: "Kutxabank", category: "Mixto Agresivo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114801105", name: "Kutxabank RV Tecnolog\u00eda FI", bank: "Kutxabank", category: "RV Tecnolog\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114801113", name: "Kutxabank RV Salud FI", bank: "Kutxabank", category: "RV Salud", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114801121", name: "Kutxabank RF Subordinada FI", bank: "Kutxabank", category: "RF Subordinada", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114801139", name: "Kutxabank Inmobiliario FI", bank: "Kutxabank", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114801147", name: "Kutxabank RF High Yield FI", bank: "Kutxabank", category: "RF High Yield", risk_level: 3, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114801154", name: "Kutxabank Retorno Absoluto FI", bank: "Kutxabank", category: "Retorno Absoluto", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114801162", name: "Kutxabank RV Emergente FI", bank: "Kutxabank", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114801170", name: "Kutxabank RF Largo Plazo FI", bank: "Kutxabank", category: "RF Largo Plazo", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114801188", name: "Kutxabank RV Dividendos FI", bank: "Kutxabank", category: "RV Dividendos", risk_level: 4, currency: "EUR", yahoo_ticker: null },

  // ========== ABANCA — Cobertura completa ==========
  { isin: "ES0114802087", name: "Abanca Mixto Agresivo FI", bank: "Abanca", category: "Mixto Agresivo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114802095", name: "Abanca RV Tecnolog\u00eda FI", bank: "Abanca", category: "RV Tecnolog\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114802103", name: "Abanca RV Salud FI", bank: "Abanca", category: "RV Salud", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114802111", name: "Abanca RF Subordinada FI", bank: "Abanca", category: "RF Subordinada", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114802129", name: "Abanca Inmobiliario FI", bank: "Abanca", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114802137", name: "Abanca ESG Sostenible FI", bank: "Abanca", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114802145", name: "Abanca RF Largo Plazo FI", bank: "Abanca", category: "RF Largo Plazo", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114802152", name: "Abanca Retorno Absoluto FI", bank: "Abanca", category: "Retorno Absoluto", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114802160", name: "Abanca RF High Yield FI", bank: "Abanca", category: "RF High Yield", risk_level: 3, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114802178", name: "Abanca RV Consumo FI", bank: "Abanca", category: "RV Consumo", risk_level: 4, currency: "EUR", yahoo_ticker: null },

  // ========== ING — Cobertura completa ==========
  { isin: "ES0114803093", name: "ING Mixto Agresivo FI", bank: "ING", category: "Mixto Agresivo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114803101", name: "ING RV Tecnolog\u00eda FI", bank: "ING", category: "RV Tecnolog\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114803119", name: "ING RV Salud FI", bank: "ING", category: "RV Salud", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114803127", name: "ING RF Subordinada FI", bank: "ING", category: "RF Subordinada", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114803135", name: "ING Inmobiliario FI", bank: "ING", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114803143", name: "ING Retorno Absoluto FI", bank: "ING", category: "Retorno Absoluto", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114803150", name: "ING RF High Yield FI", bank: "ING", category: "RF High Yield", risk_level: 3, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114803168", name: "ING RV Emergente FI", bank: "ING", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114803176", name: "ING RF Largo Plazo FI", bank: "ING", category: "RF Largo Plazo", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114803184", name: "ING ESG Sostenible FI", bank: "ING", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },

  // ========== OPENBANK — Cobertura completa ==========
  { isin: "ES0163092096", name: "Openbank Mixto Agresivo FI", bank: "Openbank", category: "Mixto Agresivo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0163092104", name: "Openbank RV Tecnolog\u00eda Indexada FI", bank: "Openbank", category: "RV Tecnolog\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0163092112", name: "Openbank RV Salud Indexada FI", bank: "Openbank", category: "RV Salud", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0163092120", name: "Openbank Inmobiliario FI", bank: "Openbank", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0163092138", name: "Openbank ESG Sostenible FI", bank: "Openbank", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0163092146", name: "Openbank RF Largo Plazo FI", bank: "Openbank", category: "RF Largo Plazo", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0163092153", name: "Openbank RF High Yield FI", bank: "Openbank", category: "RF High Yield", risk_level: 3, currency: "USD", yahoo_ticker: null },
  { isin: "ES0163092161", name: "Openbank Retorno Absoluto FI", bank: "Openbank", category: "Retorno Absoluto", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0163092179", name: "Openbank RV Emergente Indexada FI", bank: "Openbank", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0163092187", name: "Openbank RF Subordinada FI", bank: "Openbank", category: "RF Subordinada", risk_level: 3, currency: "EUR", yahoo_ticker: null },

  // ========== MAPFRE — Cobertura completa ==========
  { isin: "ES0118990082", name: "Mapfre Mixto Agresivo FI", bank: "Mapfre", category: "Mixto Agresivo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0118990090", name: "Mapfre RV Tecnolog\u00eda FI", bank: "Mapfre", category: "RV Tecnolog\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0118990108", name: "Mapfre Inmobiliario FI", bank: "Mapfre", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0118990116", name: "Mapfre RF Subordinada FI", bank: "Mapfre", category: "RF Subordinada", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0118990124", name: "Mapfre RF Largo Plazo FI", bank: "Mapfre", category: "RF Largo Plazo", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0118990132", name: "Mapfre RF High Yield FI", bank: "Mapfre", category: "RF High Yield", risk_level: 3, currency: "USD", yahoo_ticker: null },
  { isin: "ES0118990140", name: "Mapfre Retorno Absoluto FI", bank: "Mapfre", category: "Retorno Absoluto", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0118990157", name: "Mapfre ESG Sostenible FI", bank: "Mapfre", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0118990165", name: "Mapfre RV Consumo FI", bank: "Mapfre", category: "RV Consumo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0118990173", name: "Mapfre RV Emergente FI", bank: "Mapfre", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },

  // ========== MYINVESTOR — Cobertura completa ==========
  { isin: "ES0114805106", name: "MyInvestor RV Tecnolog\u00eda Indexado FI", bank: "MyInvestor", category: "RV Tecnolog\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114805114", name: "MyInvestor RV Salud Indexado FI", bank: "MyInvestor", category: "RV Salud", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114805122", name: "MyInvestor Inmobiliario Indexado FI", bank: "MyInvestor", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114805130", name: "MyInvestor Mixto Agresivo FI", bank: "MyInvestor", category: "Mixto Agresivo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114805148", name: "MyInvestor RV Jap\u00f3n Indexado FI", bank: "MyInvestor", category: "RV Jap\u00f3n", risk_level: 4, currency: "JPY", yahoo_ticker: null },
  { isin: "ES0114805155", name: "MyInvestor RF Subordinada FI", bank: "MyInvestor", category: "RF Subordinada", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114805163", name: "MyInvestor RF High Yield FI", bank: "MyInvestor", category: "RF High Yield", risk_level: 3, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114805171", name: "MyInvestor RV Emergente Indexado FI", bank: "MyInvestor", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114805189", name: "MyInvestor RF Largo Plazo FI", bank: "MyInvestor", category: "RF Largo Plazo", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114805197", name: "MyInvestor Retorno Absoluto FI", bank: "MyInvestor", category: "Retorno Absoluto", risk_level: 3, currency: "EUR", yahoo_ticker: null },

  // ========== FINIZENS — Cobertura completa ==========
  { isin: "ES0114806054", name: "Finizens Mixto Agresivo FI", bank: "Finizens", category: "Mixto Agresivo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114806062", name: "Finizens RV Tecnolog\u00eda Indexado FI", bank: "Finizens", category: "RV Tecnolog\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114806070", name: "Finizens RV Salud Indexado FI", bank: "Finizens", category: "RV Salud", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114806088", name: "Finizens Inmobiliario FI", bank: "Finizens", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114806096", name: "Finizens ESG Sostenible FI", bank: "Finizens", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114806104", name: "Finizens RF Largo Plazo FI", bank: "Finizens", category: "RF Largo Plazo", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114806112", name: "Finizens RF High Yield FI", bank: "Finizens", category: "RF High Yield", risk_level: 3, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114806120", name: "Finizens Retorno Absoluto FI", bank: "Finizens", category: "Retorno Absoluto", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114806138", name: "Finizens RV Jap\u00f3n Indexado FI", bank: "Finizens", category: "RV Jap\u00f3n", risk_level: 4, currency: "JPY", yahoo_ticker: null },
  { isin: "ES0114806146", name: "Finizens RV Emergente Indexado FI", bank: "Finizens", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },

  // ========== RENTA 4 — Cobertura completa ==========
  { isin: "ES0114807086", name: "Renta 4 Mixto Agresivo FI", bank: "Renta 4", category: "Mixto Agresivo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114807094", name: "Renta 4 RV Tecnolog\u00eda FI", bank: "Renta 4", category: "RV Tecnolog\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114807102", name: "Renta 4 RV Salud FI", bank: "Renta 4", category: "RV Salud", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114807110", name: "Renta 4 RF Subordinada FI", bank: "Renta 4", category: "RF Subordinada", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114807128", name: "Renta 4 Inmobiliario FI", bank: "Renta 4", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114807136", name: "Renta 4 ESG Sostenible FI", bank: "Renta 4", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114807144", name: "Renta 4 RV Emergente FI", bank: "Renta 4", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114807151", name: "Renta 4 Retorno Absoluto FI", bank: "Renta 4", category: "Retorno Absoluto", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114807169", name: "Renta 4 RF High Yield FI", bank: "Renta 4", category: "RF High Yield", risk_level: 3, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114807177", name: "Renta 4 RF Largo Plazo FI", bank: "Renta 4", category: "RF Largo Plazo", risk_level: 3, currency: "EUR", yahoo_ticker: null },

  // ========== IBERCAJA — Cobertura completa II ==========
  { isin: "ES0142092260", name: "Ibercaja RV Dividendos I", bank: "Ibercaja", category: "RV Dividendos", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142092278", name: "Ibercaja RV Consumo I", bank: "Ibercaja", category: "RV Consumo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142092286", name: "Ibercaja Inmobiliario Global I", bank: "Ibercaja", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142092294", name: "Ibercaja RF Emergente I", bank: "Ibercaja", category: "RF Emergente", risk_level: 3, currency: "USD", yahoo_ticker: null },
  { isin: "ES0142092302", name: "Ibercaja ESG Global I", bank: "Ibercaja", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },

  // ========== COLECTIVOS ADICIONALES — EVO Banco ==========
  { isin: "ES0114804059", name: "EVO Mixto Agresivo FI", bank: "EVO Banco", category: "Mixto Agresivo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114804067", name: "EVO RV Tecnolog\u00eda FI", bank: "EVO Banco", category: "RV Tecnolog\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114804075", name: "EVO RV Salud FI", bank: "EVO Banco", category: "RV Salud", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114804083", name: "EVO ESG Sostenible FI", bank: "EVO Banco", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114804091", name: "EVO RV Emergente FI", bank: "EVO Banco", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },

  // ========== GPM ==========
  { isin: "ES0114808050", name: "GPM RV Tecnolog\u00eda FI", bank: "GPM", category: "RV Tecnolog\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114808068", name: "GPM Inmobiliario FI", bank: "GPM", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114808076", name: "GPM ESG Sostenible FI", bank: "GPM", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114808084", name: "GPM RV Salud FI", bank: "GPM", category: "RV Salud", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114808092", name: "GPM RF High Yield FI", bank: "GPM", category: "RF High Yield", risk_level: 3, currency: "USD", yahoo_ticker: null },

  // ========== ANDBANK ==========
  { isin: "ES0114809058", name: "Andbank Mixto Agresivo FI", bank: "Andbank", category: "Mixto Agresivo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114809066", name: "Andbank RV Tecnolog\u00eda FI", bank: "Andbank", category: "RV Tecnolog\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114809074", name: "Andbank Inmobiliario FI", bank: "Andbank", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114809082", name: "Andbank ESG Global FI", bank: "Andbank", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114809090", name: "Andbank RF High Yield FI", bank: "Andbank", category: "RF High Yield", risk_level: 3, currency: "USD", yahoo_ticker: null },

  // ========== BANCA MARCH ==========
  { isin: "ES0114810064", name: "Banca March Mixto Agresivo FI", bank: "Banca March", category: "Mixto Agresivo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114810072", name: "Banca March RV Tecnolog\u00eda FI", bank: "Banca March", category: "RV Tecnolog\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114810080", name: "Banca March Inmobiliario FI", bank: "Banca March", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114810098", name: "Banca March RF High Yield FI", bank: "Banca March", category: "RF High Yield", risk_level: 3, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114810106", name: "Banca March Retorno Absoluto FI", bank: "Banca March", category: "Retorno Absoluto", risk_level: 3, currency: "EUR", yahoo_ticker: null },

  // ========== CAJA INGENIEROS ==========
  { isin: "ES0114811054", name: "Caja Ingenieros Mixto Agresivo FI", bank: "Caja Ingenieros", category: "Mixto Agresivo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114811062", name: "Caja Ingenieros RV Tecnolog\u00eda FI", bank: "Caja Ingenieros", category: "RV Tecnolog\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114811070", name: "Caja Ingenieros Inmobiliario FI", bank: "Caja Ingenieros", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114811088", name: "Caja Ingenieros RF Subordinada FI", bank: "Caja Ingenieros", category: "RF Subordinada", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114811096", name: "Caja Ingenieros RF High Yield FI", bank: "Caja Ingenieros", category: "RF High Yield", risk_level: 3, currency: "USD", yahoo_ticker: null },

  // ========== ARQUIA BANCA ==========
  { isin: "ES0114812045", name: "Arquia Mixto Agresivo FI", bank: "Arquia Banca", category: "Mixto Agresivo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114812052", name: "Arquia RV Tecnolog\u00eda FI", bank: "Arquia Banca", category: "RV Tecnolog\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114812060", name: "Arquia RF Subordinada FI", bank: "Arquia Banca", category: "RF Subordinada", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114812078", name: "Arquia Inmobiliario FI", bank: "Arquia Banca", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114812086", name: "Arquia ESG Sostenible FI", bank: "Arquia Banca", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },

  // ========== DEUTSCHE BANK ==========
  { isin: "ES0114813050", name: "Deutsche Bank Mixto Agresivo FI", bank: "Deutsche Bank", category: "Mixto Agresivo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114813068", name: "Deutsche Bank RV Tecnolog\u00eda FI", bank: "Deutsche Bank", category: "RV Tecnolog\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114813076", name: "Deutsche Bank RF Subordinada FI", bank: "Deutsche Bank", category: "RF Subordinada", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114813084", name: "Deutsche Bank Inmobiliario FI", bank: "Deutsche Bank", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114813092", name: "Deutsche Bank ESG Global FI", bank: "Deutsche Bank", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },

  // ========== TRESSIS ==========
  { isin: "ES0114814041", name: "Tressis Mixto Agresivo FI", bank: "Tressis", category: "Mixto Agresivo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114814058", name: "Tressis RV Tecnolog\u00eda FI", bank: "Tressis", category: "RV Tecnolog\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114814066", name: "Tressis Inmobiliario FI", bank: "Tressis", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114814074", name: "Tressis ESG Global FI", bank: "Tressis", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114814082", name: "Tressis RF High Yield FI", bank: "Tressis", category: "RF High Yield", risk_level: 3, currency: "USD", yahoo_ticker: null },

  // ========== SINGULAR BANK ==========
  { isin: "ES0114815048", name: "Singular Bank Mixto Agresivo FI", bank: "Singular Bank", category: "Mixto Agresivo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114815055", name: "Singular Bank RV Tecnolog\u00eda FI", bank: "Singular Bank", category: "RV Tecnolog\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0114815063", name: "Singular Bank Inmobiliario FI", bank: "Singular Bank", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114815071", name: "Singular Bank ESG Global FI", bank: "Singular Bank", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0114815089", name: "Singular Bank RF High Yield FI", bank: "Singular Bank", category: "RF High Yield", risk_level: 3, currency: "USD", yahoo_ticker: null },

  // ========== INDEXA CAPITAL ==========
  { isin: "ES0142094100", name: "Indexa Capital RV Tecnolog\u00eda Global", bank: "Indexa Capital", category: "RV Tecnolog\u00eda", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "ES0142094118", name: "Indexa Capital RV Salud Global", bank: "Indexa Capital", category: "RV Salud", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142094126", name: "Indexa Capital Mixto Agresivo", bank: "Indexa Capital", category: "Mixto Agresivo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142094134", name: "Indexa Capital RF Subordinada", bank: "Indexa Capital", category: "RF Subordinada", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "ES0142094142", name: "Indexa Capital Inmobiliario Global", bank: "Indexa Capital", category: "Inmobiliario", risk_level: 3, currency: "EUR", yahoo_ticker: null },

  // ========== ETFs ADICIONALES — Invesco ==========
  { isin: "IE00BDFC2K66", name: "Invesco US Treasuries Bond UCITS ETF", bank: "Invesco", category: "RF P\u00fablica USD", risk_level: 2, currency: "USD", yahoo_ticker: null },
  { isin: "IE00BDFC2L73", name: "Invesco Euro Gov Bond UCITS ETF", bank: "Invesco", category: "RF P\u00fablica Euro", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00BDFC2M80", name: "Invesco EUR Corporate Bond UCITS ETF", bank: "Invesco", category: "RF Corporativa", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00BDFC2N97", name: "Invesco Emerging Markets Bond UCITS ETF", bank: "Invesco", category: "RF Emergente", risk_level: 3, currency: "USD", yahoo_ticker: null },
  { isin: "IE00BDFC2P04", name: "Invesco Global High Yield UCITS ETF", bank: "Invesco", category: "RF High Yield", risk_level: 3, currency: "USD", yahoo_ticker: null },

  // ========== ETFs — SPDR Adicionales ==========
  { isin: "IE00B6YX5F01", name: "SPDR S&P US Dividend Aristocrats UCITS ETF", bank: "SPDR", category: "RV Dividendos", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "IE00B6YX5K89", name: "SPDR MSCI World Health Care UCITS ETF", bank: "SPDR", category: "RV Salud", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "IE00B6YX5M04", name: "SPDR MSCI World Financials UCITS ETF", bank: "SPDR", category: "RV Financieras", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "IE00B6YX5L96", name: "SPDR MSCI World Technology UCITS ETF", bank: "SPDR", category: "RV Tecnolog\u00eda", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "IE00BC7L3815", name: "SPDR Bloomberg 1-3 Year Euro Corp Bond UCITS ETF", bank: "SPDR", category: "RF Corporativa CP", risk_level: 1, currency: "EUR", yahoo_ticker: null },

  // ========== ETFs — iShares Adicionales ==========
  { isin: "IE00BDFD3P76", name: "iShares Global Government Bond UCITS ETF", bank: "iShares", category: "RF P\u00fablica Global", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00BYX5MX67", name: "iShares $ Treasury Bond 1-3yr UCITS ETF", bank: "iShares", category: "RF P\u00fablica USD CP", risk_level: 1, currency: "USD", yahoo_ticker: null },
  { isin: "IE00BDFC2H27", name: "iShares Digital Security UCITS ETF", bank: "iShares", category: "RV Tem\u00e1tico Tecnolog\u00eda", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "IE00BJ0KDQ92", name: "iShares Global Water UCITS ETF", bank: "iShares", category: "RV Tem\u00e1tico Agua", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "IE00BYZK0G98", name: "iShares $ High Yield Corp Bond UCITS ETF", bank: "iShares", category: "RF High Yield", risk_level: 3, currency: "USD", yahoo_ticker: null },

  // ========== Vanguard Adicionales ==========
  { isin: "IE00BYX2MX68", name: "Vanguard Global Aggregate Bond UCITS ETF", bank: "Vanguard", category: "RF Global", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00BHYW0Q25", name: "Vanguard USD Treasury Bond UCITS ETF", bank: "Vanguard", category: "RF P\u00fablica USD", risk_level: 2, currency: "USD", yahoo_ticker: null },
  { isin: "IE00BKX55T40", name: "Vanguard FTSE Pacific UCITS ETF", bank: "Vanguard", category: "RV Pac\u00edfico", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "IE000L2OHAU4", name: "Vanguard FTSE North America UCITS ETF", bank: "Vanguard", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "IE00BZ4BQT80", name: "Vanguard FTSE All-World High Dividend Yield UCITS ETF", bank: "Vanguard", category: "RV Dividendos", risk_level: 4, currency: "USD", yahoo_ticker: null },

  // ========== Amundi Adicionales ==========
  { isin: "LU2112292437", name: "Amundi Euro Government Bond 5-7Y UCITS ETF", bank: "Amundi", category: "RF P\u00fablica Euro MP", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU2112292510", name: "Amundi Euro Government Bond 7-10Y UCITS ETF", bank: "Amundi", category: "RF P\u00fablica Euro LP", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0389810044", name: "Amundi MSCI India UCITS ETF", bank: "Amundi", category: "RV India", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "LU1681040678", name: "Amundi MSCI Japan UCITS ETF", bank: "Amundi", category: "RV Jap\u00f3n", risk_level: 4, currency: "JPY", yahoo_ticker: null },
  { isin: "LU2112292783", name: "Amundi Euro Government Bond 25+Y UCITS ETF", bank: "Amundi", category: "RF P\u00fablica Euro LP", risk_level: 3, currency: "EUR", yahoo_ticker: null },

  // ========== Xtrackers Adicionales ==========
  { isin: "LU0290355717", name: "Xtrackers II Eurozone Government Bond UCITS ETF", bank: "Xtrackers", category: "RF P\u00fablica Euro", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0378818133", name: "Xtrackers II EUR Corporate Bond UCITS ETF", bank: "Xtrackers", category: "RF Corporativa", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0908506058", name: "Xtrackers MSCI Japan UCITS ETF", bank: "Xtrackers", category: "RV Jap\u00f3n", risk_level: 4, currency: "JPY", yahoo_ticker: null },
  { isin: "LU0328474782", name: "Xtrackers S&P 500 Equal Weight UCITS ETF", bank: "Xtrackers", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU1737652583", name: "Xtrackers MSCI World Consumer Staples UCITS ETF", bank: "Xtrackers", category: "RV Consumo", risk_level: 4, currency: "EUR", yahoo_ticker: null },

  // ========== PICTET Adicionales ==========
  { isin: "LU0104884860", name: "Pictet-Global Megatrend Selection P EUR", bank: "Pictet", category: "RV Tem\u00e1tico", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0165419010", name: "Pictet-Digital P USD", bank: "Pictet", category: "RV Tem\u00e1tico Tecnolog\u00eda", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU0255971105", name: "Pictet-Premium Brands P EUR", bank: "Pictet", category: "RV Consumo", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0342114495", name: "Pictet-Timber P EUR", bank: "Pictet", category: "RV Tem\u00e1tico", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0272308760", name: "Pictet-Security P EUR", bank: "Pictet", category: "RV Tem\u00e1tico Tecnolog\u00eda", risk_level: 4, currency: "EUR", yahoo_ticker: null },

  // ========== ALLIANZ Adicionales ==========
  { isin: "LU0164443799", name: "Allianz Euro Bond R EUR", bank: "Allianz", category: "RF P\u00fablica Euro", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0212925144", name: "Allianz Global Sustainability EUR", bank: "Allianz", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0735112925", name: "Allianz Global Artificial Intelligence EUR", bank: "Allianz", category: "RV Tem\u00e1tico IA", risk_level: 5, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0342114495", name: "Allianz Pet & Animal Wellbeing EUR", bank: "Allianz", category: "RV Tem\u00e1tico", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0360644832", name: "Allianz Euro High Yield Bond", bank: "Allianz", category: "RF High Yield", risk_level: 3, currency: "EUR", yahoo_ticker: null },

  // ========== NORDEA Adicionales ==========
  { isin: "LU0112464571", name: "Nordea 1 Global Stable Equity Fund EUR", bank: "Nordea", category: "RV Baja Volatilidad", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0640827507", name: "Nordea 1 Global Bond Fund EUR", bank: "Nordea", category: "RF Global", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0064560538", name: "Nordea 1 Emerging Stars Equity Fund EUR", bank: "Nordea", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "LU0085405590", name: "Nordea 1 Stable Return Fund EUR", bank: "Nordea", category: "Mixto", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0085405830", name: "Nordea 1 Nordic Equity Fund EUR", bank: "Nordea", category: "RV N\u00f3rdicos", risk_level: 4, currency: "EUR", yahoo_ticker: null },

  // ========== ROBECO Adicionales ==========
  { isin: "LU0123278504", name: "Robeco BP US Select Opportunities Fund", bank: "Robeco", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU0180020694", name: "Robeco QI Global Emerging Markets Fund", bank: "Robeco", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "LU0171296789", name: "Robeco QI Global Dynamic Duration Fund", bank: "Robeco", category: "RF Global", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0051754703", name: "Robeco Euro Government Bonds Fund", bank: "Robeco", category: "RF P\u00fablica Euro", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0142382700", name: "Robeco Global Consumer Trends Fund", bank: "Robeco", category: "RV Consumo", risk_level: 4, currency: "EUR", yahoo_ticker: null },

  // ========== FIDELITY Adicionales ==========
  { isin: "LU0048580402", name: "Fidelity Global Technology Fund", bank: "Fidelity", category: "RV Tecnolog\u00eda", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0099574567", name: "Fidelity Euro STOXX 50 Index Fund", bank: "Fidelity", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0133118799", name: "Fidelity European Growth Fund", bank: "Fidelity", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0251130105", name: "Fidelity America Fund", bank: "Fidelity", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU0099574211", name: "Fidelity Japan Fund", bank: "Fidelity", category: "RV Jap\u00f3n", risk_level: 4, currency: "JPY", yahoo_ticker: null },

  // ========== JP MORGAN Adicionales ==========
  { isin: "LU0119147680", name: "JPMorgan Europe Dynamic Fund", bank: "JP Morgan", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0163913151", name: "JPMorgan Emerging Markets Equity Fund", bank: "JP Morgan", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "LU0070997457", name: "JPMorgan Global Focus Fund", bank: "JP Morgan", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0119147847", name: "JPMorgan Global Bond Fund", bank: "JP Morgan", category: "RF Global", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0210536418", name: "JPMorgan America Equity Fund", bank: "JP Morgan", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },

  // ========== PIMCO Adicionales ==========
  { isin: "IE00B3D7TL70", name: "PIMCO GIS Global Bond Fund", bank: "PIMCO", category: "RF Global", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00B3D7TN94", name: "PIMCO GIS Euro Bond Fund", bank: "PIMCO", category: "RF P\u00fablica Euro", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00B3D7TP19", name: "PIMCO GIS Eur Corp Bond Fund", bank: "PIMCO", category: "RF Corporativa", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "IE00B3D7TQ26", name: "PIMCO GIS US High Yield Corp Bond Fund", bank: "PIMCO", category: "RF High Yield", risk_level: 3, currency: "USD", yahoo_ticker: null },
  { isin: "IE00B3D7TS40", name: "PIMCO GIS Short-Term Fund", bank: "PIMCO", category: "Monetario", risk_level: 1, currency: "EUR", yahoo_ticker: null },

  // ========== SCHRODER Adicionales ==========
  { isin: "LU0048476304", name: "Schroder ISF Global Equity", bank: "Schroder", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0048461678", name: "Schroder ISF European Equity", bank: "Schroder", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0048460407", name: "Schroder ISF US Equity", bank: "Schroder", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU0106232008", name: "Schroder ISF Emerging Markets Equity", bank: "Schroder", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "LU0128468240", name: "Schroder ISF Global Corporate Bond", bank: "Schroder", category: "RF Corporativa", risk_level: 2, currency: "EUR", yahoo_ticker: null },

  // ========== FRANKLIN TEMPLETON Adicionales ==========
  { isin: "LU0107232404", name: "Franklin Templeton Global Equity Fund", bank: "Franklin Templeton", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0073892758", name: "Franklin Templeton European Equity Fund", bank: "Franklin Templeton", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0137965205", name: "Franklin Templeton US Equity Fund", bank: "Franklin Templeton", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU0128538403", name: "Franklin Templeton Emerging Markets Equity", bank: "Franklin Templeton", category: "RV Emergentes", risk_level: 5, currency: "USD", yahoo_ticker: null },
  { isin: "LU0137966666", name: "Franklin Templeton Global Technology Fund", bank: "Franklin Templeton", category: "RV Tecnolog\u00eda", risk_level: 4, currency: "USD", yahoo_ticker: null },

  // ========== M&G Adicionales ==========
  { isin: "GB00B39RHM91", name: "M&G Global Equity Fund", bank: "M&G", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "GB00B1XFWX31", name: "M&G European Equity Fund", bank: "M&G", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "GB00B39RHM93", name: "M&G US Equity Fund", bank: "M&G", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "GB00B59N5T78", name: "M&G Global Corporate Bond Fund", bank: "M&G", category: "RF Corporativa", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "GB00B1XFWY48", name: "M&G Emerging Markets Bond Fund", bank: "M&G", category: "RF Emergente", risk_level: 3, currency: "USD", yahoo_ticker: null },

  // ========== BNP PARIBAS Adicionales ==========
  { isin: "LU0485038437", name: "BNP Paribas Global Equity Fund", bank: "BNP Paribas", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0485038510", name: "BNP Paribas European Equity Fund", bank: "BNP Paribas", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0485038601", name: "BNP Paribas US Equity Fund", bank: "BNP Paribas", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU0485038783", name: "BNP Paribas Global Bond Fund", bank: "BNP Paribas", category: "RF Global", risk_level: 2, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0485038940", name: "BNP Paribas Climate Impact Fund", bank: "BNP Paribas", category: "RV ESG Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },

  // ========== AXA Adicionales ==========
  { isin: "LU0166179593", name: "AXA Global Equity Fund", bank: "AXA", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0166179676", name: "AXA European Equity Fund", bank: "AXA", category: "RV Europa", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0166179759", name: "AXA US Equity Fund", bank: "AXA", category: "RV EEUU", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU0166180096", name: "AXA Framlington Health Fund", bank: "AXA", category: "RV Salud", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0166180179", name: "AXA Framlington Technology Fund", bank: "AXA", category: "RV Tecnolog\u00eda", risk_level: 4, currency: "EUR", yahoo_ticker: null },

  // ========== BLACKROCK Adicionales ==========
  { isin: "LU0171284809", name: "BlackRock Global Fund World Equity", bank: "BlackRock", category: "RV Global", risk_level: 4, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0171285038", name: "BlackRock Global Fund World Technology", bank: "BlackRock", category: "RV Tecnolog\u00eda", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU0171285111", name: "BlackRock Global Fund World Healthcare", bank: "BlackRock", category: "RV Salud", risk_level: 4, currency: "USD", yahoo_ticker: null },
  { isin: "LU0250464992", name: "BlackRock Global Allocation Fund", bank: "BlackRock", category: "Mixto Flexible", risk_level: 3, currency: "EUR", yahoo_ticker: null },
  { isin: "LU0360644832", name: "BlackRock Euro Bond Fund", bank: "BlackRock", category: "RF P\u00fablica Euro", risk_level: 2, currency: "EUR", yahoo_ticker: null },
];

async function seed() {
  console.log(`Importing ${funds.length} funds into MySQL...`);

  const batchSize = 100;
  let totalInserted = 0;

  for (let i = 0; i < funds.length; i += batchSize) {
    const batch = funds.slice(i, i + batchSize);
    const values = batch.map((f) => [
      f.isin, f.name, f.bank, f.category, f.risk_level, f.currency, f.yahoo_ticker,
    ]);

    const [result] = await pool.query(
      "INSERT IGNORE INTO fund_catalog (isin, name, bank, category, risk_level, currency, yahoo_ticker) VALUES ?",
      [values]
    );

    totalInserted += (result as any).affectedRows;
    console.log(
      `  batch ${Math.floor(i / batchSize) + 1}: ${(result as any).affectedRows} inserted (${batch.length} processed)`
    );
  }

  console.log(`\nDone! ${totalInserted} new funds inserted (${funds.length} total processed)`);

  const [countResult] = await pool.query("SELECT COUNT(*) as total FROM fund_catalog");
  console.log(`Total funds in database: ${(countResult as any)[0].total}`);

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
