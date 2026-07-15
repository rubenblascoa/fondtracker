import mysql from "mysql2/promise";

const DB_HOST = process.env.MYSQL_HOST ?? "127.0.0.1";
const DB_PORT = Number(process.env.MYSQL_PORT ?? 3306);
const DB_USER = process.env.MYSQL_USER ?? "root";
const DB_PASSWORD = process.env.MYSQL_PASSWORD ?? "";
const DB_NAME = process.env.MYSQL_DATABASE ?? "fondtracker";

export const pool = await mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4",
});

async function createIndexIfNotExists(indexName: string, table: string, columns: string) {
  const [rows] = await pool.query<any[]>(
    `SELECT COUNT(*) AS cnt FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
    [table, indexName]
  );
  if (rows[0]?.cnt > 0) return;
  await pool.query(`CREATE INDEX ${indexName} ON ${table}(${columns})`);
}

export async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_email (email),
      UNIQUE KEY unique_username (username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS investments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL DEFAULT 1,
      isin VARCHAR(12) NOT NULL,
      name VARCHAR(255) NOT NULL,
      bank VARCHAR(255) NOT NULL DEFAULT '',
      category VARCHAR(100) NOT NULL DEFAULT '',
      ticker VARCHAR(30) DEFAULT NULL,
      shares DECIMAL(15,6) NOT NULL,
      purchase_price DECIMAL(15,6) NOT NULL,
      purchase_date DATE NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
      notes TEXT,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await createIndexIfNotExists("idx_investments_isin", "investments", "isin");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fund_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fund_id INT NOT NULL,
      value DECIMAL(15,2) NOT NULL,
      recorded_at DATETIME NOT NULL,
      FOREIGN KEY (fund_id) REFERENCES investments(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await createIndexIfNotExists("idx_fund_history_fund", "fund_history", "fund_id");
  await createIndexIfNotExists("idx_fund_history_date", "fund_history", "recorded_at DESC");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      setting_key VARCHAR(255) PRIMARY KEY,
      setting_value TEXT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fund_catalog (
      id INT AUTO_INCREMENT PRIMARY KEY,
      isin VARCHAR(12) NOT NULL,
      name VARCHAR(500) NOT NULL,
      bank VARCHAR(255) NOT NULL DEFAULT '',
      category VARCHAR(100) NOT NULL DEFAULT '',
      risk_level INT NOT NULL DEFAULT 3,
      currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
      yahoo_ticker VARCHAR(30) DEFAULT NULL,
      base_price DECIMAL(15,6) DEFAULT NULL,
      last_updated DATETIME DEFAULT NULL,
      UNIQUE KEY unique_isin (isin),
      FULLTEXT KEY ft_fund_search (name, isin, bank, category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS fund_prices (
      isin VARCHAR(12) NOT NULL,
      price DECIMAL(15,6) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (isin),
      FOREIGN KEY (isin) REFERENCES fund_catalog(isin) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);



  const [cols] = await pool.query<any[]>(
    "SHOW COLUMNS FROM investments LIKE 'ticker'"
  );
  if (cols.length === 0) {
    await pool.query("ALTER TABLE investments ADD COLUMN ticker VARCHAR(30) DEFAULT NULL AFTER category");
  }

  const [userCols] = await pool.query<any[]>(
    "SHOW COLUMNS FROM investments LIKE 'user_id'"
  );
  if (userCols.length === 0) {
    await pool.query("ALTER TABLE investments ADD COLUMN user_id INT NOT NULL DEFAULT 1 AFTER id");
    await pool.query("CREATE INDEX idx_investments_user ON investments(user_id)");
  }
}

export async function closeDatabase() {
  await pool.end();
}

export type InvestmentRow = {
  id: number;
  user_id: number;
  isin: string;
  name: string;
  bank: string;
  category: string;
  ticker: string | null;
  shares: number;
  purchase_price: number;
  purchase_date: string;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type InvestmentWithStats = InvestmentRow & {
  total_invested: number;
  current_value: number;
  profit_loss: number;
  profit_loss_pct: number;
  current_price: number | null;
};

export const queries = {
  async listInvestments(userId?: number): Promise<InvestmentRow[]> {
    if (userId != null) {
      const [rows] = await pool.query<InvestmentRow[]>(
        "SELECT * FROM investments WHERE user_id = ? ORDER BY created_at DESC",
        [userId]
      );
      return rows;
    }
    const [rows] = await pool.query<InvestmentRow[]>(
      "SELECT * FROM investments ORDER BY created_at DESC"
    );
    return rows;
  },

  async getInvestment(id: number, userId?: number): Promise<InvestmentRow | null> {
    if (userId != null) {
      const [rows] = await pool.query<InvestmentRow[]>(
        "SELECT * FROM investments WHERE id = ? AND user_id = ?",
        [id, userId]
      );
      return rows[0] ?? null;
    }
    const [rows] = await pool.query<InvestmentRow[]>(
      "SELECT * FROM investments WHERE id = ?",
      [id]
    );
    return rows[0] ?? null;
  },

  async insertInvestment(
    data: {
      user_id: number;
      isin: string;
      name: string;
      bank: string;
      category: string;
      ticker: string | null;
      shares: number;
      purchase_price: number;
      purchase_date: string;
      currency: string;
      notes?: string;
    },
    createdAt: string
  ): Promise<InvestmentRow> {
    const [result] = await pool.query(
      `INSERT INTO investments (user_id, isin, name, bank, category, ticker, shares, purchase_price, purchase_date, currency, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.user_id,
        data.isin,
        data.name,
        data.bank,
        data.category,
        data.ticker,
        data.shares,
        data.purchase_price,
        data.purchase_date,
        data.currency,
        data.notes ?? null,
        createdAt,
        createdAt,
      ]
    );
    const id = (result as any).insertId;
    return (await this.getInvestment(id))!;
  },

  async updateInvestment(
    id: number,
    data: Partial<{
      shares: number;
      purchase_price: number;
      purchase_date: string;
      notes: string;
    }>,
    updatedAt: string
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.shares != null) {
      fields.push("shares = ?");
      values.push(data.shares);
    }
    if (data.purchase_price != null) {
      fields.push("purchase_price = ?");
      values.push(data.purchase_price);
    }
    if (data.purchase_date != null) {
      fields.push("purchase_date = ?");
      values.push(data.purchase_date);
    }
    if (data.notes != null) {
      fields.push("notes = ?");
      values.push(data.notes);
    }
    if (fields.length === 0) return;
    fields.push("updated_at = ?");
    values.push(updatedAt);
    values.push(id);
    await pool.query(
      `UPDATE investments SET ${fields.join(", ")} WHERE id = ?`,
      values
    );
  },

  async deleteInvestment(id: number, userId?: number): Promise<void> {
    if (userId != null) {
      await pool.query("DELETE FROM investments WHERE id = ? AND user_id = ?", [id, userId]);
      return;
    }
    await pool.query("DELETE FROM investments WHERE id = ?", [id]);
  },

  async updateInvestmentTicker(id: number, ticker: string | null): Promise<void> {
    await pool.query("UPDATE investments SET ticker = ? WHERE id = ?", [ticker, id]);
  },

  async getInvestmentsByIsin(isin: string): Promise<InvestmentRow[]> {
    const [rows] = await pool.query<InvestmentRow[]>(
      "SELECT * FROM investments WHERE isin = ?",
      [isin]
    );
    return rows;
  },

  async getSetting(key: string): Promise<string | null> {
    const [rows] = await pool.query<{ setting_value: string }[]>(
      "SELECT setting_value FROM settings WHERE setting_key = ?",
      [key]
    );
    return rows[0]?.setting_value ?? null;
  },

  async setSetting(key: string, value: string): Promise<void> {
    await pool.query(
      `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [key, value]
    );
  },

  async searchFundCatalog(query: string, bank?: string, category?: string, limit = 10000): Promise<any[]> {
    let sql: string;
    let params: any[];

    if (query && query.trim()) {
      sql = `SELECT * FROM fund_catalog WHERE MATCH(name, isin, bank, category) AGAINST(? IN BOOLEAN MODE)`;
      params = [query.trim().split(/\s+/).map(w => `+${w}*`).join(" ")];
    } else {
      sql = `SELECT * FROM fund_catalog WHERE 1=1`;
      params = [];
    }
    if (bank) {
      sql += ` AND bank = ?`;
      params.push(bank);
    }
    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }
    sql += ` ORDER BY name ASC LIMIT ?`;
    params.push(limit);

    let [rows] = await pool.query(sql, params);

    // Fallback to LIKE if fulltext returned nothing
    if ((rows as any[]).length === 0 && query && query.trim()) {
      let fallbackSql = `SELECT * FROM fund_catalog WHERE (name LIKE ? OR isin LIKE ? OR bank LIKE ? OR category LIKE ?)`;
      const likeParam = `%${query.trim()}%`;
      const fallbackParams = [likeParam, likeParam, likeParam, likeParam];
      if (bank) {
        fallbackSql += ` AND bank = ?`;
        fallbackParams.push(bank);
      }
      if (category) {
        fallbackSql += ` AND category = ?`;
        fallbackParams.push(category);
      }
      fallbackSql += ` ORDER BY name ASC LIMIT ?`;
      fallbackParams.push(limit);

      const [fallbackRows] = await pool.query(fallbackSql, fallbackParams);
      rows = fallbackRows;
    }

    return rows as any[];
  },

  async getFundCatalogByIsin(isin: string): Promise<any | null> {
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM fund_catalog WHERE isin = ?",
      [isin]
    );
    return rows[0] ?? null;
  },

  async getFundCatalogBanks(): Promise<string[]> {
    const [rows] = await pool.query<{ bank: string }[]>(
      "SELECT DISTINCT bank FROM fund_catalog ORDER BY bank ASC"
    );
    return rows.map((r) => r.bank);
  },

  async getFundCatalogCategories(): Promise<string[]> {
    const [rows] = await pool.query<{ category: string }[]>(
      "SELECT DISTINCT category FROM fund_catalog ORDER BY category ASC"
    );
    return rows.map((r) => r.category);
  },

  async insertFundCatalogBatch(rows: any[]): Promise<number> {
    if (rows.length === 0) return 0;
    const values = rows.map((r) => [r.isin, r.name, r.bank, r.category, r.risk_level ?? 3, r.currency ?? "EUR", r.yahoo_ticker ?? null]);
    const [result] = await pool.query(
      `INSERT IGNORE INTO fund_catalog (isin, name, bank, category, risk_level, currency, yahoo_ticker) VALUES ?`,
      [values]
    );
    return (result as any).affectedRows;
  },

  async getFundPrice(isin: string): Promise<{ price: number; currency: string; updated_at: string } | null> {
    const [rows] = await pool.query<any[]>(
      "SELECT price, currency, updated_at FROM fund_prices WHERE isin = ?",
      [isin]
    );
    return rows[0] ?? null;
  },

  async setFundPrice(isin: string, price: number, currency: string = "EUR"): Promise<void> {
    await pool.query(
      `INSERT INTO fund_prices (isin, price, currency, updated_at) VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE price = VALUES(price), updated_at = NOW()`,
      [isin, price, currency]
    );
  },

  async getAllFundIsins(): Promise<string[]> {
    const [rows] = await pool.query<{ isin: string }[]>(
      "SELECT isin FROM fund_catalog"
    );
    return rows.map((r) => r.isin);
  },
};
