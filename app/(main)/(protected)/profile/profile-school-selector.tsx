"use client";

import React, { useState } from "react";

type School = { id: number; name: string; type: string };

type ProfileSchoolSelectorProps = {
  schools: School[];
  disabled?: boolean;
  initialSchoolId?: number | null;
  onSelect: (schoolId: number) => void;
};

export const ProfileSchoolSelector = ({
  schools,
  disabled = false,
  initialSchoolId = null,
  onSelect,
}: ProfileSchoolSelectorProps) => {
  const [selectedType, setSelectedType] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(
    initialSchoolId
  );

  // Filter logic
  const filteredSchools = schools
    .filter((school) => (selectedType ? school.type === selectedType : true))
    .filter((school) =>
      school.name
        .toLocaleLowerCase("tr")
        .includes(searchQuery.toLocaleLowerCase("tr"))
    );

  const onTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedType(event.target.value);
    setSearchQuery(""); // Reset search query when changing type
  };

  const handleSchoolClick = (schoolId: number) => {
    if (disabled) return;
    setSelectedSchoolId(schoolId);
    onSelect(schoolId); 
  };

  return (
    <div
      className={`rounded-lg border border-gray-200 p-4 bg-gray-50 shadow-sm ${
        disabled ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      <h2 className="text-lg font-semibold text-neutral-800 mb-4">
        Okulunu Seç
      </h2>

      {/* School Type Dropdown */}
      <select
        onChange={onTypeChange}
        value={selectedType}
        disabled={disabled}
        className="w-full p-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
      >
        <option value="">Okul Tipini Seç</option>
        <option value="university">Üniversite</option>
        <option value="high_school">Lise</option>
        <option value="secondary_school">Ortaokul</option>
        <option value="elementary_school">İlkokul</option>
      </select>

      {/* Search Bar */}
      {selectedType && (
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Okul ismine göre ara..."
          disabled={disabled}
          className="w-full p-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
        />
      )}

      {/* School List with Custom Scrollbar */}
      {selectedType && (
        <div className="max-h-64 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pr-2
          scrollbar-thin scrollbar-thumb-lime-500 scrollbar-track-gray-200"
        >
          {filteredSchools.map((school) => (
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
          ))}
        </div>
      )}
    </div>
  );
};
