"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { createCustomService, deleteCustomService } from "@/actions/admin-custom-services";
import { Button } from "@/components/ui/button";

type Row = {
  slug: string;
  name: string;
  categoryName: string;
  anywhere: boolean;
};

export function CustomServiceManager({
  categories,
  rows,
}: {
  categories: { slug: string; name: string }[];
  rows: Row[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setPending(true);
    const result = await createCustomService({
      name: String(formData.get("name") ?? ""),
      categorySlug: String(formData.get("category") ?? ""),
      aliases: String(formData.get("aliases") ?? ""),
      prompt: String(formData.get("prompt") ?? ""),
      options: String(formData.get("options") ?? ""),
      variant: formData.get("variant") === "on",
      anywhere: formData.get("anywhere") === "on",
    });
    setPending(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Hizmet eklendi. Arama, talep ve Hizmetlerim'de görünür.");
    router.refresh();
    return true;
  }

  async function remove(slug: string, name: string) {
    if (!window.confirm(`${name} silinsin mi?`)) return;
    setRemoving(slug);
    const result = await deleteCustomService(slug);
    setRemoving(null);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Hizmet silindi.");
    router.refresh();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form
        className="space-y-3 rounded-xl border bg-white p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const ok = await onSubmit(new FormData(form));
          if (ok) form.reset();
        }}
      >
        <h2 className="text-sm font-semibold text-gray-900">Yeni hizmet</h2>
        <label className="block text-xs font-medium text-gray-600">
          Ad
          <input name="name" required maxLength={60} placeholder="Duvar resmi" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
        </label>
        <label className="block text-xs font-medium text-gray-600">
          Kategori
          <select name="category" required className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" defaultValue="">
            <option value="" disabled>
              Seç
            </option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-gray-600">
          Arama kelimeleri
          <input name="aliases" placeholder="mural, duvar boyama" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
        </label>
        <label className="block text-xs font-medium text-gray-600">
          Soru
          <input name="prompt" placeholder="Ne tür resim?" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
        </label>
        <label className="block text-xs font-medium text-gray-600">
          Seçenekler (satır satır, en az iki)
          <textarea name="options" rows={5} placeholder={"Tek duvar\nTüm oda"} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-700">
          <input name="variant" type="checkbox" />
          Hizmet veren bu seçeneklerden seçebilsin
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-700">
          <input name="anywhere" type="checkbox" />
          Her şehirden görünsün (uzaktan veya şehirler arası)
        </label>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ekle"}
        </Button>
      </form>

      <section className="rounded-xl border bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900">Senin eklediklerin</h2>
        {rows.length === 0 ? (
          <p className="mt-3 text-xs text-gray-500">Henüz ek hizmet yok. Katalogdaki hizmetler burada durmaz.</p>
        ) : (
          <ul className="mt-3 divide-y">
            {rows.map((row) => (
              <li key={row.slug} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{row.name}</p>
                  <p className="text-xs text-gray-500">
                    {row.categoryName}
                    {row.anywhere ? " · her şehir" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-700"
                  aria-label={`${row.name} sil`}
                  disabled={removing === row.slug}
                  onClick={() => remove(row.slug, row.name)}
                >
                  {removing === row.slug ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
