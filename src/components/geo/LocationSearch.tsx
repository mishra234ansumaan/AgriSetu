"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import { PLACES, searchPlaces, type Place } from "@/lib/locations";
import { useLang, t } from "@/lib/i18n";

export default function LocationSearch({
  value,
  onSelect,
  placeholderKey = "common.searchLocation",
  compact = false,
  className = "",
}: {
  value: Place | null;
  onSelect: (p: Place | null) => void;
  placeholderKey?: string;
  compact?: boolean;
  className?: string;
}) {
  const { lang } = useLang();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Place[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setResults(searchPlaces(q));
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <div
        className={`flex items-center gap-2 rounded-2xl border border-forest-900/15 bg-white transition focus-within:border-forest-700 ${
          compact ? "px-3 py-2" : "px-4 py-3"
        }`}
      >
        <Search className="size-4 shrink-0 text-forest-900/40" />
        <input
          value={value ? value.name : q}
          onChange={(e) => {
            if (value) onSelect(null);
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={t(placeholderKey, lang)}
          className={`w-full bg-transparent outline-none ${compact ? "text-xs" : "text-sm"} font-semibold text-forest-950 placeholder:text-forest-900/35`}
        />
        {value && (
          <button
            onClick={() => {
              onSelect(null);
              setQ("");
            }}
            className="rounded-full p-1 text-forest-900/40 hover:bg-forest-900/5"
            aria-label="Clear location"
          >
            <X className="size-3.5" />
          </button>
        )}
        <MapPin className="size-4 shrink-0 text-clay-500" />
      </div>
      {open && !value && (
        <div className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-forest-900/10 bg-white shadow-xl shadow-forest-950/15">
          {q === "" && (
            <>
              <p className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-forest-900/40">
                {lang === "od" ? "ଲୋକପ୍ରିୟ ସ୍ଥାନ" : "Popular places"}
              </p>
              {PLACES.filter((p) => ["Bhubaneswar", "Cuttack", "Sambalpur", "Ganjam", "Kandhamal", "Balasore"].includes(p.name)).map((p) => (
                <Suggestion key={p.name} p={p} onPick={() => { onSelect(p); setOpen(false); }} />
              ))}
            </>
          )}
          {q !== "" && results.length === 0 && (
            <p className="px-4 py-3 text-xs text-forest-900/50">
              {lang === "od" ? "କୌଣସି ସ୍ଥାନ ମିଳିଲା ନାହିଁ — ଜିଲ୍ଲା ନାମ ଚେଷ୍ଟା କରନ୍ତୁ" : "No matches — try a district name"}
            </p>
          )}
          {q !== "" && results.map((p) => (
            <Suggestion key={p.name} p={p} onPick={() => { onSelect(p); setOpen(false); }} />
          ))}
        </div>
      )}
    </div>
  );
}

function Suggestion({ p, onPick }: { p: Place; onPick: () => void }) {
  return (
    <button onClick={onPick} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition hover:bg-paper">
      <MapPin className={`size-3.5 shrink-0 ${p.kind === "district" ? "text-forest-700" : "text-clay-500"}`} />
      <span className="flex-1">
        <span className="block text-xs font-bold text-forest-950">{p.name}</span>
        <span className="block text-[10px] text-forest-900/45">{p.kind === "district" ? "District HQ" : "Town"} · {p.district}</span>
      </span>
    </button>
  );
}
