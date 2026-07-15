import { queries } from "./db";
import {
  buildFundReport,
  sendWhatsApp,
  whatsappConfig,
  type WhatsAppConfig,
  type DigestContext,
} from "./whatsapp";

const LAST_SENT_AT_KEY = "digest:last_sent_at";
const WHATSAPP_SEND_INTERVAL_MS = positiveInt(
  process.env.WHATSAPP_SEND_INTERVAL_MS,
  5000
);

type DigestRunResult = {
  message: string;
  sent: number;
};

type CronJobHandle = {
  stop(): CronJobHandle;
};

type LocalTime = {
  hour: number;
};

let digestJob: CronJobHandle | null = null;
let activeDigest: Promise<DigestRunResult> | null = null;
let activeDigestStartedAt: string | null = null;

function localTimeInTimezone(timezone: string): LocalTime {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  return {
    hour: Number(get("hour")),
  };
}

function currentDigestSlot(timezone: string): DigestContext["slot"] {
  return localTimeInTimezone(timezone).hour < 12 ? "morning" : "evening";
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
}

async function runScheduledDigest(): Promise<void> {
  const cfg = await whatsappConfig();
  if (!cfg.enabled || !cfg.configured) return;

  const slot = currentDigestSlot(cfg.timezone);
  try {
    const result = await runDigest({ slot, timezone: cfg.timezone });
    console.log(
      `[digest] ${new Date().toISOString()} enviado=${result.sent} cron="${cfg.cron}"`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[digest] error enviando cron="${cfg.cron}": ${msg}`);
  }
}

async function executeDigest(ctx: DigestContext): Promise<DigestRunResult> {
  const message = await buildFundReport(ctx);
  await sendWhatsApp(message);
  await queries.setSetting(LAST_SENT_AT_KEY, new Date().toISOString());
  return { message, sent: 1 };
}

export async function runDigest(ctx: DigestContext): Promise<DigestRunResult> {
  if (activeDigest) {
    console.warn(
      `[digest] ejecución ya en curso desde ${activeDigestStartedAt}; reutilizando resultado`
    );
    return activeDigest;
  }

  activeDigestStartedAt = new Date().toISOString();
  activeDigest = executeDigest(ctx).finally(() => {
    activeDigest = null;
    activeDigestStartedAt = null;
  });

  return activeDigest;
}

export async function previewDigest(ctx: DigestContext): Promise<string> {
  return buildFundReport(ctx);
}

export async function startDigestScheduler(): Promise<void> {
  if (digestJob) return;
  const cfg = await whatsappConfig();
  if (!cfg.configured) {
    console.log(
      "[digest] WhatsApp no configurado (faltan WHATSAPP_PHONE / CALLMEBOT_API_KEY). Scheduler en pausa."
    );
    return;
  }
  if (!cfg.enabled) {
    console.log("[digest] WhatsApp desactivado.");
    return;
  }

  try {
    digestJob = Bun.cron(cfg.cron, runScheduledDigest);
    console.log(
      `[digest] activo · cron="${cfg.cron}" UTC · formato ${cfg.timezone}`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[digest] cron inválido "${cfg.cron}": ${msg}`);
  }
}

export function stopDigestScheduler(): void {
  digestJob?.stop();
  digestJob = null;
}

function nextDigestRun(cron: string): string | null {
  try {
    return Bun.cron.parse(cron)?.toISOString() ?? null;
  } catch {
    return null;
  }
}

export async function digestStatus(): Promise<{
  config: WhatsAppConfig;
  lastSent: string | null;
  nextRunAt: string | null;
  lastTestAt: string | null;
  lastStatus: string | null;
}> {
  const config = await whatsappConfig();
  const [lastSent, lastTestAt, lastStatus] = await Promise.all([
    queries.getSetting(LAST_SENT_AT_KEY),
    queries.getSetting("digest:last_test_at"),
    queries.getSetting("digest:last_status"),
  ]);
  const nextRunAt =
    config.enabled && config.configured ? nextDigestRun(config.cron) : null;
  return { config, lastSent, nextRunAt, lastTestAt, lastStatus };
}
