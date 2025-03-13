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
    console.log("Creating Matematik (Math) course for 6th grade");

    // Insert the course
    const [course] = await db
      .insert(schema.courses)
      .values({ title: "Matematik 6. Sınıf", imageSrc: "/matematik-6.svg" })
      .returning();

    // Unit names for 6th grade Mathematics in the Turkish curriculum
    const unitNames = [
      { title: "Doğal Sayılarla İşlemler", description: "Doğal sayılarla dört işlem ve işlem önceliği" },
      { title: "Çarpanlar ve Katlar", description: "EBOB, EKOK, asal çarpanlar" },
      { title: "Tam Sayılar", description: "Tam sayılar kümesi ve işlemler" },
      { title: "Kesirlerle İşlemler", description: "Kesirlerle dört işlem" },
      { title: "Ondalık Gösterim", description: "Ondalık gösterim ve işlemler" },
      { title: "Oran", description: "Oran kavramı ve orantısal problemler" },
      { title: "Cebirsel İfadeler", description: "Cebirsel ifadeler ve değerleri" },
      { title: "Veri Analizi", description: "Veri toplama, düzenleme ve yorumlama" },
      { title: "Açılar", description: "Açılar ve ölçümleri" },
      { title: "Alan Ölçme", description: "Paralelkenar, üçgen ve çemberin alanı" }
    ];

    // Create units for the Matematik course
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
        `${unitNames[i].title} - Problemler`,
        `${unitNames[i].title} - Uygulamalar`,
        `${unitNames[i].title} - Örnek Sorular`,
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

    console.log("6th grade Matematik course created successfully.");
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

// Function to determine if an option is correct based on unit, lesson, and challenge order
const isCorrect = (unitTitle: string, lessonOrder: number, challengeOrder: number, optionOrder: number): boolean => {
  if (unitTitle === "Doğal Sayılarla İşlemler") {
    if (challengeOrder === 1 && optionOrder === 3) return true; // 2^4 işleminin sonucu: 16
    if (challengeOrder === 2 && optionOrder === 2) return true; // 72÷8+5×3: 24
    if (challengeOrder === 3 && optionOrder === 1) return true; // 15+3×(8-5): 24
    if (challengeOrder === 4 && optionOrder === 4) return true; // Tam bölenler toplamı: 91
    if (challengeOrder === 5 && optionOrder === 2) return true; // 3^4 ÷ 3^2: 9
    if (challengeOrder === 6 && optionOrder === 1) return true; // Dağıtım: missing part = 45×456
    if (challengeOrder === 7 && optionOrder === 3) return true; // Ardışık sayıların en büyüğü: 22
    if (challengeOrder === 8 && optionOrder === 2) return true; // Çıkarma: 35-17 = 18
    if (challengeOrder === 9 && optionOrder === 3) return true; // Örüntü: 10. terim = 66
    if (challengeOrder === 10 && optionOrder === 1) return true; // Çift sayı toplamı: 2550
  } else if (unitTitle === "Çarpanlar ve Katlar") {
    if (challengeOrder === 1 && optionOrder === 2) return true; // EBOB(72,90)=18
    if (challengeOrder === 2 && optionOrder === 3) return true; // EKOK(18,24)=72
    if (challengeOrder === 3 && optionOrder === 1) return true; // 42’nin asal çarpanları: 2,3,7
    if (challengeOrder === 4 && optionOrder === 4) return true; // 21 asal değildir
    if (challengeOrder === 5 && optionOrder === 2) return true; // Pozitif bölen sayısı: 16
    if (challengeOrder === 6 && optionOrder === 1) return true; // Ortak bölenlerin toplamı: 28
    if (challengeOrder === 7 && optionOrder === 3) return true; // EKOK(12,x)=60 → x=20
    if (challengeOrder === 8 && optionOrder === 2) return true; // EBOB(k,15)=3, EKOK=45 → k=9
    if (challengeOrder === 9 && optionOrder === 1) return true; // Kalan 2 veren sayı: 14
    if (challengeOrder === 10 && optionOrder === 4) return true; // Asal sayı adedi: 25
  } else if (unitTitle === "Tam Sayılar") {
    if (challengeOrder === 1 && optionOrder === 3) return true; // 3/4 is not a tam sayı
    if (challengeOrder === 2 && optionOrder === 1) return true; // (-8)+(+3) = -5
    if (challengeOrder === 3 && optionOrder === 1) return true; // (-5)×(-7) = 35
    if (challengeOrder === 4 && optionOrder === 4) return true; // 4 - (-6) = 10
    if (challengeOrder === 5 && optionOrder === 2) return true; // -3 - 8 = -11
    if (challengeOrder === 6 && optionOrder === 1) return true; // -24 ÷ (-6) = 4
    if (challengeOrder === 7 && optionOrder === 1) return true; // Toplam -25 → en büyük = -3
    if (challengeOrder === 8 && optionOrder === 1) return true; // Arasında tam sayı sayısı = 34
    if (challengeOrder === 9 && optionOrder === 3) return true; // |-4|+|-7| = 11
    if (challengeOrder === 10 && optionOrder === 1) return true; // Toplam: 0
  } else if (unitTitle === "Kesirlerle İşlemler") {
    if (challengeOrder === 1 && optionOrder === 2) return true; // 2/3+3/4 = 17/12
    if (challengeOrder === 2 && optionOrder === 2) return true; // 5/6÷2/3 = 5/4
    if (challengeOrder === 3 && optionOrder === 3) return true; // 3/4×2/5 = 3/10
    if (challengeOrder === 4 && optionOrder === 2) return true; // 7/8-1/4 = 5/8
    if (challengeOrder === 5 && optionOrder === 2) return true; // 3 1/2+2 2/3 = 6 1/6
    if (challengeOrder === 6 && optionOrder === 3) return true; // Between 3/5 and 4/5: 3/4 chosen
    if (challengeOrder === 7 && optionOrder === 2) return true; // Leftover = 1/3
    if (challengeOrder === 8 && optionOrder === 2) return true; // 3/4+1/6 = 11/12
    if (challengeOrder === 9 && optionOrder === 1) return true; // 2/3 ÷ (3/4×1/2) = 16/9
    if (challengeOrder === 10 && optionOrder === 1) return true; // 1/2+1/3+1/6 = 1
  } else if (unitTitle === "Ondalık Gösterim") {
    if (challengeOrder === 1 && optionOrder === 2) return true; // 3/4 = 0,75
    if (challengeOrder === 2 && optionOrder === 2) return true; // 2,35+1,85 = 4,20
    if (challengeOrder === 3 && optionOrder === 1) return true; // 5,7×0,3 = 1,71
    if (challengeOrder === 4 && optionOrder === 1) return true; // 9,6÷2,4 = 4
    if (challengeOrder === 5 && optionOrder === 4) return true; // 3,75 → binde birler: 0
    if (challengeOrder === 6 && optionOrder === 1) return true; // 0,375 = 3/8
    if (challengeOrder === 7 && optionOrder === 1) return true; // Between 7,45 and 7,46: 7,455
    if (challengeOrder === 8 && optionOrder === 3) return true; // 28,56 → basamak değeri: 6
    if (challengeOrder === 9 && optionOrder === 2) return true; // 2,5×0,04 = 0,1
    if (challengeOrder === 10 && optionOrder === 1) return true; // 17,6÷0,8 = 22
  } else if (unitTitle === "Oran") {
    // All correct answers are the first option for these numerical ratio problems
    if (challengeOrder >= 1 && challengeOrder <= 10 && optionOrder === 1) return true;
  } else if (unitTitle === "Cebirsel İfadeler") {
    // For all algebra questions, the correct answer is the first option
    if (challengeOrder >= 1 && challengeOrder <= 10 && optionOrder === 1) return true;
  } else if (unitTitle === "Veri Analizi") {
    // For data analysis questions, the correct answer is the first option
    if (challengeOrder >= 1 && challengeOrder <= 10 && optionOrder === 1) return true;
  } else if (unitTitle === "Açılar") {
    // For angle questions, the correct answer is the first option
    if (challengeOrder >= 1 && challengeOrder <= 10 && optionOrder === 1) return true;
  } else if (unitTitle === "Alan Ölçme") {
    // For area measurement questions, the correct answer is the first option
    if (challengeOrder >= 1 && challengeOrder <= 10 && optionOrder === 1) return true;
  }
  return false;
};

// Function to generate a question based on unit and lesson
const getQuestion = (unitTitle: string, lessonOrder: number, challengeOrder: number): string => {
  if (unitTitle === "Doğal Sayılarla İşlemler") {
    const questions = [
      "2^4 işleminin sonucu kaçtır?",
      "72÷8+5×3 işleminin sonucu kaçtır?",
      "15+3×(8-5) işleminin sonucu kaçtır?",
      "36 sayısının tam bölenlerinin toplamı kaçtır?",
      "3^4 ÷ 3^2 işleminin sonucu kaçtır?",
      "45×(123+456) = 45×123+? işlemindeki ? yerine ne gelmelidir?",
      "Ardışık üç doğal sayının toplamı 63 ise, en büyük sayı kaçtır?",
      "Bir çıkarma işleminde eksilen 35, çıkan 17 ise fark kaçtır?",
      "12, 18, 24, 30, ... örüntüsünün 10. terimi kaçtır?",
      "2+4+6+...+100 toplamının sonucu kaçtır?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Çarpanlar ve Katlar") {
    const questions = [
      "72 ve 90 sayılarının EBOB'u kaçtır?",
      "18 ve 24 sayılarının EKOK'u kaçtır?",
      "42 sayısının asal çarpanları hangileridir?",
      "Aşağıdakilerden hangisi asal değildir?",
      "120 sayısının pozitif bölen sayısı kaçtır?",
      "36 ve 48 sayılarının ortak bölenlerinin toplamı kaçtır?",
      "EKOK(12,x)=60 ise x kaçtır?",
      "EBOB(k,15)=3 ve EKOK(k,15)=45 ise k kaçtır?",
      "3'e ve 4'e bölündüğünde kalan 2 olan en küçük pozitif tam sayı kaçtır?",
      "100'den küçük kaç tane asal sayı vardır?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Tam Sayılar") {
    const questions = [
      "Aşağıdakilerden hangisi bir tam sayı değildir?",
      "(-8) + (+3) işleminin sonucu kaçtır?",
      "(-5) × (-7) işleminin sonucu kaçtır?",
      "4 - (-6) işleminin sonucu kaçtır?",
      "Sıcaklık -3°C iken 8°C düşerse, yeni sıcaklık kaç °C olur?",
      "-24 ÷ (-6) işleminin sonucu kaçtır?",
      "Ardışık 5 tam sayının toplamı -25 ise, en büyük sayı kaçtır?",
      "-15 ve +20 sayıları arasında kaç tane tam sayı vardır?",
      "|-4| + |-7| işleminin sonucu kaçtır?",
      "Mutlak değeri 5 olan tam sayıların toplamı kaçtır?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Kesirlerle İşlemler") {
    const questions = [
      "2/3 + 3/4 işleminin sonucu kaçtır?",
      "5/6 ÷ 2/3 işleminin sonucu kaçtır?",
      "3/4 × 2/5 işleminin sonucu kaçtır?",
      "7/8 - 1/4 işleminin sonucu kaçtır?",
      "3 1/2 + 2 2/3 işleminin sonucu kaçtır?",
      "Hangi kesir 3/5'ten büyük, 4/5'ten küçüktür?",
      "Bir pizzanın 2/3'ü yenildi. Geriye pizzanın kaçta kaçı kalmıştır?",
      "3/4 + 1/6 işleminin sonucu aşağıdakilerden hangisine eşittir?",
      "2/3 ÷ (3/4 × 1/2) işleminin sonucu kaçtır?",
      "1/2 + 1/3 + 1/6 işleminin sonucu kaçtır?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Ondalık Gösterim") {
    const questions = [
      "3/4 kesrinin ondalık gösterimi nedir?",
      "2,35 + 1,85 işleminin sonucu kaçtır?",
      "5,7 × 0,3 işleminin sonucu kaçtır?",
      "9,6 ÷ 2,4 işleminin sonucu kaçtır?",
      "3,75 sayısının binde birler basamağında hangi rakam vardır?",
      "0,375 ondalık gösteriminin kesir şeklinde yazılımı nedir?",
      "7,45 < ? < 7,46 eşitsizliğini sağlayan ondalık gösterim aşağıdakilerden hangisi olabilir?",
      "28,56 sayısının yüzde birler basamağındaki rakamın basamak değeri kaçtır?",
      "2,5 × 0,04 işleminin sonucu kaçtır?",
      "17,6 ÷ 0,8 işleminin sonucu kaçtır?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Oran") {
    const questions = [
      "12'nin 36'ya oranı kaçtır?",
      "3:5 oranında karıştırılan su ve şerbetin 24 litresi su ise, karışımın tamamı kaç litredir?",
      "Bir sınıfta kız öğrencilerin erkek öğrencilere oranı 4:5 ise, 36 öğrencilik sınıfta kaç kız öğrenci vardır?",
      "9:15 oranı sadeleştirildiğinde aşağıdakilerden hangisine eşit olur?",
      "Bir dikdörtgenin kenarları 8 cm ve 12 cm'dir. Bu dikdörtgenin çevresi ile alanının oranı kaçtır?",
      "45 TL'nin 60 TL'ye oranı nedir?",
      "6 kg şeker ile 10 kg un karıştırılıyor. Karışımdaki şekerin una oranı kaçtır?",
      "A:B = 3:4 ve B:C = 5:6 ise, A:C oranı kaçtır?",
      "Bir miktar para Ali ve Veli arasında 5:7 oranında paylaşılıyor. Ali 35 TL aldığına göre, toplam para kaç TL'dir?",
      "3 saatte 240 km yol giden bir araç saatte kaç km yol alır?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Cebirsel İfadeler") {
    const questions = [
      "3x + 5 ifadesinde x = 2 için ifadenin değeri kaçtır?",
      "2x + 3y ifadesinde x = 4 ve y = 5 için ifadenin değeri kaçtır?",
      "x + 5 = 12 denkleminin çözümü nedir?",
      "2x - 3 = 7 denkleminin çözümü nedir?",
      "3x + 4 = 2x - 5 denkleminin çözümü nedir?",
      "x + y = 7 ve x - y = 3 denklemlerinin çözümünde x kaçtır?",
      "a + 5 = 2a - 7 denkleminden a kaçtır?",
      "2(x + 3) - 5 = 3(x - 1) + 2 denkleminin çözümü nedir?",
      "4x + 6 = 2x + 12 denkleminden x kaçtır?",
      "x/3 + 2 = 5 denkleminin çözümü nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Veri Analizi") {
    const questions = [
      "4, 6, 9, 11, 15 veri grubunun aritmetik ortalaması kaçtır?",
      "7, 8, 9, 10, 11 veri grubunun medyanı (ortanca değeri) kaçtır?",
      "2, 3, 3, 4, 5, 5, 5, 6, 6, 7 veri grubunun modu (tepe değeri) kaçtır?",
      "3, 5, 7, 9, ? veri grubunun aritmetik ortalaması 7 ise, ? yerine hangi sayı yazılmalıdır?",
      "4, 8, x, 12, 16 veri grubunun medyanı 8 ise, x kaçtır?",
      "Bir sınıftaki 25 öğrencinin matematik sınavı not ortalaması 72'dir. Sonradan sınıfa katılan 5 öğrencinin not ortalaması 80 ise, son durumda sınıfın not ortalaması kaç olur?",
      "5, 7, 8, x, y verilerinin ortalaması 7 ve medyanı 7 ise, x+y toplamı kaçtır?",
      "23, 25, 28, 30, 34 sayılarının açıklığı (en büyük ile en küçük arasındaki fark) kaçtır?",
      "Bir veri grubundaki 5 sayının toplamı 80'dir. Bu veri grubuna 8 sayısı eklenirse, yeni veri grubunun aritmetik ortalaması kaç olur?",
      "Bir sütun grafiğinde 2019: 30, 2020: 45, 2021: 60, 2022: 75, 2023: 90 değerleri gösteriliyorsa, bu değerlerin ortalaması kaçtır?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Açılar") {
    const questions = [
      "Bir tam dönme kaç derecedir?",
      "Bir doğru açı kaç derecedir?",
      "140° ile 40° arasındaki fark açısı kaç derecedir?",
      "Bir açının ölçüsü 30° ise, tümler açısının ölçüsü kaç derecedir?",
      "115° lik bir açının bütünler açısı kaç derecedir?",
      "Bir üçgenin iç açıları toplamı kaç derecedir?",
      "Bir düzgün sekizgenin bir iç açısının ölçüsü kaç derecedir?",
      "Bir dörtgenin iç açıları toplamı kaç derecedir?",
      "Bir iç açısı 108° olan düzgün çokgenin kenar sayısı kaçtır?",
      "İki komşu açının ölçüleri 65° ve 25° ise, bu iki açının arasındaki açı kaç derecedir?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Alan Ölçme") {
    const questions = [
      "Kenar uzunlukları 5 cm ve 8 cm olan dikdörtgenin alanı kaç cm²dir?",
      "Bir kenarı 6 cm olan karenin alanı kaç cm²dir?",
      "Taban uzunluğu 10 cm ve yüksekliği 7 cm olan üçgenin alanı kaç cm²dir?",
      "Yarıçapı 4 cm olan dairenin alanı kaç π cm²dir?",
      "Taban uzunluğu 12 cm ve yüksekliği 5 cm olan paralelkenarın alanı kaç cm²dir?",
      "Bir kenarı 8 cm ve bu kenara ait yüksekliği 6 cm olan paralelkenarın alanı kaç cm²dir?",
      "Kenar uzunlukları 8 cm ve 12 cm olan dikdörtgenin çevresi kaç cm'dir?",
      "Alanı 64 cm² olan karenin bir kenarı kaç cm'dir?",
      "Bir dik üçgenin dik kenarları 6 cm ve 8 cm ise, alanı kaç cm²dir?",
      "Yarıçapı 5 cm olan dairenin çevresi kaç π cm'dir?"
    ];
    return questions[challengeOrder - 1];
  }
  return `${unitTitle} - Soru ${challengeOrder}: Bu soruyu cevaplayın.`;
};

// Function to generate options based on unit, lesson, and challenge
const getOption = (unitTitle: string, lessonOrder: number, challengeOrder: number, optionOrder: number): string => {
  if (unitTitle === "Doğal Sayılarla İşlemler") {
    if (challengeOrder === 1) {
      const options = ["8", "12", "16", "32"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) {
      const options = ["21", "24", "27", "30"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) {
      const options = ["24", "30", "69", "72"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) {
      const options = ["55", "60", "66", "91"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) {
      const options = ["3", "9", "27", "81"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) {
      const options = ["45×456", "456×45", "45+456", "123×456"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) {
      const options = ["20", "21", "22", "23"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) {
      const options = ["52", "18", "17", "35"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) {
      const options = ["60", "64", "66", "72"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) {
      const options = ["2550", "2500", "2450", "2050"];
      return options[optionOrder - 1];
    }
  } else if (unitTitle === "Çarpanlar ve Katlar") {
    if (challengeOrder === 1) {
      const options = ["6", "18", "9", "36"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) {
      const options = ["36", "48", "72", "6"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) {
      const options = ["2, 3, 7", "2, 21", "3, 14", "6, 7"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) {
      const options = ["19", "23", "29", "21"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) {
      const options = ["10", "16", "12", "8"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) {
      const options = ["28", "24", "30", "36"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) {
      const options = ["10", "15", "20", "5"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) {
      const options = ["6", "9", "12", "18"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) {
      const options = ["14", "18", "22", "26"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) {
      const options = ["24", "26", "23", "25"];
      return options[optionOrder - 1];
    }
  } else if (unitTitle === "Tam Sayılar") {
    if (challengeOrder === 1) {
      const options = ["−5", "0", "3/4", "−12"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) {
      const options = ["−5", "−11", "11", "5"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) {
      const options = ["35", "−35", "−12", "12"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) {
      const options = ["2", "−2", "−10", "10"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) {
      const options = ["−9", "−11", "5", "11"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) {
      const options = ["4", "−4", "144", "−144"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) {
      const options = ["−3", "−1", "−7", "−5"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) {
      const options = ["34", "35", "36", "37"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) {
      const options = ["−11", "3", "11", "−3"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) {
      const options = ["0", "5", "10", "−10"];
      return options[optionOrder - 1];
    }
  } else if (unitTitle === "Kesirlerle İşlemler") {
    if (challengeOrder === 1) {
      const options = ["5/7", "17/12", "5/12", "7/12"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) {
      const options = ["7/4", "5/4", "3/4", "5/18"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) {
      const options = ["6/20", "5/20", "3/10", "4/10"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) {
      const options = ["1/2", "5/8", "3/8", "3/4"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) {
      const options = ["5 1/6", "6 1/6", "5 1/5", "6 1/5"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) {
      const options = ["2/3", "7/10", "3/4", "4/7"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) {
      const options = ["2/3", "1/3", "4/9", "1/4"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) {
      const options = ["9/10", "11/12", "7/8", "5/6"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) {
      const options = ["8/9", "4/3", "3/2", "2"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) {
      const options = ["1", "2/3", "5/6", "7/6"];
      return options[optionOrder - 1];
    }
  } else if (unitTitle === "Ondalık Gösterim") {
    if (challengeOrder === 1) {
      const options = ["0,34", "0,75", "0,43", "0,57"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) {
      const options = ["3,20", "4,20", "4,02", "3,02"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) {
      const options = ["1,71", "17,1", "15,1", "1,51"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) {
      const options = ["4", "3", "0,4", "0,25"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) {
      const options = ["3", "7", "5", "0"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) {
      const options = ["3/8", "3/7", "375/1000", "37/100"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) {
      const options = ["7,455", "7,452", "7,459", "7,451"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) {
      const options = ["0,06", "0,6", "6", "0,006"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) {
      const options = ["1", "0,1", "0,01", "0,001"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) {
      const options = ["22", "2,2", "0,22", "220"];
      return options[optionOrder - 1];
    }
  } else if (unitTitle === "Oran") {
    if (challengeOrder === 1) {
      const options = ["1:3", "1:2", "1:4", "1:5"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) {
      const options = ["64 litre", "56 litre", "72 litre", "60 litre"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) {
      const options = ["16", "18", "14", "20"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) {
      const options = ["3:5", "3:4", "2:5", "2:3"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) {
      const options = ["5:12", "5:13", "2:3", "4:9"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) {
      const options = ["3:4", "2:3", "3:5", "4:5"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) {
      const options = ["3:5", "2:3", "3:4", "4:5"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) {
      const options = ["5:8", "3:8", "5:6", "3:5"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) {
      const options = ["84 TL", "70 TL", "90 TL", "96 TL"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) {
      const options = ["80 km", "70 km", "90 km", "60 km"];
      return options[optionOrder - 1];
    }
  } else if (unitTitle === "Cebirsel İfadeler") {
    if (challengeOrder === 1) {
      const options = ["11", "10", "9", "8"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) {
      const options = ["23", "22", "21", "24"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) {
      const options = ["7", "6", "5", "8"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) {
      const options = ["5", "4", "6", "7"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) {
      const options = ["-9", "9", "0", "-8"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) {
      const options = ["5", "4", "3", "6"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) {
      const options = ["12", "10", "13", "11"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) {
      const options = ["2", "1", "3", "0"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) {
      const options = ["3", "2", "4", "6"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) {
      const options = ["9", "6", "3", "12"];
      return options[optionOrder - 1];
    }
  } else if (unitTitle === "Veri Analizi") {
    if (challengeOrder === 1) {
      const options = ["9", "10", "8", "7"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) {
      const options = ["9", "10", "8", "7"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) {
      const options = ["5", "3", "6", "7"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) {
      const options = ["11", "10", "9", "12"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) {
      const options = ["8", "10", "12", "6"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) {
      const options = ["73,33", "74", "72", "75"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) {
      const options = ["15", "14", "13", "16"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) {
      const options = ["11", "10", "12", "9"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) {
      const options = ["14,67", "15", "14", "13,5"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) {
      const options = ["60", "55", "50", "65"];
      return options[optionOrder - 1];
    }
  } else if (unitTitle === "Açılar") {
    if (challengeOrder === 1) {
      const options = ["360°", "180°", "90°", "270°"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) {
      const options = ["180°", "90°", "360°", "270°"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) {
      const options = ["100°", "80°", "60°", "120°"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) {
      const options = ["330°", "300°", "360°", "30°"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) {
      const options = ["245°", "235°", "225°", "255°"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) {
      const options = ["180°", "360°", "90°", "270°"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) {
      const options = ["135°", "140°", "120°", "150°"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) {
      const options = ["360°", "180°", "90°", "270°"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) {
      const options = ["5", "6", "7", "8"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) {
      const options = ["90°", "40°", "65°", "25°"];
      return options[optionOrder - 1];
    }
  } else if (unitTitle === "Alan Ölçme") {
    if (challengeOrder === 1) {
      const options = ["40", "45", "35", "50"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) {
      const options = ["36", "30", "42", "24"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) {
      const options = ["35", "30", "40", "42"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) {
      const options = ["16 π", "12 π", "14 π", "18 π"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) {
      const options = ["60", "55", "65", "50"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) {
      const options = ["48", "42", "50", "54"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) {
      const options = ["40", "38", "42", "44"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) {
      const options = ["8", "7", "9", "6"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) {
      const options = ["24", "28", "26", "22"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) {
      const options = ["10 π", "8 π", "12 π", "14 π"];
      return options[optionOrder - 1];
    }
  }
  throw new Error(`No options defined for unit "${unitTitle}", challenge ${challengeOrder}`);
};

main().catch((err) => {
  console.error("An error occurred while attempting to seed the database:", err);
});
