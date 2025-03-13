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
    console.log("Creating Kimya (Chemistry) course for 8th grade");

    // Insert the course
    const [course] = await db
      .insert(schema.courses)
      .values({ title: "Kimya 8. Sınıf", imageSrc: "/kimya-8.svg" })
      .returning();

    // Unit names for 8th grade Chemistry in Turkish curriculum
    const unitNames = [
      { title: "Periyodik Sistem", description: "Elementlerin sınıflandırılması" },
      { title: "Kimyasal Bağlar", description: "Atomlar arası bağlar ve özellikleri" },
      { title: "Asitler ve Bazlar", description: "Asit-baz tepkimeleri ve pH" },
      { title: "Maddenin Halleri", description: "Katı, sıvı, gaz halleri ve özellikleri" },
      { title: "Karışımlar", description: "Homojen ve heterojen karışımlar" },
      { title: "Kimyasal Tepkimeler", description: "Tepkime türleri ve denklemler" },
      { title: "Su Kimyası", description: "Suyun özellikleri ve reaksiyonları" },
      { title: "Elementler Kimyası", description: "Yaygın elementler ve özellikleri" },
      { title: "Organik Bileşikler", description: "Temel organik bileşik grupları" },
      { title: "Günlük Hayatta Kimya", description: "Kimyanın günlük uygulamaları" }
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
        `${unitNames[i].title} - Temel Özellikler`,
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

    console.log("8th grade Kimya course created successfully.");
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
  // For "Periyodik Sistem" unit (Periodic Table)
  if (unitTitle === "Periyodik Sistem") {
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
  
  // For "Kimyasal Bağlar" unit (Chemical Bonds)
  else if (unitTitle === "Kimyasal Bağlar") {
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
  
  // For "Asitler ve Bazlar" unit (Acids and Bases)
  else if (unitTitle === "Asitler ve Bazlar") {
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
  // Questions for Periyodik Sistem (Periodic Table)
  if (unitTitle === "Periyodik Sistem") {
    const questions = [
      "Periyodik tablo nedir?",
      "Periyodik tabloda elementler neye göre sıralanmıştır?",
      "Periyodik tabloda bir grup nedir?",
      "Periyodik tabloda bir periyot nedir?",
      "Metaller periyodik tablonun hangi bölgesinde bulunur?",
      "Ametaller periyodik tablonun hangi bölgesinde bulunur?",
      "Soygazlar periyodik tablonun hangi grubunda yer alır?",
      "Atom numarası nedir?",
      "Kütle numarası nedir?",
      "İzotop atomlar nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Kimyasal Bağlar (Chemical Bonds)
  if (unitTitle === "Kimyasal Bağlar") {
    const questions = [
      "Kimyasal bağ nedir?",
      "İyonik bağ nedir?",
      "Kovalent bağ nedir?",
      "Metalik bağ nedir?",
      "Apolar kovalent bağ nedir?",
      "Polar kovalent bağ nedir?",
      "Moleküller arası kuvvetler nelerdir?",
      "Hidrojen bağı nedir?",
      "Van der Waals kuvvetleri nedir?",
      "Elektron dizilişi ile kimyasal bağ arasındaki ilişki nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Asitler ve Bazlar (Acids and Bases)
  if (unitTitle === "Asitler ve Bazlar") {
    const questions = [
      "Asit nedir?",
      "Baz nedir?",
      "pH ölçeği nedir?",
      "Nötrleşme tepkimesi nedir?",
      "Kuvvetli asit nedir?",
      "Zayıf asit nedir?",
      "İndikatör nedir?",
      "Turnusol kağıdı nedir?",
      "pH metre nedir?",
      "Tampon çözeltiler nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Maddenin Halleri (States of Matter)
  if (unitTitle === "Maddenin Halleri") {
    const questions = [
      "Maddenin temel halleri nelerdir?",
      "Katı halde maddenin özellikleri nelerdir?",
      "Sıvı halde maddenin özellikleri nelerdir?",
      "Gaz halde maddenin özellikleri nelerdir?",
      "Plazma hali nedir?",
      "Erime ve donma arasındaki ilişki nedir?",
      "Buharlaşma ve yoğunlaşma arasındaki ilişki nedir?",
      "Süblimleşme nedir?",
      "Hal değişim grafikleri nasıl yorumlanır?",
      "Isı alışverişi ve hal değişimi arasındaki ilişki nedir?"
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
      "Süspansiyon nedir?",
      "Emülsiyon nedir?",
      "Koloid nedir?",
      "Karışımların ayrılması yöntemleri nelerdir?",
      "Damıtma (distilasyon) nedir?",
      "Kromatografi nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Kimyasal Tepkimeler (Chemical Reactions)
  if (unitTitle === "Kimyasal Tepkimeler") {
    const questions = [
      "Kimyasal tepkime nedir?",
      "Kimyasal tepkimelerde kütle korunumu nedir?",
      "Kimyasal denklemlerin denkleştirilmesi nasıl yapılır?",
      "Yanma tepkimesi nedir?",
      "Asit-baz tepkimesi nedir?",
      "Çözünme-çökelme tepkimesi nedir?",
      "Redoks tepkimesi nedir?",
      "Sentez tepkimesi nedir?",
      "Bozunma tepkimesi nedir?",
      "Tepkime hızını etkileyen faktörler nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Su Kimyası (Water Chemistry)
  if (unitTitle === "Su Kimyası") {
    const questions = [
      "Suyun moleküler yapısı nasıldır?",
      "Suyun fiziksel özellikleri nelerdir?",
      "Suyun kimyasal özellikleri nelerdir?",
      "Suyun çözücü özelliği neden kaynaklanır?",
      "Sert su ve yumuşak su nedir?",
      "Su arıtma yöntemleri nelerdir?",
      "İçme suyu standartları nelerdir?",
      "Suyun önemi nedir?",
      "Su kirliliği nedenleri nelerdir?",
      "Su döngüsü nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Elementler Kimyası (Chemistry of Elements)
  if (unitTitle === "Elementler Kimyası") {
    const questions = [
      "Hidrojen elementi nedir ve özellikleri nelerdir?",
      "Oksijen elementi nedir ve özellikleri nelerdir?",
      "Karbon elementi nedir ve özellikleri nelerdir?",
      "Azot elementi nedir ve özellikleri nelerdir?",
      "Alkali metaller nelerdir?",
      "Toprak alkali metaller nelerdir?",
      "Halojenler nelerdir?",
      "Soygazlar nelerdir?",
      "Geçiş metalleri nelerdir?",
      "Yarı metaller nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Organik Bileşikler (Organic Compounds)
  if (unitTitle === "Organik Bileşikler") {
    const questions = [
      "Organik bileşik nedir?",
      "Alkanlar nedir?",
      "Alkenler nedir?",
      "Alkinler nedir?",
      "Alkoller nedir?",
      "Karboksilli asitler nedir?",
      "Esterler nedir?",
      "Amino asitler nedir?",
      "Proteinler nedir?",
      "Karbonhidratlar nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Günlük Hayatta Kimya (Chemistry in Daily Life)
  if (unitTitle === "Günlük Hayatta Kimya") {
    const questions = [
      "Temizlik ürünlerinin kimyası nedir?",
      "Gıda katkı maddeleri nelerdir?",
      "İlaçların kimyasal özellikleri nelerdir?",
      "Kozmetik ürünlerin kimyasal özellikleri nelerdir?",
      "Yapı malzemelerinin kimyasal özellikleri nelerdir?",
      "Yakıtların kimyasal özellikleri nelerdir?",
      "Polimerlerin günlük hayattaki uygulamaları nelerdir?",
      "Boya ve pigmentlerin kimyasal özellikleri nelerdir?",
      "Tarım ilaçlarının kimyasal özellikleri nelerdir?",
      "Gıdaların bozulmasını önleyen kimyasal işlemler nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Default question for other units
  return `${unitTitle} ile ilgili soru ${challengeOrder}`;
};

// Function to generate options based on unit, lesson, and challenge
const getOption = (unitTitle: string, lessonOrder: number, challengeOrder: number, optionOrder: number): string => {
  // Options for Periyodik Sistem (Periodic Table)
  if (unitTitle === "Periyodik Sistem") {
    if (challengeOrder === 1) { // Periyodik tablo nedir?
      const options = [
        "Elementlerin rastgele yerleştirildiği bir tablodur",
        "Elementlerin kimyasal özelliklerine göre gruplandığı bir sistemdir",
        "Elementlerin artan atom numaralarına göre sıralandığı ve benzer özelliktekilerin aynı sütunlarda yer aldığı bir düzenlemedir",
        "Sadece metallerin bulunduğu bir tablodur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Periyodik tabloda elementler neye göre sıralanmıştır?
      const options = [
        "Atom numaralarına göre",
        "Atom kütlelerine göre",
        "Bulunma miktarlarına göre",
        "Keşfedilme tarihlerine göre"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Periyodik tabloda bir grup nedir?
      const options = [
        "Periyodik tablodaki her satırdır",
        "Periyodik tablodaki bir elementi ifade eder",
        "Periyodik tablodaki her kutucuktur",
        "Periyodik tabloda aynı düşey sütunda yer alan ve benzer kimyasal özellik gösteren elementlerdir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Periyodik tabloda bir periyot nedir?
      const options = [
        "Elementlerin keşfedildikleri dönemleri gösterir",
        "Periyodik tabloda soldan sağa doğru uzanan yatay sıralardır",
        "Periyodik tabloda farklı renklerde gösterilen bölgelerdir",
        "Sadece metal elementlerin bulunduğu kısımdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Metaller periyodik tablonun hangi bölgesinde bulunur?
      const options = [
        "Periyodik tablonun tamamında",
        "Periyodik tablonun sadece sağında",
        "Periyodik tablonun sol ve orta kısmında",
        "Periyodik tablonun sadece alt kısmında"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Kimyasal Bağlar (Chemical Bonds)
  if (unitTitle === "Kimyasal Bağlar") {
    if (challengeOrder === 1) { // Kimyasal bağ nedir?
      const options = [
        "Atomlar arasındaki fiziksel çekimdir",
        "Atomlar arasındaki elektron alışverişi veya paylaşımı sonucu oluşan çekim kuvvetidir",
        "Sadece metal atomları arasında oluşan bağdır",
        "Atomların birbirini itmesini sağlayan kuvvettir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // İyonik bağ nedir?
      const options = [
        "Aynı cins atomlar arasında oluşan bağdır",
        "Atom çekirdekleri arasındaki bağdır",
        "İki atom arasında elektron paylaşımı ile oluşan bağdır",
        "Bir atomdan diğerine elektron aktarımı sonucu oluşan bağdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Kovalent bağ nedir?
      const options = [
        "İki ametal atomu arasında elektron paylaşımı sonucu oluşan bağdır",
        "Sadece metaller arasında oluşan bağdır",
        "Elektron aktarımı sonucu oluşan bağdır",
        "Atomlar arasında ısı alışverişi sonucu oluşan bağdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Metalik bağ nedir?
      const options = [
        "Metaller ve ametaller arasında oluşan bağdır",
        "İki ametalin elektron paylaşımı sonucu oluşan bağdır",
        "Metal atomları arasında serbest elektronların oluşturduğu bağdır",
        "Atomlar arasında hiçbir etkileşim olmamasıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Apolar kovalent bağ nedir?
      const options = [
        "Bir metal ile bir ametal arasında oluşan bağdır",
        "Aynı tür atomlar veya elektronegatifliği aynı atomlar arasında oluşan, elektronların eşit paylaşıldığı bağdır",
        "Elektronların eşit paylaşılmadığı bağdır",
        "Suyun içindeki hidrojen ve oksijen arasındaki bağdır"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Asitler ve Bazlar (Acids and Bases)
  if (unitTitle === "Asitler ve Bazlar") {
    if (challengeOrder === 1) { // Asit nedir?
      const options = [
        "Suda çözündüğünde H⁺ (hidrojen iyonu) veren maddelerdir",
        "Suda çözündüğünde OH⁻ (hidroksit iyonu) veren maddelerdir",
        "pH değeri 7 olan maddelerdir",
        "Suda çözünmeyen maddelerdir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Baz nedir?
      const options = [
        "Suda çözündüğünde H⁺ (hidrojen iyonu) veren maddelerdir",
        "pH değeri 7 olan maddelerdir",
        "Suda çözündüğünde OH⁻ (hidroksit iyonu) veren maddelerdir",
        "Asitlerle tepkimeye girmeyen maddelerdir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // pH ölçeği nedir?
      const options = [
        "Asitlerin tadını ölçen bir birimdir",
        "Bir çözeltinin asitlik veya bazlık derecesini gösteren bir ölçektir",
        "Sıcaklığı ölçen bir birimdir",
        "Reaksiyon hızını ölçen bir birimdir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Nötrleşme tepkimesi nedir?
      const options = [
        "Asit ile asitin tepkimesidir",
        "Baz ile bazın tepkimesidir",
        "Metal ile suyun tepkimesidir",
        "Asit ile bazın tepkimesi sonucu tuz ve su oluşmasıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Kuvvetli asit nedir?
      const options = [
        "Suda tamamen iyonlaşan asitlerdir",
        "Suda çözünmeyen asitlerdir",
        "Suda kısmen iyonlaşan asitlerdir",
        "Bazlarla tepkime vermeyen asitlerdir"
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