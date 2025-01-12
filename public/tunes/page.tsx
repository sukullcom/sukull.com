"use client";

import React from "react";

export default function PianoPage() {
  const NOTES = [
    "A0", "A#0", "B0",
    "C1", "C#1", "D1", "D#1", "E1", "F1", "F#1", "G1", "G#1", "A1", "A#1", "B1",
    "C2", "C#2", "D2", "D#2", "E2", "F2", "F#2", "G2", "G#2", "A2", "A#2", "B2",
    "C3", "C#3", "D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3",
    "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
    "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5", "A#5", "B5",
    "C6", "C#6", "D6", "D#6", "E6", "F6", "F#6", "G6", "G#6", "A6", "A#6", "B6",
    "C7", "C#7", "D7", "D#7", "E7", "F7", "F#7", "G7", "G#7", "A7", "A#7", "B7",
    "C8"
  ];

  const isBlackKey = (note: string) => note.includes('#');

  // Adjust these widths as necessary to fit all keys without scrolling
  const whiteKeyWidth = 25; 
  const blackKeyWidth = 15; 

  const whiteKeys = NOTES
    .map((note, i) => ({ note, i }))
    .filter(({ note }) => !isBlackKey(note))
    .map((w, whiteIndex) => ({ note: w.note, whiteIndex }));

  const noteToSemitone = (note: string) => {
    // C=0, C#=1, D=2, D#=3, E=4, F=5, F#=6, G=7, G#=8, A=9, A#=10, B=11
    const base = note[0];
    const sharp = note.includes('#');
    let semitoneBase = 0;
    switch (base) {
      case 'C': semitoneBase = 0; break;
      case 'D': semitoneBase = 2; break;
      case 'E': semitoneBase = 4; break;
      case 'F': semitoneBase = 5; break;
      case 'G': semitoneBase = 7; break;
      case 'A': semitoneBase = 9; break;
      case 'B': semitoneBase = 11; break;
    }
    return semitoneBase + (sharp ? 1 : 0);
  };

  const whiteKeyIndexMap: Record<string, number> = {};
  whiteKeys.forEach(wk => {
    whiteKeyIndexMap[wk.note] = wk.whiteIndex;
  });

  const blackKeys = NOTES
    .filter((note) => isBlackKey(note))
    .map((note) => {
      const st = noteToSemitone(note);
      let prevWhite = "";
      let nextWhite = "";
      switch (st % 12) {
        case 1: // C#
          prevWhite = "C";
          nextWhite = "D";
          break;
        case 3: // D#
          prevWhite = "D";
          nextWhite = "E";
          break;
        case 6: // F#
          prevWhite = "F";
          nextWhite = "G";
          break;
        case 8: // G#
          prevWhite = "G";
          nextWhite = "A";
          break;
        case 10: // A#
          prevWhite = "A";
          nextWhite = "B";
          break;
      }

      const octave = note.match(/\d+$/)?.[0] || "0";
      const findWhiteKeyIndexFor = (letter: string, oct: string): number | null => {
        const candidate = letter + oct;
        return candidate in whiteKeyIndexMap ? whiteKeyIndexMap[candidate] : null;
      };

      let wPrev = findWhiteKeyIndexFor(prevWhite, octave);
      let wNext = findWhiteKeyIndexFor(nextWhite, octave);

      // Handle cases where octave shifts between B and C:
      if ((prevWhite === "B" && nextWhite === "C") && (wPrev === null || wNext === null)) {
        if (wPrev === null) wPrev = findWhiteKeyIndexFor("B", octave);
        if (wNext === null) {
          const nextOct = (parseInt(octave) + 1).toString();
          wNext = findWhiteKeyIndexFor("C", nextOct);
        }
      }

      if (nextWhite === "C" && wNext === null) {
        const nextOct = (parseInt(octave) + 1).toString();
        wNext = findWhiteKeyIndexFor("C", nextOct);
      }

      if (wPrev === null || wNext === null) {
        // Shouldn't happen with correct data
        return { note, left: 0 };
      }

      const prevPos = wPrev * whiteKeyWidth;
      const nextPos = wNext * whiteKeyWidth;
      const blackLeft = (prevPos + nextPos) / 2 - (blackKeyWidth / 2);

      return { note, left: blackLeft };
    });

  const playNote = (note: string) => {
    // Encode the note to handle '#' properly in URLs
    const encodedNote = encodeURIComponent(note);
    const audio = new Audio(`/notes/${encodedNote}.wav`);
    audio.play();
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Piano</h1>
      <div className="relative h-48 w-full border border-gray-300 bg-gray-200">
        {/* Use flex to ensure stable horizontal alignment of white keys */}
        <div className="relative z-0 flex flex-row items-end h-full">
          {whiteKeys.map((w) => (
            <button
              key={w.note}
              onClick={() => playNote(w.note)}
              className="h-full border-l border-gray-400 bg-white hover:bg-gray-50 active:bg-gray-200"
              style={{
                width: `${whiteKeyWidth}px`
              }}
            >
              <span className="sr-only">{w.note}</span>
            </button>
          ))}
        </div>

        {/* Black keys positioned absolutely */}
        {blackKeys.map((b) => (
          <button
            key={b.note}
            onClick={() => playNote(b.note)}
            className="absolute top-0 h-28 bg-black hover:bg-gray-800 active:bg-gray-700"
            style={{
              left: `${b.left}px`,
              width: `${blackKeyWidth}px`
            }}
          >
            <span className="sr-only">{b.note}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
