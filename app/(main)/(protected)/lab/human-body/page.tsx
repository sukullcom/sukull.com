"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { addPointsToUser } from "@/actions/challenge-progress";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { SCORING_SYSTEM } from "@/constants";
import { LoadingSpinner } from "@/components/loading-spinner";

const videos = [
  {
    title: "Sindirim Sistemi",
    videoId: "asc9xFbbOSo",
    topic: "Sİndİrİm Sİstemİ",
    extraInfo: `
      Sindirim sistemi, yiyeceklerin parçalanarak vücudun enerji ve besin maddesi ihtiyacını karşılamak için
      gerekli bileşenlerin emilmesini sağlayan bir sistemdir. Ağızda başlayan bu süreç, yemek borusu, mide,
      ince bağırsak, kalın bağırsak ve anüs ile devam eder. Sindirim enzimleri ve kas hareketleri, bu sürecin
      temel parçalarıdır.
    `,
    hangmanWords: [
      {
        word: "kar",
        hint: "Vücudun enerji ihtiyacını karşılayan temel besin grubu",
      },
      { word: "Pro", hint: "Kasların ve dokuların temel yapı taşı" },
      { word: "yağ", hint: "Yedek enerji kaynağı olan besin grubu" },
      { word: "mide", hint: "Proteinlerin sindirime başladığı organ" },
      {
        word: "ince b",
        hint: "Besinlerin emiliminin büyük kısmının gerçekleştiği organ",
      },
    ],
  },
  {
    title: "Kalp ve Kan Akışı",
    videoId: "8n_DeE0DBXA",
    topic: "Kalp ve Kan Akışı",
    extraInfo: `
      Kalp, vücuda kan pompalayan hayati bir organdır. Kan, oksijen ve besin maddelerini taşırken atık ürünleri
      uzaklaştırır. Kalbin dört odacığı (sağ atriyum, sağ ventrikül, sol atriyum, sol ventrikül) ve kapakçıkları,
      kanın doğru yönlerde akmasını sağlar. Kalp, atardamarlar ve toplardamarlar aracılığıyla kanı dolaştırır.
    `,
    hangmanWords: [
      { word: "aorta", hint: "Vücuda kan taşıyan ana atardamar" },
      { word: "atrİyum", hint: "Kalbin kan alan odacıklarından biri" },
      { word: "ventrİkül", hint: "Kanı pompalayan kalp odacığı" },
      { word: "kapakçık", hint: "Kan akışını yönlendiren yapı" },
    ],
  },
  {
    title: "Sinir Sistemi",
    videoId: "n1JNj1UvZXQ",
    topic: "Sİnİr Sİstemİ",
    extraInfo: `
      Sinir sistemi, vücudun kontrol ve iletişim merkezidir. Merkezi sinir sistemi (beyin ve omurilik) ve çevresel
      sinir sistemi (sinirler ve gangliyonlar) olarak ikiye ayrılır. Duyusal bilgileri toplar, işler ve motor yanıtları
      koordine eder. Refleksler gibi hızlı tepkiler de sinir sistemi sayesinde gerçekleşir.
    `,
    hangmanWords: [
      { word: "beyİn", hint: "Vücudun kontrol merkezi" },
      {
        word: "omurİlİk",
        hint: "Sinir sisteminin bir parçası, sinyaller taşır",
      },
      { word: "nöron", hint: "Sinir hücresi" },
      { word: "sİnaps", hint: "Nöronlar arasındaki bağlantı noktası" },
    ],
  },
  {
    title: "Üriner Sistem",
    videoId: "oOksWYHki-s",
    topic: "Ürİner Sİstem",
    extraInfo: `
      Üriner sistem, vücuttan sıvı atıkları uzaklaştıran bir sistemdir. Böbrekler, idrar üretiminde ana rol oynar ve
      atık ürünlerin kandan filtre edilmesini sağlar. Üretilen idrar, üreterler aracılığıyla mesaneye taşınır ve buradan
      üretra yoluyla dışarı atılır.
    `,
    hangmanWords: [
      { word: "böbrek", hint: "Kanı süzen organ" },
      { word: "İdrar", hint: "Vücuttan atılan sıvı atık" },
      { word: "mesane", hint: "İdrarın depolandığı organ" },
      { word: "üreter", hint: "İdrarı böbreklerden mesaneye taşıyan kanal" },
    ],
  },
];

// Helper function for Turkish-specific case handling
const toLowerCaseTurkish = (letter: string) => {
  if (letter === "İ") return "i";
  return letter.toLowerCase();
};

const toUpperCaseTurkish = (letter: string) => {
  if (letter === "i") return "İ";
  return letter.toUpperCase();
};

const HangmanFigure = ({
  remainingAttempts,
}: {
  remainingAttempts: number;
}) => {
  const maxAttempts = 6;
  const parts = maxAttempts - remainingAttempts;

  return (
    <svg height="200" width="200" className="mx-auto">
      <line x1="20" y1="180" x2="120" y2="180" stroke="black" strokeWidth="3" />
      <line x1="70" y1="180" x2="70" y2="30" stroke="black" strokeWidth="3" />
      <line x1="70" y1="30" x2="150" y2="30" stroke="black" strokeWidth="3" />
      <line x1="150" y1="30" x2="150" y2="50" stroke="black" strokeWidth="3" />
      {parts > 0 && (
        <circle
          cx="150"
          cy="70"
          r="20"
          stroke="black"
          strokeWidth="3"
          fill="none"
        />
      )}
      {parts > 1 && (
        <line
          x1="150"
          y1="90"
          x2="150"
          y2="130"
          stroke="black"
          strokeWidth="3"
        />
      )}
      {parts > 2 && (
        <line
          x1="150"
          y1="100"
          x2="130"
          y2="120"
          stroke="black"
          strokeWidth="3"
        />
      )}
      {parts > 3 && (
        <line
          x1="150"
          y1="100"
          x2="170"
          y2="120"
          stroke="black"
          strokeWidth="3"
        />
      )}
      {parts > 4 && (
        <line
          x1="150"
          y1="130"
          x2="130"
          y2="160"
          stroke="black"
          strokeWidth="3"
        />
      )}
      {parts > 5 && (
        <line
          x1="150"
          y1="130"
          x2="170"
          y2="160"
          stroke="black"
          strokeWidth="3"
        />
      )}
    </svg>
  );
};

const HangmanGame = ({
  words,
}: {
  words: { word: string; hint: string }[];
}) => {
  const { width, height } = useWindowSize();

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [remainingAttempts, setRemainingAttempts] = useState(6);
  const [totalPoints, setTotalPoints] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);

  const turkishAlphabet = "abcçdefgğhıİjklmnoöprsştuüvyz";
  const currentWord = words[currentWordIndex]?.word || "";
  const hint = words[currentWordIndex]?.hint || "";

  const handleGuess = (letter: string) => {
    const lowerCaseLetter = toLowerCaseTurkish(letter);

    if (guessedLetters.includes(lowerCaseLetter) || remainingAttempts === 0)
      return;

    setGuessedLetters([...guessedLetters, lowerCaseLetter]);

    if (!currentWord.toLowerCase().includes(lowerCaseLetter)) {
      setRemainingAttempts(remainingAttempts - 1);
    }
  };

  const checkWordCompletion = async () => {
    const isWordGuessed = currentWord
      .toLowerCase()
      .split("")
      .every(
        (letter) =>
          letter === " " || guessedLetters.includes(toLowerCaseTurkish(letter))
      );

    if (isWordGuessed) {
      // Correct word completion
      const wordPoints = SCORING_SYSTEM.GAMES.LAB.HUMAN_BODY.CORRECT_WORD;
      await addPointsToUser(wordPoints);
      setTotalPoints((prev) => prev + wordPoints);
    } else if (remainingAttempts === 0) {
      // Failed to guess the word
      const penalty = SCORING_SYSTEM.GAMES.LAB.HUMAN_BODY.FAILED_WORD;
      await addPointsToUser(penalty);
      setTotalPoints((prev) => Math.max(0, prev + penalty)); // Don't go below 0
    }

    if (currentWordIndex + 1 === words.length) {
      // Game completed - add completion bonus if needed
      if (isWordGuessed) {
        const completionBonus = SCORING_SYSTEM.GAMES.LAB.HUMAN_BODY.COMPLETION_BONUS;
        await addPointsToUser(completionBonus);
        setTotalPoints((prev) => prev + completionBonus);
      }
      setGameFinished(true);
    } else {
      setGuessedLetters([]);
      setRemainingAttempts(6);
      setCurrentWordIndex((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (
      remainingAttempts === 0 ||
      currentWord
        .split("")
        .every(
          (letter) =>
            letter === " " ||
            guessedLetters.includes(toLowerCaseTurkish(letter))
        )
    ) {
      checkWordCompletion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingAttempts, guessedLetters]);

  if (gameFinished) {
    return (
      <div className="relative overflow-hidden w-full h-screen p-4">
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          tweenDuration={10000}
          className="absolute top-0 left-0"
        />
        <div className="border-2 rounded-xl p-6 space-y-4 shadow-lg bg-white w-full max-w-lg mx-auto text-center items-center">
          <h2 className="text-2xl font-semibold">Oyun Bitti</h2>
          <div className="flex items-center gap-x-4 w-full justify-center">
            <div className="bg-white shadow-md rounded-lg p-4">
              <p className="text-gray-700 text-sm">Toplam Puan</p>
              <p className="text-2xl font-bold text-green-600">{totalPoints}</p>
            </div>
          </div>{" "}
          <Button
            variant="primary"
            onClick={() => {
              setCurrentWordIndex(0);
              setGuessedLetters([]);
              setRemainingAttempts(6);
              setTotalPoints(0);
              setGameFinished(false);
            }}
          >
            Tekrar Oyna
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 rounded-xl p-6 space-y-2 shadow-lg bg-white w-full relative">
      {/* Points with Icon */}
      <div className="absolute top-9 right-8 flex items-center space-x-2">
        <Image src="/points.svg" alt="Points Icon" width={24} height={24} className="w-6 h-6" />
        <span className="text-lg font-bold text-neutral-700">
          {totalPoints}
        </span>
      </div>
      <h2 className="text-2xl font-semibold">Hangman Oyunu</h2>
      <HangmanFigure remainingAttempts={remainingAttempts} />
      <p className="text-gray-700 font-bold">İpucu: {hint}</p>
      <div className="flex space-x-2 text-2xl font-mono">
        {currentWord.split("").map((letter, idx) => (
          <span
            key={idx}
            className={`border-b-2 border-gray-300 w-6 text-center uppercase ${
              letter === " " ? "border-none" : ""
            }`}
          >
            {letter === " "
              ? " "
              : guessedLetters.includes(toLowerCaseTurkish(letter))
              ? letter
              : "_"}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-2">
        {turkishAlphabet.split("").map((letter) => (
          <Button
            key={letter}
            variant={
              guessedLetters.includes(toLowerCaseTurkish(letter))
                ? "ghost"
                : "primaryOutline"
            }
            disabled={guessedLetters.includes(toLowerCaseTurkish(letter))}
            onClick={() => handleGuess(letter)}
          >
            {toUpperCaseTurkish(letter)}
          </Button>
        ))}
      </div>
    </div>
  );
};

const VideoPage = () => {
  const [selectedVideo, setSelectedVideo] = useState(videos[0]);
  const router = useRouter(); // Initialize router

  return (
    <div className="min-h-screen p-6 flex flex-col items-center">
      <div className="flex justify-between w-full max-w-4xl">
        {/* Turn Back Button */}
        <Button variant="default" onClick={() => router.push("/lab")}>
          Gerİ Dön
        </Button>
      </div>
      <h1 className="text-3xl font-bold text-neutral-800 mb-8">
        Eğitim Videoları
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 w-full max-w-5xl">
        {videos.map((video) => (
          <Button
            key={video.videoId}
            variant={
              selectedVideo.videoId === video.videoId
                ? "danger"
                : "dangerOutline"
            }
            onClick={() => setSelectedVideo(video)}
          >
            {video.topic}
          </Button>
        ))}
      </div>
      <div className="border-2 rounded-xl p-6 space-y-4 shadow-lg bg-white w-full max-w-5xl mb-8">
        <h2 className="text-2xl font-semibold">{selectedVideo.title}</h2>
        <p className="text-gray-700">{selectedVideo.extraInfo}</p>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-5xl mb-8">
        <div className="w-full lg:w-2/5">
          <iframe
            width="100%"
            height="400px"
            src={`https://www.youtube.com/embed/${selectedVideo.videoId}`}
            title={selectedVideo.topic}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-lg"
          ></iframe>
        </div>
        <HangmanGame words={selectedVideo.hangmanWords} />
      </div>
      <div className="h-16" /> {/* Spacer for bottom navigator */}
    </div>
  );
};

export default VideoPage;
