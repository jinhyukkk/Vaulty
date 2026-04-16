import Database from "better-sqlite3";

const dbFile =
  process.env.DATABASE_URL?.replace(/^file:/, "") ?? "./vaultly.db";
const db = new Database(dbFile, { readonly: true });

for (const table of [
  "accounts",
  "instruments",
  "transactions",
  "price_snapshots",
  "fx_rates",
]) {
  const row = db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as {
    c: number;
  };
  console.log(`${table}: ${row.c}`);
}
