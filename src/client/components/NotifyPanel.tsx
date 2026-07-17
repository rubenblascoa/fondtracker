import { useEffect, useState } from "react";
import { api, type Status } from "../api";
import { formatRelative } from "../utils";
import { COUNTRIES } from "./RegisterPage";

type Props = {
  status: Status | null;
  onChange: () => void | Promise<void>;
};

export function NotifyPanel({ status, onChange }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [feedback, setFeedback] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState(() => COUNTRIES.find(c => c.code === "ES") ?? COUNTRIES[0]);
  const [localNumber, setLocalNumber] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const wa = status?.whatsapp;
  const [selectedHours, setSelectedHours] = useState<number[]>([9, 18]);

  useEffect(() => {
    if (wa?.hours) {
      setSelectedHours(wa.hours);
    }
  }, [wa?.hours]);

  const toggleHour = (hour: number) => {
    if (selectedHours.includes(hour)) {
      if (selectedHours.length > 1) {
        setSelectedHours(selectedHours.filter((h) => h !== hour));
      } else {
        setFeedback({ kind: "err", text: "You must select at least one hour" });
      }
    } else {
      setSelectedHours([...selectedHours, hour].sort((a, b) => a - b));
    }
  };

  useEffect(() => {
    setPreview(null);
  }, [status?.fund_count]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(t);
  }, [feedback]);

  useEffect(() => {
    if (!testResult) return;
    const t = setTimeout(() => setTestResult(null), 5000);
    return () => clearTimeout(t);
  }, [testResult]);

  useEffect(() => {
    if (wa?.phone) {
      const matchingCountry = COUNTRIES.slice().sort((a,b) => b.dial.length - a.dial.length).find(c => wa.phone!.startsWith(c.dial));
      if (matchingCountry) {
        setPhoneCountry(matchingCountry);
        setLocalNumber(wa.phone.slice(matchingCountry.dial.length));
      } else {
        setLocalNumber(wa.phone);
      }
    } else {
      setLocalNumber("");
    }
  }, [wa?.phone]);

  useEffect(() => {
    if (wa?.api_key) {
      setApiKey(wa.api_key);
    } else {
      setApiKey("");
    }
  }, [wa?.api_key]);

  const openConfig = () => {
    setApiKey(wa?.api_key || "");
    setShowConfig(true);
    setFeedback(null);
  };

  const loadPreview = async () => {
    setLoadingPreview(true);
    setFeedback(null);
    try {
      const res = await api.previewDigest();
      setPreview(res.message);
    } catch (err) {
      setFeedback({
        kind: "err",
        text: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const send = async () => {
    setSending(true);
    setFeedback(null);
    try {
      const res = await api.sendDigest();
      setFeedback({
        kind: "ok",
        text: `sent · ${res.sent} message(s)`,
      });
      await onChange();
    } catch (err) {
      setFeedback({
        kind: "err",
        text: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSending(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setFeedback(null);
    try {
      await api.testWhatsApp();
      setTestResult({ ok: true, message: "Test message sent successfully" });
      await onChange();
    } catch (err) {
      setTestResult({
        ok: false,
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setTesting(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const fullPhone = localNumber ? `${phoneCountry.dial}${localNumber}` : "";
      await api.updateWhatsAppConfig({
        api_key: apiKey || undefined,
        phone: fullPhone,
        hours: selectedHours,
      });
      setShowConfig(false);
      setFeedback({ kind: "ok", text: "configuration saved" });
      await onChange();
    } catch (err) {
      setFeedback({
        kind: "err",
        text: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-white/5 bg-black/20 backdrop-blur-sm p-5 slide-up">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              wa?.configured
                ? "bg-[var(--color-accent)]"
                : "bg-[var(--color-fg-4)] pulse-dot"
            }`}
          />
          <span className="font-pixel uppercase text-xs text-[var(--color-fg-1)] tracking-wider">
            automatic alerts
          </span>
          <span className="text-[10px] text-[var(--color-fg-4)]">
            {wa?.configured
              ? `${wa.phone} · ${wa.timezone}`
              : "unconfigured"}
          </span>
        </div>
        {wa?.configured && (
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="font-pixel uppercase text-[10px] tracking-wider px-2 py-1 border border-[var(--color-ink-3)] text-[var(--color-fg-4)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
          >
            {showConfig ? "close" : "config"}
          </button>
        )}
      </div>

      {/* Config Form – shown when not configured, or toggled when configured */}
      {(!wa?.configured || showConfig) && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-4)] mb-1">
                WhatsApp number
              </label>
              <div className="flex gap-2 relative">
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => { setShowCountryPicker(!showCountryPicker); setCountrySearch(""); }}
                    className="flex items-center gap-1.5 bg-black/40 border border-white/10 hover:border-white/20 text-white text-[11px] px-2.5 py-1.5 rounded-sm outline-none transition-all min-w-[76px] h-full"
                  >
                    <span className="text-sm leading-none">{phoneCountry.flag}</span>
                    <span className="font-mono text-[10px]">{phoneCountry.dial}</span>
                    <svg className={`w-2 h-2 text-[var(--color-fg-4)] transition-transform ${showCountryPicker ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showCountryPicker && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowCountryPicker(false)} />
                      <div className="absolute top-full left-0 mt-1.5 z-50 w-60 bg-[#0d0d0f]/95 backdrop-blur-xl border border-white/10 rounded-md shadow-2xl overflow-hidden">
                        <div className="p-2 border-b border-white/5">
                          <input
                            type="text"
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            placeholder="Search..."
                            className="w-full bg-black/60 border border-white/5 rounded px-2 py-1 text-xs text-white placeholder:text-[var(--color-fg-4)] outline-none focus:border-[var(--color-accent)]/50"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-40 overflow-y-auto font-sans">
                          {COUNTRIES.filter(c =>
                            !countrySearch ||
                            c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                            c.dial.includes(countrySearch) ||
                            c.code.toLowerCase().includes(countrySearch.toLowerCase())
                          ).map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => { setPhoneCountry(c); setShowCountryPicker(false); }}
                              className={`flex items-center gap-2 w-full px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-white/5 ${phoneCountry.code === c.code ? "bg-white/5 text-white" : "text-[var(--color-fg-2)]"}`}
                            >
                              <span>{c.flag}</span>
                              <span className="font-mono text-[10px] text-[var(--color-fg-4)] w-10">{c.dial}</span>
                              <span className="truncate flex-1 text-left">{c.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <input
                  type="tel"
                  value={localNumber}
                  onChange={(e) => setLocalNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="612345678"
                  className="flex-1 bg-[var(--color-ink-0)] border border-[var(--color-ink-3)] px-2.5 py-1.5 text-xs font-mono text-[var(--color-fg-2)] placeholder-[var(--color-fg-4)] focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-4)] mb-1">
                API key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={wa?.configured ? "••••••••••••••••" : "your_api_key"}
                  className="w-full bg-[var(--color-ink-0)] border border-[var(--color-ink-3)] pl-2.5 pr-9 py-1.5 text-xs font-mono text-[var(--color-fg-2)] placeholder-[var(--color-fg-4)] focus:outline-none focus:border-[var(--color-accent)]"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-fg-4)] hover:text-white transition-colors cursor-pointer"
                >
                  {showApiKey ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-4)] mb-2">
              scheduled dispatch hours ({selectedHours.length} selected)
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 p-3 bg-[var(--color-ink-0)] border border-[var(--color-ink-3)] rounded-sm">
              {Array.from({ length: 24 }).map((_, h) => {
                const active = selectedHours.includes(h);
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => toggleHour(h)}
                    className={`py-1.5 text-[11px] sm:text-xs font-mono text-center border transition-all cursor-pointer rounded-sm ${
                      active
                        ? "bg-[var(--color-accent)]/20 border-[var(--color-accent)] text-[var(--color-accent)] font-bold shadow-[0_0_8px_rgba(57,255,136,0.15)]"
                        : "bg-black/30 border-white/10 text-[var(--color-fg-2)] hover:border-[var(--color-accent)]/40 hover:text-white"
                    }`}
                  >
                    {String(h).padStart(2, "0")}:00
                  </button>
                );
              })}
            </div>
            <p className="text-[9px] text-[var(--color-fg-4)] mt-1.5 leading-relaxed">
              Click the hours you wish to receive your alerts. Alerts are automatically dispatched at the selected hours in your timezone ({wa?.timezone || "Europe/Madrid"}).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveConfig}
              disabled={saving}
              className="font-pixel uppercase text-[10px] tracking-wider px-3 py-1.5 border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-ink-0)] transition-colors disabled:opacity-30"
            >
              {saving ? "saving..." : "save"}
            </button>
            {wa?.configured && (
              <button
                onClick={() => setShowConfig(false)}
                className="font-pixel uppercase text-[10px] tracking-wider px-3 py-1.5 border border-[var(--color-ink-3)] text-[var(--color-fg-3)] hover:border-[var(--color-fg-2)] hover:text-[var(--color-fg-2)] transition-colors"
              >
                cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Metrics + Actions – only when configured */}
      {wa?.configured && !showConfig && (
        <>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <DigestMetric label="horario" value={wa.hours ? wa.hours.map(h => `${String(h).padStart(2, "0")}:00`).join(", ") : `${wa.cron}`} />
            <DigestMetric
              label="next run"
              value={formatCountdown(wa.nextRunAt, now)}
              highlight
            />
            <DigestMetric
              label="last sent"
              value={wa.lastSent ? formatRelative(wa.lastSent) : "never"}
            />
            <DigestMetric
              label="last test"
              value={wa.lastTestAt ? formatRelative(wa.lastTestAt) : "—"}
              highlight={wa.lastStatus === "ok"}
              danger={wa.lastStatus && wa.lastStatus !== "ok"}
              badge={
                wa.lastStatus === "ok"
                  ? "ok"
                  : wa.lastStatus
                    ? "error"
                    : undefined
              }
            />
          </div>

          {testResult && (
            <div
              className={`mt-3 p-3 border text-xs font-mono fade-in ${
                testResult.ok
                  ? "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 text-[var(--color-accent)]"
                  : "border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 text-[var(--color-danger)]"
              }`}
            >
              <div className="flex items-start gap-2">
                <span>{testResult.ok ? "✓" : "✗"}</span>
                <span>{testResult.message}</span>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 flex-wrap gap-y-2">
            <button
              onClick={testConnection}
              disabled={testing}
              className="font-pixel uppercase text-[10px] tracking-wider px-3 py-1.5 border border-[var(--color-ink-3)] text-[var(--color-fg-2)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors disabled:opacity-30"
            >
              {testing ? "sending test..." : "test connection"}
            </button>
            <button
              onClick={loadPreview}
              disabled={loadingPreview}
              className="font-pixel uppercase text-[10px] tracking-wider px-3 py-1.5 border border-[var(--color-ink-3)] text-[var(--color-fg-2)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors disabled:opacity-40"
            >
              {loadingPreview ? "generating..." : "preview"}
            </button>
            <button
              onClick={send}
              disabled={sending}
              className="font-pixel uppercase text-[10px] tracking-wider px-3 py-1.5 border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-ink-0)] transition-colors disabled:opacity-30"
            >
              {sending ? "sending..." : "send now"}
            </button>
            {feedback && (
              <span
                className={`text-xs font-mono fade-in ${
                  feedback.kind === "ok"
                    ? "text-[var(--color-accent)]"
                    : "text-[var(--color-danger)]"
                }`}
              >
                {feedback.text}
              </span>
            )}
          </div>

          {preview && (
            <pre className="mt-4 max-h-96 overflow-auto scrollbar-thin bg-[var(--color-ink-0)] border border-[var(--color-ink-3)] p-3 text-[11px] font-mono text-[var(--color-fg-2)] whitespace-pre-wrap leading-relaxed fade-in">
              {preview}
            </pre>
          )}
        </>
      )}
    </div>
  );
}

function DigestMetric({
  label,
  value,
  highlight = false,
  danger = false,
  badge,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  danger?: boolean;
  badge?: "ok" | "error";
}) {
  return (
    <div className="bg-transparent border border-[var(--color-ink-3)] hover:border-[var(--color-ink-4)] hover:bg-[var(--color-ink-2)] transition-colors p-3 relative rounded-sm">
      <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-4)] mb-1 flex items-center gap-1.5">
        {label}
        {badge && (
          <span
            className={`inline-block px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-bold rounded-sm ${
              badge === "ok"
                ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]"
                : "bg-[var(--color-danger)]/20 text-[var(--color-danger)]"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
      <div
        className={`font-mono text-sm ${
          danger
            ? "text-[var(--color-danger)]"
            : highlight
              ? "text-[var(--color-accent)]"
              : "text-[var(--color-fg-2)]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function formatCountdown(iso: string | null | undefined, now: number): string {
  if (!iso) return "—";
  const diff = new Date(iso).getTime() - now;
  if (diff <= 0) return "now";

  const totalSeconds = Math.ceil(diff / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `in ${days}d ${hours}h`;
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  if (minutes > 0) return `in ${minutes}m ${seconds}s`;
  return `in ${seconds}s`;
}
