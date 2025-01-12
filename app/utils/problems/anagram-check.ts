import { Problem } from "@/app/types/problem";
import assert from "assert";

export const anagramCheckHandler = (fn: any) => {
  try {
    const inputs = [
      ["anagram", "nagaram"],
      ["rat", "car"],
      ["", ""],
      ["Hello", "hello"],
    ];
    const answers = [true, false, true, false]; // last is false if we do case-sensitive
    for (let i = 0; i < inputs.length; i++) {
      const result = fn(inputs[i][0], inputs[i][1]);
      assert.strictEqual(result, answers[i]);
    }
    return true;
  } catch (error: any) {
    throw new Error(error);
  }
};

const starterCodeAnagramCheck = `function anagramCheck(str1, str2) {
  // Write your code here
  // Return true if str1 and str2 are anagrams (case-sensitive), false otherwise
};`;

export const anagramCheck: Problem = {
  id: "anagram-check",
  title: "Anagram Check",
  difficulty: "Easy",
  problemStatement: `
    <p class='mt-3'>
      Given two strings <code>str1</code> and <code>str2</code>, return <code>true</code> if they are anagrams of each other (case-sensitive).
      Otherwise, return <code>false</code>.
    </p>
  `,
  examples: [
    {
      id: 1,
      inputText: '"anagram", "nagaram"',
      outputText: "true",
    },
    {
      id: 2,
      inputText: '"rat", "car"',
      outputText: "false",
    },
  ],
  constraints: `
    <li class='mt-2'><code>0 &lt;= str1.length, str2.length &lt;= 10^5</code></li>
  `,
  order: 13,
  starterCode: starterCodeAnagramCheck,
  handlerFunction: anagramCheckHandler,
  starterFunctionName: "function anagramCheck(",
};
