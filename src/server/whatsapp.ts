import { getPortfolioTotals, listInvestments } from "./sentinel";
import { queries } from "./db";

const CALLMEBOT_URL = "https://api.callmebot.com/whatsapp.php";

// CallMeBot passes the text as a URL-encoded query param.
// Emojis encode to ~12 chars each (%F0%9F...), tildes ~6 chars, asterisks ~3.
// A 1400-char raw message can expand to 4000+ encoded chars — way over the limit.
// We split by URL-ENCODED byte length, keeping each chunk under 1400 encoded chars.
const MAX_ENCODED_CHUNK = 1400;

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
  if (data.phone !== undefined) {
    const cleanPhone = data.phone.replace(/[^\d+]/g, "");
    ops.push(queries.setSetting(SETTING_PHONE, cleanPhone));
  }
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

/**
 * Split a long message into chunks whose URL-encoded length stays under MAX_ENCODED_CHUNK,
 * always breaking at newline boundaries so no line is cut mid-way.
 */
function splitMessage(text: string): string[] {
  // Fast path: fits in one chunk
  if (encodeURIComponent(text).length <= MAX_ENCODED_CHUNK) return [text];

  const chunks: string[] = [];
  const lines = text.split("\n");
  let current = "";

  for (const line of lines) {
    const candidate = current ? `${current}\n${line}` : line;
    if (encodeURIComponent(candidate).length > MAX_ENCODED_CHUNK) {
      // Current block is full — flush it
      if (current) chunks.push(current);

      // If even a single line exceeds the limit, hard-split it by encoded length
      if (encodeURIComponent(line).length > MAX_ENCODED_CHUNK) {
        let remaining = line;
        while (encodeURIComponent(remaining).length > MAX_ENCODED_CHUNK) {
          // Binary-search for the longest prefix that fits
          let lo = 1;
          let hi = remaining.length;
          while (lo < hi) {
            const mid = Math.ceil((lo + hi) / 2);
            if (encodeURIComponent(remaining.slice(0, mid)).length <= MAX_ENCODED_CHUNK) {
              lo = mid;
            } else {
              hi = mid - 1;
            }
          }
          chunks.push(remaining.slice(0, lo));
          remaining = remaining.slice(lo);
        }
        current = remaining;
      } else {
        current = line;
      }
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/**
 * Send a single raw chunk via CallMeBot GET request.
 */
async function sendChunk(phone: string, apikey: string, text: string): Promise<void> {
  const url = new URL(CALLMEBOT_URL);
  url.searchParams.set("phone", phone.replace(/\D/g, ""));
  url.searchParams.set("text", text);
  url.searchParams.set("apikey", apikey);

  const res = await fetch(url.toString(), {
    method: "GET",
    signal: AbortSignal.timeout(20_000),
  });

  const body = await res.text();
  if (!res.ok || /APIKey is invalid|ERROR/i.test(body)) {
    throw new Error(`CallMeBot ${res.status}: ${body.slice(0, 200)}`);
  }
}

/**
 * Send a WhatsApp message, automatically splitting into multiple parts
 * if the message exceeds CallMeBot's character limit.
 */
export async function sendWhatsApp(text: string): Promise<number> {
  const phone = await loadRawPhone();
  const apikey = await loadRawApiKey();
  if (!phone || !apikey) {
    throw new Error("Faltan WHATSAPP_PHONE y/o CALLMEBOT_API_KEY en el entorno.");
  }

  const SEND_INTERVAL_MS = positiveInt(process.env.WHATSAPP_SEND_INTERVAL_MS, 5000);
  const chunks = splitMessage(text);

  for (let i = 0; i < chunks.length; i++) {
    // Prefix multi-part messages so receiver knows which part it is
    const payload = chunks.length > 1
      ? `[${i + 1}/${chunks.length}]\n${chunks[i]}`
      : chunks[i];

    await sendChunk(phone, apikey, payload);

    // Respect rate limits between parts
    if (i < chunks.length - 1) {
      await sleep(SEND_INTERVAL_MS);
    }
  }
  return chunks.length;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
}

export type DigestContext = {
  slot: "morning" | "evening" | "manual";
  timezone: string;
};

/**
 * Build the full digest message for ALL users in the database.
 * The scheduler runs without a userId — we send one message per user
 * that has investments registered.
 */
export async function buildFundReport(ctx: DigestContext, userId?: number): Promise<string> {
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
      ? "Buenos días ☀️"
      : ctx.slot === "evening"
        ? "Buenas tardes 🌆"
        : "Resumen 📋";

  // If userId provided use it, otherwise fetch all users
  let userIds: number[] = [];
  if (userId !== undefined) {
    userIds = [userId];
  } else {
    const rows = await queries.getAllUserIds();
    userIds = rows;
  }

  const allSections: string[] = [];

  // ── Header ──
  allSections.push(
    "╔══════════════════════╗",
    "║  📊 *FONDTRACKER*",
    `║  ${greeting}`,
    `║  ${time}`,
    "╚══════════════════════╝",
    ""
  );

  let anyData = false;

  for (const uid of userIds) {
    const investments = await listInvestments(uid);
    if (investments.length === 0) continue;
    anyData = true;

    const totals = await getPortfolioTotals(uid);

    // ── Portfolio Summary ──
    allSections.push(
      "━━━ *RESUMEN CARTERA* ━━━",
      `💰 Invertido    ${fmtCur(totals.total_initial)}`,
      `📈 Valor actual ${fmtCur(totals.total_current)}`,
      `${totals.total_profit_loss >= 0 ? "🟢" : "🔴"} B/P          ${fmtCurSigned(totals.total_profit_loss)}  ${fmtPct(totals.total_profit_loss_pct)}`,
      ""
    );

    // ── Per-fund breakdown ──
    allSections.push("━━━ *DETALLE FONDOS* ━━━", "");

    for (const inv of investments) {
      const pct = inv.profit_loss_pct;
      const arrow = pct >= 0 ? "📈" : "📉";
      const profitIcon = pct >= 0 ? "🟢" : "🔴";

      allSections.push(`${arrow} *${inv.name}*`);
      allSections.push(`   ${inv.bank} · ${inv.category}`);
      allSections.push(`   ${inv.shares.toFixed(4)} part. × ${inv.purchase_price.toFixed(4)}€`);
      allSections.push(`   Invertido: ${fmtCur(inv.total_invested)}`);

      if (inv.current_price != null) {
        allSections.push(`   Actual: ${fmtCur(inv.current_value)}  (${inv.current_price.toFixed(4)}€/part.)`);
      }

      allSections.push(`   ${profitIcon} ${fmtCurSigned(inv.profit_loss)} · ${fmtPct(pct)}`);
      if (inv.purchase_date) {
        const dateStr = fmtDate(inv.purchase_date);
        if (dateStr) allSections.push(`   📅 Compra: ${dateStr}`);
      }
      if (inv.notes) {
        allSections.push(`   📝 ${inv.notes}`);
      }
      allSections.push("");
    }

    // ── Relative performance mini bar chart ──
    if (investments.length > 1) {
      allSections.push("━━━ *RENDIMIENTO* ━━━", "");
      const barWidth = 10;
      const allPcts = investments.map((i) => i.profit_loss_pct);
      const maxAbs = Math.max(...allPcts.map(Math.abs), 0.01);

      for (const inv of investments) {
        const pct = inv.profit_loss_pct;
        const normalized = pct / maxAbs;
        const filled = Math.round(Math.abs(normalized) * barWidth);
        const empty = barWidth - filled;
        const bar = (pct >= 0 ? "█" : "▒").repeat(filled) + "░".repeat(empty);
        const name = inv.name.length > 12 ? inv.name.slice(0, 11) + "…" : inv.name;
        allSections.push(`${name.padEnd(13)} ${bar} ${fmtPct(pct)}`);
      }
      allSections.push("");
    }
  }

  if (!anyData) {
    allSections.push("📭 No hay inversiones registradas aún.", "");
  }

  // ── Footer ──
  allSections.push(
    "───────────────────────",
    `_FondTracker · ${now.toISOString().slice(0, 10)}_`,
    "_Fuentes: Yahoo Finance + QueFondos_"
  );

  return allSections.join("\n");
}

function fmtCur(value: number): string {
  return `${value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€`;
}

function fmtCurSigned(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€`;
}

function fmtPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/** Safely convert a DATE field (may be string or JS Date) to "YYYY-MM-DD" */
function fmtDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  if (typeof date === "string") return date.slice(0, 10);
  return date.toISOString().slice(0, 10);
}
