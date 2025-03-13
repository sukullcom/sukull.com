import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../db/schema";

// Create a postgres-js client using the DATABASE_URL
const client = postgres(process.env.DATABASE_URL!);

// Initialize drizzle with the client and your schema
const db = drizzle(client, { schema });

const main = async () => {
  try {
    console.log("Creating Kimya (Chemistry) course for 5th grade");

    // Insert the course
    const [course] = await db
      .insert(schema.courses)
      .values({ title: "Kimya 5. Sınıf", imageSrc: "/kimya-5.svg" })
      .returning();

    // Unit names for 5th grade Chemistry in Turkish curriculum
    const unitNames = [
      { title: "Madde ve Özellikleri", description: "Maddenin temel özellikleri" },
      { title: "Maddenin Halleri", description: "Katı, sıvı ve gaz halleri" },
      { title: "Madde Döngüleri", description: "Doğadaki madde döngüleri" },
      { title: "Madde ve Değişim", description: "Fiziksel ve kimyasal değişimler" },
      { title: "Karışımlar", description: "Karışımlar ve özellikleri" },
      { title: "Çözünme ve Çözeltiler", description: "Çözünme olayı ve çözeltiler" },
      { title: "Asitler ve Bazlar", description: "Temel asit ve baz kavramları" },
      { title: "Saf Maddeler", description: "Element ve bileşik kavramları" },
      { title: "Doğal Kaynaklar", description: "Doğal kaynakların kullanımı" },
      { title: "Kimya ve Çevre", description: "Kimyanın çevre ile ilişkisi" }
    ];

    // Create units for the Kimya course
    for (let i = 0; i < unitNames.length; i++) {
      const [unit] = await db
        .insert(schema.units)
        .values({
          courseId: course.id,
          title: unitNames[i].title,
          description: unitNames[i].description,
          order: i + 1,
        })
        .returning();
      
      // Lesson names for each unit
      const lessonNames = [
        `${unitNames[i].title} - Temel Kavramlar`,
        `${unitNames[i].title} - Deneyler ve Gözlemler`,
        `${unitNames[i].title} - Günlük Hayatta Kullanımı`,
        `${unitNames[i].title} - Problem Çözme`,
        `${unitNames[i].title} - Değerlendirme`
      ];
      
      // Create lessons for each unit
      for (let j = 0; j < lessonNames.length; j++) {
        const [lesson] = await db
          .insert(schema.lessons)
          .values({
            unitId: unit.id,
            title: lessonNames[j],
            order: j + 1,
          })
          .returning();
        
        // Create challenges for each lesson
        await createChallenges(lesson.id, unitNames[i].title, j + 1);
      }
    }

    console.log("5th grade Kimya course created successfully.");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await client.end();
  }
};

// Function to create challenges for a lesson
const createChallenges = async (lessonId: number, unitTitle: string, lessonOrder: number) => {
  // Create 10 challenges per lesson
  for (let i = 1; i <= 10; i++) {
    const [challenge] = await db
      .insert(schema.challenges)
      .values({
        lessonId: lessonId,
        type: "ASSIST",
        question: getQuestion(unitTitle, lessonOrder, i),
        order: i,
      })
      .returning();
    
    // Create 4 options for each challenge
    await db.insert(schema.challengeOptions).values([
      {
        challengeId: challenge.id,
        text: getOption(unitTitle, lessonOrder, i, 1),
        correct: isCorrect(unitTitle, lessonOrder, i, 1),
        imageSrc: null,
        audioSrc: null,
      },
      {
        challengeId: challenge.id,
        text: getOption(unitTitle, lessonOrder, i, 2),
        correct: isCorrect(unitTitle, lessonOrder, i, 2),
        imageSrc: null,
        audioSrc: null,
      },
      {
        challengeId: challenge.id,
        text: getOption(unitTitle, lessonOrder, i, 3),
        correct: isCorrect(unitTitle, lessonOrder, i, 3),
        imageSrc: null,
        audioSrc: null,
      },
      {
        challengeId: challenge.id,
        text: getOption(unitTitle, lessonOrder, i, 4),
        correct: isCorrect(unitTitle, lessonOrder, i, 4),
        imageSrc: null,
        audioSrc: null,
      },
    ]);
  }
};

// Function to determine if an option is correct
const isCorrect = (unitTitle: string, lessonOrder: number, challengeOrder: number, optionOrder: number): boolean => {
  // For "Madde ve Özellikleri" unit (Matter and Its Properties)
  if (unitTitle === "Madde ve Özellikleri") {
    if (challengeOrder === 1 && optionOrder === 3) return true; // Madde nedir?
    if (challengeOrder === 2 && optionOrder === 4) return true; // Kütle nedir?
    if (challengeOrder === 3 && optionOrder === 4) return true; // Hacim nedir?
    if (challengeOrder === 4 && optionOrder === 2) return true; // Yoğunluk nedir?
    if (challengeOrder === 5 && optionOrder === 2) return true; // Maddenin temel özellikleri
    if (challengeOrder === 6 && optionOrder === 1) return true; // Eylemsizlik nedir?
    if (challengeOrder === 7 && optionOrder === 4) return true; // Tanecikli yapı
    if (challengeOrder === 8 && optionOrder === 2) return true; // Maddelerin sınıflandırılması
    if (challengeOrder === 9 && optionOrder === 3) return true; // Ölçme ve birimler
    if (challengeOrder === 10 && optionOrder === 1) return true; // Madde mi değil mi?
  }
  
  // For "Maddenin Halleri" unit (States of Matter)
  else if (unitTitle === "Maddenin Halleri") {
    if (challengeOrder === 1 && optionOrder === 1) return true; // Maddenin halleri nelerdir?
    if (challengeOrder === 2 && optionOrder === 1) return true; // Katı maddelerin özellikleri
    if (challengeOrder === 3 && optionOrder === 2) return true; // Sıvı maddelerin özellikleri
    if (challengeOrder === 4 && optionOrder === 3) return true; // Gaz maddelerin özellikleri
    if (challengeOrder === 5 && optionOrder === 1) return true; // Hal değişimi
    if (challengeOrder === 6 && optionOrder === 2) return true; // Erime ve donma
    if (challengeOrder === 7 && optionOrder === 3) return true; // Buharlaşma ve yoğuşma
    if (challengeOrder === 8 && optionOrder === 4) return true; // Süblimleşme
    if (challengeOrder === 9 && optionOrder === 1) return true; // Isı ve sıcaklık
    if (challengeOrder === 10 && optionOrder === 2) return true; // Genleşme ve büzülme
  }

  // For "Madde Döngüleri" unit (Matter Cycles)
  else if (unitTitle === "Madde Döngüleri") {
    if (challengeOrder === 1 && optionOrder === 1) return true; // Madde döngüsü nedir?
    if (challengeOrder === 2 && optionOrder === 3) return true; // Su döngüsü
    if (challengeOrder === 3 && optionOrder === 2) return true; // Karbon döngüsü
    if (challengeOrder === 4 && optionOrder === 4) return true; // Azot döngüsü
    if (challengeOrder === 5 && optionOrder === 1) return true; // Oksijen döngüsü
    if (challengeOrder === 6 && optionOrder === 3) return true; // Fosfor döngüsü
    if (challengeOrder === 7 && optionOrder === 2) return true; // Madde döngülerinin önemi
    if (challengeOrder === 8 && optionOrder === 4) return true; // İnsan etkisi
    if (challengeOrder === 9 && optionOrder === 1) return true; // Çevre kirliliği
    if (challengeOrder === 10 && optionOrder === 3) return true; // Sürdürülebilirlik
  }
  
  // For other units, distribute the correct answers
  else {
    if (challengeOrder % 4 === 1 && optionOrder === 2) return true;
    if (challengeOrder % 4 === 2 && optionOrder === 1) return true;
    if (challengeOrder % 4 === 3 && optionOrder === 4) return true;
    if (challengeOrder % 4 === 0 && optionOrder === 3) return true;
  }
  
  return false;
};

// Function to generate a question based on unit and lesson
const getQuestion = (unitTitle: string, lessonOrder: number, challengeOrder: number): string => {
  // Questions for Madde ve Özellikleri (Matter and Its Properties)
  if (unitTitle === "Madde ve Özellikleri") {
    const questions = [
      "Madde nedir?",
      "Kütle nedir?",
      "Hacim nedir?",
      "Yoğunluk nedir?",
      "Maddenin temel özellikleri nelerdir?",
      "Eylemsizlik nedir?",
      "Maddenin tanecikli yapısı ne demektir?",
      "Maddeler nasıl sınıflandırılabilir?",
      "Madde ile ilgili ölçme ve birimler nelerdir?",
      "Bir varlığın madde olup olmadığı nasıl anlaşılır?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Maddenin Halleri (States of Matter)
  if (unitTitle === "Maddenin Halleri") {
    const questions = [
      "Maddenin halleri nelerdir?",
      "Katı maddelerin özellikleri nelerdir?",
      "Sıvı maddelerin özellikleri nelerdir?",
      "Gaz maddelerin özellikleri nelerdir?",
      "Hal değişimi nedir?",
      "Erime ve donma nedir?",
      "Buharlaşma ve yoğuşma nedir?",
      "Süblimleşme nedir?",
      "Isı ve sıcaklık arasındaki fark nedir?",
      "Genleşme ve büzülme nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Madde Döngüleri (Matter Cycles)
  if (unitTitle === "Madde Döngüleri") {
    const questions = [
      "Madde döngüsü nedir?",
      "Su döngüsü nasıl gerçekleşir?",
      "Karbon döngüsü nedir?",
      "Azot döngüsü nasıl gerçekleşir?",
      "Oksijen döngüsü nedir?",
      "Fosfor döngüsü nasıl gerçekleşir?",
      "Madde döngülerinin önemi nedir?",
      "Madde döngülerine insan etkisi nasıldır?",
      "Madde döngüleri ve çevre kirliliği ilişkisi nedir?",
      "Sürdürülebilirlik ve madde döngüleri ilişkisi nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Madde ve Değişim (Matter and Change)
  if (unitTitle === "Madde ve Değişim") {
    const questions = [
      "Maddenin değişimi ne demektir?",
      "Fiziksel değişim nedir?",
      "Kimyasal değişim nedir?",
      "Fiziksel değişime örnekler nelerdir?",
      "Kimyasal değişime örnekler nelerdir?",
      "Fiziksel ve kimyasal değişim arasındaki fark nedir?",
      "Maddenin korunumu yasası nedir?",
      "Kimyasal tepkimeler nedir?",
      "Yanma olayı nedir?",
      "Oksidasyon ve redüksiyon nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Karışımlar (Mixtures)
  if (unitTitle === "Karışımlar") {
    const questions = [
      "Karışım nedir?",
      "Karışımların özellikleri nelerdir?",
      "Homojen karışım nedir?",
      "Heterojen karışım nedir?",
      "Çözelti nedir?",
      "Süspansiyon nedir?",
      "Emülsiyon nedir?",
      "Karışımları ayırma yöntemleri nelerdir?",
      "Süzme işlemi nedir?",
      "Damıtma işlemi nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Çözünme ve Çözeltiler (Dissolution and Solutions)
  if (unitTitle === "Çözünme ve Çözeltiler") {
    const questions = [
      "Çözünme nedir?",
      "Çözücü ve çözünen maddeler nelerdir?",
      "Çözelti nedir?",
      "Çözünürlük nedir?",
      "Çözünürlüğü etkileyen faktörler nelerdir?",
      "Derişik ve seyreltik çözelti ne demektir?",
      "Çözünme hızı nedir?",
      "Çözünme hızını etkileyen faktörler nelerdir?",
      "Günlük hayatta karşılaştığımız çözeltilere örnekler nelerdir?",
      "Çözünme ısısı nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Asitler ve Bazlar (Acids and Bases)
  if (unitTitle === "Asitler ve Bazlar") {
    const questions = [
      "Asit nedir?",
      "Baz nedir?",
      "Asitler ve bazlar arasındaki farklar nelerdir?",
      "Asitlerin özellikleri nelerdir?",
      "Bazların özellikleri nelerdir?",
      "pH ölçeği nedir?",
      "Günlük hayatta karşılaştığımız asitlere örnekler nelerdir?",
      "Günlük hayatta karşılaştığımız bazlara örnekler nelerdir?",
      "Asit yağmurları nedir ve nasıl oluşur?",
      "Nötrleşme tepkimesi nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Saf Maddeler (Pure Substances)
  if (unitTitle === "Saf Maddeler") {
    const questions = [
      "Saf madde nedir?",
      "Element nedir?",
      "Bileşik nedir?",
      "Element ve bileşik arasındaki farklar nelerdir?",
      "Atomun yapısı nasıldır?",
      "Periyodik tablo nedir?",
      "Metaller nelerdir?",
      "Ametaller nelerdir?",
      "Günlük hayatta kullandığımız elementlere örnekler nelerdir?",
      "Kimyasal formül nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Doğal Kaynaklar (Natural Resources)
  if (unitTitle === "Doğal Kaynaklar") {
    const questions = [
      "Doğal kaynak nedir?",
      "Yenilenebilir doğal kaynaklar nelerdir?",
      "Yenilenemeyen doğal kaynaklar nelerdir?",
      "Hava bir doğal kaynak mıdır?",
      "Su bir doğal kaynak mıdır?",
      "Toprak bir doğal kaynak mıdır?",
      "Fosil yakıtlar nelerdir?",
      "Madenlerin önemi nedir?",
      "Doğal kaynakların korunması neden önemlidir?",
      "Doğal kaynakların verimli kullanımı nasıl olur?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Kimya ve Çevre (Chemistry and Environment)
  if (unitTitle === "Kimya ve Çevre") {
    const questions = [
      "Kimya ve çevre arasındaki ilişki nedir?",
      "Çevre kirliliği nedir?",
      "Hava kirliliği nedir ve nedenleri nelerdir?",
      "Su kirliliği nedir ve nedenleri nelerdir?",
      "Toprak kirliliği nedir ve nedenleri nelerdir?",
      "Geri dönüşüm nedir?",
      "Geri dönüştürülebilen maddeler nelerdir?",
      "Küresel ısınma nedir?",
      "Sera etkisi nedir?",
      "Ozon tabakasının incelmesi ne demektir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Default question for other units
  return `${unitTitle} - Soru ${challengeOrder}: Bu soruyu cevaplayın.`;
};

// Function to generate options based on unit, lesson, and challenge
const getOption = (unitTitle: string, lessonOrder: number, challengeOrder: number, optionOrder: number): string => {
  // Options for Madde ve Özellikleri (Matter and Its Properties)
  if (unitTitle === "Madde ve Özellikleri") {
    if (challengeOrder === 1) { // Madde nedir?
      const options = [
        "Sadece katı halindeki varlıklardır",
        "Sadece gözle görülebilenlerdir",
        "Kütle ve hacmi olan her şeydir",
        "Sadece canlı varlıklardır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Kütle nedir?
      const options = [
        "Bir maddenin uzayda kapladığı yerdir",
        "Bir maddenin ağırlığıdır",
        "Bir maddenin yoğunluğudur",
        "Bir maddenin içindeki atom sayısıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Hacim nedir?
      const options = [
        "Bir maddenin kütlesidir",
        "Bir maddenin ağırlığıdır",
        "Bir maddenin yoğunluğudur",
        "Bir maddenin uzayda kapladığı yerdir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Yoğunluk nedir?
      const options = [
        "Bir maddenin ağırlığıdır",
        "Bir maddenin birim hacminin kütlesidir",
        "Bir maddenin hacmidir",
        "Bir maddenin içindeki atom sayısıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Maddenin temel özellikleri
      const options = [
        "Sadece renk ve koku",
        "Kütle, hacim, eylemsizlik, tanecikli yapı",
        "Sadece şekil ve boyut",
        "Sadece sıcaklık ve basınç"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // Eylemsizlik nedir?
      const options = [
        "Bir maddenin hareketi",
        "Bir maddenin durağanlığı",
        "Bir maddenin ağırlığı",
        "Bir maddenin yoğunluğu"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // Tanecikli yapı
      const options = [
        "Maddelerin atomlardan oluşması",
        "Maddelerin moleküllerden oluşması",
        "Maddelerin iyonlardan oluşması",
        "Maddelerin elektrik yükünden oluşması"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // Maddelerin sınıflandırılması
      const options = [
        "Katı, sıvı, gaz",
        "Metal, ametal, metaloid",
        "Doğal, sentetik",
        "Organik, inorganik"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // Ölçme ve birimler
      const options = [
        "Kütle: gram, kilogram, ton",
        "Hacim: litre, mililitre, santilitre",
        "Uzunluk: metre, santimetre, milimetre",
        "Zaman: saniye, dakika, saat"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // Madde mi değil mi?
      const options = [
        "Her şey maddedir",
        "Her şey madde değildir",
        "Sadece canlılar maddedir",
        "Sadece cansızlar maddedir"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Maddenin Halleri (States of Matter)
  if (unitTitle === "Maddenin Halleri") {
    if (challengeOrder === 1) { // Maddenin halleri nelerdir?
      const options = [
        "Katı, sıvı, gaz",
        "Sıcak, ılık, soğuk",
        "Büyük, orta, küçük",
        "Ağır, orta, hafif"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Katı maddelerin özellikleri
      const options = [
        "Belirli şekil ve hacimleri vardır, sıkıştırılamazlar",
        "Belirli şekilleri yoktur, belirli hacimleri vardır",
        "Belirli şekil ve hacimleri yoktur",
        "Sadece belirli şekilleri vardır, hacimleri değişkendir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Sıvı maddelerin özellikleri
      const options = [
        "Belirli şekil ve hacimleri vardır",
        "Belirli şekilleri yoktur, belirli hacimleri vardır, akışkandırlar",
        "Belirli şekil ve hacimleri yoktur",
        "Sadece belirli şekilleri vardır, hacimleri değişkendir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Gaz maddelerin özellikleri
      const options = [
        "Belirli şekil ve hacimleri vardır",
        "Belirli şekilleri yoktur, belirli hacimleri vardır",
        "Belirli şekil ve hacimleri yoktur, sıkıştırılabilirler",
        "Sadece belirli şekilleri vardır, hacimleri değişkendir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Hal değişimi
      const options = [
        "Katıdan sıvıya",
        "Sıvıdan gaze",
        "Gazdan katıya",
        "Herhangi bir hal değişimi yoktur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // Erime ve donma
      const options = [
        "Erime: katıdan sıvıya, donma: sıvıdan katıya",
        "Erime: sıvıdan gaze, donma: gazdan sıvıya",
        "Erime: gazdan katıya, donma: katıdan gaze",
        "Herhangi bir erime ve donma yoktur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // Buharlaşma ve yoğuşma
      const options = [
        "Buharlaşma: sıvıdan gaze, yoğuşma: gazdan sıvıya",
        "Buharlaşma: katıdan sıvıya, yoğuşma: sıvıdan katıya",
        "Buharlaşma: gazdan katıya, yoğuşma: katıdan gaze",
        "Herhangi bir buharlaşma ve yoğuşma yoktur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // Süblimleşme
      const options = [
        "Katıdan direkt gaze",
        "Sıvıdan direkt gaze",
        "Gazdan direkt katıya",
        "Herhangi bir süblimleşme yoktur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // Isı ve sıcaklık
      const options = [
        "Isı: bir maddenin sıcaklığını değiştiren enerji",
        "Sıcaklık: bir maddenin ısısını ölçen değer",
        "Isı: bir maddenin yoğunluğunu değiştiren enerji",
        "Sıcaklık: bir maddenin yoğunluğunu ölçen değer"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // Genleşme ve büzülme
      const options = [
        "Genleşme: bir maddenin ısınmasıyla hacminin artması",
        "Büzülme: bir maddenin soğumasıyla hacminin azalması",
        "Genleşme: bir maddenin soğumasıyla hacminin artması",
        "Büzülme: bir maddenin ısınmasıyla hacminin azalması"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Madde Döngüleri (Matter Cycles)
  if (unitTitle === "Madde Döngüleri") {
    if (challengeOrder === 1) { // Madde döngüsü nedir?
      const options = [
        "Maddelerin doğada sürekli olarak dönüşüm halinde olması ve bir döngü içinde hareket etmesidir",
        "Maddelerin sadece suda çözünmesidir",
        "Maddelerin sadece toprakta bulunmasıdır",
        "Maddelerin sadece canlılar tarafından kullanılmasıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Su döngüsü
      const options = [
        "Suyun buharlaşması, yoğuşması ve yağmur olarak geri dönmesi",
        "Suyun sadece buharlaşması",
        "Suyun sadece yoğuşması",
        "Suyun sadece yağmur olarak geri dönmesi"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Karbon döngüsü
      const options = [
        "Karbonun canlılar ve cansızlar arasında dönüşüm halinde olması",
        "Karbonun sadece canlılar tarafından kullanılması",
        "Karbonun sadece cansızlar tarafından kullanılması",
        "Karbonun hiç dönüşüm halinde olmaması"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Azot döngüsü
      const options = [
        "Azotun canlılar ve cansızlar arasında dönüşüm halinde olması",
        "Azotun sadece canlılar tarafından kullanılması",
        "Azotun sadece cansızlar tarafından kullanılması",
        "Azotun hiç dönüşüm halinde olmaması"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Oksijen döngüsü
      const options = [
        "Oksijenin canlılar ve cansızlar arasında dönüşüm halinde olması",
        "Oksijenin sadece canlılar tarafından kullanılması",
        "Oksijenin sadece cansızlar tarafından kullanılması",
        "Oksijenin hiç dönüşüm halinde olmaması"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // Fosfor döngüsü
      const options = [
        "Fosforun canlılar ve cansızlar arasında dönüşüm halinde olması",
        "Fosforun sadece canlılar tarafından kullanılması",
        "Fosforun sadece cansızlar tarafından kullanılması",
        "Fosforun hiç dönüşüm halinde olmaması"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // Madde döngülerinin önemi
      const options = [
        "Doğanın dengesini sağlar",
        "Canlıların yaşamasını sağlar",
        "Cansızların oluşmasını sağlar",
        "Hiçbir önemi yoktur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // İnsan etkisi
      const options = [
        "Madde döngülerini bozar",
        "Madde döngülerini hızlandırır",
        "Madde döngülerini yavaşlatır",
        "Madde döngülerine hiç etkisi yoktur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // Çevre kirliliği
      const options = [
        "Madde döngülerinin bozulmasına neden olur",
        "Madde döngülerinin hızlanmasına neden olur",
        "Madde döngülerinin yavaşlamasına neden olur",
        "Madde döngülerine hiç etkisi yoktur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // Sürdürülebilirlik
      const options = [
        "Doğal kaynakların verimli kullanılması",
        "Doğal kaynakların aşırı kullanılması",
        "Doğal kaynakların hiç kullanılması",
        "Doğal kaynakların bilinçsiz kullanılması"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Madde ve Değişim (Matter and Change)
  if (unitTitle === "Madde ve Değişim") {
    if (challengeOrder === 1) { // Maddenin değişimi ne demektir?
      const options = [
        "Maddenin fiziksel veya kimyasal olarak değişmesi",
        "Maddenin hiç değişmemesi",
        "Maddenin sadece fiziksel olarak değişmesi",
        "Maddenin sadece kimyasal olarak değişmesi"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Fiziksel değişim nedir?
      const options = [
        "Maddenin şeklinin, hacminin veya yoğunluğunun değişmesi",
        "Maddenin kimyasal yapısının değişmesi",
        "Maddenin hiç değişmemesi",
        "Maddenin sadece kimyasal olarak değişmesi"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Kimyasal değişim nedir?
      const options = [
        "Maddenin kimyasal yapısının değişmesi",
        "Maddenin şeklinin, hacminin veya yoğunluğunun değişmesi",
        "Maddenin hiç değişmemesi",
        "Maddenin sadece fiziksel olarak değişmesi"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Fiziksel değişime örnekler nelerdir?
      const options = [
        "Buharlaşma, yoğuşma, erime, donma",
        "Yanma, oksidasyon, redüksiyon",
        "Süblimleşme, sublimasyon",
        "Hiçbir fiziksel değişim yoktur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Kimyasal değişime örnekler nelerdir?
      const options = [
        "Yanma, oksidasyon, redüksiyon",
        "Buharlaşma, yoğuşma, erime, donma",
        "Süblimleşme, sublimasyon",
        "Hiçbir kimyasal değişim yoktur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // Fiziksel ve kimyasal değişim arasındaki fark nedir?
      const options = [
        "Fiziksel değişim, maddenin kimyasal yapısını değiştirmezken, kimyasal değişim değiştirir",
        "Fiziksel değişim, maddenin kimyasal yapısını değiştirirken, kimyasal değişim değiştirmez",
        "Her ikisi de aynı şeydir",
        "Fiziksel değişim sadece sıvılarda olur, kimyasal değişim katılarda"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // Maddenin korunumu yasası nedir?
      const options = [
        "Kimyasal tepkimelerde madde yok olmaz, sadece şekil değiştirir",
        "Maddenin her zaman yok olabileceği",
        "Maddenin sadece fiziksel değişimlerde korunması",
        "Maddenin sadece kimyasal değişimlerde korunması"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // Kimyasal tepkimeler nedir?
      const options = [
        "Maddelerin birbirleriyle etkileşime girmesi",
        "Maddelerin fiziksel olarak değişmesi",
        "Maddelerin hiç değişmemesi",
        "Maddelerin sadece sıvı halde etkileşime girmesi"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // Yanma olayı nedir?
      const options = [
        "Bir maddenin oksijenle tepkimeye girmesi",
        "Bir maddenin su ile tepkimeye girmesi",
        "Bir maddenin ısı ile tepkimeye girmesi",
        "Bir maddenin gaz haline geçmesi"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // Oksidasyon ve redüksiyon nedir?
      const options = [
        "Oksidasyon: bir maddenin oksijenle birleşmesi, redüksiyon: oksijenin ayrılması",
        "Oksidasyon: bir maddenin su ile birleşmesi, redüksiyon: suyun ayrılması",
        "Oksidasyon: bir maddenin ısı ile birleşmesi, redüksiyon: ısının ayrılması",
        "Oksidasyon ve redüksiyon birbirinin zıttıdır"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Karışımlar (Mixtures)
  if (unitTitle === "Karışımlar") {
    if (challengeOrder === 1) { // Karışım nedir?
      const options = [
        "Birden fazla maddenin bir araya gelmesi",
        "Tek bir maddenin varlığı",
        "Sadece sıvıların bir araya gelmesi",
        "Sadece katıların bir araya gelmesi"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Karışımların özellikleri nelerdir?
      const options = [
        "Farklı maddelerin özelliklerini taşır",
        "Sadece bir maddenin özelliklerini taşır",
        "Sadece sıvıların özelliklerini taşır",
        "Sadece katıların özelliklerini taşır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Homojen karışım nedir?
      const options = [
        "Herhangi bir bileşenin görünmediği karışım",
        "Bileşenlerin ayrı ayrı görülebildiği karışım",
        "Sadece sıvıların karışımı",
        "Sadece katıların karışımı"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Heterojen karışım nedir?
      const options = [
        "Bileşenlerin ayrı ayrı görülebildiği karışım",
        "Herhangi bir bileşenin görünmediği karışım",
        "Sadece sıvıların karışımı",
        "Sadece katıların karışımı"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Çözelti nedir?
      const options = [
        "Bir maddenin diğer bir madde içinde erimesi",
        "Bir maddenin diğer bir madde ile karıştırılması",
        "Sadece sıvıların karışımı",
        "Sadece katıların karışımı"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // Süspansiyon nedir?
      const options = [
        "Katı taneciklerin sıvı içinde askıda kalması",
        "Sıvı taneciklerin katı içinde askıda kalması",
        "Gaz taneciklerin sıvı içinde askıda kalması",
        "Hiçbir tanecik askıda kalmaz"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // Emülsiyon nedir?
      const options = [
        "İki sıvının birbirine karışmaması",
        "İki sıvının birbirine karışması",
        "Sıvı ve katıların karışması",
        "Gaz ve sıvıların karışması"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // Karışımları ayırma yöntemleri nelerdir?
      const options = [
        "Süzme, damıtma, buharlaştırma, mıknatısla ayırma",
        "Sadece süzme ve damıtma",
        "Sadece buharlaştırma ve mıknatısla ayırma",
        "Hiçbir yöntem yoktur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // Süzme işlemi nedir?
      const options = [
        "Katı taneciklerin sıvıdan ayrılması",
        "Sıvı taneciklerin katıdan ayrılması",
        "Gaz taneciklerin sıvıdan ayrılması",
        "Hiçbir tanecik ayrılmaz"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // Damıtma işlemi nedir?
      const options = [
        "Sıvıların buharlaştırılması ve yoğuşması",
        "Katıların buharlaştırılması ve yoğuşması",
        "Gazların buharlaştırılması ve yoğuşması",
        "Hiçbir madde buharlaştırılmaz ve yoğuşmaz"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Çözünme ve Çözeltiler (Dissolution and Solutions)
  if (unitTitle === "Çözünme ve Çözeltiler") {
    if (challengeOrder === 1) { // Çözünme nedir?
      const options = [
        "Bir maddenin diğer bir madde içinde erimesi",
        "Bir maddenin diğer bir madde ile karıştırılması",
        "Sadece sıvıların karışımı",
        "Sadece katıların karışımı"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Çözücü ve çözünen maddeler nelerdir?
      const options = [
        "Çözücü: eriten madde, çözünen: eriyen madde",
        "Çözücü: eriyen madde, çözünen: eriten madde",
        "Çözücü ve çözünen aynı şeydir",
        "Hiçbir madde çözücü veya çözünen değildir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Çözelti nedir?
      const options = [
        "Bir maddenin diğer bir madde içinde erimesi",
        "Bir maddenin diğer bir madde ile karıştırılması",
        "Sadece sıvıların karışımı",
        "Sadece katıların karışımı"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Çözünürlük nedir?
      const options = [
        "Bir maddenin diğer bir madde içinde erime yeteneği",
        "Bir maddenin diğer bir madde ile karıştırma yeteneği",
        "Sadece sıvıların karışma yeteneği",
        "Sadece katıların karışma yeteneği"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Çözünürlüğü etkileyen faktörler nelerdir?
      const options = [
        "Sıcaklık, basınç, çözücü ve çözünen maddenin doğası",
        "Sadece sıcaklık",
        "Sadece basınç",
        "Hiçbir faktör yoktur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // Derişik ve seyreltik çözelti ne demektir?
      const options = [
        "Derişik: yüksek oranda çözünen madde, seyreltik: düşük oranda çözünen madde",
        "Derişik: düşük oranda çözünen madde, seyreltik: yüksek oranda çözünen madde",
        "Derişik ve seyreltik aynı şeydir",
        "Hiçbir çözelti derişik veya seyreltik değildir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // Çözünme hızı nedir?
      const options = [
        "Bir maddenin diğer bir madde içinde erime hızını",
        "Bir maddenin diğer bir madde ile karıştırma hızını",
        "Sadece sıvıların karışma hızını",
        "Sadece katıların karışma hızını"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // Çözünme hızını etkileyen faktörler nelerdir?
      const options = [
        "Sıcaklık, basınç, çözücü ve çözünen maddenin doğası",
        "Sadece sıcaklık",
        "Sadece basınç",
        "Hiçbir faktör yoktur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // Günlük hayatta karşılaştığımız çözeltilere örnekler nelerdir?
      const options = [
        "Şekerli su, tuzlu su, limonlu su",
        "Sadece şekerli su",
        "Sadece tuzlu su",
        "Hiçbir çözelti yoktur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // Çözünme ısısı nedir?
      const options = [
        "Bir maddenin diğer bir madde içinde erimesi için gereken ısı",
        "Bir maddenin diğer bir madde ile karıştırması için gereken ısı",
        "Sadece sıvıların karışması için gereken ısı",
        "Sadece katıların karışması için gereken ısı"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Asitler ve Bazlar (Acids and Bases)
  if (unitTitle === "Asitler ve Bazlar") {
    if (challengeOrder === 1) { // Asit nedir?
      const options = [
        "Hidrojen iyonu (H+) içeren madde",
        "Hidroksit iyonu (OH-) içeren madde",
        "Sadece sıvı asit",
        "Sadece katı asit"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Baz nedir?
      const options = [
        "Hidroksit iyonu (OH-) içeren madde",
        "Hidrojen iyonu (H+) içeren madde",
        "Sadece sıvı baz",
        "Sadece katı baz"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Asitler ve bazlar arasındaki farklar nelerdir?
      const options = [
        "Asitler hidrojen iyonu (H+) içerir, bazlar hidroksit iyonu (OH-) içerir",
        "Asitler hidroksit iyonu (OH-) içerir, bazlar hidrojen iyonu (H+) içerir",
        "Asitler ve bazlar aynı şeydir",
        "Hiçbir fark yoktur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Asitlerin özellikleri nelerdir?
      const options = [
        "Tatları ekşi, kokuları keskin, rengi renksiz",
        "Tatları tatlı, kokuları hoş, rengi renkli",
        "Sadece sıvı asit",
        "Sadece katı asit"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Bazların özellikleri nelerdir?
      const options = [
        "Tatları tatlı, kokuları hoş, rengi renkli",
        "Tatları ekşi, kokuları keskin, rengi renksiz",
        "Sadece sıvı baz",
        "Sadece katı baz"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // pH ölçeği nedir?
      const options = [
        "Asitlik veya bazlık derecesini ölçen ölçek",
        "Sıcaklık ölçen ölçek",
        "Basınç ölçen ölçek",
        "Hiçbir şey ölçen ölçek"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // Günlük hayatta karşılaştığımız asitlere örnekler nelerdir?
      const options = [
        "Limon suyu, sirke, asit yağmuru",
        "Sadece limon suyu",
        "Sadece sirke",
        "Hiçbir asit yoktur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // Günlük hayatta karşılaştığımız bazlara örnekler nelerdir?
      const options = [
        "Sabun, çamaşır suyu, kireç",
        "Sadece sabun",
        "Sadece çamaşır suyu",
        "Hiçbir baz yoktur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // Asit yağmurları nedir ve nasıl oluşur?
      const options = [
        "Havada bulunan asitlerin yağmur olarak düşmesi",
        "Havada bulunan bazların yağmur olarak düşmesi",
        "Sadece sıvı asitlerin yağmur olarak düşmesi",
        "Hiçbir asit yağmuru yoktur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // Nötrleşme tepkimesi nedir?
      const options = [
        "Asit ve bazın birleşerek nötr bir madde oluşturması",
        "Asit ve bazın birleşerek asit veya baz oluşturması",
        "Sadece asitlerin birleşerek nötr bir madde oluşturması",
        "Sadece bazların birleşerek nötr bir madde oluşturması"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Saf Maddeler (Pure Substances)
  if (unitTitle === "Saf Maddeler") {
    if (challengeOrder === 1) { // Saf madde nedir?
      const options = [
        "Tek bir element veya bileşikten oluşan madde",
        "Birden fazla element veya bileşikten oluşan madde",
        "Sadece sıvı saf madde",
        "Sadece katı saf madde"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Element nedir?
      const options = [
        "Tek bir tür atomdan oluşan madde",
        "Birden fazla tür atomdan oluşan madde",
        "Sadece sıvı element",
        "Sadece katı element"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Bileşik nedir?
      const options = [
        "Birden fazla elementin birleşerek oluşturduğu madde",
        "Tek bir elementin oluşturduğu madde",
        "Sadece sıvı bileşik",
        "Sadece katı bileşik"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Element ve bileşik arasındaki farklar nelerdir?
      const options = [
        "Element tek bir tür atomdan oluşur, bileşik birden fazla elementten oluşur",
        "Element birden fazla elementten oluşur, bileşik tek bir tür atomdan oluşur",
        "Element ve bileşik aynı şeydir",
        "Hiçbir fark yoktur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Atomun yapısı nasıldır?
      const options = [
        "Proton, nötron ve elektronlardan oluşur",
        "Sadece proton ve nötronlardan oluşur",
        "Sadece elektronlardan oluşur",
        "Hiçbir şeyden oluşmaz"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // Periyodik tablo nedir?
      const options = [
        "Elementlerin düzenlenerek gösterildiği tablo",
        "Bileşiklerin düzenlenerek gösterildiği tablo",
        "Sadece sıvı elementlerin düzenlenerek gösterildiği tablo",
        "Sadece katı elementlerin düzenlenerek gösterildiği tablo"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // Metaller nelerdir?
      const options = [
        "Genellikle sıvı veya katı halde bulunan, iyi iletkenlik gösteren maddeler",
        "Genellikle gaz halde bulunan, kötü iletkenlik gösteren maddeler",
        "Sadece sıvı metaller",
        "Sadece katı metaller"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // Ametaller nelerdir?
      const options = [
        "Genellikle gaz halde bulunan, kötü iletkenlik gösteren maddeler",
        "Genellikle sıvı veya katı halde bulunan, iyi iletkenlik gösteren maddeler",
        "Sadece sıvı ametaller",
        "Sadece katı ametaller"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // Günlük hayatta kullandığımız elementlere örnekler nelerdir?
      const options = [
        "Oksijen, karbon, demir, bakır",
        "Sadece oksijen",
        "Sadece karbon",
        "Hiçbir element yoktur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // Kimyasal formül nedir?
      const options = [
        "Bir maddenin kimyasal bileşimini gösteren formül",
        "Bir maddenin fiziksel özelliklerini gösteren formül",
        "Sadece sıvı maddelerin kimyasal bileşimini gösteren formül",
        "Sadece katı maddelerin kimyasal bileşimini gösteren formül"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Doğal Kaynaklar (Natural Resources)
  if (unitTitle === "Doğal Kaynaklar") {
    if (challengeOrder === 1) { // Doğal kaynak nedir?
      const options = [
        "Doğada bulunan, insan tarafından kullanılan kaynaklar",
        "Doğada bulunmayan, insan tarafından kullanılan kaynaklar",
        "Sadece sıvı kaynaklar",
        "Sadece katı kaynaklar"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Yenilenebilir doğal kaynaklar nelerdir?
      const options = [
        "Güneş enerjisi, rüzgar enerjisi, su enerjisi",
        "Sadece güneş enerjisi",
        "Sadece rüzgar enerjisi",
        "Hiçbir yenilenebilir kaynak yoktur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Yenilenemeyen doğal kaynaklar nelerdir?
      const options = [
        "Kömür, petrol, doğalgaz",
        "Sadece kömür",
        "Sadece petrol",
        "Hiçbir yenilenemeyen kaynak yoktur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Hava bir doğal kaynak mıdır?
      const options = [
        "Evet, hava bir doğal kaynaktır",
        "Hayır, hava bir doğal kaynak değildir",
        "Sadece sıvı hava bir doğal kaynaktır",
        "Sadece katı hava bir doğal kaynaktır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Su bir doğal kaynak mıdır?
      const options = [
        "Evet, su bir doğal kaynaktır",
        "Hayır, su bir doğal kaynak değildir",
        "Sadece sıvı su bir doğal kaynaktır",
        "Sadece katı su bir doğal kaynaktır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // Toprak bir doğal kaynak mıdır?
      const options = [
        "Evet, toprak bir doğal kaynaktır",
        "Hayır, toprak bir doğal kaynak değildir",
        "Sadece sıvı toprak bir doğal kaynaktır",
        "Sadece katı toprak bir doğal kaynaktır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // Fosil yakıtlar nelerdir?
      const options = [
        "Kömür, petrol, doğalgaz",
        "Sadece kömür",
        "Sadece petrol",
        "Hiçbir fosil yakıt yoktur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // Madenlerin önemi nedir?
      const options = [
        "Madenler enerji üretiminde, sanayide ve teknolojinin gelişmesinde kullanılır",
        "Madenler sadece enerji üretiminde kullanılır",
        "Madenler sadece sanayide kullanılır",
        "Madenler hiçbir şekilde kullanılmaz"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // Doğal kaynakların korunması neden önemlidir?
      const options = [
        "Doğal kaynaklar sınırlıdır ve gelecek nesiller için korunmalıdır",
        "Doğal kaynaklar sınırsızdır ve korunmasına gerek yoktur",
        "Sadece sıvı doğal kaynaklar korunmalıdır",
        "Sadece katı doğal kaynaklar korunmalıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // Doğal kaynakların verimli kullanımı nasıl olur?
      const options = [
        "Doğal kaynaklar verimli bir şekilde kullanılır ve israf edilmez",
        "Doğal kaynaklar israf edilir ve verimli kullanılmaz",
        "Sadece sıvı doğal kaynaklar verimli kullanılır",
        "Sadece katı doğal kaynaklar verimli kullanılır"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Kimya ve Çevre (Chemistry and Environment)
  if (unitTitle === "Kimya ve Çevre") {
    if (challengeOrder === 1) { // Kimya ve çevre arasındaki ilişki nedir?
      const options = [
        "Kimya, çevre için gerekli olan maddelerin üretiminde kullanılır",
        "Kimya, çevre için zararlı olan maddelerin üretiminde kullanılır",
        "Sadece sıvı kimya çevre için önemlidir",
        "Sadece katı kimya çevre için önemlidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Çevre kirliliği nedir?
      const options = [
        "Çevrenin kirletilmesi ve bozulması",
        "Çevrenin temizlenmesi ve korunması",
        "Sadece sıvı çevre kirliliği",
        "Sadece katı çevre kirliliği"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Hava kirliliği nedir ve nedenleri nelerdir?
      const options = [
        "Havanın kirletilmesi ve bozulması, nedenleri arasında sanayi, araçlar ve enerji üretiminde kullanılan yakıtlar bulunur",
        "Havanın temizlenmesi ve korunması",
        "Sadece sıvı hava kirliliği",
        "Sadece katı hava kirliliği"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Su kirliliği nedir ve nedenleri nelerdir?
      const options = [
        "Suyun kirletilmesi ve bozulması, nedenleri arasında sanayi, tarım ve evsel atıklar bulunur",
        "Suyun temizlenmesi ve korunması",
        "Sadece sıvı su kirliliği",
        "Sadece katı su kirliliği"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Toprak kirliliği nedir ve nedenleri nelerdir?
      const options = [
        "Toprağın kirletilmesi ve bozulması, nedenleri arasında tarım, sanayi ve evsel atıklar bulunur",
        "Toprağın temizlenmesi ve korunması",
        "Sadece sıvı toprak kirliliği",
        "Sadece katı toprak kirliliği"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // Geri dönüşüm nedir?
      const options = [
        "Atıkların tekrar kullanılabilir hale getirilmesi",
        "Atıkların yok edilmesi",
        "Sadece sıvı atıkların geri dönüşümü",
        "Sadece katı atıkların geri dönüşümü"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // Geri dönüştürülebilen maddeler nelerdir?
      const options = [
        "Kağıt, cam, plastik, metal",
        "Sadece kağıt",
        "Sadece cam",
        "Hiçbir madde geri dönüştürülemez"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // Küresel ısınma nedir?
      const options = [
        "Dünya'nın ortalama sıcaklığının artması",
        "Dünya'nın ortalama sıcaklığının azalması",
        "Sadece sıvı küresel ısınma",
        "Sadece katı küresel ısınma"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // Sera etkisi nedir?
      const options = [
        "Gazların atmosferde birikerek Dünya'nın sıcaklığını artırması",
        "Gazların atmosferde birikerek Dünya'nın sıcaklığını azaltması",
        "Sadece sıvı sera etkisi",
        "Sadece katı sera etkisi"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // Ozon tabakasının incelmesi ne demektir?
      const options = [
        "Ozon tabakasının kalınlaşması",
        "Ozon tabakasının incelenmesi",
        "Sadece sıvı ozon tabakasının incelmesi",
        "Sadece katı ozon tabakasının incelmesi"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Default options for other questions
  const defaultOptions = [
    "Doğru cevap",
    "Yanlış cevap",
    "Kısmen doğru cevap",
    "İlgisiz cevap"
  ];
  
  return defaultOptions[optionOrder - 1];
};

main().catch((err) => {
  console.error(
    "An error occurred while attempting to seed the database:",
    err
  );
});