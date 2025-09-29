// Manually curated transcripts for SubScribe game
// These are the only videos that work in the game

export interface TranscriptLine {
  startTime: number;
  duration?: number;
  text: string;
}

export interface VideoData {
  videoId: string;
  title: string;
  duration: number; // in seconds
  transcript: TranscriptLine[];
  language: string;
}

export const PREDEFINED_VIDEOS: VideoData[] = [
  {
    videoId: "0HMjTxKRbaI",
    title: "Slow Productivity (Cal Newport)",
    duration: 300, // 5 minutes
    language: "en",
    transcript: [
      { startTime: 0, duration: 3, text: "Slow productivity is a philosophy for knowledge work" },
      { startTime: 3, duration: 4, text: "that emphasizes doing fewer things" },
      { startTime: 7, duration: 3, text: "at a more natural pace" },
      { startTime: 10, duration: 4, text: "while obsessing over the quality of what you produce" },
      { startTime: 14, duration: 5, text: "In our modern knowledge economy we're drowning in pseudo work" },
      { startTime: 19, duration: 4, text: "visible activity that mimics actual productive effort" },
      { startTime: 23, duration: 3, text: "but doesn't actually move the needle" },
      { startTime: 26, duration: 4, text: "on the things that matter most" },
      { startTime: 30, duration: 5, text: "The slow productivity approach suggests three core principles" },
      { startTime: 35, duration: 3, text: "First do fewer things" },
      { startTime: 38, duration: 4, text: "Focus on the small number of activities" },
      { startTime: 42, duration: 3, text: "that really matter" },
      { startTime: 45, duration: 4, text: "Second work at a natural pace" },
      { startTime: 49, duration: 4, text: "Don't rush through your important work" },
      { startTime: 53, duration: 3, text: "Take time to think and reflect" },
      { startTime: 56, duration: 4, text: "Third obsess over quality" },
      { startTime: 60, duration: 5, text: "Make sure everything you produce meets your highest standards" }
    ]
  },
  {
    videoId: "dQw4w9WgXcQ",
    title: "Never Gonna Give You Up",
    duration: 212, // 3:32 minutes
    language: "en",
    transcript: [
      { startTime: 0, duration: 3, text: "We're no strangers to love" },
      { startTime: 3, duration: 3, text: "You know the rules and so do I" },
      { startTime: 6, duration: 3, text: "A full commitment's what I'm thinking of" },
      { startTime: 9, duration: 4, text: "You wouldn't get this from any other guy" },
      { startTime: 13, duration: 2, text: "I just wanna tell you how I'm feeling" },
      { startTime: 15, duration: 2, text: "Gotta make you understand" },
      { startTime: 17, duration: 3, text: "Never gonna give you up" },
      { startTime: 20, duration: 3, text: "Never gonna let you down" },
      { startTime: 23, duration: 4, text: "Never gonna run around and desert you" },
      { startTime: 27, duration: 3, text: "Never gonna make you cry" },
      { startTime: 30, duration: 3, text: "Never gonna say goodbye" },
      { startTime: 33, duration: 4, text: "Never gonna tell a lie and hurt you" },
      { startTime: 37, duration: 3, text: "We've known each other for so long" },
      { startTime: 40, duration: 3, text: "Your heart's been aching but you're too shy to say it" },
      { startTime: 43, duration: 3, text: "Inside we both know what's been going on" },
      { startTime: 46, duration: 4, text: "We know the game and we're gonna play it" }
    ]
  },
  {
    videoId: "zQGOcOUBi6s",
    title: "Kurzgesagt - Immune System",
    duration: 360, // 6 minutes
    language: "en",
    transcript: [
      { startTime: 0, duration: 4, text: "Your immune system is your body's defense against infection" },
      { startTime: 4, duration: 3, text: "It's an incredibly complex system" },
      { startTime: 7, duration: 4, text: "that involves many different types of cells and molecules" },
      { startTime: 11, duration: 3, text: "The first line of defense is your skin" },
      { startTime: 14, duration: 4, text: "It acts as a physical barrier against harmful microorganisms" },
      { startTime: 18, duration: 3, text: "But sometimes pathogens get through" },
      { startTime: 21, duration: 4, text: "That's when your adaptive immune system kicks in" },
      { startTime: 25, duration: 3, text: "White blood cells patrol your body" },
      { startTime: 28, duration: 4, text: "looking for anything that doesn't belong there" },
      { startTime: 32, duration: 3, text: "When they find an invader" },
      { startTime: 35, duration: 4, text: "they launch a coordinated attack to eliminate it" },
      { startTime: 39, duration: 4, text: "Some cells directly attack the pathogen" },
      { startTime: 43, duration: 4, text: "while others produce antibodies to neutralize it" },
      { startTime: 47, duration: 4, text: "The immune system also has memory" },
      { startTime: 51, duration: 5, text: "If the same pathogen tries to invade again" },
      { startTime: 56, duration: 4, text: "your body can respond much faster and more effectively" }
    ]
  }
];

// Helper function to get video data by ID
export function getVideoData(videoId: string): VideoData | null {
  return PREDEFINED_VIDEOS.find(video => video.videoId === videoId) || null;
}

// Helper function to get all available video IDs
export function getAvailableVideoIds(): string[] {
  return PREDEFINED_VIDEOS.map(video => video.videoId);
}
