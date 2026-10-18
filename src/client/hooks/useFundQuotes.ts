import { useState, useEffect, useCallback } from "react";
import { api, type YahooChartData } from "../api";

export function useFundQuotes(tickerOrIsin?: string, initialRange: string = "1y", initialInterval: string = "1d") {
  const [data, setData] = useState<YahooChartData | null>(null);
  const [range, setRange] = useState<string>(initialRange);
  const [interval, setInterval] = useState<string>(initialInterval);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = useCallback(async (symbol: string, r: string, i: string) => {
    if (!symbol) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getChartData(symbol, r, i);
      setData(res);
    } catch (err: any) {
      setError(err?.message || "No se pudieron obtener cotizaciones de mercado");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tickerOrIsin) {
      void fetchQuote(tickerOrIsin, range, interval);
    }
  }, [tickerOrIsin, range, interval, fetchQuote]);

  return {
    data,
    range,
    setRange,
    interval,
    setInterval,
    loading,
    error,
    refetch: () => tickerOrIsin ? fetchQuote(tickerOrIsin, range, interval) : Promise.resolve(),
  };
}
