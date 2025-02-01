"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Snippet = {
  id: number;
  userName: string;
  title: string;
  description: string;
  language: string;
};

export default function SnippetCard({ snippet }: { snippet: Snippet }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="p-6 bg-[#1e1e2e] rounded-xl border border-gray-800"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-white">{snippet.title}</h3>
        <img
          src={`/language_logos/${snippet.language}.png`}
          alt={snippet.language}
          className="w-6 h-6 object-contain"
        />
      </div>

      <p className="text-sm text-gray-300 mb-2">By {snippet.userName}</p>
      <p className="text-sm text-gray-400 mb-4 line-clamp-3">
        {snippet.description}
      </p>

      {/* Link to /editor page with snippetId */}
      <Link
        prefetch={false}
        href={`/lab/sukull-code-editor?snippetId=${snippet.id}`}
        className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
      >
        <span>Open in Editor</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </motion.div>
  );
}
