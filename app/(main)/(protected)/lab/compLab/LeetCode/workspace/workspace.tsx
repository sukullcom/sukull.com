"use client";

import React, { useState, useEffect } from "react";
import Split from "react-split";
import ProblemDescription from "./problem-description/problem-description";
import Playground from "./playground/playground";
import { Problem } from "@/app/types/problem";
import { useWindowSize } from "react-use";
import Confetti from "react-confetti";

type WorkspaceProps = {
  problem: Problem;
};

const Workspace: React.FC<WorkspaceProps> = ({ problem }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { width, height } = useWindowSize();
  const [success, setSuccess] = useState(false);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    // Listen for changes in sidebar state
    const checkSidebarState = () => {
      const sidebar = document.querySelector(".lg\\:flex");
      if (sidebar) {
        // Check if the sidebar is hidden
        const isHidden = window.getComputedStyle(sidebar).display === "none";
        setIsSidebarOpen(!isHidden);
      }
    };

    checkSidebarState(); // Initial check
    window.addEventListener("resize", checkSidebarState); // Handle resizing

    return () => {
      window.removeEventListener("resize", checkSidebarState); // Cleanup listener
    };
  }, []);

  return (
    <div
      className={`absolute ${
        isSidebarOpen ? "left-64" : "left-0 top-[50px] bottom-[64px]"
      } right-0 bg-white`}
    >
      {success && (
        <Confetti
          gravity={0.3}
          tweenDuration={4000}
          width={width - 300}
          height={height - 16}
        />
      )}

      <Split className="split w-full h-full" minSize={0}>
        <ProblemDescription problem={problem} _solved={solved} />
        <Playground
          problem={problem}
          setSuccess={setSuccess}
          setSolved={setSolved}
        />
      </Split>
    </div>
  );
};

export default Workspace;
