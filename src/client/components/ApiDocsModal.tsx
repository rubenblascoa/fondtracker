import { useState } from "react";
import { getToken } from "../api";
import { Copy, Check, X, Lock, Code2, Globe, Shield, Terminal, Zap } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function ApiDocsModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  const rawToken = getToken() || "";
  const token = rawToken || "TU_JWT_TOKEN_AQUI";
  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<"curl" | "fetch" | "python">("curl");

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const ENDPOINTS = [
    {
      method: "GET",
      path: "/api/portfolio",
      desc: "Estado global de la cartera: total invertido, valoración NAV actual, plusvalías y desglose.",
      curl: `curl -X GET "${baseUrl}/api/portfolio" \\
  -H "Authorization: Bearer ${token}"`,
      fetch: `const res = await fetch("${baseUrl}/api/portfolio", {\n  headers: { "Authorization": "Bearer ${token}" }\n});\nconst data = await res.json();\nconsole.log(data);`,
      python: `import requests\n\nres = requests.get("\n  ${baseUrl}/api/portfolio",\n  headers={"Authorization": "Bearer ${token}"}\n)\nprint(res.json())`
    },
    {
      method: "GET",
      path: "/api/funds",
      desc: "Listado de posiciones de inversión con precios liquidativos, rentabilidades y fuentes.",
      curl: `curl -X GET "${baseUrl}/api/funds" \\
  -H "Authorization: Bearer ${token}"`,
      fetch: `const res = await fetch("${baseUrl}/api/funds", {\n  headers: { "Authorization": "Bearer ${token}" }\n});\nconst data = await res.json();`,
      python: `import requests\n\nres = requests.get("${baseUrl}/api/funds", headers={"Authorization": "Bearer ${token}"})\nprint(res.json())`
    },
    {
      method: "POST",
      path: "/api/funds",
      desc: "Añade una nueva posición de inversión a la cartera del usuario.",
      curl: `curl -X POST "${baseUrl}/api/funds" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{"isin":"ES0109360000","shares":100,"purchase_price":10.5,"purchase_date":"2026-08-17"}'`,
      fetch: `const res = await fetch("${baseUrl}/api/funds", {\n  method: "POST",\n  headers: {\n    "Authorization": "Bearer ${token}",\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify({\n    isin: "ES0109360000",\n    shares: 100,\n    purchase_price: 10.5,\n    purchase_date: "2026-08-17"\n  })\n});\nconst data = await res.json();`,
      python: `import requests\n\nres = requests.post("\n  ${baseUrl}/api/funds",\n  headers={"Authorization": "Bearer ${token}", "Content-Type": "application/json"},\n  json={"isin": "ES0109360000", "shares": 100, "purchase_price": 10.5, "purchase_date": "2026-08-17"}\n)\nprint(res.json())`
    },
    {
      method: "GET",
      path: "/api/funds/catalog?q=santander",
      desc: "Búsqueda predictiva en el catálogo maestro CNMV (490+ fondos con ISIN, entidad y categoría).",
      curl: `curl -X GET "${baseUrl}/api/funds/catalog?q=santander" \\
  -H "Authorization: Bearer ${token}"`,
      fetch: `const res = await fetch("${baseUrl}/api/funds/catalog?q=santander", {\n  headers: { "Authorization": "Bearer ${token}" }\n});\nconst data = await res.json();`,
      python: `import requests\n\nres = requests.get("${baseUrl}/api/funds/catalog?q=santander", headers={"Authorization": "Bearer ${token}"})\nprint(res.json())`
    },
    {
      method: "GET",
      path: "/api/funds/chart/ES0109360000?range=1y",
      desc: "Serie temporal histórica de precios liquidativos (NAV) y rentabilidades del periodo.",
      curl: `curl -X GET "${baseUrl}/api/funds/chart/ES0109360000?range=1y" \\
  -H "Authorization: Bearer ${token}"`,
      fetch: `const res = await fetch("${baseUrl}/api/funds/chart/ES0109360000?range=1y", {\n  headers: { "Authorization": "Bearer ${token}" }\n});\nconst data = await res.json();`,
      python: `import requests\n\nres = requests.get("${baseUrl}/api/funds/chart/ES0109360000?range=1y", headers={"Authorization": "Bearer ${token}"})\nprint(res.json())`
    },
    {
      method: "GET",
      path: "/api/banks",
      desc: "Catálogo de entidades bancarias españolas y gestoras internacionales con URLs a portales oficiales.",
      curl: `curl -X GET "${baseUrl}/api/banks" \\
  -H "Authorization: Bearer ${token}"`,
      fetch: `const res = await fetch("${baseUrl}/api/banks", {\n  headers: { "Authorization": "Bearer ${token}" }\n});\nconst data = await res.json();`,
      python: `import requests\n\nres = requests.get("${baseUrl}/api/banks", headers={"Authorization": "Bearer ${token}"})\nprint(res.json())`
    },
    {
      method: "GET",
      path: "/api/whatsapp/config",
      desc: "Configuración del canal WhatsApp (teléfono, clave CallMeBot, slots horarios y estado).",
      curl: `curl -X GET "${baseUrl}/api/whatsapp/config" \\
  -H "Authorization: Bearer ${token}"`,
      fetch: `const res = await fetch("${baseUrl}/api/whatsapp/config", {\n  headers: { "Authorization": "Bearer ${token}" }\n});\nconst data = await res.json();`,
      python: `import requests\n\nres = requests.get("${baseUrl}/api/whatsapp/config", headers={"Authorization": "Bearer ${token}"})\nprint(res.json())`
    },
    {
      method: "GET",
      path: "/api/notify/preview",
      desc: "Simula y previsualiza el resumen diario que el bot enviará al WhatsApp del usuario.",
      curl: `curl -X GET "${baseUrl}/api/notify/preview" \\
  -H "Authorization: Bearer ${token}"`,
      fetch: `const res = await fetch("${baseUrl}/api/notify/preview", {\n  headers: { "Authorization": "Bearer ${token}" }\n});\nconst data = await res.json();`,
      python: `import requests\n\nres = requests.get("${baseUrl}/api/notify/preview", headers={"Authorization": "Bearer ${token}"})\nprint(res.json())`
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--color-ink-3)] bg-[var(--color-ink-2)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 flex items-center justify-center text-[var(--color-accent)]">
              <Code2 size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--color-fg-1)]">
                Documentación & Referencia de API REST
              </h2>
              <p className="text-[11px] text-[var(--color-fg-4)]">FondTracker Developer API v2.0</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] bg-[var(--color-ink-3)] rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 scrollbar-thin">
          
          {/* Auth banner */}
          <div className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-fg-1)]">
                <Lock size={14} className="text-[var(--color-accent)]" />
                <span>Autenticación mediante JWT Bearer Token</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-accent)]/15 text-[var(--color-accent)] font-bold">
                {rawToken ? "Token Activo" : "Sin Sesión"}
              </span>
            </div>
            <p className="text-xs text-[var(--color-fg-4)] leading-relaxed">
              Todas las peticiones a la API requieren el envío de tu token de sesión en la cabecera HTTP:
            </p>
            <div className="flex items-center justify-between bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] p-2.5 rounded-lg text-xs font-mono text-[var(--color-fg-2)]">
              <span className="truncate pr-2">Authorization: Bearer {token.slice(0, 24)}...</span>
              <button 
                onClick={() => copyToClipboard(`Authorization: Bearer ${rawToken || "TU_TOKEN"}`, "auth-hdr")}
                className="text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] shrink-0 flex items-center gap-1 text-[11px] font-sans"
              >
                {copied === "auth-hdr" ? <Check size={13} className="text-[var(--color-accent)]" /> : <Copy size={13} />}
                <span>{copied === "auth-hdr" ? "Copiado" : "Copiar"}</span>
              </button>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--color-accent)]">
              Endpoints Disponibles
            </h3>
            <div className="flex items-center gap-1 bg-[var(--color-ink-2)] p-1 rounded-xl border border-[var(--color-ink-3)]">
              {(["curl", "fetch", "python"] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all ${
                    selectedLang === lang 
                      ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-bold" 
                      : "text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Endpoints List */}
          <div className="space-y-4">
            {ENDPOINTS.map((ep, idx) => {
              const code = ep[selectedLang];
              const snippetId = `ep-modal-${idx}`;

              return (
                <div key={idx} className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                        ep.method === "GET" ? "bg-blue-500/15 text-blue-400 border border-blue-500/30" :
                        "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      }`}>
                        {ep.method}
                      </span>
                      <code className="text-xs font-mono font-bold text-[var(--color-fg-1)]">{ep.path}</code>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(code, snippetId)}
                      className="text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] transition-colors flex items-center gap-1 text-[11px]"
                    >
                      {copied === snippetId ? <Check size={12} className="text-[var(--color-accent)]" /> : <Copy size={12} />}
                      <span>{copied === snippetId ? "Copiado" : "Copiar"}</span>
                    </button>
                  </div>
                  <p className="text-xs text-[var(--color-fg-4)]">{ep.desc}</p>
                  <pre className="bg-[var(--color-ink-1)] p-3 rounded-lg text-[11px] font-mono text-[var(--color-fg-2)] overflow-x-auto touch-scroll border border-[var(--color-ink-3)]">
                    {code}
                  </pre>
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--color-ink-3)] bg-[var(--color-ink-2)] flex items-center justify-between text-xs text-[var(--color-fg-4)]">
          <span>Para la documentación completa, consulta la pestaña <strong>Documentación</strong> en el panel.</span>
          <button onClick={onClose} className="px-4 py-1.5 bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-bold rounded-xl text-xs">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
