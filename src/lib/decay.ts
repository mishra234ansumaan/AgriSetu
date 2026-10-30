/* AgriDecay engine — freshness maths shared across UI + API */

export type FreshnessStage = "fresh" | "sell-soon" | "urgent" | "critical";

export interface Freshness {
  pct: number; // 0..100 freshness remaining
  stage: FreshnessStage;
  daysLeft: number;
  effectiveShelf: number;
}

export const CONDITION_FACTOR: Record<string, number> = {
  open: 1,
  shade: 1.35,
  cold: 2.8,
};

export function computeFreshness(
  shelfDays: number,
  harvestDate: string,
  condition: string,
  coldMultiplier = 2.8,
): Freshness {
  const factor =
    condition === "cold" ? coldMultiplier : CONDITION_FACTOR[condition] ?? 1;
  const effectiveShelf = Math.max(1, Math.round(shelfDays * factor));
  const elapsed = Math.max(
    0,
    Math.round((Date.now() - new Date(harvestDate + "T00:00:00").getTime()) / 86400000),
  );
  const pct = Math.max(0, Math.min(100, (1 - elapsed / effectiveShelf) * 100));
  const stage: FreshnessStage =
    pct > 70 ? "fresh" : pct > 40 ? "sell-soon" : pct > 15 ? "urgent" : "critical";
  return { pct: Math.round(pct), stage, daysLeft: Math.max(0, effectiveShelf - elapsed), effectiveShelf };
}

export const STAGE_META: Record<
  FreshnessStage,
  { label: string; odia: string; color: string; soft: string; advice: string }
> = {
  fresh: {
    label: "Fresh",
    odia: "ତାଜା",
    color: "#3E9B4F",
    soft: "rgba(62,155,79,.12)",
    advice: "Quality premium window — compare mandis calmly and chase the best net price.",
  },
  "sell-soon": {
    label: "Sell Soon",
    odia: "ଶୀଘ୍ର ବିକନ୍ତୁ",
    color: "#D99A2B",
    soft: "rgba(217,154,43,.12)",
    advice: "Quality slipping. Sell within 2 days or shift to cold storage to freeze decay.",
  },
  urgent: {
    label: "Urgent",
    odia: "ଜରୁରୀ",
    color: "#D9622B",
    soft: "rgba(217,98,43,.12)",
    advice: "Sell today to the nearest fair mandi — don't chase far-away high prices now.",
  },
  critical: {
    label: "Critical",
    odia: "ସଙ୍କଟାପନ୍ନ",
    color: "#B3352C",
    soft: "rgba(179,53,44,.12)",
    advice: "Mandi buyers will reject soon. Route to a processing unit or cattle-feed channel immediately.",
  },
};

/** decay curve points for charting: freshness% vs day offset */
export function decayCurve(
  shelfDays: number,
  condition: string,
  coldMultiplier: number,
  elapsed: number,
): { day: number; open: number; actual: number }[] {
  const eff =
    Math.max(1, shelfDays * (condition === "cold" ? coldMultiplier : CONDITION_FACTOR[condition] ?? 1));
  const horizon = Math.ceil(Math.max(eff, shelfDays) * 1.3);
  const pts: { day: number; open: number; actual: number }[] = [];
  for (let d = 0; d <= horizon; d++) {
    pts.push({
      day: d,
      open: Math.max(0, Math.round((1 - d / shelfDays) * 100)),
      actual: Math.max(0, Math.round((1 - d / eff) * 100)),
    });
    if (pts[pts.length - 1].open === 0 && pts[pts.length - 1].actual === 0) break;
  }
  return pts.map((p) => ({ ...p, day: p.day - Math.min(elapsed, 0) }));
}
