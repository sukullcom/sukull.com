"use server";

import { revalidatePath } from "next/cache";

import { getServerUser } from "@/lib/auth";
import { setDigestEnabled } from "@/lib/marketplace/notify";

export async function saveDigestPreference(formData: FormData): Promise<void> {
  const user = await getServerUser();
  if (!user) return;
  const enabled = formData.getAll("enabled").includes("1");
  await setDigestEnabled(user.id, enabled);
  revalidatePath("/ayarlar/bildirimler");
}
