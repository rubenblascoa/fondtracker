export interface ExtraMetadata {
  return1Y?: number;
  return3Y?: number;
  return5Y?: number;
  ter?: number;
  sectors?: { name: string; weight: number }[];
  geography?: { name: string; weight: number }[];
  topHoldings?: { name: string; ticker?: string; weight: number }[];
}

export function getFundExtraMetadata(
  isinOrTicker: string,
  category: string = "",
  name: string = "",
  returns: { r1Y?: number; r3Y?: number; r5Y?: number } = {}
): ExtraMetadata {
  const normIsin = isinOrTicker.toUpperCase();
  const normCat = (category || "").toLowerCase();
  const normName = (name || "").toLowerCase();

  // Initialize return metrics
  let return1Y = returns.r1Y ?? 12.5;
  let return3Y = returns.r3Y ?? 28.4;
  let return5Y = returns.r5Y ?? 45.2;
  let ter = 0.20; // Default index fund TER

  // Default values
  let topHoldings: { name: string; ticker?: string; weight: number }[] = [];
  let sectors: { name: string; weight: number }[] = [];
  let geography: { name: string; weight: number }[] = [];

  // Determine fund profile
  if (normCat.includes("spain") || normCat.includes("españa") || normName.includes("españa") || normName.includes("ibex")) {
    ter = normName.includes("cartera") || normName.includes("indice") ? 0.18 : 1.65;
    topHoldings = [
      { name: "Iberdrola SA", ticker: "IBE.MC", weight: 11.45 },
      { name: "Inditex SA", ticker: "ITX.MC", weight: 10.20 },
      { name: "Banco Santander SA", ticker: "SAN.MC", weight: 9.80 },
      { name: "Banco Bilbao Vizcaya Argentaria SA", ticker: "BBVA.MC", weight: 8.52 },
      { name: "CaixaBank SA", ticker: "CABK.MC", weight: 5.40 },
      { name: "Amadeus IT Group SA", ticker: "AMS.MC", weight: 4.75 },
      { name: "Cellnex Telecom SA", ticker: "CLNX.MC", weight: 4.15 },
      { name: "Telefónica SA", ticker: "TEF.MC", weight: 3.90 },
      { name: "Repsol SA", ticker: "REP.MC", weight: 3.48 },
      { name: "Ferrovial SE", ticker: "FER.MC", weight: 3.12 },
    ];
    sectors = [
      { name: "Financial Services", weight: 28.5 },
      { name: "Utilities", weight: 18.2 },
      { name: "Consumer Cyclical", weight: 14.8 },
      { name: "Industrials", weight: 12.1 },
      { name: "Technology", weight: 8.4 },
      { name: "Communication Services", weight: 7.9 },
      { name: "Energy", weight: 5.8 },
      { name: "Basic Materials", weight: 4.3 },
    ];
    geography = [
      { name: "España", weight: 96.5 },
      { name: "Francia", weight: 1.8 },
      { name: "Reino Unido", weight: 1.2 },
      { name: "Otros", weight: 0.5 },
    ];
  } else if (normName.includes("s&p 500") || normIsin.includes("VUSA") || normIsin.includes("SPY") || normIsin.includes("VOO")) {
    ter = 0.07; // Very cheap S&P 500 ETFs
    topHoldings = [
      { name: "Microsoft Corp", ticker: "MSFT", weight: 7.15 },
      { name: "Apple Inc", ticker: "AAPL", weight: 6.85 },
      { name: "NVIDIA Corp", ticker: "NVDA", weight: 6.45 },
      { name: "Amazon.com Inc", ticker: "AMZN", weight: 3.80 },
      { name: "Alphabet Inc Class A", ticker: "GOOGL", weight: 2.30 },
      { name: "Meta Platforms Inc", ticker: "META", weight: 2.25 },
      { name: "Alphabet Inc Class C", ticker: "GOOG", weight: 1.95 },
      { name: "Berkshire Hathaway Inc", ticker: "BRK.B", weight: 1.70 },
      { name: "Eli Lilly & Co", ticker: "LLY", weight: 1.45 },
      { name: "Broadcom Inc", ticker: "AVGO", weight: 1.30 },
    ];
    sectors = [
      { name: "Technology", weight: 31.2 },
      { name: "Financial Services", weight: 12.8 },
      { name: "Healthcare", weight: 11.9 },
      { name: "Consumer Cyclical", weight: 10.3 },
      { name: "Communication Services", weight: 8.9 },
      { name: "Industrials", weight: 8.1 },
      { name: "Consumer Defensive", weight: 5.9 },
      { name: "Energy", weight: 3.7 },
      { name: "Real Estate", weight: 2.2 },
      { name: "Utilities", weight: 2.0 },
    ];
    geography = [
      { name: "Estados Unidos", weight: 99.2 },
      { name: "Otros", weight: 0.8 },
    ];
  } else if (normCat.includes("europa") || normName.includes("europa") || normName.includes("europe")) {
    ter = normName.includes("indice") || normName.includes("cartera") ? 0.20 : 1.85;
    topHoldings = [
      { name: "ASML Holding NV", ticker: "ASML", weight: 3.85 },
      { name: "LVMH Moët Hennessy Louis Vuitton SE", ticker: "MC.PA", weight: 3.40 },
      { name: "Nestlé SA", ticker: "NESN.SW", weight: 3.10 },
      { name: "Novo Nordisk A/S", ticker: "NVO", weight: 2.95 },
      { name: "SAP SE", ticker: "SAP", weight: 2.50 },
      { name: "Roche Holding AG", ticker: "ROG.SW", weight: 2.35 },
      { name: "AstraZeneca PLC", ticker: "AZN", weight: 2.15 },
      { name: "Novartis AG", ticker: "NOVN.SW", weight: 2.05 },
      { name: "Shell PLC", ticker: "SHEL", weight: 1.90 },
      { name: "TotalEnergies SE", ticker: "TTE.PA", weight: 1.75 },
    ];
    sectors = [
      { name: "Financial Services", weight: 18.4 },
      { name: "Healthcare", weight: 15.6 },
      { name: "Industrials", weight: 14.8 },
      { name: "Consumer Defensive", weight: 11.2 },
      { name: "Consumer Cyclical", weight: 10.9 },
      { name: "Technology", weight: 9.8 },
      { name: "Energy", weight: 6.5 },
      { name: "Basic Materials", weight: 6.2 },
    ];
    geography = [
      { name: "Reino Unido", weight: 22.4 },
      { name: "Francia", weight: 18.5 },
      { name: "Suiza", weight: 14.2 },
      { name: "Alemania", weight: 13.9 },
      { name: "Países Bajos", weight: 9.1 },
      { name: "España", weight: 7.2 },
      { name: "Otros", weight: 14.7 },
    ];
  } else if (normCat.includes("mixto") || normCat.includes("flexible") || normName.includes("audaz") || normName.includes("mixto")) {
    ter = 1.45; // Mixed active funds fees
    topHoldings = [
      { name: "Iberdrola SA", ticker: "IBE.MC", weight: 4.80 },
      { name: "ASML Holding NV", ticker: "ASML", weight: 3.10 },
      { name: "Microsoft Corp", ticker: "MSFT", weight: 2.95 },
      { name: "Inditex SA", ticker: "ITX.MC", weight: 2.85 },
      { name: "NVIDIA Corp", ticker: "NVDA", weight: 2.70 },
      { name: "SAP SE", ticker: "SAP", weight: 2.20 },
      { name: "Nestlé SA", ticker: "NESN.SW", weight: 2.10 },
      { name: "Banco Santander SA", ticker: "SAN.MC", weight: 1.95 },
      { name: "Novo Nordisk A/S", ticker: "NVO", weight: 1.80 },
      { name: "LVMH SE", ticker: "MC.PA", weight: 1.65 },
    ];
    sectors = [
      { name: "Financial Services", weight: 19.5 },
      { name: "Technology", weight: 16.2 },
      { name: "Healthcare", weight: 12.8 },
      { name: "Industrials", weight: 12.1 },
      { name: "Consumer Cyclical", weight: 10.5 },
      { name: "Utilities", weight: 9.4 },
      { name: "Consumer Defensive", weight: 8.1 },
      { name: "Other / Cash", weight: 11.4 },
    ];
    geography = [
      { name: "Europa", weight: 58.5 },
      { name: "Estados Unidos", weight: 29.8 },
      { name: "Asia / Emergentes", weight: 8.2 },
      { name: "Otros", weight: 3.5 },
    ];
  } else if (normName.includes("msci world") || normIsin.includes("IWDA") || normIsin.includes("URTH") || normCat.includes("global")) {
    ter = 0.20;
    topHoldings = [
      { name: "Microsoft Corp", ticker: "MSFT", weight: 4.95 },
      { name: "Apple Inc", ticker: "AAPL", weight: 4.70 },
      { name: "NVIDIA Corp", ticker: "NVDA", weight: 4.45 },
      { name: "Amazon.com Inc", ticker: "AMZN", weight: 2.60 },
      { name: "Alphabet Inc Class A", ticker: "GOOGL", weight: 1.60 },
      { name: "Meta Platforms Inc", ticker: "META", weight: 1.55 },
      { name: "Berkshire Hathaway Inc", ticker: "BRK.B", weight: 1.15 },
      { name: "Eli Lilly & Co", ticker: "LLY", weight: 1.00 },
      { name: "Broadcom Inc", ticker: "AVGO", weight: 0.90 },
      { name: "Tesla Inc", ticker: "TSLA", weight: 0.85 },
    ];
    sectors = [
      { name: "Technology", weight: 24.8 },
      { name: "Financial Services", weight: 15.1 },
      { name: "Healthcare", weight: 12.0 },
      { name: "Industrials", weight: 11.2 },
      { name: "Consumer Cyclical", weight: 10.7 },
      { name: "Communication Services", weight: 7.5 },
      { name: "Consumer Defensive", weight: 6.8 },
      { name: "Energy", weight: 4.5 },
      { name: "Basic Materials", weight: 3.9 },
      { name: "Utilities", weight: 2.5 },
    ];
    geography = [
      { name: "Estados Unidos", weight: 70.2 },
      { name: "Japón", weight: 6.1 },
      { name: "Reino Unido", weight: 3.8 },
      { name: "Francia", weight: 3.1 },
      { name: "Canadá", weight: 2.9 },
      { name: "Alemania", weight: 2.1 },
      { name: "Otros", weight: 11.8 },
    ];
  } else {
    // Generically fallback for Stocks or unknown funds
    const isStock = isinOrTicker.length < 9 || !/^[A-Z]{2}/.test(isinOrTicker);
    if (isStock) {
      ter = 0; // Stocks have no TER
      topHoldings = [];
      sectors = [
        { name: "Stock Asset", weight: 100.0 }
      ];
      geography = [
        { name: "Country of Origin", weight: 100.0 }
      ];
    } else {
      // General Global Equity Fund fallback
      ter = 1.80;
      topHoldings = [
        { name: "Microsoft Corp", ticker: "MSFT", weight: 5.2 },
        { name: "Apple Inc", ticker: "AAPL", weight: 4.8 },
        { name: "NVIDIA Corp", ticker: "NVDA", weight: 4.5 },
        { name: "ASML Holding NV", ticker: "ASML", weight: 3.2 },
        { name: "Nestlé SA", ticker: "NESN", weight: 2.9 },
        { name: "Alphabet Inc", ticker: "GOOGL", weight: 2.5 },
      ];
      sectors = [
        { name: "Technology", weight: 22.5 },
        { name: "Financial Services", weight: 16.4 },
        { name: "Healthcare", weight: 14.1 },
        { name: "Industrials", weight: 12.8 },
        { name: "Consumer Cyclical", weight: 11.2 },
        { name: "Consumer Defensive", weight: 8.5 },
        { name: "Others", weight: 14.5 }
      ];
      geography = [
        { name: "Estados Unidos", weight: 55.4 },
        { name: "Europa", weight: 32.8 },
        { name: "Asia", weight: 8.5 },
        { name: "Otros", weight: 3.3 }
      ];
    }
  }

  return {
    return1Y,
    return3Y,
    return5Y,
    ter,
    sectors,
    geography,
    topHoldings
  };
}
