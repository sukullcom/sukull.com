import { Problem } from "@/app/types/problem";
import assert from "assert";

export const reverseWordsInStringHandler = (fn: any) => {
  try {
    const inputs = ["hello world", "a b c", "one"];
    const outputs = ["world hello", "c b a", "one"];
    for (let i = 0; i < inputs.length; i++) {
      const result = fn(inputs[i]);
      assert.strictEqual(result, outputs[i]);
    }
    return true;
  } catch (error: any) {
    throw new Error(error);
  }
};

const starterCodeReverseWords = `function reverseWordsInString(str) {
  // Write your code here
  // Split the string by spaces and reverse the words
};`;

export const reverseWordsInString: Problem = {
  id: "reverse-words-in-string",
  title: "Reverse Words In String",
  difficulty: "Easy",
  problemStatement: `
    <p class='mt-3'>
      Given a string <code>str</code>, reverse the order of the words.
      Words are separated by spaces.
    </p>
  `,
  examples: [
    {
      id: 1,
      inputText: '"hello world"',
      outputText: '"world hello"',
    },
    {
      id: 2,
      inputText: '"a b c"',
      outputText: '"c b a"',
    },
  ],
  constraints: `
    <li class='mt-2'>String may contain multiple spaces</li>
  `,
  order: 12,
  starterCode: starterCodeReverseWords,
  handlerFunction: reverseWordsInStringHandler,
  starterFunctionName: "function reverseWordsInString(",
};
