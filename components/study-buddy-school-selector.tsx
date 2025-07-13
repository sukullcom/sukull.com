"use client";

import React, { useState, useEffect, useCallback } from "react";

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
      setShowSchools(true);
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
    <div className={`space-y-3 ${className}`}>
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {/* City Selection */}
      <div>
        <select
          value={selectedCity}
          onChange={handleCityChange}
          disabled={loading}
          className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-green-500 focus:outline-none disabled:bg-gray-100"
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
            className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-green-500 focus:outline-none disabled:bg-gray-100"
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
            className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-green-500 focus:outline-none disabled:bg-gray-100"
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

      {/* Schools List */}
      {showSchools && schools.length > 0 && (
        <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-3 bg-gray-50">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Okullar ({schools.length} okul):
          </div>
          {schools.map((school) => (
            <div
              key={school.id}
              onClick={() => handleSchoolSelect(school.id)}
              className={`p-2 rounded cursor-pointer transition-colors text-sm ${
                selectedSchoolId === school.id
                  ? "bg-green-500 text-white"
                  : "bg-white hover:bg-green-50 border"
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
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Filtreyi temizle
        </button>
      )}
    </div>
  );
}; 