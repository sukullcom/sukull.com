"use client";

import React, { useState, useEffect, useCallback } from "react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { clientLogger } from "@/lib/client-logger";

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

type ProfileSchoolSelectorProps = {
  schools: School[]; // Not used anymore, but kept for compatibility
  initialSchoolId?: number | null;
  onSelect: (schoolId: number) => void;
  /** Politika veya istikrar kilidi — seçim yapılamaz (toast yerine UI kilitli). */
  disabled?: boolean;
};

export const ProfileSchoolSelector = ({
  initialSchoolId = null,
  onSelect,
  disabled = false,
}: ProfileSchoolSelectorProps) => {
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(initialSchoolId);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cities on component mount
  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/schools/filtered?step=cities');
      if (!response.ok) throw new Error('Şehirler yüklenemedi');
      const data = await response.json();
      setCities(data.cities || []);
    } catch (err) {
      setError('Şehirler yüklenirken hata oluştu');
      clientLogger.error({ message: 'load cities failed', error: err, location: 'profile/profile-school-selector' });
    } finally {
      setLoading(false);
    }
  };

  const loadDistricts = async (city: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/schools/filtered?step=districts&city=${encodeURIComponent(city)}`);
      if (!response.ok) throw new Error('İlçeler yüklenemedi');
      const data = await response.json();
      setDistricts(data.districts || []);
    } catch (err) {
      setError('İlçeler yüklenirken hata oluştu');
      clientLogger.error({ message: 'load districts failed', error: err, location: 'profile/profile-school-selector' });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async (city: string, district: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/schools/filtered?step=categories&city=${encodeURIComponent(city)}&district=${encodeURIComponent(district)}`
      );
      if (!response.ok) throw new Error('Kategoriler yüklenemedi');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      setError('Kategoriler yüklenirken hata oluştu');
      clientLogger.error({ message: 'load categories failed', error: err, location: 'profile/profile-school-selector' });
    } finally {
      setLoading(false);
    }
  };

  const loadSchools = async (city: string, district: string, category: string) => {
    try {
      setLoading(true);
      setError(null);
      const url = new URL('/api/schools/filtered', window.location.origin);
      url.searchParams.set('step', 'schools');
      url.searchParams.set('city', city);
      url.searchParams.set('district', district);
      url.searchParams.set('category', category);

      const response = await fetch(url);
      if (!response.ok) throw new Error('Okullar yüklenemedi');
      const data = await response.json();
      setSchools(data.schools || []);
    } catch (err) {
      setError('Okullar yüklenirken hata oluştu');
      clientLogger.error({ message: 'load schools failed', error: err, location: 'profile/profile-school-selector' });
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = useCallback(async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const city = event.target.value;
    setSelectedCity(city);
    setSelectedDistrict("");
    setSelectedCategory("");
    setDistricts([]);
    setCategories([]);
    setSchools([]);
    setSelectedSchoolId(null);

    if (city) {
      await loadDistricts(city);
    }
  }, []);

  const handleDistrictChange = useCallback(async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const district = event.target.value;
    setSelectedDistrict(district);
    setSelectedCategory("");
    setCategories([]);
    setSchools([]);
    setSelectedSchoolId(null);

    if (district && selectedCity) {
      await loadCategories(selectedCity, district);
    }
  }, [selectedCity]);

  const handleCategoryChange = useCallback(async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const category = event.target.value;
    setSelectedCategory(category);
    setSchools([]);
    setSelectedSchoolId(null);

    if (category && selectedCity && selectedDistrict) {
      await loadSchools(selectedCity, selectedDistrict, category);
    }
  }, [selectedCity, selectedDistrict]);



  const handleSchoolClick = useCallback(
    (schoolId: number) => {
      if (disabled) return;
      setSelectedSchoolId(schoolId);
      onSelect(schoolId);
    },
    [disabled, onSelect],
  );

  const selectBusy = loading || disabled;

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'Primary School': return 'İlkokul';
      case 'Secondary School': return 'Ortaokul';
      case 'High School': return 'Lise';
      case 'University': return 'Üniversite';
      default: return category;
    }
  };

  return (
    <div
      className={`rounded-lg border border-border bg-muted/40 p-4 shadow-sm ${disabled ? "opacity-60" : ""}`}
      aria-disabled={disabled}
    >
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        Okulunu Seç
      </h2>

      {error && (
        <div className="mb-4 rounded border border-suk-danger/25 bg-suk-danger-soft p-2 text-suk-danger">
          {error}
        </div>
      )}

      {/* Step 1: City Selection */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-muted-foreground">
          1. Şehir Seç
        </label>
        <select
          value={selectedCity}
          onChange={handleCityChange}
          disabled={selectBusy}
          className="w-full rounded-lg border border-input bg-background p-2 focus:outline-none focus:ring-2 focus:ring-suk-brand/25 disabled:cursor-not-allowed disabled:bg-muted"
        >
          <option value="">Şehir seçin...</option>
          {cities.map((city) => (
            <option key={city.city} value={city.city}>
              {city.city}
            </option>
          ))}
        </select>
      </div>

      {/* Step 2: District Selection */}
      {selectedCity && (
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            2. İlçe Seç (Üniversite için Kampüs seçeneğini seçiniz)
          </label>
      <select
            value={selectedDistrict}
            onChange={handleDistrictChange}
            disabled={selectBusy}
            className="w-full rounded-lg border border-input bg-background p-2 focus:outline-none focus:ring-2 focus:ring-suk-brand/25 disabled:cursor-not-allowed disabled:bg-muted"
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

      {/* Step 3: Category Selection */}
      {selectedDistrict && (
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            3. Okul Türü Seç
          </label>
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            disabled={selectBusy}
            className="w-full rounded-lg border border-input bg-background p-2 focus:outline-none focus:ring-2 focus:ring-suk-brand/25 disabled:cursor-not-allowed disabled:bg-muted"
          >
            <option value="">Okul türü seçin...</option>
            {categories.map((category) => (
              <option key={`${category.category}-${category.type}`} value={category.category}>
                {getCategoryLabel(category.category)}
              </option>
            ))}
          </select>
        </div>
      )}

             {/* Step 4: School Selection */}
       {selectedCategory && (
         <div className="space-y-2">
           <div className="text-sm font-medium text-foreground">
             Okullar:
           </div>
           
           {loading ? (
             <LoadingSpinner size="sm" />
           ) : schools.length === 0 ? (
             <div className="p-4 text-center text-muted-foreground">
               Aradığınız kriterlere uygun okul bulunamadı.
             </div>
           ) : (
             <div className="max-h-64 overflow-y-auto space-y-2">
               {schools.map((school) => (
              <div
                key={school.id}
                role="button"
                tabIndex={disabled ? -1 : 0}
                onClick={() => handleSchoolClick(school.id)}
                   className={`rounded-lg border p-3 transition-colors ${
                  disabled
                    ? `cursor-not-allowed border-border ${
                        selectedSchoolId === school.id ? "border-suk-brand/50 bg-suk-brand-soft/60" : "bg-muted/80"
                      }`
                    : selectedSchoolId === school.id
                      ? "cursor-pointer border-suk-brand bg-suk-brand-soft"
                      : "cursor-pointer border-border hover:bg-muted"
                }`}
              >
                   <p className={`font-medium ${
                     selectedSchoolId === school.id ? "text-suk-brand" : "text-foreground"
                   }`}>
                  {school.name}
                </p>
              </div>
               ))}
        </div>
      )}
      
           {schools.length > 0 && (
             <div className="mt-2 text-right text-xs text-muted-foreground">
               Bu filtreye uyan {schools.length} okul listeleniyor
             </div>
           )}
        </div>
      )}
    </div>
  );
};
