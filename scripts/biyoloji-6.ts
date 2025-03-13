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
    console.log("Creating Biyoloji (Biology) course for 6th grade");

    // Insert the course
    const [course] = await db
      .insert(schema.courses)
      .values({ title: "Biyoloji 6. Sınıf", imageSrc: "/biyoloji-6.svg" })
      .returning();

    // Unit names for 6th grade Biology in Turkish curriculum
    const unitNames = [
      { title: "Canlılar ve Özellikleri", description: "Canlılık özellikleri ve canlıların temel yapısı" },
      { title: "Hücre", description: "Hücrenin yapısı ve çeşitleri" },
      { title: "Canlıların Sınıflandırılması", description: "Canlı grupları ve sınıflandırma kriterleri" },
      { title: "Bitki ve Hayvan Hücreleri", description: "Bitki ve hayvan hücrelerinin karşılaştırılması" },
      { title: "Mikroorganizmalar", description: "Bakteriler, virüsler ve diğer mikroskobik canlılar" },
      { title: "Bitkiler", description: "Bitkilerin yapısı, çeşitleri ve yaşam döngüleri" },
      { title: "Hayvanlar", description: "Hayvanların özellikleri ve sınıflandırılması" },
      { title: "İnsan Vücudu", description: "İnsan vücudundaki sistemler ve organlar" },
      { title: "Ekoloji", description: "Canlılar ve çevreleri arasındaki ilişkiler" },
      { title: "Biyolojik Çeşitlilik", description: "Biyolojik çeşitliliğin önemi ve korunması" }
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
        
        // Create challenges for each unit
        await createChallenges(lesson.id, unitNames[i].title, j + 1);
      }
    }

    console.log("6th grade Biyoloji course created successfully.");
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
  // For "Canlılar ve Özellikleri" unit (Living Things and Their Characteristics)
  if (unitTitle === "Canlılar ve Özellikleri") {
    if (challengeOrder === 1 && optionOrder === 3) return true; // Canlıların ortak özellikleri
    if (challengeOrder === 2 && optionOrder === 1) return true; // Canlı ve cansız ayrımı
    if (challengeOrder === 3 && optionOrder === 2) return true; // Büyüme ve gelişme
    if (challengeOrder === 4 && optionOrder === 4) return true; // Solunum
    if (challengeOrder === 5 && optionOrder === 2) return true; // Beslenme
    if (challengeOrder === 6 && optionOrder === 1) return true; // Boşaltım
    if (challengeOrder === 7 && optionOrder === 3) return true; // Hareket
    if (challengeOrder === 8 && optionOrder === 4) return true; // Uyarılara tepki
    if (challengeOrder === 9 && optionOrder === 2) return true; // Üreme
    if (challengeOrder === 10 && optionOrder === 1) return true; // Adaptasyon
  }
  
  // For "Hücre" unit (Cell)
  else if (unitTitle === "Hücre") {
    if (challengeOrder === 1 && optionOrder === 2) return true; // Hücre nedir?
    if (challengeOrder === 2 && optionOrder === 3) return true; // Hücre teorisi
    if (challengeOrder === 3 && optionOrder === 4) return true; // Hücre organelleri
    if (challengeOrder === 4 && optionOrder === 1) return true; // Hücre zarı
    if (challengeOrder === 5 && optionOrder === 2) return true; // Sitoplazma
    if (challengeOrder === 6 && optionOrder === 3) return true; // Çekirdek
    if (challengeOrder === 7 && optionOrder === 1) return true; // Mitokondri
    if (challengeOrder === 8 && optionOrder === 4) return true; // Endoplazmik retikulum
    if (challengeOrder === 9 && optionOrder === 2) return true; // Golgi aygıtı
    if (challengeOrder === 10 && optionOrder === 3) return true; // Lizozom
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
  // Questions for Canlılar ve Özellikleri (Living Things and Their Characteristics)
  if (unitTitle === "Canlılar ve Özellikleri") {
    const questions = [
      "Canlı nedir?",
      "Canlıların ortak özellikleri nelerdir?",
      "Canlı ve cansız varlıkları birbirinden nasıl ayırt ederiz?",
      "Büyüme ve gelişme arasındaki fark nedir?",
      "Solunum nedir?",
      "Beslenme nedir?",
      "Boşaltım nedir?",
      "Hareket nedir?",
      "Uyarılara tepki vermek ne demektir?",
      "Üreme nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Hücre (Cell)
  if (unitTitle === "Hücre") {
    const questions = [
      "Hücre nedir?",
      "Hücre teorisi nedir?",
      "Hücre çeşitleri nelerdir?",
      "Hücre organelleri nelerdir?",
      "Hücre zarı ne işe yarar?",
      "Sitoplazma nedir?",
      "Çekirdek ne işe yarar?",
      "Mitokondri ne işe yarar?",
      "Endoplazmik retikulum ne işe yarar?",
      "Golgi aygıtı ne işe yarar?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Canlıların Sınıflandırılması (Classification of Living Things)
  if (unitTitle === "Canlıların Sınıflandırılması") {
    const questions = [
      "Canlıların sınıflandırılması neden önemlidir?",
      "Bilimsel sınıflandırma sistemi kimin tarafından geliştirilmiştir?",
      "Canlılar kaç âlemde incelenir?",
      "Bakteriler hangi âleme aittir?",
      "Protistler nelerdir?",
      "Mantarlar âleminin özellikleri nelerdir?",
      "Bitkiler âleminin genel özellikleri nelerdir?",
      "Hayvanlar âleminin genel özellikleri nelerdir?",
      "Binomial (iki isimli) adlandırma nedir?",
      "Taksonomi nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Bitki ve Hayvan Hücreleri (Plant and Animal Cells)
  if (unitTitle === "Bitki ve Hayvan Hücreleri") {
    const questions = [
      "Bitki ve hayvan hücreleri arasındaki temel farklar nelerdir?",
      "Bitki hücrelerinde bulunan fakat hayvan hücrelerinde bulunmayan yapılar nelerdir?",
      "Hücre duvarı nedir ve ne işe yarar?",
      "Kloroplast nedir ve ne işe yarar?",
      "Merkezi koful nedir?",
      "Sentrozom nedir ve nerede bulunur?",
      "Bitki ve hayvan hücrelerinin ortak organelleri nelerdir?",
      "Bitki hücrelerinin şekli nasıldır?",
      "Hayvan hücrelerinin şekli nasıldır?",
      "Tek hücreli ve çok hücreli organizmalar arasındaki farklar nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Mikroorganizmalar (Microorganisms)
  if (unitTitle === "Mikroorganizmalar") {
    const questions = [
      "Mikroorganizma nedir?",
      "Bakterilerin temel özellikleri nelerdir?",
      "Virüslerin özellikleri nelerdir?",
      "Bakteriler ve virüsler arasındaki farklar nelerdir?",
      "Mantarların temel özellikleri nelerdir?",
      "Protozoalar nelerdir?",
      "Mikroorganizmaların insan yaşamındaki önemi nedir?",
      "Faydalı mikroorganizmalara örnekler veriniz.",
      "Zararlı mikroorganizmalara örnekler veriniz.",
      "Hastalık yapan mikroorganizmalar nasıl yayılır?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Bitkiler (Plants)
  if (unitTitle === "Bitkiler") {
    const questions = [
      "Bitkilerin temel özellikleri nelerdir?",
      "Bitkilerin sınıflandırılması nasıl yapılır?",
      "Tohumsuz bitkilere örnekler veriniz.",
      "Tohumlu bitkilere örnekler veriniz.",
      "Çiçekli ve çiçeksiz bitkiler arasındaki farklar nelerdir?",
      "Bitkilerde üreme nasıl gerçekleşir?",
      "Bitkiler nasıl beslenir?",
      "Fotosentez nedir?",
      "Fotosentez için gerekli koşullar nelerdir?",
      "Bitkilerin ekolojik önemi nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Hayvanlar (Animals)
  if (unitTitle === "Hayvanlar") {
    const questions = [
      "Hayvanların temel özellikleri nelerdir?",
      "Omurgalı ve omurgasız hayvanlar arasındaki farklar nelerdir?",
      "Omurgasız hayvan grupları nelerdir?",
      "Omurgalı hayvan grupları nelerdir?",
      "Memelilerin özellikleri nelerdir?",
      "Kuşların özellikleri nelerdir?",
      "Sürüngenlerin özellikleri nelerdir?",
      "İki yaşamlıların özellikleri nelerdir?",
      "Balıkların özellikleri nelerdir?",
      "Hayvanların ekolojik önemi nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for İnsan Vücudu (Human Body)
  if (unitTitle === "İnsan Vücudu") {
    const questions = [
      "İnsan vücudundaki sistemler nelerdir?",
      "Sindirim sistemi nedir ve görevleri nelerdir?",
      "Dolaşım sistemi nedir ve görevleri nelerdir?",
      "Solunum sistemi nedir ve görevleri nelerdir?",
      "Boşaltım sistemi nedir ve görevleri nelerdir?",
      "Sinir sistemi nedir ve görevleri nelerdir?",
      "Destek ve hareket sistemi nedir ve görevleri nelerdir?",
      "Endokrin sistem nedir ve görevleri nelerdir?",
      "Üreme sistemi nedir ve görevleri nelerdir?",
      "Bağışıklık sistemi nedir ve görevleri nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Ekoloji (Ecology)
  if (unitTitle === "Ekoloji") {
    const questions = [
      "Ekoloji nedir?",
      "Ekosistem nedir?",
      "Besin zinciri nedir?",
      "Besin ağı nedir?",
      "Üreticiler, tüketiciler ve ayrıştırıcılar nelerdir?",
      "Popülasyon nedir?",
      "Komünite nedir?",
      "Habitat nedir?",
      "Biyotik ve abiyotik faktörler nelerdir?",
      "Çevre kirliliğinin ekosistemler üzerindeki etkileri nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Biyolojik Çeşitlilik (Biodiversity)
  if (unitTitle === "Biyolojik Çeşitlilik") {
    const questions = [
      "Biyolojik çeşitlilik nedir?",
      "Biyolojik çeşitliliğin önemi nedir?",
      "Tür çeşitliliği nedir?",
      "Genetik çeşitlilik nedir?",
      "Ekosistem çeşitliliği nedir?",
      "Endemik türler nedir?",
      "Nesli tükenen türler nedir?",
      "Nesli tükenmekte olan türler nedir?",
      "Biyolojik çeşitliliği tehdit eden faktörler nelerdir?",
      "Biyolojik çeşitliliği korumak için neler yapılabilir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Default question for other units
  return `${unitTitle} - Soru ${challengeOrder}: Bu soruyu cevaplayın.`;
};

// Function to generate options based on unit, lesson, and challenge
const getOption = (unitTitle: string, lessonOrder: number, challengeOrder: number, optionOrder: number): string => {
  // Options for Canlılar ve Özellikleri (Living Things and Their Characteristics)
  if (unitTitle === "Canlılar ve Özellikleri") {
    if (challengeOrder === 1) { // Canlı nedir?
      const options = [
        "Hareket edebilen her şeydir",
        "Sadece hayvanları kapsar",
        "Yaşamsal faaliyetleri yerine getirebilen varlıklardır",
        "Sadece gözle görülebilen varlıklardır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Canlıların ortak özellikleri
      const options = [
        "Solunum, beslenme, boşaltım, hareket, uyarılara tepki, üreme ve adaptasyon",
        "Sadece hareket etme ve büyüme",
        "Sadece beslenme ve solunum",
        "Sadece üreme ve adaptasyon"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Canlı ve cansız ayrımı
      const options = [
        "Sadece hareket edip etmemelerine göre",
        "Yaşamsal faaliyetleri yerine getirip getirmemelerine göre",
        "Sadece büyüklüklerine göre",
        "Sadece şekillerine göre"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Büyüme ve gelişme
      const options = [
        "Aynı anlamlara gelir",
        "Büyüme boy ve kilo artışı, gelişme ise olgunlaşmadır",
        "Büyüme sadece bitkilerde, gelişme ise hayvanlarda olur",
        "Büyüme hacim ve kütle artışı, gelişme ise yapısal ve işlevsel değişimlerdir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Solunum
      const options = [
        "Sadece akciğerlerle yapılan gaz alışverişidir",
        "Besinlerdeki enerjiyi açığa çıkarma işlemidir",
        "Sadece karbondioksit alma işlemidir",
        "Sadece oksijen verme işlemidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // Beslenme
      const options = [
        "Canlının yaşamını sürdürmek ve enerji üretmek için besin almasıdır",
        "Sadece bitkilerin yaptığı bir işlemdir",
        "Sadece hayvanların yaptığı bir işlemdir",
        "Sadece insanların yaptığı bir işlemdir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // Boşaltım
      const options = [
        "Sadece idrar oluşturmadır",
        "Sadece ter atmadır",
        "Metabolik atıkların vücuttan uzaklaştırılmasıdır",
        "Sadece dışkı atmadır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // Hareket
      const options = [
        "Sadece yer değiştirmedir",
        "Sadece kaslarda görülür",
        "Sadece hayvanlarda görülür",
        "Organizmanın tamamında veya bir kısmında meydana gelen yer değiştirmedir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // Uyarılara tepki
      const options = [
        "Sadece insanlarda görülür",
        "Sadece ışığa verilen tepkidir",
        "Sadece sese verilen tepkidir",
        "Canlının çevresindeki değişimlere karşı gösterdiği tepkidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // Üreme
      const options = [
        "Canlıların kendi türlerini devam ettirmek için yeni bireyler oluşturmasıdır",
        "Sadece eşeyli olarak gerçekleşir",
        "Sadece eşeysiz olarak gerçekleşir",
        "Tüm canlılarda aynı şekilde gerçekleşir"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Hücre (Cell)
  if (unitTitle === "Hücre") {
    if (challengeOrder === 1) { // Hücre nedir?
      const options = [
        "Canlıların en küçük yapı birimidir",
        "Sadece bitkilerde bulunan yapıdır",
        "Sadece hayvanlarda bulunan yapıdır",
        "Cansız varlıklarda bulunan yapıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Hücre teorisi
      const options = [
        "Hücrelerin sadece hayvanlarda bulunduğunu iddia eder",
        "Hücrelerin sadece bitkilerde bulunduğunu iddia eder",
        "Tüm canlıların hücrelerden oluştuğunu, hücrelerin canlıların yapı ve işlev birimi olduğunu ve tüm hücrelerin önceki hücrelerden oluştuğunu belirtir",
        "Hücrelerin kendiliğinden oluştuğunu iddia eder"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Hücre çeşitleri
      const options = [
        "Sadece bitki hücresi ve hayvan hücresi vardır",
        "Sadece bakteri hücresi vardır",
        "Sadece prokaryot hücre vardır",
        "Prokaryot ve ökaryot hücreler olmak üzere iki ana grup vardır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Hücre zarı nedir?
      const options = [
        "Hücreyi çevreleyen ve koruyan yapıdır",
        "Hücrenin içinde bulunan sıvıdır",
        "Hücrenin yönetim merkezidir",
        "Hücrenin enerji üretim merkezidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Hücre çekirdeği nedir?
      const options = [
        "Hücreyi çevreleyen yapıdır",
        "Hücrenin yönetim merkezi ve genetik materyali içeren kısımdır",
        "Hücrenin içinde bulunan sıvıdır",
        "Hücrenin enerji üretim merkezidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // Sitoplazma
      const options = [
        "Sadece çekirdeği içerir",
        "Sadece hücre zarını içerir",
        "Hücre zarı ile çekirdek arasında kalan, organelleri içeren sıvı kısımdır",
        "Sadece bitki hücrelerinde bulunur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // Çekirdek
      const options = [
        "Hücrenin yönetim merkezidir ve kalıtsal materyali (DNA) içerir",
        "Sadece hayvan hücrelerinde bulunur",
        "Sadece bitki hücrelerinde bulunur",
        "Sadece bakterilerde bulunur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // Mitokondri
      const options = [
        "Sadece protein sentezi yapar",
        "Sadece salgı üretir",
        "Sadece besinleri depolar",
        "Hücrede enerji üretiminden sorumlu organeldir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // Endoplazmik retikulum
      const options = [
        "Sadece enerji üretir",
        "Protein sentezi ve taşınmasında görev alır",
        "Sadece besinleri parçalar",
        "Sadece bitki hücrelerinde bulunur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // Golgi aygıtı
      const options = [
        "Sadece enerji üretir",
        "Sadece besinleri depolar",
        "Salgı maddelerinin paketlenmesi ve hücre dışına gönderilmesinde görev alır",
        "Sadece bitki hücrelerinde bulunur"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for other units
  if (unitTitle === "Hücre") {
    if (challengeOrder === 3) { // Hücre nedir?
      const options = [
        "Canlıların en küçük yapı birimidir",
        "Sadece bitkilerde bulunan yapıdır",
        "Sadece hayvanlarda bulunan yapıdır",
        "Cansız varlıklarda bulunan yapıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Hücre zarı nedir?
      const options = [
        "Hücreyi çevreleyen ve koruyan yapıdır",
        "Hücrenin içinde bulunan sıvıdır",
        "Hücrenin yönetim merkezidir",
        "Hücrenin enerji üretim merkezidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Hücre çekirdeği nedir?
      const options = [
        "Hücreyi çevreleyen yapıdır",
        "Hücrenin yönetim merkezi ve genetik materyali içeren kısımdır",
        "Hücrenin içinde bulunan sıvıdır",
        "Hücrenin enerji üretim merkezidir"
      ];
      return options[optionOrder - 1];
    }
  }
  
  if (unitTitle === "Vücudumuzdaki Sistemler") {
    if (challengeOrder === 1) { // İnsan vücudundaki sistemler nelerdir?
      const options = [
        "Sadece sindirim ve dolaşım sistemleri",
        "Sindirim, dolaşım, solunum, boşaltım, hareket, sinir, üreme ve duyu sistemleri",
        "Sadece solunum ve boşaltım sistemleri",
        "Sadece hareket ve sinir sistemleri"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Sindirim sistemi nedir?
      const options = [
        "Besinlerin vücuda alınması, sindirilmesi ve emilmesini sağlayan sistemdir",
        "Vücuttaki atık maddelerin dışarı atılmasını sağlayan sistemdir",
        "Vücudun hareket etmesini sağlayan sistemdir",
        "Vücudun oksijen almasını sağlayan sistemdir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Dolaşım sistemi nedir?
      const options = [
        "Vücudun hareket etmesini sağlayan sistemdir",
        "Besinlerin vücuda alınmasını sağlayan sistemdir",
        "Kanın vücutta dolaşmasını sağlayan sistemdir",
        "Vücuttaki atık maddelerin dışarı atılmasını sağlayan sistemdir"
      ];
      return options[optionOrder - 1];
    }
  }
  
  if (unitTitle === "Bitki ve Hayvanlarda Üreme") {
    if (challengeOrder === 1) { // Bitkilerde üreme nasıl gerçekleşir?
      const options = [
        "Sadece tohumla üreme",
        "Tohumla (eşeyli) ve vejetatif (eşeysiz) üreme yöntemleriyle",
        "Sadece vejetatif üreme",
        "Bitkilerde üreme gerçekleşmez"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Çiçekli bitkilerde döllenme nasıl gerçekleşir?
      const options = [
        "Polen tanelerinin dişi organa taşınması ve yumurta hücresiyle birleşmesiyle",
        "Sadece rüzgar yoluyla",
        "Sadece su yoluyla",
        "Çiçekli bitkilerde döllenme gerçekleşmez"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Hayvanlarda üreme nasıl gerçekleşir?
      const options = [
        "Sadece eşeyli üreme",
        "Eşeyli ve eşeysiz üreme yöntemleriyle",
        "Sadece eşeysiz üreme",
        "Hayvanlarda üreme gerçekleşmez"
      ];
      return options[optionOrder - 1];
    }
  }
  
  if (unitTitle === "Mikroskobik Canlılar") {
    if (challengeOrder === 1) { // Mikroskobik canlılar nelerdir?
      const options = [
        "Sadece bakteriler",
        "Bakteriler, protistler, bazı mantarlar ve virüsler",
        "Sadece virüsler",
        "Sadece protistler"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Bakteriler nedir?
      const options = [
        "Tek hücreli, çekirdeksiz mikroskobik canlılardır",
        "Çok hücreli, çekirdekli mikroskobik canlılardır",
        "Cansız varlıklardır",
        "Sadece hastalık yapan canlılardır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Virüsler nedir?
      const options = [
        "Tek hücreli, çekirdekli mikroskobik canlılardır",
        "Çok hücreli, çekirdeksiz mikroskobik canlılardır",
        "Canlı hücrelerde çoğalabilen, protein kılıf içinde genetik materyal taşıyan yapılardır",
        "Sadece bitkilerde yaşayan canlılardır"
      ];
      return options[optionOrder - 1];
    }
  }
  
  if (unitTitle === "Ekosistem") {
    if (challengeOrder === 1) { // Ekosistem nedir?
      const options = [
        "Sadece canlıların yaşadığı ortamdır",
        "Canlılar ve cansız çevrenin oluşturduğu bütündür",
        "Sadece bitkilerin yaşadığı ortamdır",
        "Sadece hayvanların yaşadığı ortamdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Besin zinciri nedir?
      const options = [
        "Sadece bitkilerin beslenme şeklidir",
        "Canlılar arasındaki beslenme ilişkisini gösteren sıralamadır",
        "Sadece hayvanların beslenme şeklidir",
        "Sadece insanların beslenme şeklidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Üretici, tüketici ve ayrıştırıcılar nedir?
      const options = [
        "Üreticiler kendi besinini üretenler, tüketiciler hazır besinle beslenenler, ayrıştırıcılar ölü organizmaları parçalayanlardır",
        "Üreticiler fabrikalar, tüketiciler insanlar, ayrıştırıcılar çöp toplayıcılarıdır",
        "Üreticiler sadece bitkiler, tüketiciler sadece hayvanlar, ayrıştırıcılar sadece mantarlardır",
        "Üreticiler sadece hayvanlar, tüketiciler sadece bitkiler, ayrıştırıcılar sadece bakterilerdir"
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