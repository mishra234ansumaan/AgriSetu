import { NextRequest } from "next/server";
import { db } from "@/db";
import { sql, eq } from "drizzle-orm";
import { pools, bookings } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { poolId: number; farmerId?: number; qtyQuintal?: number };
  const qty = Math.max(1, Number(body.qtyQuintal || 1));
  const farmerId = Number(body.farmerId || 1);

  const row = await db.select().from(pools).where(eq(pools.id, body.poolId));
  if (!row.length) return Response.json({ ok: false, error: "Pool not found" }, { status: 404 });
  const p = row[0];
  if (p.status !== "open") return Response.json({ ok: false, error: "Pool has departed" }, { status: 409 });
  if (p.filledQuintal + qty > p.capacityQuintal)
    return Response.json({ ok: false, error: "Not enough space left in this pool" }, { status: 409 });

  await db
    .update(pools)
    .set({ filledQuintal: sql`${pools.filledQuintal} + ${qty}` })
    .where(eq(pools.id, body.poolId));

  const estCost = p.costPerQuintal * qty;
  const [b] = await db
    .insert(bookings)
    .values({ kind: "pool", refId: body.poolId, farmerId, qtyQuintal: qty, estCost, status: "requested" })
    .returning();

  return Response.json({ ok: true, booking: b, estCost, perQuintal: p.costPerQuintal });
}
