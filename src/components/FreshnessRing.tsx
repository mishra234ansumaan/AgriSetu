"use client";

import { useEffect, useState } from "react";
import { STAGE_META, type FreshnessStage } from "@/lib/decay";

export default function FreshnessRing({
  pct,
  stage,
  size = 132,
  stroke = 11,
  label,
}: {
  pct: number;
  stage: FreshnessStage;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const meta = STAGE_META[stage];
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={meta.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * shown) / 100}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="tnum font-display font-semibold" style={{ color: meta.color, fontSize: size / 4.1 }}>
            {pct}%
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-70">{label ?? "fresh"}</p>
          <p className="odia text-[11px] font-semibold" style={{ color: meta.color }}>
            {meta.odia}
          </p>
        </div>
      </div>
    </div>
  );
}
