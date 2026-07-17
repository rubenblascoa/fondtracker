import { useState } from "react";
import { getToken } from "../api";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function ApiDocsModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  const token = getToken() || "TU_JWT_TOKEN_AQUI";
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const curlList = `curl -X GET http://localhost:3000/api/funds \\
  -H "Authorization: Bearer ${token}"`;

  const curlCatalog = `curl -X GET "http://localhost:3000/api/funds/catalog?q=santander" \\
  -H "Authorization: Bearer ${token}"`;

  const curlChart = `curl -X GET "http://localhost:3000/api/funds/chart/ES0109360000?range=1y&interval=1d" \\
  -H "Authorization: Bearer ${token}"`;

  return (
    <div className="fixed inset-0 bg-[var(--color-bg-0)]/80 backdrop-blur-md flex items-center justify-center z-50 p-6 fade-in">
      <div className="bg-[var(--color-ink-0)] border border-[var(--color-ink-3)] max-w-3xl w-full max-h-[85vh] flex flex-col slide-up shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-ink-3)]">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-xs text-[var(--color-accent)]">&gt;_</span>
            <h2 className="font-pixel uppercase text-xs tracking-wider text-[var(--color-fg-1)]">
              API Documentation (FONDTRACKER)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[10px] uppercase font-mono tracking-wider text-[var(--color-fg-4)] hover:text-[var(--color-danger)] transition-colors"
          >
            close
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Introduction */}
          <div className="text-xs text-[var(--color-fg-3)] leading-relaxed space-y-2">
            <p>
              Fondtracker exposes a complete REST API to query investments, price history, costs, and portfolio composition. All requests require authentication via Bearer Token.
            </p>
            <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] p-3 text-[10px] font-mono text-[var(--color-fg-4)]">
              <strong>Authentication Header:</strong> Authorization: Bearer {token.slice(0, 15)}...
            </div>
          </div>

          {/* Checklist */}
          <div>
            <h3 className="font-pixel text-[10px] text-[var(--color-accent)] uppercase tracking-wider mb-2.5">
              Features & Supported Data
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-mono text-[var(--color-fg-3)] bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] p-3.5">
              <div className="flex items-center gap-1.5"><span className="text-[var(--color-accent)]">✓</span> Mutual Funds</div>
              <div className="flex items-center gap-1.5"><span className="text-[var(--color-accent)]">✓</span> ETFs</div>
              <div className="flex items-center gap-1.5"><span className="text-[var(--color-accent)]">✓</span> Stocks</div>
              <div className="flex items-center gap-1.5"><span className="text-[var(--color-accent)]">✓</span> Indices</div>
              <div className="flex items-center gap-1.5"><span className="text-[var(--color-accent)]">✓</span> Full ISIN</div>
              <div className="flex items-center gap-1.5"><span className="text-[var(--color-accent)]">✓</span> Price History</div>
              <div className="flex items-center gap-1.5"><span className="text-[var(--color-accent)]">✓</span> Returns (1Y, 3Y, 5Y)</div>
              <div className="flex items-center gap-1.5"><span className="text-[var(--color-accent)]">✓</span> TER (Fees)</div>
              <div className="flex items-center gap-1.5"><span className="text-[var(--color-accent)]">✓</span> Sectors</div>
              <div className="flex items-center gap-1.5"><span className="text-[var(--color-accent)]">✓</span> Geographic Distribution</div>
              <div className="flex items-center gap-1.5"><span className="text-[var(--color-accent)]">✓</span> Top Holdings</div>
              <div className="flex items-center gap-1.5"><span className="text-[var(--color-accent)]">✓</span> Currencies (EUR, USD, etc.)</div>
              <div className="flex items-center gap-1.5"><span className="text-[var(--color-accent)]">✓</span> Fund Info</div>
              <div className="flex items-center gap-1.5"><span className="text-[var(--color-accent)]">✓</span> Documented API</div>
            </div>
          </div>

          {/* Endpoints */}
          <div className="space-y-4">
            <h3 className="font-pixel text-[10px] text-[var(--color-accent)] uppercase tracking-wider mb-2 border-b border-[var(--color-ink-3)] pb-1">
              API Endpoints
            </h3>

            {/* List Investments */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-[var(--color-accent)] font-bold">GET /api/funds</span>
                <span className="text-[var(--color-fg-4)]">List of user investments</span>
              </div>
              <div className="relative">
                <pre className="bg-[var(--color-bg-1)] border border-[var(--color-ink-3)] p-3 text-[9px] text-[var(--color-fg-3)] font-mono overflow-x-auto rounded">
                  {curlList}
                </pre>
                <button
                  onClick={() => copyToClipboard(curlList, "list")}
                  className="absolute right-2 top-2 bg-[var(--color-ink-3)] border border-[var(--color-ink-4)] text-[8px] text-[var(--color-fg-4)] px-1.5 py-0.5 rounded hover:text-[var(--color-accent)]"
                >
                  {copied === "list" ? "copied" : "copy"}
                </button>
              </div>
            </div>

            {/* Search Catalog */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-[var(--color-accent)] font-bold">GET /api/funds/catalog?q=:query</span>
                <span className="text-[var(--color-fg-4)]">Search the fund catalog (490+ assets)</span>
              </div>
              <div className="relative">
                <pre className="bg-[var(--color-bg-1)] border border-[var(--color-ink-3)] p-3 text-[9px] text-[var(--color-fg-3)] font-mono overflow-x-auto rounded">
                  {curlCatalog}
                </pre>
                <button
                  onClick={() => copyToClipboard(curlCatalog, "catalog")}
                  className="absolute right-2 top-2 bg-[var(--color-ink-3)] border border-[var(--color-ink-4)] text-[8px] text-[var(--color-fg-4)] px-1.5 py-0.5 rounded hover:text-[var(--color-accent)]"
                >
                  {copied === "catalog" ? "copied" : "copy"}
                </button>
              </div>
            </div>

            {/* Ficha & Histórico */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-[var(--color-accent)] font-bold">GET /api/funds/chart/:ticker</span>
                <span className="text-[var(--color-fg-4)]">Price history, TER, Sectors, Geography, Holdings and Returns</span>
              </div>
              <div className="relative">
                <pre className="bg-[var(--color-bg-1)] border border-[var(--color-ink-3)] p-3 text-[9px] text-[var(--color-fg-3)] font-mono overflow-x-auto rounded">
                  {curlChart}
                </pre>
                <button
                  onClick={() => copyToClipboard(curlChart, "chart")}
                  className="absolute right-2 top-2 bg-[var(--color-ink-3)] border border-[var(--color-ink-4)] text-[8px] text-[var(--color-fg-4)] px-1.5 py-0.5 rounded hover:text-[var(--color-accent)]"
                >
                  {copied === "chart" ? "copied" : "copy"}
                </button>
              </div>
              <div className="text-[9px] text-[var(--color-fg-4)] leading-normal bg-[var(--color-ink-1)] p-2 border border-[var(--color-ink-3)] mt-1.5 font-mono">
                <strong>Query params:</strong><br />
                - <code>range</code>: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max (Default: 1y)<br />
                - <code>interval</code>: 5m, 15m, 1d, 1wk, 1mo (Default: 1d)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
