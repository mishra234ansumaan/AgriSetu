import Image from "next/image";
import { Refrigerator } from "lucide-react";
import { db } from "@/db";
import { facilities } from "@/db/schema";
import { getLang } from "@/lib/i18n-server";
import { DICT } from "@/lib/i18n-shared";
import StorageClient from "@/components/storage/StorageClient";

export const dynamic = "force-dynamic";

export default async function StoragePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const lang = await getLang();
  const S = (k: string) => DICT[k]?.[lang] ?? k;
  const rows = await db.select().from(facilities);
  const type = ["cold", "warehouse", "processing"].includes(String(sp.type)) ? String(sp.type) : "cold";

  const cold = rows.filter((r) => r.type === "cold").length;
  const ware = rows.filter((r) => r.type === "warehouse").length;
  const proc = rows.filter((r) => r.type === "processing").length;
  const counts = lang === "od" ? `${cold} କୋଲ୍ଡ ଷ୍ଟୋରେଜ, ${ware} ଗୋଦାମ ଓ ${proc} ପ୍ରକ୍ରିୟା ୟୁନିଟ୍` : `${cold} cold storages, ${ware} warehouses and ${proc} processing units`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-forest-950 text-paper">
        <Image src="/images/storage.jpg" alt="Cold storage warehouse with produce crates" fill className="object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/90 via-forest-950/60 to-transparent" />
        <div className="relative p-8 sm:p-12">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-harvest-400">
            <Refrigerator className="size-3.5" /> {S("storage.kicker")}
          </p>
          <h1 className="font-display mt-3 max-w-2xl text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
            {S("storage.h1a")} <em className="text-harvest-400 not-italic">{S("storage.h1b")}</em>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-paper/70">{counts} — {S("storage.sub")}</p>
        </div>
      </div>

      <div className="mt-8">
        <StorageClient
          initialType={type}
          facilities={rows.map((f) => ({
            id: f.id,
            name: f.name,
            type: f.type,
            district: f.district,
            lat: f.lat,
            lng: f.lng,
            capacityQuintal: f.capacityQuintal,
            availableQuintal: f.availableQuintal,
            ratePerQPerDay: f.ratePerQPerDay,
            contact: f.contact,
            services: f.services,
          }))}
        />
      </div>
    </div>
  );
}
