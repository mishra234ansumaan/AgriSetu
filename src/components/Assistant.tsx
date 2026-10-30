"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Send, Sparkles, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useLang } from "@/lib/i18n";

interface Msg {
  role: "user" | "bot";
  text: string;
  links?: { label: string; href: string }[];
}

const QUICK_EN = [
  "Tomato price today?",
  "Where should I sell 20q paddy?",
  "My brinjal is rotting",
  "Cold storage near me",
  "Loan without collateral?",
];
const QUICK_OD = [
  "ଆଜି ଟମାଟୋ ଦର କେତେ?",
  "୨୦ କୁଇଣ୍ଟାଲ ଧାନ କେଉଁଠାରେ ବିକିବି?",
  "ମୋ ବାଇଗଣ ପଚୁଛି",
  "ମୋ ପାଖରେ କୋଲ୍ଡ ଷ୍ଟୋରେଜ",
  "ବିନା ବନ୍ଧକରେ ଋଣ ମିଳିବ କି?",
];

export default function Assistant() {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "bot",
      text:
        lang === "od"
          ? "ନମସ୍କାର! ମୁଁ ସହାୟକ। Ask me about prices, where to sell, rescue, storage or loans."
          : "Namaskar! I'm Sahayak (ସହାୟକ). Ask me about mandi prices, where to sell, harvest rescue, storage or FarmProof loans.",
    },
  ]);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  async function send(text: string) {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, lang }),
      });
      const data = (await res.json()) as { text: string; links?: { label: string; href: string }[] };
      setMsgs((m) => [...m, { role: "bot", text: data.text, links: data.links }]);
    } catch {
      setMsgs((m) => [...m, { role: "bot", text: "Network hiccup — please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  function hear() {
    type Rec = { lang: string; onresult: (e: { results: { transcript: string }[][] }) => void; start: () => void };
    const w = window as unknown as { webkitSpeechRecognition?: new () => Rec; SpeechRecognition?: new () => Rec };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = lang === "od" ? "or-IN" : "en-IN";
    rec.onresult = (e) => {
      const txt = e.results[0][0].transcript;
      void send(txt);
    };
    rec.start();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-forest-900 py-3 pl-4 pr-5 text-sm font-bold text-paper shadow-xl shadow-forest-900/30 transition hover:scale-105 ${open ? "hidden" : ""}`}
      >
        <Sparkles className="size-4 text-harvest-400" />
        Sahayak <span className="odia text-harvest-400/90">· ସହାୟକ</span>
      </button>

      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[540px] w-[min(400px,calc(100vw-40px))] flex-col overflow-hidden rounded-3xl border border-forest-900/10 bg-paper shadow-2xl shadow-forest-950/30">
          <div className="flex items-center justify-between bg-forest-900 px-5 py-4 text-paper">
            <div>
              <p className="font-display text-lg font-semibold">Sahayak <span className="odia text-harvest-400">ସହାୟକ</span></p>
              <p className="text-[11px] text-paper/60">Farm decision companion · knows today&apos;s Odisha data</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full p-1.5 transition hover:bg-white/10" aria-label="Close">
              <X className="size-4" />
            </button>
          </div>

          <div ref={boxRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-5 ${
                    m.role === "user"
                      ? "rounded-br-sm bg-clay-500 text-white"
                      : "rounded-bl-sm border border-forest-900/10 bg-white text-forest-950"
                  } ${lang === "od" ? "odia" : ""}`}
                >
                  {m.text}
                  {m.links && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.links.map((l) => (
                        <Link
                          key={l.href + l.label}
                          href={l.href}
                          onClick={() => setOpen(false)}
                          className="inline-flex items-center gap-1 rounded-full bg-forest-900 px-2.5 py-1 text-[11px] font-bold text-paper"
                        >
                          {l.label} <ArrowRight className="size-3" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-1.5 text-forest-600">
                <span className="size-1.5 animate-bounce rounded-full bg-forest-600" />
                <span className="size-1.5 animate-bounce rounded-full bg-forest-600 [animation-delay:120ms]" />
                <span className="size-1.5 animate-bounce rounded-full bg-forest-600 [animation-delay:240ms]" />
              </div>
            )}
          </div>

          <div className="border-t border-forest-900/10 bg-white/60 px-3 py-3">
            <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
              {(lang === "od" ? QUICK_OD : QUICK_EN).map((q) => (
                <button
                  key={q}
                  onClick={() => void send(q)}
                  className="whitespace-nowrap rounded-full border border-forest-900/15 bg-white px-2.5 py-1 text-[11px] font-semibold text-forest-800 transition hover:border-forest-900/40"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={hear}
                className="grid size-9 shrink-0 place-items-center rounded-full border border-forest-900/15 text-forest-800 transition hover:bg-forest-900/5"
                title="Speak (voice input)"
                aria-label="Voice input"
              >
                <Mic className="size-4" />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void send(input)}
                placeholder="Ask in English, Hinglish or Odia…"
                className="h-9 min-w-0 flex-1 rounded-full border border-forest-900/15 bg-white px-3.5 text-[13px] outline-none focus:border-forest-700"
              />
              <button
                onClick={() => void send(input)}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-clay-500 text-white transition hover:bg-clay-600"
                aria-label="Send"
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
