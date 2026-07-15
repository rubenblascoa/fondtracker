import { getPortfolioTotals, listInvestments } from "./sentinel";
import { queries } from "./db";

const CALLMEBOT_URL = "https://api.callmebot.com/whatsapp.php";
const MAX_MESSAGE_LENGTH = 3500;

const SETTING_PHONE = "digest:phone";
const SETTING_API_KEY = "digest:api_key";
const SETTING_TIMEZONE = "digest:timezone";
const SETTING_CRON = "digest:cron";
const SETTING_ENABLED = "digest:enabled";

export type WhatsAppConfig = {
  enabled: boolean;
  configured: boolean;
  phone: string | null;
  timezone: string;
  cron: string;
};

async function loadRawPhone(): Promise<string | null> {
  const fromDb = await queries.getSetting(SETTING_PHONE);
  if (fromDb) return fromDb.trim();
  return process.env.WHATSAPP_PHONE?.trim() || null;
}

async function loadRawApiKey(): Promise<string | null> {
  const fromDb = await queries.getSetting(SETTING_API_KEY);
  if (fromDb) return fromDb.trim();
  return process.env.CALLMEBOT_API_KEY?.trim() || null;
}

async function loadTimezone(): Promise<string> {
  const fromDb = await queries.getSetting(SETTING_TIMEZONE);
  if (fromDb) return fromDb.trim();
  return process.env.WHATSAPP_TIMEZONE ?? "Europe/Madrid";
}

async function loadCron(): Promise<string> {
  const fromDb = await queries.getSetting(SETTING_CRON);
  if (fromDb) return fromDb.trim();
  return process.env.WHATSAPP_DIGEST_CRON?.trim() || "0 9,18 * * *";
}

async function loadEnabled(): Promise<boolean> {
  const fromDb = await queries.getSetting(SETTING_ENABLED);
  if (fromDb != null) return fromDb !== "false";
  return (process.env.WHATSAPP_ENABLED ?? "true").toLowerCase() !== "false";
}

export async function whatsappConfig(): Promise<WhatsAppConfig> {
  const [phone, apikey, timezone, cron, enabled] = await Promise.all([
    loadRawPhone(),
    loadRawApiKey(),
    loadTimezone(),
    loadCron(),
    loadEnabled(),
  ]);
  return {
    enabled,
    configured: Boolean(phone && apikey),
    phone: phone ? maskPhone(phone) : null,
    timezone,
    cron,
  };
}

export async function saveWhatsAppConfig(data: {
  phone?: string;
  api_key?: string;
  timezone?: string;
  cron?: string;
  enabled?: boolean;
}): Promise<void> {
  const ops: Promise<void>[] = [];
  if (data.phone !== undefined) ops.push(queries.setSetting(SETTING_PHONE, data.phone));
  if (data.api_key !== undefined) ops.push(queries.setSetting(SETTING_API_KEY, data.api_key));
  if (data.timezone !== undefined) ops.push(queries.setSetting(SETTING_TIMEZONE, data.timezone));
  if (data.cron !== undefined) ops.push(queries.setSetting(SETTING_CRON, data.cron));
  if (data.enabled !== undefined) ops.push(queries.setSetting(SETTING_ENABLED, data.enabled ? "true" : "false"));
  await Promise.all(ops);
}

function maskPhone(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.length <= 4) return clean;
  return `${clean.slice(0, 2)}…${clean.slice(-3)}`;
}

export async function sendWhatsApp(text: string): Promise<void> {
  const phone = await loadRawPhone();
  const apikey = await loadRawApiKey();
  if (!phone || !apikey) {
    throw new Error(
      "Faltan WHATSAPP_PHONE y/o CALLMEBOT_API_KEY en el entorno."
    );
  }

  const truncated =
    text.length > MAX_MESSAGE_LENGTH
      ? `${text.slice(0, MAX_MESSAGE_LENGTH - 20)}\n… (truncado)`
      : text;

  const url = new URL(CALLMEBOT_URL);
  url.searchParams.set("phone", phone.replace(/\D/g, ""));
  url.searchParams.set("text", truncated);
  url.searchParams.set("apikey", apikey);

  const res = await fetch(url.toString(), {
    method: "GET",
    signal: AbortSignal.timeout(15_000),
  });

  const body = await res.text();
  if (!res.ok || /APIKey is invalid|ERROR/i.test(body)) {
    throw new Error(`CallMeBot ${res.status}: ${body.slice(0, 200)}`);
  }
}

export type DigestContext = {
  slot: "morning" | "evening" | "manual";
  timezone: string;
};

export async function buildFundReport(ctx: DigestContext): Promise<string> {
  const now = new Date();
  const time = now.toLocaleString("es-ES", {
    timeZone: ctx.timezone,
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  const greeting =
    ctx.slot === "morning"
      ? "Buenos días"
      : ctx.slot === "evening"
        ? "Buenas tardes"
        : "Resumen";

  const investments = await listInvestments();
  const totals = await getPortfolioTotals();

  const lines: string[] = [];

  // ── Header ──
  lines.push("╔══ *FONDTRACKER* ═══════╗");
  lines.push(`║     ${greeting}`);
  lines.push(`║     ${time}`);
  lines.push("╚════════════════════════╝");
  lines.push("");

  if (investments.length === 0) {
    lines.push("📭 No hay inversiones registradas aún.");
    lines.push("");
    lines.push("───");
    lines.push(`_FondTracker · ${now.toISOString().slice(0, 10)}_`);
    return lines.join("\n");
  }

  // ── Portfolio Summary ──
  lines.push("━━━ *RESUMEN* ━━━");
  lines.push(`  💰 Invertido   ${fmtCur(totals.total_initial)}`);
  lines.push(`  📈 Actual      ${fmtCur(totals.total_current)}`);
  lines.push(`  📊 B/P         ${fmtCurSigned(totals.total_profit_loss)}`);
  lines.push(`  🎯 Rendimiento ${fmtPct(totals.total_profit_loss_pct)}`);
  lines.push("");

  // ── Per-fund breakdown ──
  lines.push("━━━ *CARTERA* ━━━");
  lines.push("");

  for (const inv of investments) {
    const catalog = await queries.getFundCatalogByIsin(inv.isin);
    const pct = inv.profit_loss_pct;
    const arrow = pct >= 0 ? "📈" : "📉";

    lines.push(`📌 *${inv.name}*`);
    if (catalog) lines.push(`   ${catalog.bank} · ${catalog.category}`);
    lines.push(`   ─────────────────────────`);
    lines.push(`   ${inv.shares.toFixed(2)} part. × ${fmtCur(Number(inv.purchase_price))}`);
    lines.push(`   Invertido    ${fmtCur(inv.total_invested)}`);
    if (inv.current_price != null) {
      lines.push(`   Valor actual ${fmtCur(inv.current_value)} (${inv.current_price.toFixed(4)}€/part.)`);
    }
    lines.push(`   ─────────────────────────`);
    lines.push(`   ${arrow} ${fmtCurSigned(inv.profit_loss)}  (${fmtPct(pct)})`);
    lines.push("");
  }

  // ── Relative performance bar chart ──
  if (investments.length > 0) {
    lines.push("━━━ *RENDIMIENTO RELATIVO* ━━━");
    lines.push("");

    const barWidth = 16;
    const allPcts = investments.map((i) => i.profit_loss_pct);
    const maxAbs = Math.max(...allPcts.map(Math.abs), 0.01);

    for (const inv of investments) {
      const pct = inv.profit_loss_pct;
      const normalized = pct / maxAbs; // -1 to 1
      const filledBars = Math.round(Math.abs(normalized) * barWidth);
      const emptyBars = barWidth - filledBars;

      const barColor = pct >= 0 ? "█" : "░";
      const fill = barColor.repeat(filledBars);
      const empty = "░".repeat(emptyBars);

      // Truncate name for alignment
      const name = inv.name.length > 14 ? inv.name.slice(0, 12) + "…" : inv.name;
      const padded = name.padEnd(14);

      lines.push(`${padded} ${fill}${empty}  ${fmtPct(pct)}`);
    }
    lines.push("");
  }

  // ── Footer ──
  lines.push("───");
  lines.push(`_FondTracker · actualizado ${now.toISOString().slice(0, 10)}_`);
  lines.push("_Fuentes: Yahoo Finance + QueFondos_");

  return lines.join("\n");
}

function fmtCur(value: number): string {
  return `${value.toFixed(2)}€`;
}

function fmtCurSigned(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}€`;
}

function fmtPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
