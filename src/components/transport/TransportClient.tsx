"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Crown,
  GitCompareArrows,
  MapPin,
  Minus,
  Navigation2,
  Phone,
  Plus,
  Route,
  Search,
  Truck,
  Users,
  X,
} from "lucide-react";
import LocationSearch from "@/components/geo/LocationSearch";
import RouteMap from "@/components/geo/RouteMap";
import { corridorText, districtPlace, kmBetween, mapsDirUrl, travelHrs, type Place } from "@/lib/locations";
import { districtDistance, inr, shortDate } from "@/lib/odisha";
import { useLang, t } from "@/lib/i18n";

export interface PoolRow {
  id: number;
  cropName: string;
  cropOdia: string;
  from: string;
  to: string; // destination mandi district
  toName: string;
  depart: string;
  cap: number;
  filled: number;
  cost: number;
}
export interface TransporterRow {
  id: number;
  name: string;
  district: string;
  vehicle: string;
  cap: number;
  rate: number;
  verified: boolean;
  phone: string;
}

export default function TransportClient({ pools, transporters }: { pools: PoolRow[]; transporters: TransporterRow[] }) {
  const { lang } = useLang();
  const O = lang === "od";

  const [origin, setOrigin] = useState<Place>(districtPlace("Kandhamal"));
  const [dest, setDest] = useState<Place>(districtPlace("Khordha"));

  const [joinPool, setJoinPool] = useState<PoolRow | null>(null);
  const [joinQty, setJoinQty] = useState(5);
  const [joined, setJoined] = useState<Record<number, number>>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  const [bookTruck, setBookTruck] = useState<TransporterRow | null>(null);
  const [truckState, setTruckState] = useState<"idle" | "sending" | "done">("idle");
  const [truckQuery, setTruckQuery] = useState("");
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [comparing, setComparing] = useState(false);

  const tripKm = useMemo(() => kmBetween(origin, dest), [origin, dest]);

  const rankedTrucks = useMemo(() => {
    const list = transporters.map((tr) => ({
      ...tr,
      fromKm: kmBetween(origin, districtPlace(tr.district)),
      tripEst: Math.round(tr.rate * tripKm),
      tripEstPooled: Math.round((tr.rate * tripKm) / Math.min(30, tr.cap)),
    }));
    const f = truckQuery.trim().toLowerCase();
    const filtered = f ? list.filter((x) => x.name.toLowerCase().includes(f) || x.district.toLowerCase().includes(f) || x.vehicle.toLowerCase().includes(f)) : list;
    return filtered.sort((a, b) => a.fromKm - b.fromKm);
  }, [transporters, origin, tripKm, truckQuery]);

  const rankedPools = useMemo(
    () => [...pools].sort((a, b) => districtDistance(origin.district, a.from) - districtDistance(origin.district, b.from)),
    [pools, origin],
  );

  const soloCost = (p: PoolRow) => Math.round((districtDistance(p.from, p.to) * 24) / Math.min(20, p.cap));

  async function confirmJoin() {
    if (!joinPool) return;
    setState("sending");
    setError("");
    try {
      const r = await fetch("/api/pools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poolId: joinPool.id, farmerId: 1, qtyQuintal: joinQty }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not join");
      setJoined((j) => ({ ...j, [joinPool.id]: (j[joinPool.id] ?? 0) + joinQty }));
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setState("idle");
    }
  }

  async function confirmTruck() {
    if (!bookTruck) return;
    setTruckState("sending");
    try {
      await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "transport", refId: bookTruck.id, farmerId: 1, qtyQuintal: Math.min(bookTruck.cap, 20), estCost: bookTruck ? Math.round(tripKm * bookTruck.rate) : 0 }),
      });
      setTruckState("done");
    } catch {
      setTruckState("done");
    }
  }

  const toggleCompare = (id: number) =>
    setCompareIds((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 3 ? c : [...c, id]));
  const compareTrucks = rankedTrucks.filter((x) => compareIds.includes(x.id));

  return (
    <div className="space-y-10">
      {/* route planner */}
      <section className="rounded-3xl border border-forest-900/10 bg-white/80 p-6 sm:p-7">
        <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-forest-950">
          <Navigation2 className="size-5 text-clay-500" /> {t("trans.plan", lang)}
        </h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto_1fr_1.4fr]">
          <div>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-forest-900/50">{t("trans.origin", lang)}</span>
            <LocationSearch value={origin} onSelect={(p) => setOrigin(p ?? districtPlace("Kandhamal"))} />
          </div>
          <div className="hidden items-center justify-center lg:flex">
            <ArrowRight className="size-5 text-forest-900/30" />
          </div>
          <div>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-forest-900/50">{t("trans.dest", lang)}</span>
            <LocationSearch value={dest} onSelect={(p) => setDest(p ?? districtPlace("Khordha"))} />
          </div>
          <div className="grid grid-cols-3 content-center gap-2 text-center">
            <div className="rounded-xl bg-paper px-2 py-2.5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-forest-900/40">{t("common.distance", lang)}</p>
              <p className="tnum mt-0.5 text-sm font-black text-forest-950">{tripKm} {O ? "କି.ମି." : "km"}</p>
            </div>
            <div className="rounded-xl bg-paper px-2 py-2.5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-forest-900/40">{t("common.estTime", lang)}</p>
              <p className="tnum mt-0.5 text-sm font-black text-forest-950">{travelHrs(tripKm)}</p>
            </div>
            <a
              href={mapsDirUrl(origin, dest)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-clay-500 px-2 py-2.5 text-xs font-bold text-white transition hover:bg-clay-600"
            >
              <Navigation2 className="size-3.5" /> {t("common.navigate", lang)}
            </a>
          </div>
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-bold text-forest-800 hover:text-clay-600">{t("common.viewMap", lang)} · {origin.name} → {dest.name}</summary>
          <div className="mt-3">
            <RouteMap origin={origin} dest={dest} />
          </div>
        </details>
      </section>

      {/* pools */}
      <section>
        <h2 className="font-display text-2xl font-semibold text-forest-950">
          {t("trans.openPools", lang)} <span className="text-sm font-medium text-forest-600/50">· {t("trans.nearestToYou", lang)}</span>
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {rankedPools.map((p) => {
            const filledNow = p.filled + (joined[p.id] ?? 0);
            const pct = Math.min(100, (filledNow / p.cap) * 100);
            const joinKm = districtDistance(origin.district, p.from);
            return (
              <motion.div key={p.id} layout className="rounded-3xl border border-forest-900/10 bg-white/80 p-6 transition hover:shadow-lg hover:shadow-forest-900/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-forest-950">{O ? p.cropOdia : p.cropName}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-forest-900/55">
                      <MapPin className="size-3" /> {p.from} <span className="route-line inline-block w-10 text-forest-900/30" /> {p.toName}
                    </p>
                    <p className="mt-0.5 text-[10px] text-forest-900/45">
                      {t("common.nearest", lang)}: {joinKm} {O ? "କି.ମି." : "km"} {O ? "ଆପଣଙ୍କଠାରୁ" : "from you"}
                    </p>
                  </div>
                  <span className="rounded-full bg-leaf-500/12 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-leaf-600">
                    {t("trans.departs", lang)} {shortDate(p.depart)}
                  </span>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-forest-900/60">
                    <span className="flex items-center gap-1"><Truck className="size-3.5" /> {t("trans.truckFill", lang)}</span>
                    <span className="tnum">{Math.round(filledNow)}q / {p.cap}q</span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-forest-900/10">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-harvest-500 to-harvest-400" animate={{ width: `${Math.max(5, pct)}%` }} transition={{ type: "spring", stiffness: 80, damping: 18 }} />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-2xl bg-harvest-400/12 px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-harvest-600">{t("trans.pooledCost", lang)}</p>
                    <p className="tnum font-display text-xl font-semibold text-forest-950">{inr(p.cost)}/q</p>
                  </div>
                  <div className="rounded-2xl bg-forest-950/5 px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-forest-900/40">{t("trans.solo", lang)}</p>
                    <p className="tnum font-display text-xl font-semibold text-clay-600 line-through decoration-clay-500/60">{inr(soloCost(p))}/q</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => { setJoinPool(p); setJoinQty(Math.max(1, Math.min(5, p.cap - filledNow))); setState("idle"); }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-forest-950 py-3 text-xs font-bold text-paper transition hover:bg-forest-800"
                  >
                    <Users className="size-4" /> {t("trans.joinPool", lang)}
                  </button>
                  <a
                    href={mapsDirUrl(origin, districtPlace(p.from))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid size-11 place-items-center rounded-full border border-forest-900/15 text-forest-900 transition hover:border-forest-900/40"
                    title={t("common.navigate", lang)}
                  >
                    <Navigation2 className="size-4" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* transporters */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-forest-950">{t("trans.transporters", lang)}</h2>
            <p className="mt-1 text-xs text-forest-900/50">{t("trans.boardNote", lang)} · {t("trans.nearestToYou", lang)}</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-forest-900/15 bg-white px-3 py-2">
            <Search className="size-3.5 text-forest-900/40" />
            <input
              value={truckQuery}
              onChange={(e) => setTruckQuery(e.target.value)}
              placeholder={O ? "ଗାଡ଼ି / ଜିଲ୍ଲା ଖୋଜନ୍ତୁ — ଆପଣ ଜାଣିଥିବା…" : "Search truck / district you know…"}
              className="w-52 bg-transparent text-xs font-semibold text-forest-950 outline-none placeholder:text-forest-900/35"
            />
          </div>
        </div>

        {/* compare tray */}
        <AnimatePresence>
          {compareIds.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="sticky top-24 z-20 mt-4 flex items-center justify-between gap-3 rounded-2xl border border-harvest-500/40 bg-harvest-400/95 px-4 py-3 text-forest-950 shadow-xl">
              <p className="text-xs font-black">{compareIds.length}/3 {t("common.selected", lang)}</p>
              <div className="flex gap-2">
                <button onClick={() => setComparing(true)} disabled={compareIds.length < 2} className="flex items-center gap-1.5 rounded-full bg-forest-950 px-4 py-2 text-xs font-bold text-paper hover:bg-forest-800 disabled:opacity-40">
                  <GitCompareArrows className="size-3.5" /> {t("common.compareNow", lang)}
                </button>
                <button onClick={() => setCompareIds([])} className="rounded-full border border-forest-950/30 px-3 py-2 text-xs font-bold">{t("common.clear", lang)}</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rankedTrucks.map((tr, i) => (
            <div key={tr.id} className="rounded-3xl border border-forest-900/10 bg-white/80 p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-forest-900/10">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-2xl bg-forest-950/5 text-forest-800"><Truck className="size-5" /></span>
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-black text-forest-950">
                      {tr.name} {tr.verified && <BadgeCheck className="size-4 text-leaf-500" />}
                    </p>
                    <p className="text-[11px] text-forest-900/50">{tr.vehicle} · {tr.cap}q {t("trans.capacity", lang)}</p>
                  </div>
                </div>
                <label className="grid size-6 cursor-pointer place-items-center rounded-md border border-forest-900/20" title={t("common.compare", lang)}>
                  <input type="checkbox" className="size-3.5 accent-harvest-500" checked={compareIds.includes(tr.id)} onChange={() => toggleCompare(tr.id)} />
                </label>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-paper px-2 py-2">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-forest-900/40">{O ? "ଆପଣଙ୍କଠାରୁ" : "from you"}</p>
                  <p className="tnum mt-0.5 text-xs font-black text-forest-950">{tr.fromKm} {O ? "କି.ମି." : "km"} · {travelHrs(tr.fromKm)}</p>
                </div>
                <div className="rounded-xl bg-paper px-2 py-2">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-forest-900/40">{t("trans.estForRoute", lang)}</p>
                  <p className="tnum mt-0.5 text-xs font-black text-forest-950">{inr(tr.tripEst)}</p>
                </div>
              </div>
              <p className="mt-2 text-center text-[10px] font-bold text-leaf-600">
                {t("trans.pooledCost", lang)} ≈ {inr(tr.tripEstPooled)}/q · "{t("common.bestRoute", lang)}: {origin.name} → {dest.name}"
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-forest-900/8 pt-3">
                <p className="tnum font-display text-xl font-semibold text-forest-950">{inr(tr.rate)}<span className="text-xs font-medium text-forest-900/40">{t("trans.perKm", lang)}</span></p>
                <div className="flex gap-1.5">
                  <a href={mapsDirUrl(origin, districtPlace(tr.district))} target="_blank" rel="noopener noreferrer" className="grid size-9 place-items-center rounded-full border border-forest-900/15 text-forest-900 hover:border-forest-900/40" title={t("common.viewMap", lang)}>
                    <Navigation2 className="size-3.5" />
                  </a>
                  <button onClick={() => { setBookTruck(tr); setTruckState("idle"); }} className="rounded-full border border-forest-950 px-4 py-2 text-xs font-bold text-forest-950 transition hover:bg-forest-950 hover:text-paper">
                    {t("trans.bookTruck", lang)}
                  </button>
                </div>
              </div>
              <p className="mt-2 flex items-center gap-1 text-[10px] text-forest-900/40"><Phone className="size-3" /> {tr.phone} {i === 0 && <span className="ml-1 rounded-full bg-harvest-400/20 px-1.5 py-0.5 font-black text-harvest-600"><Crown className="mr-0.5 inline size-2.5" />{t("common.nearest", lang)}</span>}</p>
            </div>
          ))}
        </div>
      </section>

      {/* join pool modal */}
      <AnimatePresence>
        {joinPool && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-forest-950/60 p-4 backdrop-blur-sm" onClick={() => setJoinPool(null)}>
            <motion.div initial={{ y: 30, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.97 }} transition={{ type: "spring", stiffness: 260, damping: 24 }} className="w-full max-w-md rounded-3xl bg-paper p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {state === "done" ? (
                <div className="py-6 text-center">
                  <CheckCircle2 className="mx-auto size-12 text-leaf-500" />
                  <p className="font-display mt-4 text-2xl font-semibold text-forest-950">{t("trans.inPool", lang)}</p>
                  <p className="mt-3 text-sm text-forest-900/70">
                    {joinQty}q · {O ? joinPool.cropOdia : joinPool.cropName} {t("trans.rides", lang)} {joinPool.from} → {joinPool.toName}, {shortDate(joinPool.depart)} — {inr(joinPool.cost * joinQty)} ({O ? "ଏକୁଟିଆ" : "solo"} {inr(soloCost(joinPool) * joinQty)}).
                  </p>
                  <p className="mt-2 rounded-xl bg-harvest-400/15 px-3 py-2 text-xs font-bold text-harvest-600">
                    {t("trans.saved", lang)} {inr((soloCost(joinPool) - joinPool.cost) * joinQty)}
                  </p>
                  <button onClick={() => setJoinPool(null)} className="mt-6 rounded-full bg-forest-950 px-6 py-3 text-sm font-bold text-paper">{t("common.done", lang)}</button>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-clay-500"><Route className="mr-1 inline size-3" /> {t("trans.joinPool", lang)}</p>
                      <h3 className="font-display mt-1 text-2xl font-semibold leading-tight text-forest-950">{O ? joinPool.cropOdia : joinPool.cropName}</h3>
                      <p className="text-xs text-forest-900/50">{joinPool.from} → {joinPool.toName} · {shortDate(joinPool.depart)}</p>
                    </div>
                    <button onClick={() => setJoinPool(null)} className="rounded-full p-1.5 hover:bg-forest-900/5"><X className="size-4" /></button>
                  </div>
                  <div className="mt-5">
                    <span className="mb-2 block text-[11px] font-semibold text-forest-900/60">{t("trans.yourQty", lang)}</span>
                    <div className="flex items-center justify-between rounded-2xl border border-forest-900/15 bg-white px-4 py-3">
                      <button onClick={() => setJoinQty(Math.max(1, joinQty - 1))} className="grid size-8 place-items-center rounded-full bg-forest-950/5"><Minus className="size-4" /></button>
                      <span className="tnum font-display text-3xl font-semibold text-forest-950">{joinQty}q</span>
                      <button onClick={() => setJoinQty(Math.min(joinPool.cap - joinPool.filled - (joined[joinPool.id] ?? 0), joinQty + 1))} className="grid size-8 place-items-center rounded-full bg-forest-950/5"><Plus className="size-4" /></button>
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-2xl bg-forest-950 px-4 py-3.5 text-paper">
                      <span className="text-xs text-paper/60">{t("trans.payOnDelivery", lang)}</span>
                      <span className="tnum font-display text-2xl font-semibold text-harvest-400">{inr(joinPool.cost * joinQty)}</span>
                    </div>
                    <p className="mt-2 text-center text-[11px] font-semibold text-leaf-600">{t("trans.soloWould", lang)} ~{inr(soloCost(joinPool) * joinQty)}</p>
                    {error && <p className="mt-2 rounded-xl bg-clay-500/10 px-3 py-2 text-xs font-semibold text-clay-600">{error}</p>}
                    <button onClick={() => void confirmJoin()} disabled={state === "sending"} className="mt-4 w-full rounded-full bg-clay-500 py-3.5 text-sm font-bold text-white transition hover:bg-clay-600 disabled:opacity-60">
                      {state === "sending" ? t("trans.joining", lang) : t("trans.confirmJoin", lang)}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* truck booking modal */}
      <AnimatePresence>
        {bookTruck && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-forest-950/60 p-4 backdrop-blur-sm" onClick={() => setBookTruck(null)}>
            <motion.div initial={{ y: 30, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.97 }} transition={{ type: "spring", stiffness: 260, damping: 24 }} className="w-full max-w-md rounded-3xl bg-paper p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {truckState === "done" ? (
                <div className="py-6 text-center">
                  <CheckCircle2 className="mx-auto size-12 text-leaf-500" />
                  <p className="font-display mt-4 text-2xl font-semibold text-forest-950">{t("trans.truckRequested", lang)}</p>
                  <p className="mt-3 text-sm text-forest-900/70">{bookTruck.name} {t("trans.willCall", lang)} {inr(tripKm * bookTruck.rate)} ({tripKm} {O ? "କି.ମି." : "km"}).</p>
                  <button onClick={() => setBookTruck(null)} className="mt-6 rounded-full bg-forest-950 px-6 py-3 text-sm font-bold text-paper">{t("common.done", lang)}</button>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-clay-500">{t("trans.bookTruck", lang)}</p>
                      <h3 className="font-display mt-1 text-2xl font-semibold leading-tight text-forest-950">{bookTruck.name}</h3>
                      <p className="text-xs text-forest-900/50">{bookTruck.vehicle} · {bookTruck.cap}q · {inr(bookTruck.rate)}{t("trans.perKm", lang)}</p>
                    </div>
                    <button onClick={() => setBookTruck(null)} className="rounded-full p-1.5 hover:bg-forest-900/5"><X className="size-4" /></button>
                  </div>
                  <div className="mt-5 space-y-3">
                    <div className="rounded-2xl bg-paper px-4 py-3 text-xs text-forest-900/70">
                      <strong className="text-forest-950">{origin.name}</strong> → <strong className="text-forest-950">{dest.name}</strong> · {tripKm} {O ? "କି.ମି." : "km"} · {travelHrs(tripKm)} · {corridorText(origin, dest)}
                    </div>
                    <a href={mapsDirUrl(origin, dest)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-2xl border border-clay-500/40 bg-clay-500/10 px-4 py-3 text-xs font-bold text-clay-600 transition hover:bg-clay-500/20">
                      <Navigation2 className="size-3.5" /> {t("common.navigate", lang)} ({t("common.viewMap", lang)})
                    </a>
                    <div className="flex items-center justify-between rounded-2xl bg-forest-950 px-4 py-3.5 text-paper">
                      <span className="text-xs text-paper/60">{t("trans.estTrip", lang)}</span>
                      <span className="tnum font-display text-2xl font-semibold text-harvest-400">{inr(tripKm * bookTruck.rate)}</span>
                    </div>
                    <p className="text-center text-[11px] text-forest-900/50">{t("trans.poolTip", lang)}</p>
                    <button onClick={() => void confirmTruck()} className="w-full rounded-full bg-clay-500 py-3.5 text-sm font-bold text-white transition hover:bg-clay-600">
                      {truckState === "sending" ? "…" : t("trans.requestTruck", lang)}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* compare modal */}
      <AnimatePresence>
        {comparing && compareTrucks.length >= 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-forest-950/60 p-4 backdrop-blur-sm" onClick={() => setComparing(false)}>
            <motion.div initial={{ y: 30, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.97 }} className="w-full max-w-2xl rounded-3xl bg-paper p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-clay-500"><GitCompareArrows className="mr-1 inline size-3" /> {t("common.compare", lang)}</p>
                  <h3 className="font-display mt-1 text-2xl font-semibold text-forest-950">{t("trans.compareTitle", lang)}</h3>
                </div>
                <button onClick={() => setComparing(false)} className="rounded-full p-1.5 hover:bg-forest-900/5"><X className="size-4" /></button>
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[460px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-forest-900/10 text-[10px] uppercase tracking-wider text-forest-900/45">
                      <th className="pb-2 pr-3"></th>
                      {compareTrucks.map((x) => {
                        const win = x.id === compareTrucks.reduce((a, b) => (a.tripEst <= b.tripEst ? a : b)).id;
                        return (
                          <th key={x.id} className="pb-2 pr-3">
                            <div className="flex items-center gap-1 text-[11px] font-black normal-case tracking-normal text-forest-950">{x.name} {x.verified && <BadgeCheck className="size-3.5 text-leaf-500" />}</div>
                            {win && <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-harvest-400 px-2 py-0.5 text-[9px] font-black text-forest-950"><Crown className="size-2.5" /> {t("common.winner", lang)}</span>}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="tnum divide-y divide-forest-900/5 text-forest-900/75">
                    <tr><td className="py-2.5 pr-3 font-semibold text-forest-900/60">{t("trans.capacity", lang)}</td>{compareTrucks.map((x) => <td key={x.id} className="py-2.5 pr-3 font-bold">{x.cap}q · {x.vehicle}</td>)}</tr>
                    <tr><td className="py-2.5 pr-3 font-semibold text-forest-900/60">{t("common.distance", lang)} ({O ? "ଆପଣଙ୍କଠାରୁ" : "from you"})</td>{compareTrucks.map((x) => <td key={x.id} className="py-2.5 pr-3">{x.fromKm} {O ? "କି.ମି." : "km"} · {travelHrs(x.fromKm)}</td>)}</tr>
                    <tr><td className="py-2.5 pr-3 font-semibold text-forest-900/60">{t("trans.perKm", lang)}</td>{compareTrucks.map((x) => <td key={x.id} className="py-2.5 pr-3">{inr(x.rate)}/km</td>)}</tr>
                    <tr><td className="py-2.5 pr-3 font-semibold text-forest-900/60">{t("trans.estForRoute", lang)} ({origin.name} → {dest.name})</td>{compareTrucks.map((x) => <td key={x.id} className="py-2.5 pr-3 font-black text-clay-600">{inr(x.tripEst)}</td>)}</tr>
                    <tr><td className="py-2.5 pr-3 font-semibold text-forest-900/60">{t("trans.pooledCost", lang)}</td>{compareTrucks.map((x) => <td key={x.id} className="py-2.5 pr-3 font-black text-leaf-600">{inr(x.tripEstPooled)}/q</td>)}</tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 rounded-xl bg-harvest-400/15 px-3.5 py-2.5 text-[11px] font-semibold text-forest-900/75">
                {(() => {
                  const w = compareTrucks.reduce((a, b) => (a.tripEst <= b.tripEst ? a : b));
                  return O
                    ? `ଚୂଡ଼ାନ୍ତ ପରାମର୍ଶ: ${w.name} — ଆପଣଙ୍କ ରାସ୍ତାରେ (${tripKm} କି.ମି.) ସବୁଠାରୁ ସସ୍ତା: ${inr(w.tripEst)}।`
                    : `Final suggestion: ${w.name} — cheapest on your route (${tripKm} km): ${inr(w.tripEst)}.`;
                })()}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
