import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CategoryRequestStart } from "@/components/marketplace/category-request-start";
import { RequestWizard } from "@/components/marketplace/request-wizard";
import { getProvinces } from "@/lib/marketplace/address";
import { CATEGORIES, getService, servicesInCategory } from "@/lib/marketplace/catalog";
import { parsePreset } from "@/lib/marketplace/search";
import { requireMarketAccount } from "@/lib/marketplace/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Talep oluştur" };

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: { hizmet?: string; kategori?: string; on?: string };
}) {
  const hizmet = searchParams.hizmet ?? "";
  const kategori = searchParams.kategori ?? "";
  const on = searchParams.on ?? "";
  const nextPath = hizmet
    ? `/talep/yeni?hizmet=${encodeURIComponent(hizmet)}${on ? `&on=${encodeURIComponent(on)}` : ""}`
    : `/talep/yeni?kategori=${encodeURIComponent(kategori)}`;
  const account = await requireMarketAccount(nextPath);
  const provinces = getProvinces();
  const email = account.email ?? "";
  const phone = account.phone ?? "";

  if (hizmet) {
    const service = getService(hizmet);
    if (!service) notFound();
    return (
      <RequestWizard
        slug={service.slug}
        provinces={provinces}
        email={email}
        phone={phone}
        preset={parsePreset(service.slug, on)}
      />
    );
  }

  const services = servicesInCategory(kategori);
  const category = CATEGORIES.find((item) => item.slug === kategori);
  if (!category || services.length === 0) notFound();
  if (services.length === 1) {
    return <RequestWizard slug={services[0].slug} provinces={provinces} email={email} phone={phone} />;
  }

  return (
    <CategoryRequestStart
      categoryName={category.name}
      services={services.map((service) => ({ slug: service.slug, name: service.name }))}
      provinces={provinces}
      email={email}
      phone={phone}
    />
  );
}
