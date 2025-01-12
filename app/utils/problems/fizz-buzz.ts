import { Problem } from "@/app/types/problem";
import assert from "assert";

export const fizzBuzzHandler = (fn: any) => {
  try {
    const inputs = [3, 5, 15, 7];
    const answers = [
      ["1", "2", "Fizz"],
      ["1", "2", "Fizz", "4", "Buzz"],
      [
        "1",
        "2",
        "Fizz",
        "4",
        "Buzz",
        "Fizz",
        "7",
        "8",
        "Fizz",
        "Buzz",
        "11",
        "Fizz",
        "13",
        "14",
        "FizzBuzz",
      ],
      ["1", "2", "Fizz", "4", "Buzz", "Fizz", "7"],
    ];

    for (let i = 0; i < inputs.length; i++) {
      const result = fn(inputs[i]);
      assert.deepStrictEqual(result, answers[i]);
    }
    return true;
  } catch (error: any) {
    throw new Error(error);
  }
};

const starterCodeFizzBuzz = `function fizzBuzz(n) {
  // Write your code here
  // Return an array of length n where:
  // i % 3 === 0 => "Fizz"
  // i % 5 === 0 => "Buzz"
  // i % 15 === 0 => "FizzBuzz"
  // else => the number as a string
};`;

export const fizzBuzz: Problem = {
  id: "fizz-buzz",
  title: "Fizz Buzz",
  difficulty: "Easy",
  problemStatement: `
    <p class='mt-3'>
      Given a positive integer <code>n</code>, return an array representing the Fizz Buzz sequence from <code>1</code> to <code>n</code>.
    </p>
    <p class='mt-3'>
      For multiples of 3, output <code>"Fizz"</code>, for multiples of 5, output <code>"Buzz"</code>, and for multiples of 15, output <code>"FizzBuzz"</code>.
    </p>
  `,
  examples: [
    {
      id: 1,
      inputText: "n = 3",
      outputText: `["1","2","Fizz"]`,
    },
    {
      id: 2,
      inputText: "n = 5",
      outputText: `["1","2","Fizz","4","Buzz"]`,
    },
  ],
  constraints: `
    <li class='mt-2'><code>1 &lt;= n &lt;= 100</code></li>
  `,
  order: 8,
  starterCode: starterCodeFizzBuzz,
  handlerFunction: fizzBuzzHandler,
  starterFunctionName: "function fizzBuzz(",
};
