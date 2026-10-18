import { useState, useEffect, useCallback } from "react";
import { api, type Investment, type Status, type AssetAllocation } from "../api";

export function usePortfolio(autoRefreshIntervalMs: number = 30_000) {
  const [funds, setFunds] = useState<Investment[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [assetAllocation, setAssetAllocation] = useState<AssetAllocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (showRefreshingState = true) => {
    if (showRefreshingState) setRefreshing(true);
    setError(null);
    try {
      const data = await api.portfolio();
      setFunds(data.funds);
      setStatus(data.status);
      if (data.assetAllocation) {
        setAssetAllocation(data.assetAllocation);
      }
      setLastRefreshedAt(new Date());
    } catch (err: any) {
      setError(err?.message || "Error al cargar la cartera");
    } finally {
      setLoading(false);
      if (showRefreshingState) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh(false);
    if (autoRefreshIntervalMs > 0) {
      const timer = setInterval(() => void refresh(false), autoRefreshIntervalMs);
      return () => clearInterval(timer);
    }
  }, [refresh, autoRefreshIntervalMs]);

  return {
    funds,
    status,
    assetAllocation,
    loading,
    refreshing,
    lastRefreshedAt,
    error,
    refresh,
  };
}
