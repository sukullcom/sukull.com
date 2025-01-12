import { Problem } from "@/app/types/problem";
import assert from "assert";

export const isEvenHandler = (fn: any) => {
  try {
    const inputs = [2, 5, 10, -4, 0];
    const answers = [true, false, true, true, true];
    for (let i = 0; i < inputs.length; i++) {
      const result = fn(inputs[i]);
      assert.strictEqual(result, answers[i]);
    }
    return true;
  } catch (error: any) {
    throw new Error(error);
  }
};

const starterCodeIsEven = `function isEven(num) {
  // Write your code here
};`;

export const isEven: Problem = {
  id: "is-even",
  title: "Is Even",
  difficulty: "Easy",
  problemStatement: `
    <p class='mt-3'>
      Given an integer <code>num</code>, return <code>true</code> if it is even, otherwise <code>false</code>.
    </p>
  `,
  examples: [
    {
      id: 1,
      inputText: "2",
      outputText: "true",
      explanation: "2 is evenly divisible by 2.",
    },
    {
      id: 2,
      inputText: "5",
      outputText: "false",
      explanation: "5 / 2 = 2.5, not even.",
    },
  ],
  constraints: `
    <li class='mt-2'><code>-10^9 &lt;= num &lt;= 10^9</code></li>
  `,
  order: 6,
  starterCode: starterCodeIsEven,
  handlerFunction: isEvenHandler,
  starterFunctionName: "function isEven(",
};
