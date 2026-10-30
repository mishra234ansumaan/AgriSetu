import Image from "next/image";
import { eq } from "drizzle-orm";
import {
  BadgeCheck,
  Banknote,
  HandCoins,
  Landmark,
  Leaf,
  QrCode,
  Radar,
  ReceiptText,
  Satellite,
  ScrollText,
  ShieldCheck,
  Sprout,
  Trophy,
  Users,
  Wheat,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { db } from "@/db";
import { farmers } from "@/db/schema";
import Tilt from "@/components/landing/Tilt";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";
import { getLang } from "@/lib/i18n-server";
import { DICT } from "@/lib/i18n-shared";

export const dynamic = "force-dynamic";

const TIERS = [
  { score: 30, amount: "₹25,000", icon: Sprout, label: "Sapling" },
  { score: 50, amount: "₹1,00,000", icon: Wheat, label: "Crop" },
  { score: 75, amount: "₹3,00,000", icon: Leaf, label: "Harvest" },
  { score: 90, amount: "₹5,00,000+", icon: Trophy, label: "Anchor" },
];

const BANKS = [
  { name: "Odisha Gramya Bank", noteEn: "KCC top-up via FarmProof ledger", noteOd: "ଫାର୍ମପ୍ରୁଫ ଖାତା ଦ୍ୱାରା KCC ଟପ୍-ଅପ୍", rate: "7.0%" },
  { name: "State Bank of India · Agri desk", noteEn: "Score ≥ 50 skip field-verification visit", noteOd: "ସ୍କୋର ≥ ୫୦ ହେଲେ ମଇଦାନ ଯାଞ୍ଚ ଏଡ଼ାଏ", rate: "8.5%" },
  { name: "OSCB Cooperative Bank", noteEn: "PACS-level instant sanction up to ₹1L", noteOd: "PACS ସ୍ତରରେ ₹୧ ଲକ୍ଷ ପର୍ଯ୍ୟନ୍ତ ତୁରନ୍ତ ମଞ୍ଜୁରୀ", rate: "7.4%" },
];

export default async function FarmProofPage() {
  const lang = await getLang();
  const S = (k: string) => DICT[k]?.[lang] ?? k;
  const O = lang === "od";

  const farmer = (await db.select().from(farmers).where(eq(farmers.id, 1)))[0];
  const score = farmer.trustScore;

  const breakdown = [
    { icon: ScrollText, label: S("farm.b1"), val: 30, max: 30, ok: farmer.landVerified },
    { icon: Satellite, label: S("farm.b2"), val: 24, max: 30, ok: farmer.satelliteVerified },
    { icon: ReceiptText, label: S("farm.b3"), val: 12, max: 20, ok: true },
    { icon: Users, label: S("farm.b4"), val: 8, max: 10, ok: true },
    { icon: HandCoins, label: S("farm.b5"), val: 0, max: 10, ok: false },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-leaf-600">
        <ShieldCheck className="size-3.5" /> {S("farm.kicker")}
        <span className="ml-2 rounded-full bg-harvest-400/20 px-2 py-0.5 text-[9px] font-black text-harvest-600">{S("farm.sidekick")}</span>
      </p>
      <h1 className="font-display mt-2 max-w-3xl text-4xl font-medium leading-tight tracking-tight text-forest-950 sm:text-5xl">
        {S("farm.h1a")} <em className="text-clay-500 not-italic">{S("farm.h1b")}</em>
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-forest-900/60">{S("farm.sub")}</p>

      <div className="mt-12 grid items-start gap-12 lg:grid-cols-[1fr_1.1fr]">
        {/* the card */}
        <div className="lg:sticky lg:top-24">
          <Reveal className="flex justify-center">
            <Tilt>
              <div className="relative w-[340px] overflow-hidden rounded-[1.8rem] p-7 text-paper shadow-2xl shadow-forest-950/50 sm:w-[400px]">
                <Image src="/images/farmproof-bg.png" alt="" fill className="object-cover" />
                <div className="absolute inset-0 bg-forest-950/30" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display text-xl font-semibold tracking-tight">Farm<span className="text-harvest-400">Proof</span></p>
                      <p className="odia text-[10px] text-paper/55">ଡିଜିଟାଲ ଚାଷୀ ପରିଚୟ ପତ୍ର</p>
                    </div>
                    <span className="flex items-center gap-1.5 rounded-full bg-leaf-500/15 px-3 py-1 text-[10px] font-bold text-leaf-300">
                      <BadgeCheck className="size-3.5" /> {O ? "ସକ୍ରିୟ" : "ACTIVE"}
                    </span>
                  </div>

                  <div className="mt-7 flex items-end justify-between">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.24em] text-paper/45">{S("farm.farmer")}</p>
                      <p className="font-display text-[26px] font-semibold leading-tight">{O ? farmer.nameOdia : farmer.name}</p>
                      <p className="odia text-xs text-paper/60">{farmer.nameOdia}</p>
                      <p className="mt-2 text-[11px] text-paper/55">{farmer.village}, {farmer.district}</p>
                    </div>
                    <div className="rounded-xl bg-paper p-2 shadow-lg">
                      <QRCodeSVG value={`https://agrisetu.app/farmproof?farmer=${farmer.id}&hash=a3f8c2d1e9`} size={76} bgColor="#f6f2e7" fgColor="#0e2f24" level="M" />
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-4 gap-2 text-center">
                    {[
                      { k: O ? "ବିଶ୍ୱାସ" : "Trust", v: `${score}` },
                      { k: O ? "ଜମି" : "Land", v: `${farmer.landAcres} ac` },
                      { k: "NDVI", v: farmer.ndvi.toFixed(2) },
                      { k: O ? "ସ୍ତର" : "Tier", v: score >= 75 ? "₹3L" : score >= 50 ? "₹1L" : "₹25k" },
                    ].map((s) => (
                      <div key={s.k} className="rounded-xl bg-paper/10 px-1.5 py-2 backdrop-blur-sm">
                        <p className="text-[8px] uppercase tracking-widest text-paper/45">{s.k}</p>
                        <p className="tnum mt-0.5 text-sm font-bold text-harvest-400">{s.v}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-paper/15 pt-4 text-[10px] text-paper/50">
                    <span>ID: AP-OD-KD-1147 · Kharif 2025</span>
                    <span className="flex items-center gap-1"><QrCode className="size-3" /> {S("farm.scanBank")}</span>
                  </div>
                </div>
              </div>
            </Tilt>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-6 text-center text-xs text-forest-900/50">{S("farm.hover")} ↓</p>
          </Reveal>
        </div>

        {/* ledger + tiers + banks */}
        <div className="space-y-6">
          <section className="rounded-3xl border border-forest-900/10 bg-white/80 p-6 sm:p-7">
            <h2 className="font-display text-2xl font-semibold text-forest-950">{S("farm.ledger")}</h2>
            <div className="mt-5 space-y-3.5">
              {breakdown.map((b) => (
                <div key={b.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-semibold text-forest-900">
                      <b.icon className={`size-4 ${b.ok ? "text-leaf-600" : "text-forest-900/30"}`} /> {b.label}
                      {b.ok && <BadgeCheck className="size-3.5 text-leaf-500" />}
                    </span>
                    <span className="tnum font-bold text-forest-950">{b.val}/{b.max}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-forest-900/8">
                    <div
                      className={`h-full rounded-full ${b.ok ? "bg-gradient-to-r from-leaf-500 to-harvest-400" : "bg-forest-900/15"}`}
                      style={{ width: `${(b.val / b.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between rounded-2xl bg-forest-950 px-4 py-3 text-paper">
              <span className="flex items-center gap-2 text-xs text-paper/60"><Radar className="size-4 text-harvest-400" /> {S("farm.liveScore")}</span>
              <span className="tnum font-display text-2xl font-semibold text-harvest-400">{score}<span className="text-sm text-paper/40">/100</span></span>
            </div>
            <p className="mt-3 text-[11px] text-forest-900/50">{S("farm.receiptNote")}</p>
          </section>

          <section className="rounded-3xl bg-forest-950 p-6 text-paper sm:p-7">
            <h2 className="font-display text-2xl font-semibold">{S("farm.tiers")}</h2>
            <Stagger className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TIERS.map((tr) => {
                const active = score >= tr.score;
                const next = !active && TIERS.filter((x) => x.score > score)[0]?.score === tr.score;
                return (
                  <StaggerItem key={tr.score}>
                    <div className={`rounded-2xl border p-4 text-center transition ${active ? "border-leaf-500/50 bg-leaf-500/10" : next ? "border-harvest-400/50 bg-harvest-400/10" : "border-paper/10 bg-paper/5"}`}>
                      <tr.icon className={`mx-auto size-6 ${active ? "text-leaf-400" : next ? "text-harvest-400" : "text-paper/35"}`} />
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-paper/50">{S("farm.score")} {tr.score}+</p>
                      <p className="tnum font-display mt-1 text-lg font-semibold text-harvest-400">{tr.amount}</p>
                      {active && <p className="mt-1 text-[9px] font-black text-leaf-300">✓ {S("farm.unlocked")}</p>}
                      {next && <p className="mt-1 text-[9px] font-black text-harvest-400">{S("farm.next")} {tr.score - score} {S("farm.ptsAway")}</p>}
                    </div>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </section>

          <section className="rounded-3xl border border-forest-900/10 bg-white/80 p-6 sm:p-7">
            <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-forest-950">
              <Landmark className="size-5 text-harvest-600" /> {S("farm.banks")}
            </h2>
            <div className="mt-5 space-y-3">
              {BANKS.map((b) => (
                <div key={b.name} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-forest-900/8 bg-paper px-4 py-3.5">
                  <div>
                    <p className="text-sm font-bold text-forest-950">{b.name}</p>
                    <p className="text-[11px] text-forest-900/55">{O ? b.noteOd : b.noteEn}</p>
                  </div>
                  <span className="tnum rounded-full bg-leaf-500/10 px-3 py-1.5 text-xs font-black text-leaf-600">{b.rate} <span className="font-medium">{O ? "ବାର୍ଷିକ" : "p.a."}</span></span>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-harvest-400/12 px-4 py-3.5 text-xs leading-5 text-forest-900/75">
              <strong className="text-forest-950">{S("farm.why")}</strong> {S("farm.whyBody")} <Banknote className="inline size-3.5 text-harvest-600" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
