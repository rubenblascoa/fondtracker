const IS_PROD = process.env.NODE_ENV === "production";
// Igual que en index.ts: sin ALLOWED_ORIGIN, en Render (RENDER=true) se usa su URL pública
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || (process.env.RENDER ? process.env.RENDER_EXTERNAL_URL : undefined) || (IS_PROD ? "" : "http://localhost:3741");
const MAX_BODY_BYTES = 65_536; // 64 KB

let serverInstance: any = null;
export function setServerInstance(s: any) {
  serverInstance = s;
}

// ─── Rate Limiter ──────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_ENTRIES = 10_000;

export function rateLimit(namespace: string, ip: string, maxRequests = 10): boolean {
  const key = `${namespace}:${ip}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now >= entry.resetAt) {
    if (rateLimitMap.size >= RATE_LIMIT_MAX_ENTRIES) {
      const oldest = rateLimitMap.entries().next().value;
      if (oldest) rateLimitMap.delete(oldest[0]);
    }
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  if (entry.count > maxRequests) return true;
  return false;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now >= val.resetAt) rateLimitMap.delete(key);
  }
}, 60_000).unref();

// ─── Nonce & Security Headers ──────────────────────────────────────────────
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "");
}

export let cachedNonce = generateNonce();
setInterval(() => {
  cachedNonce = generateNonce();
}, 60_000).unref();

export function securityHeaders(extra?: Record<string, string>): Record<string, string> {
  const nonce = cachedNonce;
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://cdn.tailwindcss.com https://static.cloudflareinsights.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://assets.landinghero.app",
    "connect-src 'self' https://cloudflareinsights.com",
    "frame-ancestors 'none'",
  ].join("; ");

  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Content-Security-Policy": csp,
    ...(IS_PROD ? { "Strict-Transport-Security": "max-age=31536000; includeSubDomains" } : {}),
    ...extra,
  };
}

export function getClientIp(req: Request): string {
  if (serverInstance) {
    try {
      const addr = serverInstance.requestIP(req);
      if (addr) return addr.address;
    } catch {}
  }
  if (process.env.TRUST_PROXY === "1") {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function corsHeaders(): Record<string, string> {
  if (!ALLOWED_ORIGIN) return {};
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  };
}

export function checkCSRF(req: Request): boolean {
  if (!ALLOWED_ORIGIN) return true;
  const origin = req.headers.get("Origin");
  const referer = req.headers.get("Referer");
  if (!origin && !referer) return true;
  const check = (origin || referer || "").replace(/\/+$/, "");
  return check === ALLOWED_ORIGIN.replace(/\/+$/, "");
}

export function json(data: unknown, init?: ResponseInit) {
  const headers: Record<string, string> = {
    ...corsHeaders(),
    ...securityHeaders(),
    ...(init?.headers as Record<string, string> ?? {}),
  };
  return Response.json(data, { ...init, headers });
}

export function badRequest(message: string) {
  return json({ error: message }, { status: 400 });
}

export function unauthorized(message = "No autenticado") {
  return json({ error: message }, { status: 401 });
}

export function notFound(message = "Recurso no encontrado") {
  return json({ error: message }, { status: 404 });
}

export function tooManyRequests() {
  return json({ error: "Demasiados intentos. Espera un momento." }, { status: 429 });
}

export async function safeJson(req: Request): Promise<unknown> {
  if (!req.body) throw new Error("Body ausente");
  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let totalSize = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalSize += value.length;
    if (totalSize > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new Error("Payload demasiado grande");
    }
    chunks.push(decoder.decode(value, { stream: true }));
  }
  chunks.push(decoder.decode());

  const text = chunks.join("");
  if (text.length > MAX_BODY_BYTES) throw new Error("Payload demasiado grande");
  return JSON.parse(text);
}

const SAFE_ERROR_PREFIXES = [
  "Credenciales incorrectas", "Mínimo 8 caracteres", "Requiere al menos una mayúscula",
  "Requiere al menos una minúscula", "Requiere al menos un número",
  "El email o nombre de usuario ya está registrado", "Usuario no encontrado",
  "El usuario necesita al menos 3 caracteres", "El usuario solo puede tener letras, números y guión bajo",
  "Introduce un email válido", "Introduce tu email o usuario", "Introduce tu contraseña",
  "Payload demasiado grande", "Body ausente", "Falta ", "Email inválido",
  "ISIN inválido", "Ticker inválido", "Rango inválido", "Intervalo inválido",
  "fondo no encontrado", "datos de mercado no disponibles para este fondo",
  "Demasiados intentos", "No autenticado",
  "La contraseña actual no es correcta", "No se pudo actualizar el email",
  "Faltan WHATSAPP_PHONE", "WhatsApp no configurado", "El número de participaciones",
  "El precio liquidativo", "Formato de fecha", "Transacción no encontrada",
];

export function safeError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (IS_PROD && !SAFE_ERROR_PREFIXES.some(p => msg.startsWith(p))) {
    return "Error interno del servidor";
  }
  return msg;
}
