import { pool } from "./src/server/db.ts";

try {
  // Update user 1's investment for ES0147077038
  const res = await pool.query(
    `UPDATE investments 
     SET shares = 61.371217, purchase_price = 16.294283 
     WHERE user_id = 1 AND isin = 'ES0147077038'`,
    []
  );
  console.log("Updated Ibercaja Audaz stats successfully:", res);
} catch (e: any) {
  console.log("Error:", e.message);
} finally {
  await pool.end();
}
