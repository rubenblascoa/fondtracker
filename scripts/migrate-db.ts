/**
 * Copia todos los datos de la BD actual (MYSQL_* en .env, p.ej. Aiven)
 * a una BD nueva (TIDB_* en .env, p.ej. TiDB Cloud).
 *
 * Uso:  bun scripts/migrate-db.ts
 *
 * Variables necesarias en .env:
 *   TIDB_HOST, TIDB_PORT, TIDB_USER, TIDB_PASSWORD, TIDB_DATABASE
 * Opcional: MYSQL_SSL=true si la BD de origen exige TLS.
 */
import mysql from "mysql2/promise";

const required = ["TIDB_HOST", "TIDB_USER", "TIDB_PASSWORD", "TIDB_DATABASE"];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`Faltan variables en .env: ${missing.join(", ")}`);
  process.exit(1);
}

const tls = { minVersion: "TLSv1.2", rejectUnauthorized: true };

const src = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  charset: "utf8mb4",
  dateStrings: true,
  ...(process.env.MYSQL_SSL === "true" ? { ssl: tls } : {}),
});

const destConfig = {
  host: process.env.TIDB_HOST!,
  port: Number(process.env.TIDB_PORT ?? 4000),
  user: process.env.TIDB_USER!,
  password: process.env.TIDB_PASSWORD!,
  database: process.env.TIDB_DATABASE!,
};

// Crea el esquema en destino reutilizando ensureSchema() de la app
process.env.MYSQL_HOST = destConfig.host;
process.env.MYSQL_PORT = String(destConfig.port);
process.env.MYSQL_USER = destConfig.user;
process.env.MYSQL_PASSWORD = destConfig.password;
process.env.MYSQL_DATABASE = destConfig.database;
process.env.MYSQL_SSL = "true";
const { ensureSchema, closeDatabase } = await import("../src/server/db.ts");
console.log("Creando esquema en destino…");
await ensureSchema();
await closeDatabase();

const dest = await mysql.createConnection({ ...destConfig, charset: "utf8mb4", dateStrings: true, ssl: tls });
await dest.query("SET FOREIGN_KEY_CHECKS = 0");

const [tables] = await src.query<any[]>("SHOW TABLES");
const BATCH = 500;

for (const row of tables) {
  const table = Object.values(row)[0] as string;
  const [rows] = await src.query<any[]>(`SELECT * FROM \`${table}\``);

  // Asegura que la tabla existe en destino (por si no la crea ensureSchema)
  const [exists] = await dest.query<any[]>("SHOW TABLES LIKE ?", [table]);
  if (exists.length === 0) {
    const [[create]] = await src.query<any[]>(`SHOW CREATE TABLE \`${table}\``);
    await dest.query(create["Create Table"].replace(/,\s*FULLTEXT KEY[^\n]*/g, ""));
  }

  await dest.query(`DELETE FROM \`${table}\``);
  if (rows.length > 0) {
    const cols = Object.keys(rows[0]);
    const colList = cols.map(c => `\`${c}\``).join(", ");
    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH).map(r => cols.map(c => r[c]));
      await dest.query(`INSERT INTO \`${table}\` (${colList}) VALUES ?`, [chunk]);
    }
  }
  const [[{ n }]] = await dest.query<any[]>(`SELECT COUNT(*) AS n FROM \`${table}\``);
  console.log(`  ${table}: ${rows.length} filas origen → ${n} filas destino`);
}

await dest.query("SET FOREIGN_KEY_CHECKS = 1");
await src.end();
await dest.end();
console.log("Migración completada.");
