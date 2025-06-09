import { create } from "zustand";
import { CodeEditorState, MonacoEditor } from "@/app/types";
import { LANGUAGE_CONFIG } from "@/app/(main)/sukull-code-editor/constants";
import { Monaco } from "@monaco-editor/react";

const getInitialState = () => {
  // Default values that match both server and client
  const defaultState = {
    language: "javascript",
    fontSize: 16,
    theme: "vs-dark",
  };

  // if we're on the server, return default values
  if (typeof window === "undefined") {
    return defaultState;
  }

  // if we're on the client, check localStorage but with fallbacks
  try {
    const savedLanguage = localStorage.getItem("editor-language");
    const savedTheme = localStorage.getItem("editor-theme");
    const savedFontSize = localStorage.getItem("editor-font-size");

    return {
      language: savedLanguage && LANGUAGE_CONFIG[savedLanguage] ? savedLanguage : defaultState.language,
      theme: savedTheme || defaultState.theme,
      fontSize: savedFontSize ? Number(savedFontSize) : defaultState.fontSize,
    };
  } catch (error) {
    // In case localStorage is not available or throws an error
    return defaultState;
  }
};

interface CodeEditorStore extends CodeEditorState {
  setLanguage: (language: string) => void;
  setTheme: (theme: string) => void;
  setFontSize: (fontSize: number) => void;
  setEditor: (editor: MonacoEditor) => void;
  setMonaco: (monaco: Monaco) => void;
  isHydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  hydrate: () => void;
}

export const useCodeEditorStore = create<CodeEditorStore>((set, get) => ({
  ...getInitialState(),
  editor: null,
  monaco: null,
  isHydrated: false,
    output: "",
    isRunning: false,
    error: null,
    executionResult: null,

  setLanguage: (language: string) => {
    // Save current language code before switching
    const currentCode = get().editor?.getValue();
    if (currentCode && typeof window !== "undefined") {
      try {
        localStorage.setItem(`editor-code-${get().language}`, currentCode);
      } catch (error) {
        console.warn("Failed to save current code:", error);
      }
    }

    set({ language, output: "", error: null });
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("editor-language", language);
      } catch (error) {
        console.warn("Failed to save language to localStorage:", error);
      }
    }
    },

    setTheme: (theme: string) => {
    set({ theme });
    if (typeof window !== "undefined") {
      try {
      localStorage.setItem("editor-theme", theme);
      } catch (error) {
        console.warn("Failed to save theme to localStorage:", error);
      }
    }
    },

    setFontSize: (fontSize: number) => {
    set({ fontSize });
    if (typeof window !== "undefined") {
      try {
      localStorage.setItem("editor-font-size", fontSize.toString());
      } catch (error) {
        console.warn("Failed to save font size to localStorage:", error);
      }
    }
  },

  setEditor: (editor: MonacoEditor) => {
    set({ editor });
    
    // Set initial code after editor is set
    if (get().isHydrated && typeof window !== "undefined") {
      try {
        const savedCode = localStorage.getItem(`editor-code-${get().language}`);
        const codeToSet = savedCode || LANGUAGE_CONFIG[get().language].defaultCode;
        editor.setValue(codeToSet);
      } catch (error) {
        console.warn("Failed to set initial code:", error);
        editor.setValue(LANGUAGE_CONFIG[get().language].defaultCode);
      }
    } else {
      // If not hydrated, just set default code
      editor.setValue(LANGUAGE_CONFIG[get().language].defaultCode);
    }
  },

  setMonaco: (monaco: Monaco) => set({ monaco }),

  setHydrated: (hydrated: boolean) => {
    set({ isHydrated: hydrated });
    },

  getCode: () => get().editor?.getModel()?.getValue() || "",

    runCode: async () => {
      const { language, getCode } = get();
      const code = getCode();

      if (!code) {
        set({ error: "Please enter some code" });
        return;
      }

      set({ isRunning: true, error: null, output: "" });

      try {
        const runtime = LANGUAGE_CONFIG[language].pistonRuntime;
        const response = await fetch("https://emkc.org/api/v2/piston/execute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language: runtime.language,
            version: runtime.version,
            files: [{ content: code }],
          }),
        });

        const data = await response.json();

        console.log("data back from piston:", data);

        // handle API-level erros
        if (data.message) {
          set({ error: data.message, executionResult: { code, output: "", error: data.message } });
          return;
        }

        // handle compilation errors
        if (data.compile && data.compile.code !== 0) {
          const error = data.compile.stderr || data.compile.output;
          set({
            error,
            executionResult: {
              code,
              output: "",
              error,
            },
          });
          return;
        }

        if (data.run && data.run.code !== 0) {
          const error = data.run.stderr || data.run.output;
          set({
            error,
            executionResult: {
              code,
              output: "",
              error,
            },
          });
          return;
        }

        // if we get here, execution was successful
        const output = data.run.output;

        set({
          output: output.trim(),
          error: null,
          executionResult: {
            code,
            output: output.trim(),
            error: null,
          },
        });
      } catch (error) {
        console.log("Error running code:", error);
        set({
          error: "Error running code",
          executionResult: { code, output: "", error: "Error running code" },
        });
      } finally {
        set({ isRunning: false });
      }
    },

  hydrate: () => {
    const currentState = get();
    if (currentState.isHydrated || typeof window === "undefined") return;
    
    try {
      const savedLanguage = localStorage.getItem("editor-language");
      const savedTheme = localStorage.getItem("editor-theme");
      const savedFontSize = localStorage.getItem("editor-font-size");

      const updates: Partial<CodeEditorStore> = {};
      
      if (savedLanguage && LANGUAGE_CONFIG[savedLanguage] && savedLanguage !== currentState.language) {
        updates.language = savedLanguage;
      }
      if (savedTheme && savedTheme !== currentState.theme) {
        updates.theme = savedTheme;
      }
      if (savedFontSize && Number(savedFontSize) !== currentState.fontSize) {
        updates.fontSize = Number(savedFontSize);
      }

      // Always mark as hydrated
      updates.isHydrated = true;

      if (Object.keys(updates).length > 0) {
        set(updates);
      } else {
        set({ isHydrated: true });
      }
    } catch (error) {
      console.warn("Failed to hydrate from localStorage:", error);
      set({ isHydrated: true });
    }
  },
}));

export const getExecutionResult = () => useCodeEditorStore.getState().executionResult;