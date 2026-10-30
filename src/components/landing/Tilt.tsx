"use client";

import { useRef, useState, type ReactNode } from "react";

export default function Tilt({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState("perspective(900px) rotateX(0deg) rotateY(0deg)");

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setT(`perspective(900px) rotateX(${(-py * 14).toFixed(2)}deg) rotateY(${(px * 16).toFixed(2)}deg)`);
  }

  return (
    <div
      ref={ref}
      className={`tilt-card ${className}`}
      style={{ transform: t }}
      onMouseMove={onMove}
      onMouseLeave={() => setT("perspective(900px) rotateX(0deg) rotateY(0deg)")}
    >
      {children}
    </div>
  );
}
