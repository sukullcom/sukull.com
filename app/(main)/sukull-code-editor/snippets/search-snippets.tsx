"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SearchSnippets() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSearch = () => {
    // Construct new query param
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search"); // remove old param
    if (searchTerm.trim() !== "") {
      params.set("search", searchTerm.trim());
    }
    const newQuery = params.toString();
    startTransition(() => {
      router.replace(`/snippets?${newQuery}`);
    });
  };

  return (
    <div className="mb-4 flex gap-2">
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search by title, language or user..."
        className="flex-1 px-4 py-2 rounded text-black"
      />
      <button
        onClick={handleSearch}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
      >
        Search
      </button>
    </div>
  );
}
