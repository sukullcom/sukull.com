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
    console.log("Creating Kimya (Chemistry) course for 6th grade");

    // Insert the course
    const [course] = await db
      .insert(schema.courses)
      .values({ title: "Kimya 6. Sınıf", imageSrc: "/kimya-6.svg" })
      .returning();

    // Unit names for 6th grade Chemistry in Turkish curriculum
    const unitNames = [
      { title: "Maddenin Tanecikli Yapısı", description: "Atom, element, molekül kavramları" },
      { title: "Maddenin Halleri", description: "Katı, sıvı, gaz halleri ve özellikleri" },
      { title: "Madde ve Isı", description: "Maddelerin ısı ile etkileşimi" },
      { title: "Saf Maddeler ve Karışımlar", description: "Saf madde ve karışımların özellikleri ve ayrılması" },
      { title: "Çözünme ve Çözeltiler", description: "Çözünme süreci ve çözelti türleri" },
      { title: "Asitler ve Bazlar", description: "Asit ve bazların özellikleri ve kullanımları" },
      { title: "Kimyasal Değişimler", description: "Kimyasal tepkimeler ve özellikleri" },
      { title: "Elementler ve Bileşikler", description: "Element ve bileşiklerin yapısı ve özellikleri" },
      { title: "Günlük Hayatta Kimya", description: "Günlük hayatta karşılaştığımız kimyasal maddeler" },
      { title: "Çevre Kimyası", description: "Çevre sorunları ve kimyasal çözümler" }
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
        `${unitNames[i].title} - Günlük Hayatta Uygulamaları`,
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

    console.log("6th grade Kimya course created successfully.");
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
    if (challengeOrder === 1 && optionOrder === 1) return true; // Atom nedir?
    if (challengeOrder === 2 && optionOrder === 3) return true; // Element nedir?
    if (challengeOrder === 3 && optionOrder === 2) return true; // Molekül nedir?
    if (challengeOrder === 4 && optionOrder === 4) return true; // Atomun yapısında bulunan temel parçacıklar
    if (challengeOrder === 5 && optionOrder === 1) return true; // Atom numarası neyi ifade eder?
    if (challengeOrder === 6 && optionOrder === 2) return true; // Kütle numarası neyi ifade eder?
    if (challengeOrder === 7 && optionOrder === 3) return true; // İzotop atomlar
    if (challengeOrder === 8 && optionOrder === 1) return true; // Atomun çapı
    if (challengeOrder === 9 && optionOrder === 4) return true; // Elektronların bulunduğu yer
    if (challengeOrder === 10 && optionOrder === 2) return true; // Atom ve molekül arasındaki fark
  }
  
  // For "Maddenin Halleri" unit (States of Matter)
  else if (unitTitle === "Maddenin Halleri") {
    if (challengeOrder === 1 && optionOrder === 2) return true; // Maddenin halleri
    if (challengeOrder === 2 && optionOrder === 4) return true; // Katı maddelerin özellikleri
    if (challengeOrder === 3 && optionOrder === 1) return true; // Sıvı maddelerin özellikleri
    if (challengeOrder === 4 && optionOrder === 3) return true; // Gaz maddelerin özellikleri
    if (challengeOrder === 5 && optionOrder === 2) return true; // Hal değişim sıcaklıkları
    if (challengeOrder === 6 && optionOrder === 1) return true; // Erime
    if (challengeOrder === 7 && optionOrder === 4) return true; // Buharlaşma
    if (challengeOrder === 8 && optionOrder === 3) return true; // Yoğuşma
    if (challengeOrder === 9 && optionOrder === 2) return true; // Donma
    if (challengeOrder === 10 && optionOrder === 1) return true; // Süblimleşme
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
      "Atom nedir?",
      "Element nedir?",
      "Molekül nedir?",
      "Atomun yapısında bulunan temel parçacıklar nelerdir?",
      "Atom numarası neyi ifade eder?",
      "Kütle numarası neyi ifade eder?",
      "İzotop atomlar ne demektir?",
      "Bir atomun çapı yaklaşık olarak kaç metredir?",
      "Elektronlar atomun neresinde bulunur?",
      "Atom ve molekül arasındaki temel fark nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Maddenin Halleri (States of Matter)
  if (unitTitle === "Maddenin Halleri") {
    const questions = [
      "Maddenin kaç hali vardır?",
      "Maddenin halleri nelerdir?",
      "Katı maddelerin temel özellikleri nelerdir?",
      "Sıvı maddelerin temel özellikleri nelerdir?",
      "Gaz maddelerin temel özellikleri nelerdir?",
      "Hal değişim sıcaklıkları nelerdir?",
      "Erime nedir?",
      "Buharlaşma nedir?",
      "Yoğuşma nedir?",
      "Donma nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Madde ve Isı (Matter and Heat)
  if (unitTitle === "Madde ve Isı") {
    const questions = [
      "Isı nedir?",
      "Sıcaklık nedir?",
      "Isı ve sıcaklık arasındaki fark nedir?",
      "Isının birimi nedir?",
      "Sıcaklığın birimi nedir?",
      "Öz ısı nedir?",
      "Isı alışverişi nasıl gerçekleşir?",
      "Erime ısısı nedir?",
      "Buharlaşma ısısı nedir?",
      "Donma ısısı nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Saf Maddeler ve Karışımlar (Pure Substances and Mixtures)
  if (unitTitle === "Saf Maddeler ve Karışımlar") {
    const questions = [
      "Saf madde nedir?",
      "Karışım nedir?",
      "Element ve bileşik arasındaki fark nedir?",
      "Homojen karışım nedir?",
      "Heterojen karışım nedir?",
      "Çözelti nedir?",
      "Süspansiyon nedir?",
      "Emülsiyon nedir?",
      "Alaşım nedir?",
      "Karışımların ayrılma yöntemleri nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Çözünme ve Çözeltiler (Dissolution and Solutions)
  if (unitTitle === "Çözünme ve Çözeltiler") {
    const questions = [
      "Çözünme nedir?",
      "Çözelti nedir?",
      "Çözücü nedir?",
      "Çözünen nedir?",
      "Seyreltik çözelti nedir?",
      "Derişik çözelti nedir?",
      "Doymuş çözelti nedir?",
      "Doymamış çözelti nedir?",
      "Aşırı doymuş çözelti nedir?",
      "Çözünürlüğü etkileyen faktörler nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Asitler ve Bazlar (Acids and Bases)
  if (unitTitle === "Asitler ve Bazlar") {
    const questions = [
      "Asit nedir?",
      "Baz nedir?",
      "Asitlerin genel özellikleri nelerdir?",
      "Bazların genel özellikleri nelerdir?",
      "pH skalası nedir?",
      "pH değeri 7'den küçük olan çözeltiler için ne söylenebilir?",
      "pH değeri 7'den büyük olan çözeltiler için ne söylenebilir?",
      "Turnusol kağıdı nedir?",
      "Günlük hayatta kullanılan asitlere örnekler veriniz.",
      "Günlük hayatta kullanılan bazlara örnekler veriniz."
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Kimyasal Değişimler (Chemical Changes)
  if (unitTitle === "Kimyasal Değişimler") {
    const questions = [
      "Fiziksel değişim nedir?",
      "Kimyasal değişim nedir?",
      "Kimyasal tepkimeler nelerdir?",
      "Kimyasal tepkimelerde kütlenin korunumu ne demektir?",
      "Yanma tepkimesi nedir?",
      "Asit-baz tepkimesi nedir?",
      "Çözünme-çökelme tepkimesi nedir?",
      "Kimyasal değişimlerde enerji değişimi nasıl olur?",
      "Ekzotermik tepkime nedir?",
      "Endotermik tepkime nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Elementler ve Bileşikler (Elements and Compounds)
  if (unitTitle === "Elementler ve Bileşikler") {
    const questions = [
      "Element nedir?",
      "Bileşik nedir?",
      "Element ve bileşik arasındaki farklar nelerdir?",
      "Metal elementlerin özellikleri nelerdir?",
      "Ametal elementlerin özellikleri nelerdir?",
      "Yarı metal elementlerin özellikleri nelerdir?",
      "Periyodik tablo nedir?",
      "Periyodik tabloda elementler nasıl sınıflandırılmıştır?",
      "İyonik bileşik nedir?",
      "Kovalent bileşik nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Günlük Hayatta Kimya (Chemistry in Daily Life)
  if (unitTitle === "Günlük Hayatta Kimya") {
    const questions = [
      "Temizlik maddeleri nasıl çalışır?",
      "Sabun nasıl temizler?",
      "Deterjanlar nasıl çalışır?",
      "Gıdalarda kullanılan katkı maddeleri nelerdir?",
      "İlaçlar nasıl etki eder?",
      "Boyalar nasıl yapılır?",
      "Gübreler nasıl çalışır?",
      "Plastikler neden yapılır?",
      "Kozmetik ürünlerde hangi kimyasallar bulunur?",
      "Yakıtlar nasıl enerji üretir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Çevre Kimyası (Environmental Chemistry)
  if (unitTitle === "Çevre Kimyası") {
    const questions = [
      "Hava kirliliği nedir?",
      "Su kirliliği nedir?",
      "Toprak kirliliği nedir?",
      "Sera etkisi nedir?",
      "Asit yağmurları nasıl oluşur?",
      "Ozon tabakasının incelmesi ne demektir?",
      "Küresel ısınma nedir?",
      "Atık yönetimi nedir?",
      "Geri dönüşüm neden önemlidir?",
      "Yenilenebilir enerji kaynakları nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Default question for other units
  return `${unitTitle} - Soru ${challengeOrder}: Bu soruyu cevaplayın.`;
};

// Function to generate options based on unit, lesson, and challenge
const getOption = (unitTitle: string, lessonOrder: number, challengeOrder: number, optionOrder: number): string => {
  // Options for Maddenin Tanecikli Yapısı (Particulate Structure of Matter)
  if (unitTitle === "Maddenin Tanecikli Yapısı") {
    if (challengeOrder === 1) { // Atom nedir?
      const options = [
        "Maddenin en küçük yapı taşıdır",
        "Sadece canlılarda bulunan yapıdır",
        "Sadece metallerde bulunan yapıdır",
        "Sadece gazlarda bulunan yapıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Atomun yapısı nasıldır?
      const options = [
        "Sadece elektronlardan oluşur",
        "Çekirdek (proton ve nötron) ve çekirdeğin etrafında dönen elektronlardan oluşur",
        "Sadece protonlardan oluşur",
        "Sadece nötronlardan oluşur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Molekül nedir?
      const options = [
        "Sadece metallerde bulunan yapıdır",
        "İki veya daha fazla atomun bir araya gelerek oluşturduğu yapıdır",
        "Sadece gazlarda bulunan yapıdır",
        "Sadece sıvılarda bulunan yapıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Atomun temel parçacıkları
      const options = [
        "Sadece elektronlardan oluşur",
        "Çekirdek (proton ve nötron) ve çekirdeğin etrafında dönen elektronlardan oluşur",
        "Sadece protonlardan oluşur",
        "Sadece nötronlardan oluşur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Atom numarası
      const options = [
        "Atomun çekirdeğindeki proton sayısını",
        "Atomun çekirdeğindeki nötron sayısını",
        "Atomun çekirdeğindeki proton ve nötronların toplamını",
        "Atomdaki elektronların sayısını"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // Kütle numarası
      const options = [
        "Atomun çekirdeğindeki proton sayısını",
        "Atomun çekirdeğindeki proton ve nötronların toplamını",
        "Atomun çekirdeğindeki nötron sayısını",
        "Atomun kütlesini gram cinsinden ifade eder"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // İzotop atomlar
      const options = [
        "Proton sayıları farklı, nötron sayıları aynı olan atomlar",
        "Proton ve nötron sayıları farklı olan atomlar",
        "Proton sayıları aynı, nötron sayıları farklı olan atomlar",
        "Elektron sayıları farklı olan atomlar"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // Atomun çapı
      const options = [
        "10^-10 metre civarında",
        "10^-5 metre civarında",
        "10^-15 metre civarında",
        "10^-3 metre civarında"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // Elektronların yeri
      const options = [
        "Sadece çekirdekte",
        "Sadece çekirdeğin etrafında",
        "Atomun her yerinde eşit olarak",
        "Çekirdeğin etrafındaki katmanlarda (enerji seviyelerinde)"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // Atom ve molekül farkı
      const options = [
        "Atom daha büyüktür, molekül daha küçüktür",
        "Molekül iki veya daha fazla atomun bir araya gelmesiyle oluşur",
        "Atom birleşiktir, molekül saf maddedir",
        "Atom ve molekül aynı kavramlardır"
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
    if (challengeOrder === 2) { // Katı maddelerin özellikleri nelerdir?
      const options = [
        "Belirli şekil ve hacimleri vardır, sıkıştırılamazlar",
        "Belirli şekilleri yoktur, belirli hacimleri vardır",
        "Belirli şekil ve hacimleri yoktur",
        "Sadece belirli şekilleri vardır, hacimleri değişkendir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Sıvı maddelerin özellikleri nelerdir?
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
        "Belirli bir şekilleri vardır, hacimleri yoktur",
        "Belirli bir şekil ve hacimleri yoktur",
        "Belirli bir hacimleri vardır, şekilleri yoktur",
        "Belirli bir şekil ve hacimleri vardır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Hal değişim sıcaklıkları
      const options = [
        "Erime sıcaklığı ve kaynama sıcaklığı",
        "Donma sıcaklığı ve buharlaşma sıcaklığı",
        "Erime noktası ve donma noktası",
        "Oda sıcaklığı ve vücut sıcaklığı"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // Erime
      const options = [
        "Katı halden sıvı hale geçiştir",
        "Sıvı halden gaz hale geçiştir",
        "Sıvı halden katı hale geçiştir",
        "Gaz halden sıvı hale geçiştir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // Buharlaşma
      const options = [
        "Katı halden gaz hale geçiştir",
        "Gaz halden sıvı hale geçiştir",
        "Sıvı halden katı hale geçiştir",
        "Sıvı halden gaz hale geçiştir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // Yoğuşma
      const options = [
        "Katı halden sıvı hale geçiştir",
        "Sıvı halden katı hale geçiştir",
        "Gaz halden sıvı hale geçiştir",
        "Sıvı halden gaz hale geçiştir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // Donma
      const options = [
        "Sıvı halden katı hale geçiştir",
        "Katı halden sıvı hale geçiştir",
        "Gaz halden sıvı hale geçiştir",
        "Sıvı halden gaz hale geçiştir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // Süblimleşme
      const options = [
        "Katı halden gaz hale geçiştir",
        "Gaz halden sıvı hale geçiştir",
        "Sıvı halden katı hale geçiştir",
        "Sıvı halden gaz hale geçiştir"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Madde ve Isı (Matter and Heat)
  if (unitTitle === "Madde ve Isı") {
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
  
  // Options for Saf Maddeler ve Karışımlar (Pure Substances and Mixtures)
  if (unitTitle === "Saf Maddeler ve Karışımlar") {
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
  }
  
  // Options for Çözünme ve Çözeltiler (Dissolution and Solutions)
  if (unitTitle === "Çözünme ve Çözeltiler") {
    if (challengeOrder === 1) { // Çözünme nedir?
      const options = [
        "Bir madde, çözücü içinde çözünme sürecidir",
        "Çözünme, çözücü ve çözünen arasındaki ısı alışverişidir",
        "Çözünme, çözücü ve çözünen arasındaki ısı alışverişi olmadan gerçekleşir",
        "Çözünme, çözücü ve çözünen arasındaki ısı alışverişi olmadan gerçekleşir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Çözelti nedir?
      const options = [
        "Çözücü ve çözünenin homojen bir karışımıdır",
        "Çözücü ve çözünenin heterojen bir karışımıdır",
        "Çözücü ve çözünenin birbiri içinde çözünmesidir",
        "Çözücü ve çözünenin birbiri içinde çözünmemesidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Çözücü nedir?
      const options = [
        "Çözücü, çözünenin çözünmesi için gerekli olan madde veya madde grubudur",
        "Çözücü, çözünenin çözünmemesi için gerekli olan madde veya madde grubudur",
        "Çözücü, çözünenin çözünmesi için gerekli olmayan madde veya madde grubudur",
        "Çözücü, çözünenin çözünmemesi için gerekli olmayan madde veya madde grubudur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Çözünen nedir?
      const options = [
        "Çözünen, çözücü içinde çözünen madde veya madde grubudur",
        "Çözünen, çözücü içinde çözünmeyen madde veya madde grubudur",
        "Çözünen, çözücü içinde çözünmeyen madde veya madde grubudur",
        "Çözünen, çözücü içinde çözünmeyen madde veya madde grubudur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Seyreltik çözelti nedir?
      const options = [
        "Çözücü ve çözünenin oranı 1:1 olan çözeltidir",
        "Çözücü ve çözünenin oranı 1:2 olan çözeltidir",
        "Çözücü ve çözünenin oranı 1:3 olan çözeltidir",
        "Çözücü ve çözünenin oranı 1:4 olan çözeltidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // Derişik çözelti nedir?
      const options = [
        "Çözücü ve çözünenin oranı 1:1 olan çözeltidir",
        "Çözücü ve çözünenin oranı 1:2 olan çözeltidir",
        "Çözücü ve çözünenin oranı 1:3 olan çözeltidir",
        "Çözücü ve çözünenin oranı 1:4 olan çözeltidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // Doymuş çözelti nedir?
      const options = [
        "Çözücü ve çözünenin oranı 1:1 olan çözeltidir",
        "Çözücü ve çözünenin oranı 1:2 olan çözeltidir",
        "Çözücü ve çözünenin oranı 1:3 olan çözeltidir",
        "Çözücü ve çözünenin oranı 1:4 olan çözeltidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // Doymamış çözelti nedir?
      const options = [
        "Çözücü ve çözünenin oranı 1:1 olan çözeltidir",
        "Çözücü ve çözünenin oranı 1:2 olan çözeltidir",
        "Çözücü ve çözünenin oranı 1:3 olan çözeltidir",
        "Çözücü ve çözünenin oranı 1:4 olan çözeltidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // Aşırı doymuş çözelti nedir?
      const options = [
        "Çözücü ve çözünenin oranı 1:1 olan çözeltidir",
        "Çözücü ve çözünenin oranı 1:2 olan çözeltidir",
        "Çözücü ve çözünenin oranı 1:3 olan çözeltidir",
        "Çözücü ve çözünenin oranı 1:4 olan çözeltidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // Çözünürlüğü etkileyen faktörler nelerdir?
      const options = [
        "Çözücü ve çözünenin cinsi, sıcaklık, basınç, çözücü ve çözünenin oranı",
        "Çözücü ve çözünenin cinsi, sıcaklık, basınç, çözücü ve çözünenin oranı",
        "Çözücü ve çözünenin cinsi, sıcaklık, basınç, çözücü ve çözünenin oranı",
        "Çözücü ve çözünenin cinsi, sıcaklık, basınç, çözücü ve çözünenin oranı"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Asitler ve Bazlar (Acids and Bases)
  if (unitTitle === "Asitler ve Bazlar") {
    if (challengeOrder === 1) { // Asit nedir?
      const options = [
        "Hidrojen iyonu (H+) veren maddelerdir",
        "Hidroksit iyonu (OH-) veren maddelerdir",
        "Elektron alan maddelerdir",
        "Elektron veren maddelerdir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Baz nedir?
      const options = [
        "Hidrojen iyonu (H+) veren maddelerdir",
        "Hidroksit iyonu (OH-) veren maddelerdir",
        "Elektron alan maddelerdir",
        "Elektron veren maddelerdir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // pH nedir?
      const options = [
        "Bir çözeltinin asitlik veya bazlık derecesini gösteren ölçektir",
        "Bir çözeltinin yoğunluğunu gösteren ölçektir",
        "Bir çözeltinin sıcaklığını gösteren ölçektir",
        "Bir çözeltinin basıncını gösteren ölçektir"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Karışımlar (Mixtures)
  if (unitTitle === "Karışımlar") {
    if (challengeOrder === 1) { // Homojen karışım nedir?
      const options = [
        "Bileşenleri her yerde aynı olan karışımdır",
        "Bileşenleri her yerde farklı olan karışımdır",
        "Sadece bir bileşenden oluşan karışımdır",
        "Bileşenleri gözle görülebilen karışımdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Heterojen karışım nedir?
      const options = [
        "Bileşenleri her yerde aynı olan karışımdır",
        "Bileşenleri her yerde farklı olan karışımdır",
        "Sadece bir bileşenden oluşan karışımdır",
        "Bileşenleri gözle görülebilen karışımdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Çözünürlük nedir?
      const options = [
        "Bir maddenin belirli bir çözücüde çözünme miktarıdır",
        "Bir maddenin belirli bir sıcaklıkta erime miktarıdır",
        "Bir maddenin belirli bir basınçta buharlaşma miktarıdır",
        "Bir maddenin belirli bir hacimde yoğunlaşma miktarıdır"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Kimyasal Tepkimeler (Chemical Reactions)
  if (unitTitle === "Kimyasal Tepkimeler") {
    if (challengeOrder === 1) { // Kimyasal tepkime nedir?
      const options = [
        "Maddelerin kimyasal özelliklerinin değiştiği olaydır",
        "Maddelerin fiziksel özelliklerinin değiştiği olaydır",
        "Maddelerin sadece şeklinin değiştiği olaydır",
        "Maddelerin sadece sıcaklığının değiştiği olaydır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Endotermik tepkime nedir?
      const options = [
        "Isı alarak gerçekleşen tepkimedir",
        "Isı vererek gerçekleşen tepkimedir",
        "Işık yayarak gerçekleşen tepkimedir",
        "Ses çıkararak gerçekleşen tepkimedir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Ekzotermik tepkime nedir?
      const options = [
        "Isı alarak gerçekleşen tepkimedir",
        "Isı vererek gerçekleşen tepkimedir",
        "Işık yayarak gerçekleşen tepkimedir",
        "Ses çıkararak gerçekleşen tepkimedir"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for other chemistry questions
  const chemistryOptions = [
    "Kimyasal bağlarla ilgili bir kavramdır",
    "Maddenin halleriyle ilgili bir kavramdır",
    "Çözünürlükle ilgili bir kavramdır",
    "Kimyasal tepkimelerle ilgili bir kavramdır"
  ];
  
  return chemistryOptions[optionOrder - 1];
};

main().catch((err) => {
  console.error(
    "An error occurred while attempting to seed the database:",
    err
  );
}); 