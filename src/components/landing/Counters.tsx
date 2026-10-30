"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

function Num({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [v, setV] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1600;
    let raf: number;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 4);
      setV(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target]);

  return (
    <span ref={ref} className="tnum font-display text-5xl font-semibold text-harvest-400 sm:text-6xl">
      {prefix}
      {v.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

export default function Counters({
  items,
}: {
  items: { target: number; suffix?: string; prefix?: string; label: string; odia: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
      {items.map((it) => (
        <div key={it.label}>
          <Num target={it.target} suffix={it.suffix} prefix={it.prefix} />
          <p className="mt-2 text-sm font-semibold text-paper">{it.label}</p>
          <p className="odia text-xs text-paper/50">{it.odia}</p>
        </div>
      ))}
    </div>
  );
}
