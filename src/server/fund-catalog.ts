export type FundCatalogEntry = {
  isin: string;
  name: string;
  bank: string;
  category: string;
  riskLevel: number;
  currency: string;
  yahooTicker: string | null;
};

export const FUND_CATALOG: FundCatalogEntry[] = [
  // SANTANDER
  { isin: "ES0119203026", name: "Santander Indice España Cartera", bank: "Santander", category: "RV España", riskLevel: 4, currency: "EUR", yahooTicker: "ES0119203034.BC" },
  { isin: "ES0109360000", name: "Santander Dividendo Europa B", bank: "Santander", category: "RV Europa", riskLevel: 4, currency: "EUR", yahooTicker: "ES0109360000.BC" },
  { isin: "ES0109360042", name: "Santander Dividendo Europa R", bank: "Santander", category: "RV Europa", riskLevel: 4, currency: "EUR", yahooTicker: null },
  { isin: "ES0109362055", name: "Santander Selección Rentabilidad FI", bank: "Santander", category: "Renta Fija", riskLevel: 3, currency: "EUR", yahooTicker: null },
  { isin: "ES0109361049", name: "Santander Global Blend R", bank: "Santander", category: "Mixto", riskLevel: 3, currency: "EUR", yahooTicker: null },
  { isin: "ES0142090017", name: "Santander Acciones Españolas FI", bank: "Santander", category: "RV España", riskLevel: 4, currency: "EUR", yahooTicker: "SANTANDERACC.BC" },
  { isin: "ES0142090025", name: "Santander Renta Variable Europa", bank: "Santander", category: "RV Europa", riskLevel: 4, currency: "EUR", yahooTicker: null },
  { isin: "ES0142090033", name: "Santander RV Global", bank: "Santander", category: "RV Global", riskLevel: 5, currency: "EUR", yahooTicker: null },
  { isin: "LU0048576053", name: "Santander Renta Fija Europea", bank: "Santander", category: "RF Europa", riskLevel: 2, currency: "EUR", yahooTicker: null },

  // IBERCAJA
  { isin: "ES0142092062", name: "Ibercaja Acciones España I", bank: "Ibercaja", category: "RV España", riskLevel: 4, currency: "EUR", yahooTicker: null },
  { isin: "ES0142092070", name: "Ibercaja Acciones Europa I", bank: "Ibercaja", category: "RV Europa", riskLevel: 4, currency: "EUR", yahooTicker: null },
  { isin: "ES0142092047", name: "Ibercaja Deuda Publica Euro", bank: "Ibercaja", category: "RF Pública", riskLevel: 2, currency: "EUR", yahooTicker: null },
  { isin: "ES0142092088", name: "Ibercaja Global Mixto I", bank: "Ibercaja", category: "Mixto", riskLevel: 3, currency: "EUR", yahooTicker: null },
  { isin: "ES0142092096", name: "Ibercaja Rentabilidad Absoluta", bank: "Ibercaja", category: "RV Absoluta", riskLevel: 3, currency: "EUR", yahooTicker: null },

  // CAIXABANK
  { isin: "ES0139090010", name: "Caixabank Acciones España", bank: "Caixabank", category: "RV España", riskLevel: 4, currency: "EUR", yahooTicker: null },
  { isin: "ES0139090028", name: "Caixabank Renta Fija Soberana", bank: "Caixabank", category: "RF Pública", riskLevel: 2, currency: "EUR", yahooTicker: null },
  { isin: "ES0139090036", name: "Caixabank Global Mixto", bank: "Caixabank", category: "Mixto", riskLevel: 3, currency: "EUR", yahooTicker: null },
  { isin: "ES0139090044", name: "Caixabank Multiesionario PP", bank: "Caixabank", category: "Multiesionario", riskLevel: 3, currency: "EUR", yahooTicker: null },
  { isin: "ES0139090069", name: "Caixabank Emergentes RV", bank: "Caixabank", category: "RV Emergentes", riskLevel: 5, currency: "USD", yahooTicker: null },

  // BBVA
  { isin: "ES0151700074", name: "BBVA Banca Privada España", bank: "BBVA", category: "RV España", riskLevel: 4, currency: "EUR", yahooTicker: null },
  { isin: "ES0151700082", name: "BBVA FondIndex RF Euro", bank: "BBVA", category: "RF Europa", riskLevel: 2, currency: "EUR", yahooTicker: null },
  { isin: "ES0151700090", name: "BBVA FondIndex RV Europa", bank: "BBVA", category: "RV Europa", riskLevel: 4, currency: "EUR", yahooTicker: null },
  { isin: "ES0151700108", name: "BBVA FondIndex RV Global", bank: "BBVA", category: "RV Global", riskLevel: 5, currency: "USD", yahooTicker: null },
  { isin: "ES0151700116", name: "BBVA Plan Inmobiliario", bank: "BBVA", category: "Inmobiliario", riskLevel: 3, currency: "EUR", yahooTicker: null },

  // MAPFRE
  { isin: "ES0118990009", name: "Mapfre Internacional RV", bank: "Mapfre", category: "RV Global", riskLevel: 5, currency: "USD", yahooTicker: null },
  { isin: "ES0118990017", name: "Mapfre RF Soberana Euro", bank: "Mapfre", category: "RF Pública", riskLevel: 2, currency: "EUR", yahooTicker: null },
  { isin: "ES0118990025", name: "Mapfre Activos FI", bank: "Mapfre", category: "Mixto", riskLevel: 3, currency: "EUR", yahooTicker: null },
  { isin: "ES0118990033", name: "Mapfre Estabilidad RV", bank: "Mapfre", category: "RV España", riskLevel: 4, currency: "EUR", yahooTicker: null },
  { isin: "ES0118990041", name: "Mapfre Euroland RV", bank: "Mapfre", category: "RV Europa", riskLevel: 4, currency: "EUR", yahooTicker: null },

  // INDEXA CAPITAL
  { isin: "ES0142094092", name: "Indexa Capital Plan 100 RV", bank: "Indexa Capital", category: "RV Global", riskLevel: 5, currency: "EUR", yahooTicker: null },
  { isin: "ES0142094084", name: "Indexa Capital Plan 70 RV", bank: "Indexa Capital", category: "Mixto", riskLevel: 4, currency: "EUR", yahooTicker: null },
  { isin: "ES0142094076", name: "Indexa Capital Plan 50 Mixto", bank: "Indexa Capital", category: "Mixto", riskLevel: 3, currency: "EUR", yahooTicker: null },
  { isin: "ES0142094068", name: "Indexa Capital Plan 30 RF", bank: "Indexa Capital", category: "Renta Fija", riskLevel: 2, currency: "EUR", yahooTicker: null },
  { isin: "ES0142094050", name: "Indexa Capital Plan 10 Monetario", bank: "Indexa Capital", category: "Monetario", riskLevel: 1, currency: "EUR", yahooTicker: null },

  // POPULARES / OPENBANK
  { isin: "ES0119203034", name: "Santander Indice España Openbank", bank: "Openbank", category: "RV España", riskLevel: 4, currency: "EUR", yahooTicker: "ES0119203034.BC" },
  { isin: "ES0163092005", name: "Openbank RV Global Indexado", bank: "Openbank", category: "RV Global", riskLevel: 5, currency: "EUR", yahooTicker: null },
  { isin: "ES0163092013", name: "Openbank RF Europea Indexada", bank: "Openbank", category: "RF Europa", riskLevel: 2, currency: "EUR", yahooTicker: null },

  // ETFs POPULARES (listados en bolsa)
  { isin: "IE00B4L5Y983", name: "iShares Core MSCI World", bank: "iShares/BlackRock", category: "RV Global", riskLevel: 4, currency: "EUR", yahooTicker: "IWDA.AS" },
  { isin: "IE00BKM4GZ66", name: "iShares Core MSCI EM IMI", bank: "iShares/BlackRock", category: "RV Emergentes", riskLevel: 5, currency: "USD", yahooTicker: "EMIM.AS" },
  { isin: "IE00B4K48024", name: "iShares Core Euro Corp Bond", bank: "iShares/BlackRock", category: "RF Corporativa", riskLevel: 2, currency: "EUR", yahooTicker: "IEAC.AS" },
  { isin: "IE00B3F81R35", name: "iShares Euro Govt Bond 7-10y", bank: "iShares/BlackRock", category: "RF Pública", riskLevel: 2, currency: "EUR", yahooTicker: "IEGM.AS" },
  { isin: "IE00B5BMRQ86", name: "Vanguard FTSE All-World UCITS", bank: "Vanguard", category: "RV Global", riskLevel: 4, currency: "EUR", yahooTicker: "VWCE.DE" },
  { isin: "IE00B2NPKV68", name: "Vanguard FTSE Developed Europe", bank: "Vanguard", category: "RV Europa", riskLevel: 4, currency: "EUR", yahooTicker: "VEUR.AS" },
  { isin: "IE00B2YCN494", name: "Vanguard USD Govt Bond UCITS", bank: "Vanguard", category: "RF Soberana", riskLevel: 2, currency: "USD", yahooTicker: "VUS3.DE" },
  { isin: "LU0908500753", name: "Amundi MSCI Europe UCITS", bank: "Amundi", category: "RV Europa", riskLevel: 4, currency: "EUR", yahooTicker: null },
  { isin: "LU1681043599", name: "Amundi Index MSCI USA SRI", bank: "Amundi", category: "RV EEUU", riskLevel: 4, currency: "USD", yahooTicker: null },
  { isin: "LU0823426021", name: "Amundi Index JP Morgan ESG", bank: "Amundi", category: "RF Global", riskLevel: 2, currency: "EUR", yahooTicker: null },

  // MÁS FONDOS ESPAÑOLES POPULARES
  { isin: "ES0105633000", name: "Carmignac Patrimoine", bank: "Carmignac", category: "Mixto", riskLevel: 3, currency: "EUR", yahooTicker: null },
  { isin: "ES0105632002", name: "Carmignac Investissement", bank: "Carmignac", category: "Mixto", riskLevel: 4, currency: "EUR", yahooTicker: null },
  { isin: "ES0118779000", name: "Magallanes European Equity", bank: "Magallanes", category: "RV Europa", riskLevel: 4, currency: "EUR", yahooTicker: null },
  { isin: "LU0048575833", name: "Nordea 1 European Stars", bank: "Nordea", category: "RV Europa", riskLevel: 4, currency: "EUR", yahooTicker: null },
  { isin: "ES0105637002", name: "T. Rowe Price European Equity", bank: "T. Rowe Price", category: "RV Europa", riskLevel: 4, currency: "EUR", yahooTicker: null },
  { isin: "LU0996171765", name: "Pictet-Biotech Actions P", bank: "Pictet", category: "RV Sectorial", riskLevel: 5, currency: "USD", yahooTicker: null },
  { isin: "ES0142093084", name: "Allianz Renta Fija Global R", bank: "Allianz", category: "RF Global", riskLevel: 2, currency: "EUR", yahooTicker: null },
  { isin: "ES0105597002", name: "DWS Top Dividende", bank: "DWS", category: "RV Europa", riskLevel: 4, currency: "EUR", yahooTicker: null },
];

export function searchFunds(query: string): FundCatalogEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return FUND_CATALOG;
  return FUND_CATALOG.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.isin.toLowerCase().includes(q) ||
      f.bank.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q)
  );
}

export function getFundByIsin(isin: string): FundCatalogEntry | undefined {
  return FUND_CATALOG.find((f) => f.isin === isin);
}

export function getBanks(): string[] {
  return [...new Set(FUND_CATALOG.map((f) => f.bank))].sort();
}

export function getCategories(): string[] {
  return [...new Set(FUND_CATALOG.map((f) => f.category))].sort();
}
