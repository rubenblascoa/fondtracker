import { pool, queries } from "./db";
import { getPortfolioTotals, listInvestments } from "./sentinel";
import { getUserProfile } from "./auth";

const CALLMEBOT_URL = "https://api.callmebot.com/whatsapp.php";

const MAX_ENCODED_CHUNK = 1400;

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

function settingKey(base: string, userId?: number): string {
  return userId != null ? `${base}:${userId}` : base;
}

export async function loadRawPhone(userId?: number): Promise<string | null> {
  if (userId != null) {
    const [rows] = await pool.query<any[]>(
      "SELECT phone FROM users WHERE id = ? AND deleted_at IS NULL",
      [userId]
    );
    if (rows[0]?.phone) return rows[0].phone.trim();
    return null;
  }
  const fromEnv = process.env.WHATSAPP_PHONE?.trim();
  if (fromEnv) return fromEnv;
  return null;
}

async function loadRawApiKey(userId?: number): Promise<string | null> {
  if (userId != null) {
    const fromUser = await queries.getSetting(settingKey(SETTING_API_KEY, userId));
    if (fromUser) return fromUser.trim();
    return null;
  }
  const fromDb = await queries.getSetting(SETTING_API_KEY);
  if (fromDb) return fromDb.trim();
  return process.env.CALLMEBOT_API_KEY?.trim() || null;
}

async function loadTimezone(userId?: number): Promise<string> {
  if (userId != null) {
    const fromUser = await queries.getSetting(settingKey(SETTING_TIMEZONE, userId));
    if (fromUser) return fromUser.trim();
  }
  const fromDb = await queries.getSetting(SETTING_TIMEZONE);
  if (fromDb) return fromDb.trim();
  return process.env.WHATSAPP_TIMEZONE ?? "Europe/Madrid";
}

function loadCron(): string {
  return process.env.WHATSAPP_DIGEST_CRON?.trim() || "0 9,18 * * *";
}

export async function loadEnabled(userId?: number): Promise<boolean> {
  if (userId != null) {
    const fromUser = await queries.getSetting(settingKey(SETTING_ENABLED, userId));
    if (fromUser != null) return fromUser !== "false";
  }
  const fromDb = await queries.getSetting(SETTING_ENABLED);
  if (fromDb != null) return fromDb !== "false";
  return (process.env.WHATSAPP_ENABLED ?? "true").toLowerCase() !== "false";
}

export async function whatsappConfig(userId?: number): Promise<WhatsAppConfig> {
  const [phone, apikey, timezone, enabled] = await Promise.all([
    loadRawPhone(userId),
    loadRawApiKey(userId),
    loadTimezone(userId),
    loadEnabled(userId),
  ]);
  return {
    enabled,
    configured: Boolean(phone && apikey),
    phone: phone ? maskPhone(phone) : null,
    timezone,
    cron: loadCron(),
  };
}

export async function saveWhatsAppConfig(userId: number, data: {
  api_key?: string;
  timezone?: string;
  enabled?: boolean;
  phone?: string;
}): Promise<void> {
  const ops: Promise<void>[] = [];
  if (data.api_key !== undefined) ops.push(queries.setSetting(settingKey(SETTING_API_KEY, userId), data.api_key));
  if (data.timezone !== undefined) ops.push(queries.setSetting(settingKey(SETTING_TIMEZONE, userId), data.timezone));
  if (data.enabled !== undefined) ops.push(queries.setSetting(settingKey(SETTING_ENABLED, userId), data.enabled ? "true" : "false"));
  if (data.phone !== undefined) {
    const clean = data.phone.trim();
    if (clean !== "" && !clean.includes("…") && !clean.includes("...")) {
      if (!/^\+[1-9]\d{6,14}$/.test(clean.replace(/[\s-]/g, ""))) {
        throw new Error("Teléfono inválido. Formato: +34123456789");
      }
      ops.push(pool.query(
        "UPDATE users SET phone = ? WHERE id = ?",
        [clean.replace(/[^\d+]/g, "") || null, userId]
      ).then(() => {}));
    } else if (clean === "") {
      ops.push(pool.query(
        "UPDATE users SET phone = NULL WHERE id = ?",
        [userId]
      ).then(() => {}));
    }
  }
  await Promise.all(ops);
}

function maskPhone(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.length <= 4) return clean;
  return `${clean.slice(0, 2)}…${clean.slice(-3)}`;
}

function splitMessage(text: string): string[] {
  if (encodeURIComponent(text).length <= MAX_ENCODED_CHUNK) return [text];
  const chunks: string[] = [];
  const lines = text.split("\n");
  let current = "";
  for (const line of lines) {
    const candidate = current ? `${current}\n${line}` : line;
    if (encodeURIComponent(candidate).length > MAX_ENCODED_CHUNK) {
      if (current) chunks.push(current);
      if (encodeURIComponent(line).length > MAX_ENCODED_CHUNK) {
        let remaining = line;
        while (encodeURIComponent(remaining).length > MAX_ENCODED_CHUNK) {
          let lo = 1, hi = remaining.length;
          while (lo < hi) {
            const mid = Math.ceil((lo + hi) / 2);
            if (encodeURIComponent(remaining.slice(0, mid)).length <= MAX_ENCODED_CHUNK) lo = mid;
            else hi = mid - 1;
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

export async function sendWhatsApp(userId: number, text: string): Promise<number> {
  const phone = await loadRawPhone(userId);
  const apikey = await loadRawApiKey(userId);
  if (!phone || !apikey) {
    throw new Error("WhatsApp no configurado. Guarda tu número y API key.");
  }
  const SEND_INTERVAL_MS = positiveInt(process.env.WHATSAPP_SEND_INTERVAL_MS, 5000);
  const chunks = splitMessage(text);
  for (let i = 0; i < chunks.length; i++) {
    const payload = chunks.length > 1 ? `[${i + 1}/${chunks.length}]\n${chunks[i]}` : chunks[i];
    await sendChunk(phone, apikey, payload);
    if (i < chunks.length - 1) await sleep(SEND_INTERVAL_MS);
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

export async function buildFundReport(ctx: DigestContext, userId: number): Promise<string> {
  const now = new Date();
  const time = now.toLocaleString("es-ES", {
    timeZone: ctx.timezone,
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  const [profile, investments] = await Promise.all([
    getUserProfile(userId),
    listInvestments(userId),
  ]);
  const name = profile?.username ? ` ${profile.username}` : "";
  const greeting =
    ctx.slot === "morning" ? `Buenos días${name} ☀️` :
    ctx.slot === "evening" ? `Buenas tardes${name} 🌆` :
    `Resumen${name} 📋`;
  const sections: string[] = [];

  sections.push(
    "╔══════════════════════╗",
    "║  📊 *FONDTRACKER*",
    `║  ${greeting}`,
    `║  ${time}`,
    "╚══════════════════════╝",
    ""
  );

  if (investments.length === 0) {
    sections.push("📭 No hay inversiones registradas aún.", "");
  } else {
    const totals = await getPortfolioTotals(userId);
    sections.push(
      "━━━ *RESUMEN CARTERA* ━━━",
      `💰 Invertido    ${fmtCur(totals.total_initial)}`,
      `📈 Valor actual ${fmtCur(totals.total_current)}`,
      `${totals.total_profit_loss >= 0 ? "🟢" : "🔴"} B/P          ${fmtCurSigned(totals.total_profit_loss)}  ${fmtPct(totals.total_profit_loss_pct)}`,
      ""
    );
    sections.push("━━━ *DETALLE FONDOS* ━━━", "");
    for (const inv of investments) {
      const pct = inv.profit_loss_pct;
      sections.push(`${pct >= 0 ? "📈" : "📉"} *${inv.name}*`);
      sections.push(`   ${inv.bank} · ${inv.category}`);
      sections.push(`   ${inv.shares.toFixed(4)} part. × ${inv.purchase_price.toFixed(4)}€`);
      sections.push(`   Invertido: ${fmtCur(inv.total_invested)}`);
      if (inv.current_price != null) {
        sections.push(`   Actual: ${fmtCur(inv.current_value)}  (${inv.current_price.toFixed(4)}€/part.)`);
      }
      sections.push(`   ${pct >= 0 ? "🟢" : "🔴"} ${fmtCurSigned(inv.profit_loss)} · ${fmtPct(pct)}`);
      const dateStr = fmtDate(inv.purchase_date);
      if (dateStr) sections.push(`   📅 Compra: ${dateStr}`);
      if (inv.notes) sections.push(`   📝 ${inv.notes}`);
      sections.push("");
    }
    if (investments.length > 1) {
      sections.push("━━━ *RENDIMIENTO* ━━━", "");
      sections.push("```");
      const barWidth = 8;
      const allPcts = investments.map(i => i.profit_loss_pct);
      const maxAbs = Math.max(...allPcts.map(Math.abs), 0.01);
      for (const inv of investments) {
        const pct = inv.profit_loss_pct;
        const normalized = pct / maxAbs;
        const filled = Math.round(Math.abs(normalized) * barWidth);
        const bar = (pct >= 0 ? "■" : "▨").repeat(filled) + "□".repeat(barWidth - filled);
        const name = inv.name.length > 9 ? inv.name.slice(0, 8) + "…" : inv.name;
        sections.push(`${name.padEnd(10)} ${bar} ${fmtPct(pct)}`);
      }
      sections.push("```");
      sections.push("");
    }
  }

  sections.push(
    "───────────────────────",
    `_FondTracker · ${now.toISOString().slice(0, 10)}_`,
    "_Fuentes: Yahoo Finance + QueFondos_"
  );
  return sections.join("\n");
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

function fmtDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  if (typeof date === "string") return date.slice(0, 10);
  return date.toISOString().slice(0, 10);
}
