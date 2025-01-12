import { Problem } from "@/app/types/problem";
import assert from "assert";

export const factorialHandler = (fn: any) => {
  try {
    const tests = [0, 1, 3, 5];
    const answers = [1, 1, 6, 120];
    for (let i = 0; i < tests.length; i++) {
      const result = fn(tests[i]);
      assert.strictEqual(result, answers[i]);
    }
    return true;
  } catch (error: any) {
    throw new Error(error);
  }
};

const starterCodeFactorial = `function factorial(n) {
  // Write your code here
};`;

export const factorial: Problem = {
  id: "factorial",
  title: "Factorial",
  difficulty: "Easy",
  problemStatement: `
    <p class='mt-3'>
      Given a non-negative integer <code>n</code>, return the factorial of <code>n</code>.
    </p>
  `,
  examples: [
    {
      id: 1,
      inputText: "0",
      outputText: "1",
      explanation: "By definition, 0! = 1.",
    },
    {
      id: 2,
      inputText: "5",
      outputText: "120",
    },
  ],
  constraints: `
    <li class='mt-2'><code>0 &lt;= n &lt;= 20</code></li>
  `,
  order: 10,
  starterCode: starterCodeFactorial,
  handlerFunction: factorialHandler,
  starterFunctionName: "function factorial(",
};
