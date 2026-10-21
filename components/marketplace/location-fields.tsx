"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { lookupNeighborhoods, saveLocationFromCoords } from "@/actions/marketplace-account";
import type { Province } from "@/lib/marketplace/address";

const fieldClass =
  "mk-input text-foreground";

export function LocationFields({
  provinces,
  provinceId,
  districtId,
  neighborhood,
  onChange,
  showGeo = false,
}: {
  provinces: Province[];
  provinceId: number | null;
  districtId: number | null;
  neighborhood: string;
  onChange: (next: { provinceId: number | null; districtId: number | null; neighborhood: string }) => void;
  showGeo?: boolean;
}) {
  const province = provinces.find((item) => item.id === provinceId) ?? null;
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!provinceId || !districtId) {
      setNeighborhoods([]);
      return;
    }
    let cancelled = false;
    lookupNeighborhoods(provinceId, districtId).then((rows) => {
      if (!cancelled) setNeighborhoods(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [provinceId, districtId]);

  async function useMyLocation() {
    if (!navigator.geolocation) {
      toast.error("Bu tarayıcı konum izni vermiyor. Listeden seç.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const result = await saveLocationFromCoords(position.coords.latitude, position.coords.longitude);
        setLocating(false);
        if (result.provinceId) {
          onChange({
            provinceId: result.provinceId,
            districtId: result.districtId,
            neighborhood: result.neighborhood,
          });
        }
        if (result.error) toast.error(result.error);
      },
      () => {
        setLocating(false);
        toast.error("Konum izni verilmedi. İl, ilçe ve mahalleyi listeden seç.");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  return (
    <div className="space-y-3">
      {showGeo && (
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="w-full rounded-xl border-2 border-b-4 border-suk-brand px-3 py-3 text-sm font-bold text-suk-brand transition-all active:translate-y-[2px] active:border-b-2 disabled:opacity-60"
        >
          {locating ? "Konum alınıyor…" : "Lokasyonumu kullan"}
        </button>
      )}
      <label className="block text-sm font-semibold text-foreground">
        İl
        <select
          className={`${fieldClass} mt-1`}
          value={provinceId ?? ""}
          onChange={(event) => {
            const next = Number(event.target.value) || null;
            onChange({ provinceId: next, districtId: null, neighborhood: "" });
          }}
        >
          <option value="">İl seç</option>
          {provinces.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold text-foreground">
        İlçe
        <select
          className={`${fieldClass} mt-1`}
          value={districtId ?? ""}
          disabled={!province}
          onChange={(event) => {
            const next = Number(event.target.value) || null;
            onChange({ provinceId, districtId: next, neighborhood: "" });
          }}
        >
          <option value="">İlçe seç</option>
          {province?.districts.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold text-foreground">
        Mahalle
        <select
          className={`${fieldClass} mt-1`}
          value={neighborhood}
          disabled={!districtId}
          onChange={(event) => onChange({ provinceId, districtId, neighborhood: event.target.value })}
        >
          <option value="">Mahalle seç</option>
          {neighborhood && !neighborhoods.includes(neighborhood) && (
            <option value={neighborhood}>{neighborhood}</option>
          )}
          {neighborhoods.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
