"use client";

import React, { useEffect, useState } from "react";
import PreferenceNav from "./preference-nav/preference-nav";
import Split from "react-split";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import EditorFooter from "./editor-footer";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { Problem } from "@/app/types/problem";
// import { useAuth } from "@clerk/nextjs";  // Kaldırdık
// import { useAuth } from "react-firebase-hooks/auth"; // Örnek
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { problems } from "@/app/utils/problems";
import { useWindowSize } from "react-use";

// Varsayımsal custom hook
function useFirebaseUser() {
  // Kendiniz implement edebilirsiniz
  // ya da react-firebase-hooks kullanabilirsiniz
  return { uid: "some-firebase-uid" }; 
}

// Helper function to build the test code
function buildTestCode(userCode: string, problem: Problem): string {
  const match = problem.starterFunctionName.match(/function\s+(\w+)\s*\(/);
  const functionName = match ? match[1] : "unknownFn";
  const handlerCode =
    typeof problem.handlerFunction === "function"
      ? problem.handlerFunction.toString()
      : problem.handlerFunction;

  return `
${userCode}

const userFn = ${functionName};
const _handlerFunction = ${handlerCode};

try {
  const testResult = _handlerFunction(userFn);
  if (testResult === true) {
    console.log("ALL_TESTS_PASSED");
  }
} catch (err) {
  console.log(err.message);
}
`;
}

type PlaygroundProps = {
  problem: Problem;
  setSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  setSolved: React.Dispatch<React.SetStateAction<boolean>>;
};

const Playground: React.FC<PlaygroundProps> = ({
  problem,
  setSuccess,
  setSolved,
}) => {
  const [activeTestCaseId, setActiveTestCaseId] = useState<number>(0);
  const [userCode, setUserCode] = useState<string>(problem.starterCode);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string>("");

  const user = useFirebaseUser(); // Örnek
  const params = useParams();
  const pid = params.pid as string;

  const { width, height } = useWindowSize();

  useEffect(() => {
    const code = localStorage.getItem(`code-${problem.id}`);
    if (user?.uid) {
      setUserCode(code ? JSON.parse(code) : problem.starterCode);
    } else {
      setUserCode(problem.starterCode);
    }
    const wasSolved = localStorage.getItem(`solved-${problem.id}`) === "true";
    if (wasSolved) {
      setSolved(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid, user?.uid]);

  const handleSubmit = async () => {
    try {
      setIsRunning(true);
      setOutput("");
      setError("");

      const finalCode = buildTestCode(userCode, problem);
      const resp = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: "javascript",
          version: "1.32.3",
          files: [
            {
              name: "index.js",
              content: finalCode,
            },
          ],
        }),
      });

      if (!resp.ok) {
        throw new Error(`Piston API request failed with status ${resp.status}`);
      }

      const data = await resp.json();
      if (data.compile && data.compile.code !== 0) {
        const compileErr = data.compile.stderr || data.compile.output;
        setError(compileErr || "Compilation error");
        return;
      }

      if (data.run && data.run.code !== 0) {
        const runErr = data.run.stderr || data.run.output;
        setError(runErr || "Runtime error");
        return;
      }

      const stdout = data.run?.stdout || "";
      setOutput(stdout);

      if (stdout.includes("ALL_TESTS_PASSED")) {
        setSuccess(true);
        setSolved(true);
        localStorage.setItem(`solved-${problem.id}`, "true");
        toast.success("All tests passed!");
      } else {
        toast.error("Some tests failed!");
      }
    } catch (err: any) {
      console.error("Error calling Piston API", err);
      setError(err.message || String(err));
    } finally {
      setIsRunning(false);
    }
  };

  const onChange = (value: string) => {
    setUserCode(value);
    localStorage.setItem(`code-${problem.id}`, JSON.stringify(value));
  };

  return (
    <div className="flex flex-col relative bg-white">
      <PreferenceNav />

      <Split
        className="h-[calc(100vh-94px)]"
        direction="vertical"
        sizes={[60, 40]}
        minSize={60}
      >
        <div className="w-full overflow-auto">
          <CodeMirror
            value={userCode}
            theme={vscodeDark}
            onChange={onChange}
            extensions={[javascript()]}
            style={{ fontSize: 16 }}
          />
        </div>

        <div className="bg-white">
          <div className="w-full px-5 overflow-auto">
            <div className="flex h-10 items-center space-x-6">
              <div className="relative flex h-full flex-col justify-center">
                <div className="text-sm font-medium leading-5 text-gray-700">
                  Testcases
                </div>
                <hr className="absolute bottom-0 h-0.5 w-full rounded-full border-none bg-gray-300" />
              </div>
            </div>

            <div className="flex">
              {problem.examples.map((example, index) => (
                <div
                  key={example.id}
                  className={`mr-2 mt-2 text-gray-700 cursor-pointer ${
                    activeTestCaseId === index
                      ? "font-bold underline"
                      : "font-normal"
                  }`}
                  onClick={() => setActiveTestCaseId(index)}
                >
                  Case {index + 1}
                </div>
              ))}
            </div>

            <div className="font-semibold mt-4">
              <p className="text-sm font-medium text-gray-700">Input:</p>
              <div className="w-full rounded-lg bg-gray-100 text-gray-700 mt-2 p-3">
                {problem.examples[activeTestCaseId].inputText}
              </div>

              <p className="text-sm font-medium mt-4 text-gray-700">
                Expected Output:
              </p>
              <div className="w-full rounded-lg bg-gray-100 text-gray-700 mt-2 p-3">
                {problem.examples[activeTestCaseId].outputText}
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Execution Results:
                </h3>
                {isRunning && (
                  <p className="text-blue-500">Running code, please wait...</p>
                )}
                {error && <p className="text-red-500">Error: {error}</p>}
                {!error && output && (
                  <div className="text-green-700 whitespace-pre-wrap">
                    {output}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Split>

      <EditorFooter handleSubmit={handleSubmit} isRunning={isRunning} />
    </div>
  );
};

export default Playground;
