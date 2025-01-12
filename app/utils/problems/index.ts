// app/utils/problems/index.ts

import { twoSum } from "./two-sum";
import { jumpGame } from "./jump-game";
import { reverseString } from "./reverse-string";
import { isPalindrome } from "./is-palindrome";
import { search2DMatrix } from "./searc-a-2d-matrix";

// New Easy Problems
import { isEven } from "./is-even";
import { isOdd } from "./is-odd";
import { fizzBuzz } from "./fizz-buzz";
import { sumOfArray } from "./sum-of-array";
import { factorial } from "./factorial";
import { fibonacci } from "./fibonacci";
import { reverseWordsInString } from "./reverse-words-in-string";
import { anagramCheck } from "./anagram-check";
import { countVowels } from "./count-vowels";
import { findMax } from "./find-max";

import { Problem } from "@/app/types/problem";

interface ProblemMap {
  [key: string]: Problem;
}

export const problems: ProblemMap = {
  "two-sum": twoSum,
  "jump-game": jumpGame,
  "search-a-2d-matrix": search2DMatrix,
  "reverse-string": reverseString,
  "is-palindrome": isPalindrome,

  // 10 new Easy problems
  "is-even": isEven,
  "is-odd": isOdd,
  "fizz-buzz": fizzBuzz,
  "sum-of-array": sumOfArray,
  "factorial": factorial,
  "fibonacci": fibonacci,
  "reverse-words-in-string": reverseWordsInString,
  "anagram-check": anagramCheck,
  "count-vowels": countVowels,
  "find-max": findMax,
};
