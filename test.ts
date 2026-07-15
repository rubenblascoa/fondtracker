import { fetchYahooChart } from "./src/server/yahoo.ts";

async function run() {
  try {
    const data = await fetchYahooChart("ES0119203026");
    console.log("CHART DATA:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("ERROR:", e);
  }
}
run();
