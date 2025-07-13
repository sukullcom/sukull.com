"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { SCORING_SYSTEM } from "@/constants";
import { addPointsToUser } from "@/actions/challenge-progress";
import Confetti from "react-confetti";
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
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

interface Topic {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  words: Word[];
  sentences?: {
    english: string;
    turkish: string;
    words: string[];
  }[];
}

const topics: Topic[] = [
  // BEGINNER LEVEL
  {
    name: "Colors",
    level: "beginner",
    words: [
      { english: "RED", turkish: "Kırmızı", difficulty: "beginner" },
      { english: "BLUE", turkish: "Mavi", difficulty: "beginner" },
      { english: "GREEN", turkish: "Yeşil", difficulty: "beginner" },
      { english: "YELLOW", turkish: "Sarı", difficulty: "beginner" },
      { english: "BLACK", turkish: "Siyah", difficulty: "beginner" },
      { english: "WHITE", turkish: "Beyaz", difficulty: "beginner" },
      { english: "ORANGE", turkish: "Turuncu", difficulty: "beginner" },
      { english: "PURPLE", turkish: "Mor", difficulty: "beginner" },
      { english: "PINK", turkish: "Pembe", difficulty: "beginner" },
      { english: "BROWN", turkish: "Kahverengi", difficulty: "beginner" },
    ],
    sentences: [
      {
        english: "I really like blue colors",
        turkish: "Mavi renkleri gerçekten severim",
        words: ["I", "REALLY", "LIKE", "BLUE", "COLORS"]
      },
      {
        english: "Have you seen the red car",
        turkish: "Kırmızı arabayı gördün mü",
        words: ["HAVE", "YOU", "SEEN", "THE", "RED", "CAR"]
      },
      {
        english: "The green trees are very beautiful",
        turkish: "Yeşil ağaçlar çok güzel",
        words: ["THE", "GREEN", "TREES", "ARE", "VERY", "BEAUTIFUL"]
      }
    ]
  },
  {
    name: "Animals",
    level: "beginner",
    words: [
      { english: "CAT", turkish: "Kedi", difficulty: "beginner" },
      { english: "DOG", turkish: "Köpek", difficulty: "beginner" },
      { english: "BIRD", turkish: "Kuş", difficulty: "beginner" },
      { english: "FISH", turkish: "Balık", difficulty: "beginner" },
      { english: "HORSE", turkish: "At", difficulty: "beginner" },
      { english: "COW", turkish: "İnek", difficulty: "beginner" },
      { english: "PIG", turkish: "Domuz", difficulty: "beginner" },
      { english: "SHEEP", turkish: "Koyun", difficulty: "beginner" },
      { english: "RABBIT", turkish: "Tavşan", difficulty: "beginner" },
      { english: "MOUSE", turkish: "Fare", difficulty: "beginner" },
    ],
    sentences: [
      {
        english: "The cat is sleeping",
        turkish: "Kedi uyuyor",
        words: ["THE", "CAT", "IS", "SLEEPING"]
      },
      {
        english: "Dogs like to play",
        turkish: "Köpekler oynamayı sever",
        words: ["DOGS", "LIKE", "TO", "PLAY"]
      },
      {
        english: "Fish swim in water",
        turkish: "Balıklar suda yüzer",
        words: ["FISH", "SWIM", "IN", "WATER"]
      }
    ]
  },
  {
    name: "Numbers",
    level: "beginner",
    words: [
      { english: "ONE", turkish: "Bir", difficulty: "beginner" },
      { english: "TWO", turkish: "İki", difficulty: "beginner" },
      { english: "THREE", turkish: "Üç", difficulty: "beginner" },
      { english: "FOUR", turkish: "Dört", difficulty: "beginner" },
      { english: "FIVE", turkish: "Beş", difficulty: "beginner" },
      { english: "SIX", turkish: "Altı", difficulty: "beginner" },
      { english: "SEVEN", turkish: "Yedi", difficulty: "beginner" },
      { english: "EIGHT", turkish: "Sekiz", difficulty: "beginner" },
      { english: "NINE", turkish: "Dokuz", difficulty: "beginner" },
      { english: "TEN", turkish: "On", difficulty: "beginner" },
    ],
    sentences: [
      {
        english: "I have three cats",
        turkish: "Üç kedim var",
        words: ["I", "HAVE", "THREE", "CATS"]
      }
    ]
  },
  {
    name: "Food",
    level: "beginner",
    words: [
      { english: "APPLE", turkish: "Elma", difficulty: "beginner" },
      { english: "BREAD", turkish: "Ekmek", difficulty: "beginner" },
      { english: "MILK", turkish: "Süt", difficulty: "beginner" },
      { english: "WATER", turkish: "Su", difficulty: "beginner" },
      { english: "RICE", turkish: "Pirinç", difficulty: "beginner" },
      { english: "MEAT", turkish: "Et", difficulty: "beginner" },
      { english: "CHEESE", turkish: "Peynir", difficulty: "beginner" },
      { english: "EGG", turkish: "Yumurta", difficulty: "beginner" },
      { english: "BANANA", turkish: "Muz", difficulty: "beginner" },
      { english: "ORANGE", turkish: "Portakal", difficulty: "beginner" },
    ],
    sentences: [
      {
        english: "I eat apples every day",
        turkish: "Her gün elma yerim",
        words: ["I", "EAT", "APPLES", "EVERY", "DAY"]
      },
      {
        english: "Bread and milk are healthy",
        turkish: "Ekmek ve süt sağlıklı",
        words: ["BREAD", "AND", "MILK", "ARE", "HEALTHY"]
      }
    ]
  },
  {
    name: "Family",
    level: "beginner",
    words: [
      { english: "MOTHER", turkish: "Anne", difficulty: "beginner" },
      { english: "FATHER", turkish: "Baba", difficulty: "beginner" },
      { english: "SISTER", turkish: "Kız Kardeş", difficulty: "beginner" },
      { english: "BROTHER", turkish: "Erkek Kardeş", difficulty: "beginner" },
      { english: "BABY", turkish: "Bebek", difficulty: "beginner" },
      { english: "CHILD", turkish: "Çocuk", difficulty: "beginner" },
      { english: "FAMILY", turkish: "Aile", difficulty: "beginner" },
      { english: "LOVE", turkish: "Sevgi", difficulty: "beginner" },
      { english: "HOME", turkish: "Ev", difficulty: "beginner" },
      { english: "GRANDMA", turkish: "Büyükanne", difficulty: "beginner" },
    ],
    sentences: [
      {
        english: "I love my family",
        turkish: "Ailemi seviyorum",
        words: ["I", "LOVE", "MY", "FAMILY"]
      },
      {
        english: "Mother cooks good food",
        turkish: "Anne iyi yemek yapar",
        words: ["MOTHER", "COOKS", "GOOD", "FOOD"]
      }
    ]
  },

  // INTERMEDIATE LEVEL
  {
    name: "Travel",
    level: "intermediate", 
    words: [
      { english: "ISTANBUL", turkish: "İstanbul", difficulty: "intermediate" },
      { english: "ANKARA", turkish: "Ankara", difficulty: "intermediate" },
      { english: "AIRPORT", turkish: "Havalimanı", difficulty: "intermediate" },
      { english: "HOTEL", turkish: "Otel", difficulty: "intermediate" },
      { english: "VACATION", turkish: "Tatil", difficulty: "intermediate" },
      { english: "TRAVEL", turkish: "Seyahat", difficulty: "intermediate" },
      { english: "PASSPORT", turkish: "Pasaport", difficulty: "intermediate" },
      { english: "TICKET", turkish: "Bilet", difficulty: "intermediate" },
      { english: "SUITCASE", turkish: "Valiz", difficulty: "intermediate" },
      { english: "JOURNEY", turkish: "Yolculuk", difficulty: "intermediate" },
    ],
    sentences: [
      {
        english: "Have you ever been to Istanbul",
        turkish: "İstanbul'a hiç gittin mi",
        words: ["HAVE", "YOU", "EVER", "BEEN", "TO", "ISTANBUL"]
      },
      {
        english: "I want to visit Turkey soon",
        turkish: "Yakında Türkiye'yi ziyaret etmek istiyorum",
        words: ["I", "WANT", "TO", "VISIT", "TURKEY", "SOON"]
      },
      {
        english: "We are going on vacation today",
        turkish: "Bugün tatile gidiyoruz",
        words: ["WE", "ARE", "GOING", "ON", "VACATION", "TODAY"]
      }
    ]
  },
  {
    name: "Body Parts",
    level: "intermediate",
    words: [
      { english: "HEAD", turkish: "Kafa", difficulty: "intermediate" },
      { english: "HAND", turkish: "El", difficulty: "intermediate" },
      { english: "FOOT", turkish: "Ayak", difficulty: "intermediate" },
      { english: "EYE", turkish: "Göz", difficulty: "intermediate" },
      { english: "NOSE", turkish: "Burun", difficulty: "intermediate" },
      { english: "MOUTH", turkish: "Ağız", difficulty: "intermediate" },
      { english: "ARM", turkish: "Kol", difficulty: "intermediate" },
      { english: "LEG", turkish: "Bacak", difficulty: "intermediate" },
      { english: "FINGER", turkish: "Parmak", difficulty: "intermediate" },
      { english: "SHOULDER", turkish: "Omuz", difficulty: "intermediate" },
    ],
    sentences: [
      {
        english: "Wash your hands",
        turkish: "Ellerini yıka",
        words: ["WASH", "YOUR", "HANDS"]
      }
    ]
  },
  {
    name: "School",
    level: "intermediate",
    words: [
      { english: "BOOK", turkish: "Kitap", difficulty: "intermediate" },
      { english: "PEN", turkish: "Kalem", difficulty: "intermediate" },
      { english: "DESK", turkish: "Masa", difficulty: "intermediate" },
      { english: "CHAIR", turkish: "Sandalye", difficulty: "intermediate" },
      { english: "BOARD", turkish: "Tahta", difficulty: "intermediate" },
      { english: "TEACHER", turkish: "Öğretmen", difficulty: "intermediate" },
      { english: "STUDENT", turkish: "Öğrenci", difficulty: "intermediate" },
      { english: "LESSON", turkish: "Ders", difficulty: "intermediate" },
      { english: "HOMEWORK", turkish: "Ödev", difficulty: "intermediate" },
      { english: "EXAM", turkish: "Sınav", difficulty: "intermediate" },
    ],
    sentences: [
      {
        english: "Students read books",
        turkish: "Öğrenciler kitap okur",
        words: ["STUDENTS", "READ", "BOOKS"]
      }
    ]
  },
  {
    name: "Weather",
    level: "intermediate",
    words: [
      { english: "SUN", turkish: "Güneş", difficulty: "intermediate" },
      { english: "RAIN", turkish: "Yağmur", difficulty: "intermediate" },
      { english: "SNOW", turkish: "Kar", difficulty: "intermediate" },
      { english: "WIND", turkish: "Rüzgar", difficulty: "intermediate" },
      { english: "CLOUD", turkish: "Bulut", difficulty: "intermediate" },
      { english: "STORM", turkish: "Fırtına", difficulty: "intermediate" },
      { english: "HOT", turkish: "Sıcak", difficulty: "intermediate" },
      { english: "COLD", turkish: "Soğuk", difficulty: "intermediate" },
      { english: "WARM", turkish: "Ilık", difficulty: "intermediate" },
      { english: "COOL", turkish: "Serin", difficulty: "intermediate" },
    ],
    sentences: [
      {
        english: "It is raining today",
        turkish: "Bugün yağmur yağıyor",
        words: ["IT", "IS", "RAINING", "TODAY"]
      }
    ]
  },
  {
    name: "Sports",
    level: "intermediate",
    words: [
      { english: "FOOTBALL", turkish: "Futbol", difficulty: "intermediate" },
      { english: "BASKETBALL", turkish: "Basketbol", difficulty: "intermediate" },
      { english: "TENNIS", turkish: "Tenis", difficulty: "intermediate" },
      { english: "SWIMMING", turkish: "Yüzme", difficulty: "intermediate" },
      { english: "RUNNING", turkish: "Koşu", difficulty: "intermediate" },
      { english: "CYCLING", turkish: "Bisiklet", difficulty: "intermediate" },
      { english: "VOLLEYBALL", turkish: "Voleybol", difficulty: "intermediate" },
      { english: "TEAM", turkish: "Takım", difficulty: "intermediate" },
      { english: "PLAYER", turkish: "Oyuncu", difficulty: "intermediate" },
      { english: "WINNER", turkish: "Kazanan", difficulty: "intermediate" },
    ],
    sentences: [
      {
        english: "Football is very popular",
        turkish: "Futbol çok popüler",
        words: ["FOOTBALL", "IS", "VERY", "POPULAR"]
      },
      {
        english: "I play basketball every week",
        turkish: "Her hafta basketbol oynarım",
        words: ["I", "PLAY", "BASKETBALL", "EVERY", "WEEK"]
      }
    ]
  },
  {
    name: "Music",
    level: "intermediate",
    words: [
      { english: "SONG", turkish: "Şarkı", difficulty: "intermediate" },
      { english: "PIANO", turkish: "Piyano", difficulty: "intermediate" },
      { english: "GUITAR", turkish: "Gitar", difficulty: "intermediate" },
      { english: "VIOLIN", turkish: "Keman", difficulty: "intermediate" },
      { english: "SINGER", turkish: "Şarkıcı", difficulty: "intermediate" },
      { english: "MUSIC", turkish: "Müzik", difficulty: "intermediate" },
      { english: "DANCE", turkish: "Dans", difficulty: "intermediate" },
      { english: "CONCERT", turkish: "Konser", difficulty: "intermediate" },
      { english: "RHYTHM", turkish: "Ritim", difficulty: "intermediate" },
      { english: "MELODY", turkish: "Melodi", difficulty: "intermediate" },
    ],
    sentences: [
      {
        english: "Music makes me happy",
        turkish: "Müzik beni mutlu eder",
        words: ["MUSIC", "MAKES", "ME", "HAPPY"]
      },
      {
        english: "She plays piano very well",
        turkish: "Piyanoyu çok iyi çalar",
        words: ["SHE", "PLAYS", "PIANO", "VERY", "WELL"]
      }
    ]
  },
  {
    name: "Nature",
    level: "intermediate",
    words: [
      { english: "TREE", turkish: "Ağaç", difficulty: "intermediate" },
      { english: "FLOWER", turkish: "Çiçek", difficulty: "intermediate" },
      { english: "MOUNTAIN", turkish: "Dağ", difficulty: "intermediate" },
      { english: "RIVER", turkish: "Nehir", difficulty: "intermediate" },
      { english: "OCEAN", turkish: "Okyanus", difficulty: "intermediate" },
      { english: "FOREST", turkish: "Orman", difficulty: "intermediate" },
      { english: "BEACH", turkish: "Plaj", difficulty: "intermediate" },
      { english: "LAKE", turkish: "Göl", difficulty: "intermediate" },
      { english: "VALLEY", turkish: "Vadi", difficulty: "intermediate" },
      { english: "ISLAND", turkish: "Ada", difficulty: "intermediate" },
    ],
    sentences: [
      {
        english: "The forest is very beautiful",
        turkish: "Orman çok güzel",
        words: ["THE", "FOREST", "IS", "VERY", "BEAUTIFUL"]
      },
      {
        english: "We love walking by the river",
        turkish: "Nehir kenarında yürümeyi severiz",
        words: ["WE", "LOVE", "WALKING", "BY", "THE", "RIVER"]
      }
    ]
  },

  // ADVANCED LEVEL
  {
    name: "Emotions",
    level: "advanced",
    words: [
      { english: "HAPPY", turkish: "Mutlu", difficulty: "advanced" },
      { english: "SAD", turkish: "Üzgün", difficulty: "advanced" },
      { english: "ANGRY", turkish: "Kızgın", difficulty: "advanced" },
      { english: "EXCITED", turkish: "Heyecanlı", difficulty: "advanced" },
      { english: "NERVOUS", turkish: "Gergin", difficulty: "advanced" },
      { english: "PROUD", turkish: "Gururlu", difficulty: "advanced" },
      { english: "JEALOUS", turkish: "Kıskanç", difficulty: "advanced" },
      { english: "CONFUSED", turkish: "Kafası Karışık", difficulty: "advanced" },
      { english: "SURPRISED", turkish: "Şaşırmış", difficulty: "advanced" },
      { english: "DISAPPOINTED", turkish: "Hayal Kırıklığına Uğramış", difficulty: "advanced" },
    ],
    sentences: [
      {
        english: "I am very happy today",
        turkish: "Bugün çok mutluyum",
        words: ["I", "AM", "VERY", "HAPPY", "TODAY"]
      }
    ]
  },
  {
    name: "Technology",
    level: "advanced",
    words: [
      { english: "COMPUTER", turkish: "Bilgisayar", difficulty: "advanced" },
      { english: "SMARTPHONE", turkish: "Akıllı Telefon", difficulty: "advanced" },
      { english: "INTERNET", turkish: "İnternet", difficulty: "advanced" },
      { english: "SOFTWARE", turkish: "Yazılım", difficulty: "advanced" },
      { english: "HARDWARE", turkish: "Donanım", difficulty: "advanced" },
      { english: "PROGRAMMING", turkish: "Programlama", difficulty: "advanced" },
      { english: "ARTIFICIAL", turkish: "Yapay", difficulty: "advanced" },
      { english: "INTELLIGENCE", turkish: "Zeka", difficulty: "advanced" },
      { english: "ALGORITHM", turkish: "Algoritma", difficulty: "advanced" },
      { english: "DATABASE", turkish: "Veritabanı", difficulty: "advanced" },
    ],
    sentences: [
      {
        english: "Computers use algorithms",
        turkish: "Bilgisayarlar algoritma kullanır",
        words: ["COMPUTERS", "USE", "ALGORITHMS"]
      }
    ]
  },
  {
    name: "Business",
    level: "advanced",
    words: [
      { english: "COMPANY", turkish: "Şirket", difficulty: "advanced" },
      { english: "EMPLOYEE", turkish: "Çalışan", difficulty: "advanced" },
      { english: "MANAGER", turkish: "Yönetici", difficulty: "advanced" },
      { english: "CUSTOMER", turkish: "Müşteri", difficulty: "advanced" },
      { english: "PROFIT", turkish: "Kar", difficulty: "advanced" },
      { english: "INVESTMENT", turkish: "Yatırım", difficulty: "advanced" },
      { english: "MARKETING", turkish: "Pazarlama", difficulty: "advanced" },
      { english: "STRATEGY", turkish: "Strateji", difficulty: "advanced" },
      { english: "BUDGET", turkish: "Bütçe", difficulty: "advanced" },
      { english: "MEETING", turkish: "Toplantı", difficulty: "advanced" },
    ],
    sentences: [
      {
        english: "The meeting starts soon",
        turkish: "Toplantı yakında başlıyor",
        words: ["THE", "MEETING", "STARTS", "SOON"]
      }
    ]
  },
  {
    name: "Science",
    level: "advanced",
    words: [
      { english: "EXPERIMENT", turkish: "Deney", difficulty: "advanced" },
      { english: "LABORATORY", turkish: "Laboratuvar", difficulty: "advanced" },
      { english: "CHEMISTRY", turkish: "Kimya", difficulty: "advanced" },
      { english: "PHYSICS", turkish: "Fizik", difficulty: "advanced" },
      { english: "BIOLOGY", turkish: "Biyoloji", difficulty: "advanced" },
      { english: "RESEARCH", turkish: "Araştırma", difficulty: "advanced" },
      { english: "DISCOVERY", turkish: "Keşif", difficulty: "advanced" },
      { english: "THEORY", turkish: "Teori", difficulty: "advanced" },
      { english: "HYPOTHESIS", turkish: "Hipotez", difficulty: "advanced" },
      { english: "CONCLUSION", turkish: "Sonuç", difficulty: "advanced" },
    ],
    sentences: [
      {
        english: "Science helps us understand the world",
        turkish: "Bilim dünyayı anlamamıza yardım eder",
        words: ["SCIENCE", "HELPS", "US", "UNDERSTAND", "THE", "WORLD"]
      },
      {
        english: "Experiments prove theories",
        turkish: "Deneyler teorileri kanıtlar",
        words: ["EXPERIMENTS", "PROVE", "THEORIES"]
      }
    ]
  },
  {
    name: "Medicine",
    level: "advanced",
    words: [
      { english: "DOCTOR", turkish: "Doktor", difficulty: "advanced" },
      { english: "HOSPITAL", turkish: "Hastane", difficulty: "advanced" },
      { english: "MEDICINE", turkish: "İlaç", difficulty: "advanced" },
      { english: "TREATMENT", turkish: "Tedavi", difficulty: "advanced" },
      { english: "SURGERY", turkish: "Ameliyat", difficulty: "advanced" },
      { english: "PATIENT", turkish: "Hasta", difficulty: "advanced" },
      { english: "DIAGNOSIS", turkish: "Teşhis", difficulty: "advanced" },
      { english: "PRESCRIPTION", turkish: "Reçete", difficulty: "advanced" },
      { english: "EMERGENCY", turkish: "Acil", difficulty: "advanced" },
      { english: "RECOVERY", turkish: "İyileşme", difficulty: "advanced" },
    ],
    sentences: [
      {
        english: "The doctor treats patients",
        turkish: "Doktor hastaları tedavi eder",
        words: ["THE", "DOCTOR", "TREATS", "PATIENTS"]
      },
      {
        english: "Medicine helps people recover",
        turkish: "İlaç insanların iyileşmesine yardım eder",
        words: ["MEDICINE", "HELPS", "PEOPLE", "RECOVER"]
      }
    ]
  }
];

// Safe alternatives to react-use hooks
const useAudio = (config: { src: string; autoPlay: boolean }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    audioRef.current = new Audio(config.src);
    audioRef.current.autoplay = config.autoPlay;
  }, [config.src, config.autoPlay]);
  
  return [null, null, null, audioRef] as const;
};

const useWindowSize = () => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const updateSize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  return size;
};

const SnakeGame = () => {
  const { width, height } = useWindowSize();

  // Audio elements
  const [eatAudioEl, , , eatAudioRef] = useAudio({
    src: "/correct.wav",
    autoPlay: false,
  });

  // Game mode state
  const [gameMode, setGameMode] = useState<'words' | 'sentences'>('words');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [sentences, setSentences] = useState<typeof topics[0]['sentences']>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [currentSentenceWordIndex, setCurrentSentenceWordIndex] = useState(0);
  const [word, setWord] = useState<Word | null>(null);
  const [currentSentence, setCurrentSentence] = useState<{ english: string; turkish: string; words: string[] } | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  // Snake game state
  const [snake, setSnake] = useState<Position[]>([{ x: 0, y: 0 }]);
  const [direction, setDirection] = useState<"UP" | "DOWN" | "LEFT" | "RIGHT">("RIGHT");
  const [letterIndex, setLetterIndex] = useState<number>(1);
  const [collectedLetters, setCollectedLetters] = useState<string[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameFinished, setGameFinished] = useState<boolean>(false);
  const [wordCompletedFreeze, setWordCompletedFreeze] = useState<boolean>(false);
  
  // Enhanced scoring state with security measures
  const [totalWordsCompleted, setTotalWordsCompleted] = useState(0);
  const [totalSentencesCompleted, setTotalSentencesCompleted] = useState(0);
  const [consecutiveWords, setConsecutiveWords] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [score, setScore] = useState<number>(0); // Letters for current word
  const [totalScore, setTotalScore] = useState<number>(0); // Points accumulated during game (not yet submitted)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [collectedSentenceWords, setCollectedSentenceWords] = useState<string[]>([]);
  const [pointsSubmitted, setPointsSubmitted] = useState(false); // Prevent double submission
  const [minPlayTime] = useState(30000); // Minimum 30 seconds to prevent farming

  const gridSize = 10;

  // Helper function to get Turkish translation for sentence words
  const getWordTranslation = useCallback((englishWord: string, topic: Topic): string => {
    // First check if the word exists in the topic's word list
    const topicWord = topic.words.find(w => w.english.toUpperCase() === englishWord.toUpperCase());
    if (topicWord) {
      return topicWord.turkish;
    }
    
    // Common sentence words translations
    const commonTranslations: { [key: string]: string } = {
      'THE': 'Bu/O',
      'A': 'Bir',
      'AN': 'Bir', 
      'I': 'Ben',
      'YOU': 'Sen',
      'WE': 'Biz',
      'THEY': 'Onlar',
      'HE': 'O',
      'SHE': 'O',
      'IT': 'O',
      'AM': 'Miyim',
      'IS': 'Dir',
      'ARE': 'Siniz/Ler',
      'WAS': 'Idi',
      'WERE': 'Idiler',
      'HAVE': 'Sahip olmak',
      'HAS': 'Sahip',
      'HAD': 'Sahipti',
      'DO': 'Yapmak',
      'DOES': 'Yapar',
      'DID': 'Yaptı',
      'WILL': 'Gelecek',
      'WOULD': 'Olurdu',
      'CAN': 'Edebilir',
      'COULD': 'Edebilirdi',
      'TO': 'Için',
      'IN': 'İçinde',
      'ON': 'Üzerinde',
      'AT': 'De',
      'BY': 'Tarafından',
      'FOR': 'İçin',
      'WITH': 'İle',
      'WITHOUT': 'Olmadan',
      'FROM': 'Den',
      'OF': 'Nin',
      'ABOUT': 'Hakkında',
      'LIKE': 'Sevmek/Gibi',
      'WANT': 'İstemek',
      'NEED': 'İhtiyaç',
      'GO': 'Gitmek',
      'COME': 'Gelmek',
      'SEE': 'Görmek',
      'LOOK': 'Bakmak',
      'HEAR': 'Duymak',
      'LISTEN': 'Dinlemek',
      'SPEAK': 'Konuşmak',
      'TALK': 'Konuşmak',
      'TELL': 'Söylemek',
      'SAY': 'Demek',
      'KNOW': 'Bilmek',
      'THINK': 'Düşünmek',
      'FEEL': 'Hissetmek',
      'MAKE': 'Yapmak',
      'GET': 'Almak',
      'GIVE': 'Vermek',
      'TAKE': 'Almak',
      'PUT': 'Koymak',
      'FIND': 'Bulmak',
      'KEEP': 'Tutmak',
      'LET': 'Bırakmak',
      'BEGIN': 'Başlamak',
      'START': 'Başlamak',
      'FINISH': 'Bitirmek',
      'END': 'Son',
      'STOP': 'Durmak',
      'PLAY': 'Oynamak',
      'WORK': 'Çalışmak',
      'STUDY': 'Çalışmak',
      'LEARN': 'Öğrenmek',
      'TEACH': 'Öğretmek',
      'READ': 'Okumak',
      'WRITE': 'Yazmak',
      'DRAW': 'Çizmek',
      'PAINT': 'Boyamak',
      'SING': 'Şarkı söylemek',
      'DANCE': 'Dans etmek',
      'RUN': 'Koşmak',
      'WALK': 'Yürümek',
      'SWIM': 'Yüzmek',
      'FLY': 'Uçmak',
      'DRIVE': 'Sürmek',
      'RIDE': 'Binmek',
      'EAT': 'Yemek',
      'DRINK': 'İçmek',
      'SLEEP': 'Uyumak',
      'WAKE': 'Uyanmak',
      'LIVE': 'Yaşamak',
      'DIE': 'Ölmek',
      'LOVE': 'Sevmek',
      'HATE': 'Nefret etmek',
      'HELP': 'Yardım etmek',
      'HURT': 'İncitmek',
      'KILL': 'Öldürmek',
      'SAVE': 'Kurtarmak',
      'BREAK': 'Kırmak',
      'FIX': 'Tamir etmek',
      'BUILD': 'İnşa etmek',
      'DESTROY': 'Yok etmek',
      'OPEN': 'Açmak',
      'CLOSE': 'Kapatmak',
      'LOCK': 'Kilitlemek',
      'UNLOCK': 'Kilit açmak',
      'PUSH': 'İtmek',
      'PULL': 'Çekmek',
      'LIFT': 'Kaldırmak',
      'DROP': 'Düşürmek',
      'CARRY': 'Taşımak',
      'THROW': 'Atmak',
      'CATCH': 'Yakalamak',
      'HIT': 'Vurmak',
      'KICK': 'Tekmelemek',
      'TOUCH': 'Dokunmak',
      'HOLD': 'Tutmak',
      'WEAR': 'Giymek',
      'WASH': 'Yıkamak',
      'CLEAN_VERB': 'Temizlemek',
      'DIRTY_ADJ': 'Kirli',
      'BIG': 'Büyük',
      'SMALL': 'Küçük',
      'TALL': 'Uzun',
      'SHORT': 'Kısa',
      'LONG': 'Uzun',
      'WIDE': 'Geniş',
      'NARROW': 'Dar',
      'THICK': 'Kalın',
      'THIN': 'İnce',
      'HEAVY': 'Ağır',
      'LIGHT': 'Hafif',
      'FAST': 'Hızlı',
      'SLOW': 'Yavaş',
      'HOT': 'Sıcak',
      'COLD': 'Soğuk',
      'WARM': 'Ilık',
      'COOL': 'Serin',
      'WET': 'Islak',
      'DRY': 'Kuru',
      'GOOD': 'İyi',
      'BAD': 'Kötü',
      'BEST': 'En iyi',
      'WORST': 'En kötü',
      'BETTER': 'Daha iyi',
      'WORSE': 'Daha kötü',
      'RIGHT': 'Doğru',
      'WRONG': 'Yanlış',
      'TRUE': 'Doğru',
      'FALSE': 'Yanlış',
      'CORRECT': 'Doğru',
      'BEAUTIFUL': 'Güzel',
      'UGLY': 'Çirkin',
      'NICE': 'Güzel',
      'PRETTY': 'Güzel',
      'HANDSOME': 'Yakışıklı',
      'SMART': 'Akıllı',
      'STUPID': 'Aptal',
      'CLEVER': 'Zeki',
      'WISE': 'Bilge',
      'FUNNY': 'Komik',
      'SERIOUS': 'Ciddi',
      'HAPPY': 'Mutlu',
      'SAD': 'Üzgün',
      'ANGRY': 'Kızgın',
      'AFRAID': 'Korkmuş',
      'BRAVE': 'Cesur',
      'SHY': 'Utangaç',
      'CONFIDENT': 'Özgüvenli',
      'TIRED': 'Yorgun',
      'ENERGETIC': 'Enerjik',
      'SICK': 'Hasta',
      'HEALTHY': 'Sağlıklı',
      'STRONG': 'Güçlü',
      'WEAK': 'Zayıf',
      'YOUNG': 'Genç',
      'OLD': 'Yaşlı',
      'NEW': 'Yeni',
      'FRESH': 'Taze',
      'CLEAN': 'Temiz',
      'DIRTY': 'Kirli',
      'RICH': 'Zengin',
      'POOR': 'Fakir',
      'CHEAP': 'Ucuz',
      'EXPENSIVE': 'Pahalı',
      'FREE': 'Ücretsiz',
      'BUSY': 'Meşgul',
      'EMPTY': 'Boş',
      'FULL': 'Dolu',
      'OPEN_ADJ': 'Açık',
      'CLOSED': 'Kapalı',
      'LOUD': 'Gürültülü',
      'QUIET': 'Sessiz',
      'SOFT': 'Yumuşak',
      'HARD_ADJ': 'Sert',
      'SMOOTH': 'Pürüzsüz',
      'ROUGH': 'Pürüzlü',
      'SHARP': 'Keskin',
      'DULL': 'Körelmiş',
      'BRIGHT': 'Parlak',
      'DARK': 'Karanlık',
      'CLEAR': 'Berrak',
      'CLOUDY': 'Bulutlu',
      'SUNNY': 'Güneşli',
      'RAINY': 'Yağmurlu',
      'SNOWY': 'Karlı',
      'WINDY': 'Rüzgarlı',
      'STORMY': 'Fırtınalı',
      'CALM': 'Sakin',
      'PEACEFUL': 'Huzurlu',
      'DANGEROUS': 'Tehlikeli',
      'SAFE': 'Güvenli',
      'EASY': 'Kolay',
      'DIFFICULT': 'Zor',
      'HARD': 'Zor',
      'SIMPLE': 'Basit',
      'COMPLICATED': 'Karmaşık',
      'IMPORTANT': 'Önemli',
      'NECESSARY': 'Gerekli',
      'USEFUL': 'Kullanışlı',
      'USELESS': 'İşe yaramaz',
      'POSSIBLE': 'Mümkün',
      'IMPOSSIBLE': 'İmkansız',
      'PROBABLE': 'Olası',
      'CERTAIN': 'Kesin',
      'SURE': 'Emin',
      'MAYBE': 'Belki',
      'PERHAPS': 'Belki',
      'PROBABLY': 'Muhtemelen',
      'DEFINITELY': 'Kesinlikle',
      'ABSOLUTELY': 'Kesinlikle',
      'EXACTLY': 'Tam olarak',
      'ALMOST': 'Neredeyse',
      'QUITE': 'Oldukça',
      'VERY': 'Çok',
      'TOO_MUCH': 'Çok fazla',
      'ENOUGH': 'Yeterli',
      'MORE': 'Daha fazla',
      'LESS': 'Daha az',
      'MOST': 'En çok',
      'LEAST': 'En az',
      'ALL': 'Hepsi',
      'SOME': 'Bazı',
      'ANY': 'Herhangi',
      'NO': 'Hayır',
      'NONE': 'Hiçbiri',
      'EVERY': 'Her',
      'EACH': 'Her biri',
      'BOTH_CONJ': 'İkisi de',
      'EITHER_CONJ': 'Ya',
      'NEITHER_CONJ': 'Ne',
      'OTHER': 'Diğer',
      'ANOTHER': 'Başka',
      'SAME': 'Aynı',
      'DIFFERENT': 'Farklı',
      'SIMILAR': 'Benzer',
      'EQUAL': 'Eşit',
      'OPPOSITE': 'Karşı',
      'NEXT': 'Sonraki',
      'LAST': 'Son',
      'FIRST': 'İlk',
      'SECOND': 'İkinci',
      'THIRD': 'Üçüncü',
      'FINAL': 'Final',
      'ONLY': 'Sadece',
      'JUST': 'Sadece',
      'EVEN': 'Hatta',
      'STILL': 'Hala',
      'YET': 'Henüz',
      'ALREADY': 'Zaten',
      'SOON': 'Yakında',
      'LATE': 'Geç',
      'EARLY': 'Erken',
      'NOW': 'Şimdi',
      'THEN': 'Sonra',
      'TODAY': 'Bugün',
      'TOMORROW': 'Yarın',
      'YESTERDAY': 'Dün',
      'ALWAYS': 'Her zaman',
      'NEVER': 'Asla',
      'SOMETIMES': 'Bazen',
      'OFTEN': 'Sık sık',
      'USUALLY': 'Genellikle',
      'RARELY': 'Nadiren',
      'HARDLY': 'Zar zor',
      'EVERYWHERE': 'Her yerde',
      'SOMEWHERE': 'Bir yerde',
      'ANYWHERE': 'Herhangi bir yerde',
      'NOWHERE': 'Hiçbir yerde',
      'HERE': 'Burada',
      'THERE': 'Orada',
      'WHERE': 'Nerede',
      'WHEN': 'Ne zaman',
      'WHY': 'Neden',
      'HOW': 'Nasıl',
      'WHAT': 'Ne',
      'WHO': 'Kim',
      'WHOSE': 'Kimin',
      'WHICH': 'Hangi',
      'THAT': 'O',
      'THIS': 'Bu',
      'THESE': 'Bunlar',
      'THOSE': 'Onlar',
      'SUCH': 'Böyle',
      'SO_ADV': 'Çok',
      'AS': 'Gibi',
      'THAN': 'Den daha',
      'LIKE_PREP': 'Gibi',
      'UNLIKE': 'Aksine',
      'EXCEPT': 'Hariç',
      'BESIDES': 'Ayrıca',
      'INSTEAD': 'Yerine',
      'ALSO': 'Ayrıca',
      'TOO': 'De',
      'EITHER': 'De',
      'NEITHER': 'Ne de',
      'BOTH': 'Hem',
      'NOT': 'Değil',
      'OR': 'Veya',
      'AND': 'Ve',
      'BUT': 'Ama',
      'SO': 'Bu yüzden',
      'BECAUSE': 'Çünkü',
      'SINCE': 'Dan beri',
      'UNTIL': 'Kadar',
      'WHILE': 'Iken',
      'DURING': 'Sırasında',
      'BEFORE': 'Önce',
      'AFTER': 'Sonra',
      'TREES': 'Ağaçlar',
      'GRASS': 'Çimen',
      'GROWS': 'Büyür',
      'COLORS': 'Renkler',
      'ROSES': 'Güller',
      'SKY': 'Gökyüzü',
      'RAINING': 'Yağmur yağıyor',
      'BOOKS': 'Kitaplar',
      'STUDENTS': 'Öğrenciler',
      'COMPUTERS': 'Bilgisayarlar',
      'USE': 'Kullanmak',
      'ALGORITHMS': 'Algoritmalar',
      'MEETING': 'Toplantı',
      'STARTS': 'Başlar',
      'BEEN': 'Olmak',
      'VISIT': 'Ziyaret etmek',
      'TURKEY': 'Türkiye',
      'GOING': 'Gitmek',
      'VACATION': 'Tatil',
      'REALLY': 'Gerçekten',
      'SEEN': 'Görmek',
      'CAR': 'Araba',
      'VERY_ADV': 'Çok',
      'EVER': 'Hiç',
      'SLEEPING': 'Uyumak',
      'CATS': 'Kediler',
      'HANDS': 'Eller',
      'YOUR': 'Senin',
      'WASH_V': 'Yıkamak',
      'READ_V': 'Okumak'
    };
    
    return commonTranslations[englishWord.toUpperCase()] || englishWord;
  }, []);

  // Start new word with enhanced tracking
  const startNewWord = useCallback(() => {
    if (gameMode === 'words') {
      if (currentWordIndex + 1 >= words.length) {
        // All words done - game will end
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
    } else if (gameMode === 'sentences') {
      // Handle sentence mode progression
      const currentSentenceData = sentences?.[currentSentenceIndex];
      if (!currentSentenceData) return;
      
      if (currentSentenceWordIndex + 1 >= currentSentenceData.words.length) {
        // Current sentence completed, move to next sentence
        if (currentSentenceIndex + 1 >= (sentences?.length || 0)) {
          // All sentences done - game will end
          setGameOver(true);
          setGameFinished(true);
        } else {
          const nextSentenceIndex = currentSentenceIndex + 1;
          setCurrentSentenceIndex(nextSentenceIndex);
          setCurrentSentenceWordIndex(0);
          setCollectedSentenceWords([]);
          const nextSentence = sentences?.[nextSentenceIndex];
          if (nextSentence) {
            setCurrentSentence(nextSentence);
            const firstSentence = nextSentence.words[0];
            const wordTranslation = selectedTopic ? getWordTranslation(firstSentence, selectedTopic) : firstSentence;
            setWord({ english: firstSentence, turkish: wordTranslation, difficulty: selectedTopic?.level });
            setLetterIndex(1);
            setCollectedLetters([firstSentence[0]]);
            setSnake([{ x: 0, y: 0 }]);
            setDirection("RIGHT");
            setFoodItems([]);
            setScore(0);
          }
        }
      } else {
        // Move to next word in current sentence
        const nextWordIndex = currentSentenceWordIndex + 1;
        setCurrentSentenceWordIndex(nextWordIndex);
        const nextWordInSentence = currentSentenceData.words[nextWordIndex];
        const wordTranslation = selectedTopic ? getWordTranslation(nextWordInSentence, selectedTopic) : nextWordInSentence;
        setWord({ english: nextWordInSentence, turkish: wordTranslation, difficulty: selectedTopic?.level });
        setLetterIndex(1);
        setCollectedLetters([nextWordInSentence[0]]);
        setSnake([{ x: 0, y: 0 }]);
        setDirection("RIGHT");
        setFoodItems([]);
        setScore(0);
      }
    }
  }, [gameMode, currentWordIndex, words, currentSentenceIndex, currentSentenceWordIndex, sentences, selectedTopic, getWordTranslation]);

  // Handle game completion with security measures
  const handleGameCompletion = useCallback(async () => {
    console.log("🎮 Snake Game: handleGameCompletion called");
    console.log("🎮 Snake Game: selectedTopic:", selectedTopic?.name);
    console.log("🎮 Snake Game: sessionStartTime:", sessionStartTime);
    console.log("🎮 Snake Game: pointsSubmitted:", pointsSubmitted);
    console.log("🎮 Snake Game: totalScore:", totalScore);
    console.log("🎮 Snake Game: totalWordsCompleted:", totalWordsCompleted);
    
    if (!selectedTopic || !sessionStartTime || pointsSubmitted) {
      console.log("🎮 Snake Game: Exiting early from handleGameCompletion");
      setGameOver(true);
      setGameFinished(true);
      return;
    }
    
    // Only proceed if user actually earned points or completed at least one word
    if (totalScore <= 0 && totalWordsCompleted === 0) {
      console.log("🎮 Snake Game: No points earned or words completed - ending game without point submission");
      setGameOver(true);
      setGameFinished(true);
      return;
    }
    
    // Prevent multiple submissions
    setPointsSubmitted(true);
    
    // Anti-farming check: Only block points if no words were completed AND session was too short
    const sessionDuration = Date.now() - sessionStartTime.getTime();
    if (sessionDuration < minPlayTime && totalWordsCompleted === 0) {
      console.log("Game too short and no words completed - no points awarded");
      setGameOver(true);
      setGameFinished(true);
      return;
    }
    
    // If user completed at least one word, they deserve their points regardless of time
    if (totalWordsCompleted > 0) {
      console.log(`✅ User completed ${totalWordsCompleted} words - awarding points regardless of session duration`);
    }
    
    // Add perfect game bonus if applicable
    let finalScore = totalScore;
    if (mistakeCount === 0 && totalWordsCompleted > 0) {
      const perfectBonus = SCORING_SYSTEM.GAMES.SNAKE.PERFECT_GAME_BONUS;
      finalScore += perfectBonus;
      setTotalScore(finalScore);
      console.log(`Perfect game bonus: +${perfectBonus} points`);
    }
    
    // Anti-exploitation: Cap maximum points per session
    const maxPointsPerSession = gameMode === 'sentences' ? 200 : 150;
    finalScore = Math.min(finalScore, maxPointsPerSession);
    
    console.log(`Final score to submit: ${finalScore} points`);
    console.log(`Words completed: ${totalWordsCompleted}, Sentences: ${totalSentencesCompleted}, Mistakes: ${mistakeCount}`);
    
    // Submit accumulated points only once at game end
    if (finalScore > 0) {
      try {
        console.log(`🎮 Snake Game: Attempting to submit ${finalScore} points...`);
        const result = await addPointsToUser(finalScore);
        
        if (result && result.success) {
          console.log(`🎉 Snake Game: Successfully submitted ${result.pointsAdded} points! New total: ${result.newTotal}`);
        } else {
          console.log("⚠️ Snake Game: Points submission returned unexpected result:", result);
        }
              } catch (error: unknown) {
          console.error("❌ Snake Game: Error submitting final score:", error);
          console.error("❌ Snake Game: Error details:", error instanceof Error ? error.message : String(error));
          // Still complete the game even if points submission fails
      }
    } else {
      console.log("🎮 Snake Game: No points to submit (finalScore: 0)");
    }
    
    // Final state update
    setGameOver(true);
    setGameFinished(true);
  }, [selectedTopic, sessionStartTime, totalWordsCompleted, totalSentencesCompleted, mistakeCount, gameMode, pointsSubmitted, minPlayTime, totalScore]);

  // Enhanced move snake function
  const moveSnake = useCallback(async () => {
    if (gameOver || !gameStarted || wordCompletedFreeze) return;

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
      setMistakeCount(prev => prev + 1);
      setConsecutiveWords(0); // Reset streak on mistake
      
      // End game - points will be submitted by useEffect
      console.log("🐍 Snake collision detected - ending game");
      setGameOver(true);
      setGameFinished(true);
      return;
    }

    // Check for food
    const foodEatenIndex = foodItems.findIndex(
      (item) => item.x === newHead.x && item.y === newHead.y
    );

    if (foodEatenIndex !== -1 && word && selectedTopic) {
      const eatenFood = foodItems[foodEatenIndex];

      if (eatenFood.letter === word.english[letterIndex]) {
        // Correct letter
        eatAudioRef.current?.play();

        const newSnake = [newHead, ...snake];
        setSnake(newSnake);
        setCollectedLetters([...collectedLetters, eatenFood.letter]);
        setScore(score + 1);

        // Check if entire word is collected
        if (letterIndex + 1 >= word.english.length) {
          // Word completed - calculate and immediately submit points
          const basePoints = SCORING_SYSTEM.GAMES.SNAKE.BASE_WORD;
          const levelMultiplier = SCORING_SYSTEM.GAMES.SNAKE.DIFFICULTY_MULTIPLIER[selectedTopic.level] || 1.0;
          const topicMultiplier = (SCORING_SYSTEM.GAMES.SNAKE.TOPIC_MULTIPLIER as Record<string, number>)[selectedTopic.name] || 1.0;
          const difficultyMultiplier = levelMultiplier * topicMultiplier;
          const streakBonus = consecutiveWords * SCORING_SYSTEM.GAMES.SNAKE.STREAK_BONUS;
          
          // Add sentence bonus if in sentence mode
          let sentenceBonus = 0;
          if (gameMode === 'sentences') {
            sentenceBonus = SCORING_SYSTEM.GAMES.SNAKE.SENTENCE_WORD_BONUS;
          }
          
          const wordPoints = Math.round(basePoints * difficultyMultiplier) + streakBonus + sentenceBonus;
          
          console.log(`Word completed: ${word.english} - ${wordPoints} points earned!`);

          // Add points to accumulated score (will be submitted at game end)
          setTotalWordsCompleted(prev => prev + 1);
          setConsecutiveWords(prev => prev + 1);
          setTotalScore(prev => prev + wordPoints);

          // Handle sentence mode progression
          if (gameMode === 'sentences') {
            // Add the completed word to sentence collection
            setCollectedSentenceWords(prev => [...prev, word.english]);
            
            const currentSentenceData = sentences?.[currentSentenceIndex];
            if (currentSentenceData && currentSentenceWordIndex + 1 >= currentSentenceData.words.length) {
              // Sentence completed!
              const sentenceCompletionBonus = SCORING_SYSTEM.GAMES.SNAKE.SENTENCE_COMPLETION_BONUS;
              setTotalSentencesCompleted(prev => prev + 1);
              setTotalScore(prev => prev + sentenceCompletionBonus);
              console.log(`Sentence completed! +${sentenceCompletionBonus} bonus points earned!`);
              
              // Check if last sentence
              if (currentSentenceIndex + 1 >= (sentences?.length || 0)) {
                console.log("🎯 All sentences completed - ending game");
                setGameOver(true);
                setGameFinished(true);
              } else {
                setWordCompletedFreeze(true);
              }
            } else {
              // More words in current sentence
              setWordCompletedFreeze(true);
            }
          } else {
            // Word mode - check if last word in topic
            if (currentWordIndex + 1 >= words.length) {
              console.log("🎯 All words completed - ending game");
              setGameOver(true);
              setGameFinished(true);
            } else {
              setWordCompletedFreeze(true);
            }
          }
          return;
        } else {
          // Move to next letter
          setLetterIndex(letterIndex + 1);
        }
      } else {
        // Wrong letter - end game
        setMistakeCount(prev => prev + 1);
        setConsecutiveWords(0); // Reset streak
        
        console.log("🐍 Wrong letter selected - ending game");
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
    words.length,
    selectedTopic,
    consecutiveWords,
    sentences,
    currentSentenceIndex,
    currentSentenceWordIndex,
    gameMode
  ]);

  // Key press handler
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
    }
    
    setDirection((prevDirection) => {
      if (event.key === "ArrowUp" && prevDirection !== "DOWN") return "UP";
      if (event.key === "ArrowDown" && prevDirection !== "UP") return "DOWN";
      if (event.key === "ArrowLeft" && prevDirection !== "RIGHT") return "LEFT";
      if (event.key === "ArrowRight" && prevDirection !== "LEFT") return "RIGHT";
      return prevDirection;
    });
  }, []);

  // Touch controls
  const handleDirectionChange = (newDirection: "UP" | "DOWN" | "LEFT" | "RIGHT") => {
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

  // Audio volume adjustment
  useEffect(() => {
    if (eatAudioRef.current) {
      eatAudioRef.current.volume = 0.5;
    }
  }, [eatAudioRef]);

  // Generate food items
  const generateFoodItems = () => {
    if (!word) return;
    const items: FoodItem[] = [];

    // Helper functions for positioning
    const isInRespawnArea = (pos: Position) => pos.x < 3 && pos.y < 3;
    const isTooCloseToOtherItems = (pos: Position) => {
      return items.some(item => {
        const distanceX = Math.abs(item.x - pos.x);
        const distanceY = Math.abs(item.y - pos.y);
        return distanceX <= 1 && distanceY <= 1;
      });
    };

    // Generate correct letter position
    let correctPos: Position;
    do {
      correctPos = {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize),
      };
    } while (
      snake.some((seg) => seg.x === correctPos.x && seg.y === correctPos.y) ||
      isInRespawnArea(correctPos)
    );

    items.push({
      ...correctPos,
      letter: word.english[letterIndex],
    });

    // Generate random letters
    for (let i = 0; i < 4; i++) {
      let position: Position;
      let attempts = 0;
      const maxAttempts = 100;
      
      do {
        position = {
          x: Math.floor(Math.random() * gridSize),
          y: Math.floor(Math.random() * gridSize),
        };
        attempts++;
        
        if (attempts > maxAttempts) {
          console.log("Could not find suitable position after many attempts");
          break;
        }
      } while (
        snake.some((seg) => seg.x === position.x && seg.y === position.y) ||
        items.some((item) => item.x === position.x && item.y === position.y) ||
        isInRespawnArea(position) ||
        isTooCloseToOtherItems(position)
      );
      
      if (attempts <= maxAttempts) {
        items.push({
          ...position,
          letter: String.fromCharCode(65 + Math.floor(Math.random() * 26)),
        });
      }
    }

    setFoodItems(items);
  };

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const interval = setInterval(() => {
      moveSnake();
    }, 200);
    return () => clearInterval(interval);
  }, [snake, direction, gameOver, gameStarted, moveSnake]);

  // Keyboard controls
  useEffect(() => {
    if (!gameStarted) return;
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameStarted, handleKeyPress]);

  // Generate initial food
  useEffect(() => {
    if (gameStarted) {
      generateFoodItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted]);

  // Generate new food when letter changes
  useEffect(() => {
    if (!gameOver && word && letterIndex < word.english.length && gameStarted) {
      generateFoodItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letterIndex]);

  // Reset collected letters for new word
  useEffect(() => {
    if ((gameStarted || countdown !== null) && word) {
      setCollectedLetters([word.english[0]]);
      setLetterIndex(1);
      generateFoodItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word]);

  // Handle word completion freeze
  useEffect(() => {
    if (!wordCompletedFreeze) return;
    
    const timer = setTimeout(() => {
      setWordCompletedFreeze(false);
      startNewWord();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [wordCompletedFreeze, startNewWord]);

  // Automatically submit points when game ends
  useEffect(() => {
    if (gameFinished && !pointsSubmitted) {
      console.log("🎮 Game finished detected - automatically submitting points");
      console.log("🎮 totalScore:", totalScore);
      console.log("🎮 totalWordsCompleted:", totalWordsCompleted);
      handleGameCompletion();
    }
  }, [gameFinished, pointsSubmitted, handleGameCompletion, totalScore, totalWordsCompleted]);



  // Countdown effect
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCountdown(null);
      setGameStarted(true);
      setSessionStartTime(new Date()); // Track session start time
    }
  }, [countdown]);

  // Reset game
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
    setTotalScore(0); // Reset accumulated points
    setTotalWordsCompleted(0);
    setTotalSentencesCompleted(0);
    setConsecutiveWords(0);
    setMistakeCount(0);
    setGameFinished(false);
    setFoodItems([]);
    setGameStarted(false);
    setCountdown(null);
    setSessionStartTime(null);
    setPointsSubmitted(false); // Reset submission flag
    setCollectedSentenceWords([]);
  };

  // Render game grid
  const renderGrid = () => {
    const grid = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const isSnake = snake.some((segment) => segment.x === x && segment.y === y);
        const foodItem = foodItems.find((item) => item.x === x && item.y === y);
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
                    snake.findIndex((segment) => segment.x === x && segment.y === y)
                  ]
                }
              </p>
            )}
            {foodItem && (
              <p className="text-center text-white text-lg">{foodItem.letter}</p>
            )}
          </div>
        );
      }
    }
    return grid;
  };

  return (
    <>
      {eatAudioEl}

      <div className="relative w-full flex flex-col items-center">
        <div className="flex flex-col items-center mt-10">
          <h1 className="text-2xl font-bold mb-4">Kelime ve Yılan Oyunu</h1>

          {!gameStarted && countdown === null ? (
            // Start Screen
            <div className="text-center">
              {!selectedTopic ? (
                <>
                  {/* Game Mode Selection */}
                  <div className="mb-6">
                    <p className="text-lg mb-4">Oyun Modu Seçin:</p>
                    <div className="flex gap-4 justify-center mb-4">
                      <Button
                        variant={gameMode === 'words' ? 'super' : 'secondary'}
                        onClick={() => setGameMode('words')}
                        className="px-6 py-3"
                      >
                        📚 Kelime Modu
                      </Button>
                      <Button
                        variant={gameMode === 'sentences' ? 'super' : 'secondary'}
                        onClick={() => setGameMode('sentences')}
                        className="px-6 py-3"
                      >
                        📝 Cümle Modu
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mb-6">
                      {gameMode === 'words' 
                        ? "Kelime kelime toplayarak İngilizce öğrenin" 
                        : "Cümleleri oluşturan kelimeleri toplayın"}
                    </p>
                  </div>

                  {/* Topic Selection by Difficulty */}
                  <p className="text-lg mb-4">Bir konu seçin:</p>
                  
                  {/* Beginner Topics */}
                  <div className="mb-6">
                    <h3 className="text-md font-semibold text-green-600 mb-2">🟢 Başlangıç Seviyesi</h3>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {topics.filter(topic => topic.level === 'beginner').map((topic) => (
                        <Button
                          key={topic.name}
                          variant="secondary"
                          onClick={() => setSelectedTopic(topic)}
                          disabled={gameMode === 'sentences' && (!topic.sentences || topic.sentences.length === 0)}
                        >
                          <div className="flex flex-col items-center">
                            <span>{topic.name}</span>
                            <span className="text-xs text-white/80">
                              ×{SCORING_SYSTEM.GAMES.SNAKE.DIFFICULTY_MULTIPLIER[topic.level]} • 
                              {gameMode === 'words' ? `${topic.words.length} kelime` : `${topic.sentences?.length || 0} cümle`}
                            </span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Intermediate Topics */}
                  <div className="mb-6">
                    <h3 className="text-md font-semibold text-yellow-600 mb-2">🟡 Orta Seviye</h3>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {topics.filter(topic => topic.level === 'intermediate').map((topic) => (
                        <Button
                          key={topic.name}
                          variant="primary"
                          onClick={() => setSelectedTopic(topic)}
                          className="relative"
                          disabled={gameMode === 'sentences' && (!topic.sentences || topic.sentences.length === 0)}
                        >
                          <div className="flex flex-col items-center">
                            <span>{topic.name}</span>
                            <span className="text-xs text-white/80">
                              ×{SCORING_SYSTEM.GAMES.SNAKE.DIFFICULTY_MULTIPLIER[topic.level]} • 
                              {gameMode === 'words' ? `${topic.words.length} kelime` : `${topic.sentences?.length || 0} cümle`}
                            </span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Topics */}
                  <div className="mb-6">
                    <h3 className="text-md font-semibold text-red-600 mb-2">🔴 İleri Seviye</h3>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {topics.filter(topic => topic.level === 'advanced').map((topic) => (
                        <Button
                          key={topic.name}
                          variant="danger"
                          onClick={() => setSelectedTopic(topic)}
                          className="relative"
                          disabled={gameMode === 'sentences' && (!topic.sentences || topic.sentences.length === 0)}
                        >
                          <div className="flex flex-col items-center">
                            <span>{topic.name}</span>
                            <span className="text-xs text-white/80">
                              ×{SCORING_SYSTEM.GAMES.SNAKE.DIFFICULTY_MULTIPLIER[topic.level]} • 
                              {gameMode === 'words' ? `${topic.words.length} kelime` : `${topic.sentences?.length || 0} cümle`}
                            </span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-sm mb-2">🎯 Puanlama Sistemi:</h3>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Kelime başına: {SCORING_SYSTEM.GAMES.SNAKE.BASE_WORD} puan (seviye çarpanı ile)</li>
                      <li>• Ardışık kelime bonusu: +{SCORING_SYSTEM.GAMES.SNAKE.STREAK_BONUS} puan</li>
                      <li>• Mükemmel oyun bonusu: +{SCORING_SYSTEM.GAMES.SNAKE.PERFECT_GAME_BONUS} puan</li>
                      {gameMode === 'sentences' && (
                        <>
                          <li>• Cümle kelimesi bonusu: +{SCORING_SYSTEM.GAMES.SNAKE.SENTENCE_WORD_BONUS} puan</li>
                          <li>• Cümle tamamlama bonusu: +{SCORING_SYSTEM.GAMES.SNAKE.SENTENCE_COMPLETION_BONUS} puan</li>
                        </>
                      )}
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-lg mb-2">
                    Seçilen Konu: <strong>{selectedTopic.name}</strong>
                  </p>
                  <p className="text-md mb-2">
                    Mod: <strong>{gameMode === 'words' ? '📚 Kelime Modu' : '📝 Cümle Modu'}</strong>
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    Seviye: <span className={`font-semibold ${
                      selectedTopic.level === 'beginner' ? 'text-green-600' :
                      selectedTopic.level === 'intermediate' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {selectedTopic.level === 'beginner' ? '🟢 Başlangıç' :
                       selectedTopic.level === 'intermediate' ? '🟡 Orta' : '🔴 İleri'}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Zorluk Çarpanı: ×{SCORING_SYSTEM.GAMES.SNAKE.DIFFICULTY_MULTIPLIER[selectedTopic.level]} × {(SCORING_SYSTEM.GAMES.SNAKE.TOPIC_MULTIPLIER as Record<string, number>)[selectedTopic.name] || 1.0}
                  </p>
                  <div className="mb-4">
                    <Button
                      variant="secondaryOutline"
                      onClick={() => setSelectedTopic(null)}
                      className="mr-2"
                    >
                      ← Geri
                    </Button>
                    <Button
                      variant="super"
                      onClick={() => {
                        setCountdown(3);
                        if (gameMode === 'words') {
                          setWords(selectedTopic.words);
                          setWord(selectedTopic.words[0]);
                          setCollectedLetters([selectedTopic.words[0].english[0]]);
                        } else {
                          setSentences(selectedTopic.sentences || []);
                          setCurrentSentence(selectedTopic.sentences?.[0] || null);
                          const firstSentence = selectedTopic.sentences?.[0];
                          if (firstSentence) {
                            const firstWord = firstSentence.words[0];
                            const wordTranslation = getWordTranslation(firstWord, selectedTopic);
                            setWord({ english: firstWord, turkish: wordTranslation, difficulty: selectedTopic.level });
                            setCollectedLetters([firstWord[0]]);
                            setCollectedSentenceWords([]);
                          }
                        }
                        setSnake([{ x: 0, y: 0 }]);
                        setDirection("RIGHT");
                        setLetterIndex(1);
                      }}
                    >
                      🎮 Oyuna Başla
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : countdown !== null ? (
            // Countdown
            <div className="text-center">
              <p className="text-4xl font-bold text-lime-600">{countdown}</p>
              <p className="text-lg">Hazırlan!</p>
            </div>
          ) : gameFinished ? (
            // Game Over Screen
            <div className="text-center">
              <Confetti width={width} height={height} recycle={false} />
              <h2 className="text-3xl font-bold mb-4">
                {mistakeCount === 0 && totalWordsCompleted === words.length ? "🏆 Mükemmel! Tüm Kelimeler Tamamlandı!" : 
                 mistakeCount === 0 ? "🎯 Harika! Hata Yapmadın!" : 
                 "🎮 Oyun Bitti!"}
              </h2>
              {totalScore > 0 && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-center text-green-800 font-semibold">
                    🎉 {totalScore} puan kazandınız!
                  </p>
                  <p className="text-center text-green-600 text-sm mt-1">
                    {totalWordsCompleted} kelime tamamladınız • Puanlar hesabınıza eklendi
                  </p>
                </div>
              )}
              {totalScore === 0 && totalWordsCompleted === 0 && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-center text-yellow-800 font-semibold">
                    💡 Puan kazanmak için kelime tamamlamalısınız
                  </p>
                  <p className="text-center text-yellow-600 text-sm mt-1">
                    Bir dahaki sefere harfleri toplayarak kelimeler oluşturun!
                  </p>
                </div>
              )}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Tamamlanan Kelimeler</p>
                    <p className="text-2xl font-bold text-green-600">{totalWordsCompleted}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Kazanılan Puan</p>
                    <p className="text-2xl font-bold text-blue-600">{totalScore}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">En Uzun Seri</p>
                    <p className="text-2xl font-bold text-purple-600">{consecutiveWords}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Hata Sayısı</p>
                    <p className="text-2xl font-bold text-red-600">{mistakeCount}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="super" onClick={playAgain}>
                  Tekrar Oyna
                </Button>
                <Link href="/games">
                  <Button variant="secondary">Oyunlara Dön</Button>
                </Link>
              </div>
            </div>
          ) : (
            // Game Screen
            <>
              {/* Sentence Display for Sentence Mode */}
              {gameMode === 'sentences' && currentSentence && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="text-center mb-3">
                    <p className="text-sm text-gray-600 mb-1">📝 Hedef Cümle:</p>
                    <p className="text-lg font-bold text-blue-800">{currentSentence.english}</p>
                    <p className="text-sm text-gray-600">{currentSentence.turkish}</p>
                  </div>
                  
                  {/* Sentence Progress */}
                  <div className="flex flex-wrap justify-center gap-2 mb-2">
                    {currentSentence.words.map((sentenceWord, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1 rounded-full text-sm font-medium border-2 ${
                          index < currentSentenceWordIndex
                            ? 'bg-green-100 border-green-400 text-green-800' // Completed words
                            : index === currentSentenceWordIndex
                            ? 'bg-yellow-100 border-yellow-400 text-yellow-800' // Current word
                            : 'bg-gray-100 border-gray-300 text-gray-600' // Future words
                        }`}
                      >
                        {sentenceWord}
                      </span>
                    ))}
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      Kelime {currentSentenceWordIndex + 1} / {currentSentence.words.length} • 
                      Cümle {currentSentenceIndex + 1} / {sentences?.length || 1}
                    </p>
                  </div>
                </div>
              )}

              <div className="mb-4 flex flex-wrap justify-center gap-4 text-center">
                <div className="bg-white rounded-lg shadow p-3">
                  <p className="text-sm text-gray-600">
                    {gameMode === 'sentences' ? 'Şuanki Kelime' : 'Kelime'}
                  </p>
                  <p className="font-bold">{word?.english}</p>
                  {gameMode === 'sentences' && (
                    <p className="text-xs text-gray-500">{word?.turkish}</p>
                  )}
                </div>
                <div className="bg-white rounded-lg shadow p-3">
                  <p className="text-sm text-gray-600">Kazanılan Puan</p>
                  <p className="font-bold text-blue-600">{totalScore}</p>
                  <p className="text-xs text-gray-500">Oyun sonunda eklenir</p>
                </div>
                <div className="bg-white rounded-lg shadow p-3">
                  <p className="text-sm text-gray-600">Seri</p>
                  <p className="font-bold text-purple-600">{consecutiveWords}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-3">
                  <p className="text-sm text-gray-600">İlerleme</p>
                  <p className="font-bold">
                    {gameMode === 'sentences' 
                      ? `${totalSentencesCompleted}/${sentences?.length || 0} cümle`
                      : `${currentWordIndex + 1}/${words.length} kelime`
                    }
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-10 gap-1 mb-4 p-4 bg-white rounded-lg shadow">
                {renderGrid()}
              </div>

              <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                <p className="text-center">
                  Toplanacak Harf: <span className="font-bold text-lg text-red-600">
                    {word?.english[letterIndex]}
                  </span>
                </p>
                <p className="text-center text-sm text-gray-600">
                  Toplanan: {collectedLetters.join("")}
                </p>
                {gameMode === 'sentences' && (
                  <p className="text-center text-xs text-blue-600 mt-1">
                    Tamamlanan Kelimeler: {collectedSentenceWords.join(" ")}
                  </p>
                )}
              </div>

              {wordCompletedFreeze ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-75">
                  <h2 className="text-3xl font-bold mb-4">✓</h2>
                  <p className="text-lg">Kelime tamamlandı!</p>
                  <p className="text-sm text-blue-600 font-semibold">Puan kazanıldı!</p>
                  <p className="text-xs text-gray-500">Oyun sonunda hesabınıza eklenecek</p>
                </div>
              ) : (
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