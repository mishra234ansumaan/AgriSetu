import { NextRequest } from "next/server";
import { db } from "@/db";
import { sql, eq } from "drizzle-orm";
import { bookings, facilities } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    kind: string;
    refId: number;
    farmerId?: number;
    qtyQuintal?: number;
    days?: number;
    estCost?: number;
  };
  const { kind, refId } = body;
  const qty = Math.max(1, Number(body.qtyQuintal || 1));
  const days = Math.max(0, Number(body.days || 0));
  const farmerId = Number(body.farmerId || 1);

  if (kind === "storage") {
    const fac = await db.select().from(facilities).where(eq(facilities.id, refId));
    if (!fac.length) return Response.json({ ok: false, error: "Facility not found" }, { status: 404 });
    const f = fac[0];
    if (f.availableQuintal < qty)
      return Response.json({ ok: false, error: "Not enough capacity available" }, { status: 409 });
    const estCost = Math.round(f.ratePerQPerDay * qty * Math.max(1, days));
    const [b] = await db
      .insert(bookings)
      .values({ kind, refId, farmerId, qtyQuintal: qty, days, estCost, status: "requested" })
      .returning();
    await db
      .update(facilities)
      .set({ availableQuintal: sql`${facilities.availableQuintal} - ${qty}` })
      .where(eq(facilities.id, refId));
    return Response.json({ ok: true, booking: b, estCost });
  }

  const [b] = await db
    .insert(bookings)
    .values({
      kind,
      refId,
      farmerId,
      qtyQuintal: qty,
      days,
      estCost: Math.max(0, Number(body.estCost || 0)),
      status: "requested",
    })
    .returning();
  return Response.json({ ok: true, booking: b });
}
