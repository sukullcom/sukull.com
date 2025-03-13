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
    console.log("Creating Fizik (Physics) course for 8th grade");

    // Insert the course
    const [course] = await db
      .insert(schema.courses)
      .values({ title: "Fizik 8. Sınıf", imageSrc: "/fizik-8.svg" })
      .returning();

    // Unit names for 8th grade Physics in Turkish curriculum
    const unitNames = [
      { title: "Basınç", description: "Katı, sıvı ve gaz basıncı" },
      { title: "Kuvvet ve Hareket", description: "Newton yasaları ve uygulamaları" },
      { title: "Isı ve Sıcaklık", description: "Isı alışverişi ve hal değişimleri" },
      { title: "Işık ve Ses", description: "Işık ve ses dalgaları" },
      { title: "Elektrik", description: "Elektrik akımı ve devreler" },
      { title: "Manyetizma", description: "Manyetik alan ve elektromanytizma" },
      { title: "Enerji", description: "Enerji dönüşümleri ve korunumu" },
      { title: "Basit Makineler", description: "Kaldıraç, makara ve eğik düzlem" },
      { title: "Optik", description: "Aynalar ve mercekler" },
      { title: "Modern Fizik", description: "Atom modelleri ve radyoaktivite" }
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
        `${unitNames[i].title} - Temel Yasalar`,
        `${unitNames[i].title} - Deneyler ve Gözlemler`,
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

    console.log("8th grade Fizik course created successfully.");
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
  // For "Basınç" unit (Pressure)
  if (unitTitle === "Basınç") {
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
  
  // For "Kuvvet ve Hareket" unit (Force and Motion)
  else if (unitTitle === "Kuvvet ve Hareket") {
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
  
  // For "Isı ve Sıcaklık" unit (Heat and Temperature)
  else if (unitTitle === "Isı ve Sıcaklık") {
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
  // Questions for Basınç (Pressure)
  if (unitTitle === "Basınç") {
    const questions = [
      "Basınç nedir?",
      "Katı basıncını etkileyen faktörler nelerdir?",
      "Sıvı basıncı nelere bağlıdır?",
      "Pascal ilkesi nedir?",
      "Açık hava basıncı nedir?",
      "Torricelli deneyi neyi ispatlar?",
      "Basınç birimi nedir?",
      "Manometre ne işe yarar?",
      "Bernoulli prensibi nedir?",
      "Archimedes prensibi nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Kuvvet ve Hareket (Force and Motion)
  if (unitTitle === "Kuvvet ve Hareket") {
    const questions = [
      "Newton'un birinci hareket yasası (eylemsizlik yasası) nedir?",
      "Newton'un ikinci hareket yasası nedir?",
      "Newton'un üçüncü hareket yasası nedir?",
      "Sürtünme kuvveti nedir?",
      "Yerçekimi nedir?",
      "İvme nedir?",
      "Kütle ve ağırlık arasındaki fark nedir?",
      "Eylemsizlik (atalet) ne demektir?",
      "Momentumu korunumu kanunu nedir?",
      "Etkileşen iki cisim arasındaki kuvvetler arasında nasıl bir ilişki vardır?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Isı ve Sıcaklık (Heat and Temperature)
  if (unitTitle === "Isı ve Sıcaklık") {
    const questions = [
      "Isı ve sıcaklık arasındaki fark nedir?",
      "Isı birimi nedir?",
      "Sıcaklık birimi nedir?",
      "Öz ısı nedir?",
      "Isı alışverişi nasıl gerçekleşir?",
      "Hal değişimleri nelerdir?",
      "Erime ve donma ısısı nedir?",
      "Isı iletimi nasıl gerçekleşir?",
      "Genleşme nedir?",
      "Termal denge nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Işık ve Ses (Light and Sound)
  if (unitTitle === "Işık ve Ses") {
    const questions = [
      "Işık nedir?",
      "Ses nedir?",
      "Işığın yayılma hızı nedir?",
      "Işığın yansıma yasaları nelerdir?",
      "Işığın kırılma yasaları nelerdir?",
      "Sesin yayılma hızını etkileyen faktörler nelerdir?",
      "Ses dalgaları nasıl yayılır?",
      "Yankı nedir?",
      "Doppler etkisi nedir?",
      "Işık ve ses hızları arasındaki fark nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Elektrik (Electricity)
  if (unitTitle === "Elektrik") {
    const questions = [
      "Elektrik akımı nedir?",
      "Direnç nedir?",
      "Ohm kanunu nedir?",
      "Seri ve paralel bağlantı arasındaki fark nedir?",
      "Elektriksel potansiyel nedir?",
      "Amper nedir?",
      "Volt nedir?",
      "Elektrik devresinin temel elemanları nelerdir?",
      "Elektrik enerjisi nasıl üretilir?",
      "Alternatif akım ve doğru akım arasındaki fark nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Manyetizma (Magnetism)
  if (unitTitle === "Manyetizma") {
    const questions = [
      "Manyetik alan nedir?",
      "Manyetik kuvvet nasıl oluşur?",
      "Mıknatısların özellikleri nelerdir?",
      "Elektromıknatıs nedir?",
      "Manyetik alan çizgileri nedir?",
      "Manyetik akı nedir?",
      "Elektromanyetik indüksiyon nedir?",
      "Manyetik pusula nasıl çalışır?",
      "Dünyanın manyetik alanı nedir?",
      "Faraday kanunu nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Enerji (Energy)
  if (unitTitle === "Enerji") {
    const questions = [
      "Enerji nedir?",
      "Enerjinin korunumu yasası nedir?",
      "Potansiyel enerji nedir?",
      "Kinetik enerji nedir?",
      "Mekanik enerji nedir?",
      "İş nedir?",
      "Güç nedir?",
      "Enerji dönüşümleri nelerdir?",
      "Yenilenebilir enerji kaynakları nelerdir?",
      "Verim nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Basit Makineler (Simple Machines)
  if (unitTitle === "Basit Makineler") {
    const questions = [
      "Basit makine nedir?",
      "Kaldıraç nedir?",
      "Kaldıraç çeşitleri nelerdir?",
      "Makara nedir?",
      "Makara çeşitleri nelerdir?",
      "Eğik düzlem nedir?",
      "Vida nedir?",
      "Çıkrık nedir?",
      "Mekanik avantaj nedir?",
      "Basit makinelerin ortak özelliği nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Optik (Optics)
  if (unitTitle === "Optik") {
    const questions = [
      "Düz ayna nedir?",
      "Düz aynada görüntü özellikleri nelerdir?",
      "Küresel aynalar nelerdir?",
      "Çukur aynada görüntü özellikleri nelerdir?",
      "Tümsek aynada görüntü özellikleri nelerdir?",
      "Mercekler nelerdir?",
      "İnce kenarlı merceklerde görüntü özellikleri nelerdir?",
      "Kalın kenarlı merceklerde görüntü özellikleri nelerdir?",
      "Göz kusurları nelerdir?",
      "Teleskop nasıl çalışır?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Modern Fizik (Modern Physics)
  if (unitTitle === "Modern Fizik") {
    const questions = [
      "Atom nedir?",
      "Atomun yapısı nasıldır?",
      "Elektron nedir?",
      "Proton nedir?",
      "Nötron nedir?",
      "Radyoaktivite nedir?",
      "Atom modelleri nelerdir?",
      "İzotop nedir?",
      "Nükleer enerji nedir?",
      "Kuantum fiziği nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Default question for other units
  return `${unitTitle} ile ilgili soru ${challengeOrder}`;
};

// Function to generate options based on unit, lesson, and challenge
const getOption = (unitTitle: string, lessonOrder: number, challengeOrder: number, optionOrder: number): string => {
  // Options for Basınç (Pressure)
  if (unitTitle === "Basınç") {
    if (challengeOrder === 1) { // Basınç nedir?
      const options = [
        "Bir cismin ağırlığıdır",
        "Bir cismin kütlesidir",
        "Birim yüzeye etki eden dik kuvvettir",
        "Yerçekiminin etkisidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Katı basıncını etkileyen faktörler nelerdir?
      const options = [
        "Ağırlık ve temas yüzeyi",
        "Sadece hacim",
        "Sadece kütle",
        "Sıcaklık ve hacim"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Sıvı basıncı nelere bağlıdır?
      const options = [
        "Sadece sıvının kütlesine",
        "Sadece kabın şekline",
        "Sadece sıvının hacmine",
        "Sıvının yoğunluğu, derinlik ve yerçekimi ivmesine"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Pascal ilkesi nedir?
      const options = [
        "Açık hava basıncının deniz seviyesinde ölçülen değeridir",
        "Sıvılarda basıncın her yöne aynen iletilmesi ilkesidir",
        "Sıvıların kaldırma kuvvetinin hesaplanmasıdır",
        "Gazların sıkışabilme özelliğidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Açık hava basıncı nedir?
      const options = [
        "Katıların yüzeye uyguladığı basınçtır",
        "Sıvıların kaba uyguladığı basınçtır",
        "Atmosferde bulunan hava moleküllerinin yeryüzüne uyguladığı basınçtır",
        "Deniz seviyesinde ölçülen sıcaklıktır"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Kuvvet ve Hareket (Force and Motion)
  if (unitTitle === "Kuvvet ve Hareket") {
    if (challengeOrder === 1) { // Newton'un birinci hareket yasası (eylemsizlik yasası) nedir?
      const options = [
        "Bir cismin ivmesi, uygulanan net kuvvetle doğru orantılı, kütlesiyle ters orantılıdır",
        "Bir cisim, üzerine etki eden net bir kuvvet olmadığı sürece duruyorsa durmaya, hareket ediyorsa aynı doğrultuda sabit hızla hareketine devam eder",
        "Her etkiye karşı eşit büyüklükte ve zıt yönde bir tepki vardır",
        "Kuvvet, kütle ve ivme arasındaki ilişkiyi açıklar"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Newton'un ikinci hareket yasası nedir?
      const options = [
        "Duran bir cisim durmaya devam eder",
        "Her etkiye karşı eşit büyüklükte ve zıt yönde bir tepki vardır",
        "Cisimler arasındaki çekim kuvveti, kütleleri çarpımı ile doğru orantılıdır",
        "Bir cismin ivmesi, uygulanan net kuvvetle doğru orantılı, kütlesiyle ters orantılıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Newton'un üçüncü hareket yasası nedir?
      const options = [
        "Her etkiye karşı eşit büyüklükte ve zıt yönde bir tepki vardır",
        "Bir cisim, üzerine etki eden net bir kuvvet olmadığı sürece duruyorsa durmaya, hareket ediyorsa aynı doğrultuda sabit hızla hareketine devam eder",
        "Bir cismin ivmesi, uygulanan net kuvvetle doğru orantılı, kütlesiyle ters orantılıdır",
        "Kuvvetlerin vektörel toplamıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Sürtünme kuvveti nedir?
      const options = [
        "Cisimlerin hareket yönünde etkiyen kuvvettir",
        "Cisimlerin ağırlığıdır",
        "Yüzeyler arasında oluşan ve harekete karşı koyan kuvvettir",
        "Cisimleri yukarı doğru çeken kuvvettir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Yerçekimi nedir?
      const options = [
        "Cisimlerin birbirlerini elektriksel olarak çekmesidir",
        "Kütleler arasındaki çekim kuvvetidir",
        "Manyetik çekim kuvvetidir",
        "Dünya'nın dönmesiyle oluşan merkezkaç kuvvetidir"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Isı ve Sıcaklık (Heat and Temperature)
  if (unitTitle === "Isı ve Sıcaklık") {
    if (challengeOrder === 1) { // Isı ve sıcaklık arasındaki fark nedir?
      const options = [
        "Isı bir enerji türüdür, sıcaklık ise bir cismin enerji düzeyinin ölçüsüdür",
        "Isı ve sıcaklık aynı şeydir",
        "Isı sıvılarda, sıcaklık katılarda ölçülür",
        "Isı Kelvin ile, sıcaklık Joule ile ölçülür"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Isı birimi nedir?
      const options = [
        "Kelvin (K)",
        "Celsius (°C)",
        "Joule (J) veya kalori (cal)",
        "Newton (N)"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Sıcaklık birimi nedir?
      const options = [
        "Joule (J)",
        "Kelvin (K), Celsius (°C) veya Fahrenheit (°F)",
        "Pascal (Pa)",
        "Watt (W)"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Öz ısı nedir?
      const options = [
        "Bir maddenin sıcaklığını değiştirmeden hal değiştirmesi için gerekli ısıdır",
        "Bir maddenin birim hacminin sıcaklığını 1 °C artırmak için gerekli ısıdır",
        "Bir maddenin erime noktasıdır",
        "Bir maddenin birim kütlesinin sıcaklığını 1 °C artırmak için gerekli ısıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Isı alışverişi nasıl gerçekleşir?
      const options = [
        "Yüksek sıcaklıktan düşük sıcaklığa doğru",
        "Düşük sıcaklıktan yüksek sıcaklığa doğru",
        "Her zaman eşit miktarda",
        "Sadece katı maddeler arasında"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Default options for other units
  const defaultOptions = [
    "Cevap 1",
    "Cevap 2",
    "Cevap 3", 
    "Cevap 4"
  ];
  
  return defaultOptions[optionOrder - 1];
};

main().catch((err) => {
  console.error(
    "An error occurred while attempting to seed the database:",
    err
  );
}); 