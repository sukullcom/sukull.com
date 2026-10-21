"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import db from "@/db/drizzle";
import { marketplaceProfiles, providerServices, userProgress, users } from "@/db/schema";
import { getServerUser } from "@/lib/auth";
import { findProvince, getNeighborhoods, getProvinces, matchPlaceName } from "@/lib/marketplace/address";
import { getService } from "@/lib/marketplace/catalog";
import { cleanFilters, type ProviderServiceEntry } from "@/lib/marketplace/provider-match";
import { createClient } from "@/utils/supabase/server";

const MODE_COOKIE = "sk_market_mode";

async function requireUserId() {
  const user = await getServerUser();
  if (!user) return null;
  return user;
}

function cleanName(value: string): string | null {
  const text = value.trim().replace(/\s+/g, " ");
  if (text.length < 2 || text.length > 60) return null;
  if (!/^[A-Za-zÇĞİÖŞÜçğıöşü][A-Za-zÇĞİÖŞÜçğıöşü\s'.-]*$/.test(text)) return null;
  return text;
}

export async function setMarketMode(mode: "customer" | "provider") {
  const jar = await cookies();
  jar.set(MODE_COOKIE, mode, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect(mode === "provider" ? "/hizmet-veren/ilanlar" : "/");
}

export async function saveDisplayName(firstName: string, lastName: string) {
  const user = await requireUserId();
  if (!user) return { error: "Giriş yap." };
  const first = cleanName(firstName);
  const last = cleanName(lastName);
  if (!first || !last) return { error: "Ad ve soyadı harflerle, en az iki karakter yaz." };

  await db
    .insert(marketplaceProfiles)
    .values({ userId: user.id, firstName: first, lastName: last })
    .onConflictDoUpdate({
      target: marketplaceProfiles.userId,
      set: { firstName: first, lastName: last, updatedAt: new Date() },
    });
  revalidatePath("/ayarlar");
  return { ok: true as const };
}

export async function savePhone(raw: string) {
  const user = await requireUserId();
  if (!user) return { error: "Giriş yap." };
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  if (!/^5\d{9}$/.test(digits)) {
    return { error: "Cep telefonu 5 ile başlayan 10 hane olmalı." };
  }
  await db
    .update(users)
    .set({ phone: `+90${digits}`, updated_at: new Date() })
    .where(eq(users.id, user.id));
  revalidatePath("/ayarlar");
  return { ok: true as const };
}

export async function saveEmail(email: string) {
  const user = await requireUserId();
  if (!user) return { error: "Giriş yap." };
  const next = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next) || next.length > 200) {
    return { error: "Geçerli bir e-posta yaz." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: next });
  if (error) return { error: "E-posta güncellenemedi. Biraz sonra tekrar dene." };
  await db.update(users).set({ email: next, updated_at: new Date() }).where(eq(users.id, user.id));
  revalidatePath("/ayarlar");
  return { ok: true as const, message: "E-posta kaydedildi. Gerekirse gelen kutundaki doğrulamayı tamamla." };
}

export async function saveLocation(input: {
  provinceId: number;
  districtId: number;
  neighborhood: string;
}) {
  const user = await requireUserId();
  if (!user) return { error: "Giriş yap." };
  const province = findProvince(input.provinceId);
  const district = province?.districts.find((item) => item.id === input.districtId);
  if (!province || !district) return { error: "İl ve ilçe seç." };
  const neighborhoods = getNeighborhoods(province.id, district.id);
  const neighborhood = input.neighborhood.trim();
  if (!neighborhood) return { error: "Mahalle seç." };
  if (neighborhoods.length > 0 && !neighborhoods.includes(neighborhood)) {
    return { error: "Mahalle listeden seçilmeli." };
  }
  await db
    .insert(marketplaceProfiles)
    .values({
      userId: user.id,
      city: province.name,
      district: district.name,
      neighborhood,
    })
    .onConflictDoUpdate({
      target: marketplaceProfiles.userId,
      set: {
        city: province.name,
        district: district.name,
        neighborhood,
        updatedAt: new Date(),
      },
    });
  revalidatePath("/ayarlar");
  return { ok: true as const };
}

export async function lookupNeighborhoods(provinceId: number, districtId: number) {
  return getNeighborhoods(provinceId, districtId);
}

export async function saveLocationFromCoords(lat: number, lon: number): Promise<{
  provinceId: number | null;
  districtId: number | null;
  neighborhood: string;
  error?: string;
}> {
  const empty = { provinceId: null, districtId: null, neighborhood: "" };
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ...empty, error: "Konum okunamadı." };
  }
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("accept-language", "tr");
  url.searchParams.set("addressdetails", "1");
  let address: Record<string, string> = {};
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "sukull-marketplace/1.0 (https://sukull.com)", Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return { ...empty, error: "Konum eşleştirilemedi. Listeden seç." };
    const payload = (await response.json()) as { address?: Record<string, string> };
    address = payload.address ?? {};
  } catch {
    return { ...empty, error: "Konum eşleştirilemedi. Listeden seç." };
  }

  const provinces = getProvinces();
  const province = matchPlaceName(provinces, address.province || address.state || address.city);
  if (!province) return { ...empty, error: "İl bulunamadı. Listeden seç." };
  const district = matchPlaceName(
    province.districts,
    address.town || address.city_district || address.county || address.suburb || address.municipality,
  );
  if (!district) {
    return {
      provinceId: province.id,
      districtId: null,
      neighborhood: "",
      error: "İlçe otomatik seçilemedi. Listeden tamamla.",
    };
  }
  const neighborhoods = getNeighborhoods(province.id, district.id);
  const rawNeighborhood = address.neighbourhood || address.quarter || address.suburb || "";
  const neighborhood =
    neighborhoods.find((name) => name.toLocaleLowerCase("tr-TR") === rawNeighborhood.toLocaleLowerCase("tr-TR"))
    ?? neighborhoods.find((name) =>
      rawNeighborhood && name.toLocaleLowerCase("tr-TR").includes(rawNeighborhood.toLocaleLowerCase("tr-TR")),
    )
    ?? "";

  return {
    provinceId: province.id,
    districtId: district.id,
    neighborhood,
  };
}

export async function changePassword(currentPassword: string, nextPassword: string) {
  const user = await requireUserId();
  if (!user?.email) return { error: "Giriş yap." };
  if ((user.app_metadata?.provider as string | undefined) === "google") {
    return { error: "Bu hesap Google ile açılmış. Şifre buradan değiştirilemez." };
  }
  if (nextPassword.length < 8) return { error: "Yeni şifre en az 8 karakter olmalı." };
  const supabase = await createClient();
  const signed = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signed.error) return { error: "Mevcut şifre doğru değil." };
  const updated = await supabase.auth.updateUser({ password: nextPassword });
  if (updated.error) return { error: "Şifre güncellenemedi." };
  return { ok: true as const };
}

export async function uploadAvatar(formData: FormData) {
  const user = await requireUserId();
  if (!user) return { error: "Giriş yap." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Bir fotoğraf seç." };
  if (file.size > 900 * 1024) return { error: "Fotoğraf çok büyük. Başka bir fotoğraf dene." };
  if (!file.type.startsWith("image/")) return { error: "Yalnızca fotoğraf yükleyebilirsin." };

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${user.id}/avatar.${ext}`;
  const supabase = await createClient();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const uploaded = await supabase.storage.from("avatars").upload(path, bytes, {
    contentType: file.type,
    upsert: true,
  });
  if (uploaded.error) return { error: "Fotoğraf yüklenemedi. Tekrar dene." };

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = `${data.publicUrl}?v=${Date.now()}`;
  await db.update(users).set({ avatar: url, updated_at: new Date() }).where(eq(users.id, user.id));
  await db.update(userProgress).set({ userImageSrc: url }).where(eq(userProgress.userId, user.id));
  revalidatePath("/ayarlar");
  revalidatePath("/islerim");
  return { ok: true as const, url };
}

export async function saveProviderServices(entries: ProviderServiceEntry[]) {
  const user = await requireUserId();
  if (!user) return { error: "Giriş yap." };
  if (!Array.isArray(entries)) return { error: "Geçersiz hizmet listesi." };
  const bySlug = new Map<string, ProviderServiceEntry>();
  for (const entry of entries) {
    const slug = typeof entry?.slug === "string" ? entry.slug.trim() : "";
    if (!getService(slug) || bySlug.has(slug)) continue;
    bySlug.set(slug, { slug, filters: cleanFilters(slug, entry.filters) });
  }
  const unique = Array.from(bySlug.values());
  if (unique.length > 40) return { error: "En fazla 40 hizmet ekleyebilirsin." };

  await db.transaction(async (tx) => {
    await tx.delete(providerServices).where(eq(providerServices.userId, user.id));
    if (unique.length > 0) {
      await tx
        .insert(providerServices)
        .values(unique.map((entry) => ({ userId: user.id, serviceSlug: entry.slug, filters: entry.filters })));
    }
  });
  return { ok: true as const };
}
