import React, { useState } from "react";
import { 
  BookOpen, Layers, Database, Shield, Smartphone, Server, 
  Code2, Key, Search, Copy, Check, ChevronRight, FileText, 
  Cpu, ExternalLink, Zap, Terminal, Sparkles, FolderTree, RefreshCw,
  Play, CheckCircle2, AlertCircle, ArrowRight, Table, Globe, Sliders, Lock
} from "lucide-react";
import { getToken } from "../api";

export function DocsTab() {
  const [activeCategory, setActiveCategory] = useState<"overview" | "apis" | "scraper" | "database" | "whatsapp" | "security" | "deployment">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Interactive API Console state
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("/api/portfolio");
  const [customParams, setCustomParams] = useState<string>("");
  const [consoleLoading, setConsoleLoading] = useState(false);
  const [consoleResponse, setConsoleResponse] = useState<any>(null);
  const [consoleStatus, setConsoleStatus] = useState<{ code: number; text: string; ms: number } | null>(null);
  const [selectedLang, setSelectedLang] = useState<"curl" | "fetch" | "python">("curl");

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Run live API test
  const runLiveTest = async (endpoint: string) => {
    setConsoleLoading(true);
    setConsoleResponse(null);
    setConsoleStatus(null);
    const start = performance.now();

    try {
      const token = getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(endpoint, { headers });
      const elapsed = Math.round(performance.now() - start);
      setConsoleStatus({ code: res.status, text: res.statusText, ms: elapsed });

      const data = await res.json().catch(() => ({ message: "Respuesta no es JSON válido" }));
      setConsoleResponse(data);
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      setConsoleStatus({ code: 0, text: "Error de red", ms: elapsed });
      setConsoleResponse({ error: err.message || "Error al conectar con la API" });
    } finally {
      setConsoleLoading(false);
    }
  };

  const API_ENDPOINTS = [
    {
      group: "1. Autenticación & Usuarios",
      items: [
        { 
          method: "POST", 
          path: "/api/auth/register", 
          desc: "Crea una nueva cuenta de usuario con validación de requisitos de contraseña (8+ car., mayúscula, minúscula, número) y teléfono opcional.",
          body: `{\n  "username": "inversor_pro",\n  "email": "usuario@ejemplo.com",\n  "password": "Password123!",\n  "phone": "+34600000000"\n}`, 
          res: `{\n  "user": {\n    "id": 1,\n    "username": "inversor_pro",\n    "email": "usuario@ejemplo.com",\n    "phone": "+34600000000"\n  },\n  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiaW52ZXJzb3JfcHJvIiwiaXNfYWRtaW4iOjB9..."\n}` 
        },
        { 
          method: "POST", 
          path: "/api/auth/login", 
          desc: "Autentica al usuario mediante email o nombre de usuario y genera un token JWT firmado.", 
          body: `{\n  "identifier": "usuario@ejemplo.com",\n  "password": "Password123!"\n}`, 
          res: `{\n  "user": { "id": 1, "username": "inversor_pro", "email": "usuario@ejemplo.com", "phone": "+34600000000" },\n  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."\n}` 
        },
        { 
          method: "GET", 
          path: "/api/auth/me", 
          desc: "Devuelve el perfil del usuario autenticado actual a partir del token Bearer enviado en la cabecera.", 
          auth: true, 
          res: `{\n  "id": 1,\n  "username": "inversor_pro",\n  "email": "usuario@ejemplo.com",\n  "phone": "+34600000000",\n  "is_admin": true,\n  "created_at": "2026-08-10T12:00:00.000Z"\n}` 
        },
        { 
          method: "POST", 
          path: "/api/auth/email", 
          desc: "Actualiza la dirección de correo electrónico del usuario autenticado previa validación de formato.", 
          auth: true, 
          body: `{\n  "newEmail": "nuevo_email@ejemplo.com"\n}`, 
          res: `{\n  "ok": true\n}` 
        },
        { 
          method: "POST", 
          path: "/api/auth/password", 
          desc: "Modifica la contraseña del usuario verificando previamente la contraseña actual mediante Bcrypt.", 
          auth: true, 
          body: `{\n  "currentPassword": "Password123!",\n  "newPassword": "NewSecurePassword456!"\n}`, 
          res: `{\n  "ok": true\n}` 
        },
        { 
          method: "POST", 
          path: "/api/auth/phone", 
          desc: "Actualiza el número de teléfono con código de país para el envío de resúmenes por WhatsApp.", 
          auth: true, 
          body: `{\n  "phone": "+34612345678"\n}`, 
          res: `{\n  "ok": true\n}` 
        },
        { 
          method: "POST", 
          path: "/api/auth/delete", 
          desc: "Elimina de forma segura la cuenta del usuario y todas sus posiciones asociadas previa confirmación de contraseña.", 
          auth: true, 
          body: `{\n  "password": "Password123!"\n}`, 
          res: `{\n  "ok": true\n}` 
        }
      ]
    },
    {
      group: "2. Cartera, Inversiones & Mercado",
      items: [
        { 
          method: "GET", 
          path: "/api/portfolio", 
          desc: "Calcula en tiempo real la valoración total de la cartera del usuario, rentabilidades absolutas/porcentuales y lista enriquecida de fondos con cotizaciones actualizadas.", 
          auth: true, 
          res: `{\n  "funds": [\n    {\n      "id": 10,\n      "isin": "ES0113312003",\n      "name": "Ibercaja Renta Fija 2026",\n      "bank": "Ibercaja",\n      "category": "Renta Fija Corto Plazo",\n      "shares": 125.5,\n      "purchase_price": 10.20,\n      "current_price": 11.45,\n      "total_invested": 1280.10,\n      "current_value": 1436.98,\n      "profit_loss": 156.88,\n      "profit_loss_pct": 12.25,\n      "dataSource": "quefondos",\n      "dataDate": "14/08/2026",\n      "ter": 0.65\n    }\n  ],\n  "status": {\n    "total_initial": 1280.10,\n    "total_current": 1436.98,\n    "total_profit_loss": 156.88,\n    "total_profit_loss_pct": 12.25,\n    "fund_count": 1\n  }\n}` 
        },
        { 
          method: "POST", 
          path: "/api/funds", 
          desc: "Añade un nuevo activo a la cartera. Auto-descubre el nombre, banco y cotización inicial si están en el catálogo.", 
          auth: true, 
          body: `{\n  "isin": "IE00BK5BQT80",\n  "shares": 15.0,\n  "purchase_price": 105.40,\n  "purchase_date": "2024-03-10",\n  "notes": "Vanguard FTSE All-World UCITS ETF"\n}`, 
          res: `{\n  "id": 11,\n  "isin": "IE00BK5BQT80",\n  "shares": 15.0,\n  "purchase_price": 105.40,\n  "purchase_date": "2024-03-10"\n}` 
        },
        { 
          method: "PUT", 
          path: "/api/funds/:id", 
          desc: "Edita las participaciones, precio medio de compra, fecha de suscripción o notas de una posición existente.", 
          auth: true, 
          body: `{\n  "shares": 20.0,\n  "purchase_price": 104.80,\n  "purchase_date": "2024-03-10",\n  "notes": "Ampliación de cartera"\n}`, 
          res: `{\n  "id": 11,\n  "shares": 20.0,\n  "purchase_price": 104.80\n}` 
        },
        { 
          method: "DELETE", 
          path: "/api/funds/:id", 
          desc: "Elimina de forma lógica (soft delete) una posición de inversión de la cartera del usuario.", 
          auth: true, 
          res: `{\n  "ok": true\n}` 
        },
        { 
          method: "GET", 
          path: "/api/chart/:isin?range=1M|3M|6M|1Y|3Y|5Y|MAX", 
          desc: "Obtiene el histórico de cotizaciones para gráficas interactivas con cálculo de rentabilidad del periodo.", 
          res: `{\n  "isin": "ES0113312003",\n  "points": [\n    { "date": "2024-01-02", "price": 10.12 },\n    { "date": "2024-02-01", "price": 10.28 },\n    { "date": "2024-03-01", "price": 10.45 }\n  ],\n  "returnPct": 3.26\n}` 
        },
        { 
          method: "GET", 
          path: "/api/search?q=santander", 
          desc: "Búsqueda predictiva en el catálogo maestro de más de 490 fondos por ISIN, nombre o banco gestor.", 
          res: `{\n  "results": [\n    {\n      "isin": "ES0175080003",\n      "name": "Santander Acciones Españolas",\n      "bank": "Santander",\n      "category": "Renta Variable España",\n      "riskLevel": 6\n    }\n  ]\n}` 
        }
      ]
    },
    {
      group: "3. Sistema WhatsApp & Informes",
      items: [
        { 
          method: "GET", 
          path: "/api/whatsapp/config", 
          desc: "Recupera los parámetros de WhatsApp del usuario: teléfono, clave CallMeBot, horas de envío y estado de entrega.", 
          auth: true, 
          res: `{\n  "enabled": true,\n  "configured": true,\n  "phone": "+34600000000",\n  "timezone": "Europe/Madrid",\n  "hours": [8, 14, 20],\n  "lastSent": "2026-08-16T14:00:00Z",\n  "nextRunAt": "2026-08-16T20:00:00Z",\n  "lastStatus": "ok"\n}` 
        },
        { 
          method: "PUT", 
          path: "/api/whatsapp/config", 
          desc: "Guarda la clave API de CallMeBot, horario diario de notificaciones (0 a 23h) y estado activo.", 
          auth: true, 
          body: `{\n  "api_key": "987654",\n  "phone": "+34600000000",\n  "hours": [9, 18],\n  "timezone": "Europe/Madrid",\n  "enabled": true\n}`, 
          res: `{\n  "ok": true\n}` 
        },
        { 
          method: "POST", 
          path: "/api/whatsapp/test", 
          desc: "Envía un mensaje de prueba inmediato a través de CallMeBot para verificar la recepción correcta.", 
          auth: true, 
          res: `{\n  "ok": true\n}` 
        },
        { 
          method: "GET", 
          path: "/api/notify/preview", 
          desc: "Genera una vista previa idéntica al texto que se enviará por WhatsApp con emojis y balances.", 
          auth: true, 
          res: `{\n  "message": "╔══ *FONDTRACKER* ═══════╗\\n║ 📊 *Resumen de Cartera*\\n║ 16/08/2026 · 18:00\\n╚════════════════════════╝\\n\\n💰 *Total:* €124,562 (+1.24%)\\n📈 *Ganancia:* +€1,520\\n...",\n  "messages": [ "..." ]\n}` 
        },
        { 
          method: "POST", 
          path: "/api/digest/trigger", 
          desc: "Endpoint disparador para servicios cron externos (UptimeRobot, Render Cron). Autenticado por header x-cron-secret.", 
          auth: "Header x-cron-secret", 
          res: `{\n  "ok": true,\n  "elapsed_ms": 284\n}` 
        }
      ]
    },
    {
      group: "4. Administración & Métricas Globales",
      items: [
        { 
          method: "GET", 
          path: "/api/admin/overview", 
          desc: "Obtiene el resumen ejecutivo global: AUM total bajo monitorización, usuarios activos, distribución de autenticación y tamaño de caché.", 
          auth: "Admin", 
          res: `{\n  "total_users": 152,\n  "active_users": 134,\n  "total_aum": 2845000,\n  "catalog_size": 492,\n  "cached_prices": 340,\n  "uptime": 124500,\n  "bun_version": "1.3.14"\n}` 
        },
        { 
          method: "GET", 
          path: "/api/admin/users?search=&status=&offset=", 
          desc: "Lista de usuarios con estadísticas de cartera, fondos monitorizados, total invertido y estado del soft-delete.", 
          auth: "Admin", 
          res: `{\n  "users": [\n    {\n      "id": 1,\n      "username": "ruben",\n      "email": "ruben@ejemplo.com",\n      "is_admin": 1,\n      "funds_count": 8,\n      "total_invested": 54200,\n      "created_at": "2026-08-01T10:00:00Z"\n    }\n  ],\n  "total": 1\n}` 
        },
        { 
          method: "POST", 
          path: "/api/admin/users/:id/promote", 
          desc: "Promociona a un usuario a Administrador o revoca sus privilegios administrativos.", 
          auth: "Admin", 
          body: `{\n  "is_admin": true\n}`, 
          res: `{\n  "ok": true\n}` 
        },
        { 
          method: "POST", 
          path: "/api/admin/users/:id/delete", 
          desc: "Bloquea y aplica soft-delete a un usuario. Sus datos se purgan tras 7 días de retención.", 
          auth: "Admin", 
          res: `{\n  "ok": true\n}` 
        },
        { 
          method: "PUT", 
          path: "/api/admin/catalog/:isin/ticker", 
          desc: "Asigna o actualiza el ticker correspondiente de Yahoo Finance para un fondo del catálogo.", 
          auth: "Admin", 
          body: `{\n  "ticker": "0P00000000.F"\n}`, 
          res: `{\n  "ok": true\n}` 
        }
      ]
    }
  ];

  const filteredEndpoints = API_ENDPOINTS.map(grp => ({
    ...grp,
    items: grp.items.filter(item => 
      !searchQuery || 
      item.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.method.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(grp => grp.items.length > 0);

  // Generate code snippet
  const generateSnippet = (method: string, path: string, body?: string) => {
    const origin = window.location.origin;
    if (selectedLang === "curl") {
      let cmd = `curl -X ${method} "${origin}${path}" \\\n  -H "Authorization: Bearer YOUR_JWT_TOKEN"`;
      if (body) {
        cmd += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${body.replace(/\n\s*/g, " ")}'`;
      }
      return cmd;
    }
    if (selectedLang === "fetch") {
      let code = `const res = await fetch("${origin}${path}", {\n  method: "${method}",\n  headers: {\n    "Authorization": "Bearer " + token,\n    "Content-Type": "application/json"\n  }`;
      if (body) {
        code += `,\n  body: JSON.stringify(${body})`;
      }
      code += `\n});\nconst data = await res.json();\nconsole.log(data);`;
      return code;
    }
    if (selectedLang === "python") {
      let py = `import requests\n\nurl = "${origin}${path}"\nheaders = {\n    "Authorization": "Bearer YOUR_JWT_TOKEN",\n    "Content-Type": "application/json"\n}\n`;
      if (body) {
        py += `payload = ${body}\nres = requests.${method.toLowerCase()}(url, json=payload, headers=headers)\n`;
      } else {
        py += `res = requests.${method.toLowerCase()}(url, headers=headers)\n`;
      }
      py += `print(res.json())`;
      return py;
    }
    return "";
  };

  return (
    <div className="space-y-6">
      
      {/* ── Top Header Banner ── */}
      <div className="bg-gradient-to-r from-[var(--color-ink-1)] to-[var(--color-ink-2)] border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[var(--color-accent)]/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 text-[var(--color-accent)] rounded-full text-xs font-semibold mb-3">
            <BookOpen size={13} />
            <span>Documentación Técnica &amp; Arquitectura</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            Manual Completo y Referencia del Sistema
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Consola interactiva de APIs, especificaciones de arquitectura, motores de scraping híbridos, esquemas DDL de MySQL y flujos de ejecución.
          </p>
        </div>

        {/* Category Navigation Pills */}
        <div className="flex overflow-x-auto no-scrollbar touch-scroll gap-2 mt-6 pt-6 border-t border-white/5 pb-1">
          {[
            { key: "overview", label: "Arquitectura", icon: <Layers size={14} /> },
            { key: "apis", label: "Consola & APIs REST", icon: <Code2 size={14} /> },
            { key: "scraper", label: "Motor de Scraping", icon: <Zap size={14} /> },
            { key: "database", label: "Esquema MySQL DDL", icon: <Database size={14} /> },
            { key: "whatsapp", label: "WhatsApp & Scheduler", icon: <Smartphone size={14} /> },
            { key: "security", label: "Seguridad & Zero-Trust", icon: <Shield size={14} /> },
            { key: "deployment", label: "Entorno & Despliegue", icon: <Server size={14} /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeCategory === tab.key
                  ? "bg-[var(--color-accent)] text-black shadow-[0_0_12px_rgba(57,255,136,0.25)]"
                  : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── SECTION 1: ARCHITECTURE OVERVIEW ── */}
      {activeCategory === "overview" && (
        <div className="space-y-6">
          
          {/* Tech Stack Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-5 hover:border-[var(--color-accent)]/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-4">
                <Cpu size={20} />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Runtime Bun 1.3+</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">
                Motor nativo en Zig/C++. Compila y ejecuta TypeScript instantáneamente sin transpilación. Servidor HTTP de bajísima latencia con <code className="text-white font-mono">Bun.serve</code>.
              </p>
              <div className="text-[11px] font-mono text-gray-500">
                Punto de entrada: <span className="text-[var(--color-accent)]">src/server/index.ts</span>
              </div>
            </div>

            <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-5 hover:border-[var(--color-accent)]/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                <Code2 size={20} />
              </div>
              <h3 className="text-base font-bold text-white mb-1">React 19 &amp; Tailwind v4</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">
                Interfaz reactiva fluida. Gráficas con Recharts y Canvas nativo. Sincronización entre pestañas en tiempo real vía <code className="text-white font-mono">BroadcastChannel</code>.
              </p>
              <div className="text-[11px] font-mono text-gray-500">
                Entrada SPA: <span className="text-[var(--color-accent)]">src/client/App.tsx</span>
              </div>
            </div>

            <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-5 hover:border-[var(--color-accent)]/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <Database size={20} />
              </div>
              <h3 className="text-base font-bold text-white mb-1">MySQL 8 &amp; Connection Pool</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">
                Almacenamiento relacional con <code className="text-white font-mono">mysql2/promise</code>, transacciones ACID, auto-migración de esquema y caché en memoria multinivel.
              </p>
              <div className="text-[11px] font-mono text-gray-500">
                Gestor de DB: <span className="text-[var(--color-accent)]">src/server/db.ts</span>
              </div>
            </div>

          </div>

          {/* Visual Architecture Diagrams */}
          <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-[var(--color-accent)]" />
              Diagramas de Flujo del Sistema
            </h3>

            {/* Flow 1 */}
            <div className="bg-black/30 p-5 rounded-xl border border-white/5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-accent)] uppercase font-mono">
                <span>Flujo 1</span> · Ingestión &amp; Cotización de Inversiones
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs font-mono text-center">
                <div className="bg-black/60 p-3 rounded-lg border border-white/10 flex flex-col justify-center">
                  <span className="text-white font-bold">1. Cliente</span>
                  <span className="text-gray-400 text-[10px]">Añade ISIN + títulos</span>
                </div>
                <div className="hidden sm:flex items-center justify-center text-gray-500">➔</div>
                <div className="bg-black/60 p-3 rounded-lg border border-white/10 flex flex-col justify-center">
                  <span className="text-blue-400 font-bold">2. Sentinel Engine</span>
                  <span className="text-gray-400 text-[10px]">Mapea Yahoo / QueFondos</span>
                </div>
                <div className="hidden sm:flex items-center justify-center text-gray-500">➔</div>
                <div className="bg-black/60 p-3 rounded-lg border border-white/10 flex flex-col justify-center">
                  <span className="text-emerald-400 font-bold">3. Base de Datos</span>
                  <span className="text-gray-400 text-[10px]">Caché + Cálculo PnL</span>
                </div>
              </div>
            </div>

            {/* Flow 2 */}
            <div className="bg-black/30 p-5 rounded-xl border border-white/5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase font-mono">
                <span>Flujo 2</span> · Pipeline de Notificaciones WhatsApp Diarias
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs font-mono text-center">
                <div className="bg-black/60 p-3 rounded-lg border border-white/10 flex flex-col justify-center">
                  <span className="text-white font-bold">1. Cron / Timer</span>
                  <span className="text-gray-400 text-[10px]">Trigger horario (0-23h)</span>
                </div>
                <div className="hidden sm:flex items-center justify-center text-gray-500">➔</div>
                <div className="bg-black/60 p-3 rounded-lg border border-white/10 flex flex-col justify-center">
                  <span className="text-amber-400 font-bold">2. Digest Generator</span>
                  <span className="text-gray-400 text-[10px]">Calcula deltas y totales</span>
                </div>
                <div className="hidden sm:flex items-center justify-center text-gray-500">➔</div>
                <div className="bg-black/60 p-3 rounded-lg border border-white/10 flex flex-col justify-center">
                  <span className="text-emerald-400 font-bold">3. CallMeBot API</span>
                  <span className="text-gray-400 text-[10px]">Entrega en WhatsApp</span>
                </div>
              </div>
            </div>

          </div>

          {/* Directory Map */}
          <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <FolderTree size={16} className="text-[var(--color-accent)]" />
              Estructura de Ficheros y Responsabilidades
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2 text-gray-300">
                <div className="text-[var(--color-accent)] font-bold">// Backend (src/server/)</div>
                <div>📁 <span className="text-white font-semibold">src/server/</span></div>
                <div className="pl-4">├── <span className="text-amber-300">index.ts</span> (Servidor HTTP, enrutador REST, rate limit y CSP)</div>
                <div className="pl-4">├── <span className="text-amber-300">db.ts</span> (Conexión MySQL, queries preparadas y schema)</div>
                <div className="pl-4">├── <span className="text-amber-300">auth.ts</span> (JWT HMAC-SHA256, Bcrypt, OAuth Google &amp; GitHub)</div>
                <div className="pl-4">├── <span className="text-amber-300">sentinel.ts</span> (Cálculo de cartera, PnL agregado y valoración)</div>
                <div className="pl-4">├── <span className="text-amber-300">yahoo.ts</span> (Integración Yahoo Finance v8 para ETFs)</div>
                <div className="pl-4">├── <span className="text-amber-300">quefondos.ts</span> (Scraper DOM de fondos españoles con NAV)</div>
                <div className="pl-4">├── <span className="text-amber-300">metadata.ts</span> (Enriquecimiento TER, sectores y top holdings)</div>
                <div className="pl-4">├── <span className="text-amber-300">whatsapp.ts</span> (Llamadas HTTPS a CallMeBot)</div>
                <div className="pl-4">├── <span className="text-amber-300">digest.ts</span> (Formateador de resúmenes WhatsApp)</div>
                <div className="pl-4">└── <span className="text-amber-300">admin.ts</span> (Métricas ejecutivas y gestión de catálogo)</div>
              </div>

              <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2 text-gray-300">
                <div className="text-[var(--color-accent)] font-bold">// Frontend (src/client/)</div>
                <div>📁 <span className="text-client font-semibold">src/client/</span></div>
                <div className="pl-4">├── <span className="text-sky-300">main.tsx</span> (Montaje React 19 en DOM)</div>
                <div className="pl-4">├── <span className="text-sky-300">App.tsx</span> (Control de rutas y sesión cliente)</div>
                <div className="pl-4">├── <span className="text-sky-300">api.ts</span> (Cliente SDK HTTP con tipos TypeScript)</div>
                <div className="pl-4">├── <span className="text-sky-300">theme.ts</span> (Gestor de tema Blanco / Oscuro)</div>
                <div className="pl-4">└── 📁 <span className="text-sky-300">components/</span></div>
                <div className="pl-8">├── <span className="text-gray-400">UserDashboard.tsx</span> (Panel de cartera e inversiones)</div>
                <div className="pl-8">├── <span className="text-gray-400">AdminPanel.tsx</span> (Consola de administración global)</div>
                <div className="pl-8">├── <span className="text-gray-400">DocsTab.tsx</span> (Este módulo de documentación)</div>
                <div className="pl-8">├── <span className="text-gray-400">FundCard.tsx</span> (Ficha interactiva de activo)</div>
                <div className="pl-8">├── <span className="text-gray-400">LoginPage.tsx</span> (Formulario de login)</div>
                <div className="pl-8">└── <span className="text-gray-400">RegisterPage.tsx</span> (Formulario de registro)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 2: INTERACTIVE LIVE API CONSOLE & REFERENCE ── */}
      {activeCategory === "apis" && (
        <div className="space-y-6">
          
          {/* Interactive Live Sandbox */}
          <div className="bg-[var(--color-ink-1)] border border-[var(--color-accent)]/30 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Play size={16} className="text-[var(--color-accent)]" />
                <span>Consola Interactiva de Pruebas en Vivo (Live Sandbox)</span>
              </div>
              <span className="text-[11px] font-mono text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2.5 py-1 rounded-full font-bold">
                Sesión Activa
              </span>
            </div>
            
            <p className="text-xs text-gray-400 mb-4">
              Selecciona cualquier endpoint para ejecutarlo directamente contra el servidor con tus credenciales actuales:
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <select
                value={selectedEndpoint}
                onChange={(e) => setSelectedEndpoint(e.target.value)}
                className="bg-black/50 border border-white/15 text-white text-xs px-3 py-2.5 rounded-xl outline-none focus:border-[var(--color-accent)] font-mono flex-1"
              >
                <option value="/api/portfolio">GET /api/portfolio (Cartera del usuario)</option>
                <option value="/api/auth/me">GET /api/auth/me (Perfil actual)</option>
                <option value="/api/whatsapp/config">GET /api/whatsapp/config (Config WhatsApp)</option>
                <option value="/api/notify/preview">GET /api/notify/preview (Preview del informe)</option>
                <option value="/api/admin/overview">GET /api/admin/overview (Métricas de Admin)</option>
                <option value="/api/search?q=Ibercaja">GET /api/search?q=Ibercaja (Búsqueda en catálogo)</option>
                <option value="/api/banks">GET /api/banks (Entidades bancarias)</option>
                <option value="/api/health">GET /api/health (Estado del servidor)</option>
              </select>

              <button
                onClick={() => runLiveTest(selectedEndpoint)}
                disabled={consoleLoading}
                className="px-5 py-2.5 bg-[var(--color-accent)] text-black font-bold text-xs rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(57,255,136,0.3)] disabled:opacity-50"
              >
                {consoleLoading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                <span>{consoleLoading ? "Ejecutando..." : "Ejecutar Petición"}</span>
              </button>
            </div>

            {/* Console Output */}
            {consoleStatus && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      consoleStatus.code >= 200 && consoleStatus.code < 300 
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}>
                      {consoleStatus.code} {consoleStatus.text}
                    </span>
                    <span className="text-gray-400">{consoleStatus.ms} ms</span>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(JSON.stringify(consoleResponse, null, 2), "live-res")}
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                  >
                    {copiedCode === "live-res" ? <Check size={12} className="text-[var(--color-accent)]" /> : <Copy size={12} />}
                    <span>{copiedCode === "live-res" ? "Copiado" : "Copiar Resultado"}</span>
                  </button>
                </div>

                <pre className="bg-black/80 p-4 rounded-xl text-xs font-mono text-emerald-400/90 overflow-x-auto border border-white/10 max-h-60 scrollbar-thin">
                  {JSON.stringify(consoleResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar por endpoint, método o descripción (ej: portfolio, login, ISIN)..."
              className="w-full bg-[var(--color-ink-1)] border border-white/10 focus:border-[var(--color-accent)] text-white text-xs pl-11 pr-4 py-3 rounded-xl outline-none transition-all placeholder:text-gray-500"
            />
          </div>

          {/* Snippet Language Selector */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Referencia Completa de Endpoints</h3>
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
              {(["curl", "fetch", "python"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                    selectedLang === lang 
                      ? "bg-[var(--color-accent)] text-black font-bold" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Endpoints List */}
          <div className="space-y-8">
            {filteredEndpoints.map((group, gIdx) => (
              <div key={gIdx} className="space-y-4">
                <h4 className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-wider border-b border-white/5 pb-2">
                  {group.group}
                </h4>

                <div className="space-y-4">
                  {group.items.map((ep, epIdx) => {
                    const snippetId = `ep-${gIdx}-${epIdx}`;
                    const codeSnippet = generateSnippet(ep.method, ep.path, ep.body);

                    return (
                      <div key={epIdx} className="bg-[var(--color-ink-1)] border border-white/5 rounded-xl p-5 space-y-3 hover:border-white/15 transition-all">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className={`px-2.5 py-0.5 rounded font-mono text-[11px] font-bold ${
                              ep.method === "GET" ? "bg-blue-500/15 text-blue-400 border border-blue-500/30" :
                              ep.method === "POST" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" :
                              ep.method === "PUT" ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" :
                              "bg-red-500/15 text-red-400 border border-red-500/30"
                            }`}>
                              {ep.method}
                            </span>
                            <code className="text-sm font-mono font-bold text-white">{ep.path}</code>
                          </div>

                          {ep.auth && (
                            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-white/5 text-gray-300 border border-white/10 flex items-center gap-1.5">
                              <Lock size={12} className="text-amber-400" />
                              {typeof ep.auth === "string" ? ep.auth : "JWT Bearer"}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-300 leading-relaxed">{ep.desc}</p>

                        {/* Code Snippet Box */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                            <span>Código de Ejemplo ({selectedLang.toUpperCase()})</span>
                            <button 
                              onClick={() => copyToClipboard(codeSnippet, snippetId)}
                              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                            >
                              {copiedCode === snippetId ? <Check size={11} className="text-[var(--color-accent)]" /> : <Copy size={11} />}
                              <span>{copiedCode === snippetId ? "Copiado" : "Copiar"}</span>
                            </button>
                          </div>
                          <pre className="bg-black/60 p-3.5 rounded-xl text-[11px] font-mono text-gray-300 overflow-x-auto border border-white/5 scrollbar-thin">
                            {codeSnippet}
                          </pre>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 3: QUOTES & SCRAPING ENGINE ── */}
      {activeCategory === "scraper" && (
        <div className="space-y-6">
          <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Zap size={18} className="text-[var(--color-accent)]" />
                Motor de Cotizaciones &amp; Scraping Híbrido
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                FondTracker implementa una arquitectura dual de extracción de datos financieros que garantiza sincronización en tiempo real sin coste de APIs de pago.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Yahoo */}
              <div className="bg-black/30 border border-white/5 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-blue-400">
                  <Globe size={16} />
                  <span>Motor 1: Yahoo Finance v8 API (<code className="text-xs font-mono text-white">src/server/yahoo.ts</code>)</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Orientado a ETFs y fondos internacionales indexados.
                </p>
                <div className="bg-black/60 p-3 rounded-lg text-[11px] font-mono text-blue-300 border border-white/5">
                  GET https://query1.finance.yahoo.com/v8/finance/chart/{'{ticker}'}?range={'{range}'}&amp;interval=1d
                </div>
                <ul className="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                  <li>Resolución inteligente de ticker a partir del código ISIN en base de datos.</li>
                  <li>Soporte de sufijos bursátiles: <code className="text-white">.MC</code> (BME), <code className="text-white">.DE</code> (Xetra), <code className="text-white">.AS</code> (Amsterdam), <code className="text-white">.F</code> (Frankfurt).</li>
                  <li>Generación de series temporales de velas con OHLCV para gráficas de 1M hasta MAX.</li>
                </ul>
              </div>

              {/* QueFondos */}
              <div className="bg-black/30 border border-white/5 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
                  <Search size={16} />
                  <span>Motor 2: QueFondos DOM Scraper (<code className="text-xs font-mono text-white">src/server/quefondos.ts</code>)</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Orientado a fondos mutuos de banca española (Santander, BBVA, Caixabank, Ibercaja, Kutxabank, etc.).
                </p>
                <div className="bg-black/60 p-3 rounded-lg text-[11px] font-mono text-amber-300 border border-white/5">
                  GET https://www.quefondos.com/es/fondos/ficha/index.html?isin={'{ISIN}'}
                </div>
                <ul className="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                  <li>Protección anti-SSRF y validación estricta de IPs de destino.</li>
                  <li>Extracción robusta del Valor Liquidativo (NAV) y fecha oficial mediante expresiones regulares DoS-safe.</li>
                  <li>Detección de datos desactualizados (&gt;3 días hábiles) con alerta visual en la UI.</li>
                </ul>
              </div>

            </div>

            {/* Cache Strategy */}
            <div className="bg-black/40 p-5 rounded-xl border border-white/5 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <RefreshCw size={14} className="text-[var(--color-accent)]" />
                Política de Caché &amp; Resiliencia Offline
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-300">
                <div className="bg-black/50 p-3 rounded-lg border border-white/5">
                  <div className="font-bold text-white mb-1">1. Caché RAM (5 min)</div>
                  <p className="text-gray-400 text-[11px]">Evita llamadas redundantes a Yahoo/QueFondos en peticiones sucesivas.</p>
                </div>
                <div className="bg-black/50 p-3 rounded-lg border border-white/5">
                  <div className="font-bold text-white mb-1">2. Caché DB MySQL</div>
                  <p className="text-gray-400 text-[11px]">Guarda el último valor conocido. Si los proveedores fallan, la app sigue operativa.</p>
                </div>
                <div className="bg-black/50 p-3 rounded-lg border border-white/5">
                  <div className="font-bold text-white mb-1">3. Invalidación Admin</div>
                  <p className="text-gray-400 text-[11px]">Los administradores pueden vaciar la caché de cualquier activo con 1 clic.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 4: DATABASE DDL SCHEMA ── */}
      {activeCategory === "database" && (
        <div className="space-y-6">
          <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Database size={18} className="text-[var(--color-accent)]" />
                Esquema de Base de Datos MySQL &amp; DDL
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Estructura de tablas relacionales con soporte para soft-deletes, índices de rendimiento y tipos numéricos de alta precisión (<code className="text-white font-mono">DECIMAL(14,4)</code>).
              </p>
            </div>

            {/* DDL SQL Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                <span>schema.sql (Sentencias DDL Idempotentes)</span>
                <button 
                  onClick={() => copyToClipboard(SQL_SCHEMA_CODE, "sql-schema")}
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  {copiedCode === "sql-schema" ? <Check size={12} className="text-[var(--color-accent)]" /> : <Copy size={12} />}
                  <span>{copiedCode === "sql-schema" ? "Copiado" : "Copiar SQL"}</span>
                </button>
              </div>

              <pre className="bg-black/70 p-4 rounded-xl text-xs font-mono text-sky-300 overflow-x-auto border border-white/10 max-h-96 scrollbar-thin">
                {SQL_SCHEMA_CODE}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 5: WHATSAPP NOTIFICATION SYSTEM ── */}
      {activeCategory === "whatsapp" && (
        <div className="space-y-6">
          <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Smartphone size={18} className="text-[var(--color-accent)]" />
                Arquitectura de Notificaciones WhatsApp &amp; Cron
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Permite a los usuarios recibir automáticamente su patrimonio neto, ganancias acumuladas y deltas diarios directamente en WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-black/30 border border-white/5 rounded-xl p-5 space-y-3">
                <h4 className="text-sm font-bold text-white">CallMeBot Integration Flow</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Las notificaciones se transmiten mediante peticiones HTTP seguras hacia la pasarela CallMeBot:
                </p>
                <div className="bg-black/60 p-3 rounded-lg text-[11px] font-mono text-emerald-400 border border-white/5">
                  https://api.callmebot.com/whatsapp.php?phone=+34...&amp;text=...&amp;apikey=...
                </div>
                <ul className="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                  <li>Escapado seguro de caracteres especiales (espacios, saltos de línea, asteriscos).</li>
                  <li>División inteligente de mensajes (chunking) si la cartera supera el límite de longitud de WhatsApp.</li>
                  <li>Reintentos automáticos en caso de fallo temporal de red.</li>
                </ul>
              </div>

              <div className="bg-black/30 border border-white/5 rounded-xl p-5 space-y-3">
                <h4 className="text-sm font-bold text-white">Scheduler Interno &amp; Disparador Externo</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  El servidor incluye un planificador en memoria que evalúa cada hora si algún usuario tiene programada una notificación para ese tramo. Para servidores serverless o plataformas con sleep (Render, Railway), se expone el endpoint:
                </p>
                <div className="bg-black/60 p-3 rounded-lg text-[11px] font-mono text-amber-300 border border-white/5">
                  POST /api/digest/trigger (Header: x-cron-secret: $CRON_SECRET)
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 6: SECURITY & ZERO-TRUST ── */}
      {activeCategory === "security" && (
        <div className="space-y-6">
          <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Shield size={18} className="text-[var(--color-accent)]" />
                Medidas de Seguridad &amp; Aislamiento Multi-Inquilino
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Diseño defensivo en profundidad para garantizar que los datos financieros de cada usuario estén 100% aislados y protegidos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="bg-black/30 border border-white/5 rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <Key size={15} />
                  <span>Aislamiento SQL Estricto</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Todas las consultas de cartera, fondos y configuración inyectan forzosamente <code className="text-white font-mono">WHERE user_id = ?</code>. Es matemáticamente imposible acceder a inversiones de otro usuario.
                </p>
              </div>

              <div className="bg-black/30 border border-white/5 rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                  <Lock size={15} />
                  <span>CSP con Nonces Criptográficos</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Headers <code className="text-white font-mono">Content-Security-Policy</code> estrictos generados dinámicamente con nonces criptográficos por petición, mitigando ataques de Cross-Site Scripting (XSS).
                </p>
              </div>

              <div className="bg-black/30 border border-white/5 rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <Sliders size={15} />
                  <span>Rate Limiting &amp; SSRF Guard</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Limitador de peticiones por IP en memoria (<code className="text-white font-mono">rateLimitMap</code>) contra ataques de fuerza bruta y validación de DNS para prevenir conexiones a redes internas privadas.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 7: DEPLOYMENT & ENVIRONMENT ── */}
      {activeCategory === "deployment" && (
        <div className="space-y-6">
          <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Server size={18} className="text-[var(--color-accent)]" />
                Variables de Entorno &amp; Guía de Despliegue
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Configuración completa requerida para desplegar FondTracker en cualquier servidor local, VPS o plataforma cloud (Render, Railway, Fly.io).
              </p>
            </div>

            {/* Env Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400">
                    <th className="pb-2 font-medium">Variable</th>
                    <th className="pb-2 font-medium">Obligatoria</th>
                    <th className="pb-2 font-medium">Descripción</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300 divide-y divide-white/5">
                  <tr><td className="py-2 text-[var(--color-accent)]">PORT</td><td>No (Default 3741)</td><td>Puerto TCP en el que escucha el servidor</td></tr>
                  <tr><td className="py-2 text-[var(--color-accent)]">MYSQL_HOST</td><td>Sí</td><td>Host de la base de datos (ej: 127.0.0.1 o host remoto)</td></tr>
                  <tr><td className="py-2 text-[var(--color-accent)]">MYSQL_PORT</td><td>No (Default 3306)</td><td>Puerto de MySQL</td></tr>
                  <tr><td className="py-2 text-[var(--color-accent)]">MYSQL_USER</td><td>Sí</td><td>Usuario de base de datos con permisos CRUD</td></tr>
                  <tr><td className="py-2 text-[var(--color-accent)]">MYSQL_PASSWORD</td><td>Sí</td><td>Contraseña del usuario MySQL</td></tr>
                  <tr><td className="py-2 text-[var(--color-accent)]">MYSQL_DATABASE</td><td>Sí</td><td>Nombre de la base de datos (ej: fondtracker)</td></tr>
                  <tr><td className="py-2 text-[var(--color-accent)]">JWT_SECRET</td><td>Sí</td><td>Clave secreta criptográfica para firmar tokens JWT</td></tr>
                  <tr><td className="py-2 text-[var(--color-accent)]">CRON_SECRET</td><td>Sí</td><td>Clave compartida para ejecutar /api/digest/trigger desde crons externos</td></tr>
                  <tr><td className="py-2 text-[var(--color-accent)]">GOOGLE_CLIENT_ID</td><td>Opcional</td><td>ID de cliente OAuth de Google Console</td></tr>
                  <tr><td className="py-2 text-[var(--color-accent)]">GOOGLE_CLIENT_SECRET</td><td>Opcional</td><td>Secret OAuth de Google Console</td></tr>
                  <tr><td className="py-2 text-[var(--color-accent)]">GITHUB_CLIENT_ID</td><td>Opcional</td><td>ID de cliente OAuth de GitHub Developers</td></tr>
                  <tr><td className="py-2 text-[var(--color-accent)]">GITHUB_CLIENT_SECRET</td><td>Opcional</td><td>Secret OAuth de GitHub Developers</td></tr>
                </tbody>
              </table>
            </div>

            {/* CLI Commands */}
            <div className="space-y-2 pt-4 border-t border-white/5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Comandos CLI Habituales (Bun)</h4>
              <div className="bg-black/60 p-4 rounded-xl text-xs font-mono text-gray-300 space-y-2 border border-white/5">
                <div><span className="text-gray-500"># Iniciar en desarrollo:</span> <span className="text-[var(--color-accent)]">bun run src/server/index.ts</span></div>
                <div><span className="text-gray-500"># Construir bundle de producción:</span> <span className="text-[var(--color-accent)]">bun run build</span></div>
                <div><span className="text-gray-500"># Ejecutar suite de pruebas:</span> <span className="text-[var(--color-accent)]">bun test</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const SQL_SCHEMA_CODE = `-- ─── FondTracker MySQL Relational Schema ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NULL,
  is_admin BOOLEAN NOT NULL DEFAULT 0,
  auth_provider VARCHAR(20) NOT NULL DEFAULT 'local',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_users_email (email),
  INDEX idx_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS investments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  isin VARCHAR(12) NOT NULL,
  shares DECIMAL(14,4) NOT NULL,
  purchase_price DECIMAL(14,4) NOT NULL,
  purchase_date DATE NOT NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_investments_user (user_id),
  INDEX idx_investments_isin (isin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fund_catalog (
  isin VARCHAR(12) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  bank VARCHAR(100) NULL,
  category VARCHAR(100) NULL,
  risk_level INT NULL,
  yahoo_ticker VARCHAR(50) NULL,
  ter DECIMAL(5,2) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_catalog_bank (bank),
  INDEX idx_catalog_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS price_cache (
  isin VARCHAR(12) PRIMARY KEY,
  price DECIMAL(14,4) NOT NULL,
  change_pct DECIMAL(8,4) NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
  market_date VARCHAR(20) NULL,
  data_source VARCHAR(20) NOT NULL DEFAULT 'quefondos',
  cached_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_price_cached_at (cached_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  \`key\` VARCHAR(100) PRIMARY KEY,
  \`value\` TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
