import { queries } from "./db";
import {
  buildFundReport,
  sendWhatsApp,
  whatsappConfig,
  loadEnabled,
  loadRawPhone,
  type WhatsAppConfig,
  type DigestContext,
} from "./whatsapp";

const LAST_SENT_AT_KEY = "digest:last_sent_at";

type DigestRunResult = {
  message: string;
  sent: number;
};

type CronJobHandle = {
  stop(): CronJobHandle;
};

let digestJob: CronJobHandle | null = null;
const activeDigests = new Map<string, Promise<DigestRunResult>>();

function localTimeInTimezone(timezone: string): { hour: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "00";
  return { hour: Number(get("hour")) };
}

async function runScheduledDigest(): Promise<void> {
  const userIds = await queries.getAllUserIds();
  for (const userId of userIds) {
    try {
      const phone = await loadRawPhone(userId);
      if (!phone) continue;
      const enabled = await loadEnabled(userId);
      if (!enabled) continue;
      
      const cfg = await whatsappConfig(userId);
      const { hour } = localTimeInTimezone(cfg.timezone);
      
      // Check if current hour in user timezone is scheduled
      if (!cfg.hours.includes(hour)) continue;

      const slot = `hour-${hour}`;
      const nowInTz = new Date().toLocaleDateString("en-CA", { timeZone: cfg.timezone }); // formats as YYYY-MM-DD
      const slotKey = `digest:last_sent_slot:${userId}`;
      const expectedVal = `${nowInTz}:${slot}`;
      
      const lastSentSlot = await queries.getSetting(slotKey);
      if (lastSentSlot === expectedVal) {
        // Already sent for this hour today!
        continue;
      }
      
      const result = await runDigest({ slot: "manual", timezone: cfg.timezone }, userId);
      if (result.sent > 0) {
        await queries.setSetting(slotKey, expectedVal);
        console.log(`[digest] usuario=${userId} enviado=${result.sent} (hora=${hour})`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[digest] error usuario=${userId}: ${msg}`);
    }
  }
}

async function executeDigest(ctx: DigestContext, userId: number): Promise<DigestRunResult> {
  const message = await buildFundReport(ctx, userId);
  const sent = await sendWhatsApp(userId, message);
  await queries.setSetting(`${LAST_SENT_AT_KEY}:${userId}`, new Date().toISOString());
  return { message, sent };
}

export async function runDigest(ctx: DigestContext, userId: number): Promise<DigestRunResult> {
  const key = `${userId}:${ctx.slot}`;
  if (activeDigests.has(key)) return activeDigests.get(key)!;
  const p = executeDigest(ctx, userId).finally(() => activeDigests.delete(key));
  activeDigests.set(key, p);
  return p;
}

export async function previewDigest(ctx: DigestContext, userId: number): Promise<string> {
  return buildFundReport(ctx, userId);
}

export async function startDigestScheduler(): Promise<void> {
  if (digestJob) return;
  try {
    digestJob = Bun.cron("*/15 * * * *", runScheduledDigest);
    console.log("[digest] activo · revisa cada 15 minutos");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[digest] error creando scheduler: ${msg}`);
  }
}

export function stopDigestScheduler(): void {
  digestJob?.stop();
  digestJob = null;
}

export type DigestStatusResult = {
  config: WhatsAppConfig;
  lastSent: string | null;
  lastTestAt: string | null;
  lastStatus: string | null;
  nextRunAt: string | null;
};

export async function digestStatus(userId?: number): Promise<DigestStatusResult> {
  const config = await whatsappConfig(userId);
  const suffix = userId != null ? `:${userId}` : "";
  const [lastSent, lastTestAt, lastStatus] = await Promise.all([
    userId != null ? queries.getSetting(`${LAST_SENT_AT_KEY}${suffix}`) : Promise.resolve(null),
    queries.getSetting(`digest:last_test_at${suffix}`),
    queries.getSetting(`digest:last_status${suffix}`),
  ]);

  let nextRunAt: string | null = null;
  if (config.configured && config.enabled) {
    try {
      const nextDate = getNextCronDate(config.cron, config.timezone);
      nextRunAt = nextDate.toISOString();
    } catch (err) {
      console.error("[digest] error calculating next run:", err);
    }
  }

  return { config, lastSent, lastTestAt, lastStatus, nextRunAt };
}

function parseCronField(field: string, min: number, max: number): number[] {
  const res: number[] = [];
  if (field === "*") {
    for (let i = min; i <= max; i++) res.push(i);
    return res;
  }
  const parts = field.split(",");
  for (const part of parts) {
    if (part.includes("/")) {
      const [range, stepStr] = part.split("/");
      const step = parseInt(stepStr, 10);
      let start = min, end = max;
      if (range !== "*") {
        const [s, e] = range.split("-");
        start = parseInt(s, 10);
        end = e ? parseInt(e, 10) : max;
      }
      for (let i = start; i <= end; i += step) {
        res.push(i);
      }
    } else if (part.includes("-")) {
      const [s, e] = part.split("-");
      const start = parseInt(s, 10);
      const end = parseInt(e, 10);
      for (let i = start; i <= end; i++) {
        res.push(i);
      }
    } else {
      const val = parseInt(part, 10);
      if (!isNaN(val)) res.push(val);
    }
  }
  return Array.from(new Set(res)).sort((a, b) => a - b);
}

export function getNextCronDate(cronStr: string, timezone: string): Date {
  const parts = cronStr.split(/\s+/);
  if (parts.length < 2) return new Date(Date.now() + 24 * 3600 * 1000);

  const minutes = parseCronField(parts[0], 0, 59);
  const hours = parseCronField(parts[1], 0, 23);

  const now = new Date();
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  
  const checkFormatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  const candidates: Date[] = [];
  for (let d = 0; d < 8; d++) {
    const dayDate = new Date(now.getTime() + d * 24 * 3600 * 1000);
    const dayStr = formatter.format(dayDate);
    
    for (const h of hours) {
      for (const m of minutes) {
        const hPad = String(h).padStart(2, "0");
        const mPad = String(m).padStart(2, "0");
        const isoEstimate = `${dayStr}T${hPad}:${mPad}:00.000Z`;
        const estDate = new Date(isoEstimate);
        
        const checkStr = checkFormatter.format(estDate);
        const checkDate = new Date(checkStr.replace(" ", "T") + ".000Z");
        
        const diff = estDate.getTime() - checkDate.getTime();
        const actualDate = new Date(estDate.getTime() + diff);
        
        if (actualDate.getTime() > now.getTime()) {
          candidates.push(actualDate);
        }
      }
    }
  }
  
  if (candidates.length === 0) {
    return new Date(Date.now() + 24 * 3600 * 1000);
  }
  
  candidates.sort((a, b) => a.getTime() - b.getTime());
  return candidates[0];
}
