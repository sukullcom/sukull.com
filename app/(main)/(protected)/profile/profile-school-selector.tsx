"use client";

import React, { useState, useEffect, useCallback } from "react";
import { LoadingSpinner } from "@/components/loading-spinner";

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
};

export const ProfileSchoolSelector = ({
  initialSchoolId = null,
  onSelect,
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
      console.error('Error loading cities:', err);
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
      console.error('Error loading districts:', err);
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
      console.error('Error loading categories:', err);
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
      console.error('Error loading schools:', err);
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



  const handleSchoolClick = useCallback((schoolId: number) => {
    setSelectedSchoolId(schoolId);
    onSelect(schoolId);
  }, [onSelect]);

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
    <div className="rounded-lg border border-gray-200 p-4 shadow-sm bg-gray-50">
      <h2 className="text-lg font-semibold mb-4 text-neutral-800">
        Okulunu Seç
      </h2>

      {error && (
        <div className="mb-4 p-2 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Step 1: City Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          1. Şehir Seç
        </label>
        <select
          value={selectedCity}
          onChange={handleCityChange}
          disabled={loading}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 disabled:bg-gray-100"
        >
          <option value="">Şehir seçin...</option>
          {cities.map((city) => (
            <option key={city.city} value={city.city}>
              {city.city} ({city.count} okul)
            </option>
          ))}
        </select>
      </div>

      {/* Step 2: District Selection */}
      {selectedCity && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            2. İlçe Seç (Üniversite için Kampüs seçeneğini seçiniz)
          </label>
      <select
            value={selectedDistrict}
            onChange={handleDistrictChange}
            disabled={loading}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 disabled:bg-gray-100"
      >
            <option value="">İlçe seçin...</option>
            {districts.map((district) => (
              <option key={district.district} value={district.district}>
                {district.district} ({district.count} okul)
          </option>
        ))}
      </select>
        </div>
      )}

      {/* Step 3: Category Selection */}
      {selectedDistrict && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            3. Okul Türü Seç
          </label>
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            disabled={loading}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 disabled:bg-gray-100"
          >
            <option value="">Okul türü seçin...</option>
            {categories.map((category) => (
              <option key={`${category.category}-${category.type}`} value={category.category}>
                {getCategoryLabel(category.category)} ({category.count} okul)
              </option>
            ))}
          </select>
        </div>
      )}

             {/* Step 4: School Selection */}
       {selectedCategory && (
         <div className="space-y-2">
           <div className="text-sm font-medium text-gray-700">
             Okullar:
           </div>
           
           {loading ? (
             <LoadingSpinner size="sm" />
           ) : schools.length === 0 ? (
             <div className="text-center p-4 text-gray-500">
               Aradığınız kriterlere uygun okul bulunamadı.
             </div>
           ) : (
             <div className="max-h-64 overflow-y-auto space-y-2">
               {schools.map((school) => (
              <div
                key={school.id}
                onClick={() => handleSchoolClick(school.id)}
                   className={`border p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedSchoolId === school.id
                    ? "bg-green-50 border-green-600"
                       : "hover:bg-gray-100 border-gray-200"
                }`}
              >
                   <p className={`font-medium ${
                     selectedSchoolId === school.id ? "text-green-600" : "text-neutral-800"
                   }`}>
                  {school.name}
                </p>
              </div>
               ))}
        </div>
      )}
      
           {schools.length > 0 && (
             <div className="text-xs text-right text-gray-500 mt-2">
               {schools.length} okul gösteriliyor
             </div>
           )}
        </div>
      )}
    </div>
  );
};
