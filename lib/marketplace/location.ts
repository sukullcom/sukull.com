import { SERVICES, getService } from "@/lib/marketplace/catalog";

export const ONLINE_CITY = "Online";

/** Şehirden bağımsız gösterilen hizmetler (yazılım, tasarım, şehirler arası taşıma...). */
export const ANYWHERE_SLUGS = SERVICES.filter((service) => service.anywhere).map((service) => service.slug);

/** Yerinde yapılan iş mi: online seçilmedi ve hizmet uzaktan yapılamıyor. */
export function isLocalRequest(slug: string, city: string): boolean {
  if (city === ONLINE_CITY) return false;
  return !getService(slug)?.anywhere;
}

/** Yerinde yapılan işler yalnızca aynı ildeki hizmet verene görünür. */
export function providerCanSee(providerCity: string | null | undefined, request: { serviceSlug: string; city: string }): boolean {
  if (!isLocalRequest(request.serviceSlug, request.city)) return true;
  return !!providerCity && providerCity === request.city;
}

/** Aynı ilçedeki ilanlar önce, sonra ilin geri kalanı; her grup kendi içinde yeniden eskiye. */
export function nearbyFirst<T extends { district: string; createdAt: Date }>(rows: T[], providerDistrict: string | null | undefined): T[] {
  if (!providerDistrict) return rows;
  return [...rows].sort((a, b) => {
    const near = Number(b.district === providerDistrict) - Number(a.district === providerDistrict);
    return near || b.createdAt.getTime() - a.createdAt.getTime();
  });
}
