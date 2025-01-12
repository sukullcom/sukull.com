import { Problem } from "@/app/types/problem";
import assert from "assert";

export const sumOfArrayHandler = (fn: any) => {
  try {
    const tests = [
      [1, 2, 3, 4],
      [5],
      [0, 0, 0],
      [-1, 1],
    ];
    const answers = [10, 5, 0, 0];
    for (let i = 0; i < tests.length; i++) {
      const result = fn(tests[i]);
      assert.strictEqual(result, answers[i]);
    }
    return true;
  } catch (error: any) {
    throw new Error(error);
  }
};

const starterCodeSumOfArray = `function sumOfArray(arr) {
  // Write your code here
};`;

export const sumOfArray: Problem = {
  id: "sum-of-array",
  title: "Sum of Array",
  difficulty: "Easy",
  problemStatement: `
    <p class='mt-3'>
      Given an array of integers <code>arr</code>, return the sum of all elements.
    </p>
  `,
  examples: [
    {
      id: 1,
      inputText: "[1,2,3,4]",
      outputText: "10",
    },
    {
      id: 2,
      inputText: "[5]",
      outputText: "5",
    },
  ],
  constraints: `
    <li class='mt-2'><code>1 &lt;= arr.length &lt;= 10^5</code></li>
    <li class='mt-2'><code>-10^9 &lt;= arr[i] &lt;= 10^9</code></li>
  `,
  order: 9,
  starterCode: starterCodeSumOfArray,
  handlerFunction: sumOfArrayHandler,
  starterFunctionName: "function sumOfArray(",
};
