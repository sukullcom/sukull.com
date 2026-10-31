"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { customMarketplaceServices } from "@/db/schema";
import { getAdminActor } from "@/lib/admin";
import { logAdminAction } from "@/lib/admin-audit";
import { CATEGORIES, isBuiltInService } from "@/lib/marketplace/catalog";
import { customServiceInUse, invalidateCustomServices, serviceSlug } from "@/lib/marketplace/custom-services";

type Result = { ok: true } | { error: string };

function refresh(slug: string) {
  invalidateCustomServices();
  revalidatePath("/admin/hizmetler");
  revalidatePath("/hizmet");
  revalidatePath(`/hizmet/${slug}`);
  revalidatePath("/");
  revalidatePath("/ayarlar/hizmetlerim");
  revalidatePath("/talep/yeni");
}

function lines(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/\n|,/)) {
    const value = part.trim().replace(/\s+/g, " ");
    if (!value || value.length > 40 || seen.has(value.toLocaleLowerCase("tr-TR"))) continue;
    if (value.includes(",")) continue;
    seen.add(value.toLocaleLowerCase("tr-TR"));
    out.push(value);
    if (out.length >= 8) break;
  }
  return out;
}

export async function createCustomService(input: {
  name: string;
  categorySlug: string;
  aliases: string;
  prompt: string;
  options: string;
  variant: boolean;
  anywhere: boolean;
}): Promise<Result> {
  const actor = await getAdminActor();
  if (!actor) return { error: "Yetkin yok." };

  const name = input.name.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 60) return { error: "Hizmet adı 2-60 karakter olmalı." };
  const category = CATEGORIES.find((item) => item.slug === input.categorySlug);
  if (!category) return { error: "Kategori seç." };
  const slug = serviceSlug(name);
  if (!slug || slug.length < 2) return { error: "Bu addan bir adres çıkarılamadı." };
  if (isBuiltInService(slug)) return { error: "Bu hizmet zaten katalogda var." };

  const aliases = lines(input.aliases);
  const options = lines(input.options);
  if (options.length === 1) return { error: "Seçenek yoksa boş bırak, varsa en az iki seçenek yaz." };
  const prompt = input.prompt.trim().slice(0, 120);

  try {
    await db.insert(customMarketplaceServices).values({
      slug,
      name,
      categorySlug: category.slug,
      aliases,
      prompt: prompt || null,
      options,
      variant: options.length >= 2 && input.variant,
      anywhere: input.anywhere,
    });
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    const message = error instanceof Error ? error.message : "";
    if (code === "23505") return { error: "Bu isimde bir hizmet zaten eklenmiş." };
    if (code === "42P01" || message.includes("custom_marketplace_services")) {
      return { error: "Hizmet tablosu henüz yok. Veritabanı güncellemesi uygulanmalı." };
    }
    return { error: "Hizmet eklenemedi. Tekrar dene." };
  }

  await logAdminAction({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "custom_service.create",
    targetType: "custom_service",
    targetId: slug,
    metadata: { name, category: category.slug },
  });
  refresh(slug);
  return { ok: true };
}

export async function deleteCustomService(slug: string): Promise<Result> {
  const actor = await getAdminActor();
  if (!actor) return { error: "Yetkin yok." };
  if (isBuiltInService(slug)) return { error: "Sabit katalogdaki hizmet silinemez." };
  if (await customServiceInUse(slug)) {
    return { error: "Bu hizmeti kullanan ilan veya hizmet veren var. Silinemez." };
  }
  const removed = await db
    .delete(customMarketplaceServices)
    .where(eq(customMarketplaceServices.slug, slug))
    .returning({ slug: customMarketplaceServices.slug });
  if (removed.length === 0) return { error: "Hizmet bulunamadı." };

  await logAdminAction({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "custom_service.delete",
    targetType: "custom_service",
    targetId: slug,
  });
  refresh(slug);
  return { ok: true };
}
