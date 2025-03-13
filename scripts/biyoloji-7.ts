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
    console.log("Creating Biyoloji (Biology) course for 7th grade");

    // Insert the course
    const [course] = await db
      .insert(schema.courses)
      .values({ title: "Biyoloji 7. Sınıf", imageSrc: "/biyoloji-7.svg" })
      .returning();

    // Unit names for 7th grade Biology in Turkish curriculum
    const unitNames = [
      { title: "Hücre ve Bölünmeler", description: "Hücre yapısı ve bölünme türleri" },
      { title: "Canlılarda Üreme", description: "Üreme çeşitleri ve özellikleri" },
      { title: "Kalıtım", description: "Genetik ve kalıtım özellikleri" },
      { title: "İnsan ve Çevre İlişkileri", description: "Çevre sorunları ve insan etkisi" },
      { title: "Ekosistemler", description: "Ekosistem çeşitleri ve özellikleri" },
      { title: "Biyoçeşitlilik", description: "Biyolojik çeşitlilik ve korunması" },
      { title: "Sinir Sistemi", description: "Sinir sisteminin yapısı ve işleyişi" },
      { title: "Duyu Organları", description: "Duyu organlarının yapısı ve işleyişi" },
      { title: "Dolaşım Sistemi", description: "Kan dolaşımı ve kan grupları" },
      { title: "Solunum Sistemi", description: "Solunum organları ve işleyişi" }
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
        `${unitNames[i].title} - Yapısal Özellikler`,
        `${unitNames[i].title} - İşlevsel Özellikler`,
        `${unitNames[i].title} - Sağlık İlişkisi`,
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

    console.log("7th grade Biyoloji course created successfully.");
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
  // For "Hücre ve Bölünmeler" unit (Cell and Division)
  if (unitTitle === "Hücre ve Bölünmeler") {
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
  
  // For "Canlılarda Üreme" unit (Reproduction in Living Things)
  else if (unitTitle === "Canlılarda Üreme") {
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
  
  // For "Kalıtım" unit (Heredity)
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
  // Questions for Hücre ve Bölünmeler (Cell and Division)
  if (unitTitle === "Hücre ve Bölünmeler") {
    const questions = [
      "Hücre nedir?",
      "Prokaryot ve ökaryot hücre arasındaki fark nedir?",
      "Hücre zarının görevi nedir?",
      "Ribozomların görevi nedir?",
      "Mitokondrilerin görevi nedir?",
      "Mitoz bölünme nedir?",
      "Mayoz bölünme nedir?",
      "Bitki ve hayvan hücresi arasındaki farklar nelerdir?",
      "DNA nedir?",
      "RNA nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Canlılarda Üreme (Reproduction in Living Things)
  if (unitTitle === "Canlılarda Üreme") {
    const questions = [
      "Üreme nedir?",
      "Eşeyli üreme nedir?",
      "Eşeysiz üreme nedir?",
      "Tomurcuklanma nedir?",
      "Rejenerasyon nedir?",
      "Vejetatif üreme nedir?",
      "Partenogenez nedir?",
      "İnsanda üreme sistemi hangi organlardan oluşur?",
      "Döllenme nedir?",
      "Başkalaşım (metamorfoz) nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Kalıtım (Heredity)
  if (unitTitle === "Kalıtım") {
    const questions = [
      "Kalıtım nedir?",
      "Gen nedir?",
      "Kromozom nedir?",
      "Genotip ve fenotip arasındaki fark nedir?",
      "Dominant ve resesif gen nedir?",
      "Mendel'in kalıtım kuralları nelerdir?",
      "Bezelyelerin tohum şeklinin kalıtımı nasıl gerçekleşir?",
      "Kan gruplarının kalıtımı nasıl gerçekleşir?",
      "Mutasyon nedir?",
      "Modifikasyon nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for İnsan ve Çevre İlişkileri (Human-Environment Relations)
  if (unitTitle === "İnsan ve Çevre İlişkileri") {
    const questions = [
      "Çevre kirliliği nedir?",
      "Hava kirliliğine neden olan faktörler nelerdir?",
      "Su kirliliğine neden olan faktörler nelerdir?",
      "Toprak kirliliğine neden olan faktörler nelerdir?",
      "Küresel ısınma nedir?",
      "Sera etkisi nedir?",
      "Asit yağmurları nasıl oluşur?",
      "Ozon tabakasının incelmesinin nedenleri nelerdir?",
      "Geri dönüşümün önemi nedir?",
      "Sürdürülebilirlik nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Ekosistemler (Ecosystems)
  if (unitTitle === "Ekosistemler") {
    const questions = [
      "Ekosistem nedir?",
      "Biyotik ve abiyotik faktörler nelerdir?",
      "Besin zinciri nedir?",
      "Besin ağı nedir?",
      "Üretici organizmalar hangileridir?",
      "Tüketici organizmalar hangileridir?",
      "Ayrıştırıcı organizmalar hangileridir?",
      "Karasal ekosistemler hangileridir?",
      "Sucul ekosistemler hangileridir?",
      "Ekolojik niş nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Biyoçeşitlilik (Biodiversity)
  if (unitTitle === "Biyoçeşitlilik") {
    const questions = [
      "Biyoçeşitlilik nedir?",
      "Tür çeşitliliği nedir?",
      "Genetik çeşitlilik nedir?",
      "Ekosistem çeşitliliği nedir?",
      "Endemik tür nedir?",
      "Nesli tükenen türler hangileridir?",
      "Nesli tükenme tehlikesinde olan türler hangileridir?",
      "Biyoçeşitliliği tehdit eden faktörler nelerdir?",
      "Biyoçeşitliliğin korunması neden önemlidir?",
      "Biyoçeşitliliği korumak için neler yapılabilir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Sinir Sistemi (Nervous System)
  if (unitTitle === "Sinir Sistemi") {
    const questions = [
      "Sinir sistemi nedir?",
      "Merkezi sinir sistemi hangi yapılardan oluşur?",
      "Çevresel sinir sistemi hangi yapılardan oluşur?",
      "Nöron nedir?",
      "Refleks nedir?",
      "Beynin bölümleri nelerdir?",
      "Omurilik nedir ve görevi nedir?",
      "Sinaps nedir?",
      "Uyarıcılar ve alıcılar nelerdir?",
      "Sinir sistemini etkileyen hastalıklar nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Duyu Organları (Sense Organs)
  if (unitTitle === "Duyu Organları") {
    const questions = [
      "Duyu organları hangileridir?",
      "Gözün yapısı nasıldır?",
      "Kulağın yapısı nasıldır?",
      "Burnun yapısı nasıldır?",
      "Dilin yapısı nasıldır?",
      "Derinin yapısı nasıldır?",
      "Görme olayı nasıl gerçekleşir?",
      "İşitme olayı nasıl gerçekleşir?",
      "Koku alma nasıl gerçekleşir?",
      "Tat alma nasıl gerçekleşir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Dolaşım Sistemi (Circulatory System)
  if (unitTitle === "Dolaşım Sistemi") {
    const questions = [
      "Dolaşım sistemi nedir?",
      "Kan nedir ve görevleri nelerdir?",
      "Kalbin yapısı nasıldır?",
      "Kan damarları nelerdir?",
      "Kan grupları hangileridir?",
      "Kan dolaşımı nasıl gerçekleşir?",
      "Lenf sistemi nedir?",
      "Alyuvar nedir ve görevi nedir?",
      "Akyuvar nedir ve görevi nedir?",
      "Dolaşım sistemini etkileyen hastalıklar nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Solunum Sistemi (Respiratory System)
  if (unitTitle === "Solunum Sistemi") {
    const questions = [
      "Solunum sistemi nedir?",
      "Solunum organları hangileridir?",
      "Akciğerlerin yapısı nasıldır?",
      "Soluk alıp verme mekanizması nasıl çalışır?",
      "Gaz alışverişi nasıl gerçekleşir?",
      "Hücresel solunum nedir?",
      "Soluk alırken diyafram ne yapar?",
      "Soluk borusu nedir ve ne işe yarar?",
      "Alveol nedir ve ne işe yarar?",
      "Solunum sistemini etkileyen hastalıklar nelerdir?"
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
    if (challengeOrder === 4) { // Ribozomların görevi nedir?
      const options = [
        "Enerji üretmek",
        "Besin depolamak",
        "Protein sentezlemek",
        "Hücre bölünmesini sağlamak"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Mitokondrilerin görevi nedir?
      const options = [
        "Protein sentezlemek",
        "Hücresel solunum ile enerji üretmek",
        "Hücre içi sindirimi gerçekleştirmek",
        "Hücre bölünmesini kontrol etmek"
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
    if (challengeOrder === 4) { // Tomurcuklanma nedir?
      const options = [
        "Dişi ve erkek üreme hücrelerinin birleşmesi ile gerçekleşen üremedir",
        "Ana canlının vücudunda oluşan bir çıkıntının gelişerek yeni bir canlı oluşturmasıdır",
        "Sadece omurgalı hayvanlarda görülen bir üreme şeklidir",
        "Sadece bitkilerde görülen bir üreme şeklidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Rejenerasyon nedir?
      const options = [
        "Dişi ve erkek üreme hücrelerinin birleşmesiyle gerçekleşen üremedir",
        "Vücudun kopan parçasının kendini yenilemesidir",
        "Vücudun bir parçasından yeni bir canlı oluşmasıdır",
        "Sporla üremedir"
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
    if (challengeOrder === 4) { // Genotip ve fenotip arasındaki fark nedir?
      const options = [
        "Genotip dış görünüştür, fenotip genetik yapıdır",
        "Genotip sadece anneden, fenotip sadece babadan gelir",
        "Genotip canlının fiziksel özellikleridir, fenotip davranışlarıdır",
        "Genotip canlının genetik yapısıdır, fenotip dış görünüşüdür"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Dominant ve resesif gen nedir?
      const options = [
        "Dominant gen etkisini her zaman gösteren gen, resesif gen ise etkisini ancak homozigot durumda gösterebilen gendir",
        "Dominant gen sadece anneden, resesif gen sadece babadan gelir",
        "Dominant gen hastalık yapan, resesif gen sağlıklı olandır",
        "Dominant gen erkeklerde, resesif gen dişilerde bulunur"
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
  
  // Meaningful options for other biology questions
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