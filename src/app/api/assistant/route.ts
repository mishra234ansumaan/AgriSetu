import { allCrops, sellAdvice, priceSnapshot } from "@/lib/queries";
import { db } from "@/db";
import { facilities, pools } from "@/db/schema";
import { inr } from "@/lib/odisha";

export const dynamic = "force-dynamic";

const CROP_ALIASES: Record<string, string> = {
  tomato: "tomato", tamatar: "tomato", "ଟମାଟୋ": "tomato",
  brinjal: "brinjal", eggplant: "brinjal", baigan: "brinjal", baigana: "brinjal", "ବାଇଗଣ": "brinjal",
  paddy: "paddy (common)", dhan: "paddy (common)", rice: "paddy (common)", "ଧାନ": "paddy (common)",
  potato: "potato", alu: "potato", "ଆଳୁ": "potato",
  onion: "onion", piaaj: "onion", piaj: "onion", "ପିଆଜ": "onion",
  okra: "okra (bhindi)", bhindi: "okra (bhindi)", bhendi: "okra (bhindi)", "ଭେଣ୍ଡି": "okra (bhindi)",
  cabbage: "cabbage", bandhakobi: "cabbage", "ବନ୍ଧାକୋବି": "cabbage",
  cauliflower: "cauliflower", phulakobi: "cauliflower", "ଫୁଲକୋବି": "cauliflower",
  maize: "maize", maka: "maize", makka: "maize", "ମକା": "maize",
  moong: "green gram (moong)", mug: "green gram (moong)", "ମୁଗ": "green gram (moong)",
  biri: "black gram (biri)", urad: "black gram (biri)", "ବିରି": "black gram (biri)",
  groundnut: "groundnut", badam: "groundnut", peanut: "groundnut", "ବାଦାମ": "groundnut",
  mustard: "mustard", sariso: "mustard", "ସରିଷା": "mustard",
  turmeric: "turmeric (dry)", haladi: "turmeric (dry)", haldi: "turmeric (dry)", "ହଳଦୀ": "turmeric (dry)",
  ginger: "ginger", ada: "ginger", adrak: "ginger", "ଅଦା": "ginger",
  chilli: "chilli (dry)", chili: "chilli (dry)", lanka: "chilli (dry)", "ଲଙ୍କା": "chilli (dry)",
  mango: "mango", amba: "mango", "ଆମ୍ବ": "mango",
  banana: "banana", kadali: "banana", "କଦଳୀ": "banana",
  pineapple: "pineapple", sapuri: "pineapple", "ସପୁରୀ": "pineapple",
  cashew: "cashew", kaju: "cashew", "କାଜୁ": "cashew",
  cotton: "cotton", kapa: "cotton", "କପା": "cotton",
};

export async function POST(req: Request) {
  const { message, lang } = (await req.json()) as { message: string; lang?: string };
  const O = lang === "od";
  const msg = (message || "").toLowerCase();

  const cropRows = await allCrops();
  const matched =
    cropRows.find((c: { name: string; nameOdia: string | null }) => msg.includes(c.name.toLowerCase()) || (c.nameOdia && message?.includes(c.nameOdia))) ??
    cropRows.find((c: { name: string }) => {
      const key = Object.keys(CROP_ALIASES).find((k) => msg.includes(k.toLowerCase()) || message?.includes(k));
      return key && c.name.toLowerCase() === CROP_ALIASES[key];
    });

  const wantsPrice = /(price|rate|dam|kete|cost|bhav|ଦର|କେତେ)/.test(msg);
  const wantsSell = /(sell|bik|where|best|bech|ବିକ୍|ବିକି|କେଉଁଠାରେ)/.test(msg);
  const wantsRot = /(rot|spoil|decay|wast|sad|nasta|ନଷ୍ଟ|ପଚ)/.test(msg);
  const wantsStorage = /(storage|cold|warehouse|godown|bhandar|ଭଣ୍ଡାର|ଥଣ୍ଡା|କୋଲ୍ଡ)/.test(msg);
  const wantsLoan = /(loan|bank|credit|collateral|kisan|passport|farmproof|rina|ଋଣ|ବ୍ୟାଙ୍କ|ବନ୍ଧକ)/.test(msg);
  const wantsTransport = /(transport|truck|gaadi|gadi|pool|vehicle|ଗାଡ଼ି|ଗାଡି)/.test(msg);

  if (wantsRot) {
    const detail = matched
      ? O
        ? `${matched.nameOdia} ପାଇଁ ଖୋଲାରେ ~${matched.shelfDays} ଦିନ; କୋଲ୍ଡ ଷ୍ଟୋରେଜ ~${matched.coldMultiplier}× ବଢ଼ାଏ।`
        : `For ${matched.name} (${matched.nameOdia}), open-air shelf life is ~${matched.shelfDays} days, but cold storage stretches it ~${matched.coldMultiplier}×.`
      : O
        ? "ଫସଲ ଓ ଅମଳ ତାରିଖ କୁହନ୍ତୁ — ତାଜାପଣ ଗଣନା କରିବି।"
        : "Tell me the crop and harvest date and I'll compute its freshness.";
    return Response.json({
      text: O
        ? `ପଚିଯିବାକୁ ଦିଅନ୍ତୁ ନାହିଁ — ବର୍ତ୍ତମାନ କାମ କରିବା। ${detail} ଫସଲ ସୁରକ୍ଷା ଖୋଲନ୍ତୁ: ତାଜାପଣ %, ଆଜିର ଶ୍ରେଷ୍ଠ ମାଣ୍ଡି (ଗାଡ଼ି ଭାଡ଼ା ବାଦ), ନିକଟତମ କୋଲ୍ଡ ଷ୍ଟୋରେଜ ମୂଲ୍ୟ ଓ ପ୍ରକ୍ରିୟା ୟୁନିଟ୍ ବିକଳ୍ପ ଦେଖାଯିବ।`
        : `Don't let it rot — let's act now. ${detail} Open the Harvest Rescue tool: it shows freshness %, today's best mandi net of transport, nearest cold storage cost, and a processing-unit fallback.`,
      links: [{ label: O ? "ଫସଲ ସୁରକ୍ଷା ଖୋଲନ୍ତୁ" : "Open Harvest Rescue", href: "/rescue" }],
    });
  }

  if (wantsStorage) {
    const cold = await db.select().from(facilities);
    const top = cold.filter((f: typeof facilities.$inferSelect) => f.type === "cold").sort((a: typeof facilities.$inferSelect, b: typeof facilities.$inferSelect) => a.ratePerQPerDay - b.ratePerQPerDay).slice(0, 3);
    const lines = top.map((f: typeof facilities.$inferSelect) => `${f.name} (${f.district}) — ${inr(f.ratePerQPerDay)}/q/${O ? "ଦିନ" : "day"}`).join(" · ");
    return Response.json({
      text: O
        ? `ବର୍ତ୍ତମାନ ସବୁଠାରୁ ସସ୍ତା କୋଲ୍ଡ ଷ୍ଟୋରେଜ: ${lines}। ଭଣ୍ଡାର ପୃଷ୍ଠାରେ ମାନଚିତ୍ର, ଦୂରତା ଓ ତାତ୍କ୍ଷଣିକ ବୁକିଂ ମିଳିବ।`
        : `Cheapest cold storages right now: ${lines}. The Storage page has maps, distances and instant booking — capacity updates live.`,
      links: [{ label: O ? "ଭଣ୍ଡାର ଦେଖନ୍ତୁ" : "Storage & Processing", href: "/storage" }],
    });
  }

  if (wantsTransport) {
    const open = await db.select().from(pools);
    return Response.json({
      text: O
        ? `ବର୍ତ୍ତମାନ ${open.length}ଟି ଖୋଲା ଗାଡ଼ି ପୁଲ୍ ଅଛି — ସମାନ ରାସ୍ତାର ଚାଷୀମାନେ ଗାଡ଼ି ଭାଗ କରନ୍ତି। ପୁଲିଙ୍ଗରେ ଏକୁଟିଆ ଭାଡ଼ା ଅପେକ୍ଷା ୫୫–୭୦% ଖର୍ଚ୍ଚ କମ୍ ହୁଏ। ଗୋଟିଏ ଟ୍ୟାପରେ ଯୋଗ ଦିଅନ୍ତୁ।`
        : `There are ${open.length} open transport pools — farmers sharing one truck and splitting the ₹/km. Pooling typically cuts cost 55–70% vs hiring solo. Join in one tap.`,
      links: [{ label: O ? "ଗାଡ଼ି ସହଯୋଗ" : "Transport Pooling", href: "/transport" }],
    });
  }

  if (wantsLoan) {
    return Response.json({
      text: O
        ? "ଜମି ବନ୍ଧକ ଦରକାର ନାହିଁ। ଫାର୍ମପ୍ରୁଫ କାର୍ଡରେ ପ୍ରମାଣିତ ଜମି ରେକର୍ଡ, ସାଟେଲାଇଟ୍ NDVI ଫସଲ ପ୍ରମାଣ, ମାଣ୍ଡି ବିକ୍ରି ରସିଦ ଓ ସମ୍ପ୍ରଦାୟ ସାକ୍ଷ୍ୟ ମିଶି ବିଶ୍ୱାସ ସ୍କୋର ଗଢ଼େ (ଆପଣଙ୍କ: ୭୪/୧୦୦ → ₹୩,୦୦,୦୦୦ ସ୍ତର)। ବ୍ୟାଙ୍କରେ QR ସ୍କାନ୍ କରନ୍ତୁ — ପ୍ରମାଣ ଦେଖି ଋଣ ମଞ୍ଜୁର ହେବ।"
        : "No land mortgage needed. Your FarmProof Card bundles verified land records, satellite NDVI crop proof, mandi sale receipts and community vouches into a Trust Score (yours: 74/100 → ₹3,00,000 tier). Scan the QR at any partner bank.",
      links: [{ label: O ? "ମୋ କାର୍ଡ ଦେଖନ୍ତୁ" : "My FarmProof Card", href: "/farmproof" }],
    });
  }

  if (matched) {
    const advice = await sellAdvice(matched.id, 10, "Kandhamal");
    const best = advice.options[0];
    if (wantsSell && best) {
      return Response.json({
        text: O
          ? `${matched.nameOdia} ପାଇଁ ଆଜି: ଶ୍ରେଷ୍ଠ ନିଟ ରିଟର୍ଣ୍ଣ ${inr(best.netPerQSolo)}/q — ${best.mandiName} (${best.district}, ${best.distanceKm} କି.ମି., ଖର୍ଚ୍ଚ ${inr(best.costPerQSolo)}/q)। ସମସ୍ତ ମାଣ୍ଡିର ତୁଳନା ଦେଖନ୍ତୁ:`
          : `For ${matched.name} (${matched.nameOdia}) today: best NET is ${inr(best.netPerQSolo)}/q at ${best.mandiName} (${best.district}, ${best.distanceKm} km, costs ${inr(best.costPerQSolo)}/q). See all mandis ranked by net:`,
        links: [{ label: O ? "କେଉଁଠାରେ ବିକିବେ" : "Where to Sell", href: `/sell?crop=${matched.id}` }],
      });
    }
    if (wantsPrice || matched.name === "Tomato") {
      const snap = await priceSnapshot();
      const top = snap.filter((s) => s.cropId === matched.id).sort((a, b) => b.modalP - a.modalP)[0];
      if (top) {
        return Response.json({
          text: O
            ? `${matched.nameOdia} ଆଜି ${top.mandiName}ରେ ${inr(top.modalP)}/q (${top.changePct >= 0 ? "▲" : "▼"}${Math.abs(top.changePct).toFixed(1)}%)। ୩୦ ଦିନର ଧାରା ଦେଖନ୍ତୁ:`
            : `${matched.name} (${matched.nameOdia}) trades at ${inr(top.modalP)}/q at ${top.mandiName} today (${top.changePct >= 0 ? "▲" : "▼"}${Math.abs(top.changePct).toFixed(1)}%). See the 30-day trend:`,
          links: [{ label: O ? "ମାଣ୍ଡି ଦର" : "Mandi Prices", href: `/mandis?crop=${matched.id}` }],
        });
      }
    }
  }

  if (wantsPrice || wantsSell) {
    return Response.json({
      text: O
        ? "ଫସଲ ନାମ କୁହନ୍ତୁ — ଯଥା 'ଟମାଟୋ ଦର କେତେ?' ବା 'ଧାନ କେଉଁଠାରେ ବିକିବି?'। ମୁଁ ୧୫ଟି ଓଡ଼ିଶା ମାଣ୍ଡିର ଲାଇଭ ଦର ପଢ଼େ ଓ ଗାଡ଼ି ଭାଡ଼ା, ଫିସ୍, ଶ୍ରମିକ ବାଦ ପରେ ନିଟ ରିଟର୍ଣ୍ଣ ଅନୁଯାୟୀ କ୍ରମାଙ୍କନ କରେ।"
        : "Tell me the crop — e.g. 'tomato price today' or 'where to sell paddy'. I read live prices from 15 Odisha mandis and rank them by net return after transport, mandi fee and labour.",
      links: [
        { label: O ? "ମାଣ୍ଡି ଦର" : "Mandi Prices", href: "/mandis" },
        { label: O ? "କେଉଁଠାରେ ବିକିବେ" : "Where to Sell", href: "/sell" },
      ],
    });
  }

  return Response.json({
    text: O
      ? "ମୁଁ ସାହାଯ୍ୟ କରିପାରିବି: ଆଜିର ମାଣ୍ଡି ଦର ('ଟମାଟୋ ଦର'), ଶ୍ରେଷ୍ଠ ବିକ୍ରୟ ସ୍ଥାନ ('ଧାନ ବିକିବି'), ଫସଲ ସୁରକ୍ଷା ('ବାଇଗଣ ପଚୁଛି'), କୋଲ୍ଡ ଷ୍ଟୋରେଜ, ଗାଡ଼ି ପୁଲିଙ୍ଗ ଓ ବିନା ବନ୍ଧକ ଫାର୍ମପ୍ରୁଫ ଋଣ।"
      : "I can help with: today's mandi prices ('tomato price'), best place to sell ('sell 20q paddy'), harvest rescue ('my brinjal is rotting'), cold storage, transport pooling, and collateral-free FarmProof loans.",
    links: [
      { label: O ? "ମୁଖ୍ୟ ପୃଷ୍ଠା" : "Dashboard", href: "/dashboard" },
      { label: O ? "ଫସଲ ସୁରକ୍ଷା" : "Harvest Rescue", href: "/rescue" },
    ],
  });
}
