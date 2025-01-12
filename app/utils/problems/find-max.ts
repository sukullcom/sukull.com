import { Problem } from "@/app/types/problem";
import assert from "assert";

export const findMaxHandler = (fn: any) => {
  try {
    const tests = [
      [1, 2, 3, 4],
      [10],
      [-1, -5, -3],
      [0, 0, 0],
    ];
    const answers = [4, 10, -1, 0];
    for (let i = 0; i < tests.length; i++) {
      const result = fn(tests[i]);
      assert.strictEqual(result, answers[i]);
    }
    return true;
  } catch (error: any) {
    throw new Error(error);
  }
};

const starterCodeFindMax = `function findMax(arr) {
  // Write your code here
};`;

export const findMax: Problem = {
  id: "find-max",
  title: "Find Max",
  difficulty: "Easy",
  problemStatement: `
    <p class='mt-3'>
      Given an array of integers <code>arr</code>, return the maximum value in the array.
    </p>
  `,
  examples: [
    {
      id: 1,
      inputText: "[1,2,3,4]",
      outputText: "4",
    },
    {
      id: 2,
      inputText: "[0,0,0]",
      outputText: "0",
    },
  ],
  constraints: `
    <li class='mt-2'><code>1 &lt;= arr.length &lt;= 10^5</code></li>
    <li class='mt-2'><code>-10^9 &lt;= arr[i] &lt;= 10^9</code></li>
  `,
  order: 15,
  starterCode: starterCodeFindMax,
  handlerFunction: findMaxHandler,
  starterFunctionName: "function findMax(",
};
