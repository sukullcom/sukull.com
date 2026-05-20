"use client";

import React, { useState, useEffect, useCallback } from "react";
import { clientLogger } from "@/lib/client-logger";
import { fetchSchoolCatalogJson } from "@/lib/fetch-school-catalog";
import { getSchoolCategoryLabel, sortSchoolCategories } from "@/lib/school-catalog";

type School = { 
  id: number; 
  name: string; 
  city: string;
  district: string;
  category: string;
  kind: string | null;
  type: string;
};

type City = { city: string; count: number };
type District = { district: string; count: number };
type Category = { category: string; type: string; count: number };

type StudyBuddySchoolSelectorProps = {
  onSchoolSelect: (schoolId: number | null) => void;
  selectedSchoolId?: number | null;
  className?: string;
};

export const StudyBuddySchoolSelector = ({
  onSchoolSelect,
  selectedSchoolId = null,
  className = "",
}: StudyBuddySchoolSelectorProps) => {
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showSchools, setShowSchools] = useState<boolean>(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cities on component mount
  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    setLoading(true);
    setError(null);
    const r = await fetchSchoolCatalogJson<{ cities: City[] }>(
      "/api/schools?action=cities",
      "Şehirler",
    );
    if (!r.ok) {
      setError(r.message);
      clientLogger.error({
        message: "load cities failed",
        location: "study-buddy-school-selector/loadCities",
        fields: { detail: r.message },
      });
    } else {
      setCities(r.data.cities || []);
    }
    setLoading(false);
  };

  const loadDistricts = async (city: string) => {
    setLoading(true);
    setError(null);
    const r = await fetchSchoolCatalogJson<{ districts: District[] }>(
      `/api/schools?action=districts&city=${encodeURIComponent(city)}`,
      "İlçeler",
    );
    if (!r.ok) {
      setError(r.message);
      clientLogger.error({
        message: "load districts failed",
        location: "study-buddy-school-selector/loadDistricts",
        fields: { detail: r.message },
      });
    } else {
      setDistricts(r.data.districts || []);
    }
    setLoading(false);
  };

  const loadCategories = async (city: string, district: string) => {
    setLoading(true);
    setError(null);
    const r = await fetchSchoolCatalogJson<{ categories: Category[] }>(
      `/api/schools?action=categories&city=${encodeURIComponent(city)}&district=${encodeURIComponent(district)}`,
      "Kategoriler",
    );
    if (!r.ok) {
      setError(r.message);
      clientLogger.error({
        message: "load categories failed",
        location: "study-buddy-school-selector/loadCategories",
        fields: { detail: r.message },
      });
    } else {
      setCategories(sortSchoolCategories(r.data.categories || []));
    }
    setLoading(false);
  };

  const loadSchools = async (city: string, district: string, category: string) => {
    setLoading(true);
    setError(null);
    const url = new URL("/api/schools", window.location.origin);
    url.searchParams.set("action", "schools");
    url.searchParams.set("city", city);
    url.searchParams.set("district", district);
    url.searchParams.set("category", category);
    const r = await fetchSchoolCatalogJson<{ schools: School[] }>(
      url.toString(),
      "Okullar",
    );
    if (!r.ok) {
      setError(r.message);
      clientLogger.error({
        message: "load schools failed",
        location: "study-buddy-school-selector/loadSchools",
        fields: { detail: r.message },
      });
    } else {
      setSchools(r.data.schools || []);
      setShowSchools(true);
    }
    setLoading(false);
  };

  const handleCityChange = useCallback(async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const city = event.target.value;
    setSelectedCity(city);
    setSelectedDistrict("");
    setSelectedCategory("");
    setDistricts([]);
    setCategories([]);
    setSchools([]);
    setShowSchools(false);
    onSchoolSelect(null);

    if (city) {
      await loadDistricts(city);
    }
  }, [onSchoolSelect]);

  const handleDistrictChange = useCallback(async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const district = event.target.value;
    setSelectedDistrict(district);
    setSelectedCategory("");
    setCategories([]);
    setSchools([]);
    setShowSchools(false);
    onSchoolSelect(null);

    if (district && selectedCity) {
      await loadCategories(selectedCity, district);
    }
  }, [selectedCity, onSchoolSelect]);

  const handleCategoryChange = useCallback(async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const category = event.target.value;
    setSelectedCategory(category);
    setSchools([]);
    setShowSchools(false);
    onSchoolSelect(null);

    if (category && selectedCity && selectedDistrict) {
      await loadSchools(selectedCity, selectedDistrict, category);
    }
  }, [selectedCity, selectedDistrict, onSchoolSelect]);

  const handleSchoolSelect = useCallback((schoolId: number) => {
    onSchoolSelect(schoolId);
    setShowSchools(false); // Hide schools after selection
  }, [onSchoolSelect]);

  const handleClearFilter = useCallback(() => {
    setSelectedCity("");
    setSelectedDistrict("");
    setSelectedCategory("");
    setDistricts([]);
    setCategories([]);
    setSchools([]);
    setShowSchools(false);
    onSchoolSelect(null);
  }, [onSchoolSelect]);

  return (
    <div className={`space-y-3 ${className}`}>
      {error && (
        <div className="rounded-md border border-suk-danger/20 bg-suk-danger-soft p-2 text-sm text-suk-danger">
          {error}
        </div>
      )}

      {/* City Selection */}
      <div>
        <select
          value={selectedCity}
          onChange={handleCityChange}
          disabled={loading}
          className="w-full rounded-xl border-2 border-border bg-background p-3 outline-none focus:border-suk-brand focus:ring-2 focus:ring-suk-brand/25 disabled:bg-muted"
        >
          <option value="">Şehir seçin...</option>
          {cities.map((city) => (
            <option key={city.city} value={city.city}>
              {city.city}
            </option>
          ))}
        </select>
      </div>

      {/* District Selection */}
      {selectedCity && (
        <div>
          <select
            value={selectedDistrict}
            onChange={handleDistrictChange}
            disabled={loading}
            className="w-full rounded-xl border-2 border-border bg-background p-3 outline-none focus:border-suk-brand focus:ring-2 focus:ring-suk-brand/25 disabled:bg-muted"
          >
            <option value="">İlçe seçin...</option>
            {districts.map((district) => (
              <option key={district.district} value={district.district}>
                {district.district}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Category Selection */}
      {selectedDistrict && (
        <div>
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            disabled={loading}
            className="w-full rounded-xl border-2 border-border bg-background p-3 outline-none focus:border-suk-brand focus:ring-2 focus:ring-suk-brand/25 disabled:bg-muted"
          >
            <option value="">Okul türü seçin...</option>
            {categories.map((category) => (
              <option key={`${category.category}-${category.type}`} value={category.category}>
                {getSchoolCategoryLabel(category.category)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Schools List */}
      {showSchools && schools.length > 0 && (
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border bg-muted/60 p-3">
          <div className="mb-2 text-sm font-medium text-foreground">
            Okullar ({schools.length} okul):
          </div>
          {schools.map((school) => (
            <div
              key={school.id}
              onClick={() => handleSchoolSelect(school.id)}
              className={`cursor-pointer rounded p-2 text-sm transition-colors ${
                selectedSchoolId === school.id
                  ? "bg-suk-brand text-suk-brand-fg"
                  : "border border-border bg-card hover:bg-suk-brand-soft"
              }`}
            >
              {school.name}
            </div>
          ))}
        </div>
      )}

      {/* Clear Filter Button */}
      {(selectedCity || selectedDistrict || selectedCategory) && (
        <button
          onClick={handleClearFilter}
          className="text-sm text-muted-foreground underline hover:text-foreground"
        >
          Filtreyi temizle
        </button>
      )}
    </div>
  );
}; 