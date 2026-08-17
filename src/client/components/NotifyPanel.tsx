import React, { useEffect, useState } from "react";
import { api, type Status } from "../api";
import { formatRelative } from "../utils";
import { COUNTRIES } from "./RegisterPage";
import { 
  Smartphone, Bell, Clock, Send, Eye, EyeOff, Check, AlertCircle, 
  Settings, CheckCircle2, ShieldCheck, CheckCheck, RefreshCw, Key, 
  ExternalLink, Sparkles, X, ChevronRight, Zap, Play, MessageSquare,
  Sliders, ArrowRight, Shield, AlertTriangle
} from "lucide-react";

type Props = {
  status: Status | null;
  onChange: () => void | Promise<void>;
};

export function NotifyPanel({ status, onChange }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Configuration form state
  const wa = status?.whatsapp;
  const [apiKey, setApiKey] = useState(wa?.api_key || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState(() => {
    if (wa?.phone) {
      const match = COUNTRIES.slice().sort((a, b) => b.dial.length - a.dial.length).find(c => wa.phone!.startsWith(c.dial));
      if (match) return match;
    }
    return COUNTRIES.find(c => c.code === "ES") ?? COUNTRIES[0];
  });
  const [localNumber, setLocalNumber] = useState(() => {
    if (wa?.phone) {
      const match = COUNTRIES.slice().sort((a, b) => b.dial.length - a.dial.length).find(c => wa.phone!.startsWith(c.dial));
      return match ? wa.phone.slice(match.dial.length) : wa.phone;
    }
    return "";
  });
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [selectedHours, setSelectedHours] = useState<number[]>(wa?.hours || [9, 18]);
  const [digestMode, setDigestMode] = useState<"full" | "summary">("full");
  const [isEnabled, setIsEnabled] = useState<boolean>(wa?.enabled ?? true);

  // Sync when status updates
  useEffect(() => {
    if (wa?.hours) setSelectedHours(wa.hours);
    if (wa?.enabled !== undefined) setIsEnabled(wa.enabled);
    if (wa?.api_key) setApiKey(wa.api_key);
  }, [wa]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(t);
  }, [feedback]);

  const loadPreview = async () => {
    setLoadingPreview(true);
    try {
      const res = await api.whatsapp.preview();
      setPreview(res.message);
    } catch {
      setPreview("╔══ *FONDTRACKER* ═══════╗\n║ 📊 *Resumen Diario de Cartera*\n║ " + new Date().toLocaleDateString('es-ES') + "\n╚════════════════════════╝\n\n💰 *Total Cartera:* €124,562 (+1.24%)\n📈 *Plusvalía Neta:* +€1,520\n\n🔹 *Tus Posiciones:*\n• Vanguard S&P 500: +1.8%\n• Ibercaja Renta Fija: +0.4%\n\n_FondTracker Auto-Digest_");
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    loadPreview();
  }, [status?.fund_count]);

  const toggleHour = (hour: number) => {
    if (selectedHours.includes(hour)) {
      if (selectedHours.length > 1) {
        setSelectedHours(selectedHours.filter((h) => h !== hour));
      } else {
        setFeedback({ kind: "err", text: "Debes mantener al menos una hora seleccionada" });
      }
    } else {
      setSelectedHours([...selectedHours, hour].sort((a, b) => a - b));
    }
  };

  const handleSaveConfig = async () => {
    const cleanNumber = localNumber.replace(/\D/g, "");
    if (!cleanNumber) {
      setFeedback({ kind: "err", text: "Introduce un número de teléfono válido" });
      return;
    }
    const fullPhone = `${phoneCountry.dial}${cleanNumber}`;
    setSaving(true);
    setFeedback(null);

    try {
      await api.whatsapp.saveConfig({
        phone: fullPhone,
        api_key: apiKey.trim(),
        hours: selectedHours,
        timezone: "Europe/Madrid",
        enabled: isEnabled,
      });
      setFeedback({ kind: "ok", text: "Configuración de WhatsApp guardada con éxito" });
      await onChange();
    } catch (err: any) {
      setFeedback({ kind: "err", text: err.message || "Error al guardar configuración" });
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await api.whatsapp.test();
      setTestResult({ ok: true, message: "¡Mensaje de prueba enviado con éxito a tu WhatsApp!" });
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message || "Error al enviar mensaje. Verifica tu número y API Key de CallMeBot." });
    } finally {
      setTesting(false);
    }
  };

  // Next run calculation
  const nextRunText = () => {
    if (!selectedHours.length || !isEnabled) return "Inactivo";
    const currentHour = new Date(now).getHours();
    const sorted = [...selectedHours].sort((a, b) => a - b);
    const nextH = sorted.find(h => h > currentHour) ?? sorted[0];
    const isToday = sorted.some(h => h > currentHour);
    return `${isToday ? "Hoy" : "Mañana"} a las ${String(nextH).padStart(2, '0')}:00`;
  };

  return (
    <div className="space-y-6">
      
      {/* ── Top Status Banner ── */}
      <div className="bg-gradient-to-r from-[var(--color-ink-1)] to-[var(--color-ink-2)] border border-white/10 rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[var(--color-accent)]/5 rounded-full blur-[90px] pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(57,255,136,0.15)]">
                <Smartphone size={18} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  Bot de Alertas &amp; Resúmenes Diarios por WhatsApp
                </h2>
                <p className="text-xs text-gray-400">
                  Recibe automáticamente el valor de tu patrimonio, ganancias del día y rentabilidades sin abrir la app
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-mono">
              <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl">
                <span className={`w-2.5 h-2.5 rounded-full ${isEnabled && wa?.configured ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_#39ff88]" : "bg-gray-500"}`} />
                <span className="text-gray-300 font-medium">
                  Estado: <strong className={isEnabled && wa?.configured ? "text-emerald-400" : "text-gray-400"}>{isEnabled && wa?.configured ? "Activo" : "Pendiente de configurar"}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl">
                <Clock size={13} className="text-[var(--color-accent)]" />
                <span className="text-gray-300">
                  Próximo Envío: <strong className="text-white">{nextRunText()}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={handleTestNotification}
              disabled={testing || !wa?.configured}
              className="px-4 py-2.5 bg-[var(--color-accent)] text-[#0a0a0c] hover:brightness-110 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(57,255,136,0.25)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              <span>{testing ? "Enviando mensaje..." : "Enviar WhatsApp de Prueba"}</span>
            </button>
          </div>
        </div>

        {/* Alerts & Feedback */}
        {feedback && (
          <div className={`mt-4 p-3.5 rounded-xl text-xs flex items-center gap-2.5 border ${
            feedback.kind === "ok" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            {feedback.kind === "ok" ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
            <span>{feedback.text}</span>
          </div>
        )}

        {testResult && (
          <div className={`mt-4 p-3.5 rounded-xl text-xs flex items-center gap-2.5 border ${
            testResult.ok ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            {testResult.ok ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertTriangle size={16} className="shrink-0" />}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ── Left Column: Configuration & Scheduler ── */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Step 1 & 2: WhatsApp Setup Box */}
          <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings size={16} className="text-[var(--color-accent)]" />
                Configuración del Destinatario &amp; CallMeBot
              </h3>
              <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded text-gray-400">Paso 1 y 2</span>
            </div>

            {/* Step 1 Quick Link CallMeBot */}
            <div className="bg-black/30 border border-emerald-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-400" />
                  ¿Cómo obtener tu clave CallMeBot en 10 segundos?
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Envía el mensaje de autorización por WhatsApp al bot oficial de CallMeBot y te devolverá tu API Key al instante.
                </p>
              </div>
              <a
                href="https://api.whatsapp.com/send?phone=34644719234&text=I%20allow%20callmebot%20to%20send%20me%20messages"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>Abrir Chat de CallMeBot</span>
                <ExternalLink size={12} />
              </a>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Phone Input with Country Code */}
              <div>
                <label className="text-[11px] font-mono uppercase text-gray-400 mb-1.5 block">
                  Teléfono WhatsApp
                </label>
                <div className="flex gap-2 relative">
                  <button
                    type="button"
                    onClick={() => setShowCountryPicker(!showCountryPicker)}
                    className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-2.5 py-2.5 rounded-xl text-xs text-white hover:border-[var(--color-accent)] transition-all shrink-0"
                  >
                    <span>{phoneCountry.flag}</span>
                    <span className="font-mono text-gray-400">{phoneCountry.dial}</span>
                  </button>

                  {showCountryPicker && (
                    <div className="absolute left-0 top-full mt-2 w-64 bg-[var(--color-ink-2)] border border-white/10 rounded-2xl shadow-2xl z-50 p-2 max-h-52 overflow-y-auto">
                      <input
                        type="text"
                        placeholder="Buscar país..."
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 px-2.5 py-1.5 rounded-lg text-xs text-white mb-2 outline-none"
                      />
                      {COUNTRIES.filter(c => !countrySearch || c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.dial.includes(countrySearch)).map(c => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => { setPhoneCountry(c); setShowCountryPicker(false); }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-left hover:bg-white/5 rounded-lg text-gray-300 hover:text-white"
                        >
                          <span>{c.flag}</span>
                          <span className="font-mono text-gray-400 text-[10px] w-10">{c.dial}</span>
                          <span className="truncate">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <input
                    type="tel"
                    value={localNumber}
                    onChange={(e) => setLocalNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="612345678"
                    className="flex-1 bg-black/40 border border-white/10 focus:border-[var(--color-accent)] px-3 py-2.5 rounded-xl text-xs font-mono text-white outline-none transition-all"
                  />
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="text-[11px] font-mono uppercase text-gray-400 mb-1.5 block">
                  API Key CallMeBot
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Ej: 123456"
                    className="w-full bg-black/40 border border-white/10 focus:border-[var(--color-accent)] px-3 py-2.5 pr-9 rounded-xl text-xs font-mono text-white outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showApiKey ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

            </div>

            {/* Schedule Selector */}
            <div className="space-y-3 pt-2">
              <label className="text-[11px] font-mono uppercase text-gray-400 flex items-center justify-between">
                <span>Horas de Envío Diario (Horario España UTC+1/2)</span>
                <span className="text-[var(--color-accent)] font-bold">{selectedHours.length} horas seleccionadas</span>
              </label>

              {/* Preset quick buttons */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Apertura (09:00)", hour: 9 },
                  { label: "Mediodía (14:00)", hour: 14 },
                  { label: "Cierre Europeo (18:00)", hour: 18 },
                  { label: "Cierre Wall Street (22:00)", hour: 22 },
                ].map(p => {
                  const active = selectedHours.includes(p.hour);
                  return (
                    <button
                      key={p.hour}
                      type="button"
                      onClick={() => toggleHour(p.hour)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        active 
                          ? "bg-[var(--color-accent)]/15 border-[var(--color-accent)] text-[var(--color-accent)] font-bold" 
                          : "bg-black/30 border-white/10 text-gray-400 hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {/* 24-hour chips grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-1.5 pt-2">
                {Array.from({ length: 24 }, (_, i) => i).map((h) => {
                  const active = selectedHours.includes(h);
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => toggleHour(h)}
                      className={`py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                        active 
                          ? "bg-[var(--color-accent)] text-black shadow-[0_0_8px_rgba(57,255,136,0.2)]" 
                          : "bg-black/40 text-gray-400 hover:bg-white/5 hover:text-white border border-white/5"
                      }`}
                    >
                      {String(h).padStart(2, '0')}h
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save Button & Toggle */}
            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="rounded accent-[var(--color-accent)] w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-white font-medium">Habilitar envíos automáticos</span>
              </label>

              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 bg-white text-black font-bold text-xs rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {saving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
              </button>
            </div>

          </div>

        </div>

        {/* ── Right Column: Smartphone Live Preview Mockup ── */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare size={16} className="text-emerald-400" />
                Vista Previa en Smartphone (WhatsApp Live)
              </h3>
              <button
                onClick={loadPreview}
                disabled={loadingPreview}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Refrescar vista previa"
              >
                <RefreshCw size={13} className={loadingPreview ? "animate-spin" : ""} />
              </button>
            </div>

            {/* Smartphone Container Mockup */}
            <div className="bg-[#0b141a] border border-[#202c33] rounded-2xl overflow-hidden shadow-2xl">
              
              {/* WhatsApp Chat Header */}
              <div className="bg-[#202c33] px-3.5 py-2.5 flex items-center justify-between border-b border-[#2a3942]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold text-xs shadow-sm">
                    FT
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      <span>FondTracker Bot</span>
                      <CheckCircle2 size={12} className="text-emerald-400 fill-emerald-400 text-black" />
                    </div>
                    <span className="text-[9px] text-[#8696a0]">en línea</span>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-[#8696a0]">
                  CallMeBot
                </div>
              </div>

              {/* Chat Body Bubble */}
              <div className="p-4 bg-[url('https://static.whatsapp.net/rsrc.php/v3/y6/r/wa669ae5z2w.png')] bg-repeat bg-opacity-5 min-h-[280px] flex flex-col justify-end">
                <div className="bg-[#005c4b] text-[#e9edef] p-3 rounded-2xl rounded-tr-none shadow-md max-w-[95%] text-xs font-mono leading-relaxed whitespace-pre-wrap relative border border-[#025144]">
                  {preview || "Cargando formato de mensaje..."}

                  <div className="flex items-center justify-end gap-1 text-[9px] text-[#8696a0] mt-2">
                    <span>{new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    <CheckCheck size={13} className="text-[#53bdeb]" />
                  </div>
                </div>
              </div>

            </div>

            <p className="text-[11px] text-gray-500 text-center mt-3">
              Los mensajes se envían de forma encriptada de extremo a extremo respetando los límites de longitud de WhatsApp.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
