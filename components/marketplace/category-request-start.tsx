"use client";

import { useState } from "react";

import { RequestWizard } from "@/components/marketplace/request-wizard";
import type { Province } from "@/lib/marketplace/address";

export function CategoryRequestStart({
  categoryName,
  services,
  provinces,
  email,
  phone,
}: {
  categoryName: string;
  services: { slug: string; name: string }[];
  provinces: Province[];
  email: string;
  phone: string;
}) {
  const [slug, setSlug] = useState<string | null>(null);
  if (slug) {
    return (
      <div className="space-y-4">
        <button type="button" className="text-sm font-bold text-suk-brand" onClick={() => setSlug(null)}>
          ← {categoryName}
        </button>
        <RequestWizard slug={slug} provinces={provinces} email={email} phone={phone} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
      <div>
        <p className="text-sm font-bold text-suk-brand">Talep</p>
        <h1 className="mt-1 text-2xl font-extrabold">{categoryName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Önce hizmeti seç, sonra sorular gelsin.</p>
      </div>
      <ul className="space-y-2">
        {services.map((service) => (
          <li key={service.slug}>
            <button
              type="button"
              className="mk-card-press flex min-h-14 items-center justify-between px-4 py-4"
              onClick={() => setSlug(service.slug)}
            >
              <span className="font-semibold">{service.name}</span>
              <span className="text-sm font-bold text-suk-brand">Devam</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
