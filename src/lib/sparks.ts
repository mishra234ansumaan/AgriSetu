import { db } from "@/db";
import { prices } from "@/db/schema";
import { desc } from "drizzle-orm";

/** 14-day modal-price sparkline data for every crop:mandi pair */
export async function dbPricesForSpark(): Promise<Record<string, number[]>> {
  const rows = await db
    .select({ cropId: prices.cropId, mandiId: prices.mandiId, date: prices.date, modalP: prices.modalP })
    .from(prices)
    .orderBy(desc(prices.date))
    .limit(4000);

  const grouped: Record<string, { date: string; v: number }[]> = {};
  for (const r of rows) {
    const k = `${r.cropId}:${r.mandiId}`;
    (grouped[k] ??= []).push({ date: r.date, v: r.modalP });
  }
  const out: Record<string, number[]> = {};
  for (const [k, arr] of Object.entries(grouped)) {
    out[k] = arr
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)
      .map((x) => x.v);
  }
  return out;
}
