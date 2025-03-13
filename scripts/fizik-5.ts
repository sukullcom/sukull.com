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
    console.log("Creating Fizik (Physics) course for 5th grade");

    // Insert the course
    const [course] = await db
      .insert(schema.courses)
      .values({ title: "Fizik 5. Sınıf", imageSrc: "/fizik-5.svg" })
      .returning();

    // Unit names for 5th grade Physics in Turkish curriculum
    const unitNames = [
      { title: "Kuvvet ve Hareket", description: "Kuvvet ve hareket ilişkisi" },
      { title: "Işık ve Ses", description: "Işık ve ses kavramlarının temelleri" },
      { title: "Madde ve Değişim", description: "Maddenin özellikleri ve değişimler" },
      { title: "Elektrik", description: "Elektrik devre elemanları ve basit devreler" },
      { title: "Isı ve Sıcaklık", description: "Isı ve sıcaklık kavramları" },
      { title: "Mıknatıs ve Etkileri", description: "Mıknatısların özellikleri" },
      { title: "Basit Makineler", description: "Basit makinelerin çalışma prensipleri" },
      { title: "Dünya ve Uzay", description: "Dünya ve uzay hakkında temel bilgiler" },
      { title: "Enerji Dönüşümleri", description: "Enerji çeşitleri ve dönüşümleri" },
      { title: "Ölçme ve Birimler", description: "Temel fiziksel ölçü birimleri" }
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

    console.log("5th grade Fizik course created successfully.");
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
    if (challengeOrder === 1 && optionOrder === 2) return true; // Kuvvet nedir?
    if (challengeOrder === 2 && optionOrder === 3) return true; // Hareket nedir?
    if (challengeOrder === 3 && optionOrder === 1) return true; // Sürtünme kuvveti
    if (challengeOrder === 4 && optionOrder === 4) return true; // İtme ve çekme
    if (challengeOrder === 5 && optionOrder === 2) return true; // Yer çekimi
    if (challengeOrder === 6 && optionOrder === 3) return true; // Kuvvetin birimi
    if (challengeOrder === 7 && optionOrder === 1) return true; // Hız kavramı
    if (challengeOrder === 8 && optionOrder === 4) return true; // Kuvvetin etkileri
    if (challengeOrder === 9 && optionOrder === 2) return true; // Dengelenmiş kuvvetler
    if (challengeOrder === 10 && optionOrder === 3) return true; // Dengelenmemiş kuvvetler
  }
  
  // For "Işık ve Ses" unit (Light and Sound)
  else if (unitTitle === "Işık ve Ses") {
    if (challengeOrder === 1 && optionOrder === 3) return true; // Işık nedir?
    if (challengeOrder === 2 && optionOrder === 1) return true; // Ses nedir?
    if (challengeOrder === 3 && optionOrder === 4) return true; // Işık kaynakları
    if (challengeOrder === 4 && optionOrder === 2) return true; // Ses kaynakları
    if (challengeOrder === 5 && optionOrder === 3) return true; // Işığın yayılması
    if (challengeOrder === 6 && optionOrder === 1) return true; // Sesin yayılması
    if (challengeOrder === 7 && optionOrder === 4) return true; // Işık-madde etkileşimi
    if (challengeOrder === 8 && optionOrder === 2) return true; // Sesin yüksekliği
    if (challengeOrder === 9 && optionOrder === 3) return true; // Işığın yansıması
    if (challengeOrder === 10 && optionOrder === 1) return true; // Sesin şiddeti
  }

  // For "Madde ve Değişim" unit (Matter and Change)
  else if (unitTitle === "Madde ve Değişim") {
    if (challengeOrder === 1 && optionOrder === 4) return true; // Madde nedir?
    if (challengeOrder === 2 && optionOrder === 2) return true; // Maddenin halleri
    if (challengeOrder === 3 && optionOrder === 3) return true; // Fiziksel değişim
    if (challengeOrder === 4 && optionOrder === 1) return true; // Kimyasal değişim
    if (challengeOrder === 5 && optionOrder === 4) return true; // Erime
    if (challengeOrder === 6 && optionOrder === 2) return true; // Donma
    if (challengeOrder === 7 && optionOrder === 3) return true; // Buharlaşma
    if (challengeOrder === 8 && optionOrder === 1) return true; // Yoğunlaşma
    if (challengeOrder === 9 && optionOrder === 4) return true; // Kütle
    if (challengeOrder === 10 && optionOrder === 2) return true; // Hacim
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
      "Kuvvet nedir?",
      "Hareket nedir?",
      "Sürtünme kuvveti nedir?",
      "İtme ve çekme nedir?",
      "Yer çekimi nedir?",
      "Kuvvetin birimi nedir?",
      "Hız kavramı nedir?",
      "Kuvvetin etkileri nelerdir?",
      "Dengelenmiş kuvvetler nedir?",
      "Dengelenmemiş kuvvetler nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Işık ve Ses (Light and Sound)
  if (unitTitle === "Işık ve Ses") {
    const questions = [
      "Işık nedir?",
      "Ses nedir?",
      "Işık kaynakları nelerdir?",
      "Ses kaynakları nelerdir?",
      "Işığın yayılması nasıl olur?",
      "Sesin yayılması nasıl olur?",
      "Işık-madde etkileşimi nasıl gerçekleşir?",
      "Sesin yüksekliği neye bağlıdır?",
      "Işığın yansıması nedir?",
      "Sesin şiddeti neye bağlıdır?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Madde ve Değişim (Matter and Change)
  if (unitTitle === "Madde ve Değişim") {
    const questions = [
      "Madde nedir?",
      "Maddenin halleri nelerdir?",
      "Fiziksel değişim nedir?",
      "Kimyasal değişim nedir?",
      "Erime nedir?",
      "Donma nedir?",
      "Buharlaşma nedir?",
      "Yoğunlaşma nedir?",
      "Kütle nedir?",
      "Hacim nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Elektrik (Electricity)
  if (unitTitle === "Elektrik") {
    const questions = [
      "Elektrik nedir?",
      "Elektrik devresi nedir?",
      "İletken ve yalıtkan maddeler nelerdir?",
      "Ampul nasıl çalışır?",
      "Pil nedir ve nasıl çalışır?",
      "Anahtar nedir ve ne işe yarar?",
      "Seri bağlama nedir?",
      "Paralel bağlama nedir?",
      "Elektrik enerjisinin tasarruflu kullanımı nasıl olur?",
      "Elektrik çarpması ve güvenlik önlemleri nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Isı ve Sıcaklık (Heat and Temperature)
  if (unitTitle === "Isı ve Sıcaklık") {
    const questions = [
      "Isı nedir?",
      "Sıcaklık nedir?",
      "Isı ve sıcaklık arasındaki fark nedir?",
      "Termometre nedir?",
      "Isı alışverişi nasıl gerçekleşir?",
      "Isı yalıtımı nedir?",
      "Genleşme nedir?",
      "Sıcaklık birimleri nelerdir?",
      "Enerji tasarrufu için neler yapılabilir?",
      "Mevsimler neden oluşur?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Mıknatıs ve Etkileri (Magnets and Their Effects)
  if (unitTitle === "Mıknatıs ve Etkileri") {
    const questions = [
      "Mıknatıs nedir?",
      "Mıknatısların özellikleri nelerdir?",
      "Mıknatısların kutupları nelerdir?",
      "Mıknatısların birbirini çekmesi ve itmesi nasıl olur?",
      "Hangi maddeler mıknatıs tarafından çekilir?",
      "Pusula nasıl çalışır?",
      "Manyetik alan nedir?",
      "Dünyanın manyetik alanı nedir?",
      "Elektromıknatıs nedir?",
      "Mıknatısların günlük hayatta kullanım alanları nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Basit Makineler (Simple Machines)
  if (unitTitle === "Basit Makineler") {
    const questions = [
      "Basit makine nedir?",
      "Kaldıraç nedir?",
      "Eğik düzlem nedir?",
      "Makara nedir?",
      "Çıkrık nedir?",
      "Vida nedir?",
      "Tekerlek nedir?",
      "Basit makineler işi nasıl kolaylaştırır?",
      "Günlük hayatta kullandığımız basit makineler nelerdir?",
      "Basit makinelerin avantajları ve dezavantajları nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Dünya ve Uzay (Earth and Space)
  if (unitTitle === "Dünya ve Uzay") {
    const questions = [
      "Güneş sistemi nedir?",
      "Gezegenler nelerdir?",
      "Dünya'nın yapısı nasıldır?",
      "Ay'ın özellikleri nelerdir?",
      "Gece ve gündüz nasıl oluşur?",
      "Mevsimler nasıl oluşur?",
      "Ay'ın evreleri nelerdir?",
      "Yıldızlar nedir?",
      "Uzay araştırmaları neden önemlidir?",
      "Astronominin tarihsel gelişimi nasıl olmuştur?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Enerji Dönüşümleri (Energy Transformations)
  if (unitTitle === "Enerji Dönüşümleri") {
    const questions = [
      "Enerji nedir?",
      "Enerji çeşitleri nelerdir?",
      "Potansiyel enerji nedir?",
      "Kinetik enerji nedir?",
      "Enerji dönüşümü nedir?",
      "Yenilenebilir enerji kaynakları nelerdir?",
      "Yenilenemeyen enerji kaynakları nelerdir?",
      "Enerji tasarrufu neden önemlidir?",
      "Güneş enerjisi nasıl kullanılır?",
      "Rüzgar enerjisi nasıl elde edilir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Ölçme ve Birimler (Measurement and Units)
  if (unitTitle === "Ölçme ve Birimler") {
    const questions = [
      "Ölçme nedir?",
      "Temel fiziksel büyüklükler nelerdir?",
      "Uzunluk birimleri nelerdir?",
      "Kütle birimleri nelerdir?",
      "Zaman birimleri nelerdir?",
      "Sıcaklık birimleri nelerdir?",
      "Ölçü aletleri nelerdir?",
      "Ölçme yaparken dikkat edilmesi gereken noktalar nelerdir?",
      "Uluslararası birim sistemi (SI) nedir?",
      "Birim dönüşümleri nasıl yapılır?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Default question for other units
  return `${unitTitle} - Soru ${challengeOrder}: Bu soruyu cevaplayın.`;
};

// Function to generate options based on unit, lesson, and challenge
const getOption = (unitTitle: string, lessonOrder: number, challengeOrder: number, optionOrder: number): string => {
  // Options for Kuvvet ve Hareket (Force and Motion)
  if (unitTitle === "Kuvvet ve Hareket") {
    if (challengeOrder === 1) { // Kuvvet nedir?
      const options = [
        "Sadece ağırlık anlamına gelir",
        "Cisimleri hareket ettiren, durduran ya da şeklini değiştiren etkidir",
        "Sadece hızlı giden cisimlerde bulunur",
        "Sadece insanların uygulayabildiği bir etkidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Hareket nedir?
      const options = [
        "Cisimlerin sadece yer değiştirmesidir",
        "Sadece canlıların yapabildiği bir eylemdir",
        "Cisimlerin konumunda meydana gelen değişimdir",
        "Sadece hızlı giden cisimlere özgüdür"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Kuvvet neleri değiştirebilir?
      const options = [
        "Sadece cisimlerin şeklini değiştirebilir",
        "Sadece cisimlerin hızını değiştirebilir",
        "Cisimlerin şeklini, hızını ve yönünü değiştirebilir",
        "Sadece cisimlerin rengini değiştirebilir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Sürtünme kuvveti nedir?
      const options = [
        "Cisimleri hızlandıran kuvvettir",
        "Temas halindeki yüzeyler arasında harekete karşı oluşan dirençtir",
        "Cisimleri havaya kaldıran kuvvettir",
        "Cisimleri şekil değiştiren kuvvettir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Yer çekimi kuvveti nedir?
      const options = [
        "Dünya'nın cisimleri kendine doğru çekme kuvvetidir",
        "Cisimleri iten kuvvettir",
        "Sadece ağır cisimlere etki eden kuvvettir",
        "Sadece uzayda etkili olan kuvvettir"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Işık ve Ses (Light and Sound)
  if (unitTitle === "Işık ve Ses") {
    if (challengeOrder === 1) { // Işık nedir?
      const options = [
        "Elektromanyetik bir dalgadır",
        "Mekanik bir dalgadır",
        "Sadece gözle görülebilen bir maddedir",
        "Sadece sıcak cisimlerin yaydığı bir maddedir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Işık nasıl yayılır?
      const options = [
        "Doğrusal yollarla yayılır",
        "Zigzag çizerek yayılır",
        "Sadece su içinde yayılır",
        "Sadece havada yayılır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Ses nedir?
      const options = [
        "Titreşen bir cismin oluşturduğu mekanik dalgadır",
        "Elektromanyetik bir dalgadır",
        "Sadece insanların duyabildiği bir enerjidir",
        "Sadece havada yayılan bir enerjidir"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Madde ve Değişim (Matter and Change)
  if (unitTitle === "Madde ve Değişim") {
    if (challengeOrder === 1) { // Madde nedir?
      const options = [
        "Kütle ve hacmi olan her şeydir",
        "Sadece katı halde bulunan her şeydir",
        "Sadece gözle görülebilen her şeydir",
        "Sadece dokunulabilen her şeydir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Maddenin halleri nelerdir?
      const options = [
        "Katı, sıvı, gaz",
        "Sıcak, ılık, soğuk",
        "Büyük, orta, küçük",
        "Ağır, hafif, orta"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Hal değişimi nedir?
      const options = [
        "Maddenin bir halden başka bir hale geçmesidir",
        "Maddenin renginin değişmesidir",
        "Maddenin şeklinin değişmesidir",
        "Maddenin kokusunun değişmesidir"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Elektrik (Electricity)
  if (unitTitle === "Elektrik") {
    if (challengeOrder === 1) { // Elektrik nedir?
      const options = [
        "Elektronların hareketinden kaynaklanan bir enerji türüdür",
        "Sadece pillerde bulunan bir maddedir",
        "Sadece kablolarda bulunan bir maddedir",
        "Sadece ampullerde bulunan bir maddedir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Elektrik devresi nedir?
      const options = [
        "Elektrik akımının dolaştığı kapalı bir yoldur",
        "Sadece ampullerden oluşan bir sistemdir",
        "Sadece pillerden oluşan bir sistemdir",
        "Sadece kablolardan oluşan bir sistemdir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // İletken ve yalıtkan maddeler nelerdir?
      const options = [
        "İletkenler elektriği ileten, yalıtkanlar iletmeyen maddelerdir",
        "İletkenler sadece metaller, yalıtkanlar sadece plastiklerdir",
        "İletkenler sıcak, yalıtkanlar soğuk maddelerdir",
        "İletkenler katı, yalıtkanlar sıvı maddelerdir"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Dünya ve Evren (Earth and Universe)
  if (unitTitle === "Dünya ve Uzay") {
    if (challengeOrder === 1) { // Dünya'nın şekli nasıldır?
      const options = [
        "Dünya geoid şeklindedir (kutuplardan basık, ekvatordan şişkin)",
        "Dünya tam bir küre şeklindedir",
        "Dünya düz bir disk şeklindedir",
        "Dünya kare şeklindedir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Dünya'nın hareketleri nelerdir?
      const options = [
        "Dünya'nın dönme ve dolanma hareketleri vardır",
        "Dünya sadece dönme hareketi yapar",
        "Dünya sadece dolanma hareketi yapar",
        "Dünya hiç hareket etmez"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Güneş sistemi nedir?
      const options = [
        "Güneş ve onun etrafında dolanan gök cisimlerinin oluşturduğu sistemdir",
        "Sadece Güneş ve Dünya'dan oluşan sistemdir",
        "Sadece gezegenlerden oluşan sistemdir",
        "Sadece yıldızlardan oluşan sistemdir"
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