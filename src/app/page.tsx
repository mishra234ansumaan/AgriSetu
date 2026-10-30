import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Boxes,
  Landmark,
  Radar,
  Refrigerator,
  Route,
  Scale,
  ShieldCheck,
  Siren,
  Store,
  Truck,
  Users,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { priceSnapshot, sellAdvice, allCrops } from "@/lib/queries";
import { STAGE_META } from "@/lib/decay";
import { getLang } from "@/lib/i18n-server";
import { DICT } from "@/lib/i18n-shared";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";
import Ticker from "@/components/landing/Ticker";
import MiniDemo from "@/components/landing/MiniDemo";
import Tilt from "@/components/landing/Tilt";
import Counters from "@/components/landing/Counters";

export const dynamic = "force-dynamic";

export default async function Landing() {
  const lang = await getLang();
  const S = (k: string) => DICT[k]?.[lang] ?? k;
  const O = lang === "od";

  const [snapshot, crops] = await Promise.all([priceSnapshot(), allCrops()]);
  const tomato = crops.find((c) => c.name === "Tomato") ?? crops[0];
  const demo = await sellAdvice(tomato.id, 10, "Kandhamal");

  const movers = [...snapshot]
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .filter((r, i, arr) => arr.findIndex((x) => x.cropId === r.cropId) === i)
    .slice(0, 12);

  const bestTomato = demo.options[0];
  const seriesCount = new Set(snapshot.map((s) => `${s.cropId}:${s.mandiId}`)).size;

  return (
    <div>
      {/* ============================== HERO ============================== */}
      <section className="grain relative -mt-16 overflow-hidden bg-forest-950 pt-16 text-paper">
        <Image src="/images/hero-farmer.jpg" alt="Odia farmer in a golden paddy field at sunrise" fill priority className="object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-950/70 via-forest-950/55 to-forest-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/80 via-transparent to-forest-950/40" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-10 pt-20 sm:px-6 lg:grid-cols-[1.25fr_0.75fr] lg:pt-28">
          <div>
            <Reveal>
              <p className="inline-flex items-center gap-2 rounded-full border border-harvest-400/30 bg-harvest-400/10 px-4 py-1.5 text-xs font-bold tracking-wide text-harvest-400">
                <Radar className="size-3.5" />
                {S("hero.badge")}
              </p>
            </Reveal>
            <Reveal delay={0.06}>
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-paper/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-paper/70">
                <Landmark className="size-3 text-harvest-400" /> {S("hero.seal")}
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="font-display mt-6 text-[clamp(2.6rem,7vw,5.4rem)] font-medium leading-[1.02] tracking-tight">
                {S("hero.h1a")}
                <br />
                <em className="not-italic text-harvest-400">{S("hero.h1b")}</em>
                <em className="text-clay-500">.</em>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 max-w-xl text-base leading-7 text-paper/70 sm:text-lg sm:leading-8">{S("hero.sub")}</p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/sell" className="group flex items-center gap-2 rounded-full bg-clay-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-clay-500/30 transition hover:bg-clay-600">
                  {S("hero.cta1")}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/rescue" className="flex items-center gap-2 rounded-full border border-paper/25 bg-paper/5 px-6 py-3.5 text-sm font-bold text-paper backdrop-blur transition hover:bg-paper/15">
                  <Siren className="size-4 text-clay-500" />
                  {S("hero.cta2")}
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-paper/60">
                <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-leaf-400" /> {S("hero.c1")}</span>
                <span className="flex items-center gap-2"><Truck className="size-4 text-leaf-400" /> {S("hero.c2")}</span>
                <span className="flex items-center gap-2"><Landmark className="size-4 text-leaf-400" /> {S("hero.c3")}</span>
              </div>
            </Reveal>
          </div>

          {/* floating data cards */}
          <div className="relative hidden lg:block">
            <Reveal delay={0.35} className="animate-floaty">
              <div className="rounded-3xl border border-paper/15 bg-forest-900/60 p-5 backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-leaf-300">{S("hero.cardBestNet")}</p>
                <p className="font-display mt-2 text-3xl font-semibold text-paper">
                  ₹{bestTomato?.netPerQSolo.toLocaleString("en-IN")}<span className="text-base text-paper/50">/q</span>
                </p>
                <p className="mt-1 text-xs text-paper/50">{bestTomato?.mandiName} · {bestTomato?.distanceKm} {O ? "କି.ମି." : "km"}</p>
                <div className="mt-3 flex items-center justify-between rounded-2xl bg-paper/5 px-3.5 py-2.5 text-xs">
                  <span className="text-paper/60">{O ? "ମୋଟ" : "Gross"} ₹{bestTomato?.modalP.toLocaleString("en-IN")}</span>
                  <span className="text-clay-500">− {O ? "ଖର୍ଚ୍ଚ" : "costs"} ₹{bestTomato?.costPerQSolo}</span>
                  <span className="font-bold text-leaf-300">= {O ? "ନିଟ" : "net"} ₹{bestTomato?.netPerQSolo.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.5} className="animate-floaty mt-5 [animation-delay:1.2s]">
              <div className="pulse-alert rounded-3xl border border-clay-500/30 bg-clay-500/15 p-5 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-clay-500">{S("hero.cardAlert")}</p>
                  <Siren className="size-4 text-clay-500" />
                </div>
                <p className="mt-2 text-sm font-bold text-paper">{O ? "ବାଇଗଣ ଲଟ୍ · ୨୦% ତାଜା · ଜରୁରୀ" : "Brinjal lot · 20% fresh · URGENT"}</p>
                <p className="mt-1 text-xs text-paper/60">{S("hero.cardAlertBody")}</p>
              </div>
            </Reveal>
          </div>
        </div>

        <Ticker initial={movers.map((m) => ({ crop: O ? m.cropOdia : m.cropName, cropOdia: m.cropOdia, mandi: m.mandiName, district: m.district, modalP: m.modalP, changePct: Math.round(m.changePct * 10) / 10 }))} />
      </section>

      {/* ============================ PROBLEM ============================ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-clay-500">{S("prob.kicker")}</p>
          <h2 className="font-display mt-3 max-w-3xl text-4xl font-medium leading-tight tracking-tight text-forest-950 sm:text-5xl">
            {S("prob.t1")}
            <br />
            <span className="text-forest-600/60">{S("prob.t2")}</span>
          </h2>
        </Reveal>
        <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Scale, t: "prob.c1t", d: "prob.c1d" },
            { icon: Boxes, t: "prob.c2t", d: "prob.c2d" },
            { icon: Truck, t: "prob.c3t", d: "prob.c3d" },
            { icon: Landmark, t: "prob.c4t", d: "prob.c4d" },
          ].map((c) => (
            <StaggerItem key={c.t}>
              <div className="group h-full rounded-3xl border border-forest-900/10 bg-white/70 p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-forest-900/10">
                <c.icon className="size-7 text-clay-500" />
                <h3 className="font-display mt-4 text-xl font-semibold text-forest-950">{S(c.t)}</h3>
                <p className="mt-3 text-sm leading-6 text-forest-900/70">{S(c.d)}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ========================= SIX SPANS ========================= */}
      <section className="relative overflow-hidden bg-forest-950 py-20 text-paper sm:py-28">
        <div className="absolute -left-32 top-1/3 size-[500px] rounded-full bg-leaf-500/10 blur-3xl" />
        <div className="absolute -right-40 top-0 size-[420px] rounded-full bg-harvest-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-harvest-400">{S("sol.kicker")}</p>
            <h2 className="font-display mt-3 max-w-2xl text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
              {S("sol.h2a")} <em className="text-harvest-400 not-italic">{S("sol.h2b")}</em>
            </h2>
          </Reveal>
          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Radar, href: "/mandis", t: "sol.f1t", d: "sol.f1d" },
              { icon: Scale, href: "/sell", t: "sol.f2t", d: "sol.f2d" },
              { icon: Siren, href: "/rescue", t: "sol.f3t", d: "sol.f3d" },
              { icon: Refrigerator, href: "/storage", t: "sol.f4t", d: "sol.f4d" },
              { icon: Route, href: "/transport", t: "sol.f5t", d: "sol.f5d" },
              { icon: Landmark, href: "/farmproof", t: "sol.f6t", d: "sol.f6d" },
            ].map((f) => (
              <StaggerItem key={f.t}>
                <Link href={f.href} className="group block h-full rounded-3xl border border-paper/10 bg-paper/[0.04] p-6 transition hover:border-harvest-400/40 hover:bg-paper/[0.07]">
                  <div className="flex items-start justify-between">
                    <f.icon className="size-7 text-harvest-400" />
                    <ArrowUpRight className="size-5 text-paper/30 transition group-hover:text-harvest-400 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>
                  <h3 className="font-display mt-5 text-2xl font-semibold">{S(f.t)}</h3>
                  <p className="mt-3 text-sm leading-6 text-paper/60">{S(f.d)}</p>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* =========================== LIVE DEMO =========================== */}
      <section className="relative overflow-hidden bg-forest-950 pb-24 pt-4 text-paper">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal>
            <div className="mb-8 text-center">
              <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">{S("demo.title")}</h2>
              <p className="mt-2 text-sm text-paper/50">{S("demo.sub")}</p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <MiniDemo
              crops={crops.map((c) => ({ id: c.id, name: c.name, nameOdia: c.nameOdia }))}
              initial={demo.options.map((o) => ({
                mandiId: o.mandiId,
                mandiName: o.mandiName,
                district: o.district,
                modalP: o.modalP,
                distanceKm: o.distanceKm,
                costPerQSolo: o.costPerQSolo,
                netPerQSolo: o.netPerQSolo,
                netPerQPooled: o.netPerQPooled,
              }))}
              initialCrop={tomato.id}
            />
          </Reveal>
        </div>
      </section>

      {/* ========================== RESCUE STRIP ========================== */}
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <Reveal className="relative overflow-hidden rounded-[2rem]">
          <Image src="/images/rescue.jpg" alt="Freshly harvested vegetables in a bamboo basket" width={900} height={680} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-950/85 via-transparent to-transparent" />
          <div className="absolute bottom-5 left-5 flex flex-wrap gap-2">
            {(["fresh", "sell-soon", "urgent", "critical"] as const).map((s) => (
              <span key={s} className="flex items-center gap-1.5 rounded-full bg-forest-950/70 px-3 py-1.5 text-[11px] font-bold text-paper backdrop-blur">
                <span className="size-2 rounded-full" style={{ background: STAGE_META[s].color }} />
                {O ? STAGE_META[s].odia : STAGE_META[s].label}
              </span>
            ))}
          </div>
        </Reveal>
        <div className="flex flex-col justify-center">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-clay-500">{S("res.kicker")}</p>
            <h2 className="font-display mt-3 text-4xl font-medium leading-tight tracking-tight text-forest-950 sm:text-5xl">
              {S("res.h2a")} <em className="text-clay-500 not-italic">{S("res.h2b")}</em>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-lg text-base leading-7 text-forest-900/70">{S("res.lead")}</p>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="mt-7 space-y-3">
              {[
                { day: O ? "ଦିନ ୦–୨: ତାଜା" : "Day 0–2: Fresh", tipK: "res.r1", c: STAGE_META.fresh.color },
                { day: O ? "ଦିନ ୩–୪: କମୁଛି" : "Day 3–4: Slipping", tipK: "res.r2", c: STAGE_META["sell-soon"].color },
                { day: O ? "ଦିନ ୫+: ସଙ୍କଟାପନ୍ନ" : "Day 5+: Critical", tipK: "res.r3", c: STAGE_META.critical.color },
              ].map((r) => (
                <div key={r.day} className="flex items-center gap-4 rounded-2xl border border-forest-900/10 bg-white/70 px-4 py-3">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: r.c }} />
                  <p className="text-sm"><strong className="text-forest-950">{r.day}</strong><span className="text-forest-900/60"> — {S(r.tipK)}</span></p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.26}>
            <Link href="/rescue" className="group mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-forest-900 px-6 py-3.5 text-sm font-bold text-paper transition hover:bg-forest-800">
              {S("res.cta")} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ============================ IMPACT ============================ */}
      <section className="bg-forest-950 py-20 text-paper sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <p className="mb-12 text-xs font-bold uppercase tracking-[0.24em] text-harvest-400">{S("imp.kicker")}</p>
          </Reveal>
          <Counters
            items={[
              { target: seriesCount, label: S("imp.1"), odia: DICT["imp.1"].od },
              { target: 15, label: S("imp.2"), odia: DICT["imp.2"].od },
              { target: 62, suffix: "%", label: S("imp.3"), odia: DICT["imp.3"].od },
              { target: 300000, prefix: "₹", label: S("imp.4"), odia: DICT["imp.4"].od },
            ]}
          />
        </div>
      </section>

      {/* ========================= FARMPROOF TEASE ========================= */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <div className="order-2 flex justify-center lg:order-1">
          <Reveal>
            <Tilt>
              <div className="relative w-[340px] overflow-hidden rounded-[1.6rem] p-6 text-paper shadow-2xl shadow-forest-950/40 sm:w-[380px]">
                <Image src="/images/card-texture.png" alt="" fill className="object-cover" />
                <div className="absolute inset-0 bg-forest-950/35" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-lg font-semibold tracking-tight">Farm<span className="text-harvest-400">Proof</span></p>
                    <BadgeCheck className="size-5 text-leaf-400" />
                  </div>
                  <p className="odia mt-0.5 text-[10px] text-paper/60">ଡିଜିଟାଲ ଚାଷୀ ପରିଚୟ · {O ? "ଓଡ଼ିଶା ସରକାର ସଂଯୁକ୍ତ" : "Odisha Govt-linked"}</p>
                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-paper/50">{S("farm.farmer")}</p>
                      <p className="font-display text-2xl font-semibold">{O ? "ସୁନା ପ୍ରଧାନ" : "Suna Pradhan"}</p>
                      <p className="odia text-xs text-paper/60">ସୁନା ପ୍ରଧାନ · କନ୍ଧମାଳ</p>
                    </div>
                    <div className="rounded-xl bg-paper p-1.5">
                      <QRCodeSVG value="https://agrisetu.app/farmproof?farmer=1" size={64} bgColor="#f6f2e7" fgColor="#0e2f24" />
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                    {[
                      { k: O ? "ବିଶ୍ୱାସ" : "Trust", v: "74/100" },
                      { k: O ? "ଜମି" : "Land", v: "1.8 ac ✓" },
                      { k: "NDVI", v: "0.71 ✓" },
                    ].map((s) => (
                      <div key={s.k} className="rounded-xl bg-paper/10 px-2 py-2 backdrop-blur-sm">
                        <p className="text-[9px] uppercase tracking-widest text-paper/50">{s.k}</p>
                        <p className="tnum mt-0.5 text-sm font-bold text-harvest-400">{s.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-leaf-500/15 px-3.5 py-2.5">
                    <span className="text-[11px] text-paper/70">{S("fp.creditTier")}</span>
                    <span className="tnum text-sm font-bold text-leaf-300">₹3,00,000 · {O ? "ବନ୍ଧକ ବିନା" : "no collateral"}</span>
                  </div>
                </div>
              </div>
            </Tilt>
          </Reveal>
        </div>
        <div className="order-1 lg:order-2">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-leaf-500">{S("fp.kicker")}</p>
            <h2 className="font-display mt-3 text-4xl font-medium leading-tight tracking-tight text-forest-950 sm:text-5xl">
              {S("fp.h2a")}<br />{S("fp.h2b")}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-lg text-base leading-7 text-forest-900/70">{S("fp.lead")}</p>
          </Reveal>
          <Reveal delay={0.18}>
            <ul className="mt-7 space-y-3">
              {[
                { icon: ShieldCheck, k: "fp.l1" },
                { icon: Radar, k: "fp.l2" },
                { icon: Store, k: "fp.l3" },
                { icon: Banknote, k: "fp.l4" },
              ].map((r) => (
                <li key={r.k} className="flex items-center gap-3 text-sm font-semibold text-forest-900">
                  <r.icon className="size-5 shrink-0 text-leaf-600" /> {S(r.k)}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.26}>
            <Link href="/farmproof" className="group mt-8 inline-flex items-center gap-2 rounded-full bg-forest-900 px-6 py-3.5 text-sm font-bold text-paper transition hover:bg-forest-800">
              {S("fp.cta")} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ============================== CTA ============================== */}
      <section className="relative mx-4 mb-8 overflow-hidden rounded-[2.5rem] sm:mx-6">
        <Image src="/images/mandi.jpg" alt="Odisha vegetable mandi at dawn" fill className="object-cover" />
        <div className="absolute inset-0 bg-forest-950/80" />
        <div className="grain relative mx-auto max-w-3xl px-6 py-24 text-center text-paper">
          <Reveal>
            <h2 className="font-display text-4xl font-medium leading-tight tracking-tight sm:text-6xl">
              {S("cta.h2a")}
              <br />
              <span className="text-harvest-400">{S("cta.h2b")}</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-4 text-paper/60">{S("cta.sub")}</p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/dashboard" className="group flex items-center gap-2 rounded-full bg-harvest-400 px-7 py-4 text-sm font-bold text-forest-950 transition hover:bg-harvest-500">
                {S("cta.enter")} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/market" className="rounded-full border border-paper/30 px-7 py-4 text-sm font-bold text-paper transition hover:bg-paper/10">
                {S("cta.buyers")}
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.28}>
            <p className="mx-auto mt-7 flex max-w-md items-center justify-center gap-2 text-xs text-paper/50">
              <Users className="size-3.5" /> {S("cta.note")}
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
