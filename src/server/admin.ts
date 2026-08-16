import { pool } from "./db";
import { queries } from "./db";

// ─── Admin Queries ─────────────────────────────────────────────────────────────

export async function getAdminOverview() {
  const [[usersRow], [activeRow], [newWeekRow], [invRow], [aumRow], [catalogRow], [pricesRow], [waRow], [authRow], [historyRow]] =
    await Promise.all([
      pool.query<any[]>("SELECT COUNT(*) AS total FROM users"),
      pool.query<any[]>("SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL"),
      pool.query<any[]>("SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL 7 DAY"),
      pool.query<any[]>("SELECT COUNT(*) AS total FROM investments WHERE deleted_at IS NULL"),
      pool.query<any[]>("SELECT COALESCE(SUM(CAST(shares AS DECIMAL(20,6)) * CAST(purchase_price AS DECIMAL(20,6))), 0) AS aum FROM investments WHERE deleted_at IS NULL"),
      pool.query<any[]>("SELECT COUNT(*) AS total FROM fund_catalog"),
      pool.query<any[]>("SELECT COUNT(*) AS total FROM fund_prices"),
      pool.query<any[]>("SELECT COUNT(*) AS total FROM settings WHERE setting_key LIKE 'whatsapp_enabled_%' AND setting_value = '1'"),
      pool.query<any[]>("SELECT SUM(google_id IS NOT NULL) AS google, SUM(github_id IS NOT NULL) AS github, SUM(password_hash IS NOT NULL) AS password FROM users WHERE deleted_at IS NULL"),
      pool.query<any[]>("SELECT purchase_date as date, SUM(CAST(shares AS DECIMAL(20,6)) * CAST(purchase_price AS DECIMAL(20,6))) AS daily_amount FROM investments WHERE deleted_at IS NULL GROUP BY purchase_date ORDER BY purchase_date ASC")
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
    aum_history_raw: historyRow.map((r: any) => ({ date: r.date, amount: Number(r.daily_amount) }))
  };
}

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
      (SELECT setting_value FROM settings WHERE setting_key = CONCAT('whatsapp_enabled_', u.id)) AS whatsapp_enabled,
      (SELECT setting_value FROM settings WHERE setting_key = CONCAT('digest:last_sent_at:', u.id)) AS last_digest
    FROM users u
    LEFT JOIN investments i ON i.user_id = u.id AND i.deleted_at IS NULL
  `;
  const params: any[] = [];

  const conditions: string[] = [];
  if (search) {
    conditions.push("(u.email LIKE ? OR u.username LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status === "active") {
    conditions.push("u.deleted_at IS NULL");
  } else if (status === "deleted") {
    conditions.push("u.deleted_at IS NOT NULL");
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

export async function adminSoftDeleteUser(userId: number) {
  await pool.query("UPDATE users SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL", [userId]);
  await pool.query("UPDATE investments SET deleted_at = NOW() WHERE user_id = ? AND deleted_at IS NULL", [userId]);
}

export async function adminRestoreUser(userId: number) {
  await pool.query("UPDATE users SET deleted_at = NULL WHERE id = ?", [userId]);
  await pool.query("UPDATE investments SET deleted_at = NULL WHERE user_id = ?", [userId]);
}

export async function adminSetAdmin(userId: number, isAdmin: boolean) {
  await pool.query("UPDATE users SET is_admin = ? WHERE id = ?", [isAdmin ? 1 : 0, userId]);
}

export async function getAdminCatalogStats() {
  const [[totalRow], [noTickerRow], [noPriceRow], [topRow]] = await Promise.all([
    pool.query<any[]>("SELECT COUNT(*) AS total FROM fund_catalog"),
    pool.query<any[]>("SELECT COUNT(*) AS total FROM fund_catalog WHERE yahoo_ticker IS NULL OR yahoo_ticker = ''"),
    pool.query<any[]>("SELECT COUNT(*) AS total FROM fund_catalog fc LEFT JOIN fund_prices fp ON fp.isin = fc.isin WHERE fp.isin IS NULL"),
    pool.query<any[]>(`
      SELECT fc.isin, fc.name, fc.bank, fc.yahoo_ticker, fp.price, fp.updated_at, COUNT(i.id) AS usage_count
      FROM fund_catalog fc
      LEFT JOIN investments i ON i.isin = fc.isin AND i.deleted_at IS NULL
      LEFT JOIN fund_prices fp ON fp.isin = fc.isin
      GROUP BY fc.isin
      ORDER BY usage_count DESC
      LIMIT 10
    `),
  ]);

  return {
    total: Number(totalRow[0]?.total ?? 0),
    missing_ticker: Number(noTickerRow[0]?.total ?? 0),
    missing_price: Number(noPriceRow[0]?.total ?? 0),
    top_funds: topRow as any[],
  };
}

export async function adminSearchCatalog(q: string, limit = 30) {
  const [rows] = await pool.query<any[]>(
    `SELECT fc.isin, fc.name, fc.bank, fc.category, fc.yahoo_ticker, fp.price, fp.updated_at,
            COUNT(i.id) AS usage_count
     FROM fund_catalog fc
     LEFT JOIN fund_prices fp ON fp.isin = fc.isin
     LEFT JOIN investments i ON i.isin = fc.isin AND i.deleted_at IS NULL
     WHERE fc.isin LIKE ? OR fc.name LIKE ? OR fc.bank LIKE ?
     GROUP BY fc.isin
     ORDER BY usage_count DESC, fc.name ASC
     LIMIT ?`,
    [`%${q}%`, `%${q}%`, `%${q}%`, limit]
  );
  return rows;
}

export async function adminUpdateTicker(isin: string, ticker: string | null) {
  await pool.query("UPDATE fund_catalog SET yahoo_ticker = ? WHERE isin = ?", [ticker || null, isin]);
}

export async function adminInvalidatePrice(isin: string) {
  await pool.query("DELETE FROM fund_prices WHERE isin = ?", [isin]);
}

export async function getAdminNotificationStats() {
  const [configuredRows] = await pool.query<any[]>(
    "SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'whatsapp_phone_%' AND setting_value != ''"
  );
  const [enabledRows] = await pool.query<any[]>(
    "SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'whatsapp_enabled_%'"
  );
  const [statusRows] = await pool.query<any[]>(
    "SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'digest:last_status:%'"
  );
  const [lastSentRows] = await pool.query<any[]>(
    "SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'digest:last_sent_at:%' ORDER BY setting_value DESC"
  );

  const enabledMap: Record<string, boolean> = {};
  for (const row of enabledRows) {
    const uid = row.setting_key.replace("whatsapp_enabled_", "");
    enabledMap[uid] = row.setting_value === "1";
  }

  // Get users map to translate IDs to names
  const [usersRows] = await pool.query<any[]>("SELECT id, username, email FROM users");
  const userMap = Object.fromEntries(usersRows.map(u => [String(u.id), { name: u.username, email: u.email }]));

  const userDigestStatus: { userId: string; name: string; lastStatus: string | null; lastSent: string | null }[] = [];
  
  const userIds = new Set<string>();
  for(const r of configuredRows) userIds.add(r.setting_key.replace("whatsapp_phone_", ""));
  for(const r of statusRows) userIds.add(r.setting_key.replace("digest:last_status:", ""));

  for (const uid of userIds) {
    const statusRow = statusRows.find(r => r.setting_key === `digest:last_status:${uid}`);
    const lastSentRow = lastSentRows.find(r => r.setting_key === `digest:last_sent_at:${uid}`);
    const user = userMap[uid];
    userDigestStatus.push({
      userId: uid,
      name: user?.name || user?.email || `User ${uid}`,
      lastStatus: statusRow?.setting_value ?? null,
      lastSent: lastSentRow?.setting_value ?? null,
    });
  }

  return {
    configured: configuredRows.length,
    enabled: Object.values(enabledMap).filter(Boolean).length,
    total_users: usersRows.length,
    user_statuses: userDigestStatus,
    last_global_digest: lastSentRows[0]?.setting_value ?? null,
  };
}
