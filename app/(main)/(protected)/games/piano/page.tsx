"use client";

import { useState, useEffect, useCallback } from "react";

// Define all keys
const KEYS = [
  { key: "a", type: "white" },
  { key: "w", type: "black" },
  { key: "s", type: "white" },
  { key: "e", type: "black" },
  { key: "d", type: "white" },
  { key: "f", type: "white" },
  { key: "t", type: "black" },
  { key: "g", type: "white" },
  { key: "y", type: "black" },
  { key: "h", type: "white" },
  { key: "u", type: "black" },
  { key: "j", type: "white" },
  { key: "k", type: "white" },
  { key: "o", type: "black" },
  { key: "l", type: "white" },
  { key: "p", type: "black" },
  { key: "ş", type: "white" }, // If needed, rename 'ş' to a suitable ASCII character to avoid file naming issues
];

// Define a set of pieces (songs/exercises) with their notes
const PIECES = [
  {
    name: "Kendi Kendine Çal",
    notes: [], // No predefined notes for free play
  },
  {
    name: "Yüzüklerin Efendisi",
    notes: [
      "s", "t", "h", "t", "d", "s", "t", "h", "j", "s", "w", "h", "t", "g", "t", "d", 
      "s", "d", "t", "h", "d", "t", "s", "t", "h", "j", "h", "t", "d", "s", "d", "t", 
      "h", "t", "d", "s", "t", "t", "h", "j", "s", "w", "h", "f", "d", "s", "d", "t", 
      "h", "t", "d", "s", "t", "h", "j", "j", "h", "t", "d", "s", "d", "t", "t", "j", 
    ],
  },
  {
    name: "Bella Ciao",
    notes: [
      "d","h","j","a","h","d","h","j","a","h","d","h","j","a","j","h", "d","d", "d", "s", "d", "f", "f", "d", "s", "f", "d", "d", "s", "a", "j", "d", "j", "a",  
      "d", "h", "j", "a", "h", "d", "h", "j", "a", "h", "d", "h", "j", "a", "j", "h", 
      "d", "d", "d", "s", "d", "f", "f", "d", "s", "f", "d", "s", "a", "j", "d", "j", "a"
    ],
  },
  {
    name: "First Step (Yıldızlararası)",
    notes: [
      "h", "j", "h", "j", "a", "j", "h", "j", "a", "j", "f+h", "d", "f+h", "d", 
      "g+j", "d", "g+j", "d", "h+a", "d", "h+a", "d", "g+j+s", "d", "g+j+s", "d", 
      "j", "f+h", "d", "f+h", "d", "g+j", "d", "g+j", "d", "h+a", "d", "h+a", "d", 
      "g+j+s", "d", "g+j+s", "d", "j", "h","h", "d","d", "h","h", "d","d", "j","j", "d","d", 
      "j","j", "d","d", "a","a", "d","d", "a","a", "d","d", "s","s", "d","d", "s","s", "d","d", "j","j", 
      "h","h", "d","d", "h","h", "d","d", "j","j", "d","d", "j","j", "d","d", "a","a", "d","d", "a","a", 
      "d","d", "s","s", "d","d", "s","s", "d","d", "j","j", "a+d+h", "d", "g+j", "d", "h+a", 
      "g+j+s", "h", "j", "h", "j", "a", "j", "h", "j", "a", "j", "f+h", "d", "f+h", 
      "d", "g+j", "d", "g+j", "d", "h+a", "d", "h+a", "d", "g+j+s", "d", "g+j+s", 
      "d", "j", "h","h", "d","d", "h","h", "d","d", "j","j", "d","d", "j","j", "d","d", "a","a", 
      "d","d", "a","a", "s","s", "d","d", "s","s", "d","d", "j","j", "a+d+h", "d", "g+j", "d", 
      "h+a", "g+j+s", "d", "g+j+d"
    ],
  },
  {
    name: "Für Elise",
    notes: ["d", "e", "d", "e", "d", "j", "s", "a", "h", "a", "d", "h", "j", "d", "y", "j", "a", "d", "d", "e", "d", "e", "d", "j", "s", "a", "h", "a", "d", "h", "j", "d", "a", "j", "h", "j", "a", "s", "d", "g", "f", "d", "s", "f", "d", "s", "a", "d", "s", "a", "j"],
  },
  {
    name: "Pink Panther Theme",
    notes: [
      "y", "h", "u", "j", "y", "h", "u", "j",
      "e", "d", "t", "g", "e", "d", "t", "g", "a", "j",
      "d", "g", "j", "u", "u", "g", "d", "s", "d",
      "e", "d", "t", "g", "e", "d", "t", "g", "a", "j",
      "g", "j", "d", "e",
      "e", "d", "t", "g", "e", "d", "t", "g", "a", "j",
      "d", "g", "j", "u", "u", "g", "d", "s", "d",
      "w", "s", "e", "d",
      "d", "s", "j", "h", "g", "d", "h", "h", "h", "h", "g", "d", "s", "d", "d",
      "g", "d", "s", "d", "d",
      "g", "d", "s", "d", "d",
      "e", "f"
    ],
  },
  {
    name: "Gymnopédie",
    notes: ["g", "u", "y", "g", "s", "a", "s", "e", "ş"],
  },
  {
    name: "Godfather",
    notes: [
      "h", "s", "f", "d", "s", "f", "s", "d", "s", "u", "a", "h",
      "h", "s", "f", "d", "s", "f", "s", "d", "s", "h", "y", "g",
      "g", "u", "w", "d", "g", "u", "w", "s",
      "s", "f", "a", "u", "h", "a", "u", "u", "h", "h", "w", "s",
      "s", "s", "w", "a", "d", "s", "u", "h",
      "h", "a", "h", "g", "g", "u", "y", "h",
      "h", "s", "f", "d", "s", "f", "s", "d", "s", "u", "a", "h",
      "h", "s", "f", "d", "s", "f", "s", "d", "s", "u", "a", "h",
      "g", "u", "w", "d", "g", "u", "w", "s",
      "s", "f", "a", "u", "h", "a", "u", "u", "h", "h", "w", "s",
      "s", "s", "w", "a", "d", "s", "u", "h",
      "h", "a", "h", "g", "g", "u", "y", "h",
    ],
  },
  {
    name: "Moonlight Sonata",
    notes: [
      "y", "w", "d", "y", "w", "d", "y", "w", "d", "y", "w", "d", "y", "w", "d", "y", "w", "d",
      "h", "w", "d", "h", "w", "d", "h", "s", "t", "h", "s", "t",
      "y", "j", "t", "y", "w", "d", "y", "w", "e", "t", "j", "e",
    ],
  },
  {
    name: "London Bridge",
    notes: ["g", "h", "g", "f", "d", "f", "g", "s", "d", "f", "d", "f", "g", "g", "h", "g", "f", "d", "f", "g", "s", "g", "d", "a"],
  },
  {
    name: "İyi ki Doğdun",
    notes: ["a", "a", "s", "a", "f", "d", "a", "a", "s", "a", "g", "f", "a", "a", "k", "h", "f", "d", "s", "h", "u", "u", "h", "f", "g", "f"],
  },
  {
    name: "Daha Dün Annemiz",
    notes: [
      "a", "a", "g", "g", "h", "h", "g",
      "f", "f", "d", "d", "s", "s", "a",
      "g", "g", "f", "f", "d", "d", "s",
      "g", "g", "f", "f", "d", "d", "s",
      "a", "a", "g", "g", "h", "h", "g",
      "f", "f", "d", "d", "s", "s", "a",
    ],
  },
];

export default function PianoPage() {
  const [volume, setVolume] = useState(0.5);
  const [showKeys, setShowKeys] = useState(true);

  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);

  // For chords: track which keys in the current chord are pressed
  const [pressedChordKeys, setPressedChordKeys] = useState<string[]>([]);

  // This plays the audio for a single key
  const playTune = useCallback(
    (keyChar: string) => {
      const audio = new Audio(`/tunes/${keyChar}.wav`);
      audio.volume = volume;
      audio.play().catch((err) => console.error("Audio playback error:", err));
    },
    [volume]
  );

  // If user hits a physical key, handle it
  const handleKeyPress = useCallback(
    (pressedKey: string) => {
      // If there's no piece selected, just free-play (if valid)
      if (!notes.length) {
        if (KEYS.some((k) => k.key === pressedKey)) {
          playTune(pressedKey);
        }
        return;
      }

      // We have an active piece with chords
      const currentNote = notes[currentNoteIndex];
      if (!currentNote) return;

      const chordKeys = currentNote.split("+");
      if (!chordKeys.includes(pressedKey)) {
        // The user pressed a key not in the chord; ignore
        return;
      }

      // If the pressed key is in the chord, play it
      playTune(pressedKey);

      // Add it to pressedChordKeys if not already there
      let newPressed = pressedChordKeys;
      if (!newPressed.includes(pressedKey)) {
        newPressed = [...newPressed, pressedKey];
      }

      // Check if all chord keys are pressed
      const allPressed = chordKeys.every((ck) => newPressed.includes(ck));

      // Update state
      setPressedChordKeys(newPressed);

      if (allPressed) {
        // Move to the next note
        setCurrentNoteIndex((prev) => prev + 1);
        // Reset pressedChordKeys for the next chord
        setPressedChordKeys([]);
      }
    },
    [notes, currentNoteIndex, pressedChordKeys, playTune]
  );

  // We attach a keydown listener to the document
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const pressed = e.key.toLowerCase();
      handleKeyPress(pressed);
    },
    [handleKeyPress]
  );

  // Effect: attach/detach keydown listener once we have stable handleKeyDown
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const startOver = () => {
    setCurrentNoteIndex(0);
    setPressedChordKeys([]);
  };

  const choosePiece = (pieceName: string) => {
    const piece = PIECES.find((p) => p.name === pieceName);
    if (piece) {
      setSelectedPiece(pieceName);
      setNotes(piece.notes);
      startOver();
    }
  };

  // Determine which keys (next chord) should be highlighted in green
  let nextChordKeys: string[] = [];
  if (notes.length > 0 && currentNoteIndex < notes.length) {
    nextChordKeys = notes[currentNoteIndex].split("+");
  }

  return (
    <div className="min-h-screen bg-[#fafafb] flex flex-col items-center p-4">
      <div className="bg-[#141414] rounded-2xl p-6 w-full max-w-4xl">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[#B2B2B2] gap-4">
          <h2 className="text-xl sm:text-2xl font-semibold">Sukull Piyano</h2>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-lg font-medium">Ses Yüksekliği</span>
              <input
                type="range"
                min="0"
                max="1"
                step="any"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="accent-white w-24 sm:w-32"
              />
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-lg font-medium">Tuşlar Göster</span>
              <label className="relative inline-block w-12 h-6">
                <input
                  type="checkbox"
                  checked={showKeys}
                  onChange={(e) => setShowKeys(e.target.checked)}
                  className="opacity-0 w-0 h-0 peer"
                />
                <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-[#4B4B4B] rounded-full before:content-[''] before:absolute before:h-5 before:w-5 before:bg-[#8c8c8c] before:rounded-full before:top-1/2 before:left-1 before:-translate-y-1/2 before:transition-all peer-checked:before:translate-x-6 before:duration-300 peer-checked:before:bg-white"></span>
              </label>
            </div>
          </div>
        </header>

        {/* Song selection buttons */}
        <div className="mt-4 mb-4 flex flex-wrap gap-2">
          {PIECES.map((piece) => (
            <button
              key={piece.name}
              onClick={() => choosePiece(piece.name)}
              className={`py-1 px-3 rounded border border-gray-500 hover:bg-gray-700 transition 
                ${selectedPiece === piece.name ? "bg-gray-600" : "bg-gray-800"} text-[#B2B2B2]`}
            >
              {piece.name}
            </button>
          ))}
        </div>

        {/* Start Over button if a piece is selected */}
        {notes.length > 0 && (
          <div className="mb-4">
            <button
              onClick={startOver}
              className="py-1 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Start Over
            </button>
          </div>
        )}

        {/* Info about current note */}
        {notes.length > 0 && (
          <div className="mb-4 text-white">
            <p className="mb-2">Press the highlighted keys:</p>
            <div className="flex flex-wrap gap-1">
              {notes.map((note, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 rounded ${
                    index === currentNoteIndex
                      ? "bg-green-400 text-black font-bold" // Highlight current note
                      : "bg-gray-600 text-white" // Dim other notes
                  }`}
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        )}
        {notes.length > 0 && currentNoteIndex >= notes.length && (
          <p className="text-green-300 mb-2">You finished this piece!</p>
        )}

        {/* Piano Keys Container with horizontal scroll for mobile */}
        <div className="overflow-x-auto mt-10">
          <ul className="relative flex whitespace-nowrap select-none px-2 py-4">
            {KEYS.map((k) => {
              const isWhite = k.type === "white";

              // Determine if this key should be highlighted green
              const highlight = nextChordKeys.includes(k.key);

              const baseClasses = [
                "relative cursor-pointer select-none rounded-b-md flex items-end justify-center text-sm",
              ];

              const whiteKeyClasses = [
                "bg-gradient-to-b from-white to-gray-200",
                "border border-black",
                "h-[230px] w-[70px]",
                "text-gray-600",
              ];

              const blackKeyClasses = [
                "bg-gradient-to-b from-[#333] to-black",
                "h-[140px] w-[44px]",
                "mx-[-22px]",
                "z-20",
                "text-gray-300",
              ];

              let classes = [
                ...baseClasses,
                isWhite ? whiteKeyClasses.join(" ") : blackKeyClasses.join(" "),
              ].join(" ");

              if (showKeys) {
                // Show the label in the center
                classes +=
                  " before:content-[attr(data-key)] before:absolute before:bottom-5 before:left-1/2 before:-translate-x-1/2 before:text-base";
              }

              if (highlight) {
                // Make highlighted key green
                classes += " bg-green-300 animate-pulse";
              }

              return (
                <li
                  key={k.key}
                  onClick={() => handleKeyPress(k.key)}
                  data-key={k.key}
                  className={classes}
                />
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}