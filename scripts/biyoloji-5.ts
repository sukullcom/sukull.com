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
    console.log("Creating Biyoloji (Biology) course for 5th grade");

    // Insert the course
    const [course] = await db
      .insert(schema.courses)
      .values({ title: "Biyoloji 5. Sınıf", imageSrc: "/biyoloji-5.svg" })
      .returning();

    // Unit names for 5th grade Biology in Turkish curriculum
    const unitNames = [
      { title: "Canlılar Dünyası", description: "Canlıların sınıflandırılması ve temel özellikleri" },
      { title: "İnsan Vücudu", description: "İnsan vücudundaki sistemler ve organlar" },
      { title: "Bitki ve Hayvan Hücreleri", description: "Hücre yapısı ve çeşitleri" },
      { title: "Bitkiler", description: "Bitkilerin yapısı, çeşitleri ve özellikleri" },
      { title: "Hayvanlar", description: "Hayvanların yapısı, çeşitleri ve özellikleri" },
      { title: "Mikroskobik Canlılar", description: "Gözle görülemeyen mikroorganizmalar" },
      { title: "Ekosistemler", description: "Canlıların yaşam alanları ve ekolojik ilişkiler" },
      { title: "Beslenme", description: "Beslenme şekilleri ve besin zinciri" },
      { title: "Sağlıklı Yaşam", description: "Sağlıklı yaşam için gerekli bilgiler" },
      { title: "Genetik", description: "Kalıtım ve genetik çeşitlilik" }
    ];

    // Create units for the Biyoloji course
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
        `${unitNames[i].title} - İnceleme ve Gözlemler`,
        `${unitNames[i].title} - Günlük Hayatta Önemi`,
        `${unitNames[i].title} - Uygulama ve Etkinlikler`,
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
        
        // Create challenges for each unit
        await createChallenges(lesson.id, unitNames[i].title, j + 1);
      }
    }

    console.log("5th grade Biyoloji course created successfully.");
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
  // For "Canlılar Dünyası" unit (Living World)
  if (unitTitle === "Canlılar Dünyası") {
    if (challengeOrder === 1 && optionOrder === 2) return true; // Canlı nedir?
    if (challengeOrder === 2 && optionOrder === 4) return true; // Canlıların ortak özellikleri
    if (challengeOrder === 3 && optionOrder === 1) return true; // Canlılar nasıl sınıflandırılır?
    if (challengeOrder === 4 && optionOrder === 3) return true; // Omurgalı hayvanlar
    if (challengeOrder === 5 && optionOrder === 2) return true; // Omurgasız hayvanlar
    if (challengeOrder === 6 && optionOrder === 4) return true; // Bitkiler
    if (challengeOrder === 7 && optionOrder === 1) return true; // Mantarlar
    if (challengeOrder === 8 && optionOrder === 3) return true; // Bakteriler
    if (challengeOrder === 9 && optionOrder === 2) return true; // Protistler
    if (challengeOrder === 10 && optionOrder === 4) return true; // Virüsler
  }
  
  // For "İnsan Vücudu" unit (Human Body)
  else if (unitTitle === "İnsan Vücudu") {
    if (challengeOrder === 1 && optionOrder === 3) return true; // İnsan vücudu sistemleri
    if (challengeOrder === 2 && optionOrder === 1) return true; // Sindirim sistemi
    if (challengeOrder === 3 && optionOrder === 4) return true; // Dolaşım sistemi
    if (challengeOrder === 4 && optionOrder === 2) return true; // Solunum sistemi
    if (challengeOrder === 5 && optionOrder === 3) return true; // Boşaltım sistemi
    if (challengeOrder === 6 && optionOrder === 1) return true; // İskelet sistemi
    if (challengeOrder === 7 && optionOrder === 4) return true; // Kas sistemi
    if (challengeOrder === 8 && optionOrder === 2) return true; // Sinir sistemi
    if (challengeOrder === 9 && optionOrder === 3) return true; // Duyu organları
    if (challengeOrder === 10 && optionOrder === 1) return true; // Üreme sistemi
  }

  // For "Bitki ve Hayvan Hücreleri" unit (Plant and Animal Cells)
  else if (unitTitle === "Bitki ve Hayvan Hücreleri") {
    if (challengeOrder === 1 && optionOrder === 2) return true; // Hücre nedir?
    if (challengeOrder === 2 && optionOrder === 4) return true; // Hücre zarı
    if (challengeOrder === 3 && optionOrder === 1) return true; // Sitoplazma
    if (challengeOrder === 4 && optionOrder === 3) return true; // Çekirdek
    if (challengeOrder === 5 && optionOrder === 2) return true; // Mitokondri
    if (challengeOrder === 6 && optionOrder === 4) return true; // Kloroplast
    if (challengeOrder === 7 && optionOrder === 1) return true; // Bitki ve hayvan hücresi farkları
    if (challengeOrder === 8 && optionOrder === 3) return true; // Hücre duvarı
    if (challengeOrder === 9 && optionOrder === 2) return true; // Hücre bölünmesi
    if (challengeOrder === 10 && optionOrder === 4) return true; // Doku nedir?
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
  // Questions for Canlılar Dünyası (Living World)
  if (unitTitle === "Canlılar Dünyası") {
    const questions = [
      "Canlı nedir?",
      "Canlıların ortak özellikleri nelerdir?",
      "Canlılar nasıl sınıflandırılır?",
      "Omurgalı hayvanlar nelerdir?",
      "Omurgasız hayvanlar nelerdir?",
      "Bitkiler aleminin özellikleri nelerdir?",
      "Mantarlar aleminin özellikleri nelerdir?",
      "Bakterilerin özellikleri nelerdir?",
      "Protistlerin özellikleri nelerdir?",
      "Virüsler canlı mıdır?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for İnsan Vücudu (Human Body)
  if (unitTitle === "İnsan Vücudu") {
    const questions = [
      "İnsan vücudundaki sistemler nelerdir?",
      "Sindirim sisteminin görevi nedir?",
      "Dolaşım sisteminin görevi nedir?",
      "Solunum sisteminin görevi nedir?",
      "Boşaltım sisteminin görevi nedir?",
      "İskelet sisteminin görevi nedir?",
      "Kas sisteminin görevi nedir?",
      "Sinir sisteminin görevi nedir?",
      "Duyu organlarının görevleri nelerdir?",
      "Üreme sisteminin görevi nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Bitki ve Hayvan Hücreleri (Plant and Animal Cells)
  if (unitTitle === "Bitki ve Hayvan Hücreleri") {
    const questions = [
      "Hücre nedir?",
      "Hücre zarının görevi nedir?",
      "Sitoplazmanın görevi nedir?",
      "Çekirdeğin görevi nedir?",
      "Mitokondrinin görevi nedir?",
      "Kloroplastın görevi nedir?",
      "Bitki ve hayvan hücresi arasındaki farklar nelerdir?",
      "Hücre duvarının görevi nedir?",
      "Hücre bölünmesi nedir?",
      "Doku nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Bitkiler (Plants)
  if (unitTitle === "Bitkiler") {
    const questions = [
      "Bitkilerin temel özellikleri nelerdir?",
      "Çiçekli ve çiçeksiz bitkiler arasındaki farklar nelerdir?",
      "Bitkilerde fotosentez nedir?",
      "Kök, gövde ve yaprak nedir?",
      "Bitkilerde üreme nasıl gerçekleşir?",
      "Tohumlu ve tohumsuz bitkiler nelerdir?",
      "Tek yıllık ve çok yıllık bitkiler nelerdir?",
      "Bitkiler nasıl sınıflandırılır?",
      "Bitkilerin insanlar için önemi nedir?",
      "Bitkilerde solunum nasıl gerçekleşir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Hayvanlar (Animals)
  if (unitTitle === "Hayvanlar") {
    const questions = [
      "Hayvanların temel özellikleri nelerdir?",
      "Omurgalı ve omurgasız hayvanlar nelerdir?",
      "Memelilerin özellikleri nelerdir?",
      "Kuşların özellikleri nelerdir?",
      "Sürüngenlerin özellikleri nelerdir?",
      "İki yaşamlıların özellikleri nelerdir?",
      "Balıkların özellikleri nelerdir?",
      "Böceklerin özellikleri nelerdir?",
      "Hayvanların yaşam alanlarına göre sınıflandırılması nasıldır?",
      "Evcil ve yabani hayvanlar arasındaki farklar nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Mikroskobik Canlılar (Microscopic Organisms)
  if (unitTitle === "Mikroskobik Canlılar") {
    const questions = [
      "Mikroskobik canlılar nelerdir?",
      "Bakterilerin yapısı nasıldır?",
      "Virüslerin yapısı nasıldır?",
      "Protistlerin özellikleri nelerdir?",
      "Mantarların yapısı nasıldır?",
      "Mikroskobik canlıların faydaları nelerdir?",
      "Mikroskobik canlıların zararları nelerdir?",
      "Hastalık yapan mikroorganizmalar nelerdir?",
      "Mikroskop nedir ve nasıl kullanılır?",
      "Gözle görülemeyecek kadar küçük canlılar nasıl keşfedilmiştir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Ekosistemler (Ecosystems)
  if (unitTitle === "Ekosistemler") {
    const questions = [
      "Ekosistem nedir?",
      "Biyotik ve abiyotik faktörler nelerdir?",
      "Habitat nedir?",
      "Besin zinciri nedir?",
      "Besin ağı nedir?",
      "Üretici, tüketici ve ayrıştırıcılar nelerdir?",
      "Ekolojik denge nedir?",
      "Çevre kirliliğinin ekosistemler üzerindeki etkileri nelerdir?",
      "Nesli tükenmekte olan canlılar neden korunmalıdır?",
      "İnsanların ekosistemlere etkileri nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Beslenme (Nutrition)
  if (unitTitle === "Beslenme") {
    const questions = [
      "Beslenme nedir?",
      "Besin grupları nelerdir?",
      "Karbonhidratlar nelerdir?",
      "Proteinler nelerdir?",
      "Yağlar nelerdir?",
      "Vitaminler nelerdir?",
      "Mineraller nelerdir?",
      "Su neden önemlidir?",
      "Sağlıklı beslenme nedir?",
      "Dengeli beslenme için neler yapılmalıdır?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Sağlıklı Yaşam (Healthy Living)
  if (unitTitle === "Sağlıklı Yaşam") {
    const questions = [
      "Sağlıklı yaşam nedir?",
      "Düzenli egzersizin faydaları nelerdir?",
      "Kişisel hijyen neden önemlidir?",
      "Uyku düzeni neden önemlidir?",
      "Zararlı alışkanlıklar nelerdir?",
      "Stresten korunma yolları nelerdir?",
      "Sağlıklı bir çevre neden önemlidir?",
      "Bağışıklık sistemi nedir?",
      "Aşıların önemi nedir?",
      "Düzenli sağlık kontrollerinin önemi nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Genetik (Genetics)
  if (unitTitle === "Genetik") {
    const questions = [
      "Genetik nedir?",
      "DNA nedir?",
      "Gen nedir?",
      "Kromozom nedir?",
      "Kalıtım nedir?",
      "Dominant ve resesif özellikler nelerdir?",
      "Aileden gelen özellikler nelerdir?",
      "İkizler arasındaki benzerlik ve farklılıklar nelerdir?",
      "Genetik çeşitlilik neden önemlidir?",
      "Genetik mühendisliği nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Default question for other units
  return `${unitTitle} - Soru ${challengeOrder}: Bu soruyu cevaplayın.`;
};

// Function to generate options based on unit, lesson, and challenge
const getOption = (unitTitle: string, lessonOrder: number, challengeOrder: number, optionOrder: number): string => {
  // Options for Canlılar Dünyası (Living World)
  if (unitTitle === "Canlılar Dünyası") {
    if (challengeOrder === 1) { // Canlı nedir?
      const options = [
        "Sadece insanlar ve hayvanlar için kullanılan bir terimdir",
        "Doğan, büyüyen, çoğalan, solunum yapan, beslenme ihtiyacı olan ve ölen varlıklardır",
        "Sadece hareket edebilen varlıklardır",
        "Sadece konuşabilen varlıklardır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Canlıların ortak özellikleri
      const options = [
        "Sadece büyümek ve çoğalmak",
        "Sadece hareket etmek",
        "Sadece beslenme ve solunum yapmak",
        "Beslenme, solunum, hareket, üreme, büyüme, gelişme, uyarılara tepki verme ve boşaltım yapma"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Canlıların ortak özellikleri nelerdir?
      const options = [
        "Sadece beslenme ve solunum",
        "Beslenme, solunum, boşaltım, hareket, uyarılara tepki, üreme ve büyüme",
        "Sadece hareket ve üreme",
        "Sadece büyüme ve gelişme"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Canlılar kaç grupta incelenir?
      const options = [
        "İki grupta: Bitkiler ve hayvanlar",
        "Üç grupta: Bitkiler, hayvanlar ve mantarlar",
        "Dört grupta: Bitkiler, hayvanlar, mantarlar ve mikroorganizmalar",
        "Beş grupta: Bitkiler, hayvanlar, mantarlar, mikroorganizmalar ve virüsler"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Mikroskobik canlılar nelerdir?
      const options = [
        "Sadece bakteriler",
        "Bakteriler, bazı mantarlar, protistler ve virüsler",
        "Sadece virüsler",
        "Sadece protistler"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for İnsan Vücudu (Human Body)
  if (unitTitle === "İnsan Vücudu") {
    if (challengeOrder === 1) { // İnsan vücudundaki sistemler nelerdir?
      const options = [
        "Sadece sindirim ve dolaşım sistemleri",
        "Sindirim, dolaşım, solunum, boşaltım, hareket, sinir, üreme ve duyu sistemleri",
        "Sadece solunum ve boşaltım sistemleri",
        "Sadece hareket ve sinir sistemleri"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Sindirim sistemi nedir?
      const options = [
        "Besinlerin vücuda alınması, sindirilmesi ve emilmesini sağlayan sistemdir",
        "Vücuttaki atık maddelerin dışarı atılmasını sağlayan sistemdir",
        "Vücudun hareket etmesini sağlayan sistemdir",
        "Vücudun oksijen almasını sağlayan sistemdir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Dolaşım sistemi nedir?
      const options = [
        "Vücudun hareket etmesini sağlayan sistemdir",
        "Besinlerin vücuda alınmasını sağlayan sistemdir",
        "Kanın vücutta dolaşmasını sağlayan sistemdir",
        "Vücuttaki atık maddelerin dışarı atılmasını sağlayan sistemdir"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Bitki ve Hayvan Hücreleri (Plant and Animal Cells)
  if (unitTitle === "Bitki ve Hayvan Hücreleri") {
    if (challengeOrder === 1) { // Hücre nedir?
      const options = [
        "Sadece bitkilerde bulunan yapılardır",
        "Canlıların yapı ve işlev birimi olan, zarla çevrili yapılardır",
        "Sadece hayvanlarda bulunan yapılardır",
        "Sadece mikroskopla görülebilen canlılardır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Hücre zarı
      const options = [
        "Sadece bitki hücrelerinde bulunur",
        "Sadece hayvan hücrelerinde bulunur",
        "Hücrenin içindeki sıvıdır",
        "Hücreyi dış ortamdan ayıran, madde alışverişini kontrol eden yapıdır"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for other subjects
  if (unitTitle === "Hayvanlar") {
    if (challengeOrder === 1) { // Hayvanlar nasıl sınıflandırılır?
      const options = [
        "Sadece karada ve suda yaşayanlar olarak",
        "Omurgalı ve omurgasız hayvanlar olarak",
        "Sadece etçil ve otçul olarak",
        "Sadece evcil ve yabani olarak"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Omurgalı hayvanlar hangileridir?
      const options = [
        "Balıklar, kurbağalar, sürüngenler, kuşlar ve memeliler",
        "Sadece memeliler",
        "Sadece balıklar ve kuşlar",
        "Solucanlar, böcekler ve yumuşakçalar"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Omurgasız hayvanlar hangileridir?
      const options = [
        "Balıklar ve kurbağalar",
        "Solucanlar, böcekler, yumuşakçalar, eklem bacaklılar",
        "Kuşlar ve memeliler",
        "Sadece sürüngenler"
      ];
      return options[optionOrder - 1];
    }
  }
  
  if (unitTitle === "Çevre") {
    if (challengeOrder === 1) { // Çevre nedir?
      const options = [
        "Sadece insanların yaşadığı yerdir",
        "Canlıların yaşadığı ve etkileşimde bulunduğu her yerdir",
        "Sadece ormanlar ve denizlerdir",
        "Sadece şehirlerdir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Çevre kirliliği nedir?
      const options = [
        "Çevrenin doğal yapısının bozulmasıdır",
        "Sadece hava kirliliğidir",
        "Sadece su kirliliğidir",
        "Sadece toprak kirliliğidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Çevre kirliliğini önlemek için neler yapılabilir?
      const options = [
        "Geri dönüşüm yapmak, enerji tasarrufu sağlamak, toplu taşıma kullanmak",
        "Hiçbir şey yapılamaz",
        "Sadece ağaç dikmek",
        "Sadece çöpleri toplamak"
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