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
    console.log("Creating Biyoloji (Biology) course for 8th grade");

    // Insert the course
    const [course] = await db
      .insert(schema.courses)
      .values({ title: "Biyoloji 8. Sınıf", imageSrc: "/biyoloji-8.svg" })
      .returning();

    // Unit names for 8th grade Biology in Turkish curriculum
    const unitNames = [
      { title: "Hücre Bölünmesi", description: "Mitoz ve mayoz bölünme süreçleri" },
      { title: "DNA ve Genetik", description: "Kalıtım ve genetik materyalin yapısı" },
      { title: "Kalıtım", description: "Kalıtım kanunları ve kalıtsal hastalıklar" },
      { title: "Evrim", description: "Evrim teorisi ve kanıtları" },
      { title: "İnsan Fizyolojisi", description: "İnsan vücudundaki sistemlerin çalışma prensipleri" },
      { title: "Sinir Sistemi", description: "Merkezi ve çevresel sinir sistemi" },
      { title: "Duyu Organları", description: "Duyu organlarının yapısı ve işlevi" },
      { title: "Endokrin Sistem", description: "Hormonlar ve endokrin bezler" },
      { title: "Üreme Sistemi", description: "İnsan üreme organları ve üreme fizyolojisi" },
      { title: "Ekoloji", description: "Canlılar ve çevreleri arasındaki ilişkiler" }
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
        `${unitNames[i].title} - Yapı ve İşlev`,
        `${unitNames[i].title} - Laboratuvar Çalışmaları`,
        `${unitNames[i].title} - Günlük Hayatta Örnekler`,
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

    console.log("8th grade Biyoloji course created successfully.");
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
  // For "Hücre Bölünmesi" unit
  if (unitTitle === "Hücre Bölünmesi") {
    if (challengeOrder === 1 && optionOrder === 3) return true;
    if (challengeOrder === 2 && optionOrder === 1) return true;
    if (challengeOrder === 3 && optionOrder === 4) return true;
    if (challengeOrder === 4 && optionOrder === 2) return true;
    if (challengeOrder === 5 && optionOrder === 3) return true;
    if (challengeOrder === 6 && optionOrder === 1) return true;
    if (challengeOrder === 7 && optionOrder === 4) return true;
    if (challengeOrder === 8 && optionOrder === 2) return true;
    if (challengeOrder === 9 && optionOrder === 3) return true;
    if (challengeOrder === 10 && optionOrder === 1) return true;
  }
  
  // For "DNA ve Genetik" unit
  else if (unitTitle === "DNA ve Genetik") {
    if (challengeOrder === 1 && optionOrder === 2) return true;
    if (challengeOrder === 2 && optionOrder === 4) return true;
    if (challengeOrder === 3 && optionOrder === 1) return true;
    if (challengeOrder === 4 && optionOrder === 3) return true;
    if (challengeOrder === 5 && optionOrder === 2) return true;
    if (challengeOrder === 6 && optionOrder === 4) return true;
    if (challengeOrder === 7 && optionOrder === 1) return true;
    if (challengeOrder === 8 && optionOrder === 3) return true;
    if (challengeOrder === 9 && optionOrder === 2) return true;
    if (challengeOrder === 10 && optionOrder === 4) return true;
  }
  
  // For "Kalıtım" unit
  else if (unitTitle === "Kalıtım") {
    if (challengeOrder === 1 && optionOrder === 1) return true;
    if (challengeOrder === 2 && optionOrder === 3) return true;
    if (challengeOrder === 3 && optionOrder === 2) return true;
    if (challengeOrder === 4 && optionOrder === 4) return true;
    if (challengeOrder === 5 && optionOrder === 1) return true;
    if (challengeOrder === 6 && optionOrder === 3) return true;
    if (challengeOrder === 7 && optionOrder === 2) return true;
    if (challengeOrder === 8 && optionOrder === 4) return true;
    if (challengeOrder === 9 && optionOrder === 1) return true;
    if (challengeOrder === 10 && optionOrder === 3) return true;
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
  // Questions for Hücre Bölünmesi (Cell Division)
  if (unitTitle === "Hücre Bölünmesi") {
    const questions = [
      "Mitoz bölünme nedir?",
      "Mayoz bölünme nedir?",
      "Mitoz ve mayoz bölünme arasındaki temel fark nedir?",
      "Mitozun hangi evresinde kromozomlar hücrenin ekvator düzleminde dizilir?",
      "Mayozun hangi evresinde homolog kromozomlar arasında parça değişimi gerçekleşir?",
      "Mitoz bölünme sonucu kaç hücre oluşur?",
      "Mayoz bölünme sonucu kaç hücre oluşur?",
      "Hücre döngüsünde DNA'nın kopyalandığı evre hangisidir?",
      "Mitoz bölünmenin vücudumuzdaki temel görevleri nelerdir?",
      "Mayoz bölünmenin vücudumuzdaki temel görevi nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for DNA ve Genetik (DNA and Genetics)
  if (unitTitle === "DNA ve Genetik") {
    const questions = [
      "DNA (Deoksiribonükleik asit) nedir?",
      "DNA'nın temel yapı birimi nedir?",
      "Bir nükleotidin yapısında bulunan bileşenler nelerdir?",
      "DNA'da bulunan azotlu bazlar hangileridir?",
      "DNA'nın kendini eşlemesi (replikasyon) nasıl gerçekleşir?",
      "Gen nedir?",
      "Kromozom nedir?",
      "RNA (Ribonükleik asit) nedir?",
      "DNA ve RNA arasındaki farklar nelerdir?",
      "Genetik kod nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Kalıtım (Inheritance)
  if (unitTitle === "Kalıtım") {
    const questions = [
      "Kalıtım nedir?",
      "Mendel'in kalıtım kanunları nelerdir?",
      "Baskın ve çekinik gen nedir?",
      "Genotip ve fenotip arasındaki fark nedir?",
      "Eş baskınlık nedir?",
      "Çok alellilik nedir?",
      "Kan gruplarının kalıtımı nasıl gerçekleşir?",
      "Cinsiyete bağlı kalıtım nedir?",
      "Renk körlüğü hangi tür kalıtıma örnektir?",
      "Akraba evliliğinin genetik riskleri nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Evrim (Evolution)
  if (unitTitle === "Evrim") {
    const questions = [
      "Evrim teorisi nedir?",
      "Doğal seçilim nedir?",
      "Adaptasyon nedir?",
      "Evrimin fosil kanıtları nelerdir?",
      "Evrimin karşılaştırmalı anatomi kanıtları nelerdir?",
      "Evrimin embriyolojik kanıtları nelerdir?",
      "Evrimin biyokimyasal kanıtları nelerdir?",
      "Türleşme nedir ve nasıl gerçekleşir?",
      "Genetik sürüklenme nedir?",
      "Evrim ve genetik çeşitlilik arasındaki ilişki nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for İnsan Fizyolojisi (Human Physiology)
  if (unitTitle === "İnsan Fizyolojisi") {
    const questions = [
      "Fizyoloji nedir?",
      "Homeostazi (İç denge) nedir?",
      "İnsan vücudundaki sistemler nelerdir?",
      "Sindirim sistemi nasıl çalışır?",
      "Dolaşım sistemi nasıl çalışır?",
      "Solunum sistemi nasıl çalışır?",
      "Boşaltım sistemi nasıl çalışır?",
      "Bağışıklık sistemi nasıl çalışır?",
      "Kas-iskelet sistemi nasıl çalışır?",
      "Vücut sistemleri arasındaki koordinasyon nasıl sağlanır?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Sinir Sistemi (Nervous System)
  if (unitTitle === "Sinir Sistemi") {
    const questions = [
      "Sinir sistemi nedir ve temel görevleri nelerdir?",
      "Nöron (sinir hücresi) nedir ve yapısı nasıldır?",
      "Merkezi sinir sistemi ve çevresel sinir sistemi arasındaki fark nedir?",
      "Beynin yapısı ve bölümleri nelerdir?",
      "Omurilik nedir ve görevleri nelerdir?",
      "Refleks nedir ve nasıl gerçekleşir?",
      "Sinaps nedir ve nasıl çalışır?",
      "Nörotransmitter maddeler nelerdir?",
      "Otonom sinir sistemi nedir?",
      "Sinir sisteminin sağlığını korumak için neler yapılmalıdır?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Duyu Organları (Sensory Organs)
  if (unitTitle === "Duyu Organları") {
    const questions = [
      "Duyu organları nelerdir?",
      "Göz yapısı nasıldır ve görme nasıl gerçekleşir?",
      "Kulak yapısı nasıldır ve işitme nasıl gerçekleşir?",
      "Burun yapısı nasıldır ve koku alma nasıl gerçekleşir?",
      "Dil yapısı nasıldır ve tat alma nasıl gerçekleşir?",
      "Derinin yapısı nasıldır ve dokunma hissi nasıl oluşur?",
      "Miyopluk, hipermetropluk ve astigmatizm nedir?",
      "İşitme kaybı nedenleri nelerdir?",
      "Duyu organlarının korunması için nelere dikkat edilmelidir?",
      "Duyu organları arasındaki koordinasyon nasıl sağlanır?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Endokrin Sistem (Endocrine System)
  if (unitTitle === "Endokrin Sistem") {
    const questions = [
      "Endokrin sistem nedir?",
      "Hormon nedir ve vücutta nasıl etki gösterir?",
      "Hipofiz bezi nedir ve salgıladığı hormonlar nelerdir?",
      "Tiroid bezi nedir ve salgıladığı hormonlar nelerdir?",
      "Pankreas nedir ve salgıladığı hormonlar nelerdir?",
      "Böbreküstü bezleri nedir ve salgıladığı hormonlar nelerdir?",
      "Eşeysel bezler (gonadlar) nedir ve salgıladığı hormonlar nelerdir?",
      "Hormonların fazla veya eksik salgılanması sonucu oluşan hastalıklar nelerdir?",
      "Hipotiroidi ve hipertiroidi nedir?",
      "Diyabet nedir ve nasıl yönetilir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Üreme Sistemi (Reproductive System)
  if (unitTitle === "Üreme Sistemi") {
    const questions = [
      "Üreme sistemi nedir?",
      "Erkek üreme sistemi organları nelerdir?",
      "Kadın üreme sistemi organları nelerdir?",
      "Yumurta (ovum) nedir ve nasıl oluşur?",
      "Sperm nedir ve nasıl oluşur?",
      "Döllenme nedir ve nasıl gerçekleşir?",
      "Embriyonik gelişim aşamaları nelerdir?",
      "Plasenta nedir ve görevleri nelerdir?",
      "Menstrüasyon döngüsü nedir ve nasıl gerçekleşir?",
      "Ergenlik döneminde görülen değişiklikler nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Ekoloji (Ecology)
  if (unitTitle === "Ekoloji") {
    const questions = [
      "Ekoloji nedir?",
      "Ekosistem nedir ve bileşenleri nelerdir?",
      "Besin zinciri ve besin ağı nedir?",
      "Enerji akışı ekosistemlerde nasıl gerçekleşir?",
      "Madde döngüleri nelerdir? (Karbon, azot, su döngüleri)",
      "Popülasyon nedir ve popülasyon dinamikleri nelerdir?",
      "Biyoçeşitlilik nedir ve neden önemlidir?",
      "Habitat ve niş kavramları nedir?",
      "Sürdürülebilir kalkınma nedir?",
      "Çevre sorunları ve korunma yöntemleri nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Default question for other units
  return `${unitTitle} ile ilgili soru ${challengeOrder}`;
};

// Function to generate options based on unit, lesson, and challenge
const getOption = (unitTitle: string, lessonOrder: number, challengeOrder: number, optionOrder: number): string => {
  // Options for Hücre ve Bölünmeler (Cell and Division)
  if (unitTitle === "Hücre ve Bölünmeler") {
    if (challengeOrder === 1) { // Hücre nedir?
      const options = [
        "Canlıların en küçük yapı ve işlev birimidir",
        "Sadece bitkilerde bulunan yapıdır",
        "Sadece hayvanlarda bulunan yapıdır",
        "Cansız varlıklarda bulunan yapıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Prokaryot ve ökaryot hücre arasındaki fark nedir?
      const options = [
        "Prokaryot hücreler çekirdekli, ökaryot hücreler çekirdeksizdir",
        "Prokaryot hücreler çekirdeksiz, ökaryot hücreler çekirdeklidir",
        "Prokaryot hücreler sadece bitkilerde, ökaryot hücreler sadece hayvanlarda bulunur",
        "Prokaryot hücreler sadece tek hücreli, ökaryot hücreler sadece çok hücreli canlılarda bulunur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Hücre zarının görevi nedir?
      const options = [
        "Hücreyi çevreleyen ve koruyan, madde alışverişini düzenleyen yapıdır",
        "Hücrenin yönetim merkezidir",
        "Hücrede protein sentezini gerçekleştirir",
        "Hücrede enerji üretimini sağlar"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Canlılarda Üreme (Reproduction in Living Things)
  if (unitTitle === "Canlılarda Üreme") {
    if (challengeOrder === 1) { // Üreme nedir?
      const options = [
        "Canlıların kendilerine benzer yeni bireyler meydana getirmesidir",
        "Canlıların büyümesi ve gelişmesidir",
        "Canlıların beslenme şeklidir",
        "Canlıların solunum yapmasıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Eşeyli üreme nedir?
      const options = [
        "Bir canlının kendi kendine üremesidir",
        "Dişi ve erkek üreme hücrelerinin birleşmesiyle gerçekleşen üremedir",
        "Sadece bitkilerde görülen üreme şeklidir",
        "Sadece tek hücreli canlılarda görülen üreme şeklidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Eşeysiz üreme nedir?
      const options = [
        "Dişi ve erkek üreme hücrelerinin birleşmesiyle gerçekleşen üremedir",
        "Bir canlının tek başına kendine benzer yeni bireyler oluşturmasıdır",
        "Sadece hayvanlarda görülen üreme şeklidir",
        "Sadece çok hücreli canlılarda görülen üreme şeklidir"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Kalıtım (Heredity)
  if (unitTitle === "Kalıtım") {
    if (challengeOrder === 1) { // Kalıtım nedir?
      const options = [
        "Canlıların kalıtsal özelliklerinin nesilden nesile aktarılmasıdır",
        "Hücre bölünmesi sonucu oluşan farklılıklardır",
        "Çevre etkisiyle ortaya çıkan değişimlerdir",
        "Hücre içindeki besin üretimidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Gen nedir?
      const options = [
        "Kalıtsal özellikleri taşıyan DNA parçasıdır",
        "Hücre içindeki protein yapılardır",
        "Kromozomların yapısında bulunmayan DNA parçalarıdır",
        "Sadece hastalıklara neden olan DNA parçalarıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Kromozom nedir?
      const options = [
        "Hücre içindeki protein yapılardır",
        "DNA ve proteinden oluşan, kalıtsal bilgileri taşıyan yapılardır",
        "Sadece bitki hücrelerinde bulunan yapılardır",
        "Sadece hastalıklara neden olan yapılardır"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for İnsan ve Çevre İlişkileri (Human-Environment Relations)
  if (unitTitle === "İnsan ve Çevre İlişkileri") {
    if (challengeOrder === 1) { // Çevre kirliliği nedir?
      const options = [
        "Çevrenin doğal yapısının bozulmasıdır",
        "Sadece hava kirliliğidir",
        "Sadece su kirliliğidir",
        "Sadece toprak kirliliğidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Hava kirliliğine neden olan faktörler nelerdir?
      const options = [
        "Sadece fabrika bacalarından çıkan gazlar",
        "Sadece araç egzozlarından çıkan gazlar",
        "Fabrika bacaları, araç egzozları, fosil yakıtların yakılması gibi faktörler",
        "Sadece orman yangınları"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Su kirliliğine neden olan faktörler nelerdir?
      const options = [
        "Sadece evsel atıklar",
        "Sadece endüstriyel atıklar",
        "Evsel, endüstriyel, tarımsal atıklar ve petrol sızıntıları gibi faktörler",
        "Sadece yağmur suları"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for other biology questions
  const biologyOptions = [
    "Canlıların yapısıyla ilgili bir kavramdır",
    "Canlıların üremesiyle ilgili bir kavramdır",
    "Canlıların beslenmesiyle ilgili bir kavramdır",
    "Canlıların çevreyle ilişkisiyle ilgili bir kavramdır"
  ];
  
  return biologyOptions[optionOrder - 1];
};

main().catch((err) => {
  console.error(
    "An error occurred while attempting to seed the database:",
    err
  );
}); 