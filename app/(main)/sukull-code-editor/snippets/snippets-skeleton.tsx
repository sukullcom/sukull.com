import { motion } from "framer-motion";

export default function SnippetsPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Replace with your skeleton UI elements */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="p-6 bg-[#1e1e2e] rounded-xl border border-gray-800 animate-pulse"
          >
            <div className="h-4 bg-gray-700 w-1/2 mb-4 rounded"></div>
            <div className="h-3 bg-gray-700 w-1/3 mb-2 rounded"></div>
            <div className="h-3 bg-gray-700 w-full mb-2 rounded"></div>
            <div className="h-3 bg-gray-700 w-2/3 rounded"></div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
