"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { decode } from "html-entities";
import VideoPlayer from "@/components/video-player";
import LyricsGame from "../lyrics-game";
import { LoadingSpinner } from "@/components/loading-spinner";
import { CompletionModal } from "@/components/modals/completion-modal";

interface TranscriptLine {
  startTime: number;
  text: string;
}

interface LyricWord {
  word: string;
  missing: boolean;
}

interface LyricLine {
  startTime: number;
  words: LyricWord[];
}

// Predefined transcripts mapped by videoId
const predefinedTranscripts: Record<string, string[]> = {
  "0HMjTxKRbaI": [
    "We're increasingly facing burnout. How is it possible to do work that you're",
    "proud of and not feel like your job is encroaching on all parts of your life?",
    "Because it's no longer you just see me in my office looking vaguely busy.",
    "You can actually see every email I'm sending and how active I am in a Slack chat.",
    "I could do this on the way to work, on the way home from work, at home, on the weekends.", 
    "Enough is enough. We're increasingly exhausted. We have a faulty definition of",
    "productivity that we've been following, and what we need to do instead is shift our focus onto outcomes.",
    "I'm Cal Newport. I'm a computer scientist and writer. My most",
    "recent book is \"Slow Productivity: The Lost Art of Accomplishment Without Burnout.\"",
    "Slow productivity",
    "So the knowledge sector emerges in the mid-twentieth century. When it",
    "emerges, our best understanding of productivity came from manufacturing.",
    "Manufacturing, this is something that we could measure very precisely.",
    "For example, how many Model Ts are we producing per labor hour going in as input?",
    "And we had a number we could look at. Knowledge work emerges. These type of",
    "metrics don't work anymore. Because in knowledge work, we're not producing",
    "one thing. I might be working on seven or eight different things at the same time.",
    "This could be different than the seven or eight things that the person right next to me is working on.",
    "Our solution to this was to introduce a rough heuristic that I call pseudo-productivity that",
    "Pseudo-productivity",
    "said we can use visible activity as a crude proxy for useful effort. So if I see",
    "you doing things, that's better than you not doing things. Come to an office and",
    "we watch you work. If we need to be more productive, come earlier, stay later.",
    "We'll just use activity as our best marker that you're probably doing something",
    "useful. More and more of our time is focused on performing this busyness,",
    "which means less of our time is spent actually doing things that matter.",
    "So what's the solution? Slow productivity is a way of measuring useful effort",
    "that is now much more focused on the quality things you produce over time",
    "as opposed to your visible activity in the moment, and I define it to",
    "be built on three main principles. The",
    "Principle 1",
    "first is to do fewer things. Now this idea scares a lot of people when they",
    "first hear it because they interpret do fewer things to mean accomplish fewer",
    "things. What I really mean is do fewer things at once. We know this from",
    "neuroscience and organizational psychology that when you turn the target",
    "of your attention from one point to another, it takes a while for your brain",
    "to reorient. The things you're thinking about over here leaves what's known",
    "as attention residue. This is a self-imposed reduction of cognitive capacity,",
    "so you're producing worse work. Even worse, it's a psychological state that",
    "is exhausting and frustrating, so the experience of work itself just becomes",
    "subjectively very negative. So what happens if I'm working on fewer things",
    "at once? More of my day can actually be spent trying to complete commitments,",
    "which means I'm going to complete them faster. And probably the quality level",
    "is going to be higher as well because I can give them uninterrupted concentration.",
    "Principle 2",
    "The second principle is to work at a natural pace. One of the defining",
    "features of human economic activity for the last several hundred thousand",
    "years is that the seasons really matter. There was migration seasons when",
    "we were hunting. There was planting seasons. We were planting, and harvest",
    "seasons when we're harvesting, and seasons where neither of those activities",
    "were going on. We had a lot of variety throughout the year in terms of how",
    "hard we were working. I think in knowledge work, if certain times of year",
    "are more intense than others, this will lead to overall better and more",
    "sustainable outcomes. So the principle of working at a natural pace says",
    "it's okay to not redline it fifty weeks a year, five days a week. We can",
    "have busy days and less busy days. We can have busy seasons and less busy seasons.",
    "The third principle of slow productivity is to",
    "Principle 3",
    "obsess over quality. And what this means is you should identify the things",
    "you do in your work that produce the most value and really care about getting",
    "better at that. Any quest towards obsessing over quality has to start with a perhaps",
    "pretty thorough investigation of your own job. And then once you figure that out,",
    "start giving that activity as much attention as you can. For example, invest in",
    "better tools so that you can signal to yourself that you're invested in doing this",
    "thing well. I did this myself as a postdoc. I was at MIT, didn't have a ton of money",
    "at that time, but I bought a fifty-dollar lab notebook. And my idea was this is going",
    "to make me take the work I'm doing in this notebook more seriously, and it did.",
    "So something about having this more quality tool pushed me towards more quality thinking.",
    "So this idea that you want to slow down, that you want to do fewer things, that",
    "you want to have a more natural pace, this becomes very natural when you're really",
    "focused on doing what you do well. You begin to see all of those meetings and the",
    "email and the overstuffed task list not as a mark of productivity, but obstacles",
    "to what you're really trying to do. If you are embracing these principles, a few",
    "things are going to happen. The pace at which important things are finished is",
    "going to go up. The quality of what you're producing is going to go up, and the",
    "happiness is also going to go up. This is going to become a much more sustainable",
    "work environment, and you're going to be doing the work that's going to make you better."
  ],

  "dQw4w9WgXcQ": [
    "we're no strangers to love you know the rules and so do I I full",
    "commitments while I'm thinking of you wouldn't get this from any other guy",
    "I just want to tell you how I'm feeling got to make you understand",
    "Never Going To Give You Up never going to let you down never going to",
    "run around and desert you never going to make you cry never going to",
    "say goodbye never going to tell a lie and hurt you",
    "we've known each other for so long your heart's been aching but you're",
    "too sh to say it inside we both know what's been going on we know",
    "the game and we're going to playing and if you ask me how",
    "I'm feeling don't tell me you're too my you see",
    "Never Going To Give You Up never going to let you down never to",
    "run around and desert you never going to make you cry never going",
    "to say goodbye never going to tell a lie and hurt you never going",
    "to give you up never going to let you down never going to run",
    "around and desert you never going to make you cry never going",
    "to sing goodbye going to tell a lie and hurt you",
    "give you give you going to give going to give you going to give",
    "going to give you we've known each other for so long your heart's",
    "been aching but you're too sh to say inside we both know what's been",
    "going on we the game and we're going to play it",
    "I just want to tell you how I'm feeling got to make you understand",
    "Never Going To Give You Up never going to let you down never going",
    "to run around and desert you never going to make you cry never",
    "going to say goodbye never going to tell you my and Hurt You",
    "Never Going To Give You Up never going to let you down never going to",
    "run around and desert you never going to make you C never going to",
    "say goodbye never going to tell and Hur You Never Going To Give You Up",
    "never going to let you down never going to run around and desert",
    "you never going to make you going to [Music] goodbye and"
  ],

  "zQGOcOUBi6s": [
    "Every second of your life, you are under attack. Billions of bacteria,",
    "viruses, and fungi are trying to make you their home, so our bodies have",
    "developed a super complex little army with guards, soldiers, intelligence,",
    "weapons factories, and communicators to protect you from...well...dying.",
    "For this video, let's assume the immune system has 12 different jobs.",
    "For example, kill enemies, communicate, etc. And it has 21 different",
    "cells and 2 protein forces. These cells have up to 4 different jobs.",
    "Let's assign them. Here are the interactions. Now, let's make this",
    "understandable. First of all, let's add colours to the jobs. Now,",
    "let's illustrate the cells. The central colour represents the main",
    "job of the cell, while the surrounding ones represent secondary duties.",
    "Now the immune system looks like this. Now the interactions. Isn't",
    "this complexity just awesome? For this video we will only talk about",
    "these cells and ignore the rest.",
    "So, what happens in the case of an infection? *Intro* It's a beautiful",
    "day, when suddenly, a wild rusty nail appears and you cut yourself.",
    "The first barrier of the immune system is breached: your skin.",
    "Nearby bacteria seize on the opportunity and enter your wound. They start",
    "using up the body's resources and double their numbers about every 20 minutes.",
    "At first, they fly under the radar, but when a certain bacteria population",
    "is reached, they change their behavior and start to damage",
    "the body by changing the environment around them.",
    "The immune system has to stop them as fast as possible. First of all,",
    "your guard cells, known as macrophages, intervene. They are huge",
    "cells that guard every border region of the body. Most of the time, they",
    "alone can suffocate an attack because they can devour up to 100 intruders each.",
    "They swallowed the intruder whole and trap it inside a membrane. Then the",
    "enemy gets broken down by enzymes and is killed. On top of that, they",
    "cause inflammation by ordering the blood vessels to release",
    "water into the battlefield so fighting becomes easier.",
    "You notice this as a very mild swelling. When the macrophages fight",
    "for too long, they call in heavy backup by releasing",
    "messenger proteins that communicate location and urgency.",
    "Neutrophils leave their patrol routes in the blood and move to",
    "the battlefield. The neutrophils fight so furiously",
    "that they kill healthy cells in the process.",
    "On top of that, they generate barriers that trap and kill the",
    "bacteria. They are, indeed, so deadly that they evolved to",
    "commit suicide after five days to prevent them from causing too much damage.",
    "If this is not enough to stop the invasion, the brain of",
    "the immune system kicks in. The dendritic cell gets active. It reacts",
    "to the signals of the soldiers and starts collecting samples from the enemies.",
    "They rip them into pieces and present the parts on their outer layer.",
    "Now, the dendritic cell makes a crucial decision. Should they call for anti-virus",
    "forces that eradicate infected body cells or an army of bacteria killers?",
    "In this case, anti-bacteria forces are necessary. It then travels to the",
    "closest lymph node in about a day. Here, billions",
    "of helper and killer T cells are waiting to be activated.",
    "When T cells are born they go trough a difficult and complicated",
    "training process and only a quarter survives. The",
    "surviving cells are equipped with a specific set-up.",
    "And the dendritic cell is on its way looking for a helper",
    "T cell with the set-up that's just right. It's looking for",
    "a helper T cell that can bind the parts of the intruders",
    "which the dendritic cell has presented on its membrane.",
    "When it finally finds one, a chain reaction takes place. The helper",
    "T cell is activated. It quickly duplicates thousands of times.",
    "Some become memory T cells that stay in the lymph node",
    "and will make you practically immune against this enemy.",
    "Some travel to the field of battle to help out. And the third group goes on",
    "to travel to the center of the lymph node to activate a very powerful weapons factory.",
    "Like the T cells, they are born with a specific set-up and when a B cell",
    "and a T cell with the same set-up meet, hell breaks loose. The B cell",
    "duplicates rapidly and starts producing millions of little weapons.",
    "They work so hard that they would literally die from exhaustion very fast.",
    "Here, helper T cells play another important role; they stimulate the hard",
    "working factories and tell them: \"Don't die yet, we still need you, keep going!\"",
    "This also ensures that the factories die if the infection is over so the",
    "body doesn't waste energy or hurt itself. But what is produced by the B cells?",
    "You've heard of them of course, antibodies. Little proteins that are engineered",
    "to bind to the surface of the specific intruder. There are even different",
    "kinds of antibodies that have slightly different jobs.",
    "The helper T cells tell the plasma cells which type is needed the most in",
    "this particular invasion. Millions of them flood the blood and saturate the body.",
    "Meanwhile, at the site of infection, the situation is getting dire. The",
    "intruders have multiplied in number and start hurting the body. Guard and",
    "attack cells fight hard, but also die in the process.",
    "Helper T cells support them by ordering them to be more aggressive and to",
    "stay alive longer. But without help they can't overwhelm the bacteria.",
    "But now, the second line of defense arrives. Billions of antibodies flood",
    "the battlefield and disable lots of the intruders,",
    "rendering them helpless or killing them in the process.",
    "They also stun the bacteria and make them an easy target. Their back is",
    "built to connect to killer cells, so they can connect and kill the enemy more easily.",
    "Macrophages are especially good at nomming up the bacteria which antibodies",
    "have attached to. Now the balance shifts.",
    "In a team effort, the infection is wiped out. At this point, millions of body",
    "cells have already died. No big deal, the losses are quickly replenished.",
    "Most immune cells are now useless and without the constant signals",
    "they commit suicide, so as not to waste any resources.",
    "But some stay behind: the memory cells. If this enemy is encountered ever again",
    "in the future, they will be ready for it and probably kill it before you even notice.",
    "This was a very, very simplified explanation of parts of the",
    "immune system at work. Can you imagine how complex this system is, even",
    "at this level, when we ignore so many players and all the chemistry.",
    "Life is awfully complicated, but if we take the time to understand it,",
    "we'll encounter endless wonders and great beauty."
  ],
};

function generateLyricsLines(transcript: TranscriptLine[], ratio: number): LyricLine[] {
  const totalLines = transcript.length;

  let multiplier = 1.5;
  if (ratio === 0.5) {
    multiplier = 2.5;
  } else if (ratio === 0.75) {
    multiplier = 3.5;
  } else if (ratio === 1.0) {
    multiplier = 5;
  } else if (ratio === 0.25) {
    multiplier = 1.5;
  }

  const totalMissingWords = Math.round(totalLines * ratio * multiplier);

  // Split transcript into words - ensure we don't create duplicates
  const linesWords = transcript.map((line) => {
    // Clean the text and split by whitespace, filter out empty strings
    const cleanedText = line.text.trim();
    return cleanedText.split(/\s+/).filter(word => word.length > 0);
  });

  interface Candidate {
    lineIndex: number;
    wordIndex: number;
  }

  const candidates: Candidate[] = [];
  linesWords.forEach((words, lineIndex) => {
    words.forEach((word, wordIndex) => {
      // Only include words that contain only letters (no punctuation, numbers)
      const cleanWord = word.replace(/[^a-zA-Z]/g, '');
      if (cleanWord.length > 0 && /^[a-zA-Z]+$/.test(cleanWord)) {
        candidates.push({ lineIndex, wordIndex });
      }
    });
  });

  // Shuffle candidates randomly
  candidates.sort(() => Math.random() - 0.5);

  // Select required number of missing words (ensure we don't exceed available candidates)
  const chosen = candidates.slice(0, Math.min(totalMissingWords, candidates.length));

  // Create lyric lines with proper word structure
  const lyricLines: LyricLine[] = transcript.map((transcriptLine, lineIndex) => {
    const words = linesWords[lineIndex].map((word) => ({
      word: word,
      missing: false
    }));
    
    return {
      startTime: transcriptLine.startTime,
      words: words
    };
  });

  // Mark chosen words as missing
  for (const candidate of chosen) {
    const lineIndex = candidate.lineIndex;
    const wordIndex = candidate.wordIndex;
    
    if (lyricLines[lineIndex] && lyricLines[lineIndex].words[wordIndex]) {
      lyricLines[lineIndex].words[wordIndex].missing = true;
    }
  }

  return lyricLines;
}

export default function GamePage() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("videoId");
  const ratio = parseFloat(searchParams.get("ratio") || "0.5");
  const difficulty = searchParams.get("difficulty") || "Orta";
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lyricsGenerated, setLyricsGenerated] = useState(false);

  const generateNewLyrics = (trans: TranscriptLine[], r: number) => {
    const newLyrics = generateLyricsLines(trans, r);
    setLyrics(newLyrics);
    setLyricsGenerated(true);
  };

  useEffect(() => {
    const fetchTranscript = async () => {
      if (!videoId) {
        setLoading(false);
        setError("Geçersiz video ID.");
        return;
      }

      // If the videoId is predefined
      if (predefinedTranscripts[videoId]) {
        const decodedTranscript = predefinedTranscripts[videoId].map((lineText, idx) => ({
          startTime: idx * 5,
          text: decode(lineText),
        }));
        setTranscript(decodedTranscript);
        setLoading(false);
        return;
      }

      // Otherwise, fetch from API
      try {
        // Use local YouTube Transcript API
        const response = await fetch(`/api/youtube-transcript?videoId=${videoId}&lang=en`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.status === 401) {
          setError(`Oturum süreniz dolmuş. Lütfen sayfayı yenileyin ve tekrar giriş yapın.

Sayfa otomatik olarak yenilenecek...`);
          setTimeout(() => {
            window.location.reload();
          }, 3000);
          return;
        }
        
        const data = await response.json();

        if (data.transcript) {
          const decodedTranscript = data.transcript.map((line: TranscriptLine) => ({
            startTime: line.startTime,
            text: decode(line.text),
          }));
          setTranscript(decodedTranscript);
          
          // Show info about the transcript language if it's not English
          if (data.language && data.language !== 'en' && data.language !== 'default') {
            setError(`Transcript loaded in ${data.language} (English not available)`);
          }
        } else if (data.error) {
          // Handle enhanced error responses
          if (data.type === "YoutubeTranscriptError") {
            setError(`Transcript not available for this video.

${data.troubleshooting ? `Common issues:
• Video may not have captions enabled
• Video might be private or restricted  
• Try checking if captions are visible on YouTube

You can:
• Choose one of the pre-selected videos below
• Try a different YouTube video that has captions
• Check the video directly on YouTube: https://www.youtube.com/watch?v=${videoId}` : data.error}`);
          } else if (data.type === "NetworkError") {
            setError(`Connection issue: ${data.originalError || data.error}
            
Please check your internet connection and try again.`);
          } else {
            // Fallback for detailed error messages
            setError(data.error || "Failed to fetch transcript.");
          }
        } else {
          setError("No transcript data received from the server.");
        }
      } catch (err) {
        console.error("Error fetching transcript:", err);
        setError(`Network error: Could not connect to transcript service. 
        
Please check your internet connection and try again.

If the problem persists, try:
• Refreshing the page
• Using one of the pre-selected videos
• Trying again in a few minutes`);
      } finally {
        setLoading(false);
      }
    };

    fetchTranscript();
  }, [videoId]);

  // Only generate lyrics once when transcript is first loaded
  useEffect(() => {
    if (transcript.length > 0 && !lyricsGenerated) {
      generateNewLyrics(transcript, ratio);
    }
  }, [transcript, ratio, lyricsGenerated]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground text-center max-w-md">
          Transcript yükleniyor ve oyun hazırlanıyor...
        </p>
      </div>
    );
  }
  if (error && !transcript.length) return <p>{error}</p>;
  if (!transcript.length) return <p>No transcript available for this video.</p>;

  return (
    <div className="game-page" style={{maxWidth: "750px", margin: "auto" }}>
      {videoId && <VideoPlayer videoId={videoId} />}
      {error && <p className="error-message">{error}</p>}
      <LyricsGame lyrics={lyrics} difficulty={difficulty as "Kolay" | "Orta" | "Zor"} />
      <CompletionModal />
    </div>
  );
}