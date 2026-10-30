"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Crown,
  GitCompareArrows,
  Handshake,
  MapPin,
  Minus,
  Navigation2,
  ReceiptText,
  Search,
  Truck,
  Users,
  X,
} from "lucide-react";
import CropIcon from "@/components/CropIcon";
import LocationSearch from "@/components/geo/LocationSearch";
import { corridorText, districtPlace, kmBetween, mapsDirUrl, nearestDistrictName, travelHrs, type Place } from "@/lib/locations";
import { inr, shortDate } from "@/lib/odisha";
import { useLang, t } from "@/lib/i18n";

export interface AdviceOption {
  mandiId: number;
  mandiName: string;
  district: string;
  lat: number;
  lng: number;
  modalP: number;
  distanceKm: number;
  costPerQSolo: number;
  netPerQSolo: number;
  netPerQPooled: number;
  netTotalSolo: number;
  changePct: number;
}
export interface AdviceDemand {
  id: number;
  buyerName: string;
  buyerType: string;
  verified: boolean;
  district: string;
  pricePerQuintal: number;
  qtyQuintal: number;
  deadline: string;
  deliveryPoint: string;
  distanceKm: number;
}
export interface AdvicePool {
  id: number;
  cropName: string;
  fromDistrict: string;
  toMandi: string;
  departDate: string;
  capacityQuintal: number;
  filledQuintal: number;
  costPerQuintal: number;
}
interface Advice {
  options: AdviceOption[];
  demands: AdviceDemand[];
  pools: AdvicePool[];
  refDate: string;
}

export default function SellClient({
  crops,
  initialCrop,
  initialQty,
  initialDistrict,
  initial,
}: {
  crops: { id: number; name: string; nameOdia: string; icon: string }[];
  initialCrop: number;
  initialQty: number;
  initialDistrict: string;
  initial: Advice;
}) {
  const { lang } = useLang();
  const O = lang === "od";
  const [cropId, setCropId] = useState(initialCrop);
  const [qty, setQty] = useState(initialQty);
  const [place, setPlace] = useState<Place | null>(districtPlace(initialDistrict));
  const [data, setData] = useState<Advice>(initial);
  const [openId, setOpenId] = useState<number | null>(initial.options[0]?.mandiId ?? null);
  const [mapId, setMapId] = useState<number | null>(null);
  const [compare, setCompare] = useState<number[]>([]);
  const [comparing, setComparing] = useState(false);
  const [cropQuery, setCropQuery] = useState("");
  const [pending, start] = useTransition();

  const origin = place ?? districtPlace(initialDistrict);

  useEffect(() => {
    const district = place ? nearestDistrictName(place.lat, place.lng) : initialDistrict;
    start(async () => {
      const r = await fetch(`/api/sell-advice?cropId=${cropId}&qty=${qty}&district=${encodeURIComponent(district)}`);
      const d = (await r.json()) as Advice;
      setData(d);
      setOpenId(d.options[0]?.mandiId ?? null);
    });
  }, [cropId, qty, place, initialDistrict]);

  const crop = crops.find((c) => c.id === cropId)!;
  const best = data.options[0];
  const worst = data.options[data.options.length - 1];

  // refine distances to the exact searched point
  const refined = useMemo(
    () =>
      data.options.map((o) => ({
        ...o,
        km: place ? Math.max(12, kmBetween(place, o)) : o.distanceKm,
      })),
    [data.options, place],
  );

  const filter = cropQuery.trim().toLowerCase();
  const visibleCrops = filter
    ? crops.filter((c) => c.name.toLowerCase().includes(filter) || c.nameOdia.includes(cropQuery.trim()))
    : crops;

  const toggleCompare = (id: number) =>
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 3 ? c : [...c, id]));

  const compareOpts = refined.filter((o) => compare.includes(o.mandiId));

  return (
    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
      {/* left: controls + ranked mandis */}
      <div>
        <div className="rounded-3xl border border-forest-900/10 bg-white/80 p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2 rounded-2xl border border-forest-900/15 bg-white px-3 py-2">
            <Search className="size-3.5 text-forest-900/40" />
            <input
              value={cropQuery}
              onChange={(e) => setCropQuery(e.target.value)}
              placeholder={O ? "ଫସଲ ଖୋଜନ୍ତୁ (ଇଂରାଜୀ / ଓଡ଼ିଆ)…" : "Search crop you know (English / Odia)…"}
              className="w-full bg-transparent text-xs font-semibold text-forest-950 outline-none placeholder:text-forest-900/35"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {visibleCrops.map((c) => (
              <button
                key={c.id}
                onClick={() => setCropId(c.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
                  c.id === cropId ? "bg-forest-950 text-paper shadow" : "border border-forest-900/15 bg-white text-forest-800 hover:border-forest-900/40"
                }`}
              >
                <CropIcon icon={c.icon} className="size-4" />
                {O ? c.nameOdia : c.name}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-forest-900/50">
                {t("trans.origin", lang)}
              </span>
              <LocationSearch value={place} onSelect={setPlace} />
            </div>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-forest-900/50">
                {t("sell.quantity", lang)} · <span className="tnum text-clay-600">{qty} {O ? "କୁଇଣ୍ଟାଲ" : "quintals"}</span>
              </span>
              <div className="flex h-[46px] items-center rounded-2xl border border-forest-900/15 bg-white px-4">
                <input type="range" min={2} max={60} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-full accent-clay-500" />
              </div>
            </label>
          </div>
        </div>

        {/* verdict banner */}
        <AnimatePresence mode="wait">
          {best && (
            <motion.div
              key={best.mandiId + cropId + origin.name + qty}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="grain relative mt-5 overflow-hidden rounded-3xl bg-forest-950 p-6 text-paper sm:p-7"
            >
              <div className="absolute -right-16 -top-16 size-48 rounded-full bg-harvest-400/20 blur-3xl" />
              <div className="relative flex flex-wrap items-center justify-between gap-5">
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-harvest-400">
                    <Crown className="size-3.5" /> {t("sell.verdict", lang)} {O ? crop.nameOdia : crop.name} {t("sell.at", lang)}
                  </p>
                  <p className="font-display mt-2 text-2xl font-semibold leading-tight sm:text-3xl">{best.mandiName}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-paper/60">
                    <MapPin className="size-3" /> {best.district} · {(refined[0] ?? best).km} {O ? "କି.ମି." : "km"} · {travelHrs((refined[0] ?? best).km)} · {corridorText(origin, { lat: best.lat, lng: best.lng, name: best.mandiName, district: best.district, kind: "town" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="tnum font-display text-5xl font-semibold text-harvest-400">{inr(best.netPerQSolo)}</p>
                  <p className="text-xs text-paper/50">{t("sell.netPerQ", lang)} · <span className="tnum text-paper/80">{inr(best.netTotalSolo)}</span> {qty}q</p>
                </div>
              </div>
              <div className="relative mt-4 flex flex-wrap gap-2">
                {worst && worst.mandiId !== best.mandiId && (
                  <p className="flex-1 rounded-xl bg-paper/10 px-4 py-2.5 text-xs font-semibold text-paper/80">
                    {t("sell.worst", lang)} {inr(worst.netPerQSolo)}/q — <span className="text-harvest-400">{inr((best.netPerQSolo - worst.netPerQSolo) * qty)}</span> {t("sell.lost", lang)}
                  </p>
                )}
                <a
                  href={mapsDirUrl(origin, best)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-clay-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-clay-600"
                >
                  <Navigation2 className="size-3.5" /> {t("common.navigate", lang)}
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* compare tray */}
        <AnimatePresence>
          {compare.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="sticky top-24 z-20 mt-4 flex items-center justify-between gap-3 rounded-2xl border border-harvest-500/40 bg-harvest-400/95 px-4 py-3 text-forest-950 shadow-xl"
            >
              <p className="text-xs font-black">{compare.length}/3 {t("common.selected", lang)}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setComparing(true)}
                  disabled={compare.length < 2}
                  className="flex items-center gap-1.5 rounded-full bg-forest-950 px-4 py-2 text-xs font-bold text-paper transition hover:bg-forest-800 disabled:opacity-40"
                >
                  <GitCompareArrows className="size-3.5" /> {t("common.compareNow", lang)}
                </button>
                <button onClick={() => setCompare([])} className="rounded-full border border-forest-950/30 px-3 py-2 text-xs font-bold">{t("common.clear", lang)}</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ranked list */}
        <div className={`mt-5 space-y-3 transition-opacity ${pending ? "opacity-60" : ""}`}>
          {refined.map((o, i) => {
            const open = openId === o.mandiId;
            const fee = o.modalP * 0.01;
            const transport = o.costPerQSolo - fee - 14;
            const checked = compare.includes(o.mandiId);
            return (
              <motion.div
                layout
                key={o.mandiId}
                className={`overflow-hidden rounded-3xl border bg-white/80 transition ${
                  i === 0 ? "border-leaf-500/40 shadow-lg shadow-leaf-500/10" : "border-forest-900/10"
                }`}
              >
                <div className="flex w-full items-center gap-3 px-5 py-4">
                  <label className="grid shrink-0 cursor-pointer place-items-center" title={t("sell.addCompare", lang)}>
                    <input type="checkbox" checked={checked} onChange={() => toggleCompare(o.mandiId)} className="size-4 accent-harvest-500" />
                  </label>
                  <button onClick={() => setOpenId(open ? null : o.mandiId)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-black ${i === 0 ? "bg-harvest-400 text-forest-950" : "bg-forest-950/8 text-forest-900/60"}`}>
                      {i === 0 ? <Crown className="size-4" /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-forest-950">{o.mandiName}</p>
                      <p className="text-[11px] text-forest-900/50">
                        {o.km} {O ? "କି.ମି." : "km"} · {travelHrs(o.km)} · {t("sell.grossLabel", lang)} <span className="tnum">{inr(o.modalP)}/q</span> ·{" "}
                        <span className={o.changePct >= 0 ? "text-leaf-600" : "text-clay-600"}>
                          {o.changePct >= 0 ? "▲" : "▼"} {Math.abs(o.changePct).toFixed(1)}%
                        </span>
                      </p>
                    </div>
                  </button>
                  <button onClick={() => setOpenId(open ? null : o.mandiId)} className="flex items-center gap-2 text-right">
                    <div>
                      <p className={`tnum font-display text-2xl font-semibold ${i === 0 ? "text-leaf-600" : "text-forest-950"}`}>{inr(o.netPerQSolo)}</p>
                      <p className="text-[10px] uppercase tracking-wide text-forest-900/40">{O ? "ନିଟ/କୁଇଣ୍ଟାଲ" : "net/quintal"}</p>
                    </div>
                    <ChevronDown className={`size-4 shrink-0 text-forest-900/40 transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                </div>
                <AnimatePresence>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="border-t border-forest-900/8 bg-paper/60 px-5 py-4">
                        <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-forest-900/50">
                          <ReceiptText className="size-3.5" /> {t("sell.breakdown", lang)}
                        </p>
                        <div className="grid gap-2 text-xs sm:grid-cols-2">
                          <div className="flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5">
                            <span className="text-forest-900/60">{t("sell.modalPrice", lang)}</span>
                            <span className="tnum font-bold text-forest-950">{inr(o.modalP)}/q</span>
                          </div>
                          <div className="flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5">
                            <span className="flex items-center gap-1.5 text-forest-900/60"><Truck className="size-3.5" /> {t("sell.transport", lang)} {o.km}{O ? "କି.ମି." : "km"}</span>
                            <span className="tnum font-bold text-clay-600"><Minus className="inline size-3" />{inr(Math.max(0, Math.round(transport)))}/q</span>
                          </div>
                          <div className="flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5">
                            <span className="text-forest-900/60">{t("sell.feeLabour", lang)}</span>
                            <span className="tnum font-bold text-clay-600"><Minus className="inline size-3" />{inr(Math.round(fee) + 14)}/q</span>
                          </div>
                          <div className="flex items-center justify-between rounded-xl bg-leaf-500/10 px-3.5 py-2.5">
                            <span className="flex items-center gap-1.5 font-semibold text-leaf-600"><Users className="size-3.5" /> {t("sell.pooled", lang)}</span>
                            <span className="tnum font-black text-leaf-600">{inr(o.netPerQPooled)}/q</span>
                          </div>
                        </div>

                        {/* route + map */}
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3.5 py-2.5">
                          <p className="text-[11px] text-forest-900/60">
                            <strong className="text-forest-950">{t("common.bestRoute", lang)}:</strong> {origin.name} → {o.mandiName} ({corridorText(origin, { lat: o.lat, lng: o.lng, name: o.mandiName, district: o.district, kind: "town" })})
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setMapId(mapId === o.mandiId ? null : o.mandiId)}
                              className="flex items-center gap-1 rounded-full border border-forest-900/15 px-3 py-1.5 text-[11px] font-bold text-forest-900 transition hover:border-forest-900/40"
                            >
                              <MapPin className="size-3" /> {mapId === o.mandiId ? t("common.hideMap", lang) : t("common.viewMap", lang)}
                            </button>
                            <a
                              href={mapsDirUrl(origin, o)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 rounded-full bg-clay-500 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-clay-600"
                            >
                              <Navigation2 className="size-3" /> {t("common.navigate", lang)}
                            </a>
                          </div>
                        </div>
                        {mapId === o.mandiId && (
                          <iframe
                            title="route map"
                            src={`https://maps.google.com/maps?output=embed&saddr=${origin.lat},${origin.lng}&daddr=${o.lat},${o.lng}&hl=${O ? "or" : "en"}`}
                            className="mt-3 h-56 w-full rounded-2xl border border-forest-900/10"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        )}

                        {o.netPerQPooled - o.netPerQSolo > 20 && (
                          <p className="mt-3 rounded-xl bg-forest-950 px-4 py-2.5 text-xs font-semibold text-paper">
                            {t("sell.poolTip", lang)} <span className="text-harvest-400">{inr((o.netPerQPooled - o.netPerQSolo) * qty)}</span> {t("sell.extra", lang)} {qty}q →{" "}
                            <a href="/transport" className="underline decoration-harvest-400 underline-offset-2">{t("sell.seePools", lang)}</a>
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* right: demands + pools */}
      <div className="space-y-5">
        <section className="rounded-3xl bg-forest-950 p-6 text-paper">
          <h3 className="flex items-center gap-2 text-sm font-bold"><Handshake className="size-4 text-harvest-400" /> {t("sell.contracts", lang)}</h3>
          <div className="mt-4 space-y-3">
            {data.demands.slice(0, 4).map((d) => (
              <div key={d.id} className="rounded-2xl bg-paper/5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">{d.buyerName}</p>
                    <p className="text-[11px] text-paper/50">{d.buyerType} · {d.district} · {d.distanceKm} {O ? "କି.ମି." : "km"}</p>
                  </div>
                  {d.verified && <span className="rounded-full bg-leaf-500/15 px-2 py-0.5 text-[10px] font-bold text-leaf-300">✓ {t("sell.verified", lang)}</span>}
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <p className="text-[11px] text-paper/50">{t("sell.wants", lang)} {d.qtyQuintal}q · {t("sell.by", lang)} {shortDate(d.deadline)}</p>
                  <p className="tnum text-xl font-bold text-harvest-400">{inr(d.pricePerQuintal)}<span className="text-xs text-paper/50">/q</span></p>
                </div>
                <p className="mt-1 text-[10px] text-paper/40">{t("sell.deliverAt", lang)}: {d.deliveryPoint}</p>
              </div>
            ))}
            {data.demands.length === 0 && <p className="text-xs text-paper/50">{t("sell.noContract", lang)}</p>}
          </div>
        </section>

        <section className="rounded-3xl border border-forest-900/10 bg-white/80 p-6">
          <h3 className="flex items-center gap-2 text-sm font-bold text-forest-950"><Users className="size-4 text-leaf-600" /> {t("sell.openPoolsJoin", lang)}</h3>
          <div className="mt-4 space-y-2.5">
            {data.pools.slice(0, 3).map((p) => (
              <a key={p.id} href="/transport" className="block rounded-2xl border border-forest-900/8 bg-paper px-4 py-3 transition hover:border-leaf-500/40">
                <p className="text-xs font-bold text-forest-950">{p.cropName}: {p.fromDistrict} → {p.toMandi}</p>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-forest-900/50">
                  <span>{shortDate(p.departDate)} · {Math.round(p.filledQuintal)}/{p.capacityQuintal}q</span>
                  <span className="tnum font-black text-forest-950">{inr(p.costPerQuintal)}/q</span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-forest-900/10">
                  <div className="h-full rounded-full bg-leaf-500" style={{ width: `${(p.filledQuintal / p.capacityQuintal) * 100}%` }} />
                </div>
              </a>
            ))}
          </div>
        </section>

        <aside className="rounded-3xl border border-harvest-500/30 bg-harvest-400/10 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-harvest-600">{t("sell.rule", lang)}</p>
          <p className="font-display mt-2 text-xl font-semibold text-forest-950">{t("sell.ruleText", lang)}</p>
        </aside>
      </div>

      {/* compare modal */}
      <AnimatePresence>
        {comparing && compareOpts.length >= 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-forest-950/60 p-4 backdrop-blur-sm" onClick={() => setComparing(false)}>
            <motion.div
              initial={{ y: 30, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="w-full max-w-2xl rounded-3xl bg-paper p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-clay-500"><GitCompareArrows className="mr-1 inline size-3" /> {t("common.compare", lang)}</p>
                  <h3 className="font-display mt-1 text-2xl font-semibold text-forest-950">{t("sell.compareTitle", lang)}</h3>
                </div>
                <button onClick={() => setComparing(false)} className="rounded-full p-1.5 hover:bg-forest-900/5"><X className="size-4" /></button>
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-forest-900/10 text-[10px] uppercase tracking-wider text-forest-900/45">
                      <th className="pb-2 pr-3"></th>
                      {compareOpts.map((o) => {
                        const win = o.mandiId === compareOpts.reduce((a, b) => (a.netPerQSolo >= b.netPerQSolo ? a : b)).mandiId;
                        return (
                          <th key={o.mandiId} className="pb-2 pr-3">
                            <div className="text-[11px] font-black normal-case tracking-normal text-forest-950">{o.mandiName}</div>
                            {win && <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-harvest-400 px-2 py-0.5 text-[9px] font-black text-forest-950"><Crown className="size-2.5" /> {t("common.winner", lang)}</span>}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="tnum divide-y divide-forest-900/5 text-forest-900/75">
                    <tr><td className="py-2.5 pr-3 font-semibold text-forest-900/60">{t("sell.modalPrice", lang)}</td>{compareOpts.map((o) => <td key={o.mandiId} className="py-2.5 pr-3 font-bold">{inr(o.modalP)}/q</td>)}</tr>
                    <tr><td className="py-2.5 pr-3 font-semibold text-forest-900/60">{t("sell.transport", lang)} + {t("sell.feeLabour", lang)}</td>{compareOpts.map((o) => <td key={o.mandiId} className="py-2.5 pr-3 text-clay-600">−{inr(o.costPerQSolo)}/q</td>)}</tr>
                    <tr><td className="py-2.5 pr-3 font-semibold text-forest-900/60">{t("sell.netPerQ", lang)}</td>{compareOpts.map((o) => <td key={o.mandiId} className="py-2.5 pr-3 text-base font-black text-leaf-600">{inr(o.netPerQSolo)}/q</td>)}</tr>
                    <tr><td className="py-2.5 pr-3 font-semibold text-forest-900/60">{t("common.distance", lang)}</td>{compareOpts.map((o) => <td key={o.mandiId} className="py-2.5 pr-3">{o.km} {O ? "କି.ମି." : "km"}</td>)}</tr>
                    <tr><td className="py-2.5 pr-3 font-semibold text-forest-900/60">{t("common.estTime", lang)}</td>{compareOpts.map((o) => <td key={o.mandiId} className="py-2.5 pr-3">{travelHrs(o.km)}</td>)}</tr>
                    <tr>
                      <td className="py-2.5 pr-3 font-semibold text-forest-900/60">{t("common.navigate", lang)}</td>
                      {compareOpts.map((o) => (
                        <td key={o.mandiId} className="py-2.5 pr-3">
                          <a href={mapsDirUrl(origin, o)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-clay-500 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-clay-600">
                            <Navigation2 className="size-3" /> {t("common.viewMap", lang)}
                          </a>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 rounded-xl bg-harvest-400/15 px-3.5 py-2.5 text-[11px] font-semibold text-forest-900/75">
                {(() => {
                  const w = compareOpts.reduce((a, b) => (a.netPerQSolo >= b.netPerQSolo ? a : b));
                  return O
                    ? `ଚୂଡ଼ାନ୍ତ ପରାମର୍ଶ: ${w.mandiName} — କୁଇଣ୍ଟାଲ ପିଛା ${inr(w.netPerQSolo)} ନିଟ, ${qty}q ଉପରେ ମୋଟ ${inr(w.netPerQSolo * qty)}।`
                    : `Final suggestion: ${w.mandiName} — net ${inr(w.netPerQSolo)}/q, total ${inr(w.netPerQSolo * qty)} for ${qty}q.`;
                })()}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
