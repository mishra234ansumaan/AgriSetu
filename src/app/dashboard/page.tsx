import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  CalendarDays,
  Landmark,
  MapPin,
  Radar,
  Refrigerator,
  Route,
  Scale,
  Siren,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { db } from "@/db";
import { farmers, listings, crops, pools, mandis, demands, buyers } from "@/db/schema";
import { priceSnapshot, sellAdvice } from "@/lib/queries";
import { computeFreshness, STAGE_META } from "@/lib/decay";
import { inr, shortDate, todayISO } from "@/lib/odisha";
import { getLang } from "@/lib/i18n-server";
import { DICT } from "@/lib/i18n-shared";
import FreshnessRing from "@/components/FreshnessRing";
import CropIcon from "@/components/CropIcon";
import { Spark } from "@/components/Charts";
import { dbPricesForSpark } from "@/lib/sparks";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const lang = await getLang();
  const S = (k: string) => DICT[k]?.[lang] ?? k;
  const O = lang === "od";

  const farmer = (await db.select().from(farmers).where(eq(farmers.id, 1)))[0];
  const farmerListings = await db
    .select({
      id: listings.id,
      qty: listings.qtyQuintal,
      harvestDate: listings.harvestDate,
      condition: listings.storageCondition,
      district: listings.district,
      cropName: crops.name,
      cropOdia: crops.nameOdia,
      icon: crops.icon,
      shelfDays: crops.shelfDays,
      coldMult: crops.coldMultiplier,
      cropId: crops.id,
    })
    .from(listings)
    .innerJoin(crops, eq(listings.cropId, crops.id))
    .where(eq(listings.farmerId, farmer.id));

  const lots = farmerListings
    .map((l) => ({ ...l, fresh: computeFreshness(l.shelfDays, l.harvestDate, l.condition, l.coldMult) }))
    .sort((a, b) => a.fresh.pct - b.fresh.pct);

  const worstLot = lots[0];
  const rescueAdvice = worstLot ? await sellAdvice(worstLot.cropId, worstLot.qty, farmer.district) : null;

  const snapshot = await priceSnapshot();
  const gainers = [...snapshot].sort((a, b) => b.changePct - a.changePct).slice(0, 5);
  const sparkRows = await dbPricesForSpark();

  const openPools = await db
    .select({
      id: pools.id,
      cropName: crops.name,
      cropOdia: crops.nameOdia,
      from: pools.fromDistrict,
      to: mandis.name,
      depart: pools.departDate,
      cap: pools.capacityQuintal,
      filled: pools.filledQuintal,
      cost: pools.costPerQuintal,
    })
    .from(pools)
    .innerJoin(crops, eq(pools.cropId, crops.id))
    .innerJoin(mandis, eq(pools.toMandiId, mandis.id))
    .where(eq(pools.status, "open"));

  const demandRows = await db
    .select({
      id: demands.id,
      cropName: crops.name,
      cropOdia: crops.nameOdia,
      buyer: buyers.name,
      type: buyers.type,
      district: buyers.district,
      qty: demands.qtyQuintal,
      price: demands.pricePerQuintal,
      deadline: demands.deadline,
    })
    .from(demands)
    .innerJoin(crops, eq(demands.cropId, crops.id))
    .innerJoin(buyers, eq(demands.buyerId, buyers.id))
    .where(eq(demands.status, "open"))
    .orderBy(desc(demands.pricePerQuintal));
  const myDemands = demandRows.filter((d) => lots.some((l) => l.cropName === d.cropName)).slice(0, 4);

  const condLabel = (c: string) => (c === "open" ? S("dash.open") : c === "cold" ? S("dash.coldCond") : S("dash.shadeCond"));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-clay-500">
            <CalendarDays className="size-3.5" /> {new Date().toLocaleDateString(O ? "or-IN" : "en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="font-display mt-2 text-4xl font-medium tracking-tight text-forest-950 sm:text-5xl">
            {S("dash.hello")}, {O ? farmer.nameOdia : farmer.name.split(" ")[0]} <span className="odia text-2xl text-forest-600/70">ନମସ୍କାର · {farmer.nameOdia}</span>
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-forest-900/60">
            <MapPin className="size-3.5" /> {farmer.village}, {farmer.district} · {farmer.landAcres} {S("dash.acres")}
            <BadgeCheck className="size-4 text-leaf-500" />
          </p>
        </div>
        <Link href="/farmproof" className="group flex items-center gap-4 rounded-2xl border border-forest-900/10 bg-forest-950 px-5 py-4 text-paper transition hover:border-harvest-400/40">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-harvest-400">{S("dash.trust")}</p>
            <p className="tnum font-display text-2xl font-semibold">{farmer.trustScore}<span className="text-sm text-paper/50">/100</span></p>
          </div>
          <ArrowUpRight className="size-5 text-paper/40 transition group-hover:text-harvest-400" />
        </Link>
      </div>

      {/* urgency banner */}
      {worstLot && worstLot.fresh.stage !== "fresh" && (
        <div className={`pulse-alert mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border px-5 py-4 ${worstLot.fresh.stage === "critical" || worstLot.fresh.stage === "urgent" ? "border-clay-500/40 bg-clay-500/10" : "border-harvest-500/40 bg-harvest-400/10"}`}>
          <div className="flex items-center gap-4">
            <Siren className="size-6" style={{ color: STAGE_META[worstLot.fresh.stage].color }} />
            <div>
              <p className="text-sm font-bold text-forest-950">
                {(O ? worstLot.cropOdia : worstLot.cropName)} {S("dash.freshnessAt")} {worstLot.fresh.pct}% {S("dash.freshnessOf")} {O ? STAGE_META[worstLot.fresh.stage].odia : STAGE_META[worstLot.fresh.stage].label}
              </p>
              {rescueAdvice?.options[0] && (
                <p className="text-xs text-forest-900/60">
                  {S("dash.bestMove")}: {inr(rescueAdvice.options[0].netPerQSolo)}/q — {rescueAdvice.options[0].mandiName} ({rescueAdvice.options[0].distanceKm} {O ? "କି.ମି." : "km"})
                </p>
              )}
            </div>
          </div>
          <Link href="/rescue" className="flex items-center gap-1.5 rounded-full bg-forest-950 px-4 py-2 text-xs font-bold text-paper transition hover:bg-forest-800">
            {S("dash.openRescue")} <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* my harvest lots */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-forest-950">{S("dash.lots")}</h2>
            <Link href="/rescue" className="text-xs font-bold text-clay-500 hover:underline">{S("dash.rescueCenter")} →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {lots.map((l) => {
              const meta = STAGE_META[l.fresh.stage];
              return (
                <div key={l.id} className="rounded-3xl border border-forest-900/10 bg-white/80 p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-forest-900/10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 place-items-center rounded-2xl" style={{ background: meta.soft, color: meta.color }}>
                        <CropIcon icon={l.icon} className="size-5" />
                      </span>
                      <div>
                        <p className="font-display text-lg font-semibold leading-tight text-forest-950">{O ? l.cropOdia : l.cropName}</p>
                        <p className="odia text-[11px] text-forest-600/60">{l.cropOdia} · {l.qty}q</p>
                      </div>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide" style={{ background: meta.soft, color: meta.color }}>
                      {O ? meta.odia : meta.label}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <FreshnessRing pct={l.fresh.pct} stage={l.fresh.stage} size={96} stroke={9} label={O ? "ତାଜା" : "fresh"} />
                    <div className="text-right text-xs leading-5 text-forest-900/60">
                      <p>{S("dash.harvested")} <strong className="text-forest-950">{shortDate(l.harvestDate)}</strong></p>
                      <p>{S("dash.kept")} <strong className="text-forest-950">{condLabel(l.condition)}</strong></p>
                      <p><strong className={l.fresh.daysLeft <= 2 ? "text-clay-600" : "text-forest-950"}>{l.fresh.daysLeft}</strong> {S("dash.daysLeft")}</p>
                    </div>
                  </div>
                  <Link href={`/sell?crop=${l.cropId}`} className="mt-4 flex items-center justify-between rounded-2xl bg-forest-950/5 px-4 py-2.5 text-xs font-bold text-forest-900 transition hover:bg-forest-950 hover:text-paper">
                    {S("dash.sellThis")} <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* right column */}
        <div className="space-y-6">
          {/* market pulse */}
          <section className="rounded-3xl bg-forest-950 p-6 text-paper">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold"><Radar className="size-4 text-harvest-400" /> {S("dash.pulse")}</h3>
              <Link href="/mandis" className="text-[11px] font-bold text-harvest-400 hover:underline">{S("dash.allMandis")} →</Link>
            </div>
            <div className="space-y-3">
              {gainers.map((g) => (
                <Link key={`${g.cropId}-${g.mandiId}`} href={`/mandis?crop=${g.cropId}`} className="flex items-center gap-3 rounded-2xl bg-paper/5 p-3 transition hover:bg-paper/10">
                  <span className="grid w-16 shrink-0 place-items-center"><Spark data={sparkRows[`${g.cropId}:${g.mandiId}`] ?? []} color={g.changePct >= 0 ? "#63b26e" : "#d9622b"} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold">{O ? g.cropOdia : g.cropName}</p>
                    <p className="truncate text-[10px] text-paper/50">{g.mandiName}</p>
                  </div>
                  <div className="text-right">
                    <p className="tnum text-sm font-bold">{inr(g.modalP)}</p>
                    <p className={`tnum flex items-center justify-end gap-0.5 text-[10px] font-bold ${g.changePct >= 0 ? "text-leaf-300" : "text-clay-500"}`}>
                      {g.changePct >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                      {Math.abs(g.changePct).toFixed(1)}%
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* matching demands */}
          <section className="rounded-3xl border border-forest-900/10 bg-white/80 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-forest-950"><Bell className="size-4 text-clay-500" /> {S("dash.buyers")}</h3>
              <Link href="/market" className="text-[11px] font-bold text-clay-500 hover:underline">{S("dash.marketLink")} →</Link>
            </div>
            <div className="space-y-2.5">
              {myDemands.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-2 rounded-2xl border border-forest-900/8 bg-paper px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-forest-950">{d.buyer}</p>
                    <p className="text-[10px] text-forest-900/50">{O ? d.cropOdia : d.cropName} · {S("dash.wants")} {d.qty}q · {S("dash.by")} {shortDate(d.deadline)}</p>
                  </div>
                  <p className="tnum shrink-0 text-sm font-black text-leaf-600">{inr(d.price)}<span className="text-[10px] font-medium text-forest-900/40">/q</span></p>
                </div>
              ))}
              {myDemands.length === 0 && <p className="text-xs text-forest-900/50">{S("dash.noDemand")}</p>}
            </div>
          </section>
        </div>
      </div>

      {/* pools strip */}
      <section className="mt-6 rounded-3xl border border-forest-900/10 bg-white/80 p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-bold text-forest-950"><Route className="size-4 text-leaf-600" /> {S("dash.pools")}</h3>
          <Link href="/transport" className="text-[11px] font-bold text-clay-500 hover:underline">{S("dash.allPools")} →</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {openPools.map((p) => (
            <div key={p.id} className="rounded-2xl border border-forest-900/8 bg-paper p-4">
              <p className="text-xs font-bold text-forest-950">{O ? p.cropOdia : p.cropName}</p>
              <p className="mt-1 text-[11px] text-forest-900/50">{p.from} → {p.to}</p>
              <div className="route-line mt-3 pb-2 text-forest-900/30" />
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-forest-900/60">{p.depart === todayISO(0) ? S("common.today") : shortDate(p.depart)} · {Math.round(p.filled)}/{p.cap}q</p>
                <p className="tnum text-sm font-black text-forest-950">{inr(p.cost)}<span className="text-[10px] font-medium text-forest-900/40">/q</span></p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-forest-900/10">
                <div className="h-full rounded-full bg-leaf-500" style={{ width: `${(p.filled / p.cap) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* quick actions */}
      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/sell", icon: Scale, k: "dash.qa1", bg: "bg-forest-950 text-paper", fg: "text-harvest-400" },
          { href: "/rescue", icon: Siren, k: "dash.qa2", bg: "bg-clay-500 text-white", fg: "text-white/70" },
          { href: "/storage", icon: Refrigerator, k: "dash.qa3", bg: "bg-white/80 border border-forest-900/10 text-forest-950", fg: "text-leaf-600" },
          { href: "/farmproof", icon: Landmark, k: "dash.qa4", bg: "bg-white/80 border border-forest-900/10 text-forest-950", fg: "text-harvest-600" },
        ].map((a) => (
          <Link key={a.href} href={a.href} className={`group flex items-center gap-4 rounded-3xl p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${a.bg}`}>
            <a.icon className={`size-6 ${a.fg}`} />
            <div className="flex-1">
              <p className="text-sm font-bold">{S(a.k)}</p>
              <p className="odia text-[11px] opacity-60">{DICT[a.k]?.od}</p>
            </div>
            <ArrowRight className="size-4 opacity-40 transition group-hover:translate-x-1 group-hover:opacity-90" />
          </Link>
        ))}
      </section>
    </div>
  );
}
