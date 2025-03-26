"use client";

import { useEffect, useState, useCallback } from "react";
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

// We now have 20 topics, each with 5 words => 100 total words
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
  {
    name: "Colors",
    words: [
      { english: "RED", turkish: "Kırmızı" },
      { english: "BLUE", turkish: "Mavi" },
      { english: "GREEN", turkish: "Yeşil" },
      { english: "YELLOW", turkish: "Sarı" },
      { english: "BLACK", turkish: "Siyah" },
    ],
  },
  {
    name: "Weather",
    words: [
      { english: "SUNNY", turkish: "Güneşli" },
      { english: "RAINY", turkish: "Yağmurlu" },
      { english: "CLOUDY", turkish: "Bulutlu" },
      { english: "WINDY", turkish: "Rüzgarlı" },
      { english: "SNOWY", turkish: "Karlı" },
    ],
  },
  {
    name: "BodyParts",
    words: [
      { english: "HEAD", turkish: "Baş" },
      { english: "HAND", turkish: "El" },
      { english: "FOOT", turkish: "Ayak" },
      { english: "EYE", turkish: "Göz" },
      { english: "EAR", turkish: "Kulak" },
    ],
  },
  {
    name: "Vehicles",
    words: [
      { english: "CAR", turkish: "Araba" },
      { english: "TRAIN", turkish: "Tren" },
      { english: "PLANE", turkish: "Uçak" },
      { english: "SHIP", turkish: "Gemi" },
      { english: "TRUCK", turkish: "Kamyon" },
    ],
  },
  {
    name: "Kitchen",
    words: [
      { english: "SPOON", turkish: "Kaşık" },
      { english: "FORK", turkish: "Çatal" },
      { english: "KNIFE", turkish: "Bıçak" },
      { english: "PLATE", turkish: "Tabak" },
      { english: "GLASS", turkish: "Bardak" },
    ],
  },
  {
    name: "House",
    words: [
      { english: "DOOR", turkish: "Kapı" },
      { english: "WINDOW", turkish: "Pencere" },
      { english: "ROOF", turkish: "Çatı" },
      { english: "FLOOR", turkish: "Zemin" },
      { english: "WALL", turkish: "Duvar" },
    ],
  },
  {
    name: "Music",
    words: [
      { english: "NOTE", turkish: "Nota" },
      { english: "SONG", turkish: "Şarkı" },
      { english: "DRUM", turkish: "Davul" },
      { english: "HARP", turkish: "Arp" },
      { english: "FLUTE", turkish: "Flüt" },
    ],
  },
  {
    name: "Hobbies",
    words: [
      { english: "READ", turkish: "Okumak" },
      { english: "DRAW", turkish: "Çizmek" },
      { english: "SWIM", turkish: "Yüzmek" },
      { english: "BAKE", turkish: "Fırında pişirmek" },
      { english: "GARDEN", turkish: "Bahçe ile uğraşmak" },
    ],
  },
  {
    name: "Sports",
    words: [
      { english: "SOCCER", turkish: "Futbol" },
      { english: "TENNIS", turkish: "Tenis" },
      { english: "BOXING", turkish: "Boks" },
      { english: "GOLF", turkish: "Golf" },
      { english: "CHESS", turkish: "Satranç" },
    ],
  },
  {
    name: "Emotions",
    words: [
      { english: "HAPPY", turkish: "Mutlu" },
      { english: "SAD", turkish: "Üzgün" },
      { english: "ANGRY", turkish: "Kızgın" },
      { english: "AFRAID", turkish: "Korkmuş" },
      { english: "EXCITED", turkish: "Heyecanlı" },
    ],
  },
  {
    name: "Occupations",
    words: [
      { english: "DOCTOR", turkish: "Doktor" },
      { english: "TEACHER", turkish: "Öğretmen" },
      { english: "ENGINEER", turkish: "Mühendis" },
      { english: "LAWYER", turkish: "Avukat" },
      { english: "CHEF", turkish: "Aşçı" },
    ],
  },
  {
    name: "School",
    words: [
      { english: "BOOK", turkish: "Kitap" },
      { english: "PEN", turkish: "Kalem" },
      { english: "DESK", turkish: "Sıra / Masa" },
      { english: "BOARD", turkish: "Tahta" },
      { english: "BAG", turkish: "Çanta" },
    ],
  },
  {
    name: "Technology",
    words: [
      { english: "PHONE", turkish: "Telefon" },
      { english: "LAPTOP", turkish: "Dizüstü Bilgisayar" },
      { english: "ROBOT", turkish: "Robot" },
      { english: "DRONE", turkish: "Drone" },
      { english: "SCREEN", turkish: "Ekran" },
    ],
  },
  {
    name: "Drinks",
    words: [
      { english: "WATER", turkish: "Su" },
      { english: "TEA", turkish: "Çay" },
      { english: "COFFEE", turkish: "Kahve" },
      { english: "JUICE", turkish: "Meyve Suyu" },
      { english: "MILK", turkish: "Süt" },
    ],
  },
  {
    name: "Vegetables",
    words: [
      { english: "CARROT", turkish: "Havuç" },
      { english: "TOMATO", turkish: "Domates" },
      { english: "POTATO", turkish: "Patates" },
      { english: "ONION", turkish: "Soğan" },
      { english: "PEPPER", turkish: "Biber" },
    ],
  },
  {
    name: "Countries",
    words: [
      { english: "TURKEY", turkish: "Türkiye" },
      { english: "GERMANY", turkish: "Almanya" },
      { english: "FRANCE", turkish: "Fransa" },
      { english: "CHINA", turkish: "Çin" },
      { english: "JAPAN", turkish: "Japonya" },
    ],
  },
  {
    name: "Clothes",
    words: [
      { english: "SHIRT", turkish: "Gömlek" },
      { english: "PANTS", turkish: "Pantolon" },
      { english: "SKIRT", turkish: "Etek" },
      { english: "SHOES", turkish: "Ayakkabı" },
      { english: "HAT", turkish: "Şapka" },
    ],
  },
  {
    name: "Family",
    words: [
      { english: "MOTHER", turkish: "Anne" },
      { english: "FATHER", turkish: "Baba" },
      { english: "SISTER", turkish: "Kız Kardeş" },
      { english: "BROTHER", turkish: "Erkek Kardeş" },
      { english: "CHILD", turkish: "Çocuk" },
    ],
  },
];

const SnakeGame = () => {
  const { width, height } = useWindowSize();

  // 1) We store the audio elements in these variables:
  const [eatAudioEl, , , eatAudioRef] = useAudio({
    src: "/correct.wav",
    autoPlay: false,
  });

  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [word, setWord] = useState<Word | null>(null);

  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [totalWordsCompleted, setTotalWordsCompleted] = useState(0);
  const [snake, setSnake] = useState<Position[]>([{ x: 0, y: 0 }]);
  const [direction, setDirection] =
    useState<"UP" | "DOWN" | "LEFT" | "RIGHT">("RIGHT");
  const [letterIndex, setLetterIndex] = useState<number>(1);
  const [collectedLetters, setCollectedLetters] = useState<string[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameFinished, setGameFinished] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0); // Letters for current word
  const [totalScore, setTotalScore] = useState<number>(0); // Sum of points
  const [wordCompletedFreeze, setWordCompletedFreeze] = useState<boolean>(false); // New state for freeze after word completed
  const gridSize = 10;

  // Move startNewWord function to the top to use it in dependencies
  const startNewWord = useCallback(() => {
    if (currentWordIndex + 1 >= words.length) {
      // All words done
      setGameOver(true);
      setGameFinished(true);
    } else {
      const nextIndex = currentWordIndex + 1;
      setCurrentWordIndex(nextIndex);
      const newWord = words[nextIndex];
      setWord(newWord);
      setLetterIndex(1);
      setCollectedLetters([newWord.english[0]]);
      setSnake([{ x: 0, y: 0 }]);
      setDirection("RIGHT");
      setFoodItems([]);
      setScore(0);
    }
  }, [currentWordIndex, words]);
  
  // Create moveSnake function with useCallback to fix dependency issues
  const moveSnake = useCallback(async () => {
    if (gameOver || !gameStarted || wordCompletedFreeze) return; // Don't move snake during word completion freeze

    const newHead: Position = { ...snake[0] };

    // Move based on direction
    if (direction === "UP") newHead.y -= 1;
    if (direction === "DOWN") newHead.y += 1;
    if (direction === "LEFT") newHead.x -= 1;
    if (direction === "RIGHT") newHead.x += 1;

    // Check collisions
    if (
      newHead.x < 0 ||
      newHead.x >= gridSize ||
      newHead.y < 0 ||
      newHead.y >= gridSize ||
      snake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)
    ) {
      setGameOver(true);
      setGameFinished(true);
      return;
    }

    // Check for food
    const foodEatenIndex = foodItems.findIndex(
      (item) => item.x === newHead.x && item.y === newHead.y
    );

    if (foodEatenIndex !== -1 && word) {
      const eatenFood = foodItems[foodEatenIndex];

      if (eatenFood.letter === word.english[letterIndex]) {
        // Correct letter => play "eat" sound
        eatAudioRef.current?.play();

        const newSnake = [newHead, ...snake];
        setSnake(newSnake);
        setCollectedLetters([...collectedLetters, eatenFood.letter]);
        setScore(score + 1);

        // Check if entire word is collected
        if (letterIndex + 1 >= word.english.length) {
          // Word done
          try {
            await addPointsToUser(3); // +3 points
          } catch (error) {
            console.error("Error updating points:", error);
          }

          setTotalWordsCompleted((prev) => prev + 1);
          setTotalScore((prev) => prev + 3);

          // Check if last word in topic
          if (currentWordIndex + 1 >= words.length) {
            setGameOver(true);
            setGameFinished(true);
          } else {
            // Instead of immediately going to next word, set the freeze state
            setWordCompletedFreeze(true);
          }
          return;
        } else {
          // Move to next letter
          setLetterIndex(letterIndex + 1);
        }
      } else {
        // Wrong letter => game over
        setGameOver(true);
        setGameFinished(true);
        return;
      }
    } else {
      // Move snake normally
      const newSnake = [newHead, ...snake.slice(0, snake.length - 1)];
      setSnake(newSnake);
    }
  }, [
    gameOver, 
    gameStarted, 
    wordCompletedFreeze, 
    snake, 
    direction, 
    gridSize, 
    foodItems, 
    word, 
    letterIndex, 
    eatAudioRef, 
    collectedLetters, 
    score, 
    currentWordIndex, 
    words.length
  ]);

  // Key press: arrow keys
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Prevent default scrolling behavior for arrow keys
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
    }
    
    setDirection((prevDirection) => {
      if (event.key === "ArrowUp" && prevDirection !== "DOWN") return "UP";
      if (event.key === "ArrowDown" && prevDirection !== "UP") return "DOWN";
      if (event.key === "ArrowLeft" && prevDirection !== "RIGHT") return "LEFT";
      if (event.key === "ArrowRight" && prevDirection !== "LEFT")
        return "RIGHT";
      return prevDirection;
    });
  }, []);

  // Touch controls
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

  // Adjust the volume of the eat sound (once it's in the DOM)
  useEffect(() => {
    if (eatAudioRef.current) {
      eatAudioRef.current.volume = 0.5;
    }
  }, [eatAudioRef]);

  // Create multiple letters, ensuring correct letter is included
  const generateFoodItems = () => {
    if (!word) return;
    const items: FoodItem[] = [];

    // Helper function to check if a position is in the respawn area (top-left 3x3)
    const isInRespawnArea = (pos: Position) => pos.x < 3 && pos.y < 3;
    
    // Helper function to check if a position is too close to existing items
    const isTooCloseToOtherItems = (pos: Position) => {
      // Check if the position is adjacent to any existing item (including diagonals)
      return items.some(item => {
        const distanceX = Math.abs(item.x - pos.x);
        const distanceY = Math.abs(item.y - pos.y);
        // Consider positions adjacent if they are 1 cell away (including diagonals)
        return distanceX <= 1 && distanceY <= 1;
      });
    };

    // correct letter
    let correctPos: Position;
    do {
      correctPos = {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize),
      };
    } while (
      snake.some((seg) => seg.x === correctPos.x && seg.y === correctPos.y) ||
      isInRespawnArea(correctPos) // Avoid respawn area for correct letter
    );

    items.push({
      ...correctPos,
      letter: word.english[letterIndex],
    });

    // random letters
    for (let i = 0; i < 4; i++) {
      let position: Position;
      let attempts = 0;
      const maxAttempts = 100; // Limit attempts to prevent infinite loops
      
      do {
        position = {
          x: Math.floor(Math.random() * gridSize),
          y: Math.floor(Math.random() * gridSize),
        };
        attempts++;
        
        // If we've tried too many times and can't find a suitable position, break the loop
        if (attempts > maxAttempts) {
          console.log("Could not find suitable position after many attempts");
          break;
        }
      } while (
        snake.some((seg) => seg.x === position.x && seg.y === position.y) ||
        items.some((item) => item.x === position.x && item.y === position.y) ||
        isInRespawnArea(position) || // Avoid respawn area for random letters
        isTooCloseToOtherItems(position) // Ensure letters aren't too close to each other
      );
      
      // Only add the letter if a suitable position was found
      if (attempts <= maxAttempts) {
        items.push({
          ...position,
          letter: String.fromCharCode(65 + Math.floor(Math.random() * 26)),
        });
      }
    }

    setFoodItems(items);
  };

  // Interval for moving snake
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const interval = setInterval(() => {
      moveSnake();
    }, 200);
    return () => clearInterval(interval);
  }, [snake, direction, gameOver, gameStarted, moveSnake]);

  // Keydown for arrow control
  useEffect(() => {
    if (!gameStarted) return;
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameStarted, handleKeyPress]);

  // Generate initial letters
  useEffect(() => {
    if (gameStarted) {
      generateFoodItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted]);

  // Generate new letters when letterIndex changes
  useEffect(() => {
    if (!gameOver && word && letterIndex < word.english.length && gameStarted) {
      generateFoodItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letterIndex]);

  // Reset collected letters when a new word is set
  useEffect(() => {
    if ((gameStarted || countdown !== null) && word) {
      setCollectedLetters([word.english[0]]);
      setLetterIndex(1);
      generateFoodItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word]);

  // Add startNewWord to dependency array
  useEffect(() => {
    if (!wordCompletedFreeze) return;
    
    // Log for debugging
    console.log("Word completed, transitioning to next word after 1 second");
    
    const timer = setTimeout(() => {
      setWordCompletedFreeze(false);
      startNewWord(); // Move to next word after freeze
      console.log("Starting new word after freeze");
    }, 1000); // 1 second freeze
    
    return () => clearTimeout(timer);
  }, [wordCompletedFreeze, startNewWord]);

  // Countdown effect
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Done => game starts
      setCountdown(null);
      setGameStarted(true);
    }
  }, [countdown]);

  // Reset everything
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
    setGameFinished(false);
    setFoodItems([]);
    setGameStarted(false);
    setCountdown(null);
  };

  if (gameFinished) {
    // End screen
    return (
      <>

        <div className="relative overflow-hidden w-full h-screen p-4">
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

              <Link href={"/games"} prefetch={false}>
                <Button variant={"danger"}>Oyunu Bitir</Button>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Game board
  const renderGrid = () => {
    const grid = [];
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
    <>
      {/* 2) Render eat audio element so it exists in DOM */}
      {eatAudioEl}

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
                      setCountdown(3); // Start from 3
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
              {word && (
                <>
                  <h2 className="text-xl font-medium mb-2">
                    Kelime: {word.english}
                  </h2>
                  <h2 className="text-xl font-medium mb-2">
                    Çevirisi: {word.turkish}
                  </h2>
                </>
              )}

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
                // Countdown overlay
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-75">
                  <h2 className="text-5xl font-bold mb-4">{countdown}</h2>
                  <p className="text-lg">Hazırlanın, oyun başlıyor!</p>
                </div>
              ) : wordCompletedFreeze ? (
                // Word completed overlay
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-75">
                  <h2 className="text-3xl font-bold mb-4">✓</h2>
                  <p className="text-lg">Kelime tamamlandı!</p>
                </div>
              ) : (
                // On-Screen Controls
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
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default SnakeGame;