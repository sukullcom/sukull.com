import { Problem } from "@/app/types/problem";
import assert from "assert";

export const isPalindromeHandler = (fn: any) => {
  try {
    const tests = ["racecar", "abc", "A", "abba", "ab"];
    const answers = [true, false, true, true, false];

    for (let i = 0; i < tests.length; i++) {
      const result = fn(tests[i]);
      assert.strictEqual(result, answers[i]);
    }
    return true;
  } catch (error: any) {
    console.log("Error from isPalindromeHandler: ", error);
    throw new Error(error);
  }
};

const starterCodeIsPalindrome = `function isPalindrome(str) {
  // Write your code here
};`;

export const isPalindrome: Problem = {
  id: "is-palindrome",
  title: "4. Is Palindrome",
  difficulty: "Easy",
  problemStatement: `
    <p class='mt-3'>
      Given a string <code>str</code>, return <code>true</code> if it is a palindrome,
      or <code>false</code> otherwise.
    </p>
    <p class='mt-3'>
      A palindrome reads the same forward and backward (case-sensitive).
    </p>
  `,
  examples: [
    {
      id: 0,
      inputText: `"racecar"`,
      outputText: `true`,
      explanation: `"racecar" reversed is also "racecar"`,
    },
    {
      id: 1,
      inputText: `"abc"`,
      outputText: `false`,
      explanation: `"abc" reversed is "cba", which is different.`,
    },
  ],
  constraints: `
    <li class='mt-2'><code>1 &lt;= str.length &lt;= 10^5</code></li>
  `,
  starterCode: starterCodeIsPalindrome,
  handlerFunction: isPalindromeHandler,
  starterFunctionName: "function isPalindrome(",
  order: 4,
};
