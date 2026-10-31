import { redirect } from "next/navigation";

import { getMarketAccount } from "@/db/queries/marketplace";
import { getServerUser } from "@/lib/auth";
import { ensureCustomServices } from "@/lib/marketplace/custom-services";
import { safeNextPath } from "@/lib/safe-next";

export async function requireMarketAccount(nextPath: string) {
  const user = await getServerUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(safeNextPath(nextPath))}`);
  await ensureCustomServices();
  const account = await getMarketAccount(user.id);
  if (!account) redirect(`/login?next=${encodeURIComponent(safeNextPath(nextPath))}`);
  return account;
}
