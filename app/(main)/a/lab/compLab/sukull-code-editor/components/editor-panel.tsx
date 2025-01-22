"use client";
import { useEffect, useState } from "react";
import { Editor } from "@monaco-editor/react";
import { motion } from "framer-motion";
import Image from "next/image";
import { RotateCcwIcon, ShareIcon, TypeIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { defineMonacoThemes, LANGUAGE_CONFIG } from "../constants";
import { useCodeEditorStore } from "@/store/useCodeEditorStore";

// Örneksel Firebase user hook
function useFirebaseUser() {
  return { uid: "some-uid" };
}

function EditorPanel() {
  const user = useFirebaseUser();

  const searchParams = useSearchParams();
  const snippetId = searchParams.get("snippetId");

  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareTitle, setShareTitle] = useState("");
  const [shareDescription, setShareDescription] = useState("");
  const [shareError, setShareError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const {
    language,
    theme,
    fontSize,
    editor,
    setFontSize,
    setEditor,
  } = useCodeEditorStore();

  useEffect(() => {
    if (!editor) return;

    if (snippetId) {
      (async () => {
        try {
          const res = await fetch(`/api/snippets/${snippetId}`);
          if (!res.ok) {
            console.error("Failed to fetch snippet:", await res.text());
            return;
          }
          const snippetData = await res.json();
          if (snippetData?.code) {
            editor.setValue(snippetData.code);
          }
        } catch (err) {
          console.error("Error loading snippet:", err);
        }
      })();
    } else {
      const savedCode = localStorage.getItem(`editor-code-${language}`);
      const newCode = savedCode || LANGUAGE_CONFIG[language].defaultCode;
      editor.setValue(newCode);
    }
  }, [editor, snippetId, language]);

  useEffect(() => {
    const savedFontSize = localStorage.getItem("editor-font-size");
    if (savedFontSize) setFontSize(parseInt(savedFontSize));
  }, [setFontSize]);

  const handleRefresh = () => {
    const defaultCode = LANGUAGE_CONFIG[language].defaultCode;
    if (editor) editor.setValue(defaultCode);
    localStorage.removeItem(`editor-code-${language}`);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (!snippetId && value) {
      localStorage.setItem(`editor-code-${language}`, value);
    }
  };

  const handleFontSizeChange = (newSize: number) => {
    const size = Math.min(Math.max(newSize, 12), 24);
    setFontSize(size);
    localStorage.setItem("editor-font-size", size.toString());
  };

  const openShareDialog = () => {
    setIsShareDialogOpen(true);
    setShareTitle("");
    setShareDescription("");
    setShareError(null);
    setInfoMessage(null);
  };

  const closeShareDialog = () => {
    setIsShareDialogOpen(false);
  };

  const handleShareSubmit = async () => {
    setShareError(null);
    setInfoMessage(null);

    const code = editor?.getValue() || "";
    if (!code) {
      setShareError("No code to share.");
      return;
    }

    try {
      const res = await fetch("/api/snippets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: shareTitle.trim(),
          description: shareDescription.trim(),
          code,
          language,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setShareError(data.error || "Error sharing snippet");
        return;
      }

      setInfoMessage("Snippet shared successfully!");
      setTimeout(() => {
        closeShareDialog();
      }, 1200);
    } catch (err) {
      setShareError("Something went wrong. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="relative">
      <div className="relative bg-[#12121a]/90 backdrop-blur rounded-xl border border-white/[0.05] p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          {/* Left */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1e1e2e] ring-1 ring-white/5">
              <Image
                src={"/language_logos/" + language + ".png"}
                alt="Logo"
                width={24}
                height={24}
              />
            </div>
            <div>
              <h2 className="text-sm font-medium text-white">Code Editor</h2>
              <p className="text-xs text-gray-500">
                {snippetId
                  ? `Editing snippet #${snippetId}`
                  : "Write and execute your code"}
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-3 py-2 bg-[#1e1e2e] rounded-lg ring-1 ring-white/5">
              <TypeIcon className="size-4 text-gray-400" />
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={fontSize}
                  onChange={(e) =>
                    handleFontSizeChange(parseInt(e.target.value))
                  }
                  className="w-20 h-1 bg-gray-600 rounded-lg cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-400 min-w-[2rem] text-center">
                  {fontSize}
                </span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="p-2 bg-[#1e1e2e] hover:bg-[#2a2a3a] rounded-lg ring-1 ring-white/5 transition-colors"
              aria-label="Reset to default code"
            >
              <RotateCcwIcon className="size-4 text-gray-400" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openShareDialog}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg overflow-hidden bg-gradient-to-r
                from-blue-500 to-blue-600 opacity-90 hover:opacity-100 transition-opacity"
            >
              <ShareIcon className="size-4 text-white" />
              <span className="text-sm font-medium text-white">Share</span>
            </motion.button>
          </div>
        </div>

        {/* Editor */}
        <div className="relative group rounded-xl overflow-hidden ring-1 ring-white/[0.05]">
          <Editor
            height="600px"
            language={LANGUAGE_CONFIG[language].monacoLanguage}
            onChange={handleEditorChange}
            theme={theme}
            beforeMount={defineMonacoThemes}
            onMount={(editorInstance) => setEditor(editorInstance)}
            options={{
              minimap: { enabled: false },
              fontSize,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              padding: { top: 16, bottom: 16 },
              renderWhitespace: "selection",
              fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
              fontLigatures: true,
              cursorBlinking: "smooth",
              smoothScrolling: true,
              contextmenu: true,
              renderLineHighlight: "all",
              lineHeight: 1.6,
              letterSpacing: 0.5,
              roundedSelection: true,
              scrollbar: {
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
              },
            }}
          />
        </div>
      </div>

      {isShareDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#1e1e2e] p-6 rounded-lg w-96 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
              onClick={closeShareDialog}
            >
              ✕
            </button>
            <h2 className="text-lg font-bold mb-4 text-white">Share Snippet</h2>

            {infoMessage && (
              <p className="bg-green-700 text-white p-2 rounded mb-2 text-sm">
                {infoMessage}
              </p>
            )}
            {shareError && (
              <p className="bg-red-700 text-white p-2 rounded mb-2 text-sm">
                {shareError}
              </p>
            )}

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Title
              </label>
              <input
                type="text"
                value={shareTitle}
                onChange={(e) => setShareTitle(e.target.value)}
                className="w-full rounded p-2 text-gray-900"
                placeholder="My Awesome Project"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={shareDescription}
                onChange={(e) => setShareDescription(e.target.value)}
                className="w-full rounded p-2 text-gray-900"
                placeholder="Brief description of your code..."
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleShareSubmit}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditorPanel;
