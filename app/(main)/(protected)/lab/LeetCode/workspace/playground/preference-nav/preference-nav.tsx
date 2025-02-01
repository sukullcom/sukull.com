import React from "react";
import { AiOutlineFullscreen, AiOutlineSetting } from "react-icons/ai";

type PreferenceNavProps = {};

const PreferenceNav: React.FC<PreferenceNavProps> = () => {
  return (
    <div className="flex items-end justify-between bg-gray-50 h-11 w-full border-b border-gray-200">
      <div className="flex items-center text-gray-700">
        <button className="bg-gray-200 rounded-t-[5px] px-5 py-[10px] text-xs hover:bg-gray-300 font-medium">
          <div className="flex items-center px-1 text-gray-600">JavaScript</div>
        </button>
      </div>
    </div>
  );
};

export default PreferenceNav;
