import { Siren } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { crops, facilities, listings } from "@/db/schema";
import { getLang } from "@/lib/i18n-server";
import { DICT } from "@/lib/i18n-shared";
import RescueClient from "@/components/rescue/RescueClient";

export const dynamic = "force-dynamic";

export default async function RescuePage() {
  const lang = await getLang();
  const S = (k: string) => DICT[k]?.[lang] ?? k;

  const [cropRows, lotRows, facilityRows] = await Promise.all([
    db.select().from(crops),
    db.select().from(listings).where(eq(listings.farmerId, 1)),
    db.select().from(facilities),
  ]);

  const lots = lotRows.map((l) => ({
    id: l.id,
    cropId: l.cropId,
    qty: l.qtyQuintal,
    harvestDate: l.harvestDate,
    condition: l.storageCondition,
    district: l.district,
  }));

  const urgency = (l: (typeof lots)[number]) => {
    const c = cropRows.find((x) => x.id === l.cropId)!;
    const elapsed = Math.max(0, Math.round((Date.now() - new Date(l.harvestDate + "T00:00:00").getTime()) / 86400000));
    const eff = Math.max(1, c.shelfDays * (l.condition === "cold" ? c.coldMultiplier : l.condition === "shade" ? 1.35 : 1));
    return 1 - elapsed / eff;
  };
  lots.sort((a, b) => urgency(a) - urgency(b));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-clay-500">
        <Siren className="size-3.5" /> {S("rescue.kicker")}
      </p>
      <h1 className="font-display mt-2 max-w-3xl text-4xl font-medium leading-tight tracking-tight text-forest-950 sm:text-5xl">
        {S("rescue.h1a")} <em className="text-clay-500 not-italic">{S("rescue.h1b")}</em>
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-forest-900/60">{S("rescue.sub")}</p>

      <div className="mt-8">
        <RescueClient
          crops={cropRows.map((c) => ({ id: c.id, name: c.name, nameOdia: c.nameOdia, icon: c.icon, shelfDays: c.shelfDays, coldMultiplier: c.coldMultiplier, perishable: c.perishable }))}
          lots={lots}
          coldStorages={facilityRows.filter((f) => f.type === "cold").map((f) => ({ id: f.id, name: f.name, type: f.type, district: f.district, availableQuintal: f.availableQuintal, ratePerQPerDay: f.ratePerQPerDay }))}
          processors={facilityRows.filter((f) => f.type === "processing").map((f) => ({ id: f.id, name: f.name, type: f.type, district: f.district, availableQuintal: f.availableQuintal, ratePerQPerDay: f.ratePerQPerDay }))}
        />
      </div>
    </div>
  );
}
