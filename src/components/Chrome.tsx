"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Landmark, Languages, Menu, X } from "lucide-react";
import { LangContext, STRINGS, type Lang } from "@/lib/i18n";
import Assistant from "@/components/Assistant";

const NAV = [
  { href: "/dashboard", key: "nav.dashboard" },
  { href: "/mandis", key: "nav.mandis" },
  { href: "/sell", key: "nav.sell" },
  { href: "/rescue", key: "nav.rescue" },
  { href: "/storage", key: "nav.storage" },
  { href: "/transport", key: "nav.transport" },
  { href: "/market", key: "nav.market" },
  { href: "/farmproof", key: "nav.farmproof" },
];

/** Konark-wheel emblem — the Odisha identity mark */
function Chakra({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor">
      <circle cx="24" cy="24" r="20" strokeWidth="2.4" />
      <circle cx="24" cy="24" r="4" fill="currentColor" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * Math.PI) / 6;
        return (
          <line
            key={i}
            x1={24 + Math.cos(a) * 5}
            y1={24 + Math.sin(a) * 5}
            x2={24 + Math.cos(a) * 19}
            y2={24 + Math.sin(a) * 19}
            strokeWidth="1.6"
          />
        );
      })}
    </svg>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <span className="relative grid size-9 place-items-center rounded-xl bg-forest-900 text-harvest-400 shadow-sm transition-transform duration-300 group-hover:-rotate-6">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 18c3-6 6-9 9-9s6 3 9 9" />
          <path d="M5 18h14" />
          <path d="M12 9V5" />
          <path d="M12 5c2.5-.2 4-1.6 4.5-3.6C14 1.6 12.4 3 12 5Z" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className="leading-none">
        <span className="block font-display text-xl font-semibold tracking-tight text-forest-950">
          Agri<span className="text-clay-500">Setu</span>
        </span>
        <span className="odia block text-[10px] font-medium tracking-wide text-forest-600">ଅଗ୍ରିସେତୁ · ଓଡ଼ିଶା</span>
      </span>
    </Link>
  );
}

export default function Chrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>("en");
  const [open, setOpen] = useState(false);
  const synced = useRef(false);
  const isHome = pathname === "/";

  useEffect(() => {
    if (synced.current) return; // run exactly once — prevents any refresh loop
    synced.current = true;
    // Silently adopt stored preference. NO router.refresh() here: auto-refreshing
    // on mount can loop (remount → effect → refresh → remount) and kills the app.
    const saved = localStorage.getItem("agrisetu-lang") as Lang | null;
    const cookie = document.cookie.match(/agrisetu-lang=(en|od)/)?.[1] as Lang | undefined;
    if (saved && saved !== cookie) {
      document.cookie = `agrisetu-lang=${saved};path=/;max-age=31536000`;
      setLangState(saved);
    } else if (cookie && !saved) {
      setLangState(cookie);
    }
  }, []);

  const setLang = (l: Lang) => {
    // Explicit user action: safe to refresh once so server pages render Odia/English too
    setLangState(l);
    localStorage.setItem("agrisetu-lang", l);
    document.cookie = `agrisetu-lang=${l};path=/;max-age=31536000`;
    router.refresh();
  };

  const S = (k: string) => STRINGS[k]?.[lang] ?? k;

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {/* ── Government identity strip ─────────────────────────────────── */}
      <div className="relative z-50">
        <div className="h-1 w-full bg-[linear-gradient(90deg,#ff9933_0%,#ff9933_33%,#ffffff_33%,#ffffff_66%,#138808_66%,#138808_100%)]" />
        <div className="border-b border-forest-900/10 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-1.5 sm:px-6">
            <div className="flex items-center gap-2.5 text-forest-950">
              <Chakra className="size-6 text-forest-800" />
              <div className="leading-tight">
                <p className="text-[11px] font-black tracking-wide">{S("gov.odisha")}</p>
                <p className={`text-[9px] font-semibold text-forest-900/55 ${lang === "od" ? "odia" : ""}`}>{S("gov.dept")}</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="rounded-full bg-forest-950/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-forest-800">
                {S("gov.digitalIndia")}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-harvest-400/20 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-harvest-600">
                <Landmark className="size-3" /> {S("gov.initiative")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main nav ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-forest-900/10 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            {!isHome && (
              <button
                onClick={() => router.back()}
                className="group flex items-center gap-1.5 rounded-full border border-forest-900/15 bg-white/70 py-1.5 pl-2 pr-3 text-xs font-bold text-forest-900 transition hover:border-forest-900/40 hover:bg-white"
                aria-label={S("common.back")}
              >
                <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span className={`${lang === "od" ? "odia" : ""} hidden sm:inline`}>{S("common.back")}</span>
              </button>
            )}
            <Logo />
          </div>
          <nav className="hidden items-center gap-1 2xl:flex">
            {NAV.map((n) => {
              const active = pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                    active ? "bg-forest-900 text-paper" : "text-forest-800/70 hover:bg-forest-900/5 hover:text-forest-900"
                  } ${lang === "od" ? "odia" : ""}`}
                >
                  {S(n.key)}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === "en" ? "od" : "en")}
              className="flex items-center gap-1.5 rounded-full border border-forest-900/15 bg-white/60 px-3 py-1.5 text-xs font-bold text-forest-800 transition hover:border-forest-900/30"
              title="Switch language / ଭାଷା ବଦଳାନ୍ତୁ"
            >
              <Languages className="size-3.5" />
              {lang === "en" ? "EN | ଓଡ଼ିଆ" : <span className="odia">ଓଡ଼ିଆ | EN</span>}
            </button>
            <Link
              href="/dashboard"
              className={`hidden rounded-full bg-clay-500 px-4 py-2 text-[13px] font-bold text-white shadow-sm transition hover:bg-clay-600 sm:block ${lang === "od" ? "odia" : ""}`}
            >
              {S("openDashboard")}
            </Link>
            <button
              className="grid size-9 place-items-center rounded-full border border-forest-900/15 text-forest-900 2xl:hidden"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="border-t border-forest-900/10 bg-paper px-4 py-3 2xl:hidden">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  router.back();
                  setOpen(false);
                }}
                className="flex items-center gap-2 rounded-xl border border-forest-900/15 bg-white/70 px-3 py-2.5 text-sm font-bold text-forest-900"
              >
                <ArrowLeft className="size-4" />
                <span className={lang === "od" ? "odia" : ""}>{S("common.back")}</span>
              </button>
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${
                    pathname.startsWith(n.href) ? "bg-forest-900 text-paper" : "bg-white/70 text-forest-800"
                  } ${lang === "od" ? "odia" : ""}`}
                >
                  {S(n.key)}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="min-h-[80vh]">{children}</main>

      {/* ── Footer with government strip ──────────────────────────────── */}
      <footer className="relative mt-24 overflow-hidden bg-forest-950 text-paper">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <Logo />
              <p className={`mt-4 max-w-sm text-sm leading-6 text-paper/60 ${lang === "od" ? "odia" : ""}`}>{S("footer.blurb")}</p>
              <p className="odia mt-3 text-sm text-harvest-400/90">ଚାଷୀଙ୍କ ହକ୍ ପାଇଁ, ପ୍ରତ୍ୟେକ କୁଇଣ୍ଟାଲ ପାଇଁ।</p>
              <div className="mt-5 flex items-center gap-2.5 rounded-2xl border border-paper/10 bg-paper/5 p-3">
                <Chakra className="size-8 shrink-0 text-harvest-400" />
                <p className={`text-[11px] leading-4 text-paper/60 ${lang === "od" ? "odia" : ""}`}>
                  <strong className="text-paper">{S("gov.odisha")}</strong> — {S("gov.footerLine")}
                </p>
              </div>
            </div>
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-[0.2em] text-harvest-400 ${lang === "od" ? "odia" : ""}`}>{S("footer.platform")}</h4>
              <ul className="mt-4 space-y-2 text-sm text-paper/70">
                {NAV.slice(0, 4).map((n) => (
                  <li key={n.href}>
                    <Link href={n.href} className={`transition hover:text-paper ${lang === "od" ? "odia" : ""}`}>
                      {S(n.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-[0.2em] text-harvest-400 ${lang === "od" ? "odia" : ""}`}>{S("footer.ecosystem")}</h4>
              <ul className="mt-4 space-y-2 text-sm text-paper/70">
                {NAV.slice(4).map((n) => (
                  <li key={n.href}>
                    <Link href={n.href} className={`transition hover:text-paper ${lang === "od" ? "odia" : ""}`}>
                      {S(n.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-paper/10 pt-6 text-xs text-paper/40">
            <span className={lang === "od" ? "odia" : ""}>
              AgriSetu · {S("gov.portal")} · {lang === "od" ? "ଡେମୋ ତଥ୍ୟ Agmarknet ଧାରା ଆଧାରିତ" : "Demo data modelled on Agmarknet patterns"}
            </span>
            <div className={`flex items-center gap-4 ${lang === "od" ? "odia" : ""}`}>
              {[S("gov.terms"), S("gov.privacy"), S("gov.accessibility"), S("gov.disclaimer")].map((l) => (
                <span key={l} className="cursor-pointer transition hover:text-paper/70">{l}</span>
              ))}
              <span className="tnum hidden lg:inline">{S("footer.counts")}</span>
            </div>
          </div>
        </div>
      </footer>

      <Assistant />
    </LangContext.Provider>
  );
}
