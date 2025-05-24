"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";

type School = { id: number; name: string; type: string };

type ProfileSchoolSelectorProps = {
  schools: School[];
  initialSchoolId?: number | null;
  onSelect: (schoolId: number) => void;
};

// School type options - constant to avoid recreation
const SCHOOL_TYPES = [
  { value: "", label: "Okul Tipini Seç" },
  { value: "university", label: "Üniversite" },
  { value: "high_school", label: "Lise" },
  { value: "secondary_school", label: "Ortaokul" },
  { value: "elementary_school", label: "İlkokul" },
];

export const ProfileSchoolSelector = ({
  schools,
  initialSchoolId = null,
  onSelect,
}: ProfileSchoolSelectorProps) => {
  const [selectedType, setSelectedType] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(
    initialSchoolId
  );

  // Debounce search query for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Memoize filtered schools to avoid recomputation on each render
  const filteredSchools = useMemo(() => {
    return schools
      .filter((school) => (selectedType ? school.type === selectedType : true))
      .filter((school) =>
        school.name
          .toLocaleLowerCase("tr")
          .includes(debouncedQuery.toLocaleLowerCase("tr"))
      );
  }, [schools, selectedType, debouncedQuery]);

  // Memoize event handlers
  const onTypeChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = event.target.value;
    setSelectedType(newType);
    setSearchQuery(""); // Reset search query when changing type
    setDebouncedQuery(""); // Also reset debounced query
  }, []);

  const handleSchoolClick = useCallback((schoolId: number) => {
    setSelectedSchoolId(schoolId);
    onSelect(schoolId);
  }, [onSelect]);

  // Calculate if we should show the empty message
  const showEmptyMessage = selectedType && filteredSchools.length === 0;

  return (
    <div className="rounded-lg border border-gray-200 p-4 bg-gray-50 shadow-sm">
      <h2 className="text-lg font-semibold text-neutral-800 mb-4">
        Okulunu Seç
      </h2>

      {/* School Type Dropdown */}
      <select
        onChange={onTypeChange}
        value={selectedType}
        className="w-full p-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
      >
        {SCHOOL_TYPES.map(type => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>

      {/* Search Bar */}
      {selectedType && (
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Okul ismine göre ara..."
          className="w-full p-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
        />
      )}

      {/* School List with Custom Scrollbar */}
      {selectedType && (
        <div className="max-h-64 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pr-2
          scrollbar-thin scrollbar-thumb-lime-500 scrollbar-track-gray-200"
        >
          {showEmptyMessage ? (
            <div className="col-span-2 text-center p-4 text-gray-500">
              Aramanızla eşleşen okul bulunamadı
            </div>
          ) : (
            filteredSchools.map((school) => (
              <div
                key={school.id}
                onClick={() => handleSchoolClick(school.id)}
                className={`border p-2 rounded-lg cursor-pointer text-center ${
                  selectedSchoolId === school.id
                    ? "bg-green-50 border-green-600"
                    : "hover:bg-gray-100"
                }`}
              >
                <p
                  className={`font-medium ${
                    selectedSchoolId === school.id
                      ? "text-green-600"
                      : "text-neutral-800"
                  }`}
                >
                  {school.name}
                </p>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* School count info */}
      {selectedType && filteredSchools.length > 0 && (
        <div className="mt-2 text-xs text-gray-500 text-right">
          {filteredSchools.length} okul gösteriliyor
        </div>
      )}
    </div>
  );
};
