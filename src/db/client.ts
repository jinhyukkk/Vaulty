import "server-only";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

const dbFile =
  process.env.DATABASE_URL?.replace(/^file:/, "") ?? "./vaultly.db";

declare global {
  // eslint-disable-next-line no-var
  var __vaultlyDb: Database.Database | undefined;
}

// Next 개발 모드 HMR에서 커넥션 누수 방지
const sqlite = globalThis.__vaultlyDb ?? new Database(dbFile);
if (process.env.NODE_ENV !== "production") globalThis.__vaultlyDb = sqlite;

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { schema };
