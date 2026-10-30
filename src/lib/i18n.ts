"use client";

import { createContext, useContext } from "react";
import { DICT, type Lang } from "@/lib/i18n-shared";

export type { Lang };
export const STRINGS = DICT;

export const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
}>({ lang: "en", setLang: () => {} });

export function useLang() {
  return useContext(LangContext);
}

export function t(key: string, lang: Lang): string {
  return DICT[key]?.[lang] ?? DICT[key]?.en ?? key;
}
