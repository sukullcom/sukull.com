// Predefined transcripts for SubScribe game
// These are manually added transcripts for the three supported videos

interface TranscriptLine {
  startTime: number;
  duration?: number;
  text: string;
}

interface VideoTranscript {
  videoId: string;
  title: string;
  duration: number;
  transcript: TranscriptLine[];
  language: string;
  isAutomatic: boolean;
}

export const PREDEFINED_TRANSCRIPTS: Record<string, VideoTranscript> = {
  // Rick Astley - Never Gonna Give You Up
  "dQw4w9WgXcQ": {
    videoId: "dQw4w9WgXcQ",
    title: "Rick Astley - Never Gonna Give You Up",
    duration: 212,
    language: "en",
    isAutomatic: false,
    transcript: [
      { startTime: 0, duration: 3, text: "We're no strangers to love" },
      { startTime: 3, duration: 3, text: "You know the rules and so do I" },
      { startTime: 6, duration: 4, text: "A full commitment's what I'm thinking of" },
      { startTime: 10, duration: 4, text: "You wouldn't get this from any other guy" },
      { startTime: 14, duration: 2, text: "I just wanna tell you how I'm feeling" },
      { startTime: 16, duration: 3, text: "Gotta make you understand" },
      { startTime: 19, duration: 3, text: "Never gonna give you up" },
      { startTime: 22, duration: 3, text: "Never gonna let you down" },
      { startTime: 25, duration: 4, text: "Never gonna run around and desert you" },
      { startTime: 29, duration: 3, text: "Never gonna make you cry" },
      { startTime: 32, duration: 3, text: "Never gonna say goodbye" },
      { startTime: 35, duration: 4, text: "Never gonna tell a lie and hurt you" },
      { startTime: 39, duration: 4, text: "We've known each other for so long" },
      { startTime: 43, duration: 4, text: "Your heart's been aching but you're too shy to say it" },
      { startTime: 47, duration: 4, text: "Inside we both know what's been going on" },
      { startTime: 51, duration: 4, text: "We know the game and we're gonna play it" },
      { startTime: 55, duration: 3, text: "And if you ask me how I'm feeling" },
      { startTime: 58, duration: 3, text: "Don't tell me you're too blind to see" },
      { startTime: 61, duration: 3, text: "Never gonna give you up" },
      { startTime: 64, duration: 3, text: "Never gonna let you down" },
      { startTime: 67, duration: 4, text: "Never gonna run around and desert you" },
      { startTime: 71, duration: 3, text: "Never gonna make you cry" },
      { startTime: 74, duration: 3, text: "Never gonna say goodbye" },
      { startTime: 77, duration: 4, text: "Never gonna tell a lie and hurt you" }
    ]
  },

  // Slow Productivity (Cal Newport) - Sample transcript
  "0HMjTxKRbaI": {
    videoId: "0HMjTxKRbaI",
    title: "Slow Productivity (Cal Newport)",
    duration: 300,
    language: "en",
    isAutomatic: false,
    transcript: [
      { startTime: 0, duration: 4, text: "Welcome to this discussion about slow productivity" },
      { startTime: 4, duration: 5, text: "In our modern world we often confuse being busy with being productive" },
      { startTime: 9, duration: 4, text: "But true productivity is not about doing more things" },
      { startTime: 13, duration: 4, text: "It's about doing the right things well" },
      { startTime: 17, duration: 5, text: "Slow productivity is a philosophy that emphasizes quality over quantity" },
      { startTime: 22, duration: 4, text: "It's about focusing on what truly matters" },
      { startTime: 26, duration: 5, text: "Rather than trying to maximize the number of tasks completed" },
      { startTime: 31, duration: 4, text: "We should maximize the value we create" },
      { startTime: 35, duration: 5, text: "This means working at a sustainable pace" },
      { startTime: 40, duration: 4, text: "Taking time to think deeply about problems" },
      { startTime: 44, duration: 5, text: "And producing work that stands the test of time" },
      { startTime: 49, duration: 4, text: "The key principles of slow productivity are simple" },
      { startTime: 53, duration: 3, text: "First do fewer things" },
      { startTime: 56, duration: 4, text: "Second work at a natural pace" },
      { startTime: 60, duration: 4, text: "Third obsess over quality" },
      { startTime: 64, duration: 5, text: "When we do fewer things we can focus our attention" },
      { startTime: 69, duration: 4, text: "This leads to better results" },
      { startTime: 73, duration: 5, text: "Working at a natural pace prevents burnout" },
      { startTime: 78, duration: 4, text: "And obsessing over quality ensures lasting impact" },
      { startTime: 82, duration: 5, text: "Many successful people throughout history have embraced this approach" },
      { startTime: 87, duration: 4, text: "They understood that greatness takes time" }
    ]
  },

  // Kurzgesagt - Immune System - Sample transcript
  "zQGOcOUBi6s": {
    videoId: "zQGOcOUBi6s",
    title: "Kurzgesagt - Immune System",
    duration: 280,
    language: "en",
    isAutomatic: false,
    transcript: [
      { startTime: 0, duration: 3, text: "Your immune system is like an army" },
      { startTime: 3, duration: 4, text: "Defending your body against invading pathogens" },
      { startTime: 7, duration: 4, text: "It's incredibly complex and sophisticated" },
      { startTime: 11, duration: 5, text: "Made up of many different types of cells and molecules" },
      { startTime: 16, duration: 4, text: "The first line of defense is your skin" },
      { startTime: 20, duration: 4, text: "It acts as a physical barrier" },
      { startTime: 24, duration: 5, text: "Preventing most harmful organisms from entering your body" },
      { startTime: 29, duration: 4, text: "But some pathogens still manage to get through" },
      { startTime: 33, duration: 4, text: "When this happens your innate immune system kicks in" },
      { startTime: 37, duration: 5, text: "This is your body's immediate response to infection" },
      { startTime: 42, duration: 4, text: "White blood cells called neutrophils" },
      { startTime: 46, duration: 4, text: "Rush to the site of infection" },
      { startTime: 50, duration: 4, text: "They engulf and destroy invading bacteria" },
      { startTime: 54, duration: 5, text: "Macrophages also join the fight" },
      { startTime: 59, duration: 4, text: "These larger cells can consume many pathogens" },
      { startTime: 63, duration: 5, text: "If the innate immune system can't handle the threat" },
      { startTime: 68, duration: 4, text: "The adaptive immune system takes over" },
      { startTime: 72, duration: 4, text: "This system can remember specific pathogens" },
      { startTime: 76, duration: 5, text: "And mount a targeted response against them" },
      { startTime: 81, duration: 4, text: "B cells produce antibodies" },
      { startTime: 85, duration: 4, text: "These proteins bind to specific antigens" },
      { startTime: 89, duration: 4, text: "Marking them for destruction" },
      { startTime: 93, duration: 4, text: "T cells coordinate the immune response" },
      { startTime: 97, duration: 5, text: "Some T cells directly kill infected cells" }
    ]
  }
};

// Helper function to get transcript for a video
export function getPredefinedTranscript(videoId: string): VideoTranscript | null {
  return PREDEFINED_TRANSCRIPTS[videoId] || null;
}

// Helper function to check if a video has a predefined transcript
export function hasPredefinedTranscript(videoId: string): boolean {
  return videoId in PREDEFINED_TRANSCRIPTS;
}
