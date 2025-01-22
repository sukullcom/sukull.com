"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { addPointsToUser } from "@/actions/challenge-progress";
import Confetti from "react-confetti";
import { useAudio, useWindowSize } from "react-use";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Position {
  x: number;
  y: number;
}

interface FoodItem extends Position {
  letter: string;
}

interface Word {
  english: string;
  turkish: string;
}

interface Topic {
  name: string;
  words: Word[];
}

const topics: Topic[] = [
  {
    name: "Animals",
    words: [
      { english: "DOG", turkish: "Köpek" },
      { english: "CAT", turkish: "Kedi" },
      { english: "LION", turkish: "Aslan" },
      { english: "TIGER", turkish: "Kaplan" },
      { english: "BEAR", turkish: "Ayı" },
    ],
  },
  {
    name: "Fruits",
    words: [
      { english: "APPLE", turkish: "Elma" },
      { english: "BANANA", turkish: "Muz" },
      { english: "ORANGE", turkish: "Portakal" },
      { english: "GRAPE", turkish: "Üzüm" },
      { english: "MANGO", turkish: "Mango" },
    ],
  },
  // Add more topics here
];

const SnakeGame = () => {
  const router = useRouter();
  const [finishAudio] = useAudio({ src: "/finish.mp3", autoPlay: true });
  const { width, height } = useWindowSize();

  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [word, setWord] = useState<Word | null>(null);

  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showCongrats, setShowCongrats] = useState(false);
  const [totalWordsCompleted, setTotalWordsCompleted] = useState(0);
  const [snake, setSnake] = useState<Position[]>([{ x: 0, y: 0 }]);
  const [direction, setDirection] = useState<"UP" | "DOWN" | "LEFT" | "RIGHT">(
    "RIGHT"
  );
  const [letterIndex, setLetterIndex] = useState<number>(1);
  const [collectedLetters, setCollectedLetters] = useState<string[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameFinished, setGameFinished] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0); // Letters collected in current word
  const [totalScore, setTotalScore] = useState<number>(0); // Total points earned
  const gridSize = 10;

  // Handle key press for snake direction
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    setDirection((prevDirection) => {
      if (event.key === "ArrowUp" && prevDirection !== "DOWN") return "UP";
      if (event.key === "ArrowDown" && prevDirection !== "UP") return "DOWN";
      if (event.key === "ArrowLeft" && prevDirection !== "RIGHT") return "LEFT";
      if (event.key === "ArrowRight" && prevDirection !== "LEFT") return "RIGHT";
      return prevDirection;
    });
  }, []);

  // Handle touch controls for snake direction
  const handleDirectionChange = (
    newDirection: "UP" | "DOWN" | "LEFT" | "RIGHT"
  ) => {
    setDirection((prevDirection) => {
      if (
        (newDirection === "UP" && prevDirection !== "DOWN") ||
        (newDirection === "DOWN" && prevDirection !== "UP") ||
        (newDirection === "LEFT" && prevDirection !== "RIGHT") ||
        (newDirection === "RIGHT" && prevDirection !== "LEFT")
      ) {
        return newDirection;
      }
      return prevDirection;
    });
  };

  const startNewWord = () => {
    if (currentWordIndex + 1 >= words.length) {
      // All words completed
      setGameOver(true);
      setShowCongrats(true);
      setGameFinished(true);
    } else {
      // Move to the next word
      const nextIndex = currentWordIndex + 1;
      setCurrentWordIndex(nextIndex);
      const newWord = words[nextIndex];
      setWord(newWord);
      setLetterIndex(1);
      setCollectedLetters([newWord.english[0]]);
      setSnake([{ x: 0, y: 0 }]);
      setDirection("RIGHT");
      setFoodItems([]);
      setScore(0); // Reset score for new word
    }
  };

  // Load the eat sound effect
  const [eatAudio, , , eatAudioRef] = useAudio({
    src: "/correct.wav",
    autoPlay: false,
  });

  // Adjust the volume of the eat sound
  useEffect(() => {
    if (eatAudioRef.current) {
      eatAudioRef.current.volume = 0.5; // Volume between 0.0 and 1.0
    }
  }, [eatAudioRef]);

  const moveSnake = async () => {
    if (gameOver || !gameStarted) return;

    let newHead: Position = { ...snake[0] };

    // Move the snake based on the current direction
    if (direction === "UP") newHead.y -= 1;
    if (direction === "DOWN") newHead.y += 1;
    if (direction === "LEFT") newHead.x -= 1;
    if (direction === "RIGHT") newHead.x += 1;

    // Check if the snake hits the wall or itself
    if (
      newHead.x < 0 ||
      newHead.x >= gridSize ||
      newHead.y < 0 ||
      newHead.y >= gridSize ||
      snake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)
    ) {
      setGameOver(true);
      setShowCongrats(true);
      setGameFinished(true);
      return;
    }

    // Check if snake eats any food item
    const foodEatenIndex = foodItems.findIndex(
      (item) => item.x === newHead.x && item.y === newHead.y
    );

    if (foodEatenIndex !== -1) {
      const eatenFood = foodItems[foodEatenIndex];

      if (eatenFood.letter === word!.english[letterIndex]) {
        // Correct letter collected
        // Play eat sound
        eatAudioRef.current?.play();

        const newSnake = [newHead, ...snake];
        setSnake(newSnake);
        setCollectedLetters([...collectedLetters, eatenFood.letter]);
        setScore(score + 1); // Increment score for current word

        if (letterIndex + 1 >= word!.english.length) {
          // Word completed
          try {
            await addPointsToUser(3); // Add 3 points to the database
            console.log("Points updated successfully!");
          } catch (error) {
            console.error("Error updating points:", error);
          }

          setTotalWordsCompleted(totalWordsCompleted + 1);
          setTotalScore(totalScore + 3); // Update totalScore by 3 points

          if (currentWordIndex + 1 >= words.length) {
            // All words completed
            setGameOver(true);
            setShowCongrats(true);
            setGameFinished(true);
          } else {
            // Prepare for the next word
            startNewWord();
          }
          return;
        } else {
          setLetterIndex(letterIndex + 1);
        }
      } else {
        // Wrong letter, game over
        setGameOver(true);
        setShowCongrats(true);
        setGameFinished(true);
        return;
      }
    } else {
      // Move snake normally (without growing)
      const newSnake = [newHead, ...snake.slice(0, snake.length - 1)];
      setSnake(newSnake);
    }
  };

  // Generate multiple food items (letters), ensuring correct letter is included
  const generateFoodItems = () => {
    if (!word) return;
    let items: FoodItem[] = [];

    // Generate the correct letter
    let correctPosition: Position;
    do {
      correctPosition = {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize),
      };
    } while (
      snake.some(
        (segment) =>
          segment.x === correctPosition.x && segment.y === correctPosition.y
      )
    );

    items.push({
      ...correctPosition,
      letter: word.english[letterIndex],
    });

    // Generate random letters
    for (let i = 0; i < 4; i++) {
      let position: Position;
      do {
        position = {
          x: Math.floor(Math.random() * gridSize),
          y: Math.floor(Math.random() * gridSize),
        };
      } while (
        snake.some(
          (segment) => segment.x === position.x && segment.y === position.y
        ) ||
        items.some((item) => item.x === position.x && item.y === position.y)
      );

      items.push({
        ...position,
        letter: String.fromCharCode(65 + Math.floor(Math.random() * 26)),
      });
    }

    setFoodItems(items);
  };

  // Game loop
  useEffect(() => {
    if (gameOver || !gameStarted) return;

    const interval = setInterval(() => {
      moveSnake();
    }, 200);

    return () => clearInterval(interval);
  }, [snake, direction, gameOver, gameStarted]);

  // Listen for key presses
  useEffect(() => {
    if (!gameStarted) return;

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress, gameStarted]);

  // Generate initial food items
  useEffect(() => {
    if (gameStarted) {
      generateFoodItems();
    }
  }, [gameStarted]);

  // Generate new food items when letterIndex changes
  useEffect(() => {
    if (!gameOver && word && letterIndex < word.english.length && gameStarted) {
      generateFoodItems();
    }
  }, [letterIndex, gameOver, gameStarted]);

  // When word changes, reset the collected letters
  useEffect(() => {
    if ((gameStarted || countdown !== null) && word) {
      setCollectedLetters([word.english[0]]);
      setLetterIndex(1);
      generateFoodItems();
    }
  }, [word, gameStarted, countdown]);

  // Countdown effect
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown finished, start the game
      setCountdown(null);
      setGameStarted(true);
    }
  }, [countdown]);

  // Reset the game to play again
  const playAgain = () => {
    setSelectedTopic(null);
    setWords([]);
    setCurrentWordIndex(0);
    setWord(null);
    setSnake([{ x: 0, y: 0 }]);
    setDirection("RIGHT");
    setLetterIndex(1);
    setCollectedLetters([]);
    setGameOver(false);
    setScore(0);
    setTotalScore(0);
    setTotalWordsCompleted(0);
    setShowCongrats(false);
    setFoodItems([]);
    setGameStarted(false); // Return to start screen
    setGameFinished(false); // Reset game finished state
    setCountdown(null);
  };

  if (gameFinished) {
    return (
      <div className="relative overflow-hidden w-full h-screen p-4">
        {finishAudio}
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          tweenDuration={10000}
          className="absolute top-0 left-0"
        />
        <div className="flex flex-col gap-y-4 lg:gap-y-8 max-w-lg mx-auto text-center items-center">
          <Image
            src="/finish.svg"
            alt="Finish"
            className="hidden lg:block mt-40"
            height={100}
            width={100}
          />
          <Image
            src="/finish.svg"
            alt="Finish"
            className="block lg:hidden mt-40"
            height={60}
            width={60}
          />
          <h1 className="text-xl lg:text-3xl font-bold text-neutral-700">
            {totalWordsCompleted > 0
              ? "Tebrikler! Oyunu tamamladınız."
              : "Neredeyse oluyordu!"}
          </h1>
          <div className="flex items-center gap-x-4 w-full justify-center">
            <div className="bg-white shadow-md rounded-lg p-4">
              <p className="text-gray-700 text-sm">Toplam Puan</p>
              <p className="text-2xl font-bold text-green-600">{totalScore}</p>
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <Button variant={"secondary"} onClick={playAgain}>
              Tekrar Oyna
            </Button>

            <Link href={"/games"}>
              <Button variant={"danger"}>Oyunu Bitir</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render the grid, snake, and food items
  const renderGrid = () => {
    let grid = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const isSnake = snake.some(
          (segment) => segment.x === x && segment.y === y
        );
        const foodItem = foodItems.find(
          (item) => item.x === x && item.y === y
        );
        grid.push(
          <div
            key={`${x}-${y}`}
            className={`w-8 h-8 border ${
              isSnake ? "bg-green-500" : foodItem ? "bg-red-500" : ""
            }`}
          >
            {isSnake && (
              <p className="text-center text-white text-lg">
                {
                  collectedLetters[
                    snake.findIndex(
                      (segment) => segment.x === x && segment.y === y
                    )
                  ]
                }
              </p>
            )}
            {foodItem && (
              <p className="text-center text-white text-lg">
                {foodItem.letter}
              </p>
            )}
          </div>
        );
      }
    }
    return grid;
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      <div className="flex flex-col items-center mt-10">
        <h1 className="text-2xl font-bold mb-4">Kelime ve Yılan Oyunu</h1>

        {!gameStarted && countdown === null ? (
          // Start Screen
          <div className="text-center">
            {!selectedTopic ? (
              <>
                <p className="text-lg mb-4">Lütfen bir konu seçin:</p>
                <div className="grid grid-cols-2 gap-2">
                  {topics.map((topic) => (
                    <Button
                      key={topic.name}
                      variant="secondary"
                      onClick={() => setSelectedTopic(topic)}
                    >
                      {topic.name}
                    </Button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-lg mb-4">
                  Seçilen Konu: <strong>{selectedTopic.name}</strong>
                </p>
                <Button
                  variant="super"
                  onClick={() => {
                    // Start countdown from 3
                    setCountdown(3);
                    // Initialize other necessary state variables
                    setWords(selectedTopic.words);
                    setWord(selectedTopic.words[0]);
                    setCollectedLetters([selectedTopic.words[0].english[0]]);
                    setSnake([{ x: 0, y: 0 }]);
                    setDirection("RIGHT");
                    setLetterIndex(1);
                  }}
                >
                  Oyuna Başla
                </Button>
              </>
            )}
          </div>
        ) : (
          // Game Screen
          <>
            {eatAudio}
            {word && (
              <>
                <h2 className="text-xl font-medium mb-2">
                  Kelime: {word.english}
                </h2>
                <h2 className="text-xl font-medium mb-2">
                  Anlam: {word.turkish}
                </h2>

                {/* Removed the display of collected letters, next letter, and total score */}
              </>
            )}

            {/* Display the game grid */}
            <div
              className="grid grid-cols-10 gap-0"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                gridTemplateRows: `repeat(${gridSize}, 1fr)`,
              }}
            >
              {renderGrid()}
            </div>

            {countdown !== null ? (
              // Countdown Overlay
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-75">
                <h2 className="text-5xl font-bold mb-4">{countdown}</h2>
                <p className="text-lg">Hazırlanın, oyun başlıyor!</p>
              </div>
            ) : (
              // On-Screen Controls (if game is started)
              <>
                {/* On-Screen Controls */}
                <div className="mt-4 flex flex-col items-center">
                  <div className="flex">
                    <Button
                      variant="super"
                      onClick={() => handleDirectionChange("UP")}
                      className="m-1 text-3xl w-16 h-16 flex items-center justify-center"
                    >
                      ↑
                    </Button>
                  </div>
                  <div className="flex">
                    <Button
                      variant="super"
                      onClick={() => handleDirectionChange("LEFT")}
                      className="m-1 text-3xl w-16 h-16 flex items-center justify-center"
                    >
                      ←
                    </Button>
                    <Button
                      variant="super"
                      onClick={() => handleDirectionChange("DOWN")}
                      className="m-1 text-3xl w-16 h-16 flex items-center justify-center"
                    >
                      ↓
                    </Button>
                    <Button
                      variant="super"
                      onClick={() => handleDirectionChange("RIGHT")}
                      className="m-1 text-3xl w-16 h-16 flex items-center justify-center"
                    >
                      →
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SnakeGame;
