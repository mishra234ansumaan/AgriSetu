"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Crown, MapPin, Navigation2, Search, X } from "lucide-react";
import LocationSearch from "@/components/geo/LocationSearch";
import RouteMap from "@/components/geo/RouteMap";
import { districtPlace, kmBetween, mapsDirUrl, travelHrs, type Place } from "@/lib/locations";
import { inr } from "@/lib/odisha";
import { useLang, t } from "@/lib/i18n";

export interface GeoMandi {
  id: number;
  name: string;
  district: string;
  lat: number;
  lng: number;
  modalP: number;
}

export default function MandiGeo({ mandis }: { mandis: GeoMandi[] }) {
  const { lang } = useLang();
  const O = lang === "od";
  const [place, setPlace] = useState<Place | null>(null);
  const [mapFor, setMapFor] = useState<number | null>(null);

  const origin = place ?? districtPlace("Kandhamal");
  const nearest = useMemo(
    () =>
      [...mandis]
        .map((m) => ({ ...m, km: kmBetween(origin, m) }))
        .sort((a, b) => a.km - b.km)
        .slice(0, 3),
    [mandis, origin],
  );

  return (
    <div className="rounded-3xl border border-forest-900/10 bg-white/80 p-6 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-forest-950">
            <Navigation2 className="size-5 text-clay-500" /> {t("mandi.geoTitle", lang)}
          </h2>
          <p className="mt-1 text-xs text-forest-900/55">{t("mandi.geoSub", lang)}</p>
        </div>
        <div className="w-full sm:w-80">
          <LocationSearch value={place} onSelect={setPlace} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {nearest.map((m, i) => (
          <motion.div
            key={m.id}
            layout
            className={`rounded-2xl border p-4 ${i === 0 ? "border-harvest-500/50 bg-harvest-400/10" : "border-forest-900/10 bg-paper"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-black leading-tight text-forest-950">{m.name}</p>
              {i === 0 && (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-harvest-400 px-2 py-0.5 text-[9px] font-black text-forest-950">
                  <Crown className="size-2.5" /> {t("common.nearest", lang)}
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-forest-900/50">
              {m.district} · <strong className="text-forest-950">{m.km} {O ? "କି.ମି." : "km"}</strong> · {travelHrs(m.km)}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <p className="tnum font-display text-lg font-semibold text-forest-950">{inr(m.modalP)}<span className="text-[10px] font-medium text-forest-900/40">/q</span></p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setMapFor(mapFor === m.id ? null : m.id)}
                  className="grid size-8 place-items-center rounded-full border border-forest-900/15 text-forest-900 hover:border-forest-900/40"
                  title={t("common.viewMap", lang)}
                >
                  <MapPin className="size-3.5" />
                </button>
                <a
                  href={mapsDirUrl(origin, m)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid size-8 place-items-center rounded-full bg-clay-500 text-white hover:bg-clay-600"
                  title={t("common.navigate", lang)}
                >
                  <Navigation2 className="size-3.5" />
                </a>
              </div>
            </div>
            {mapFor === m.id && (
              <div className="mt-3">
                <RouteMap origin={origin} dest={{ name: m.name, district: m.district, lat: m.lat, lng: m.lng, kind: "town" }} />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* Searchable mandi table wrapper */
export function MandiSearch({
  rows,
}: {
  rows: { mandiId: number; name: string; district: string; todayP: number; minP: number; maxP: number; change: number; spark: number[]; rank: number }[];
}) {
  const { lang } = useLang();
  const O = lang === "od";
  const [q, setQ] = useState("");
  const filter = q.trim().toLowerCase();
  const shown = filter ? rows.filter((r) => r.name.toLowerCase().includes(filter) || r.district.toLowerCase().includes(filter)) : rows;

  return (
    <div>
      <div className="flex items-center gap-2 rounded-2xl border border-forest-900/15 bg-white px-4 py-2.5">
        <Search className="size-4 text-forest-900/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("mandi.searchTable", lang)}
          className="w-full bg-transparent text-sm font-semibold text-forest-950 outline-none placeholder:text-forest-900/35"
        />
        {q && (
          <button onClick={() => setQ("")} className="rounded-full p-1 text-forest-900/40 hover:bg-forest-900/5">
            <X className="size-3.5" />
          </button>
        )}
      </div>
      {filter && shown.length > 0 && (
        <p className="mt-2 px-1 text-[11px] text-forest-900/50">
          {shown.length} {O ? "ମାଣ୍ଡି ମିଳିଲା — ସର୍ବୋତ୍ତମ:" : "matched — best price among them:"}{" "}
          <strong className="text-leaf-600">{shown.reduce((a, b) => (a.todayP >= b.todayP ? a : b)).name}</strong>
        </p>
      )}
      <div className="mt-3 divide-y divide-forest-900/5 overflow-hidden rounded-3xl border border-forest-900/10 bg-white/80">
        {shown.map((r) => (
          <div key={r.mandiId} className="grid grid-cols-[1.5fr_1fr] items-center gap-3 px-5 py-3.5 transition hover:bg-paper/60 sm:grid-cols-[0.35fr_2fr_1fr_1fr_1fr_0.7fr]">
            <div className="hidden text-center sm:block">
              {r.rank === 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-harvest-400/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-harvest-600">
                  <Crown className="size-3" /> {t("mandi.best", lang)}
                </span>
              ) : (
                <span className="tnum text-xs font-bold text-forest-900/30">#{r.rank + 1}</span>
              )}
            </div>
            <div>
              <p className="flex items-center gap-2 text-sm font-bold text-forest-950">{r.name}</p>
              <p className="text-[11px] text-forest-900/50">{r.district}</p>
            </div>
            <div className="hidden text-[11px] text-forest-900/50 sm:block">{t("mandi.trend", lang)} →</div>
            <div className="hidden sm:block">
              <p className="text-[10px] uppercase tracking-wide text-forest-900/40">{t("mandi.minMax", lang)}</p>
              <p className="tnum text-xs font-semibold text-forest-900/70">{inr(r.minP)} — {inr(r.maxP)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-forest-900/40">{t("mandi.modal", lang)}</p>
              <p className="tnum font-display text-xl font-semibold text-forest-950">{inr(r.todayP)}</p>
            </div>
            <div className="text-right sm:text-left">
              <span className={`tnum inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${r.change >= 0 ? "bg-leaf-500/10 text-leaf-600" : "bg-clay-500/10 text-clay-600"}`}>
                {r.change >= 0 ? "▲" : "▼"} {Math.abs(r.change).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
        {shown.length === 0 && <p className="px-6 py-8 text-center text-sm text-forest-900/50">{O ? "କୌଣସି ମାଣ୍ଡି ମିଳିଲା ନାହିଁ" : "No mandis match your search"}</p>}
      </div>
    </div>
  );
}
