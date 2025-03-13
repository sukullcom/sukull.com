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
    console.log("Creating Fizik (Physics) course for 7th grade");

    // Insert the course
    const [course] = await db
      .insert(schema.courses)
      .values({ title: "Fizik 7. Sınıf", imageSrc: "/fizik-7.svg" })
      .returning();

    // Unit names for 7th grade Physics in Turkish curriculum
    const unitNames = [
      { title: "Kuvvet ve Hareket", description: "Kuvvet ve hareket konuları" },
      { title: "Kütle ve Ağırlık", description: "Kütle ve ağırlık kavramları" },
      { title: "Basınç", description: "Katı, sıvı ve gaz basıncı" },
      { title: "Işık", description: "Işık ve özellikleri" },
      { title: "Ses", description: "Ses ve özellikleri" },
      { title: "Enerji", description: "Enerji dönüşümleri ve korunumu" },
      { title: "Elektrik", description: "Elektrik yükleri ve elektrik akımı" },
      { title: "Manyetizma", description: "Mıknatıslar ve manyetik alan" },
      { title: "Isı ve Sıcaklık", description: "Isı transferi ve sıcaklık değişimi" },
      { title: "Astronomi", description: "Güneş sistemi ve uzay araştırmaları" }
    ];

    // Create units for the Fizik course
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
        `${unitNames[i].title} - Olaylar ve İlişkiler`,
        `${unitNames[i].title} - Deneyler ve Gözlemler`,
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

    console.log("7th grade Fizik course created successfully.");
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
  // For "Kuvvet ve Hareket" unit (Force and Motion)
  if (unitTitle === "Kuvvet ve Hareket") {
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
  
  // For "Kütle ve Ağırlık" unit (Mass and Weight)
  else if (unitTitle === "Kütle ve Ağırlık") {
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
  
  // For "Basınç" unit (Pressure)
  else if (unitTitle === "Basınç") {
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
  // Questions for Kuvvet ve Hareket (Force and Motion)
  if (unitTitle === "Kuvvet ve Hareket") {
    const questions = [
      "Bir cismin hareket durumunun değişmesine sebep olan etkiye ne denir?",
      "Yer değiştirme ve alınan yol kavramları arasındaki fark nedir?",
      "Sürati hesaplamak için hangi formül kullanılır?",
      "Aşağıdakilerden hangisi vektörel bir büyüklüktür?",
      "Dengede olan bir cisim için net kuvvet nasıldır?",
      "Hareket halindeki bir cisme aynı yönde kuvvet uygulandığında nasıl hareket eder?",
      "Dengesiz kuvvetlerin etkisindeki bir cisim nasıl hareket eder?",
      "Sürtünme kuvveti neye karşı oluşur?",
      "Hareket halindeki bir cisim neden durur?",
      "Newton'un birinci hareket yasası (Eylemsizlik prensibi) neyi ifade eder?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Kütle ve Ağırlık (Mass and Weight)
  if (unitTitle === "Kütle ve Ağırlık") {
    const questions = [
      "Kütle nedir?",
      "Ağırlık nedir?",
      "Kütlenin SI birim sistemi birimi nedir?",
      "Ağırlığın SI birim sistemi birimi nedir?",
      "Bir cismin kütlesi ve ağırlığı arasındaki ilişki nedir?",
      "Ay'da bir cismin kütlesi ve ağırlığı Dünya'dakine göre nasıl değişir?",
      "Bir astronot uzayda ağırlıksız ortamda kütle çekimi kuvvetine maruz kalır mı?",
      "Dünya'nın farklı yerlerinde bir cismin kütlesi değişir mi?",
      "Eşit kütleli fakat farklı hacimlere sahip iki cisim için ne söylenebilir?",
      "Bir cismin dinamometreden okunan değeri neyi gösterir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Basınç (Pressure)
  if (unitTitle === "Basınç") {
    const questions = [
      "Basınç nedir?",
      "Basıncın SI birim sistemi birimi nedir?",
      "Katılarda basıncı etkileyen faktörler nelerdir?",
      "Sıvı basıncını etkileyen faktörler nelerdir?",
      "Pascal Prensibi nedir?",
      "Açık hava basıncını ölçen alete ne ad verilir?",
      "Deniz seviyesinden yükseklere çıkıldıkça açık hava basıncı nasıl değişir?",
      "Sıvıların kaplarına uyguladığı basınç hangi yönlere iletilir?",
      "Atmosfer basıncının varlığını ilk kez kim, hangi deneyle kanıtlamıştır?",
      "Hidrolik sistemlerin çalışma prensibini açıklayan kural hangisidir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Işık (Light)
  if (unitTitle === "Işık") {
    const questions = [
      "Işık nedir?",
      "Işık kaynakları nelerdir?",
      "Işığın yayılma hızı nedir?",
      "Işığın madde ile etkileşimleri nelerdir?",
      "Düzgün yansıma ve dağınık yansıma arasındaki fark nedir?",
      "Bir cismin opak olması ne anlama gelir?",
      "Bir cismin saydam olması ne anlama gelir?",
      "Işığın kırılması nedir?",
      "Gökkuşağının oluşumu nasıl açıklanır?",
      "Tam yansıma nedir ve hangi koşullarda gerçekleşir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Ses (Sound)
  if (unitTitle === "Ses") {
    const questions = [
      "Ses nedir?",
      "Ses nasıl yayılır?",
      "Sesin boşlukta yayılması mümkün müdür?",
      "Sesin yayılma hızı hangi ortamda en yüksektir?",
      "Ses dalgalarının frekansı neyi belirler?",
      "Ses dalgalarının genliği neyi belirler?",
      "Sesin yankılanması (eko) nasıl gerçekleşir?",
      "Ultrasonik ses nedir?",
      "İnsan kulağı hangi frekans aralığındaki sesleri duyabilir?",
      "Ses kirliliği nedir ve nasıl önlenebilir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Enerji (Energy)
  if (unitTitle === "Enerji") {
    const questions = [
      "Enerji nedir?",
      "Enerjinin SI birim sistemi birimi nedir?",
      "Potansiyel enerji nedir?",
      "Kinetik enerji nedir?",
      "Enerji dönüşümüne örnek veriniz.",
      "Enerji korunumu yasası nedir?",
      "Yenilenebilir enerji kaynakları nelerdir?",
      "Güneş enerjisi nasıl elde edilir?",
      "Rüzgar enerjisi nasıl elde edilir?",
      "Enerji tasarrufu için neler yapılabilir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Elektrik (Electricity)
  if (unitTitle === "Elektrik") {
    const questions = [
      "Elektrik yükü nedir?",
      "Elektrik yüklerinin çeşitleri nelerdir?",
      "Aynı cins yükler arasındaki etkileşim nasıldır?",
      "Farklı cins yükler arasındaki etkileşim nasıldır?",
      "Elektroskop ne işe yarar?",
      "İletken ve yalıtkan maddeler arasındaki fark nedir?",
      "Elektrik akımı nedir?",
      "Elektrik devresi elemanları nelerdir?",
      "Seri ve paralel bağlı devreler arasındaki fark nedir?",
      "Elektriklenme çeşitleri nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Manyetizma (Magnetism)
  if (unitTitle === "Manyetizma") {
    const questions = [
      "Mıknatıs nedir?",
      "Mıknatısların kutupları nelerdir?",
      "Aynı manyetik kutuplar arasındaki etkileşim nasıldır?",
      "Farklı manyetik kutuplar arasındaki etkileşim nasıldır?",
      "Manyetik alan nedir?",
      "Manyetik alan çizgileri nasıl oluşur?",
      "Dünya'nın manyetik alanı nasıl oluşur?",
      "Pusula nasıl çalışır?",
      "Elektromıknatıs nedir ve nasıl yapılır?",
      "Günlük hayatta mıknatısların kullanım alanları nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Isı ve Sıcaklık (Heat and Temperature)
  if (unitTitle === "Isı ve Sıcaklık") {
    const questions = [
      "Isı ve sıcaklık kavramları arasındaki fark nedir?",
      "Isı transferi hangi yollarla gerçekleşir?",
      "İletim (kondüksiyon) nedir?",
      "Konveksiyon (taşıma) nedir?",
      "Işıma (radyasyon) nedir?",
      "Isı yalıtımı nedir ve neden önemlidir?",
      "Maddelerin hal değişimi sırasında ısı alışverişi nasıl gerçekleşir?",
      "Hangi maddeler ısıyı daha iyi iletir?",
      "Termometre çeşitleri nelerdir?",
      "Termal denge nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Astronomi (Astronomy)
  if (unitTitle === "Astronomi") {
    const questions = [
      "Güneş sistemindeki gezegenler nelerdir?",
      "Dünya'nın kendi ekseni etrafında dönmesi sonucu neler meydana gelir?",
      "Dünya'nın Güneş etrafında dolanması sonucu neler meydana gelir?",
      "Ay'ın evreleri nasıl oluşur?",
      "Tutulmalar nasıl gerçekleşir?",
      "Teleskop nedir ve nasıl çalışır?",
      "Uzay araştırmalarının önemi nedir?",
      "Uydular ne işe yarar?",
      "Meteor, meteorit ve asteroit arasındaki farklar nelerdir?",
      "Güneş'in yapısı nasıldır?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Default question for other units
  return `${unitTitle} ile ilgili soru ${challengeOrder}`;
};

// Function to generate options based on unit, lesson, and challenge
const getOption = (unitTitle: string, lessonOrder: number, challengeOrder: number, optionOrder: number): string => {
  // Options for Kuvvet ve Hareket (Force and Motion)
  if (unitTitle === "Kuvvet ve Hareket") {
    if (challengeOrder === 1) { // Bir cismin hareket durumunun değişmesine sebep olan etkiye ne denir?
      const options = [
        "Enerji",
        "Kuvvet",
        "Sürtünme",
        "Basınç"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Yer değiştirme ve alınan yol kavramları arasındaki fark nedir?
      const options = [
        "Yer değiştirme vektörel, alınan yol skaler bir büyüklüktür",
        "Yer değiştirme skaler, alınan yol vektörel bir büyüklüktür",
        "Yer değiştirme başlangıç ve bitiş noktaları arasındaki mesafedir, alınan yol ise hareket boyunca gidilen toplam mesafedir",
        "Yer değiştirme ve alınan yol aynı kavramlardır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Sürati hesaplamak için hangi formül kullanılır?
      const options = [
        "Sürat = Kuvvet / Kütle",
        "Sürat = Alınan Yol / Geçen Zaman",
        "Sürat = Kütle × İvme",
        "Sürat = Yer Değiştirme / Geçen Zaman"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Aşağıdakilerden hangisi vektörel bir büyüklüktür?
      const options = [
        "Kütle",
        "Hız",
        "Sürat",
        "Zaman"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Dengede olan bir cisim için net kuvvet nasıldır?
      const options = [
        "Pozitiftir",
        "Negatiftir",
        "Sıfırdır",
        "Değişkendir"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Kütle ve Ağırlık (Mass and Weight)
  if (unitTitle === "Kütle ve Ağırlık") {
    if (challengeOrder === 1) { // Kütle nedir?
      const options = [
        "Bir cismin üzerine etki eden yer çekimi kuvvetidir",
        "Bir cismin içerdiği madde miktarıdır",
        "Bir cismin uzayda kapladığı hacimdir",
        "Bir cismin yoğunluğudur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Ağırlık nedir?
      const options = [
        "Bir cismin içerdiği madde miktarıdır",
        "Bir cismin üzerine etki eden yer çekimi kuvvetidir",
        "Bir cismin uzayda kapladığı hacimdir",
        "Bir cismin yoğunluğudur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Kütlenin SI birim sistemi birimi nedir?
      const options = [
        "Newton (N)",
        "Kilogram (kg)",
        "Metre (m)",
        "Joule (J)"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Ağırlığın SI birim sistemi birimi nedir?
      const options = [
        "Kilogram (kg)",
        "Gram (g)",
        "Newton (N)",
        "Joule (J)"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Bir cismin kütlesi ve ağırlığı arasındaki ilişki nedir?
      const options = [
        "Kütle = Ağırlık × Sıcaklık",
        "Ağırlık = Kütle × Yer çekimi ivmesi",
        "Ağırlık = Kütle / Yer çekimi ivmesi",
        "Kütle = Ağırlık / Sürat"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Basınç (Pressure)
  if (unitTitle === "Basınç") {
    if (challengeOrder === 1) { // Basınç nedir?
      const options = [
        "Birim yüzeye etki eden dik kuvvettir",
        "Bir cismin ağırlığıdır",
        "Bir cismin kütlesidir",
        "Bir cismin hacmidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Basıncın SI birim sistemi birimi nedir?
      const options = [
        "Newton (N)",
        "Pascal (Pa)",
        "Kilogram (kg)",
        "Joule (J)"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Katılarda basıncı etkileyen faktörler nelerdir?
      const options = [
        "Sadece kuvvet",
        "Sadece yüzey alanı",
        "Kuvvet ve yüzey alanı",
        "Kütle ve hacim"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Sıvı basıncını etkileyen faktörler nelerdir?
      const options = [
        "Sadece sıvının derinliği",
        "Sadece sıvının cinsi",
        "Sadece kabın şekli",
        "Sıvının yoğunluğu, derinlik ve yer çekimi ivmesi"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Pascal Prensibi nedir?
      const options = [
        "Kapalı bir kaptaki sıvıya uygulanan basınç, sıvı tarafından her yöne aynen iletilir",
        "Sıvıların basıncı yalnızca dibe iletilir",
        "Sıvıların basıncı sadece yukarı doğru iletilir",
        "Her sıvı farklı miktarda basınç iletir"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for other subjects
  if (unitTitle === "Işık") {
    if (challengeOrder === 1) { // Işık nedir?
      const options = [
        "Elektromanyetik bir dalgadır",
        "Mekanik bir dalgadır",
        "Sadece gözle görülebilen bir maddedir",
        "Sadece sıcak cisimlerin yaydığı bir maddedir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Işık kaynakları nelerdir?
      const options = [
        "Sadece Güneş",
        "Sadece yapay ışık kaynakları",
        "Doğal ve yapay ışık kaynakları",
        "Sadece ateş"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Işığın yayılma hızı nedir?
      const options = [
        "300.000 km/s",
        "340 m/s",
        "3.000 km/s",
        "30.000 km/s"
      ];
      return options[optionOrder - 1];
    }
  }
  
  if (unitTitle === "Ses") {
    if (challengeOrder === 1) { // Ses nedir?
      const options = [
        "Titreşen bir cismin oluşturduğu mekanik dalgadır",
        "Elektromanyetik bir dalgadır",
        "Sadece insanların duyabildiği bir enerjidir",
        "Sadece havada yayılan bir enerjidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Ses nasıl yayılır?
      const options = [
        "Sadece havada yayılır",
        "Katı, sıvı ve gaz ortamlarda yayılabilir",
        "Sadece sıvılarda yayılır",
        "Sadece katılarda yayılır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Sesin boşlukta yayılamamasının nedeni nedir?
      const options = [
        "Boşlukta ışık olmamasıdır",
        "Boşlukta titreşimi iletecek madde taneciklerinin olmamasıdır",
        "Boşlukta yerçekimi olmamasıdır",
        "Boşlukta sıcaklık olmamasıdır"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Meaningful options for other physics questions
  const physicsOptions = [
    "Kuvvet ve hareketle ilgili bir kavramdır",
    "Enerji ve iş ile ilgili bir kavramdır",
    "Maddenin yapısıyla ilgili bir kavramdır",
    "Elektrik ve manyetizma ile ilgili bir kavramdır"
  ];
  
  return physicsOptions[optionOrder - 1];
};

main().catch((err) => {
  console.error(
    "An error occurred while attempting to seed the database:",
    err
  );
}); 