import { useEffect, useState } from "react";
import { api, type Status } from "../api";
import { formatRelative } from "../utils";

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
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const wa = status?.whatsapp;

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
      setPhone(wa.phone);
    } else {
      setPhone("");
    }
  }, [wa?.phone]);

  const openConfig = () => {
    setApiKey("");
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
      await api.updateWhatsAppConfig({
        api_key: apiKey || undefined,
        phone: phone || "",
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
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+34123456789"
                className="w-full bg-[var(--color-ink-0)] border border-[var(--color-ink-3)] px-2 py-1.5 text-xs font-mono text-[var(--color-fg-2)] placeholder-[var(--color-fg-4)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-4)] mb-1">
                API key
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={wa?.configured ? "********" : "your_api_key"}
                className="w-full bg-[var(--color-ink-0)] border border-[var(--color-ink-3)] px-2 py-1.5 text-xs font-mono text-[var(--color-fg-2)] placeholder-[var(--color-fg-4)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
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
            <DigestMetric label="cron" value={`${wa.cron} UTC`} />
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
