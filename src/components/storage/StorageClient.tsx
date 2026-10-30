"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Crown,
  Factory,
  GitCompareArrows,
  MapPin,
  Navigation2,
  Phone,
  Refrigerator,
  Search,
  Warehouse,
  X,
} from "lucide-react";
import LocationSearch from "@/components/geo/LocationSearch";
import RouteMap from "@/components/geo/RouteMap";
import { districtPlace, kmBetween, mapsDirUrl, travelHrs, type Place } from "@/lib/locations";
import { inr } from "@/lib/odisha";
import { useLang, t } from "@/lib/i18n";

export interface Facility {
  id: number;
  name: string;
  type: string;
  district: string;
  lat: number;
  lng: number;
  capacityQuintal: number;
  availableQuintal: number;
  ratePerQPerDay: number;
  contact: string;
  services: string;
}

const TABS = [
  { key: "cold", labelKey: "storage.tabCold", icon: Refrigerator },
  { key: "warehouse", labelKey: "storage.tabWarehouse", icon: Warehouse },
  { key: "processing", labelKey: "storage.tabProcessing", icon: Factory },
] as const;

export default function StorageClient({ facilities, initialType = "cold" }: { facilities: Facility[]; initialType?: string }) {
  const { lang } = useLang();
  const O = lang === "od";
  const [type, setType] = useState<string>(initialType);
  const [place, setPlace] = useState<Place | null>(districtPlace("Kandhamal"));
  const [query, setQuery] = useState("");
  const [booking, setBooking] = useState<Facility | null>(null);
  const [qty, setQty] = useState(10);
  const [days, setDays] = useState(7);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [booked, setBooked] = useState<Record<number, number>>({});
  const [mapFor, setMapFor] = useState<Facility | null>(null);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [comparing, setComparing] = useState(false);

  const origin = place ?? districtPlace("Kandhamal");

  const list = useMemo(() => {
    let arr = facilities
      .filter((f) => f.type === type)
      .map((f) => ({ ...f, available: f.availableQuintal - (booked[f.id] ?? 0), dist: kmBetween(origin, f) }));
    const q = query.trim().toLowerCase();
    if (q) arr = arr.filter((f) => f.name.toLowerCase().includes(q) || f.district.toLowerCase().includes(q) || f.services.toLowerCase().includes(q));
    return arr.sort((a, b) => a.dist - b.dist);
  }, [facilities, type, origin, booked, query]);

  async function confirm() {
    if (!booking) return;
    setState("sending");
    setError("");
    try {
      const r = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "storage", refId: booking.id, farmerId: 1, qtyQuintal: qty, days }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Booking failed");
      setBooked((b) => ({ ...b, [booking.id]: (b[booking.id] ?? 0) + qty }));
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setState("idle");
    }
  }

  const toggleCompare = (id: number) =>
    setCompareIds((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 3 ? c : [...c, id]));
  const compareList = list.filter((f) => compareIds.includes(f.id));

  return (
    <div>
      {/* controls row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setType(tab.key); setCompareIds([]); }}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition ${
                type === tab.key ? "bg-forest-950 text-paper shadow" : "border border-forest-900/15 bg-white/70 text-forest-800 hover:border-forest-900/40"
              }`}
            >
              <tab.icon className="size-4" />
              {t(tab.labelKey, lang)}
            </button>
          ))}
        </div>
        <div className="min-w-[220px] flex-1 sm:max-w-xs">
          <LocationSearch value={place} onSelect={setPlace} compact />
        </div>
        <div className="flex min-w-[180px] items-center gap-2 rounded-2xl border border-forest-900/15 bg-white px-3 py-2">
          <Search className="size-3.5 shrink-0 text-forest-900/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("storage.searchPh", lang)}
            className="w-full bg-transparent text-xs font-semibold text-forest-950 outline-none placeholder:text-forest-900/35"
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {list.map((f, idx) => {
            const availPct = f.capacityQuintal ? Math.round((f.available / f.capacityQuintal) * 100) : 0;
            return (
              <motion.div
                layout
                key={f.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col rounded-3xl border border-forest-900/10 bg-white/80 p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-forest-900/10"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-black leading-snug text-forest-950">
                      {f.name}
                      {idx === 0 && <span className="rounded-full bg-harvest-400/25 px-1.5 py-0.5 text-[9px] font-black uppercase text-harvest-600"><Crown className="mr-0.5 inline size-2.5" />{t("common.nearest", lang)}</span>}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-forest-900/50">
                      <MapPin className="size-3" /> {f.district} · <strong className="text-forest-900">{f.dist} {O ? "କି.ମି." : "km"}</strong> · {travelHrs(f.dist)} · <Phone className="size-3" /> {f.contact}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${availPct > 40 ? "bg-leaf-500/12 text-leaf-600" : availPct > 15 ? "bg-harvest-400/20 text-harvest-600" : "bg-clay-500/12 text-clay-600"}`}>
                      {availPct > 40 ? t("storage.open", lang) : availPct > 15 ? t("storage.filling", lang) : t("storage.almostFull", lang)}
                    </span>
                    <label className="grid size-6 cursor-pointer place-items-center rounded-md border border-forest-900/20" title={t("common.compare", lang)}>
                      <input type="checkbox" className="size-3.5 accent-harvest-500" checked={compareIds.includes(f.id)} onChange={() => toggleCompare(f.id)} />
                    </label>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-forest-900/60">
                    <span>{t("storage.freeCapacity", lang)}</span>
                    <span className="tnum text-forest-950">{f.available.toLocaleString("en-IN")}q / {f.capacityQuintal.toLocaleString("en-IN")}q</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-forest-900/10">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-leaf-500 to-leaf-400" initial={{ width: 0 }} whileInView={{ width: `${Math.max(4, availPct)}%` }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
                  </div>
                </div>

                <p className="mt-3 line-clamp-1 text-[11px] text-forest-900/50">{f.services}</p>

                <div className="mt-4 flex items-center justify-between border-t border-forest-900/8 pt-4">
                  <p className="tnum font-display text-xl font-semibold text-forest-950">
                    {inr(f.ratePerQPerDay)}<span className="text-xs font-medium text-forest-900/40">{t("storage.perDay", lang)}</span>
                  </p>
                  <div className="flex gap-1.5">
                    <a
                      href={mapsDirUrl(origin, f)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMapFor(f)}
                      className="grid size-9 place-items-center rounded-full border border-forest-900/15 text-forest-900 transition hover:border-forest-900/40"
                      title={t("common.navigate", lang)}
                    >
                      <Navigation2 className="size-3.5" />
                    </a>
                    <button
                      onClick={() => setMapFor(mapFor?.id === f.id ? null : f)}
                      className="grid size-9 place-items-center rounded-full border border-forest-900/15 text-forest-900 transition hover:border-forest-900/40"
                      title={t("common.viewMap", lang)}
                    >
                      <MapPin className="size-3.5" />
                    </button>
                    <button
                      onClick={() => { setBooking(f); setState("idle"); setQty(Math.min(10, Math.max(1, f.available))); }}
                      className="rounded-full bg-forest-950 px-4 py-2 text-xs font-bold text-paper transition hover:bg-forest-800"
                    >
                      {t("storage.bookSpace", lang)}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {mapFor?.id === f.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="mt-4">
                        <RouteMap origin={origin} dest={{ name: f.name, district: f.district, lat: f.lat, lng: f.lng, kind: "town" }} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      {list.length === 0 && (
        <p className="mt-10 text-center text-sm text-forest-900/50">{O ? "କୌଣସି ଭଣ୍ଡାର ମିଳିଲା ନାହିଁ — ଅନ୍ୟ ନାମ ଚେଷ୍ଟା କରନ୍ତୁ" : "No facilities match — try another name"}</p>
      )}

      {/* booking modal */}
      <AnimatePresence>
        {booking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-forest-950/60 p-4 backdrop-blur-sm" onClick={() => setBooking(null)}>
            <motion.div initial={{ y: 30, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.97 }} transition={{ type: "spring", stiffness: 260, damping: 24 }} className="w-full max-w-md rounded-3xl bg-paper p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {state === "done" ? (
                <div className="py-6 text-center">
                  <CheckCircle2 className="mx-auto size-12 text-leaf-500" />
                  <p className="font-display mt-4 text-2xl font-semibold text-forest-950">{t("storage.done", lang)}</p>
                  <p className="mt-3 text-sm text-forest-900/70">
                    {qty}q · {days} {t("storage.days", lang)} · {booking.name} — {inr(booking.ratePerQPerDay * qty * days)}. {t("storage.doneBody", lang)}
                  </p>
                  <a href={mapsDirUrl(origin, booking)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full border border-clay-500/40 bg-clay-500/10 px-4 py-2.5 text-xs font-bold text-clay-600 hover:bg-clay-500/20">
                    <Navigation2 className="size-3.5" /> {t("common.navigate", lang)} — {kmBetween(origin, booking)} {O ? "କି.ମି." : "km"} · {travelHrs(kmBetween(origin, booking))}
                  </a>
                  <div><button onClick={() => setBooking(null)} className="mt-4 rounded-full bg-forest-950 px-6 py-3 text-sm font-bold text-paper">{t("common.done", lang)}</button></div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-clay-500">{t("storage.reserve", lang)}</p>
                      <h3 className="font-display mt-1 text-2xl font-semibold leading-tight text-forest-950">{booking.name}</h3>
                      <p className="text-xs text-forest-900/50">{kmBetween(origin, booking)} {O ? "କି.ମି." : "km"} · {travelHrs(kmBetween(origin, booking))} {O ? "ଆପଣଙ୍କଠାରୁ" : "away"}</p>
                    </div>
                    <button onClick={() => setBooking(null)} className="rounded-full p-1.5 hover:bg-forest-900/5"><X className="size-4" /></button>
                  </div>
                  <div className="mt-5 space-y-4">
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold text-forest-900/60">
                        {t("rescue.quantity", lang)} · <span className="tnum text-clay-600">{qty}q</span> <span className="text-forest-900/40">({t("storage.max", lang)} {Math.max(0, booking.availableQuintal - (booked[booking.id] ?? 0))}q)</span>
                      </span>
                      <input type="range" min={1} max={Math.max(1, booking.availableQuintal - (booked[booking.id] ?? 0))} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-full accent-clay-500" />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold text-forest-900/60">{t("storage.duration", lang)} · <span className="tnum text-clay-600">{days} {t("storage.days", lang)}</span></span>
                      <input type="range" min={1} max={60} value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-full accent-clay-500" />
                    </label>
                    <div className="flex items-center justify-between rounded-2xl bg-forest-950 px-4 py-3.5 text-paper">
                      <span className="text-xs text-paper/60">{t("storage.estTotal", lang)}</span>
                      <span className="tnum font-display text-2xl font-semibold text-harvest-400">{inr(booking.ratePerQPerDay * qty * days)}</span>
                    </div>
                    {error && <p className="rounded-xl bg-clay-500/10 px-3 py-2 text-xs font-semibold text-clay-600">{error}</p>}
                    <button onClick={() => void confirm()} disabled={state === "sending"} className="w-full rounded-full bg-clay-500 py-3.5 text-sm font-bold text-white transition hover:bg-clay-600 disabled:opacity-60">
                      {state === "sending" ? t("storage.reserving", lang) : t("storage.confirm", lang)}
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
        {comparing && compareList.length >= 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-forest-950/60 p-4 backdrop-blur-sm" onClick={() => setComparing(false)}>
            <motion.div initial={{ y: 30, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.97 }} className="w-full max-w-2xl rounded-3xl bg-paper p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-clay-500"><GitCompareArrows className="mr-1 inline size-3" /> {t("common.compare", lang)}</p>
                  <h3 className="font-display mt-1 text-2xl font-semibold text-forest-950">{t("storage.compareTitle", lang)}</h3>
                </div>
                <button onClick={() => setComparing(false)} className="rounded-full p-1.5 hover:bg-forest-900/5"><X className="size-4" /></button>
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[460px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-forest-900/10 text-[10px] uppercase tracking-wider text-forest-900/45">
                      <th className="pb-2 pr-3"></th>
                      {compareList.map((f) => {
                        const score = (x: typeof f) => x.dist * 0.6 + x.ratePerQPerDay * 30;
                        const win = f.id === compareList.reduce((a, b) => (score(a) <= score(b) ? a : b)).id;
                        return (
                          <th key={f.id} className="pb-2 pr-3">
                            <div className="text-[11px] font-black normal-case tracking-normal text-forest-950">{f.name}</div>
                            {win && <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-harvest-400 px-2 py-0.5 text-[9px] font-black text-forest-950"><Crown className="size-2.5" /> {t("common.winner", lang)}</span>}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="tnum divide-y divide-forest-900/5 text-forest-900/75">
                    <tr><td className="py-2.5 pr-3 font-semibold text-forest-900/60">{t("common.distance", lang)}</td>{compareList.map((f) => <td key={f.id} className="py-2.5 pr-3">{f.dist} {O ? "କି.ମି." : "km"} · {travelHrs(f.dist)}</td>)}</tr>
                    <tr><td className="py-2.5 pr-3 font-semibold text-forest-900/60">{t("storage.freeCapacity", lang)}</td>{compareList.map((f) => <td key={f.id} className="py-2.5 pr-3 font-bold">{f.available.toLocaleString("en-IN")}q</td>)}</tr>
                    <tr><td className="py-2.5 pr-3 font-semibold text-forest-900/60">{O ? "ଦର" : "Rate"}</td>{compareList.map((f) => <td key={f.id} className="py-2.5 pr-3 font-black text-clay-600">{inr(f.ratePerQPerDay)}/q/d</td>)}</tr>
                    <tr><td className="py-2.5 pr-3 font-semibold text-forest-900/60">{O ? "୧୦q ସପ୍ତାହ ପାଇଁ" : "10q for a week"}</td>{compareList.map((f) => <td key={f.id} className="py-2.5 pr-3 font-black text-leaf-600">{inr(f.ratePerQPerDay * 70)}</td>)}</tr>
                    <tr>
                      <td className="py-2.5 pr-3 font-semibold text-forest-900/60">{t("common.navigate", lang)}</td>
                      {compareList.map((f) => (
                        <td key={f.id} className="py-2.5 pr-3">
                          <a href={mapsDirUrl(origin, f)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-clay-500 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-clay-600">
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
                  const score = (x: (typeof compareList)[number]) => x.dist * 0.6 + x.ratePerQPerDay * 30;
                  const w = compareList.reduce((a, b) => (score(a) <= score(b) ? a : b));
                  return O
                    ? `ଚୂଡ଼ାନ୍ତ ପରାମର୍ଶ: ${w.name} — ଦୂରତା (${w.dist} କି.ମି.) ଓ ଦର (${inr(w.ratePerQPerDay)}/କୁ./ଦିନ) ମିଶାଇ ସର୍ବୋତ୍ତମ।`
                    : `Final suggestion: ${w.name} — best blend of distance (${w.dist} km) and rate (${inr(w.ratePerQPerDay)}/q/day).`;
                })()}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
