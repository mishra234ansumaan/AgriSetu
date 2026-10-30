"use client";

import { ExternalLink, Navigation2, Tractor } from "lucide-react";
import { corridorText, kmBetween, mapsDirUrl, travelHrs, type Place } from "@/lib/locations";
import { useLang, t } from "@/lib/i18n";

export default function RouteMap({
  origin,
  dest,
  dark = false,
  note,
}: {
  origin: Place;
  dest: Place;
  dark?: boolean;
  note?: string;
}) {
  const { lang } = useLang();
  const km = kmBetween(origin, dest);
  const dir = mapsDirUrl(origin, dest);
  const embed = `https://maps.google.com/maps?output=embed&saddr=${origin.lat},${origin.lng}&daddr=${dest.lat},${dest.lng}&hl=${lang === "od" ? "or" : "en"}`;

  return (
    <div className={`overflow-hidden rounded-3xl border ${dark ? "border-paper/15 bg-forest-900/40" : "border-forest-900/10 bg-white/80"}`}>
      {/* schematic route bar */}
      <div className={`flex items-center gap-3 px-5 pt-5 ${dark ? "text-paper" : "text-forest-950"}`}>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold">{origin.name}</p>
          <p className={`text-[10px] ${dark ? "text-paper/50" : "text-forest-900/45"}`}>{origin.district}</p>
        </div>
        <div className={`route-line relative flex-1 pb-1 ${dark ? "text-harvest-400" : "text-clay-500"}`}>
          <Tractor className="absolute -top-3 left-1/2 size-4 -translate-x-1/2" />
        </div>
        <div className="min-w-0 text-right">
          <p className="truncate text-xs font-bold">{dest.name}</p>
          <p className={`text-[10px] ${dark ? "text-paper/50" : "text-forest-900/45"}`}>{dest.district}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-5 py-4 text-center">
        {[
          { k: t("common.distance", lang), v: `${km} ${lang === "od" ? "କି.ମି." : "km"}` },
          { k: t("common.estTime", lang), v: travelHrs(km) },
          { k: t("common.bestRoute", lang), v: corridorText(origin, dest) },
        ].map((s) => (
          <div key={s.k} className={`rounded-xl px-2 py-2.5 ${dark ? "bg-paper/8" : "bg-paper"}`}>
            <p className={`text-[9px] font-bold uppercase tracking-widest ${dark ? "text-paper/45" : "text-forest-900/40"}`}>{s.k}</p>
            <p className={`mt-0.5 text-xs font-black ${dark ? "text-harvest-400" : "text-forest-950"}`}>{s.v}</p>
          </div>
        ))}
      </div>

      {note && (
        <p className={`mx-5 mb-4 rounded-xl px-3.5 py-2.5 text-[11px] leading-5 ${dark ? "bg-paper/8 text-paper/70" : "bg-paper text-forest-900/65"}`}>
          {note}
        </p>
      )}

      <iframe
        title={`Route ${origin.name} to ${dest.name}`}
        src={embed}
        className="h-56 w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />

      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <p className={`text-[10px] ${dark ? "text-paper/45" : "text-forest-900/40"}`}>
          {lang === "od" ? "ଗୁଗଲ ମାପଦ୍ୱାରା ନାଭିଗେସନ୍ ପ୍ରସ୍ତୁତ" : "Turn-by-turn navigation via Google Maps"}
        </p>
        <a
          href={dir}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full bg-clay-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-clay-500/25 transition hover:bg-clay-600"
        >
          <Navigation2 className="size-3.5" />
          {t("common.navigate", lang)}
          <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  );
}
