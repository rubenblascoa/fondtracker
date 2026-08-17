import { pool } from "./db";
import { queries } from "./db";

// ─── In-Memory Activity Audit Log ──────────────────────────────────────────────
export type ActivityLog = {
  id: string;
  type: "USER_BAN" | "USER_RESTORE" | "USER_ADMIN" | "CATALOG_ADD" | "CATALOG_UPDATE" | "CATALOG_DELETE" | "PRICE_REFRESH" | "SYSTEM_REFRESH" | "DIGEST_TRIGGER" | "CACHE_CLEAR";
  message: string;
  timestamp: string;
};

const activityLogs: ActivityLog[] = [
  {
    id: "init-1",
    type: "SYSTEM_REFRESH",
    message: "Servidor FondTracker inicializado con pool MySQL",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  }
];
const MAX_LOGS = 60;

export function addActivityLog(type: ActivityLog["type"], message: string) {
  activityLogs.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    message,
    timestamp: new Date().toISOString(),
  });
  if (activityLogs.length > MAX_LOGS) activityLogs.pop();
}

export function getActivityLogs(): ActivityLog[] {
  return activityLogs;
}

// ─── Admin Overview Queries ───────────────────────────────────────────────────

export async function getAdminOverview() {
  const [[usersRow], [activeRow], [newWeekRow], [invRow], [aumRow], [catalogRow], [pricesRow], [waRow], [authRow], [historyRow], [banksRow], [categoriesRow]] =
    await Promise.all([
      pool.query<any[]>("SELECT COUNT(*) AS total FROM users"),
      pool.query<any[]>("SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL"),
      pool.query<any[]>("SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL 7 DAY"),
      pool.query<any[]>("SELECT COUNT(*) AS total FROM investments WHERE deleted_at IS NULL"),
      pool.query<any[]>("SELECT COALESCE(SUM(CAST(shares AS DECIMAL(20,6)) * CAST(purchase_price AS DECIMAL(20,6))), 0) AS aum FROM investments WHERE deleted_at IS NULL"),
      pool.query<any[]>("SELECT COUNT(*) AS total FROM fund_catalog"),
      pool.query<any[]>("SELECT COUNT(*) AS total FROM fund_prices"),
      pool.query<any[]>(`
        SELECT COUNT(DISTINCT u.id) AS total 
        FROM users u 
        WHERE u.deleted_at IS NULL 
          AND u.phone IS NOT NULL 
          AND u.phone != '' 
          AND COALESCE((SELECT setting_value FROM settings WHERE setting_key = CONCAT('digest:enabled:', u.id)), 'true') != 'false'
      `),
      pool.query<any[]>("SELECT SUM(google_id IS NOT NULL) AS google, SUM(github_id IS NOT NULL) AS github, SUM(password_hash IS NOT NULL) AS password FROM users WHERE deleted_at IS NULL"),
      pool.query<any[]>("SELECT purchase_date as date, SUM(CAST(shares AS DECIMAL(20,6)) * CAST(purchase_price AS DECIMAL(20,6))) AS daily_amount FROM investments WHERE deleted_at IS NULL GROUP BY purchase_date ORDER BY purchase_date ASC"),
      pool.query<any[]>(`
        SELECT bank, COALESCE(SUM(CAST(shares AS DECIMAL(20,6)) * CAST(purchase_price AS DECIMAL(20,6))), 0) as aum, COUNT(*) as count
        FROM investments WHERE deleted_at IS NULL AND bank != ''
        GROUP BY bank ORDER BY aum DESC LIMIT 8
      `),
      pool.query<any[]>(`
        SELECT category, COALESCE(SUM(CAST(shares AS DECIMAL(20,6)) * CAST(purchase_price AS DECIMAL(20,6))), 0) as aum, COUNT(*) as count
        FROM investments WHERE deleted_at IS NULL AND category != ''
        GROUP BY category ORDER BY aum DESC LIMIT 6
      `)
    ]);

  const [lastDigestRow] = await pool.query<any[]>(
    "SELECT setting_value FROM settings WHERE setting_key LIKE 'digest:last_sent_at:%' ORDER BY setting_value DESC LIMIT 1"
  );
  const [missingTickerRow] = await pool.query<any[]>(
    "SELECT COUNT(*) AS total FROM fund_catalog WHERE yahoo_ticker IS NULL OR yahoo_ticker = ''"
  );
  const [deletedRow] = await pool.query<any[]>(
    "SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NOT NULL"
  );

  return {
    total_users: Number(usersRow[0]?.total ?? 0),
    active_users: Number(activeRow[0]?.total ?? 0),
    deleted_users: Number(deletedRow[0]?.total ?? 0),
    new_this_week: Number(newWeekRow[0]?.total ?? 0),
    total_investments: Number(invRow[0]?.total ?? 0),
    aum_total: Number(aumRow[0]?.aum ?? 0),
    catalog_size: Number(catalogRow[0]?.total ?? 0),
    cached_prices: Number(pricesRow[0]?.total ?? 0),
    whatsapp_active: Number(waRow[0]?.total ?? 0),
    last_digest: (lastDigestRow as any[])[0]?.setting_value ?? null,
    funds_missing_ticker: Number(missingTickerRow[0]?.total ?? 0),
    auth_google: Number(authRow[0]?.google ?? 0),
    auth_github: Number(authRow[0]?.github ?? 0),
    auth_password: Number(authRow[0]?.password ?? 0),
    aum_history_raw: historyRow.map((r: any) => ({ date: r.date, amount: Number(r.daily_amount) })),
    top_banks: banksRow.map((r: any) => ({ name: r.bank, aum: Number(r.aum), count: Number(r.count) })),
    top_categories: categoriesRow.map((r: any) => ({ name: r.category, aum: Number(r.aum), count: Number(r.count) })),
  };
}

// ─── Users Management ─────────────────────────────────────────────────────────

export async function getAdminUsers(search?: string, status?: string, limit = 50, offset = 0) {
  let sql = `
    SELECT 
      u.id,
      u.username,
      u.email,
      u.phone,
      u.is_admin,
      u.created_at,
      u.deleted_at,
      u.google_id IS NOT NULL AS has_google,
      u.github_id IS NOT NULL AS has_github,
      u.password_hash IS NOT NULL AS has_password,
      COUNT(i.id) AS investment_count,
      COALESCE(SUM(CAST(i.shares AS DECIMAL(20,6)) * CAST(i.purchase_price AS DECIMAL(20,6))), 0) AS total_invested,
      (
        CASE 
          WHEN u.phone IS NOT NULL AND u.phone != '' AND COALESCE((SELECT setting_value FROM settings WHERE setting_key = CONCAT('digest:enabled:', u.id)), 'true') != 'false' THEN '1'
          ELSE '0'
        END
      ) AS whatsapp_enabled,
      (SELECT setting_value FROM settings WHERE setting_key = CONCAT('digest:last_sent_at:', u.id)) AS last_digest
    FROM users u
    LEFT JOIN investments i ON i.user_id = u.id AND i.deleted_at IS NULL
  `;
  const params: any[] = [];

  const conditions: string[] = [];
  if (search) {
    conditions.push("(u.email LIKE ? OR u.username LIKE ? OR u.phone LIKE ?)");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status === "active") {
    conditions.push("u.deleted_at IS NULL");
  } else if (status === "deleted") {
    conditions.push("u.deleted_at IS NOT NULL");
  } else if (status === "admin") {
    conditions.push("u.is_admin = 1 AND u.deleted_at IS NULL");
  } else if (status === "whatsapp") {
    conditions.push("(u.phone IS NOT NULL AND u.phone != '' AND COALESCE((SELECT setting_value FROM settings WHERE setting_key = CONCAT('digest:enabled:', u.id)), 'true') != 'false')");
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }

  sql += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const [rows] = await pool.query<any[]>(sql, params);
  const [[{ total }]] = await pool.query<any[]>(
    `SELECT COUNT(*) AS total FROM users u${conditions.length > 0 ? " WHERE " + conditions.join(" AND ") : ""}`,
    params.slice(0, -2)
  );
  return { users: rows, total: Number(total) };
}

export async function getAdminUserDetail(userId: number) {
  const [userRows] = await pool.query<any[]>(
    `SELECT id, username, email, phone, is_admin, created_at, deleted_at, google_id IS NOT NULL as has_google, github_id IS NOT NULL as has_github, password_hash IS NOT NULL as has_password FROM users WHERE id = ?`,
    [userId]
  );
  if (!userRows || userRows.length === 0) return null;
  const user = userRows[0];

  const [investments] = await pool.query<any[]>(
    `SELECT i.*, fp.price as current_price, fp.updated_at as price_updated_at
     FROM investments i
     LEFT JOIN fund_prices fp ON fp.isin = i.isin
     WHERE i.user_id = ? AND i.deleted_at IS NULL
     ORDER BY i.created_at DESC`,
    [userId]
  );

  const [settingsRows] = await pool.query<any[]>(
    `SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE ? OR setting_key LIKE ?`,
    [`%_${userId}`, `%:${userId}`]
  );

  const settingsMap: Record<string, string> = {};
  for (const r of (settingsRows || [])) {
    settingsMap[r.setting_key] = r.setting_value;
  }

  let totalInvested = 0;
  let totalCurrent = 0;
  for (const inv of (investments || [])) {
    const shares = Number(inv.shares) || 0;
    const pPrice = Number(inv.purchase_price) || 0;
    const invAmt = shares * pPrice;
    const curPrice = Number(inv.current_price) || pPrice;
    const curAmt = shares * curPrice;
    totalInvested += invAmt;
    totalCurrent += curAmt;
  }

  let hours = [8, 14, 20];
  const rawHours = settingsMap[`whatsapp_hours_${userId}`] || settingsMap[`digest:hours:${userId}`];
  if (rawHours) {
    try {
      const parsed = JSON.parse(rawHours);
      if (Array.isArray(parsed)) hours = parsed;
    } catch {
      const split = String(rawHours).split(",").map(Number).filter(n => Number.isFinite(n));
      if (split.length > 0) hours = split;
    }
  }

  const isEnabled = 
    settingsMap[`whatsapp_enabled_${userId}`] === "1" || 
    settingsMap[`digest:enabled:${userId}`] === "1" || 
    settingsMap[`digest:enabled:${userId}`] === "true";

  const hasApiKey = Boolean(
    settingsMap[`whatsapp_api_key_${userId}`] || 
    settingsMap[`digest:api_key:${userId}`] || 
    process.env.CALLMEBOT_API_KEY
  );

  return {
    user,
    summary: {
      totalInvested,
      totalCurrent,
      totalProfitLoss: totalCurrent - totalInvested,
      totalProfitLossPct: totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested) * 100 : 0,
      positionsCount: (investments || []).length
    },
    investments: investments || [],
    whatsapp: {
      phone: settingsMap[`whatsapp_phone_${userId}`] || user.phone || null,
      enabled: isEnabled,
      hasApiKey,
      hours,
      lastSent: settingsMap[`digest:last_sent_at:${userId}`] || null,
      lastStatus: settingsMap[`digest:last_status:${userId}`] || null,
    }
  };
}

export async function adminSoftDeleteUser(userId: number) {
  await pool.query("UPDATE users SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL", [userId]);
  await pool.query("UPDATE investments SET deleted_at = NOW() WHERE user_id = ? AND deleted_at IS NULL", [userId]);
  addActivityLog("USER_BAN", `Usuario ID ${userId} suspendido / desactivado`);
}

export async function adminRestoreUser(userId: number) {
  await pool.query("UPDATE users SET deleted_at = NULL WHERE id = ?", [userId]);
  await pool.query("UPDATE investments SET deleted_at = NULL WHERE user_id = ?", [userId]);
  addActivityLog("USER_RESTORE", `Usuario ID ${userId} restaurado y reactivado`);
}

export async function adminSetAdmin(userId: number, isAdmin: boolean) {
  await pool.query("UPDATE users SET is_admin = ? WHERE id = ?", [isAdmin ? 1 : 0, userId]);
  addActivityLog("USER_ADMIN", `Usuario ID ${userId} ${isAdmin ? "promovido a Administrador" : "degradado a Usuario estándar"}`);
}

// ─── Catalog CRUD & Price Engine ──────────────────────────────────────────────

export async function getAdminCatalogStats() {
  const [[totalRow], [noTickerRow], [noPriceRow], [topRow]] = await Promise.all([
    pool.query<any[]>("SELECT COUNT(*) AS total FROM fund_catalog"),
    pool.query<any[]>("SELECT COUNT(*) AS total FROM fund_catalog WHERE yahoo_ticker IS NULL OR yahoo_ticker = ''"),
    pool.query<any[]>("SELECT COUNT(*) AS total FROM fund_catalog fc LEFT JOIN fund_prices fp ON fp.isin = fc.isin WHERE fp.isin IS NULL"),
    pool.query<any[]>(`
      SELECT fc.isin, fc.name, fc.bank, fc.category, fc.risk_level, fc.yahoo_ticker, fp.price, fp.updated_at, COUNT(i.id) AS usage_count
      FROM fund_catalog fc
      LEFT JOIN investments i ON i.isin = fc.isin AND i.deleted_at IS NULL
      LEFT JOIN fund_prices fp ON fp.isin = fc.isin
      GROUP BY fc.isin
      ORDER BY usage_count DESC, fc.name ASC
      LIMIT 15
    `),
  ]);

  return {
    total: Number(totalRow[0]?.total ?? 0),
    missing_ticker: Number(noTickerRow[0]?.total ?? 0),
    missing_price: Number(noPriceRow[0]?.total ?? 0),
    top_funds: topRow as any[],
  };
}

export async function adminSearchCatalog(q: string, limit = 50) {
  const [rows] = await pool.query<any[]>(
    `SELECT fc.isin, fc.name, fc.bank, fc.category, fc.risk_level, fc.currency, fc.yahoo_ticker, fp.price, fp.updated_at,
            COUNT(i.id) AS usage_count
     FROM fund_catalog fc
     LEFT JOIN fund_prices fp ON fp.isin = fc.isin
     LEFT JOIN investments i ON i.isin = fc.isin AND i.deleted_at IS NULL
     WHERE fc.isin LIKE ? OR fc.name LIKE ? OR fc.bank LIKE ? OR fc.category LIKE ?
     GROUP BY fc.isin
     ORDER BY usage_count DESC, fc.name ASC
     LIMIT ?`,
    [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, limit]
  );
  return rows;
}

export async function adminAddCatalogFund(data: {
  isin: string;
  name: string;
  bank: string;
  category: string;
  risk_level?: number;
  currency?: string;
  yahoo_ticker?: string | null;
  base_price?: number | null;
}) {
  const isin = data.isin.toUpperCase().trim();
  await pool.query(
    `INSERT INTO fund_catalog (isin, name, bank, category, risk_level, currency, yahoo_ticker, base_price, last_updated)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE name = VALUES(name), bank = VALUES(bank), category = VALUES(category), risk_level = VALUES(risk_level), yahoo_ticker = VALUES(yahoo_ticker), last_updated = NOW()`,
    [isin, data.name.trim(), data.bank.trim(), data.category.trim(), data.risk_level ?? 3, data.currency || "EUR", data.yahoo_ticker?.trim() || null, data.base_price ?? null]
  );
  if (data.base_price && data.base_price > 0) {
    await queries.setFundPrice(isin, data.base_price, data.currency || "EUR");
  }
  addActivityLog("CATALOG_ADD", `Añadido fondo ${isin} (${data.name}) al catálogo`);
  return { ok: true, isin };
}

export async function adminUpdateCatalogFund(isin: string, data: {
  name?: string;
  bank?: string;
  category?: string;
  risk_level?: number;
  yahoo_ticker?: string | null;
}) {
  const cleanIsin = isin.toUpperCase().trim();
  const updates: string[] = ["last_updated = NOW()"];
  const params: any[] = [];
  if (data.name !== undefined) { updates.push("name = ?"); params.push(data.name.trim()); }
  if (data.bank !== undefined) { updates.push("bank = ?"); params.push(data.bank.trim()); }
  if (data.category !== undefined) { updates.push("category = ?"); params.push(data.category.trim()); }
  if (data.risk_level !== undefined) { updates.push("risk_level = ?"); params.push(data.risk_level); }
  if (data.yahoo_ticker !== undefined) { updates.push("yahoo_ticker = ?"); params.push(data.yahoo_ticker?.trim() || null); }
  params.push(cleanIsin);
  await pool.query(`UPDATE fund_catalog SET ${updates.join(", ")} WHERE isin = ?`, params);
  addActivityLog("CATALOG_UPDATE", `Actualizado fondo ${cleanIsin}`);
  return { ok: true };
}

export async function adminDeleteCatalogFund(isin: string) {
  const cleanIsin = isin.toUpperCase().trim();
  const [inv] = await pool.query<any[]>("SELECT COUNT(*) as count FROM investments WHERE isin = ? AND deleted_at IS NULL", [cleanIsin]);
  if (inv[0]?.count > 0) {
    throw new Error(`No se puede eliminar: ${inv[0].count} usuario(s) tienen este fondo en su cartera activa`);
  }
  await pool.query("DELETE FROM fund_prices WHERE isin = ?", [cleanIsin]);
  await pool.query("DELETE FROM fund_catalog WHERE isin = ?", [cleanIsin]);
  addActivityLog("CATALOG_DELETE", `Eliminado fondo ${cleanIsin} del catálogo`);
  return { ok: true };
}

export async function adminUpdateTicker(isin: string, ticker: string | null) {
  await pool.query("UPDATE fund_catalog SET yahoo_ticker = ? WHERE isin = ?", [ticker || null, isin]);
  addActivityLog("CATALOG_UPDATE", `Asignado ticker Yahoo '${ticker || "—"}' al fondo ${isin}`);
}

export async function adminInvalidatePrice(isin: string) {
  await pool.query("DELETE FROM fund_prices WHERE isin = ?", [isin]);
  addActivityLog("PRICE_REFRESH", `Invalidado precio en caché para ${isin}`);
}

export async function adminRefreshFundPrice(isin: string) {
  const cleanIsin = isin.toUpperCase().trim();
  const { fetchQueFondosData } = await import("./quefondos");
  const { fetchCurrentPrice, tryDiscoverTicker } = await import("./yahoo");
  const { invalidatePriceCache } = await import("./sentinel");

  invalidatePriceCache(cleanIsin);
  let newPrice: number | null = null;
  let source = "none";

  // 1. Try QueFondos first
  const qf = await fetchQueFondosData(cleanIsin).catch(() => null);
  if (qf?.price && qf.price > 0) {
    newPrice = qf.price;
    source = "QueFondos";
    await queries.setFundPrice(cleanIsin, newPrice, "EUR");
  } else {
    // 2. Try Yahoo Finance
    const catalog = await queries.getFundCatalogByIsin(cleanIsin);
    let ticker = catalog?.yahoo_ticker ?? (await tryDiscoverTicker(cleanIsin).catch(() => null));
    if (ticker) {
      const yf = await fetchCurrentPrice(ticker).catch(() => null);
      if (yf?.price && yf.price > 0) {
        newPrice = yf.price;
        source = "Yahoo Finance";
        await queries.setFundPrice(cleanIsin, newPrice, yf.currency || "EUR");
      }
    }
  }

  if (newPrice) {
    addActivityLog("PRICE_REFRESH", `Actualizado precio de ${cleanIsin} (€${newPrice.toFixed(4)}) vía ${source}`);
    return { ok: true, isin: cleanIsin, price: newPrice, source, updated_at: new Date().toISOString() };
  } else {
    throw new Error(`No se pudo obtener la cotización en directo para ${cleanIsin}`);
  }
}

export async function adminRefreshAllPrices() {
  const [rows] = await pool.query<any[]>(
    "SELECT DISTINCT isin FROM investments WHERE deleted_at IS NULL"
  );
  const isins: string[] = rows.map(r => r.isin);
  addActivityLog("SYSTEM_REFRESH", `Iniciada sincronización masiva de precios para ${isins.length} fondos`);
  
  // Background runner
  (async () => {
    let success = 0;
    for (const isin of isins) {
      try {
        await adminRefreshFundPrice(isin);
        success++;
      } catch {}
      await new Promise(r => setTimeout(r, 250));
    }
    addActivityLog("SYSTEM_REFRESH", `Sincronización masiva de precios completada (${success}/${isins.length} actualizados con éxito)`);
  })();

  return { ok: true, total: isins.length };
}

// ─── Notifications & WhatsApp Management ─────────────────────────────────────

export async function getAdminNotificationStats() {
  const [usersRows] = await pool.query<any[]>(
    "SELECT id, username, email, phone FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC"
  );
  
  const [settingsRows] = await pool.query<any[]>(
    "SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'digest:%'"
  );

  const settingsMap = new Map<string, string>();
  for (const r of settingsRows) {
    settingsMap.set(r.setting_key, r.setting_value);
  }

  let configuredCount = 0;
  let enabledCount = 0;

  const userDigestStatus = usersRows.map(u => {
    const hasPhone = Boolean(u.phone && u.phone.trim() !== "");
    const apiKey = settingsMap.get(`digest:api_key:${u.id}`) || process.env.CALLMEBOT_API_KEY || null;
    const isConfigured = Boolean(hasPhone && apiKey);
    const enabledSetting = settingsMap.get(`digest:enabled:${u.id}`);
    const isEnabled = isConfigured && enabledSetting !== "false" && enabledSetting !== "0";

    if (isConfigured) configuredCount++;
    if (isEnabled) enabledCount++;

    return {
      userId: String(u.id),
      name: u.username || u.email || `User ${u.id}`,
      email: u.email || "",
      phone: u.phone || null,
      isConfigured,
      isEnabled,
      lastStatus: settingsMap.get(`digest:last_status:${u.id}`) || null,
      lastSent: settingsMap.get(`digest:last_sent_at:${u.id}`) || null,
      lastTestAt: settingsMap.get(`digest:last_test_at:${u.id}`) || null,
    };
  });

  const [lastSentRow] = await pool.query<any[]>(
    "SELECT setting_value FROM settings WHERE setting_key LIKE 'digest:last_sent_at:%' ORDER BY setting_value DESC LIMIT 1"
  );

  return {
    configured: configuredCount,
    enabled: enabledCount,
    total_users: usersRows.length,
    user_statuses: userDigestStatus,
    last_global_digest: lastSentRow[0]?.setting_value ?? null,
  };
}

export async function getAdminNotificationPreview(userId?: number) {
  const { previewDigest } = await import("./digest");
  let targetUserId = userId;
  if (!targetUserId) {
    const [users] = await pool.query<any[]>(
      "SELECT u.id FROM users u JOIN investments i ON i.user_id = u.id WHERE u.deleted_at IS NULL GROUP BY u.id ORDER BY COUNT(i.id) DESC LIMIT 1"
    );
    targetUserId = users[0]?.id || 1;
  }
  try {
    const message = await previewDigest({ slot: "manual", timezone: "Europe/Madrid" }, targetUserId);
    return { userId: targetUserId, message };
  } catch (err) {
    return { 
      userId: targetUserId, 
      message: "📊 *FondTracker — Resumen Diario*\n\n💼 *Cartera Global*\n📈 *Rentabilidad en directo*\n\n⚡ Actualizado automáticamente por FondTracker." 
    };
  }
}
