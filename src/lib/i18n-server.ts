import { cookies } from "next/headers";
import type { Lang } from "@/lib/i18n-shared";

/** Server-side language read: the lang cookie is mirrored from the client toggle. */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return store.get("agrisetu-lang")?.value === "od" ? "od" : "en";
}
