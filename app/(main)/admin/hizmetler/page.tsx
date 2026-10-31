import { redirect } from "next/navigation";
import { Layers } from "lucide-react";

import { isAdmin } from "@/lib/admin";
import { CATEGORIES } from "@/lib/marketplace/catalog";
import { listCustomServiceRows } from "@/lib/marketplace/custom-services";
import { CustomServiceManager } from "./custom-service-manager";

export const dynamic = "force-dynamic";

export default async function AdminCustomServicesPage() {
  if (!(await isAdmin())) redirect("/unauthorized");
  const rows = await listCustomServiceRows();

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-emerald-50 p-2">
          <Layers className="h-5 w-5 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hizmet ekle</h1>
          <p className="text-xs text-gray-500">
            Buradan eklenen hizmet, hizmet alanın aramasında ve hizmet verenin Hizmetlerim listesinde görünür.
          </p>
        </div>
      </div>
      <CustomServiceManager
        categories={CATEGORIES.map((category) => ({ slug: category.slug, name: category.name }))}
        rows={rows.map((row) => ({
          slug: row.slug,
          name: row.name,
          categoryName: CATEGORIES.find((category) => category.slug === row.categorySlug)?.name ?? row.categorySlug,
          anywhere: row.anywhere,
        }))}
      />
    </div>
  );
}
