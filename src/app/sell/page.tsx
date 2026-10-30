import { Scale } from "lucide-react";
import { allCrops, sellAdvice } from "@/lib/queries";
import { getLang } from "@/lib/i18n-server";
import { DICT } from "@/lib/i18n-shared";
import SellClient from "@/components/sell/SellClient";

export const dynamic = "force-dynamic";

export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const lang = await getLang();
  const S = (k: string) => DICT[k]?.[lang] ?? k;
  const crops = await allCrops();
  const cropId = Number(sp.crop ?? 0) || crops.find((c) => c.name === "Paddy (Common)")?.id || crops[0].id;
  const advice = await sellAdvice(cropId, 10, "Kandhamal");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-clay-500">
        <Scale className="size-3.5" /> {S("sell.kicker")}
      </p>
      <h1 className="font-display mt-2 max-w-3xl text-4xl font-medium leading-tight tracking-tight text-forest-950 sm:text-5xl">
        {S("sell.h1a")} <em className="text-leaf-600 not-italic">{S("sell.h1b")}</em>
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-forest-900/60">
        {S("sell.sub")} {advice.refDate && <strong className="text-forest-950">{advice.refDate}</strong>}
      </p>

      <div className="mt-8">
        <SellClient
          crops={crops.map((c) => ({ id: c.id, name: c.name, nameOdia: c.nameOdia, icon: c.icon }))}
          initialCrop={cropId}
          initialQty={10}
          initialDistrict="Kandhamal"
          initial={advice}
        />
      </div>
    </div>
  );
}
