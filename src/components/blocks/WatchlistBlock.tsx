import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getWatchlist } from "@/lib/portfolio/watchlist";
import { WatchlistClient } from "./WatchlistClient";

export async function WatchlistBlock() {
  const [rows, watched] = await Promise.all([
    getWatchlist(),
    db.select({ instrumentId: schema.watchlistItems.instrumentId }).from(schema.watchlistItems),
  ]);
  const watchedIds = watched.map((w) => w.instrumentId);
  const all = await db
    .select({
      id: schema.instruments.id,
      symbol: schema.instruments.symbol,
      name: schema.instruments.name,
      assetClass: schema.instruments.assetClass,
    })
    .from(schema.instruments)
    .where(eq(schema.instruments.kind, "asset"))
    .orderBy(asc(schema.instruments.symbol));
  const addable = all.filter((i) => !watchedIds.includes(i.id));

  return <WatchlistClient rows={rows} addable={addable} />;
}
