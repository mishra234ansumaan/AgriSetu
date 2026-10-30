"use client";

import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { MapPin, Trophy, Users } from "lucide-react";
import { useLang, t } from "@/lib/i18n";

export interface DemoOption {
  mandiId: number;
  mandiName: string;
  district: string;
  modalP: number;
  distanceKm: number;
  costPerQSolo: number;
  netPerQSolo: number;
  netPerQPooled: number;
}

const POPULAR = ["Khordha", "Cuttack", "Kandhamal", "Ganjam", "Sambalpur", "Balasore", "Koraput", "Mayurbhanj"];

export default function MiniDemo({
  crops,
  initial,
  initialCrop,
}: {
  crops: { id: number; name: string; nameOdia: string }[];
  initial: DemoOption[];
  initialCrop: number;
}) {
  const { lang } = useLang();
  const O = lang === "od";
  const [cropId, setCropId] = useState(initialCrop);
  const [qty, setQty] = useState(10);
  const [district, setDistrict] = useState("Kandhamal");
  const [options, setOptions] = useState<DemoOption[]>(initial);
  const [pending, start] = useTransition();

  useEffect(() => {
    start(async () => {
      const r = await fetch(`/api/sell-advice?cropId=${cropId}&qty=${qty}&district=${encodeURIComponent(district)}`);
      const d = (await r.json()) as { options: DemoOption[] };
      setOptions(d.options);
    });
  }, [cropId, qty, district]);

  const top = options.slice(0, 4);
  const max = Math.max(1, ...top.map((o) => o.netPerQSolo));
  const worst = options[options.length - 1];
  const spread = top[0] && worst ? (top[0].netPerQSolo - worst.netPerQSolo) * qty : 0;

  return (
    <div className="overflow-hidden rounded-3xl border border-paper/15 bg-forest-900/40 p-6 shadow-2xl backdrop-blur-md sm:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <p className="w-full text-xs font-bold uppercase tracking-[0.18em] text-harvest-400">{t("demo.eyebrow", lang)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {crops.slice(0, 8).map((c) => (
            <button
              key={c.id}
              onClick={() => setCropId(c.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                cropId === c.id ? "bg-harvest-400 text-forest-950" : "bg-paper/10 text-paper/80 hover:bg-paper/20"
              }`}
            >
              {O ? c.nameOdia : c.name}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="rounded-full border border-paper/20 bg-forest-950 px-3.5 py-2 text-xs font-semibold text-paper outline-none"
          >
            {POPULAR.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 rounded-full border border-paper/20 bg-forest-950 px-3.5 py-2">
            <input type="range" min={2} max={40} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-28 accent-harvest-400" />
            <span className="tnum text-xs font-bold text-harvest-400">{qty} {t("demo.qty", lang)}</span>
          </div>
        </div>
      </div>

      <div className={`mt-6 space-y-3 transition-opacity ${pending ? "opacity-60" : ""}`}>
        {top.map((o, i) => (
          <motion.div key={o.mandiId} layout className="relative">
            <motion.div
              className={`absolute inset-y-0 left-0 rounded-2xl ${i === 0 ? "bg-gradient-to-r from-leaf-500/40 to-leaf-500/5" : ""}`}
              initial={false}
              animate={{ width: `${Math.max(14, (o.netPerQSolo / max) * 100)}%` }}
              transition={{ type: "spring", stiffness: 90, damping: 20 }}
              style={i === 0 ? undefined : { backgroundColor: "rgba(246,242,231,.07)" }}
            />
            <div className="relative flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className={`grid size-7 place-items-center rounded-full text-xs font-black ${i === 0 ? "bg-harvest-400 text-forest-950" : "bg-paper/10 text-paper/70"}`}>
                  {i === 0 ? <Trophy className="size-3.5" /> : i + 1}
                </span>
                <div>
                  <p className="text-sm font-bold text-paper">{o.mandiName}</p>
                  <p className="flex items-center gap-1 text-[11px] text-paper/50">
                    <MapPin className="size-3" /> {o.district} · {o.distanceKm} {O ? "କି.ମି." : "km"} · {O ? "ଖର୍ଚ୍ଚ" : "costs"} ₹{o.costPerQSolo}/q
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="tnum font-display text-xl font-semibold text-harvest-400">
                  ₹{o.netPerQSolo.toLocaleString("en-IN")}
                  <span className="text-xs font-normal text-paper/40">{O ? "/କୁ ନିଟ" : "/q net"}</span>
                </p>
                <p className="tnum flex items-center justify-end gap-1 text-[10px] text-leaf-300">
                  <Users className="size-3" /> {O ? "ପୁଲ୍" : "pooled"}: ₹{o.netPerQPooled.toLocaleString("en-IN")}/q
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {spread > 0 && (
        <p className="mt-5 rounded-xl bg-harvest-400/10 px-4 py-3 text-[13px] font-semibold text-harvest-400">
          {t("demo.choose", lang)} ₹{Math.round(spread).toLocaleString("en-IN")} {t("demo.verdict", lang)} {qty}q {O ? "ଲଟ୍‌ରେ।" : "lot."}
        </p>
      )}
    </div>
  );
}
