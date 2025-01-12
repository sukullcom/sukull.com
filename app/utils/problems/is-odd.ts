import { Problem } from "@/app/types/problem";
import assert from "assert";

export const isOddHandler = (fn: any) => {
  try {
    const inputs = [1, 2, -3, 0, 11];
    const answers = [true, false, true, false, true];
    for (let i = 0; i < inputs.length; i++) {
      const result = fn(inputs[i]);
      assert.strictEqual(result, answers[i]);
    }
    return true;
  } catch (error: any) {
    throw new Error(error);
  }
};

const starterCodeIsOdd = `function isOdd(num) {
  // Write your code here
};`;

export const isOdd: Problem = {
  id: "is-odd",
  title: "Is Odd",
  difficulty: "Easy",
  problemStatement: `
    <p class='mt-3'>
      Given an integer <code>num</code>, return <code>true</code> if it is odd, otherwise <code>false</code>.
    </p>
  `,
  examples: [
    {
      id: 1,
      inputText: "1",
      outputText: "true",
    },
    {
      id: 2,
      inputText: "2",
      outputText: "false",
    },
  ],
  constraints: `
    <li class='mt-2'><code>-10^9 &lt;= num &lt;= 10^9</code></li>
  `,
  order: 7,
  starterCode: starterCodeIsOdd,
  handlerFunction: isOddHandler,
  starterFunctionName: "function isOdd(",
};
