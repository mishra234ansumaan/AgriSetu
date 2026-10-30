"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Mover {
  crop: string;
  cropOdia: string;
  mandi: string;
  district: string;
  modalP: number;
  changePct: number;
}

export default function Ticker({ initial }: { initial: Mover[] }) {
  const [movers, setMovers] = useState<Mover[]>(initial);
  useEffect(() => {
    fetch("/api/ticker")
      .then((r) => r.json())
      .then((d) => d.movers?.length && setMovers(d.movers))
      .catch(() => {});
  }, []);

  const items = [...movers, ...movers];
  return (
    <div className="relative overflow-hidden border-t border-paper/10 bg-forest-950/60 backdrop-blur-sm">
      <div className="animate-marquee flex w-max items-center gap-10 px-6 py-3">
        {items.map((m, i) => (
          <span key={i} className="flex items-center gap-2 text-[13px] text-paper/80">
            <span className="font-semibold text-paper">{m.crop}</span>
            <span className="odia text-paper/40">{m.cropOdia}</span>
            <span className="text-paper/40">·</span>
            <span className="tnum font-bold text-harvest-400">₹{m.modalP.toLocaleString("en-IN")}/q</span>
            <span className="text-paper/40">{m.district}</span>
            <span
              className={`flex items-center gap-0.5 text-[11px] font-bold ${
                m.changePct >= 0 ? "text-leaf-400" : "text-clay-500"
              }`}
            >
              {m.changePct >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {Math.abs(m.changePct)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
