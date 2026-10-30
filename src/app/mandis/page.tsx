import { ArrowUpRight, ArrowDownRight, Crown, MapPin, Radar } from "lucide-react";
import { db } from "@/db";
import { mandis as mandiTable2 } from "@/db/schema";
import { allCrops, priceSeries } from "@/lib/queries";
import { inr, shortDate } from "@/lib/odisha";
import { getLang } from "@/lib/i18n-server";
import { DICT } from "@/lib/i18n-shared";
import CropIcon from "@/components/CropIcon";
import { PriceAreaChart } from "@/components/Charts";
import MandiGeo, { MandiSearch } from "@/components/mandis/MandiGeo";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MandisPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const lang = await getLang();
  const S = (k: string) => DICT[k]?.[lang] ?? k;
  const O = lang === "od";

  const [crops, mandiRows] = await Promise.all([allCrops(), db.select().from(mandiTable2)]);
  const cropId = Number(sp.crop ?? 0) || crops.find((c) => c.name === "Tomato")?.id || crops[0].id;
  const crop = crops.find((c) => c.id === cropId) ?? crops[0];

  const rows = await priceSeries(crop.id);
  const perMandi = new Map<number, { date: string; modalP: number; minP: number; maxP: number }[]>();
  for (const r of rows) {
    const arr = perMandi.get(r.mandiId) ?? [];
    arr.push(r);
    perMandi.set(r.mandiId, arr);
  }
  const mandiTable = [...perMandi.entries()]
    .map(([mandiId, series]) => {
      const sorted = series.sort((a, b) => a.date.localeCompare(b.date));
      const today = sorted[sorted.length - 1];
      const yesterday = sorted[sorted.length - 2] ?? today;
      const change = yesterday.modalP ? ((today.modalP - yesterday.modalP) / yesterday.modalP) * 100 : 0;
      return { mandiId, sorted, today, change };
    })
    .sort((a, b) => b.today.modalP - a.today.modalP);

  const byDate = new Map<string, number[]>();
  for (const r of rows) {
    const arr = byDate.get(r.date) ?? [];
    arr.push(r.modalP);
    byDate.set(r.date, arr);
  }
  const avgChart = [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, vals]) => ({ date: shortDate(date), modalP: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) }));

  const hi = mandiTable[0];
  const lo = mandiTable[mandiTable.length - 1];
  const weekAgo = avgChart[Math.max(0, avgChart.length - 8)]?.modalP ?? 0;
  const weekChg = avgChart.length && weekAgo ? ((avgChart[avgChart.length - 1].modalP - weekAgo) / weekAgo) * 100 : 0;

  const mandiName = new Map(mandiRows.map((m) => [m.id, m]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-clay-500">
            <Radar className="size-3.5" /> {S("mandi.kicker")}
          </p>
          <h1 className="font-display mt-2 text-4xl font-medium tracking-tight text-forest-950 sm:text-5xl">
            {O ? crop.nameOdia : crop.name} <span className="odia text-2xl text-forest-600/70">{crop.nameOdia}</span>
          </h1>
          <p className="mt-1.5 text-sm text-forest-900/60">
            {mandiTable.length} {S("mandi.sub")}
          </p>
        </div>
        <div className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold ${weekChg >= 0 ? "bg-leaf-500/10 text-leaf-600" : "bg-clay-500/10 text-clay-600"}`}>
          {weekChg >= 0 ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
          {S("mandi.week")}: {weekChg >= 0 ? "+" : ""}{weekChg.toFixed(1)}%
        </div>
      </div>

      {/* crop picker */}
      <div className="mt-7 flex gap-2 overflow-x-auto pb-2">
        {crops.map((c) => (
          <Link
            key={c.id}
            href={`/mandis?crop=${c.id}`}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
              c.id === crop.id ? "bg-forest-950 text-paper shadow-md" : "border border-forest-900/15 bg-white/70 text-forest-800 hover:border-forest-900/40"
            }`}
          >
            <CropIcon icon={c.icon} className="size-4" />
            {O ? c.nameOdia : c.name}
          </Link>
        ))}
      </div>

      {/* chart card */}
      <div className="mt-6 rounded-3xl border border-forest-900/10 bg-white/80 p-6 sm:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-forest-950">{S("mandi.avg")} <span className="odia text-xs font-medium text-forest-600/60">· ରାଜ୍ୟ ହାରାହାରି</span></p>
            <p className="text-xs text-forest-900/50">{S("mandi.avgSub")}</p>
          </div>
          <div className="flex items-center gap-5 text-xs">
            <span className="flex items-center gap-1.5 text-forest-900/60">
              <Crown className="size-4 text-harvest-500" /> {S("mandi.high")}: <strong className="tnum">{hi ? inr(hi.today.modalP) : "—"}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-forest-900/60">
              <MapPin className="size-4 text-clay-500" /> {S("mandi.low")}: <strong className="tnum">{lo ? inr(lo.today.modalP) : "—"}</strong>
            </span>
          </div>
        </div>
        <PriceAreaChart data={avgChart} color="#3e9b4f" />
      </div>

      {/* geo finder */}
      <div className="mt-6">
        <MandiGeo
          mandis={mandiTable.map((m) => {
            const row = mandiName.get(m.mandiId)!;
            return { id: m.mandiId, name: row.name, district: row.district, lat: row.lat, lng: row.lng, modalP: m.today.modalP };
          })}
        />
      </div>

      {/* searchable table */}
      <div className="mt-6">
        <MandiSearch
          rows={mandiTable.map((m, i) => {
            const row = mandiName.get(m.mandiId)!;
            return {
              mandiId: m.mandiId,
              name: row.name,
              district: row.district,
              todayP: m.today.modalP,
              minP: m.today.minP,
              maxP: m.today.maxP,
              change: m.change,
              spark: m.sorted.map((s) => s.modalP),
              rank: i,
            };
          })}
        />
        <p className="mt-3 px-2 text-[11px] text-forest-900/40">
          {S("mandi.footnote")} <Link href={`/sell?crop=${crop.id}`} className="font-bold text-clay-500 hover:underline">{S("nav.sell")} →</Link>
        </p>
      </div>
    </div>
  );
}
