"use client";

import { replaceRuntimeServices, type ServiceDef } from "@/lib/marketplace/catalog";

/** Admin’in eklediği hizmetleri arama ve formların gördüğü kataloğa yazar. */
export function CatalogBridge({ extra, children }: { extra: ServiceDef[]; children: React.ReactNode }) {
  replaceRuntimeServices(extra);
  return children;
}
