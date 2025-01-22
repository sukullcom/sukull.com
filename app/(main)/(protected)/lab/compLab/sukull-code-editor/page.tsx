"use client";

import React, { useState, useEffect } from "react";
import EditorPanel from "./components/editor-panel";
import Header from "./components/header";
import OutputPanel from "./components/output-panel";

const Home = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    // Listen for sidebar state
    const checkSidebarState = () => {
      const sidebar = document.querySelector(".lg\\:flex");
      if (sidebar) {
        const isHidden = window.getComputedStyle(sidebar).display === "none";
        setIsSidebarOpen(!isHidden);
      }
    };

    checkSidebarState(); // Initial check
    window.addEventListener("resize", checkSidebarState);

    return () => {
      window.removeEventListener("resize", checkSidebarState); // Cleanup
    };
  }, []);

  return (
    <div
      className={`absolute ${
        isSidebarOpen ? "left-64" : "left-0"
      } top-[50px] bottom-[64px] right-0 bg-white`}
    >
      <div className="min-h-screen">
        <div className="max-w-[1800px] mx-auto p-4">
          <Header />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <EditorPanel />
            <OutputPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
