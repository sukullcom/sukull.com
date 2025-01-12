import { Problem } from "@/app/types/problem";

/**
 * This is the starter code that is shown to the user in the code editor.
 * The user can modify this function however they like.
 */
const starterCodeTwoSum = `function twoSum(nums, target) {
  // Write your code here
};`;

/**
 * This function is your custom test harness for "twoSum".
 * The "fn" argument will be the user's function. We will
 * call it with various inputs and compare the results to
 * expected answers.
 */
const handlerTwoSum = (fn: any) => {
  try {
    const nums = [
      [2, 7, 11, 15],
      [3, 2, 4],
      [3, 3],
    ];
    const targets = [9, 6, 6];
    const answers = [
      [0, 1],
      [1, 2],
      [0, 1],
    ];

    for (let i = 0; i < nums.length; i++) {
      // Call the user's function
      const result = fn(nums[i], targets[i]);

      // Ensure the user returns an array
      if (!Array.isArray(result)) {
        throw new Error(
          `Test ${i}: Expected an array, but got ${JSON.stringify(result)}`
        );
      }

      // Sort both the actual result and the expected answer
      const sortedResult = [...result].sort((a, b) => a - b);
      const sortedAnswer = [...answers[i]].sort((a, b) => a - b);

      // Check for mismatch
      if (JSON.stringify(sortedResult) !== JSON.stringify(sortedAnswer)) {
        throw new Error(
          `Test ${i} failed. Expected ${JSON.stringify(sortedAnswer)} but got ${JSON.stringify(sortedResult)}`
        );
      }
    }
    // If we reach here, all tests passed
    return true;
  } catch (error: any) {
    // If a test fails, throw an error so the harness can catch it
    throw new Error(error);
  }
};

/**
 * This is the Problem configuration object for "two-sum".
 * The Playground will read these properties (like "starterCode")
 * and display them. The "handlerFunction" is the test harness above.
 */
export const twoSum: Problem = {
  id: "two-sum",
  title: "1. Two Sum",
  difficulty: "Easy",
  problemStatement: `
    <p class='mt-3'>
      Given an array of integers <code>nums</code> and an integer <code>target</code>, return
      <em>indices of the two numbers such that they add up to</em> <code>target</code>.
    </p>
    <p class='mt-3'>
      You may assume that each input would have <strong>exactly one solution</strong>, and you
      may not use the same element twice.
    </p>
    <p class='mt-3'>You can return the answer in any order.</p>
  `,
  examples: [
    {
      id: 1,
      inputText: "nums = [2,7,11,15], target = 9",
      outputText: "[0,1]",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
    },
    {
      id: 2,
      inputText: "nums = [3,2,4], target = 6",
      outputText: "[1,2]",
      explanation: "Because nums[1] + nums[2] == 6, we return [1, 2].",
    },
    {
      id: 3,
      inputText: "nums = [3,3], target = 6",
      outputText: "[0,1]",
    },
  ],
  constraints: `
    <li class='mt-2'>
      <code>2 ≤ nums.length ≤ 10</code>
    </li> 
    <li class='mt-2'>
      <code>-10 ≤ nums[i] ≤ 10</code>
    </li> 
    <li class='mt-2'>
      <code>-10 ≤ target ≤ 10</code>
    </li>
    <li class='mt-2 text-sm'>
      <strong>Only one valid answer exists.</strong>
    </li>
  `,
  handlerFunction: handlerTwoSum,
  starterCode: starterCodeTwoSum,
  order: 1,
  starterFunctionName: "function twoSum(",
};