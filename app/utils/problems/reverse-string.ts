import { Problem } from "@/app/types/problem";
import assert from "assert";

export const reverseStringHandler = (fn: any) => {
  try {
    const tests = ["hello", "Hannah", "abc"];
    const answers = ["olleh", "hannaH", "cba"];

    for (let i = 0; i < tests.length; i++) {
      const result = fn(tests[i]);
      assert.strictEqual(result, answers[i]);
    }
    return true;
  } catch (error: any) {
    console.log("Error from reverseStringHandler:", error);
    throw new Error(error);
  }
};

const starterCodeReverseString = `function reverseString(str) {
  // Write your code here
};`;

export const reverseString: Problem = {
  id: "reverse-string",
  title: "2. Reverse String",
  difficulty: "Easy",
  problemStatement: `
    <p class='mt-3'>
      Given a string <code>str</code>, return the string reversed.
    </p>
    <p class='mt-3'>
      e.g. if <code>str = "hello"</code>, the reversed string is <code>"olleh"</code>.
    </p>
  `,
  examples: [
    {
      id: 0,
      inputText: `"hello"`,
      outputText: `"olleh"`,
      explanation: "Reverse each character, so 'h' -> 'o', etc.",
    },
    {
      id: 1,
      inputText: `"Hannah"`,
      outputText: `"hannaH"`,
      explanation: "Case-sensitive reversal.",
    },
  ],
  constraints: `
    <li class='mt-2'><code>1 &lt;= str.length &lt;= 10^5</code></li>
  `,
  starterCode: starterCodeReverseString,
  handlerFunction: reverseStringHandler,
  starterFunctionName: "function reverseString(",
  order: 2,
};
