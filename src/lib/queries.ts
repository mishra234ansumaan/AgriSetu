import { db } from "@/db";
import { sql, eq, and, desc, lt } from "drizzle-orm";
import {
  prices,
  mandis,
  crops,
  demands,
  buyers,
  pools,
  facilities,
} from "@/db/schema";
import { districtDistance, quoteMandi } from "@/lib/odisha";

export type CropRow = typeof crops.$inferSelect;
export type MandiRow = typeof mandis.$inferSelect;

export async function latestPriceDate(): Promise<string> {
  const rows = await db.select({ d: sql<string>`max(${prices.date})` }).from(prices);
  return rows[0]?.d ?? new Date().toISOString().slice(0, 10);
}

export async function previousPriceDate(latest: string): Promise<string> {
  const rows = await db
    .select({ d: sql<string>`max(${prices.date})` })
    .from(prices)
    .where(lt(prices.date, latest));
  return rows[0]?.d ?? latest;
}

export interface SnapshotRow {
  cropId: number;
  cropName: string;
  cropOdia: string;
  icon: string;
  category: string;
  mandiId: number;
  mandiName: string;
  district: string;
  modalP: number;
  minP: number;
  maxP: number;
  prevModalP: number;
  changePct: number;
}

export async function priceSnapshot(): Promise<SnapshotRow[]> {
  const latest = await latestPriceDate();
  const prev = await previousPriceDate(latest);
  const [todayRows, prevRows] = await Promise.all([
    db
      .select({
        cropId: prices.cropId,
        mandiId: prices.mandiId,
        modalP: prices.modalP,
        minP: prices.minP,
        maxP: prices.maxP,
        cropName: crops.name,
        cropOdia: crops.nameOdia,
        icon: crops.icon,
        category: crops.category,
        mandiName: mandis.name,
        district: mandis.district,
      })
      .from(prices)
      .innerJoin(crops, eq(prices.cropId, crops.id))
      .innerJoin(mandis, eq(prices.mandiId, mandis.id))
      .where(eq(prices.date, latest)),
    db
      .select({ cropId: prices.cropId, mandiId: prices.mandiId, modalP: prices.modalP })
      .from(prices)
      .where(eq(prices.date, prev)),
  ]);
  const prevMap = new Map(prevRows.map((r) => [r.cropId + ":" + r.mandiId, r.modalP]));
  return todayRows.map((r) => {
    const p = prevMap.get(r.cropId + ":" + r.mandiId) ?? r.modalP;
    return { ...r, prevModalP: p, changePct: p ? ((r.modalP - p) / p) * 100 : 0 };
  });
}

export async function priceSeries(cropId: number, mandiId?: number, days = 30) {
  const rows = await db
    .select({ date: prices.date, modalP: prices.modalP, minP: prices.minP, maxP: prices.maxP, mandiId: prices.mandiId })
    .from(prices)
    .where(
      mandiId ? and(eq(prices.cropId, cropId), eq(prices.mandiId, mandiId)) : eq(prices.cropId, cropId),
    )
    .orderBy(desc(prices.date))
    .limit(days * (mandiId ? 1 : 40));
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

/* ------------------------------- sell engine ------------------------------ */

export interface SellOption {
  mandiId: number;
  mandiName: string;
  district: string;
  lat: number;
  lng: number;
  modalP: number;
  distanceKm: number;
  costPerQSolo: number;
  netPerQSolo: number;
  netPerQPooled: number;
  netTotalSolo: number;
  changePct: number;
}

export interface DemandRow {
  id: number;
  buyerName: string;
  buyerType: string;
  verified: boolean;
  district: string;
  pricePerQuintal: number;
  qtyQuintal: number;
  deadline: string;
  deliveryPoint: string;
  distanceKm: number;
}

export interface PoolRow {
  id: number;
  cropName: string;
  fromDistrict: string;
  toMandi: string;
  departDate: string;
  capacityQuintal: number;
  filledQuintal: number;
  costPerQuintal: number;
  status: string;
}

export async function sellAdvice(cropId: number, qty: number, district: string) {
  const latest = await latestPriceDate();
  const prev = await previousPriceDate(latest);

  const rows = await db
    .select({
      mandiId: mandis.id,
      mandiName: mandis.name,
      district: mandis.district,
      lat: mandis.lat,
      lng: mandis.lng,
      modalP: prices.modalP,
    })
    .from(prices)
    .innerJoin(mandis, eq(prices.mandiId, mandis.id))
    .where(and(eq(prices.cropId, cropId), eq(prices.date, latest)));

  const prevRows = await db
    .select({ mandiId: prices.mandiId, modalP: prices.modalP })
    .from(prices)
    .where(and(eq(prices.cropId, cropId), eq(prices.date, prev)));
  const prevMap = new Map(prevRows.map((r) => [r.mandiId, r.modalP]));

  const options: SellOption[] = rows
    .map((r) => {
      const dist = districtDistance(district, r.district);
      const q = quoteMandi(r.modalP, dist, qty);
      const p = prevMap.get(r.mandiId) ?? r.modalP;
      return {
        mandiId: r.mandiId,
        mandiName: r.mandiName,
        district: r.district,
        lat: r.lat,
        lng: r.lng,
        modalP: r.modalP,
        distanceKm: dist,
        costPerQSolo: q.costPerQSolo,
        netPerQSolo: q.netPerQSolo,
        netPerQPooled: q.netPerQPooled,
        netTotalSolo: q.netPerQSolo * qty,
        changePct: p ? ((r.modalP - p) / p) * 100 : 0,
      };
    })
    .sort((a, b) => b.netPerQSolo - a.netPerQSolo);

  const demandRows = await db
    .select({
      id: demands.id,
      buyerName: buyers.name,
      buyerType: buyers.type,
      verified: buyers.verified,
      district: buyers.district,
      pricePerQuintal: demands.pricePerQuintal,
      qtyQuintal: demands.qtyQuintal,
      deadline: demands.deadline,
      deliveryPoint: demands.deliveryPoint,
    })
    .from(demands)
    .innerJoin(buyers, eq(demands.buyerId, buyers.id))
    .where(and(eq(demands.cropId, cropId), eq(demands.status, "open")));

  const demandList: DemandRow[] = demandRows
    .map((r) => ({ ...r, distanceKm: districtDistance(district, r.district) }))
    .sort((a, b) => b.pricePerQuintal - a.pricePerQuintal);

  const poolRows = await db
    .select({
      id: pools.id,
      cropName: crops.name,
      fromDistrict: pools.fromDistrict,
      toMandi: mandis.name,
      departDate: pools.departDate,
      capacityQuintal: pools.capacityQuintal,
      filledQuintal: pools.filledQuintal,
      costPerQuintal: pools.costPerQuintal,
      status: pools.status,
    })
    .from(pools)
    .innerJoin(crops, eq(pools.cropId, crops.id))
    .innerJoin(mandis, eq(pools.toMandiId, mandis.id))
    .where(eq(pools.status, "open"));

  return { options, demands: demandList, pools: poolRows, refDate: latest, qty, district };
}

export async function facilitiesByType(type: string) {
  return db
    .select()
    .from(facilities)
    .where(eq(facilities.type, type));
}

export async function allCrops() {
  return db.select().from(crops).orderBy(crops.name);
}

export { db };
