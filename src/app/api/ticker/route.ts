import { priceSnapshot } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await priceSnapshot();
  // biggest movers across all crop-mandi series
  const movers = [...rows]
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    // de-dupe crops so ticker stays varied
    .filter((r, i, arr) => arr.findIndex((x) => x.cropId === r.cropId) === i)
    .slice(0, 12)
    .map((r) => ({
      crop: r.cropName,
      cropOdia: r.cropOdia,
      mandi: r.mandiName,
      district: r.district,
      modalP: r.modalP,
      changePct: Math.round(r.changePct * 10) / 10,
    }));
  return Response.json({ movers });
}
