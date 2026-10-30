import { NextRequest } from "next/server";
import { sellAdvice } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const cropId = Number(sp.get("cropId") || 1);
  const qty = Math.max(1, Number(sp.get("qty") || 10));
  const district = sp.get("district") || "Khordha";
  const data = await sellAdvice(cropId, qty, district);
  return Response.json(data);
}
