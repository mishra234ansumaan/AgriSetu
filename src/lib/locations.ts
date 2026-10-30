/* Searchable Odisha location index + route helpers (client-safe, pure) */
import { DISTRICTS, districtDistance } from "@/lib/odisha";

export interface Place {
  name: string;
  district: string; // parent district (used for cost snapping)
  lat: number;
  lng: number;
  kind: "district" | "town";
}

export const PLACES: Place[] = [
  // district headquarters (kind: district)
  ...Object.entries(DISTRICTS).map(([name, c]) => ({ name, district: name, lat: c.lat, lng: c.lng, kind: "district" as const })),
  // well-known towns & mandi hubs
  { name: "Bhubaneswar", district: "Khordha", lat: 20.2961, lng: 85.8245, kind: "town" },
  { name: "Berhampur (Brahmapur)", district: "Ganjam", lat: 19.315, lng: 84.7941, kind: "town" },
  { name: "Rourkela", district: "Sundargarh", lat: 22.2604, lng: 84.8536, kind: "town" },
  { name: "Baripada", district: "Mayurbhanj", lat: 21.9322, lng: 86.7216, kind: "town" },
  { name: "Jeypore", district: "Koraput", lat: 18.8563, lng: 82.5716, kind: "town" },
  { name: "Phulbani", district: "Kandhamal", lat: 20.4692, lng: 84.2307, kind: "town" },
  { name: "Tumudibandha", district: "Kandhamal", lat: 20.28, lng: 84.0, kind: "town" },
  { name: "Bhawanipatna", district: "Kalahandi", lat: 19.9077, lng: 83.1686, kind: "town" },
  { name: "Padampur", district: "Bargarh", lat: 20.9982, lng: 83.0776, kind: "town" },
  { name: "Remuna", district: "Balasore", lat: 21.5292, lng: 86.8731, kind: "town" },
  { name: "Jatni (Khordha)", district: "Khordha", lat: 20.1598, lng: 85.7074, kind: "town" },
  { name: "Umerkote", district: "Nabarangpur", lat: 19.6656, lng: 82.2098, kind: "town" },
  { name: "Hindol", district: "Dhenkanal", lat: 20.6, lng: 85.35, kind: "town" },
  { name: "Jajpur Road (Vyasnagar)", district: "Jajpur", lat: 20.85, lng: 86.34, kind: "town" },
  { name: "Barbil", district: "Keonjhar", lat: 22.1156, lng: 85.4061, kind: "town" },
  { name: "Parlakhemundi", district: "Gajapati", lat: 18.7826, lng: 84.0898, kind: "town" },
  { name: "Athagarh", district: "Cuttack", lat: 20.52, lng: 85.62, kind: "town" },
  { name: "Pipili", district: "Puri", lat: 20.1136, lng: 85.8334, kind: "town" },
  { name: "Bhanjanagar", district: "Ganjam", lat: 19.9167, lng: 84.5833, kind: "town" },
  { name: "Rayagada Town", district: "Rayagada", lat: 19.17, lng: 83.42, kind: "town" },
];

const ALIASES: Record<string, string> = {
  bbsr: "Bhubaneswar",
  ctc: "Cuttack",
  bam: "Berhampur (Brahmapur)",
  brahmapur: "Berhampur (Brahmapur)",
  vyasnagar: "Jajpur Road (Vyasnagar)",
  sundargarh: "Sundargarh",
};

export function searchPlaces(q: string, limit = 7): Place[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  const exactAlias = ALIASES[needle];
  const scored = PLACES.map((p) => {
    const n = p.name.toLowerCase();
    const d = p.district.toLowerCase();
    let score = -1;
    if (n === needle) score = 100;
    else if (n.startsWith(needle)) score = 80;
    else if (n.includes(needle)) score = 60;
    else if (d.startsWith(needle)) score = 40;
    else if (d.includes(needle)) score = 30;
    if (exactAlias && p.name === exactAlias) score = 110;
    return { p, score };
  })
    .filter((s) => s.score >= 0)
    .sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name));
  return scored.slice(0, limit).map((s) => s.p);
}

export function kmBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)) * 1.25);
}

export function travelHrs(km: number): string {
  const mins = Math.round((km / 34) * 60 + 20); // rural mixed-road average
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function districtOf(place: Place): string {
  return place.district;
}

/** snap an arbitrary searched point to the nearest district head (for server cost maths) */
export function nearestDistrictName(lat: number, lng: number): string {
  let best = "Khordha";
  let bestKm = Infinity;
  for (const [name, c] of Object.entries(DISTRICTS)) {
    const d = kmBetween({ lat, lng }, c);
    if (d < bestKm) {
      bestKm = d;
      best = name;
    }
  }
  return best;
}

export function mapsDirUrl(o: { lat: number; lng: number }, d: { lat: number; lng: number }): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${o.lat},${o.lng}&destination=${d.lat},${d.lng}&travelmode=driving`;
}

export function districtPlace(name: string): Place {
  const c = DISTRICTS[name] ?? DISTRICTS.Khordha;
  return { name, district: name, lat: c.lat, lng: c.lng, kind: "district" };
}

export function corridorText(a: Place, b: Place): string {
  if (a.district === b.district) return `${a.district} district roads`;
  const via = districtDistance(a.district, b.district) > 120 ? "NH-16 / SH corridor" : "state highway corridor";
  return `${a.district} → ${b.district} ${via}`;
}
