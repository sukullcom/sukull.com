// app/(main)/lab/compLab/LeetCode/problems.ts

export type Problem = {
	id: string;
	title: string;
	difficulty: string;
	category: string;
	order: number;
	videoId?: string;
  };
  
  export const problems: Problem[] = [
	// from index.ts, keep the same "order"
	{
	  id: "two-sum",
	  title: "Two Sum",
	  difficulty: "Easy",
	  category: "Array",
	  order: 1,
	  videoId: "8-k1C6ehKuw",
	},
	{
	  id: "jump-game",
	  title: "Jump Game",
	  difficulty: "Medium",
	  category: "Dynamic Programming",
	  order: 4,
	  videoId: "",
	},
	{
	  id: "search-a-2d-matrix",
	  title: "Search a 2D Matrix",
	  difficulty: "Medium",
	  category: "Binary Search",
	  order: 5,
	  videoId: "ZfFl4torNg4",
	},
	{
	  id: "reverse-string",
	  title: "Reverse String",
	  difficulty: "Easy",
	  category: "String",
	  order: 2,
	  videoId: "",
	},
	{
	  id: "is-palindrome",
	  title: "Is Palindrome",
	  difficulty: "Easy",
	  category: "String",
	  order: 3,
	  videoId: "",
	},
  
	// 10 new Easy ones
	{
	  id: "is-even",
	  title: "Is Even",
	  difficulty: "Easy",
	  category: "Math",
	  order: 6,
	  videoId: "",
	},
	{
	  id: "is-odd",
	  title: "Is Odd",
	  difficulty: "Easy",
	  category: "Math",
	  order: 7,
	  videoId: "",
	},
	{
	  id: "fizz-buzz",
	  title: "Fizz Buzz",
	  difficulty: "Easy",
	  category: "Math",
	  order: 8,
	  videoId: "",
	},
	{
	  id: "sum-of-array",
	  title: "Sum of Array",
	  difficulty: "Easy",
	  category: "Array",
	  order: 9,
	  videoId: "",
	},
	{
	  id: "factorial",
	  title: "Factorial",
	  difficulty: "Easy",
	  category: "Math",
	  order: 10,
	  videoId: "",
	},
	{
	  id: "fibonacci",
	  title: "Fibonacci",
	  difficulty: "Easy",
	  category: "Math",
	  order: 11,
	  videoId: "",
	},
	{
	  id: "reverse-words-in-string",
	  title: "Reverse Words In String",
	  difficulty: "Easy",
	  category: "String",
	  order: 12,
	  videoId: "",
	},
	{
	  id: "anagram-check",
	  title: "Anagram Check",
	  difficulty: "Easy",
	  category: "String",
	  order: 13,
	  videoId: "",
	},
	{
	  id: "count-vowels",
	  title: "Count Vowels",
	  difficulty: "Easy",
	  category: "String",
	  order: 14,
	  videoId: "",
	},
	{
	  id: "find-max",
	  title: "Find Max",
	  difficulty: "Easy",
	  category: "Array",
	  order: 15,
	  videoId: "",
	},
  ];
  