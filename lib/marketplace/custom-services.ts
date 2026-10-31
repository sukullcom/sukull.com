import "server-only";

import { count, eq } from "drizzle-orm";

import db from "@/db/drizzle";
import { customMarketplaceServices, providerServices, serviceRequests } from "@/db/schema";
import {
  CATEGORIES,
  isBuiltInService,
  replaceRuntimeServices,
  runtimeServices,
  type ServiceDef,
} from "@/lib/marketplace/catalog";
import { normalizeTr } from "@/lib/marketplace/search";

const TTL_MS = 15_000;

let loadedAt = 0;
let inflight: Promise<ServiceDef[]> | null = null;

function isMissingTable(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  const message = error instanceof Error ? error.message : String(error ?? "");
  return code === "42P01" || message.includes("custom_marketplace_services");
}

export function serviceSlug(name: string): string {
  return normalizeTr(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function toService(row: typeof customMarketplaceServices.$inferSelect): ServiceDef | null {
  const category = CATEGORIES.find((item) => item.slug === row.categorySlug);
  if (!category || isBuiltInService(row.slug)) return null;
  const options = (row.options ?? []).filter((option) => option.trim().length > 0);
  const questions: ServiceDef["questions"] = [];
  if (options.length >= 2) {
    const prompt = row.prompt?.trim() || "Ne yapılacak?";
    const mapped = options.map((option) => ({ value: option, label: option }));
    questions.push(
      row.variant
        ? {
            id: "tur",
            kind: "single",
            prompt,
            options: mapped,
            variant: { allLabel: "Tümü", pickLabel: "Türleri seç" },
          }
        : { id: "tur", kind: "single", prompt, options: mapped },
    );
  }
  return {
    slug: row.slug,
    name: row.name,
    category: category.name,
    categorySlug: category.slug,
    aliases: row.aliases ?? [],
    anywhere: row.anywhere,
    questions,
  };
}

async function loadCustomServices(): Promise<ServiceDef[]> {
  try {
    const rows = await db.select().from(customMarketplaceServices);
    const defs = rows.flatMap((row) => {
      const service = toService(row);
      return service ? [service] : [];
    });
    replaceRuntimeServices(defs);
    loadedAt = Date.now();
    return defs;
  } catch (error) {
    if (!isMissingTable(error)) throw error;
    loadedAt = Date.now();
    return runtimeServices();
  }
}

/** Katalog okumadan önce çağır. Kısa süre bellekte tutulur. */
export async function ensureCustomServices(): Promise<ServiceDef[]> {
  if (Date.now() - loadedAt < TTL_MS) return runtimeServices();
  if (!inflight) {
    inflight = loadCustomServices().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

export function invalidateCustomServices() {
  loadedAt = 0;
}

export async function listCustomServiceRows() {
  await ensureCustomServices();
  try {
    return await db.select().from(customMarketplaceServices);
  } catch (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
}

export async function customServiceInUse(slug: string): Promise<boolean> {
  const [requests, providers] = await Promise.all([
    db.select({ value: count() }).from(serviceRequests).where(eq(serviceRequests.serviceSlug, slug)),
    db.select({ value: count() }).from(providerServices).where(eq(providerServices.serviceSlug, slug)),
  ]);
  return Number(requests[0]?.value ?? 0) + Number(providers[0]?.value ?? 0) > 0;
}
