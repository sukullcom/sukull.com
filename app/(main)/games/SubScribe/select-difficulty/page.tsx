"use client";

import { useSearchParams, useRouter } from "next/navigation";

const difficulties = [
  { label: "Easy (25% missing words)", value: 0.25 },
  { label: "Medium (50% missing words)", value: 0.5 },
  { label: "Hard (75% missing words)", value: 0.75 },
  { label: "Extreme (100% missing words)", value: 1.0 },
];

export default function SelectDifficultyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    router.push("/");
    return null;
  }

  const handleSelect = (ratio: number) => {
    router.push(`/games/game2/game?videoId=${videoId}&ratio=${ratio}`);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "auto" }}>
      <h1 className="text-3xl font-bold mb-6">Select Difficulty</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">How Does the Game Work?</h2>
        <div className="max-h-64 overflow-y-auto grid grid-cols-1 gap-2 scrollbar-thin scrollbar-thumb-lime-500 scrollbar-track-gray-200 pr-2">
          <p>
            In this game, you'll be presented with a transcript from a YouTube
            video. Some of the words will be missing, and your job is to type in
            the correct missing words.
          </p>
          <p>
            The difficulty you choose determines how many words will be missing.
            The higher the difficulty, the more words you'll have to guess.
          </p>
          <p>
            You earn points by correctly filling in the blanks. Correct answers
            give you +2 points, while incorrect attempts temporarily deduct 1
            point. You'll see your total points at the top of the game page.
          </p>
          <p>
            Once you're done or want to stop, click the "Finish" button on the
            game page to submit your points to the database. Good luck and have
            fun!
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {difficulties.map((d) => (
          <button
            key={d.value}
            onClick={() => handleSelect(d.value)}
            className="border-2 rounded-xl p-4 shadow-lg bg-white text-left hover:bg-gray-100 transition-colors"
          >
            <span className="text-lg font-medium">{d.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
