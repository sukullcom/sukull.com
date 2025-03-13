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
    console.log("Creating Kimya (Chemistry) course for 7th grade");

    // Insert the course
    const [course] = await db
      .insert(schema.courses)
      .values({ title: "Kimya 7. Sınıf", imageSrc: "/kimya-7.svg" })
      .returning();

    // Unit names for 7th grade Chemistry in Turkish curriculum
    const unitNames = [
      { title: "Maddenin Tanecikli Yapısı", description: "Atomik yapı ve moleküller" },
      { title: "Saf Maddeler", description: "Element ve bileşikler" },
      { title: "Karışımlar", description: "Homojen ve heterojen karışımlar" },
      { title: "Maddenin Halleri", description: "Katı, sıvı ve gaz halleri" },
      { title: "Isı ve Sıcaklık", description: "Isı alışverişi ve hal değişimleri" },
      { title: "Kimyasal Tepkimeler", description: "Kimyasal değişimler ve denklemler" },
      { title: "Asitler ve Bazlar", description: "Asit-baz tepkimeleri ve pH" },
      { title: "Elementler ve Semboller", description: "Periyodik tablo ve elementler" },
      { title: "Çözünürlük", description: "Çözünme ve çözeltiler" },
      { title: "Kimya ve Günlük Hayat", description: "Günlük hayatta kimya uygulamaları" }
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
        `${unitNames[i].title} - Özellikler ve Yapılar`,
        `${unitNames[i].title} - Laboratuvar Çalışmaları`,
        `${unitNames[i].title} - Günlük Hayatta Uygulamalar`,
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

    console.log("7th grade Kimya course created successfully.");
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
  // For "Maddenin Tanecikli Yapısı" unit (Particulate Structure of Matter)
  if (unitTitle === "Maddenin Tanecikli Yapısı") {
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
  
  // For "Saf Maddeler" unit (Pure Substances)
  else if (unitTitle === "Saf Maddeler") {
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
  
  // For "Karışımlar" unit (Mixtures)
  else if (unitTitle === "Karışımlar") {
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
  // Questions for Maddenin Tanecikli Yapısı (Particulate Structure of Matter)
  if (unitTitle === "Maddenin Tanecikli Yapısı") {
    const questions = [
      "Maddenin en küçük yapı taşı nedir?",
      "Atomun temel parçacıkları nelerdir?",
      "Protonun yükü nedir?",
      "Elektronun yükü nedir?",
      "Nötronun yükü nedir?",
      "Atom numarası neyi belirtir?",
      "Kütle numarası neyi belirtir?",
      "İzotop atomlar nedir?",
      "Molekül nedir?",
      "Bileşik nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Saf Maddeler (Pure Substances)
  if (unitTitle === "Saf Maddeler") {
    const questions = [
      "Saf madde nedir?",
      "Element nedir?",
      "Bileşik nedir?",
      "Elementlerin özellikleri nelerdir?",
      "Bileşiklerin özellikleri nelerdir?",
      "Altın (Au) bir element midir yoksa bileşik midir?",
      "Su (H₂O) bir element midir yoksa bileşik midir?",
      "Doğada en çok bulunan element hangisidir?",
      "Periyodik tabloda kaç element vardır?",
      "Element ve bileşik arasındaki temel fark nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Karışımlar (Mixtures)
  if (unitTitle === "Karışımlar") {
    const questions = [
      "Karışım nedir?",
      "Homojen karışım nedir?",
      "Heterojen karışım nedir?",
      "Çözelti nedir?",
      "Alaşım nedir?",
      "Süspansiyon nedir?",
      "Emülsiyon nedir?",
      "Karışımları ayırma yöntemleri nelerdir?",
      "Damıtma (Distilasyon) nedir?",
      "Süzme işlemi hangi karışımları ayırmak için kullanılır?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Maddenin Halleri (States of Matter)
  if (unitTitle === "Maddenin Halleri") {
    const questions = [
      "Maddenin halleri nelerdir?",
      "Katı haldeki maddelerin özellikleri nelerdir?",
      "Sıvı haldeki maddelerin özellikleri nelerdir?",
      "Gaz haldeki maddelerin özellikleri nelerdir?",
      "Plazma hali nedir?",
      "Erime nedir?",
      "Donma nedir?",
      "Buharlaşma nedir?",
      "Yoğuşma nedir?",
      "Süblimleşme nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Isı ve Sıcaklık (Heat and Temperature)
  if (unitTitle === "Isı ve Sıcaklık") {
    const questions = [
      "Isı ve sıcaklık arasındaki fark nedir?",
      "Isının birimi nedir?",
      "Sıcaklığın birimi nedir?",
      "Öz ısı nedir?",
      "Maddelerin hal değişimi sırasında ısı alışverişi nasıl gerçekleşir?",
      "Erime ısısı nedir?",
      "Buharlaşma ısısı nedir?",
      "Isı iletkenliği nedir?",
      "Hangi maddeler ısıyı daha iyi iletir?",
      "Isı yalıtımı nedir ve neden önemlidir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Kimyasal Tepkimeler (Chemical Reactions)
  if (unitTitle === "Kimyasal Tepkimeler") {
    const questions = [
      "Kimyasal tepkime nedir?",
      "Kimyasal tepkimelerde kütle korunumu ne demektir?",
      "Fiziksel değişim ile kimyasal değişim arasındaki fark nedir?",
      "Yanma tepkimesi nedir?",
      "Asit-baz tepkimeleri nedir?",
      "Kimyasal tepkimelerde enerji değişimi nasıl olur?",
      "Ekzotermik tepkime nedir?",
      "Endotermik tepkime nedir?",
      "Tepkime hızını etkileyen faktörler nelerdir?",
      "Kimyasal denklem nedir ve nasıl dengelenir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Asitler ve Bazlar (Acids and Bases)
  if (unitTitle === "Asitler ve Bazlar") {
    const questions = [
      "Asit nedir?",
      "Baz nedir?",
      "pH skalası nedir?",
      "Asitlerin genel özellikleri nelerdir?",
      "Bazların genel özellikleri nelerdir?",
      "Nötrleşme tepkimesi nedir?",
      "İndikatör nedir?",
      "Turnusol kağıdı asit ve bazlarda hangi renkleri alır?",
      "Günlük hayatta kullanılan asitlere örnekler nelerdir?",
      "Günlük hayatta kullanılan bazlara örnekler nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Elementler ve Semboller (Elements and Symbols)
  if (unitTitle === "Elementler ve Semboller") {
    const questions = [
      "Periyodik tablo nedir?",
      "Periyodik tabloda elementler nasıl sıralanmıştır?",
      "Periyodik tabloda bir elementin yeri neye göre belirlenir?",
      "Periyodik tabloda bir grup nedir?",
      "Periyodik tabloda bir periyot nedir?",
      "Metaller genel olarak periyodik tablonun neresinde bulunur?",
      "Ametaller genel olarak periyodik tablonun neresinde bulunur?",
      "Soygazlar periyodik tablonun neresinde bulunur?",
      "Hidrojen (H) elementi periyodik tablonun neresinde bulunur?",
      "Alkali metaller hangi grupta yer alır?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Çözünürlük (Solubility)
  if (unitTitle === "Çözünürlük") {
    const questions = [
      "Çözünürlük nedir?",
      "Çözücü nedir?",
      "Çözünen nedir?",
      "Çözelti nedir?",
      "Çözünürlüğü etkileyen faktörler nelerdir?",
      "Sıcaklık değişimi çözünürlüğü nasıl etkiler?",
      "Basınç değişimi gazların çözünürlüğünü nasıl etkiler?",
      "Doymuş çözelti nedir?",
      "Doymamış çözelti nedir?",
      "Aşırı doymuş çözelti nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Kimya ve Günlük Hayat (Chemistry in Daily Life)
  if (unitTitle === "Kimya ve Günlük Hayat") {
    const questions = [
      "Deterjanlar nasıl temizlik sağlar?",
      "Sabunlar nasıl çalışır?",
      "Gıda katkı maddeleri nelerdir?",
      "Koruyucu maddeler neden kullanılır?",
      "İlaçlar nasıl etki gösterir?",
      "Plastikler neden ve nasıl üretilir?",
      "Geri dönüşüm neden önemlidir?",
      "Kozmetik ürünlerde hangi kimyasal maddeler bulunur?",
      "Boyalar nasıl üretilir?",
      "Yakıtlar nasıl çalışır ve çevreyi nasıl etkiler?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Default question for other units
  return `${unitTitle} ile ilgili soru ${challengeOrder}`;
};

// Function to generate options based on unit, lesson, and challenge
const getOption = (unitTitle: string, lessonOrder: number, challengeOrder: number, optionOrder: number): string => {
  // Options for Maddenin Tanecikli Yapısı (Particulate Structure of Matter)
  if (unitTitle === "Maddenin Tanecikli Yapısı") {
    if (challengeOrder === 1) { // Maddenin en küçük yapı taşı nedir?
      const options = [
        "Atom",
        "Molekül",
        "Proton",
        "Elektron"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Atomun temel parçacıkları nelerdir?
      const options = [
        "Proton, nötron, elektron",
        "Proton, elektron",
        "Nötron, elektron",
        "Proton, nötron"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Protonun yükü nedir?
      const options = [
        "Pozitif (+)",
        "Negatif (-)",
        "Nötr (0)",
        "Değişken"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Elektronun yükü nedir?
      const options = [
        "Pozitif yük",
        "Negatif yük",
        "Nötr yük",
        "Değişken yük"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Nötronun yükü nedir?
      const options = [
        "Pozitif yük",
        "Negatif yük",
        "Nötr (yüksüz)",
        "Değişken yük"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Saf Maddeler (Pure Substances)
  if (unitTitle === "Saf Maddeler") {
    if (challengeOrder === 1) { // Saf madde nedir?
      const options = [
        "Tek cins taneciklerden oluşan maddedir",
        "Birden fazla maddenin karışımıdır",
        "Sadece doğada bulunan maddelerdir",
        "Sadece laboratuvarda üretilen maddelerdir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Element nedir?
      const options = [
        "Aynı cins atomlardan oluşan saf maddedir",
        "Farklı cins atomlardan oluşan saf maddedir",
        "Birden fazla maddenin karışımıdır",
        "Sadece sıvı halde bulunan maddedir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Bileşik nedir?
      const options = [
        "Aynı cins atomlardan oluşan saf maddedir",
        "Farklı cins atomların belirli oranlarda bir araya gelmesiyle oluşan saf maddedir",
        "Birden fazla maddenin karışımıdır",
        "Sadece gaz halde bulunan maddedir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Elementlerin özellikleri nelerdir?
      const options = [
        "Kimyasal yöntemlerle daha basit maddelere ayrıştırılabilirler",
        "Her zaman birden fazla tür atom içerirler",
        "Aynı tür atomlardan oluşurlar ve kimyasal yöntemlerle ayrıştırılamazlar",
        "Sadece laboratuvar ortamında üretilebilirler"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Bileşiklerin özellikleri nelerdir?
      const options = [
        "Aynı tür atomlardan oluşurlar",
        "Kimyasal yöntemlerle daha basit maddelere ayrıştırılabilirler",
        "Oluşurken kütle kaybı meydana gelir",
        "Doğada saf halde bulunmazlar"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Karışımlar (Mixtures)
  if (unitTitle === "Karışımlar") {
    if (challengeOrder === 1) { // Karışım nedir?
      const options = [
        "İki veya daha fazla maddenin kendi özelliklerini kaybetmeden bir araya gelmesiyle oluşan maddedir",
        "Tek cins atomlardan oluşan saf maddedir",
        "Farklı cins atomların belirli oranlarda bir araya gelmesiyle oluşan saf maddedir",
        "Sadece sıvı halde bulunan maddedir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Homojen karışım nedir?
      const options = [
        "Her tarafında aynı özelliği gösteren karışımdır",
        "Her tarafında farklı özellik gösteren karışımdır",
        "Sadece katı maddelerden oluşan karışımdır",
        "Sadece sıvı maddelerden oluşan karışımdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Heterojen karışım nedir?
      const options = [
        "Her tarafında aynı özelliği gösteren karışımdır",
        "Her tarafında farklı özellik gösteren karışımdır",
        "Sadece katı maddelerden oluşan karışımdır",
        "Sadece sıvı maddelerden oluşan karışımdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Çözelti nedir?
      const options = [
        "Heterojen bir karışım türüdür",
        "Sadece katı maddelerin sıvılarda dağılmasıyla oluşur",
        "Karışımın dibe çökmüş halidir",
        "Bir maddenin başka bir madde içinde homojen olarak dağılmasıyla oluşan karışımdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Alaşım nedir?
      const options = [
        "En az bir metalin başka metallerle veya ametallerle homojen olarak karıştırılmasıyla elde edilen maddedir",
        "Bir metalin eriyik halinde sadece bir ametalle karıştırılmasıyla elde edilen maddedir",
        "Gazların birbiriyle karışmasıyla oluşan karışımdır",
        "Sadece iki sıvının karışmasıyla oluşan karışımdır"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for other subjects
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
    if (challengeOrder === 2) { // Katı haldeki maddelerin özellikleri nelerdir?
      const options = [
        "Belirli şekil ve hacimleri vardır, sıkıştırılamazlar",
        "Belirli şekilleri yoktur, belirli hacimleri vardır",
        "Belirli şekil ve hacimleri yoktur",
        "Sadece belirli şekilleri vardır, hacimleri değişkendir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Sıvı haldeki maddelerin özellikleri nelerdir?
      const options = [
        "Belirli şekil ve hacimleri vardır",
        "Belirli şekilleri yoktur, belirli hacimleri vardır, akışkandırlar",
        "Belirli şekil ve hacimleri yoktur",
        "Sadece belirli şekilleri vardır, hacimleri değişkendir"
      ];
      return options[optionOrder - 1];
    }
  }
  
  if (unitTitle === "Isı ve Sıcaklık") {
    if (challengeOrder === 1) { // Isı nedir?
      const options = [
        "Sıcaklık farkından dolayı aktarılan enerjidir",
        "Maddenin sıcaklık derecesidir",
        "Sadece sıcak cisimlerde bulunan enerjidir",
        "Sadece soğuk cisimlerde bulunan enerjidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Sıcaklık nedir?
      const options = [
        "Maddenin içerdiği ısı enerjisidir",
        "Maddenin taneciklerinin ortalama hareket enerjisinin bir ölçüsüdür",
        "Maddenin kütlesidir",
        "Maddenin hacmidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Isı ve sıcaklık arasındaki fark nedir?
      const options = [
        "Isı ve sıcaklık aynı kavramlardır",
        "Isı bir enerji türüdür, sıcaklık ise maddenin taneciklerinin ortalama hareket enerjisinin bir ölçüsüdür",
        "Isı sadece sıcak cisimlerde, sıcaklık ise sadece soğuk cisimlerde bulunur",
        "Isı sadece katılarda, sıcaklık ise sadece sıvılarda bulunur"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Meaningful options for other chemistry questions
  const chemistryOptions = [
    "Maddenin yapısıyla ilgili bir kavramdır",
    "Kimyasal reaksiyonlarla ilgili bir kavramdır",
    "Maddenin fiziksel özellikleriyle ilgili bir kavramdır",
    "Elementlerin periyodik özellikleriyle ilgili bir kavramdır"
  ];
  
  return chemistryOptions[optionOrder - 1];
};

main().catch((err) => {
  console.error(
    "An error occurred while attempting to seed the database:",
    err
  );
}); 