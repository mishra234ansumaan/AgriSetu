import { eq } from "drizzle-orm";
import { Route } from "lucide-react";
import { db } from "@/db";
import { crops, mandis, pools, transporters } from "@/db/schema";
import { getLang } from "@/lib/i18n-server";
import { DICT } from "@/lib/i18n-shared";
import TransportClient from "@/components/transport/TransportClient";

export const dynamic = "force-dynamic";

export default async function TransportPage() {
  const lang = await getLang();
  const S = (k: string) => DICT[k]?.[lang] ?? k;
  const [poolRows, truckRows] = await Promise.all([
    db
      .select({
        id: pools.id,
        cropName: crops.name,
        cropOdia: crops.nameOdia,
        from: pools.fromDistrict,
        toName: mandis.name,
        toDistrict: mandis.district,
        depart: pools.departDate,
        cap: pools.capacityQuintal,
        filled: pools.filledQuintal,
        cost: pools.costPerQuintal,
      })
      .from(pools)
      .innerJoin(crops, eq(pools.cropId, crops.id))
      .innerJoin(mandis, eq(pools.toMandiId, mandis.id))
      .where(eq(pools.status, "open")),
    db.select().from(transporters),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-clay-500">
        <Route className="size-3.5" /> {S("trans.kicker")}
      </p>
      <h1 className="font-display mt-2 max-w-3xl text-4xl font-medium leading-tight tracking-tight text-forest-950 sm:text-5xl">
        {S("trans.h1a")} <em className="text-harvest-600 not-italic">{S("trans.h1b")}</em>
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-forest-900/60">{S("trans.sub")}</p>

      <div className="mt-8">
        <TransportClient
          pools={poolRows.map((p) => ({ id: p.id, cropName: p.cropName, cropOdia: p.cropOdia, from: p.from, to: p.toDistrict, toName: p.toName, depart: p.depart, cap: p.cap, filled: p.filled, cost: p.cost }))}
          transporters={truckRows.map((x) => ({ id: x.id, name: x.name, district: x.district, vehicle: x.vehicle, cap: x.capacityQuintal, rate: x.ratePerKm, verified: x.verified, phone: x.phone }))}
        />
      </div>
    </div>
  );
}
