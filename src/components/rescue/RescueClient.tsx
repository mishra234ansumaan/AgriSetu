"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Clock3,
  Crown,
  Factory,
  FlaskConical,
  MapPin,
  Refrigerator,
  Shovel,
  Store,
  ThermometerSnowflake,
} from "lucide-react";
import FreshnessRing from "@/components/FreshnessRing";
import CropIcon from "@/components/CropIcon";
import { DecayChart } from "@/components/Charts";
import { computeFreshness, decayCurve, STAGE_META } from "@/lib/decay";
import { districtDistance, inr, todayISO } from "@/lib/odisha";
import { useLang, t } from "@/lib/i18n";
import type { AdviceOption } from "@/components/sell/SellClient";

export interface RescueCrop {
  id: number;
  name: string;
  nameOdia: string;
  icon: string;
  shelfDays: number;
  coldMultiplier: number;
  perishable: boolean;
}
export interface RescueLot {
  id: number;
  cropId: number;
  qty: number;
  harvestDate: string;
  condition: string;
  district: string;
}
export interface RescueFacility {
  id: number;
  name: string;
  type: string;
  district: string;
  availableQuintal: number;
  ratePerQPerDay: number;
}

const CONDITIONS = [
  { key: "open", en: "Open air", od: "ଖୋଲା" },
  { key: "shade", en: "Shade / tarpaulin", od: "ଛାଇ" },
  { key: "cold", en: "Cold room", od: "ଥଣ୍ଡା କୋଠରୀ" },
];

export default function RescueClient({
  crops,
  lots,
  coldStorages,
  processors,
}: {
  crops: RescueCrop[];
  lots: RescueLot[];
  coldStorages: RescueFacility[];
  processors: RescueFacility[];
}) {
  const { lang } = useLang();
  const O = lang === "od";
  const [mode, setMode] = useState<"lot" | "sim">("lot");
  const [lotId, setLotId] = useState(lots[0]?.id ?? 0);
  const [simCrop, setSimCrop] = useState(crops.find((c) => c.name === "Tomato")?.id ?? crops[0].id);
  const [simDays, setSimDays] = useState(2);
  const [simQty, setSimQty] = useState(8);
  const [simCond, setSimCond] = useState("open");
  const [options, setOptions] = useState<AdviceOption[]>([]);

  const activeLot = lots.find((l) => l.id === lotId);
  const cropId = mode === "lot" ? activeLot?.cropId ?? simCrop : simCrop;
  const harvestDate = mode === "lot" ? activeLot?.harvestDate ?? todayISO() : todayISO(-simDays);
  const condition = mode === "lot" ? activeLot?.condition ?? "open" : simCond;
  const qty = mode === "lot" ? activeLot?.qty ?? simQty : simQty;
  const district = activeLot?.district ?? "Kandhamal";

  const crop = crops.find((c) => c.id === cropId) ?? crops[0];
  const fresh = computeFreshness(crop.shelfDays, harvestDate, condition, crop.coldMultiplier);
  const meta = STAGE_META[fresh.stage];
  const elapsed = Math.max(0, Math.round((Date.now() - new Date(harvestDate + "T00:00:00").getTime()) / 86400000));
  const curve = useMemo(() => decayCurve(crop.shelfDays, condition, crop.coldMultiplier, elapsed), [crop.shelfDays, condition, crop.coldMultiplier, elapsed]);

  const bestCold = useMemo(
    () => [...coldStorages].sort((a, b) => districtDistance(district, a.district) - districtDistance(district, b.district))[0],
    [coldStorages, district],
  );
  const bestProcessor = useMemo(
    () => [...processors].sort((a, b) => districtDistance(district, a.district) - districtDistance(district, b.district))[0],
    [processors, district],
  );
  const daysGained = Math.max(0, Math.round(crop.shelfDays * crop.coldMultiplier) - fresh.effectiveShelf);

  useEffect(() => {
    fetch(`/api/sell-advice?cropId=${cropId}&qty=${qty}&district=${encodeURIComponent(district)}`)
      .then((r) => r.json())
      .then((d) => setOptions(d.options ?? []))
      .catch(() => {});
  }, [cropId, qty, district]);
  const bestMandi = options[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.35fr]">
      {/* left */}
      <div className="space-y-5">
        <div className="flex rounded-2xl bg-forest-950/5 p-1">
          {([["lot", "rescue.myLots"], ["sim", "rescue.simulate"]] as const).map(([k, keyName]) => (
            <button key={k} onClick={() => setMode(k)} className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition ${mode === k ? "bg-forest-950 text-paper shadow" : "text-forest-900/60"}`}>
              {t(keyName, lang)}
            </button>
          ))}
        </div>

        {mode === "lot" ? (
          <div className="space-y-2.5">
            {lots.map((l) => {
              const c = crops.find((x) => x.id === l.cropId)!;
              const f = computeFreshness(c.shelfDays, l.harvestDate, l.condition, c.coldMultiplier);
              const m = STAGE_META[f.stage];
              return (
                <button
                  key={l.id}
                  onClick={() => setLotId(l.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
                    lotId === l.id ? "border-forest-950 bg-white shadow-md" : "border-forest-900/10 bg-white/60 hover:border-forest-900/30"
                  }`}
                >
                  <span className="grid size-10 place-items-center rounded-xl" style={{ background: m.soft, color: m.color }}>
                    <CropIcon icon={c.icon} className="size-5" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-forest-950">{O ? c.nameOdia : c.name} · {l.qty}q</p>
                    <p className="text-[11px] text-forest-900/50">{l.district} · {O ? CONDITIONS.find((x) => x.key === l.condition)?.od : l.condition}</p>
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-[10px] font-black" style={{ background: m.soft, color: m.color }}>
                    {f.pct}%
                  </span>
                </button>
              );
            })}
            {lots.length === 0 && <p className="text-sm text-forest-900/50">{t("rescue.noLots", lang)}</p>}
          </div>
        ) : (
          <div className="rounded-3xl border border-forest-900/10 bg-white/80 p-5">
            <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-forest-900/50">
              <FlaskConical className="size-3.5" /> {t("rescue.simLab", lang)}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {crops.filter((c) => c.perishable).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSimCrop(c.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition ${
                    simCrop === c.id ? "bg-forest-950 text-paper" : "border border-forest-900/15 text-forest-800 hover:border-forest-900/40"
                  }`}
                >
                  <CropIcon icon={c.icon} className="size-3.5" /> {O ? c.nameOdia : c.name}
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-forest-900/60">{t("rescue.daysSince", lang)} · <span className="tnum text-clay-600">{simDays}</span></span>
                <input type="range" min={0} max={14} value={simDays} onChange={(e) => setSimDays(Number(e.target.value))} className="w-full accent-clay-500" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-forest-900/60">{t("rescue.quantity", lang)} · <span className="tnum text-clay-600">{simQty}q</span></span>
                <input type="range" min={2} max={40} value={simQty} onChange={(e) => setSimQty(Number(e.target.value))} className="w-full accent-clay-500" />
              </label>
              <div className="flex gap-2">
                {CONDITIONS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setSimCond(c.key)}
                    className={`flex-1 rounded-xl border px-2 py-2.5 text-center transition ${simCond === c.key ? "border-forest-950 bg-forest-950 text-paper" : "border-forest-900/15 text-forest-800"}`}
                  >
                    <span className="block text-[11px] font-bold">{O ? c.od : c.en}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="rounded-3xl bg-forest-950 p-6 text-paper">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-harvest-400">
            <Clock3 className="size-3.5" /> {t("rescue.curve", lang)} · {O ? crop.nameOdia : crop.name}
          </p>
          <div className="mt-4">
            <DecayChart data={curve} elapsed={elapsed} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-paper/50">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-clay-500" /> {t("rescue.openDecay", lang)}</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-leaf-400" /> {t("rescue.yourStorage", lang)} ({condition === "open" ? (O ? "ଖୋଲା" : "open") : condition === "shade" ? (O ? "ଛାଇ" : "shade") : (O ? "ଥଣ୍ଡା" : "cold")})</span>
          </div>
        </div>
      </div>

      {/* right */}
      <div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${cropId}-${harvestDate}-${condition}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`rounded-3xl p-6 text-paper sm:p-8 ${fresh.pct <= 25 ? "grain bg-gradient-to-br from-clay-600 to-forest-950" : "grain bg-forest-950"}`}
          >
            <div className="flex flex-wrap items-center gap-6">
              <FreshnessRing pct={fresh.pct} stage={fresh.stage} size={140} stroke={12} />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-harvest-400">{O ? crop.nameOdia : crop.name} · {qty}q · {district}</p>
                <p className="font-display mt-1 text-3xl font-semibold leading-tight">{O ? meta.odia : meta.label} <span className="odia text-xl text-paper/60">{meta.odia}</span></p>
                <p className="mt-2 text-sm leading-6 text-paper/70">{O ? meta.odia : meta.label}: {meta.advice}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold">
                  <span className="rounded-full bg-paper/10 px-3 py-1.5">{fresh.daysLeft} {t("rescue.lifeLeft", lang)}</span>
                  <span className="rounded-full bg-paper/10 px-3 py-1.5">{t("rescue.shelf", lang)}: {crop.shelfDays}d {t("rescue.openAir", lang)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-5 space-y-3">
          {/* sell now */}
          <div className="rounded-3xl border border-forest-900/10 bg-white/80 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-leaf-500/12 text-leaf-600"><Store className="size-5" /></span>
                <div>
                  <p className="flex items-center gap-2 text-sm font-black text-forest-950">
                    {t("rescue.sellNow", lang)} {(fresh.stage === "urgent" || fresh.stage === "critical") && <Crown className="size-4 text-harvest-500" />}
                  </p>
                </div>
              </div>
              {bestMandi && (
                <div className="text-right">
                  <p className="tnum font-display text-2xl font-semibold text-forest-950">{inr(bestMandi.netPerQSolo)}<span className="text-xs text-forest-900/40">/q {O ? "ନିଟ" : "net"}</span></p>
                  <p className="text-[11px] text-forest-900/50">{bestMandi.mandiName} · {bestMandi.distanceKm} {O ? "କି.ମି." : "km"}</p>
                </div>
              )}
            </div>
            <p className="mt-3 rounded-xl bg-paper px-4 py-2.5 text-xs leading-5 text-forest-900/70">
              {fresh.pct <= 50 ? t("rescue.sellNoteHigh", lang) : t("rescue.sellNoteLow", lang)}
            </p>
            {bestMandi && (
              <a href={`/sell?crop=${cropId}`} className="group mt-3 flex items-center justify-between rounded-2xl bg-forest-950 px-4 py-3 text-xs font-bold text-paper transition hover:bg-forest-800">
                {t("rescue.compareMandis", lang)} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </a>
            )}
          </div>

          {/* freeze */}
          {bestCold && (
            <div className="rounded-3xl border border-forest-900/10 bg-white/80 p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-2xl bg-sky-500/12 text-sky-600"><ThermometerSnowflake className="size-5" /></span>
                  <div>
                    <p className="text-sm font-black text-forest-950">{t("rescue.freeze", lang)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="tnum font-display text-2xl font-semibold text-sky-700">+{daysGained}{O ? "ଦିନ" : "d"}</p>
                  <p className="text-[11px] text-forest-900/50">{t("rescue.extraLife", lang)}</p>
                </div>
              </div>
              <div className="mt-3 grid gap-2 rounded-xl bg-paper px-4 py-3 text-xs text-forest-900/70 sm:grid-cols-2">
                <p className="flex items-center gap-1.5"><Refrigerator className="size-3.5 text-sky-600" /> <strong className="text-forest-950">{bestCold.name}</strong></p>
                <p className="flex items-center gap-1.5"><MapPin className="size-3.5" /> {bestCold.district} · {districtDistance(district, bestCold.district)} {O ? "କି.ମି." : "km"}</p>
                <p className="tnum">{inr(bestCold.ratePerQPerDay)}/q/{O ? "ଦିନ" : "day"} → ~{inr(bestCold.ratePerQPerDay * qty * 7)} {t("rescue.forWeek", lang)} {qty}q</p>
                <p className="tnum">{bestCold.availableQuintal}q {t("rescue.capacityFree", lang)}</p>
              </div>
              <a href="/storage" className="group mt-3 flex items-center justify-between rounded-2xl border border-sky-600/30 bg-sky-500/10 px-4 py-3 text-xs font-bold text-sky-800 transition hover:bg-sky-500/20">
                {t("rescue.bookCold", lang)} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          )}

          {/* salvage */}
          {bestProcessor && (
            <div className="rounded-3xl border border-clay-500/25 bg-clay-500/[0.06] p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-clay-500/12 text-clay-600"><Factory className="size-5" /></span>
                <div>
                  <p className="text-sm font-black text-forest-950">{t("rescue.salvage", lang)}</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-forest-900/70">
                <strong className="text-forest-950">{bestProcessor.name}</strong> ({bestProcessor.district}, {districtDistance(district, bestProcessor.district)} {O ? "କି.ମି." : "km"}) — {t("rescue.salvageNote", lang)}
              </p>
              <a href="/storage?type=processing" className="group mt-3 flex items-center justify-between rounded-2xl bg-clay-500 px-4 py-3 text-xs font-bold text-white transition hover:bg-clay-600">
                <span className="flex items-center gap-2"><Shovel className="size-3.5" /> {t("rescue.routeProcessing", lang)}</span>
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
