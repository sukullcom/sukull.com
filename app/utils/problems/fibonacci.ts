import { Problem } from "@/app/types/problem";
import assert from "assert";

export const fibonacciHandler = (fn: any) => {
  try {
    const tests = [0, 1, 5, 7];
    const answers = [0, 1, 5, 13];
    for (let i = 0; i < tests.length; i++) {
      const result = fn(tests[i]);
      assert.strictEqual(result, answers[i]);
    }
    return true;
  } catch (error: any) {
    throw new Error(error);
  }
};

const starterCodeFibonacci = `function fibonacci(n) {
  // Write your code here
  // Return the nth Fibonacci number
};`;

export const fibonacci: Problem = {
  id: "fibonacci",
  title: "Fibonacci",
  difficulty: "Easy",
  problemStatement: `
    <p class='mt-3'>
      Given a non-negative integer <code>n</code>, return the <code>n</code>-th Fibonacci number.
    </p>
    <p class='mt-3'>
      The Fibonacci sequence is defined as F(0)=0, F(1)=1, and F(n) = F(n-1)+F(n-2) for n >= 2.
    </p>
  `,
  examples: [
    {
      id: 1,
      inputText: "0",
      outputText: "0",
    },
    {
      id: 2,
      inputText: "5",
      outputText: "5",
    },
  ],
  constraints: `
    <li class='mt-2'><code>0 &lt;= n &lt;= 30</code></li>
  `,
  order: 11,
  starterCode: starterCodeFibonacci,
  handlerFunction: fibonacciHandler,
  starterFunctionName: "function fibonacci(",
};
