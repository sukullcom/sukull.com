import { Blocks, Code2 } from "lucide-react";
import Link from "next/link";
import React from "react";
import ThemeSelector from "./theme-selector";
import LanguageSelector from "./language-selector";
import RunButton from "./run-button";

function Header() {
  return (
    <div className="relative z-10">
      <div className="flex items-center lg:justify-between justify-center bg-[#111827] backdrop-blur-xl p-6 mb-4 rounded-lg">
        <div className="hidden lg:flex items-center gap-8">
          <Link prefetch={false} href="" className="flex items-center gap-3 group relative">
            {/* Logo hover effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl" />

            {/* Logo */}
            <Blocks className="size-6 text-blue-400 transform -rotate-6 group-hover:rotate-0 transition-transform duration-500" />
            <div className="flex flex-col">
              <span className="block text-lg font-semibold bg-gradient-to-r from-blue-400 via-blue-300 to-purple-400 text-transparent bg-clip-text">
                Sukull
              </span>
              <span className="block text-xs text-blue-400/60 font-medium">
                Kod Editörü
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-1">
            <Link
              prefetch={false}
              href="/sukull-code-editor/snippets"
              className="relative group flex items-center gap-2 px-4 py-1.5 rounded-lg text-gray-300 bg-gray-800/50 
                hover:bg-blue-500/10 border border-gray-800 hover:border-blue-500/50 transition-all duration-300 shadow-lg overflow-hidden"
            >
              <div
                className="absolute inset-0 bg-gradient-to-r from-blue-500/10 
                to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <Code2 className="w-4 h-4 relative z-10 group-hover:rotate-3 transition-transform" />
              <span
                className="text-sm font-medium relative z-10 group-hover:text-white
                 transition-colors"
              >
                Örnek Projeler
              </span>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <ThemeSelector />
            <LanguageSelector hasAccess={true} />
          </div>

          <RunButton />
        </div>
      </div>
    </div>
  );
}

export default Header;
