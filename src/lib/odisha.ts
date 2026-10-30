/* Odisha geo + economics engine shared by pages, APIs and the seed script */

export const DISTRICTS: Record<string, { lat: number; lng: number }> = {
  Angul: { lat: 20.84, lng: 85.1 },
  Balangir: { lat: 20.71, lng: 83.48 },
  Balasore: { lat: 21.49, lng: 86.93 },
  Bargarh: { lat: 21.33, lng: 83.62 },
  Bhadrak: { lat: 21.06, lng: 86.5 },
  Boudh: { lat: 20.84, lng: 84.32 },
  Cuttack: { lat: 20.46, lng: 85.88 },
  Deogarh: { lat: 21.54, lng: 84.73 },
  Dhenkanal: { lat: 20.66, lng: 85.6 },
  Gajapati: { lat: 19.14, lng: 84.08 },
  Ganjam: { lat: 19.31, lng: 84.79 },
  Jagatsinghpur: { lat: 20.26, lng: 86.17 },
  Jajpur: { lat: 20.85, lng: 86.34 },
  Jharsuguda: { lat: 21.87, lng: 84.01 },
  Kalahandi: { lat: 19.91, lng: 83.17 },
  Kandhamal: { lat: 20.47, lng: 84.23 },
  Kendrapara: { lat: 20.5, lng: 86.42 },
  Keonjhar: { lat: 21.63, lng: 85.58 },
  Khordha: { lat: 20.18, lng: 85.62 },
  Koraput: { lat: 18.81, lng: 82.72 },
  Malkangiri: { lat: 18.36, lng: 81.89 },
  Mayurbhanj: { lat: 21.93, lng: 86.72 },
  Nabarangpur: { lat: 19.23, lng: 82.55 },
  Nayagarh: { lat: 20.13, lng: 85.1 },
  Nuapada: { lat: 20.81, lng: 82.54 },
  Puri: { lat: 19.81, lng: 85.83 },
  Rayagada: { lat: 19.17, lng: 83.42 },
  Sambalpur: { lat: 21.47, lng: 83.97 },
  Subarnapur: { lat: 20.85, lng: 83.9 },
  Sundargarh: { lat: 22.12, lng: 84.04 },
};

export const DISTRICT_NAMES = Object.keys(DISTRICTS);

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)) * 1.25); // 1.25 road factor
}

export function districtDistance(from: string, to: string): number {
  const a = DISTRICTS[from];
  const b = DISTRICTS[to];
  if (!a || !b) return 60;
  if (from === to) return 12;
  return Math.max(18, haversineKm(a, b));
}

/* ------------------------------ cost economics ----------------------------- */

export const TRUCK_RATE_PER_KM = 24; // ₹/km for a 40q mini-truck
export const TRUCK_CAPACITY_Q = 40;
export const MANDI_FEE_PCT = 0.01; // 1% market fee
export const LABOUR_PER_Q = 14; // ₹/quintal loading-unloading
export const HANDLING_FLAT = 60; // flat misc per trip

export interface CostBreakdown {
  distanceKm: number;
  soloTransportTotal: number;
  soloTransportPerQ: number;
  pooledTransportPerQ: number;
  mandiFeePerQ: number;
  labourPerQ: number;
}

export function tripCosts(distanceKm: number, qtyQuintal: number): CostBreakdown {
  const trips = Math.max(1, Math.ceil(qtyQuintal / TRUCK_CAPACITY_Q));
  const soloTransportTotal = distanceKm * TRUCK_RATE_PER_KM * trips + HANDLING_FLAT;
  return {
    distanceKm,
    soloTransportTotal,
    soloTransportPerQ: soloTransportTotal / qtyQuintal,
    pooledTransportPerQ: (distanceKm * TRUCK_RATE_PER_KM) / TRUCK_CAPACITY_Q,
    mandiFeePerQ: 0, // filled by caller (price dependent)
    labourPerQ: LABOUR_PER_Q,
  };
}

export interface MandiQuote {
  grossPerQ: number;
  netPerQSolo: number;
  netPerQPooled: number;
  costPerQSolo: number;
  distanceKm: number;
}

export function quoteMandi(
  modalPrice: number,
  distanceKm: number,
  qtyQuintal: number,
): MandiQuote {
  const c = tripCosts(distanceKm, qtyQuintal);
  const fee = modalPrice * MANDI_FEE_PCT;
  const costSolo = c.soloTransportPerQ + fee + c.labourPerQ;
  const costPooled = c.pooledTransportPerQ + fee + c.labourPerQ;
  return {
    grossPerQ: modalPrice,
    costPerQSolo: Math.round(costSolo),
    netPerQSolo: Math.round(modalPrice - costSolo),
    netPerQPooled: Math.round(modalPrice - costPooled),
    distanceKm,
  };
}

/* -------------------------------- formatting ------------------------------- */

export function inr(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86400000,
  );
}

export function shortDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}
