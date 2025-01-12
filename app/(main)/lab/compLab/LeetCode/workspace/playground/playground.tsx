"use client";

import React, { useEffect, useState } from "react";
import PreferenceNav from "./preference-nav/preference-nav";
import Split from "react-split";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import EditorFooter from "./editor-footer";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { Problem } from "@/app/types/problem";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { problems } from "@/app/utils/problems";
import { useRouter } from "next/router";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

// Helper function to build the test code to send to Piston
function buildTestCode(userCode: string, problem: Problem): string {
  // Extract the user’s function name from starterFunctionName
  const match = problem.starterFunctionName.match(/function\s+(\w+)\s*\(/);
  const functionName = match ? match[1] : "unknownFn";

  // Convert the handlerFunction to string if needed:
  const handlerCode = typeof problem.handlerFunction === "function"
    ? problem.handlerFunction.toString()
    : problem.handlerFunction;

  return `
${userCode}

// This picks up the user’s function name
const userFn = ${functionName};

// The problem's test harness as a local function
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
  // Local states for code, test output, and API states
  const [activeTestCaseId, setActiveTestCaseId] = useState<number>(0);
  const [userCode, setUserCode] = useState<string>(problem.starterCode);

  // NEW: Track whether code is running (disable buttons if so), track output and errors
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string>("");

  const { userId } = useAuth();
  const params = useParams();
  const pid = params.pid as string;

  const { width, height } = useWindowSize();

  useEffect(() => {
    // Load code from localStorage if it exists
    const code = localStorage.getItem(`code-${problem.id}`);
    if (userId) {
      setUserCode(code ? JSON.parse(code) : problem.starterCode);
    } else {
      setUserCode(problem.starterCode);
    }

    // Also check if we solved it in the past
    const wasSolved = localStorage.getItem(`solved-${problem.id}`) === "true";
    if (wasSolved) {
      setSolved(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid, userId]);

  // Called by the "Run" or "Submit" button in `editor-footer.tsx`
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
      console.log("Piston response:", data);

      // Handle compilation errors
      if (data.compile && data.compile.code !== 0) {
        const compileErr = data.compile.stderr || data.compile.output;
        setError(compileErr || "Compilation error");
        return;
      }

      // Handle run errors
      if (data.run && data.run.code !== 0) {
        const runErr = data.run.stderr || data.run.output;
        setError(runErr || "Runtime error");
        return;
      }

      // If we get here, the code executed successfully
      const stdout = data.run?.stdout || "";
      setOutput(stdout);

      if (stdout.includes("ALL_TESTS_PASSED")) {
        // success scenario
        setSuccess(true);
        setSolved(true);
        localStorage.setItem(`solved-${problem.id}`, "true");
        toast.success("All tests passed!");
      } else {
        // fail scenario
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
      {/* Example Confetti usage if success: 
          {success && <Confetti width={width} height={height} gravity={0.3} />} 
      */}
      <PreferenceNav />

      <Split
        className="h-[calc(100vh-94px)]"
        direction="vertical"
        sizes={[60, 40]}
        minSize={60}
      >
        {/* CODE EDITOR */}
        <div className="w-full overflow-auto">
          <CodeMirror
            value={userCode}
            theme={vscodeDark}
            onChange={onChange}
            extensions={[javascript()]}
            style={{ fontSize: 16 }}
          />
        </div>

        {/* TESTCASES & OUTPUT SECTION */}
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

            {/* Show each example from problem.examples */}
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

            {/* Show selected example's input/output */}
            <div className="font-semibold mt-4">
              <p className="text-sm font-medium text-gray-700">Input:</p>
              <div className="w-full rounded-lg bg-gray-100 text-gray-700 mt-2 p-3">
                {problem.examples[activeTestCaseId].inputText}
              </div>

              <p className="text-sm font-medium mt-4 text-gray-700">Expected Output:</p>
              <div className="w-full rounded-lg bg-gray-100 text-gray-700 mt-2 p-3">
                {problem.examples[activeTestCaseId].outputText}
              </div>

              {/* Show the actual output/errors from the Piston run */}
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
