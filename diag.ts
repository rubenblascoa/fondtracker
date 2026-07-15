const tickers = ["ES0147077038", "ES0175224031"];
for (const t of tickers) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${t}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    console.log(`Ticker: ${t}`);
    console.log(`  Status: ${res.status} (${res.statusText})`);
    if (res.ok) {
      const data = await res.json();
      console.log(`  Data result:`, data.chart?.result ? "Exists" : "Null");
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message}`);
  }
}
