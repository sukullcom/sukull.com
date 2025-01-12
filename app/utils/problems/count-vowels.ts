import { Problem } from "@/app/types/problem";
import assert from "assert";

export const countVowelsHandler = (fn: any) => {
  try {
    const inputs = ["hello", "abc", "AEIOU", "xyz"];
    const answers = [2, 1, 5, 0];
    for (let i = 0; i < inputs.length; i++) {
      const result = fn(inputs[i]);
      assert.strictEqual(result, answers[i]);
    }
    return true;
  } catch (error: any) {
    throw new Error(error);
  }
};

const starterCodeCountVowels = `function countVowels(str) {
  // Write your code here
  // Vowels = a, e, i, o, u (case-sensitive or insensitive? Decide approach)
};`;

export const countVowels: Problem = {
  id: "count-vowels",
  title: "Count Vowels",
  difficulty: "Easy",
  problemStatement: `
    <p class='mt-3'>
      Given a string <code>str</code>, return the number of vowels in the string.
      Consider both uppercase and lowercase vowels (a, e, i, o, u).
    </p>
  `,
  examples: [
    {
      id: 1,
      inputText: '"hello"',
      outputText: "2",
    },
    {
      id: 2,
      inputText: '"AEIOU"',
      outputText: "5",
    },
  ],
  constraints: `
    <li class='mt-2'><code>0 &lt;= str.length &lt;= 10^5</code></li>
  `,
  order: 14,
  starterCode: starterCodeCountVowels,
  handlerFunction: countVowelsHandler,
  starterFunctionName: "function countVowels(",
};
