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
    console.log("Creating Matematik (Mathematics) course for 8th grade");

    // Insert the course
    const [course] = await db
      .insert(schema.courses)
      .values({ title: "Matematik 8. Sınıf", imageSrc: "/matematik-8.svg" })
      .returning();

    // Unit names for 8th grade Mathematics in Turkish curriculum
    const unitNames = [
      { title: "Üslü Sayılar ve Köklü Sayılar", description: "Üslü ve köklü ifadelerin temel kavramları" },
      { title: "Fonksiyonlar", description: "Fonksiyon kavramı ve grafik analizi" },
      { title: "Denklem ve Eşitsizlikler", description: "Doğrusal denklemler ve eşitsizliklerin çözümleri" },
      { title: "Polinomlar", description: "Polinomların yapısı, derecesi ve işlemleri" },
      { title: "Doğrular ve Açılar", description: "İleri düzey doğrular ve açıların özellikleri" },
      { title: "Üçgenler", description: "Üçgenlerin özellikleri ve benzerlik ilişkileri" },
      { title: "Dörtgenler", description: "Dörtgenlerin sınıflandırılması ve özellikleri" },
      { title: "Çember ve Daire", description: "Çember ve daire ile ilgili temel kavramlar" },
      { title: "Veri Analizi", description: "İstatistiksel veri analizi ve yorumlama" },
      { title: "Problemler ve Uygulamalar", description: "Gerçek yaşam problemleri ve matematiksel modelleme" }
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

      // Lesson names for each unit (5 lessons per unit)
      const lessonNames = [
        `${unitNames[i].title} - Temel Kavramlar`,
        `${unitNames[i].title} - Uygulamalar`,
        `${unitNames[i].title} - İleri Konular`,
        `${unitNames[i].title} - Soru Çözümü`,
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

        // Create 10 challenges for each lesson
        await createChallenges(lesson.id, unitNames[i].title, j + 1);
      }
    }

    console.log("8th grade Matematik course created successfully.");
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

// Function to determine if an option is correct based on unit and challenge number
const isCorrect = (unitTitle: string, lessonOrder: number, challengeOrder: number, optionOrder: number): boolean => {
  if (unitTitle === "Üslü Sayılar ve Köklü Sayılar") {
    // Correct answer indices for challenges 1..10 respectively: [1, 2, 1, 1, 2, 3, 3, 3, 3, 3]
    const answers = [1, 2, 1, 1, 2, 3, 3, 3, 3, 3];
    return optionOrder === answers[challengeOrder - 1];
  } else if (unitTitle === "Fonksiyonlar") {
    // Correct answers: [2, 2, 1, 1, 2, 1, 2, 2, 2, 4]
    const answers = [2, 2, 1, 1, 2, 1, 2, 2, 2, 4];
    return optionOrder === answers[challengeOrder - 1];
  } else if (unitTitle === "Denklem ve Eşitsizlikler") {
    // Correct answers: [1, 3, 2, 1, 3, 3, 1, 3, 2, 2]
    const answers = [1, 3, 2, 1, 3, 3, 1, 3, 2, 2];
    return optionOrder === answers[challengeOrder - 1];
  } else if (unitTitle === "Polinomlar") {
    // Correct answers: [1, 2, 1, 2, 1, 2, 2, 1, 1, 1]
    const answers = [1, 2, 1, 2, 1, 2, 2, 1, 1, 1];
    return optionOrder === answers[challengeOrder - 1];
  } else if (unitTitle === "Doğrular ve Açılar") {
    // Correct answers: [1, 3, 3, 2, 1, 1, 3, 1, 1, 1]
    const answers = [1, 3, 3, 2, 1, 1, 3, 1, 1, 1];
    return optionOrder === answers[challengeOrder - 1];
  } else if (unitTitle === "Üçgenler") {
    // Correct answers: [1, 1, 1, 1, 2, 1, 1, 1, 1, 1]
    const answers = [1, 1, 1, 1, 2, 1, 1, 1, 1, 1];
    return optionOrder === answers[challengeOrder - 1];
  } else if (unitTitle === "Dörtgenler") {
    // For all challenges here, correct answer is option 1
    const answers = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    return optionOrder === answers[challengeOrder - 1];
  } else if (unitTitle === "Çember ve Daire") {
    const answers = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    return optionOrder === answers[challengeOrder - 1];
  } else if (unitTitle === "Veri Analizi") {
    const answers = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    return optionOrder === answers[challengeOrder - 1];
  } else if (unitTitle === "Problemler ve Uygulamalar") {
    // Correct answers: [2, 3, 2, 2, 2, 2, 1, 3, 2, 2]
    const answers = [2, 3, 2, 2, 2, 2, 1, 3, 2, 2];
    return optionOrder === answers[challengeOrder - 1];
  }
  return false;
};

// Function to generate a question based on unit and challenge number
const getQuestion = (unitTitle: string, lessonOrder: number, challengeOrder: number): string => {
  if (unitTitle === "Üslü Sayılar ve Köklü Sayılar") {
    const questions = [
      "2^3 işleminin sonucu nedir?",
      "√49 değeri kaçtır?",
      "3^2 × 3^3 işleminin sonucu nedir?",
      "√81 ile 3^2 arasındaki fark nedir?",
      "5^0 kaçtır?",
      "√64 işleminin sonucu nedir?",
      "2^5 ifadesinin değeri nedir?",
      "√100 değeri kaçtır?",
      "4^3 işleminin sonucu nedir?",
      "√144 değeri nedir?"
    ];
    return questions[challengeOrder - 1];
  } else if (unitTitle === "Fonksiyonlar") {
    const questions = [
      "f(x)=2x+3 fonksiyonunda f(4) kaçtır?",
      "g(x)=x^2 fonksiyonunda g(5) değeri nedir?",
      "h(x)=3x-2 fonksiyonunda h(0) sonucu nedir?",
      "Bir fonksiyonun grafiği hangi özellikleri gösterir?",
      "f(x)=x^2 en küçük değeri hangi x için olur?",
      "f(x)=2x+3 fonksiyonunda eğim nedir?",
      "f(x)=x^2 fonksiyonunun simetri ekseni hangisidir?",
      "Fonksiyon tanım kümesi genellikle hangi aralığı içerir?",
      "f(x)=3x+1 fonksiyonunda y-kesişim ne kadardır?",
      "Bir fonksiyonun tersini bulmak için hangi işlem yapılır?"
    ];
    return questions[challengeOrder - 1];
  } else if (unitTitle === "Denklem ve Eşitsizlikler") {
    const questions = [
      "2x + 5 = 13 denkleminin çözümü nedir?",
      "x - 4 = 7 denkleminin çözümü kaçtır?",
      "3x = 12 denkleminde x kaçtır?",
      "2x + 3 > 7 eşitsizliğinde x için doğru olan aralık hangisidir?",
      "x/3 = 5 denkleminin çözümü nedir?",
      "5x - 2 = 18 denkleminde x'in değeri kaçtır?",
      "x + 2 < 10 eşitsizliğinde x'in alabileceği en büyük tam sayı nedir?",
      "4x = 16 denkleminin çözümü nedir?",
      "3x - 1 = 2 denkleminde x kaçtır?",
      "2x + 7 = 15 denkleminde x nedir?"
    ];
    return questions[challengeOrder - 1];
  } else if (unitTitle === "Polinomlar") {
    const questions = [
      "Polinomun derecesi nedir?",
      "x^2 + 5x + 6 ifadesi hangi polinomdur?",
      "x^2 - 9 ifadesi hangi şekilde çarpanlarına ayrılır?",
      "Polinomun katsayıları toplamı nasıl bulunur?",
      "(x - 2)(x + 3) işleminin açılımı nedir?",
      "x^3 ifadesi hangi derecededir?",
      "x^2 - 4x + 4 ifadesi hangi özelliği gösterir?",
      "Polinom bölmesi sonucu kalan neye denir?",
      "x^2 + 2x + 1 ifadesinin çarpanlara ayrılmış hali nedir?",
      "İki polinomun toplamı nasıl bulunur?"
    ];
    return questions[challengeOrder - 1];
  } else if (unitTitle === "Doğrular ve Açılar") {
    const questions = [
      "İki doğrunun kesiştiği açılar toplamı kaç derecedir?",
      "Bir doğrunun eğimi nasıl hesaplanır?",
      "Dik açının ölçüsü kaç derecedir?",
      "Bir üçgenin iç açılar toplamı kaç derecedir?",
      "Dik üçgende Pisagor teoremi nedir?",
      "İki paralel doğrunun arasındaki uzaklık nasıl ölçülür?",
      "Açı ölçü birimi nedir?",
      "Ters açılar hakkında ne söylenir?",
      "Bir doğru parçasının orta noktası nasıl bulunur?",
      "Açıortay nedir?"
    ];
    return questions[challengeOrder - 1];
  } else if (unitTitle === "Üçgenler") {
    const questions = [
      "Eşkenar üçgenin tüm açıları kaç derecedir?",
      "Üçgenin iç açılar toplamı kaç derecedir?",
      "İkizkenar üçgenin özellikleri nelerdir?",
      "Üçgen eşitsizliği nedir?",
      "Dik üçgende yükseklik nasıl hesaplanır?",
      "Bir üçgenin alanı nasıl hesaplanır?",
      "Üçgenin dış açılar toplamı kaç derecedir?",
      "Benzer üçgenler arasındaki açı oranı nasıldır?",
      "Üçgenin kenar uzunlukları hangi oranda olursa eş üçgen olur?",
      "Bir üçgende medyan nedir?"
    ];
    return questions[challengeOrder - 1];
  } else if (unitTitle === "Dörtgenler") {
    const questions = [
      "Bir karenin tüm kenarları eşit midir?",
      "Dikdörtgenin köşegenleri eşit midir?",
      "Paralelkenarların özellikleri nelerdir?",
      "Bir yamukta hangi açı çiftleri eşit olur?",
      "Dörtgenin iç açılar toplamı kaç derecedir?",
      "Eşkenar dörtgen nedir?",
      "Bir dikdörtgenin alanı nasıl hesaplanır?",
      "Dörtgenin çevresi nasıl hesaplanır?",
      "Romb nedir?",
      "Dörtgenin köşegenleri arasındaki ilişki nedir?"
    ];
    return questions[challengeOrder - 1];
  } else if (unitTitle === "Çember ve Daire") {
    const questions = [
      "Bir çemberin yarıçapı nedir?",
      "Dairenin alanı hangi formülle hesaplanır?",
      "Çemberin çevresi nasıl bulunur?",
      "Pi sayısı yaklaşık olarak kaçtır?",
      "Yarıçapı iki katına çıkarılan bir dairenin alanı nasıl değişir?",
      "Çemberin merkezi nedir?",
      "Daire diliminin alanı nasıl hesaplanır?",
      "Çember üzerinde teğet nedir?",
      "Dairede chord ne anlama gelir?",
      "Bir çemberin kiriş uzunluğu nasıl hesaplanır?"
    ];
    return questions[challengeOrder - 1];
  } else if (unitTitle === "Veri Analizi") {
    const questions = [
      "Median nedir?",
      "Aritmetik ortalama nasıl hesaplanır?",
      "Mod nedir?",
      "Veri setinde varyans nedir?",
      "Standart sapma neyi gösterir?",
      "Dağılım ölçüsü olarak range nasıl bulunur?",
      "Interquartile range nedir?",
      "Bir histogram grafiğinde ne gösterilir?",
      "Veri setinde uç değer nedir?",
      "Frekans dağılımı nasıl oluşturulur?"
    ];
    return questions[challengeOrder - 1];
  } else if (unitTitle === "Problemler ve Uygulamalar") {
    const questions = [
      "Bir aracın 120 km'yi 2 saatte aldığı biliniyorsa, 180 km'yi kaç saatte alır?",
      "Bir kişi 60 TL harcayarak 3 kalem alabildiğine göre 5 kalem kaç TL'ye mal olur?",
      "Bir malın fiyatı %20 artarak 120 TL oluyorsa, eski fiyatı kaç TL'dir?",
      "Bir işçi 5 günde 40 iş yapıyorsa, aynı işçi 8 günde kaç iş yapar?",
      "Bir markette 3 ürün 15 TL ise, 7 ürün kaç TL'ye mal olur?",
      "Bir tren 240 km'yi 3 saatte gidiyorsa, 400 km kaç saatte gider?",
      "Bir üniversite öğrenci sayısı %10 artarak 550'ye çıktıysa, önceki öğrenci sayısı kaçtır?",
      "Bir dikdörtgenin uzun kenarı kısa kenarın 1.5 katıysa ve kısa kenar 8 cm ise, alanı nedir?",
      "Bir telefonun fiyatı %25 indirimle 300 TL olduysa, indirim öncesi fiyatı nedir?",
      "Bir çiftlikte 15 tavuk 45 yumurta veriyorsa, 25 tavuk kaç yumurta verir?"
    ];
    return questions[challengeOrder - 1];
  }
  return `${unitTitle} ile ilgili soru ${challengeOrder}`;
};

// Function to generate options based on unit, lesson, and challenge number
const getOption = (unitTitle: string, lessonOrder: number, challengeOrder: number, optionOrder: number): string => {
  // Üslü Sayılar ve Köklü Sayılar
  if (unitTitle === "Üslü Sayılar ve Köklü Sayılar") {
    if (challengeOrder === 1) {
      const options = ["8", "6", "9", "12"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) {
      const options = ["6", "7", "8", "9"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) {
      const options = ["243", "81", "54", "72"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) {
      const options = ["0", "1", "2", "3"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) {
      const options = ["0", "1", "5", "Undefined"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) {
      const options = ["6", "7", "8", "9"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) {
      const options = ["16", "24", "32", "64"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) {
      const options = ["8", "9", "10", "11"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) {
      const options = ["16", "48", "64", "81"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) {
      const options = ["10", "11", "12", "13"];
      return options[optionOrder - 1];
    }
  }
  // Fonksiyonlar
  else if (unitTitle === "Fonksiyonlar") {
    if (challengeOrder === 1) {
      const options = ["10", "11", "12", "9"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) {
      const options = ["20", "25", "30", "35"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) {
      const options = ["-2", "0", "2", "1"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) {
      const options = ["İntersept, eğim ve simetri", "Sadece eğimi", "Sadece kesişim noktalarını", "Sadece simetri bilgilerini"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) {
      const options = ["-1", "0", "1", "2"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) {
      const options = ["2", "3", "5", "1"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) {
      const options = ["y=0", "x=0", "x=y", "y=x"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) {
      const options = ["Sadece pozitif sayılar", "Tüm reel sayılar", "Sadece negatif sayılar", "Sadece tamsayılar"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) {
      const options = ["0", "1", "3", "4"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) {
      const options = ["Grafik aynalama", "Fonksiyonun tanım kümesini değiştirir", "Değeri ters çevirir", "x ve y yer değiştirir ve denklemi çözer"];
      return options[optionOrder - 1];
    }
  }
  // Denklem ve Eşitsizlikler
  else if (unitTitle === "Denklem ve Eşitsizlikler") {
    if (challengeOrder === 1) {
      const options = ["4", "3", "5", "6"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) {
      const options = ["7", "10", "11", "12"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) {
      const options = ["3", "4", "5", "6"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) {
      const options = [">2", "≥2", "<2", "≤2"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) {
      const options = ["5", "10", "15", "20"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) {
      const options = ["2", "3", "4", "5"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) {
      const options = ["7", "8", "6", "5"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) {
      const options = ["2", "3", "4", "5"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) {
      const options = ["0", "1", "2", "3"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) {
      const options = ["3", "4", "5", "6"];
      return options[optionOrder - 1];
    }
  }
  // Polinomlar
  else if (unitTitle === "Polinomlar") {
    if (challengeOrder === 1) {
      const options = ["En yüksek üstel değer", "Katsayıların toplamı", "Sabit terim", "Fonksiyonun kökü"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) {
      const options = ["Birinci dereceden", "İkinci dereceden", "Üçüncü dereceden", "Dördüncü dereceden"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) {
      const options = ["(x-3)(x+3)", "(x-9)", "(x+3)^2", "(x-3)^2"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) {
      const options = ["x=0", "x=1", "x=-1", "x=2"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) {
      const options = ["x^2 + x -6", "x^2 - x +6", "x^2 +6", "x^2 -6"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) {
      const options = ["2", "3", "4", "5"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) {
      const options = ["Kare farkı", "Tam kare", "İki farklı polinom", "Hiçbiri"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) {
      const options = ["Kalan", "Bölüm", "Çarpan", "Kat sayı"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) {
      const options = ["(x+1)^2", "(x-1)^2", "x^2+1", "(x+2)^2"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) {
      const options = ["Katsayılar toplanır", "Çarpımları alınır", "Farkları alınır", "Bölünür"];
      return options[optionOrder - 1];
    }
  }
  // Doğrular ve Açılar
  else if (unitTitle === "Doğrular ve Açılar") {
    if (challengeOrder === 1) {
      const options = ["180 derece", "360 derece", "90 derece", "270 derece"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) {
      const options = ["Yükseklik/Genişlik", "Değişim/Zaman", "Dikey fark/Yatay fark", "Yatay fark/Dikey fark"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) {
      const options = ["45", "60", "90", "120"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) {
      const options = ["90", "180", "270", "360"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) {
      const options = ["a^2+b^2=c^2", "a+b=c", "a^2-b^2=c^2", "a^2+b^2=2c"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) {
      const options = ["Perpendiküler mesafe", "Eğim farkı", "Açı farkı", "Uzunluk farkı"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) {
      const options = ["Radyan", "Derece", "Her ikisi", "Metre"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) {
      const options = ["Eşit", "Birbirine toplamları 180", "Birbirini tamamlar", "Hiçbiri"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) {
      const options = ["İki uç noktanın ortalaması", "Uzaklık farkı", "Eğimin yarısı", "Hiçbiri"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) {
      const options = ["Bir açıyı eşit ikiye bölen doğru", "Açının tamamı", "Açı çevresi", "Açı ölçüsü"];
      return options[optionOrder - 1];
    }
  }
  // Üçgenler
  else if (unitTitle === "Üçgenler") {
    if (challengeOrder === 1) {
      const options = ["60", "90", "120", "45"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) {
      const options = ["180", "360", "90", "270"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) {
      const options = ["İki kenarı eşit", "Tüm kenarları eşit", "Hiçbiri", "Hepsi"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) {
      const options = ["Her iki kenarın toplamı üçüncü kenardan büyük olmalıdır", "En büyük kenar diğer ikisinin farkından küçük olur", "Herhangi bir kenar diğerlerinin toplamına eşittir", "Hiçbiri"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) {
      const options = ["Pisagor teoremi", "Alan formülü kullanılarak", "Ortalama alınarak", "Kesinlikle ölçülemez"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) {
      const options = ["(Taban×Yükseklik)/2", "Taban+Yükseklik", "Taban×Yükseklik", "Taban/Yükseklik"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) {
      const options = ["180", "360", "90", "270"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) {
      const options = ["Aynıdır", "Farklıdır", "Büyük üçgende daha küçüktür", "Yüzde 50"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) {
      const options = ["Hepsi eşit", "İki eşit", "Hiçbiri", "Herhangi oran"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) {
      const options = ["Üçgenin bir kenarının orta noktası ile karşı köşeyi birleştiren doğru", "Yüksekliği", "Açıortay", "Köşegen"];
      return options[optionOrder - 1];
    }
  }
  // Dörtgenler
  else if (unitTitle === "Dörtgenler") {
    if (challengeOrder === 1) {
      const options = ["Evet", "Hayır", "Sadece çaprazlarında", "Belirli durumlarda"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) {
      const options = ["Evet", "Hayır", "Bazen", "Bilgi yok"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) {
      const options = ["Karşı kenarlar eşittir", "Tüm kenarlar eşittir", "Hiçbiri", "Sadece açılar eşittir"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) {
      const options = ["Taban açılar", "Yan açılar", "Karşı açılar", "Hiçbiri"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) {
      const options = ["360", "180", "270", "400"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) {
      const options = ["Tüm kenarları eşit olan paralelkenar", "Sadece köşeleri eşit olan dörtgen", "Sadece kenarları eşit olan dörtgen", "Sadece açıları eşittir olan dörtgen"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) {
      const options = ["Alan hesaplanarak", "Çevre hesaplanarak", "Kenar uzunlukları toplanarak", "Özel formülle"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) {
      const options = ["6", "7", "8", "9"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) {
      const options = ["Karede tüm kenarlar eşittir", "Dikdörtgende köşegenler eşit", "Yamukta paralel kenarlar eşittir", "Rombta tüm açıların eşit olduğu"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) {
      const options = ["Köşegenler birbirini dik keser", "Köşegenler eşittir", "Köşegenler toplamı sabittir", "Hiçbiri"];
      return options[optionOrder - 1];
    }
  }
  // Çember ve Daire
  else if (unitTitle === "Çember ve Daire") {
    if (challengeOrder === 1) {
      const options = ["Yarıçap", "Çap", "Kiriş", "Teğet"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) {
      const options = ["πr²", "2πr", "πd", "2r"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) {
      const options = ["2πr", "πr²", "π", "2r"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) {
      const options = ["3.14", "3.141", "3.1415", "3.14159"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) {
      const options = ["Alan dört katına çıkar", "Alan iki katına çıkar", "Çevre iki katına çıkar", "Hiçbiri"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) {
      const options = ["Çemberin merkezi", "Çemberin perimetresi", "Dairenin alanı", "Dairenin çevresi"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) {
      const options = ["P(Yarıçap)²×Açı/360", "2πr", "πr²", "r"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) {
      const options = ["Bir doğru", "Bir yay", "Bir nokta", "İki nokta"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) {
      const options = ["Kiriş uzunluğu formülü ile", "Alan formülü ile", "Çevre formülü ile", "Yarıçap formülü ile"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) {
      const options = ["Dairenin alanı", "Çemberin çevresi", "Kiriş formülü", "Teğetin uzunluğu"];
      return options[optionOrder - 1];
    }
  }
  // Veri Analizi
  else if (unitTitle === "Veri Analizi") {
    if (challengeOrder === 1) {
      const options = ["Ortanca", "Ortalama", "Mod", "Medyan"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) {
      const options = ["Tüm veri toplamı bölü veri sayısı", "En büyük değer", "En küçük değer", "Medyan"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) {
      const options = ["En çok tekrar eden değer", "Veri setindeki en yüksek sayı", "Veri setindeki en düşük sayı", "Ortalama"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) {
      const options = ["Varyans", "Ortanca", "Mod", "Medyan"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) {
      const options = ["İndirim öncesi fiyat", "İndirim sonrası fiyat", "Kâr marjı", "İskonto oranı"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) {
      const options = ["En yüksek - en düşük", "Ortalama", "Medyan", "Mod"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) {
      const options = ["Dilim açısı", "Merkez açısı", "Yüzde", "Bölüm"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) {
      const options = ["Sınıf genişlikleri", "Frekanslar", "Veri dağılımı", "Hepsi"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) {
      const options = ["Zaman serisi", "Kategorik", "Sürekli", "Kesikli"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) {
      const options = ["Grup oluşturma", "Sıralama", "Toplama", "Normalize etme"];
      return options[optionOrder - 1];
    }
  }
  // Problemler ve Uygulamalar
  else if (unitTitle === "Problemler ve Uygulamalar") {
    if (challengeOrder === 1) {
      const options = ["3 saatte", "2.5 saatte", "2 saatte", "4 saatte"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) {
      const options = ["25 TL", "30 TL", "35 TL", "40 TL"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) {
      const options = ["100 TL", "110 TL", "120 TL", "130 TL"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) {
      const options = ["50 iş", "60 iş", "70 iş", "80 iş"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) {
      const options = ["20 TL", "25 TL", "30 TL", "35 TL"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) {
      const options = ["4 saat", "4.5 saat", "5 saat", "5.5 saat"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) {
      const options = ["500", "525", "540", "550"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) {
      const options = ["1000", "1050", "1100", "1150"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) {
      const options = ["375 TL", "400 TL", "425 TL", "450 TL"];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) {
      const options = ["42", "45", "48", "50"];
      return options[optionOrder - 1];
    }
  }
  return "";
};

main().catch((err) => {
  console.error("An error occurred while attempting to seed the database:", err);
});
