import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { BadgeCheck, Building2, CalendarClock, Handshake, MapPin, Sprout, Users } from "lucide-react";
import { db } from "@/db";
import { buyers, crops, demands, farmers, listings } from "@/db/schema";
import { priceSnapshot } from "@/lib/queries";
import { computeFreshness, STAGE_META } from "@/lib/decay";
import { districtDistance, inr, todayISO, daysBetween } from "@/lib/odisha";
import { getLang } from "@/lib/i18n-server";
import { DICT } from "@/lib/i18n-shared";
import CropIcon from "@/components/CropIcon";

export const dynamic = "force-dynamic";

const TYPE_STYLE: Record<string, string> = {
  Processor: "bg-clay-500/12 text-clay-600",
  Exporter: "bg-harvest-400/20 text-harvest-600",
  FPO: "bg-leaf-500/12 text-leaf-600",
  "Govt Agency": "bg-forest-950/8 text-forest-800",
  "Retail Chain": "bg-sky-500/12 text-sky-700",
  Trader: "bg-forest-900/8 text-forest-800",
};

export default async function MarketPage() {
  const lang = await getLang();
  const S = (k: string) => DICT[k]?.[lang] ?? k;
  const O = lang === "od";

  const [demandRows, listingRows, snapshot] = await Promise.all([
    db
      .select({
        id: demands.id,
        qty: demands.qtyQuintal,
        price: demands.pricePerQuintal,
        deadline: demands.deadline,
        point: demands.deliveryPoint,
        cropName: crops.name,
        cropOdia: crops.nameOdia,
        icon: crops.icon,
        cropId: crops.id,
        buyer: buyers.name,
        type: buyers.type,
        verified: buyers.verified,
        rating: buyers.rating,
        bDistrict: buyers.district,
      })
      .from(demands)
      .innerJoin(crops, eq(demands.cropId, crops.id))
      .innerJoin(buyers, eq(demands.buyerId, buyers.id))
      .orderBy(asc(demands.deadline)),
    db
      .select({
        id: listings.id,
        qty: listings.qtyQuintal,
        harvestDate: listings.harvestDate,
        condition: listings.storageCondition,
        district: listings.district,
        expected: listings.expectedPrice,
        cropName: crops.name,
        cropOdia: crops.nameOdia,
        icon: crops.icon,
        shelfDays: crops.shelfDays,
        coldMult: crops.coldMultiplier,
        farmer: farmers.name,
        farmerOdia: farmers.nameOdia,
        fDistrict: farmers.district,
      })
      .from(listings)
      .innerJoin(crops, eq(listings.cropId, crops.id))
      .innerJoin(farmers, eq(listings.farmerId, farmers.id))
      .where(eq(listings.status, "active")),
    priceSnapshot(),
  ]);

  const avgModal = new Map<number, number>();
  for (const s of snapshot) {
    if (!avgModal.has(s.cropId)) {
      const same = snapshot.filter((x) => x.cropId === s.cropId);
      avgModal.set(s.cropId, Math.round(same.reduce((tt, x) => tt + x.modalP, 0) / same.length));
    }
  }
  const home = "Kandhamal";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-clay-500">
        <Handshake className="size-3.5" /> {S("market.kicker")}
      </p>
      <h1 className="font-display mt-2 max-w-3xl text-4xl font-medium leading-tight tracking-tight text-forest-950 sm:text-5xl">
        {S("market.h1a")} <em className="text-leaf-600 not-italic">{S("market.h1b")}</em>
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-forest-900/60">{S("market.sub")}</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        {/* demands */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-forest-950">
            <Building2 className="size-4 text-clay-500" /> {S("market.openContracts")} · {demandRows.length}
          </h2>
          <div className="space-y-3">
            {demandRows.map((d) => {
              const avg = avgModal.get(d.cropId) ?? d.price;
              const premium = ((d.price - avg) / avg) * 100;
              const daysLeft = daysBetween(todayISO(), d.deadline);
              return (
                <div key={d.id} className="rounded-3xl border border-forest-900/10 bg-white/80 p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-forest-900/10">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-forest-950/5 text-forest-800">
                        <CropIcon icon={d.icon} className="size-5" />
                      </span>
                      <div>
                        <p className="text-sm font-black text-forest-950">{O ? d.cropOdia : d.cropName}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-forest-900/60">
                          {d.buyer} {d.verified && <BadgeCheck className="size-3.5 text-leaf-500" />} · ★ {d.rating.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${TYPE_STYLE[d.type] ?? ""}`}>{d.type}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-xl bg-paper px-3 py-2">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-forest-900/40">{S("market.offer")}</p>
                      <p className="tnum text-sm font-black text-forest-950">{inr(d.price)}/q</p>
                    </div>
                    <div className="rounded-xl bg-paper px-3 py-2">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-forest-900/40">{S("market.qtyWanted")}</p>
                      <p className="tnum text-sm font-black text-forest-950">{d.qty}q</p>
                    </div>
                    <div className="rounded-xl bg-paper px-3 py-2">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-forest-900/40">{S("market.vsMandi")}</p>
                      <p className={`tnum text-sm font-black ${premium >= 0 ? "text-leaf-600" : "text-clay-600"}`}>{premium >= 0 ? "+" : ""}{premium.toFixed(1)}%</p>
                    </div>
                    <div className="rounded-xl bg-paper px-3 py-2">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-forest-900/40">{S("market.closes")}</p>
                      <p className={`tnum flex items-center gap-1 text-sm font-black ${daysLeft <= 3 ? "text-clay-600" : "text-forest-950"}`}>
                        <CalendarClock className="size-3.5" /> {daysLeft}{S("market.dLeft")}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-1 text-[11px] text-forest-900/50">
                      <MapPin className="size-3" /> {d.point} · {districtDistance(home, d.bDistrict)} {O ? "କି.ମି." : "km"} {S("market.fromYou")}
                    </p>
                    <Link href={`/sell?crop=${d.cropId}`} className="rounded-full bg-forest-950 px-4 py-2 text-xs font-bold text-paper transition hover:bg-forest-800">
                      {S("market.commit")} →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* side */}
        <div className="space-y-6">
          <section className="rounded-3xl bg-forest-950 p-6 text-paper">
            <h3 className="flex items-center gap-2 text-sm font-bold"><Users className="size-4 text-harvest-400" /> {S("market.fpo")}</h3>
            <p className="mt-3 text-sm leading-6 text-paper/65">{S("market.fpoBody")}</p>
            <div className="mt-4 rounded-2xl bg-paper/5 p-4">
              <p className="text-[11px] font-bold text-harvest-400">{S("market.example")}</p>
              <p className="mt-1.5 text-sm text-paper/80">
                {O
                  ? "ହଳଦୀ: ଆପଣଙ୍କ 30q + ଟ୍ରାଇବାଲ୍ ହାର୍ଭେଷ୍ଟ ନେଟୱାର୍କ 20q = ଜେପୁର FPOର 50q ଚୁକ୍ତି ପୂରଣ — ₹10,200/q ଦରରେ"
                  : "Turmeric: your 30q + Tribal Harvest's network 20q = fulfils the 50q Jeypore FPO contract at "}₹10,200/q
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-forest-950">
              <Sprout className="size-4 text-leaf-600" /> {S("market.board")}
            </h2>
            <div className="space-y-2.5">
              {listingRows.map((l) => {
                const f = computeFreshness(l.shelfDays, l.harvestDate, l.condition, l.coldMult);
                const m = STAGE_META[f.stage];
                return (
                  <div key={l.id} className="flex items-center gap-3 rounded-2xl border border-forest-900/10 bg-white/80 p-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ background: m.soft, color: m.color }}>
                      <CropIcon icon={l.icon} className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-forest-950">{O ? l.cropOdia : l.cropName} · {l.qty}q</p>
                      <p className="text-[10px] text-forest-900/50">{O ? l.farmerOdia : l.farmer} · {l.fDistrict} · {S("market.asks")} {inr(l.expected)}/q</p>
                    </div>
                    <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black" style={{ background: m.soft, color: m.color }}>
                      {f.pct}%
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-center text-[11px] text-forest-900/40">
              {listingRows.length} {S("market.activeNote")}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
