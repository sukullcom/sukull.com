"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  changePassword,
  saveDisplayName,
  saveEmail,
  saveLocation,
  savePhone,
} from "@/actions/marketplace-account";
import { LocationFields } from "@/components/marketplace/location-fields";
import { Button } from "@/components/ui/button";
import type { Province } from "@/lib/marketplace/address";

const fieldClass = "mk-input mt-1";

export function NameForm({ firstName, lastName }: { firstName: string; lastName: string }) {
  const router = useRouter();
  const [first, setFirst] = useState(firstName);
  const [last, setLast] = useState(lastName);
  const [pending, setPending] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        const result = await saveDisplayName(first, last);
        setPending(false);
        if ("error" in result && result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Kaydedildi");
        router.push("/ayarlar/profil");
        router.refresh();
      }}
    >
      <label className="block text-sm font-semibold">
        İsim
        <input className={fieldClass} value={first} onChange={(event) => setFirst(event.target.value)} />
      </label>
      <label className="block text-sm font-semibold">
        Soyisim
        <input className={fieldClass} value={last} onChange={(event) => setLast(event.target.value)} />
      </label>
      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        Kaydet
      </Button>
    </form>
  );
}

export function EmailForm({ email }: { email: string }) {
  const router = useRouter();
  const [value, setValue] = useState(email);
  const [pending, setPending] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        const result = await saveEmail(value);
        setPending(false);
        if ("error" in result && result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("message" in result && result.message ? result.message : "Kaydedildi");
        router.refresh();
      }}
    >
      <label className="block text-sm font-semibold">
        E-posta
        <input type="email" className={fieldClass} value={value} onChange={(event) => setValue(event.target.value)} />
      </label>
      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        Kaydet
      </Button>
    </form>
  );
}

export function PhoneForm({ phone }: { phone: string }) {
  const router = useRouter();
  const local = phone.replace(/^\+90/, "");
  const [value, setValue] = useState(local);
  const [pending, setPending] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        const result = await savePhone(value);
        setPending(false);
        if ("error" in result && result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Kaydedildi");
        router.refresh();
      }}
    >
      <label className="block text-sm font-semibold">
        Cep telefonu
        <div className="mt-1 flex gap-2">
          <span className="inline-flex items-center rounded-xl border-2 border-border bg-muted px-3 font-semibold">
            +90
          </span>
          <input
            inputMode="numeric"
            maxLength={10}
            className="mk-input"
            value={value}
            onChange={(event) => setValue(event.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="5xxxxxxxxx"
          />
        </div>
      </label>
      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        Kaydet
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        const result = await changePassword(current, next);
        setPending(false);
        if ("error" in result && result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Şifre güncellendi");
        setCurrent("");
        setNext("");
      }}
    >
      <label className="block text-sm font-semibold">
        Mevcut şifre
        <input type="password" className={fieldClass} value={current} onChange={(event) => setCurrent(event.target.value)} />
      </label>
      <label className="block text-sm font-semibold">
        Yeni şifre
        <input type="password" className={fieldClass} value={next} onChange={(event) => setNext(event.target.value)} />
      </label>
      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        Kaydet
      </Button>
    </form>
  );
}

export function LocationForm({
  provinces,
  provinceId,
  districtId,
  neighborhood,
}: {
  provinces: Province[];
  provinceId: number | null;
  districtId: number | null;
  neighborhood: string;
}) {
  const router = useRouter();
  const [place, setPlace] = useState({ provinceId, districtId, neighborhood });
  const [pending, setPending] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!place.provinceId || !place.districtId) {
          toast.error("İl ve ilçe seç.");
          return;
        }
        setPending(true);
        const result = await saveLocation({
          provinceId: place.provinceId,
          districtId: place.districtId,
          neighborhood: place.neighborhood,
        });
        setPending(false);
        if ("error" in result && result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Konum kaydedildi");
        router.refresh();
      }}
    >
      <LocationFields provinces={provinces} {...place} onChange={setPlace} showGeo />
      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        Kaydet
      </Button>
    </form>
  );
}
