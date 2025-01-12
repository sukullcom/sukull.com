import React from "react";
import { BsChevronUp } from "react-icons/bs";

type EditorFooterProps = {
  handleSubmit: () => void;
  isRunning?: boolean; // <--- New optional prop to disable buttons
};

const EditorFooter: React.FC<EditorFooterProps> = ({ handleSubmit, isRunning }) => {
  return (
    <div className="flex bg-white absolute bottom-0 z-10 w-full border-t border-gray-300">
      <div className="mx-5 my-2 flex justify-between w-full">
        <div className="mr-2 flex flex-1 items-center space-x-4">
          <button
            className="flex items-center px-3 py-1.5 font-medium bg-gray-200 hover:bg-gray-300 rounded-lg text-sm text-gray-700"
            disabled={isRunning}
          >
            Console
            <div className="ml-1 flex items-center">
              <BsChevronUp className="mx-1" />
            </div>
          </button>
        </div>

        <div className="ml-auto flex items-center space-x-4">
          {/* "Run" Button */}
          <button
            onClick={handleSubmit}
            disabled={isRunning}
            className="px-3 py-1.5 text-sm font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg disabled:opacity-70"
          >
            {isRunning ? "Running..." : "Run"}
          </button>

          {/* "Submit" Button */}
          <button
            onClick={handleSubmit}
            disabled={isRunning}
            className="px-3 py-1.5 font-medium text-sm text-white bg-green-600 hover:bg-green-500 rounded-lg disabled:opacity-70"
          >
            {isRunning ? "Running..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorFooter;
