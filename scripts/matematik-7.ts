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
    console.log("Creating Matematik (Mathematics) course for 7th grade");

    // Insert the course
    const [course] = await db
      .insert(schema.courses)
      .values({ title: "Matematik 7. Sınıf", imageSrc: "/matematik-7.svg" })
      .returning();

    // Unit names for 7th grade Mathematics in Turkish curriculum
    const unitNames = [
      { title: "Tam Sayılar", description: "Tam sayılar ve işlemler" },
      { title: "Rasyonel Sayılar", description: "Rasyonel sayılar ve işlemler" },
      { title: "Cebir", description: "Cebirsel ifadeler" },
      { title: "Oran ve Orantı", description: "Oran orantı problemleri" },
      { title: "Yüzdeler", description: "Yüzde hesaplamaları" },
      { title: "Doğrular ve Açılar", description: "Doğrular ve açılar konusu" },
      { title: "Çokgenler", description: "Çokgenler ve özellikleri" },
      { title: "Eşlik ve Benzerlik", description: "Eşlik ve benzerlik konusu" },
      { title: "Dönüşüm Geometrisi", description: "Dönüşüm geometrisi uygulamaları" },
      { title: "Veri Analizi", description: "Veri toplama, düzenleme ve yorumlama" }
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
        `${unitNames[i].title} - Problem Çözme`,
        `${unitNames[i].title} - Günlük Hayatta Uygulamalar`,
        `${unitNames[i].title} - İleri Düzey Problemler`,
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

    console.log("7th grade Matematik course created successfully.");
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
  // For "Tam Sayılar" unit (Integers)
  if (unitTitle === "Tam Sayılar") {
    if (challengeOrder === 1 && optionOrder === 1) return true; // (-8)+(+15)=7
    if (challengeOrder === 2 && optionOrder === 1) return true; // (-6)*(-7)=42
    if (challengeOrder === 3 && optionOrder === 2) return true; // (-24) ÷ 4 = -6
  }
  // For "Rasyonel Sayılar" unit (Rational Numbers)
  else if (unitTitle === "Rasyonel Sayılar") {
    if (challengeOrder === 1 && optionOrder === 3) return true; // 2/5+3/10: 7/10
    if (challengeOrder === 2 && optionOrder === 1) return true; // 3/4×2/3: 1/2
    if (challengeOrder === 3 && optionOrder === 1) return true; // 5/6 ÷ 2/3: 5/4
  }
  // For "Cebir" unit (Algebra)
  else if (unitTitle === "Cebir") {
    if (challengeOrder === 1 && optionOrder === 1) return true; // 3x+5=14 -> x=3
    if (challengeOrder === 2 && optionOrder === 1) return true; // 2(x+3)=16 -> x=5
    if (challengeOrder === 3 && optionOrder === 3) return true; // x/2+3=8 -> x=10
  }
  // For "Oran ve Orantı" unit (Ratio and Proportion)
  else if (unitTitle === "Oran ve Orantı") {
    if (challengeOrder === 1 && optionOrder === 1) return true; // 240 km in 3h => 5 h for 400 km
    if (challengeOrder === 2 && optionOrder === 1) return true; // 8 işçi 12 gün => 16 gün for 6 işçi
    if (challengeOrder === 3 && optionOrder === 1) return true; // 3kg=15TL => 5kg=25TL
    if (challengeOrder === 4 && optionOrder === 2) return true; // Map: correct is 10 km
    if (challengeOrder === 5 && optionOrder === 1) return true; // Total money = 960 TL
    if (challengeOrder === 6 && optionOrder === 1) return true; // A:C ratio = 8:15
    if (challengeOrder === 7 && optionOrder === 2) return true; // Sugar: 20 kg
    if (challengeOrder === 8 && optionOrder === 2) return true; // Total students = 50
    if (challengeOrder === 9 && optionOrder === 2) return true; // 15 bardak un -> 10 bardak şeker
    if (challengeOrder === 10 && optionOrder === 2) return true; // 100 km/h, 4h -> 400 km
  }
  // For "Yüzdeler" unit (Percentages)
  else if (unitTitle === "Yüzdeler") {
    if (challengeOrder === 1 && optionOrder === 1) return true; // 250 TL %20 = 50 TL
    if (challengeOrder === 2 && optionOrder === 1) return true; // 300 TL with 30% increase -> 200 TL original
    if (challengeOrder === 3 && optionOrder === 4) return true; // Net -10% change
    if (challengeOrder === 4 && optionOrder === 2) return true; // 40% of B then 25% of C gives 10% of C
    if (challengeOrder === 5 && optionOrder === 2) return true; // 80's %35 = 28
    if (challengeOrder === 6 && optionOrder === 2) return true; // 150kg %12 =18 kg
    if (challengeOrder === 7 && optionOrder === 3) return true; // 20 boys => Total 50
    if (challengeOrder === 8 && optionOrder === 2) return true; // Principal ≈ 1161 TL
    if (challengeOrder === 9 && optionOrder === 2) return true; // 20% profit: cost 250 TL
    if (challengeOrder === 10 && optionOrder === 3) return true; // 20% remains => 2000 TL salary
  }
  // For "Doğrular ve Açılar" unit (Lines and Angles)
  else if (unitTitle === "Doğrular ve Açılar") {
    if (challengeOrder === 1 && optionOrder === 1) return true; // Ters açılar equal
    if (challengeOrder === 2 && optionOrder === 1) return true; // 180° for triangle interior
    if (challengeOrder === 3 && optionOrder === 1) return true; // 180° for linear pair
    if (challengeOrder === 4 && optionOrder === 1) return true; // Corresponding angles equal
    if (challengeOrder === 5 && optionOrder === 3) return true; // 90° for right angle
    if (challengeOrder === 6 && optionOrder === 1) return true; // 0°-90° for dar açı
    if (challengeOrder === 7 && optionOrder === 1) return true; // 90°-180° for geniş açı
    if (challengeOrder === 8 && optionOrder === 2) return true; // Tam açı =360°
    if (challengeOrder === 9 && optionOrder === 1) return true; // Doğru açı =90°
    if (challengeOrder === 10 && optionOrder === 1) return true; // Sum =180° description
  }
  // For "Çokgenler" unit (Polygons)
  else if (unitTitle === "Çokgenler") {
    if (challengeOrder === 1 && optionOrder === 3) return true; // Regular hexagon interior =120°
    if (challengeOrder === 2 && optionOrder === 1) return true; // Sum =180(n-2)
    if (challengeOrder === 3 && optionOrder === 1) return true; // Regular quadrilateral = Kare
    if (challengeOrder === 4 && optionOrder === 1) return true; // Diagonals of a rectangle equal and bisect each other
    if (challengeOrder === 5 && optionOrder === 2) return true; // Equilateral triangle angles =60°
    if (challengeOrder === 6 && optionOrder === 2) return true; // Regular pentagon external =72°
    if (challengeOrder === 7 && optionOrder === 3) return true; // Square side =6 cm
    if (challengeOrder === 8 && optionOrder === 3) return true; // 48/6=8 cm
    if (challengeOrder === 9 && optionOrder === 1) return true; // Triangle area = (base*height)/2
    if (challengeOrder === 10 && optionOrder === 1) return true; // Diagonals number = n(n-3)/2
  }
  // For "Eşlik ve Benzerlik" unit (Congruence and Similarity)
  else if (unitTitle === "Eşlik ve Benzerlik") {
    if (challengeOrder === 1 && optionOrder === 1) return true; // All sides and angles equal for congruency
    if (challengeOrder === 2 && optionOrder === 1) return true; // Area ratio = (side ratio)^2
    if (challengeOrder === 3 && optionOrder === 1) return true; // Triangles are similar (ratio 1:2)
    if (challengeOrder === 4 && optionOrder === 1) return true; // AA criterion is sufficient
    if (challengeOrder === 5 && optionOrder === 1) return true; // (2:3)^2=4:9
    if (challengeOrder === 6 && optionOrder === 1) return true; // Equilateral triangle: all equal
    if (challengeOrder === 7 && optionOrder === 1) return true; // Base angles equal in isosceles
    if (challengeOrder === 8 && optionOrder === 1) return true; // Volume ratio = cube of side ratio
    if (challengeOrder === 9 && optionOrder === 1) return true; // Perimeter ratio equals side ratio
    if (challengeOrder === 10 && optionOrder === 1) return true; // They differ generally
  }
  // For "Dönüşüm Geometrisi" unit (Transformation Geometry)
  else if (unitTitle === "Dönüşüm Geometrisi") {
    if (challengeOrder === 1 && optionOrder === 1) return true; // Translation preserves shape and size
    if (challengeOrder === 2 && optionOrder === 2) return true; // 90° rotation yields symmetry about origin
    if (challengeOrder === 3 && optionOrder === 1) return true; // Reflection over x-axis: top/bottom swap
    if (challengeOrder === 4 && optionOrder === 1) return true; // Reflection over y-axis: x sign changes
    if (challengeOrder === 5 && optionOrder === 1) return true; // Invariance of area, shape and angles
    if (challengeOrder === 6 && optionOrder === 1) return true; // Translation: add (2,3)
    if (challengeOrder === 7 && optionOrder === 1) return true; // Self-symmetry about an axis
    if (challengeOrder === 8 && optionOrder === 3) return true; // A square has 4 symmetry axes
    if (challengeOrder === 9 && optionOrder === 1) return true; // Equilateral triangle rotates 120° to self-map
    if (challengeOrder === 10 && optionOrder === 1) return true; // Reflection gives (-a,-b)
  }
  // For "Veri Analizi" unit (Data Analysis)
  else if (unitTitle === "Veri Analizi") {
    if (challengeOrder === 1 && optionOrder === 1) return true; // Median of sorted data: 12
    if (challengeOrder === 2 && optionOrder === 1) return true; // Average = 9
    if (challengeOrder === 3 && optionOrder === 2) return true; // Range = 17
    if (challengeOrder === 4 && optionOrder === 1) return true; // Mode = 5
    if (challengeOrder === 5 && optionOrder === 1) return true; // New average ≈73.33
    if (challengeOrder === 6 && optionOrder === 1) return true; // Interquartile range = Q3 - Q1
    if (challengeOrder === 7 && optionOrder === 1) return true; // Central angles show proportions
    if (challengeOrder === 8 && optionOrder === 1) return true; // Histogram: class widths, frequencies, distribution
    if (challengeOrder === 9 && optionOrder === 1) return true; // Line graph for time series
    if (challengeOrder === 10 && optionOrder === 1) return true; // Grouping data forms a frequency table
  }
  return false;
};

// Function to generate a question based on unit and lesson
const getQuestion = (unitTitle: string, lessonOrder: number, challengeOrder: number): string => {
  if (unitTitle === "Tam Sayılar") {
    const questions = [
      "(-8) + (+15) işleminin sonucu nedir?",
      "(-6) × (-7) işleminin sonucu nedir?",
      "(-24) ÷ (4) işleminin sonucu nedir?",
      "-15 ve 8 tam sayılarının toplamı kaçtır?",
      "Sıcaklık -5°C'den 12°C'ye çıkarsa, sıcaklık farkı kaç derecedir?",
      "Ardışık üç tam sayının toplamı -12 ise, ortadaki sayı kaçtır?",
      "Bir asansör 8. kattan başlayıp 3 kat aşağı, sonra 5 kat yukarı çıkarsa hangi kattadır?",
      "(-3) × (-4) × (-2) işleminin sonucu nedir?",
      "Sıfırın 8 eksiği ile -15'in toplamı kaçtır?",
      "Deniz seviyesinden 15 metre aşağıda olan bir dalgıç, 8 metre yukarı çıkarsa yeni konumu ne olur?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Rasyonel Sayılar") {
    const questions = [
      "2/5 + 3/10 işleminin sonucu nedir?",
      "3/4 × 2/3 işleminin sonucu nedir?",
      "5/6 ÷ 2/3 işleminin sonucu nedir?",
      "0,25 + 0,75 işleminin sonucu nedir?",
      "2,5 × 0,4 işleminin sonucu nedir?",
      "3/8 kesrini ondalık sayıya çevirdiğimizde sonuç nedir?",
      "0,125 ondalık sayısını kesir olarak yazınız.",
      "7/9 ile 5/9 arasındaki fark nedir?",
      "-3/4 ile 1/8 toplamının sonucu nedir?",
      "1/2 + 1/3 + 1/6 işleminin sonucu nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Cebir") {
    const questions = [
      "3x + 5 = 14 denkleminin çözümü nedir?",
      "2(x + 3) = 16 denkleminin çözümü nedir?",
      "x/2 + 3 = 8 denkleminin çözümü nedir?",
      "7 - 3x = 1 denkleminin çözümü nedir?",
      "3x - 2y = 12 denkleminde, x = 5 iken y değeri kaçtır?",
      "y = 2x + 1 doğrusu üzerinde, x = 3 iken y değeri kaçtır?",
      "x² + 5x + 6 ifadesinin çarpanlarına ayrılmış hali nedir?",
      "3x² - 12 ifadesinin sadeleştirilmiş hali nedir?",
      "(x + 2)² ifadesinin açılımı nedir?",
      "3(2x - 1) + 4(x + 2) ifadesinin sadeleştirilmiş hali nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Oran ve Orantı") {
    const questions = [
      "Bir araç 240 km yolu 3 saatte alıyorsa, 400 km yolu kaç saatte alır?",
      "8 işçi bir işi 12 günde bitirirse, aynı işi 6 işçi kaç günde bitirir?",
      "3 kg elma 15 TL ise, 5 kg elma kaç TL'dir?",
      "A ve B şehirleri arasındaki uzaklık haritada 5 cm olarak gösterilmiştir. Haritanın ölçeği 1:200000 ise, gerçek uzaklık kaç km'dir?",
      "Bir miktar para 4 kişi arasında 2:3:5:6 oranında paylaştırılıyor. En fazla para alan kişi 360 TL aldığına göre, toplam para miktarı kaç TL'dir?",
      "A:B = 2:3 ve B:C = 4:5 ise, A:C oranı nedir?",
      "Bir karışımda su ve şeker oranı 3:2'dir. Bu karışıma 10 kg su eklenirse, yeni oran 2:1 oluyor. Başlangıçta karışımda kaç kg şeker vardır?",
      "Bir sınıftaki öğrencilerin %60'ı kızdır. Sınıfta 20 erkek öğrenci olduğuna göre, sınıfta toplam kaç öğrenci vardır?",
      "Bir pasta tarifi için 3 bardak un ve 2 bardak şeker kullanılıyor. 15 bardak un kullanılırsa kaç bardak şeker gerekir?",
      "Bir arabanın hızı ile aldığı yol doğru orantılıdır. Bu araba 60 km/saat hızla 180 km yol alıyorsa, 100 km/saat hızla 4 saatte kaç km yol alır?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Yüzdeler") {
    const questions = [
      "250 TL'nin %20'si kaç TL'dir?",
      "Bir ürünün fiyatı %30 artırıldıktan sonra 260 TL olmuştur. Bu ürünün ilk fiyatı kaç TL'dir?",
      "Bir ürüne önce %20 zam, sonra %25 indirim yapılırsa, ürünün fiyatı yüzde kaç değişir?",
      "A sayısı B sayısının %40'ı, B sayısı da C sayısının %25'i ise, A sayısı C sayısının yüzde kaçıdır?",
      "80 sayısının %35'i kaçtır?",
      "150 kg ürünün %12'si bozuk çıkmıştır. Bozuk ürün miktarı kaç kg'dır?",
      "Bir sınıftaki öğrencilerin %60'ı kızdır. Sınıfta 20 erkek öğrenci olduğuna göre, sınıfta toplam kaç öğrenci vardır?",
      "Bir miktar para bankaya yıllık %8 basit faizle yatırılıyor. 3 yıl sonra toplam para 1440 TL olduğuna göre, başlangıçta yatırılan para kaç TL'dir?",
      "Bir ürün %20 kârla 300 TL'ye satılıyor. Bu ürünün maliyeti kaç TL'dir?",
      "Bir işçi, aldığı ücretin %25'ini kiraya, %40'ını mutfak masraflarına, %15'ini faturalara ayırıyor ve geriye 400 TL kalıyor. Bu işçinin aldığı ücret kaç TL'dir?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Doğrular ve Açılar") {
    const questions = [
      "İki doğrunun birbirini kesmesiyle oluşan ters açılar için ne söylenebilir?",
      "Bir üçgenin iç açıları toplamı kaç derecedir?",
      "Bir doğru üzerindeki açıların ölçüleri toplamı kaç derecedir?",
      "Paralel iki doğruyu kesen bir doğru ile oluşan yöndeş açılar için ne söylenebilir?",
      "Dik açının ölçüsü kaç derecedir?",
      "Dar açı hangi aralıktaki açılardır?",
      "Geniş açı hangi aralıktaki açılardır?",
      "Bir tam açı kaç derecedir?",
      "Bir doğru açı kaç derecedir?",
      "Komşu açılar toplamı kaç derecedir?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Çokgenler") {
    const questions = [
      "Bir düzgün altıgenin bir iç açısı kaç derecedir?",
      "Kenar sayısı n olan bir çokgenin iç açıları toplamı kaç derecedir?",
      "Düzgün bir dörtgenin adı nedir?",
      "Bir dikdörtgenin köşegenlerinin özellikleri nelerdir?",
      "Bir eşkenar üçgenin bütün açıları kaçar derecedir?",
      "Bir düzgün beşgenin bir dış açısı kaç derecedir?",
      "Çevresinin uzunluğu 24 cm olan kare şeklindeki bir alanın bir kenarı kaç cm'dir?",
      "Bir dikdörtgenin alanı 48 cm², bir kenarı 6 cm ise diğer kenarı kaç cm'dir?",
      "Bir üçgenin alanını hesaplamak için hangi formül kullanılır?",
      "Bir çokgenin köşegen sayısını hesaplamak için hangi formül kullanılır?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Eşlik ve Benzerlik") {
    const questions = [
      "İki üçgenin eşit olması için hangi durumlar sağlanmalıdır?",
      "Benzer çokgenlerin alanları arasındaki ilişki nedir?",
      "Kenarları 3 cm, 4 cm ve 5 cm olan bir üçgen ile kenarları 6 cm, 8 cm ve 10 cm olan bir üçgen için ne söylenebilir?",
      "İki üçgenin benzer olması için hangi durumlar yeterlidir?",
      "Benzer iki üçgenin kenar uzunlukları oranı 2:3 ise, alanları oranı nedir?",
      "Eşkenar bir üçgenin tüm kenarları birbirine nasıldır?",
      "İkizkenar bir üçgenin taban açıları nasıldır?",
      "Benzer şekillerin hacimlerinin oranı neye bağlıdır?",
      "Benzer iki üçgenin çevreleri oranı, kenar uzunlukları oranına nasıl bağlıdır?",
      "Bir üçgende kenarortay, açıortay ve yükseklik arasındaki ilişki nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Dönüşüm Geometrisi") {
    const questions = [
      "Bir şeklin öteleme sonucu oluşan görüntüsü hakkında ne söylenebilir?",
      "Bir üçgenin orijin etrafında 90° saat yönünde döndürülmesi sonucu oluşan görüntü için ne söylenebilir?",
      "Bir şeklin x-eksenine göre yansıması hakkında ne söylenebilir?",
      "Koordinat düzleminde bir noktanın y-eksenine göre yansıması nasıl bulunur?",
      "Bir şeklin öteleme, yansıma veya dönme sonucunda değişmeyen özellikleri nelerdir?",
      "Bir şeklin A(2,3) noktasına göre ötelenmesi nasıl ifade edilir?",
      "Bir düzlemsel şeklin öz-simetrili olması ne demektir?",
      "Bir kare kaç tane simetri ekseni içerir?",
      "Bir eşkenar üçgenin dönme simetrisi için ne söylenebilir?",
      "Koordinat düzleminde (a,b) noktasının orijine göre simetriği hangi noktadır?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Veri Analizi") {
    const questions = [
      "Aşağıdaki veri setinin medyanını bulunuz: 5, 8, 12, 15, 20",
      "Aşağıdaki veri setinin aritmetik ortalamasını bulunuz: 3, 7, 9, 11, 15",
      "Aşağıdaki veri setinin açıklığını bulunuz: 4, 7, 9, 12, 18, 21",
      "Aşağıdaki veri setinin modu nedir: 3, 5, 7, 5, 9, 5, 10, 12",
      "Bir sınıftaki 25 öğrencinin matematik sınav notlarının ortalaması 72'dir. Bu sınıfa 5 yeni öğrenci katılırsa ve bu öğrencilerin matematik not ortalaması 80 ise, yeni oluşan sınıfın not ortalaması kaç olur?",
      "Bir veri setinin çeyrekler açıklığı ne demektir?",
      "Daire grafiğinde merkez açılar neyi gösterir?",
      "Bir histogram grafiğini oluştururken nelere dikkat edilmelidir?",
      "Çizgi grafiği en çok hangi tür verileri göstermek için kullanılır?",
      "Bir çetele tablosundan frekans tablosuna nasıl geçilir?"
    ];
    return questions[challengeOrder - 1];
  }
  return `${unitTitle} ile ilgili soru ${challengeOrder}`;
};

// Function to generate options based on unit, lesson, and challenge
const getOption = (unitTitle: string, lessonOrder: number, challengeOrder: number, optionOrder: number): string => {
  // Options for Tam Sayılar (Integers)
  if (unitTitle === "Tam Sayılar") {
    if (challengeOrder === 1) { // (-8) + (+15) = ?
      const options = [
        "7",
        "-7",
        "23",
        "-23"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // (-6) × (-7) = ?
      const options = [
        "42",
        "-42",
        "13",
        "-13"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // (-24) ÷ 4 = ?
      const options = [
        "6",
        "-6",
        "28",
        "-28"
      ];
      return options[optionOrder - 1];
    }
  }

  // Options for Rasyonel Sayılar (Rational Numbers)
  if (unitTitle === "Rasyonel Sayılar") {
    if (challengeOrder === 1) { // 2/5 + 3/10 = ?
      const options = [
        "1/2",
        "5/10",
        "7/10",
        "5/15"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // 3/4 × 2/3 = ?
      const options = [
        "1/2",
        "5/7",
        "6/12",
        "5/12"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // 5/6 ÷ 2/3 = ?
      const options = [
        "5/4",
        "10/6",
        "15/12",
        "5/12"
      ];
      return options[optionOrder - 1];
    }
  }

  // Options for Cebir (Algebra)
  if (unitTitle === "Cebir") {
    if (challengeOrder === 1) { // 3x + 5 = 14
      const options = [
        "x = 3",
        "x = 4",
        "x = 5",
        "x = 6"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // 2(x + 3) = 16
      const options = [
        "x = 5",
        "x = 6.5",
        "x = 7",
        "x = 8"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // x/2 + 3 = 8
      const options = [
        "x = 5",
        "x = 8",
        "x = 10",
        "x = 12"
      ];
      return options[optionOrder - 1];
    }
  }

  // Options for Oran ve Orantı (Ratio and Proportion)
  if (unitTitle === "Oran ve Orantı") {
    if (challengeOrder === 1) { // 240 km/3h, 400 km kaç saatte?
      const options = [
        "5 saat",
        "6 saat",
        "7 saat",
        "8 saat"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // 8 işçi 12 günde, 6 işçi kaç günde?
      const options = [
        "16 gün",
        "14 gün",
        "18 gün",
        "20 gün"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // 3 kg =15 TL, 5 kg = ?
      const options = [
        "25 TL",
        "20 TL",
        "30 TL",
        "35 TL"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Harita: 5 cm, ölçek 1:200000, gerçek kaç km?
      const options = [
        "8 km",
        "10 km",
        "12 km",
        "15 km"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Paylaştırmada en çok alan =360 TL, toplam para?
      const options = [
        "960 TL",
        "840 TL",
        "1020 TL",
        "1080 TL"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // A:B=2:3, B:C=4:5, A:C oranı?
      const options = [
        "8:15",
        "10:15",
        "2:3",
        "5:8"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // Su-şeker: 3:2, +10 kg su, yeni oran 2:1, şeker miktarı?
      const options = [
        "15 kg",
        "20 kg",
        "25 kg",
        "30 kg"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // Erkek öğrenci 20, %60 kız => toplam?
      const options = [
        "40",
        "45",
        "50",
        "55"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // Pasta: 3 un,2 şeker, 15 un -> kaç şeker?
      const options = [
        "8 bardak",
        "10 bardak",
        "12 bardak",
        "15 bardak"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // 60 km/h, 3h=180km; 100 km/h, 4h = ?
      const options = [
        "350 km",
        "400 km",
        "450 km",
        "500 km"
      ];
      return options[optionOrder - 1];
    }
  }

  // Options for Yüzdeler (Percentages)
  if (unitTitle === "Yüzdeler") {
    if (challengeOrder === 1) { // 250 TL'nin %20'si?
      const options = [
        "50 TL",
        "40 TL",
        "60 TL",
        "70 TL"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // %30 artış sonrası 260 TL, ilk fiyat?
      const options = [
        "200 TL",
        "220 TL",
        "240 TL",
        "250 TL"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Önce %20, sonra %25, net değişim?
      const options = [
        "%5 artar",
        "%5 azalır",
        "%10 artar",
        "%10 azalır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // A = B'nin %40'ı, B = C'nin %25'i, A = C'nin %?
      const options = [
        "8%",
        "10%",
        "12%",
        "15%"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // 80'in %35'i?
      const options = [
        "24",
        "28",
        "32",
        "35"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // 150 kg'nin %12'si?
      const options = [
        "15 kg",
        "18 kg",
        "20 kg",
        "22 kg"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // %60 kız, 20 erkek => toplam öğrenci?
      const options = [
        "40",
        "45",
        "50",
        "55"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // %8 faiz, 3 yılda 1440 TL, anapara?
      const options = [
        "1160 TL",
        "1161 TL",
        "1200 TL",
        "1240 TL"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // %20 kâr, 300 TL satış, maliyet?
      const options = [
        "240 TL",
        "250 TL",
        "260 TL",
        "270 TL"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // Ücretin %20'si =400 TL, toplam ücret?
      const options = [
        "1800 TL",
        "1900 TL",
        "2000 TL",
        "2100 TL"
      ];
      return options[optionOrder - 1];
    }
  }

  // Options for Doğrular ve Açılar (Lines and Angles)
  if (unitTitle === "Doğrular ve Açılar") {
    if (challengeOrder === 1) { // Ters açılar
      const options = [
        "Eşit açılardır",
        "Tamamlayıcı açılardır",
        "Tümler açılardır",
        "Dik açılardır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Üçgenin iç açılar toplamı
      const options = [
        "180 derece",
        "360 derece",
        "90 derece",
        "270 derece"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Doğrudaki açılar toplamı
      const options = [
        "180 derece",
        "360 derece",
        "90 derece",
        "270 derece"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Paralel doğrularda yöndeş açılar
      const options = [
        "Eşit açılardır",
        "Tamamlayıcı açılardır",
        "Ters açılardır",
        "Dış açılardır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Dik açı
      const options = [
        "45 derece",
        "60 derece",
        "90 derece",
        "120 derece"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // Dar açı
      const options = [
        "0° ile 90° arası",
        "90° ile 180° arası",
        "0° ile 60° arası",
        "60° ile 120° arası"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // Geniş açı
      const options = [
        "90° ile 180° arası",
        "0° ile 90° arası",
        "180° ile 360° arası",
        "60° ile 120° arası"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // Tam açı
      const options = [
        "180 derece",
        "360 derece",
        "90 derece",
        "270 derece"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // Doğru açı
      const options = [
        "90 derece",
        "180 derece",
        "360 derece",
        "45 derece"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // Komşu açılar toplamı
      const options = [
        "180 derece",
        "90 derece",
        "360 derece",
        "270 derece"
      ];
      return options[optionOrder - 1];
    }
  }

  // Options for Çokgenler (Polygons)
  if (unitTitle === "Çokgenler") {
    if (challengeOrder === 1) { // Regular hexagon interior angle
      const options = [
        "100 derece",
        "110 derece",
        "120 derece",
        "130 derece"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Sum of interior angles
      const options = [
        "180(n-2)",
        "180n",
        "360(n-2)",
        "360n"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Name of a regular quadrilateral
      const options = [
        "Kare",
        "Dikdörtgen",
        "Eşkenar dörtgen",
        "Paralelkenar"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Diagonals of a rectangle
      const options = [
        "Eşit uzunluktadırlar ve birbirini iki eşit parçaya bölerler",
        "Eşit uzunlukta değildirler ancak birbirini iki eşit parçaya bölerler",
        "Eşit uzunluktadırlar fakat birbirini bölemezler",
        "Farklı uzunluklardadırlar"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Equilateral triangle angles
      const options = [
        "45 derece",
        "60 derece",
        "90 derece",
        "120 derece"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // External angle of a regular pentagon
      const options = [
        "60 derece",
        "72 derece",
        "90 derece",
        "108 derece"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // Side of square with perimeter 24 cm
      const options = [
        "4 cm",
        "5 cm",
        "6 cm",
        "8 cm"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // Rectangle side given area and one side
      const options = [
        "6 cm",
        "7 cm",
        "8 cm",
        "9 cm"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // Formula for triangle area
      const options = [
        "(Taban × Yükseklik) / 2",
        "Taban × Yükseklik",
        "2 × Taban + Yükseklik",
        "Taban + Yükseklik"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // Formula for number of diagonals
      const options = [
        "n(n-3)/2",
        "n(n-1)/2",
        "(n-2)*180",
        "n-2"
      ];
      return options[optionOrder - 1];
    }
  }

  // Options for Eşlik ve Benzerlik (Congruence and Similarity)
  if (unitTitle === "Eşlik ve Benzerlik") {
    if (challengeOrder === 1) { // Conditions for congruency
      const options = [
        "Üçgenin tüm kenarları ve açılarının birbirine eşit olması",
        "Sadece açıların eşit olması",
        "Sadece kenarların eşit olması",
        "Üçgenin alanlarının eşit olması"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Area relation in similar polygons
      const options = [
        "Kenardaki oranların karesi",
        "Kenardaki oranlar",
        "Çevresindeki oran",
        "Farklı değildir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Comparison of two triangles with sides 3,4,5 and 6,8,10
      const options = [
        "İkinci üçgen birinci üçgenin benzeridir",
        "İkisi de eş üçgendir",
        "İkinci üçgen birinci üçgenin iki katıdır",
        "Benzerlik yoktur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Criterion for similarity
      const options = [
        "İki açısının eşit olması",
        "Yan yana düşen kenarların oranlarının eşit olması",
        "Üç açısının eşit olması",
        "Üç kenarının eşit olması"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Area ratio given side ratio 2:3
      const options = [
        "4:9",
        "2:3",
        "3:2",
        "8:27"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // Equilateral triangle properties
      const options = [
        "Eşittir",
        "Farklıdır",
        "Sadece iki kenarı eşittir",
        "Hiçbiri"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // Base angles in isosceles triangle
      const options = [
        "Eşit",
        "Farklı",
        "Her zaman 60 derece",
        "Tamamlayıcı"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // Volume ratio in similar shapes
      const options = [
        "Kenardaki oranın küpüne",
        "Kenardaki orana",
        "Alanların oranına",
        "Hacimlerin oranına"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // Perimeter ratio relation
      const options = [
        "Aynıdır",
        "Küçüktür",
        "Büyüktür",
        "Ters orantılıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // Relation among median, angle bisector, altitude
      const options = [
        "Farklıdır",
        "Aynıdır",
        "Kesinlikle eşit değildir",
        "İç içe geçer"
      ];
      return options[optionOrder - 1];
    }
  }

  // Options for Dönüşüm Geometrisi (Transformation Geometry)
  if (unitTitle === "Dönüşüm Geometrisi") {
    if (challengeOrder === 1) { // Translation properties
      const options = [
        "Şeklin şeklinde ve boyutunda değişiklik olmaz",
        "Şeklin sadece yönü değişir",
        "Şeklin sadece boyutu değişir",
        "Şeklin şekli tamamen değişir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Rotation about origin 90° CW
      const options = [
        "Orijine göre eşlenir",
        "Orijine göre simetriktir",
        "Çevrilmiş üçgen orijinal ile aynı değildir",
        "Üçgenin açıları değişir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Reflection over x-axis
      const options = [
        "Şeklin üst ve alt kısmı yer değiştirir, boyut ve şekil korunur",
        "Şeklin sadece rengi ters döner",
        "Şeklin boyutu artar",
        "Şeklin orantısı bozulur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Reflection: How to find y-axis reflection
      const options = [
        "Noktanın x koordinatı işareti ters çevrilir",
        "Noktanın y koordinatı işareti ters çevrilir",
        "Her iki koordinat değiştirilir",
        "Hiçbir koordinat değişmez"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Invariant properties after rigid motion
      const options = [
        "Şeklin alanı, şekli ve açıları",
        "Sadece alanı",
        "Sadece şekli",
        "Sadece açıları"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // Translation by A(2,3)
      const options = [
        "Tüm noktalara (2,3) eklenir",
        "Tüm noktalardan (2,3) çıkarılır",
        "Her noktanın koordinatları iki katına çıkarılır",
        "Hiçbir değişiklik olmaz"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // Self-symmetry definition
      const options = [
        "Şeklin kendisiyle simetrik bir eksen etrafında eşlenmesidir",
        "Şeklin aynası alınabilir olmasıdır",
        "Şeklin boyutunun değişmemesidir",
        "Şeklin renklerinin aynı olmasıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // How many symmetry axes does a square have?
      const options = [
        "1",
        "2",
        "4",
        "8"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // Rotation symmetry of an equilateral triangle
      const options = [
        "120°'lik dönüşlerle kendini alır",
        "90°'lik dönüşlerle kendini alır",
        "180°'lik dönüşlerle kendini alır",
        "60°'lik dönüşlerle kendini alır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // Reflection of point (a,b) about origin
      const options = [
        "(-a,-b)",
        "(b,a)",
        "(-a,b)",
        "(a,-b)"
      ];
      return options[optionOrder - 1];
    }
  }

  // Options for Veri Analizi (Data Analysis)
  if (unitTitle === "Veri Analizi") {
    if (challengeOrder === 1) { // Median of data set
      const options = [
        "12",
        "15",
        "10",
        "8"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Arithmetic mean
      const options = [
        "9",
        "10",
        "11",
        "12"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Range of data set
      const options = [
        "15",
        "17",
        "19",
        "21"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Mode of data set
      const options = [
        "5",
        "7",
        "9",
        "10"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // New average after additional students
      const options = [
        "73.33",
        "74",
        "72",
        "75"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // Interquartile range definition
      const options = [
        "Bir veri setindeki Q3 ile Q1 arasındaki fark",
        "Veri setinin en büyük ve en küçük değerleri arasındaki fark",
        "Veri setinin ortanca değeri",
        "Veri setinin standart sapması"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // What does the central angle in a pie chart represent?
      const options = [
        "Her kategorinin toplam veriye oranını",
        "Her kategorinin sayısal değerini",
        "Veri setinin ortalamasını",
        "Veri setinin medyanını"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // Considerations for histogram graphs
      const options = [
        "Sınıf genişlikleri, frekanslar ve verilerin dağılımı",
        "Renk seçimi, grafik tipi ve etiketler",
        "Sadece sınıf genişlikleri",
        "Yalnızca frekanslar"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // Line chart common use
      const options = [
        "Zaman serilerini",
        "Dağılım ilişkilerini",
        "Kategorik verileri",
        "Yüzdelik dağılımları"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // Transition from raw table to frequency table
      const options = [
        "Verilerin gruplandırılması",
        "Verilerin sıralanması",
        "Verilerin toplanması",
        "Verilerin normalize edilmesi"
      ];
      return options[optionOrder - 1];
    }
  }
  return "";
};

main().catch((err) => {
  console.error("An error occurred while attempting to seed the database:", err);
});