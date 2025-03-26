"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Code,
  Grid,
  Layers,
  Search as SearchIcon,
  Tag,
  X,
} from "lucide-react";
import SnippetCard from "@/components/snippets-card"; // Aşağıda corners rounded yapacağız
import Image from "next/image";

type Snippet = {
  id: number;
  userId: string;
  userName: string;
  title: string;
  description: string;
  language: string;
  createdAt: string;
};

export default function SnippetsPage() {
  const [snippets, setSnippets] = useState<Snippet[] | null>(null);
  const [loading, setLoading] = useState(true);

  // search + language filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  // grid or list view
  const [view, setView] = useState<"grid" | "list">("grid");

  // 1) Fetch snippets
  useEffect(() => {
    let isCancelled = false;

    async function loadSnippets() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim() !== "") {
          params.set("search", searchQuery.trim());
        }
        const res = await fetch(`/api/snippets?${params.toString()}`);
        const data = await res.json();
        if (!isCancelled) {
          setSnippets(data);
        }
      } catch (error) {
        console.error("Error fetching snippets:", error);
        if (!isCancelled) {
          setSnippets([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadSnippets();
    return () => {
      isCancelled = true;
    };
  }, [searchQuery]);

  // 2) languages
  const languages = snippets
    ? Array.from(new Set(snippets.map((s) => s.language)))
    : [];
  const popularLanguages = languages.slice(0, 5);

  const filteredSnippets = (snippets || []).filter((snippet) => {
    if (selectedLanguage && snippet.language !== selectedLanguage) {
      return false;
    }
    return true;
  });

  return (
    <div className="rounded-2xl min-h-screen bg-[#111827] text-sm sm:text-base p-2 mx-2 mb-4 border-2 border-gray-400 ">
      <div className="relative max-w-7xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 px-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
              bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-sm text-gray-400 mb-4 sm:mb-6"
          >
            <BookOpen className="w-4 h-4" />
            Sukull Kod Kütüphanesi
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold 
              bg-gradient-to-r from-gray-100 to-gray-300 text-transparent bg-clip-text mb-4 sm:mb-6"
          >
            Keşfet &amp; Paylaş
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 mb-6 sm:mb-8 px-2"
          >
            Sukull topluluğu tarafından derlenmiş kod koleksiyonunu keşfedin
          </motion.p>
        </div>

        {/* Filters Section */}
        <div className="relative max-w-5xl mx-auto mb-8 sm:mb-12 space-y-6">
          {/* Search */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <div className="relative flex items-center">
              <SearchIcon className="absolute left-4 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kodları başlık, dil veya yazarına göre arayın..."
                className="w-full pl-12 pr-4 py-3 sm:py-4 bg-[#1e1e2e]/80 hover:bg-[#1e1e2e] text-white
                  rounded-xl border border-[#313244] hover:border-[#414155] transition-all duration-200
                  placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1e1e2e] rounded-lg ring-1 ring-gray-800">
              <Tag className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Diller:</span>
            </div>

            {popularLanguages.map((lang) => (
              <button
                key={lang}
                onClick={() =>
                  setSelectedLanguage(lang === selectedLanguage ? null : lang)
                }
                className={`
                  group relative px-3 py-1.5 rounded-lg transition-all duration-200
                  ${
                    selectedLanguage === lang
                      ? "text-blue-400 bg-blue-500/10 ring-2 ring-blue-500/50"
                      : "text-gray-400 hover:text-gray-300 bg-[#1e1e2e] hover:bg-[#262637] ring-1 ring-gray-800"
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <Image
                    src={`/language_logos/${lang}.png`}
                    alt={lang}
                    className="w-4 h-4 object-contain"
                  />
                  <span className="text-xs sm:text-sm">{lang}</span>
                </div>
              </button>
            ))}

            {selectedLanguage && (
              <button
                onClick={() => setSelectedLanguage(null)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-300 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}

            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs sm:text-sm text-gray-500">
                {filteredSnippets.length} kod bulundu
              </span>

              {/* View Toggle */}
              <div className="flex items-center gap-1 p-1 bg-[#1e1e2e] rounded-lg ring-1 ring-gray-800">
                <button
                  onClick={() => setView("grid")}
                  className={`p-2 rounded-md transition-all ${
                    view === "grid"
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-gray-400 hover:text-gray-300 hover:bg-[#262637]"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`p-2 rounded-md transition-all ${
                    view === "list"
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-gray-400 hover:text-gray-300 hover:bg-[#262637]"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Snippets Display */}
        <motion.div
          className={`grid gap-6 ${
            view === "grid"
              ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
              : "grid-cols-1 max-w-3xl mx-auto"
          }`}
          layout
        >
          <AnimatePresence mode="popLayout">
            {filteredSnippets.map((snippet) => (
              <SnippetCard key={snippet.id} snippet={snippet} />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty state */}
        {filteredSnippets.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-md mx-auto mt-20 p-8 rounded-2xl overflow-hidden"
          >
            <div className="text-center">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br 
                  from-blue-500/10 to-purple-500/10 ring-1 ring-white/10 mb-6"
              >
                <Code className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-3">
                Kod bulunamadı
              </h3>
              <p className="text-gray-400 mb-6">
                {searchQuery || selectedLanguage
                  ? "Try adjusting your search query or filters"
                  : "Topluluk ile kod paylaşan ilk kişi ol"}
              </p>

              {(searchQuery || selectedLanguage) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedLanguage(null);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#262637] text-gray-300 hover:text-white rounded-lg 
                    transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear all filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
