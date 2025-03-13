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
    console.log("Creating Fizik (Physics) course for 6th grade");

    // Insert the course
    const [course] = await db
      .insert(schema.courses)
      .values({ title: "Fizik 6. Sınıf", imageSrc: "/fizik-6.svg" })
      .returning();

    // Unit names for 6th grade Physics in Turkish curriculum
    const unitNames = [
      { title: "Kuvvet ve Hareket", description: "Dengelenmiş ve dengelenmemiş kuvvetler" },
      { title: "Işık ve Ses", description: "Işığın ve sesin yayılması, özellikleri" },
      { title: "Madde ve Isı", description: "Maddenin ısı alışverişi ve hal değişimi" },
      { title: "Elektrik", description: "Elektrik devre elemanları ve devreler" },
      { title: "Manyetizma", description: "Mıknatıslar ve manyetik alan" },
      { title: "Basınç", description: "Katı, sıvı ve gaz basıncı" },
      { title: "Enerji Dönüşümleri", description: "Enerji çeşitleri ve dönüşümleri" },
      { title: "Dünya, Ay ve Güneş", description: "Dünya, Ay ve Güneş'in hareketleri" },
      { title: "Basit Makineler", description: "Kaldıraç, eğik düzlem, makara" },
      { title: "Sürtünme Kuvveti", description: "Sürtünme kuvveti ve günlük yaşamda önemi" }
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
        `${unitNames[i].title} - Deney ve Gözlemler`,
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

    console.log("6th grade Fizik course created successfully.");
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
  // For "Kuvvet ve Hareket" unit
  if (unitTitle === "Kuvvet ve Hareket") {
    if (challengeOrder === 1 && optionOrder === 2) return true; // Kuvvetin birimi nedir?
    if (challengeOrder === 2 && optionOrder === 3) return true; // Dengelenmiş kuvvetlerin etkisindeki cisim...
    if (challengeOrder === 3 && optionOrder === 1) return true; // Hangi durumda cisme etki eden net kuvvet sıfırdır?
    if (challengeOrder === 4 && optionOrder === 2) return true; // Aşağıdakilerden hangisi bir itme kuvvetidir?
    if (challengeOrder === 5 && optionOrder === 4) return true; // 50 N'luk kuvvetin birim çevirimi
    if (challengeOrder === 6 && optionOrder === 1) return true; // Kütlesi 2 kg olan cisme 6 N'luk kuvvet...
    if (challengeOrder === 7 && optionOrder === 3) return true; // Hareket halindeki bir cismi durduran etki...
    if (challengeOrder === 8 && optionOrder === 2) return true; // Hızlanma (ivme) nedir?
    if (challengeOrder === 9 && optionOrder === 4) return true; // Bir cismin hızını ölçen alet
    if (challengeOrder === 10 && optionOrder === 3) return true; // Net kuvvet ile ivme arasındaki ilişki
  }
  
  // For "Işık ve Ses" unit
  else if (unitTitle === "Işık ve Ses") {
    if (challengeOrder === 1 && optionOrder === 3) return true; // Işık nasıl yayılır?
    if (challengeOrder === 2 && optionOrder === 2) return true; // Aşağıdakilerden hangisi ışık kaynağı değildir?
    if (challengeOrder === 3 && optionOrder === 1) return true; // Ses nasıl yayılır?
    if (challengeOrder === 4 && optionOrder === 4) return true; // Hangi ortamda ses daha hızlı yayılır?
    if (challengeOrder === 5 && optionOrder === 2) return true; // Işık hızı yaklaşık olarak kaçtır?
    if (challengeOrder === 6 && optionOrder === 3) return true; // Ses dalgalarının frekansı... 
    if (challengeOrder === 7 && optionOrder === 1) return true; // Işığın yansıma kanunu
    if (challengeOrder === 8 && optionOrder === 4) return true; // Sesin yankı yapması...
    if (challengeOrder === 9 && optionOrder === 2) return true; // Işık prizmadan geçerken...
    if (challengeOrder === 10 && optionOrder === 3) return true; // İnsan kulağının duyabileceği ses frekansı...
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
      "Kuvvetin birimi nedir?",
      "Dengelenmiş kuvvetlerin etkisindeki cismin hareketi nasıldır?",
      "Hangi durumda cisme etki eden net kuvvet sıfırdır?",
      "Aşağıdakilerden hangisi bir itme kuvvetidir?",
      "50 N'luk kuvvet kaç kilogram-kuvvet (kgf) eder?",
      "Kütlesi 2 kg olan cisme 6 N'luk kuvvet uygulandığında cisim nasıl hareket eder?",
      "Hareket halindeki bir cismi durduran etkiye ne ad verilir?",
      "Hızlanma (ivme) nedir?",
      "Bir cismin hızını ölçen alete ne ad verilir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Işık ve Ses (Light and Sound)
  if (unitTitle === "Işık ve Ses") {
    const questions = [
      "Işık nedir?",
      "Işık nasıl yayılır?",
      "Aşağıdakilerden hangisi ışık kaynağı değildir?",
      "Ses nasıl yayılır?",
      "Hangi ortamda ses daha hızlı yayılır?",
      "Işık hızı yaklaşık olarak kaçtır?",
      "Ses dalgalarının frekansı neyi belirler?",
      "Işığın yansıma kanunu nedir?",
      "Sesin yankı yapması için gerekli şart nedir?",
      "Işık prizmadan geçerken neden renklere ayrılır?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Madde ve Isı (Matter and Heat)
  if (unitTitle === "Madde ve Isı") {
    const questions = [
      "Isı nedir?",
      "Sıcaklık nedir?",
      "Isı ve sıcaklık arasındaki fark nedir?",
      "Isı hangi yönde akar?",
      "Maddenin hal değişimleri nelerdir?",
      "Hangi hal değişiminde madde ısı alır?",
      "Termometre nedir?",
      "Kaynama sıcaklığı nedir?",
      "Suyun kaynama sıcaklığı normal şartlarda kaç °C'dir?",
      "Isı iletimi en iyi hangi maddelerde gerçekleşir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Elektrik (Electricity)
  if (unitTitle === "Elektrik") {
    const questions = [
      "Elektrik nedir?",
      "Elektrik akımı nedir?",
      "Elektrik akımının birimi nedir?",
      "Basit bir elektrik devresinin temel elemanları nelerdir?",
      "Ampermetre neyi ölçer?",
      "Voltmetre neyi ölçer?",
      "İletken maddelerin özellikleri nelerdir?",
      "Yalıtkan maddelerin özellikleri nelerdir?",
      "Paralel bağlı devrelerin özellikleri nelerdir?",
      "Seri bağlı devrelerin özellikleri nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Manyetizma (Magnetism)
  if (unitTitle === "Manyetizma") {
    const questions = [
      "Mıknatıs nedir?",
      "Mıknatısın kutupları nelerdir?",
      "Aynı kutuplar birbirini nasıl etkiler?",
      "Farklı kutuplar birbirini nasıl etkiler?",
      "Manyetik alan nedir?",
      "Hangi maddeler mıknatıs tarafından çekilir?",
      "Pusula nasıl çalışır?",
      "Elektromıknatıs nedir?",
      "Elektromıknatısın gücünü artırmak için neler yapılabilir?",
      "Dünya'nın manyetik alanı neden önemlidir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Basınç (Pressure)
  if (unitTitle === "Basınç") {
    const questions = [
      "Basınç nedir?",
      "Basıncın birimi nedir?",
      "Katılarda basınç nasıl hesaplanır?",
      "Sıvı basıncı nelere bağlıdır?",
      "Pascal Prensibi nedir?",
      "Açık hava basıncı nedir?",
      "Barometre ne işe yarar?",
      "Manometre ne işe yarar?",
      "Gazlarda basınç nasıl oluşur?",
      "Basıncın günlük hayattaki uygulamaları nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Enerji Dönüşümleri (Energy Transformations)
  if (unitTitle === "Enerji Dönüşümleri") {
    const questions = [
      "Enerji nedir?",
      "Enerjinin birimi nedir?",
      "Potansiyel enerji nedir?",
      "Kinetik enerji nedir?",
      "Enerji korunumu kanunu nedir?",
      "Mekanik enerji nedir?",
      "Elektrik enerjisi nelere dönüşebilir?",
      "Işık enerjisi hangi enerji türüne dönüşebilir?",
      "Yenilenebilir enerji kaynakları nelerdir?",
      "Yenilenemeyen enerji kaynakları nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Dünya, Ay ve Güneş (Earth, Moon, and Sun)
  if (unitTitle === "Dünya, Ay ve Güneş") {
    const questions = [
      "Dünya'nın şekli nasıldır?",
      "Dünya'nın kendi ekseni etrafında bir tam dönüşü ne kadar sürer?",
      "Dünya'nın Güneş etrafında bir tam dönüşü ne kadar sürer?",
      "Ay'ın Dünya etrafında bir tam dönüşü ne kadar sürer?",
      "Güneş ve Ay tutulması nasıl gerçekleşir?",
      "Ay'ın evreleri nelerdir?",
      "Mevsimlerin oluşma nedeni nedir?",
      "Güneş Sistemi'ndeki gezegenlerin doğru sıralaması nedir?",
      "Dünya'nın uydusu nedir?",
      "Gezegen ve yıldız arasındaki temel fark nedir?"
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
      "Kaldıraçta kuvvet kazancı nasıl hesaplanır?",
      "Sabit makara kuvvetten kazanç sağlar mı?",
      "Hangi basit makine hem yön hem de kuvvet değiştirir?",
      "Basit makinelerin günlük hayattaki örnekleri nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Sürtünme Kuvveti (Friction Force)
  if (unitTitle === "Sürtünme Kuvveti") {
    const questions = [
      "Sürtünme kuvveti nedir?",
      "Sürtünme kuvveti nasıl yönlenir?",
      "Sürtünme kuvvetini etkileyen faktörler nelerdir?",
      "Sürtünme kuvvetinin zararları nelerdir?",
      "Sürtünme kuvvetinin faydaları nelerdir?",
      "Sürtünme kuvvetini azaltmak için neler yapılabilir?",
      "Sürtünme kuvvetini artırmak için neler yapılabilir?",
      "Hava direnci nedir?",
      "Su direnci nedir?",
      "Statik sürtünme ve kinetik sürtünme arasındaki fark nedir?"
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
        "Bir cismin şeklini ve konumunu değiştiren etki",
        "Bir cismin şeklini veya hareket durumunu değiştiren etki",
        "Bir cismin sıcaklığını değiştiren etki",
        "Bir cismin yoğunluğunu değiştiren etki"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Kuvvetin birimi nedir?
      const options = [
        "Kilogram (kg)",
        "Joule (J)",
        "Newton (N)",
        "Pascal (Pa)"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Dengelenmiş kuvvetlerin etkisindeki cisim
      const options = [
        "Duruyorsa durmaya, hareket ediyorsa sabit hızla hareketine devam eder",
        "Her zaman hızlanır",
        "Her zaman yavaşlar",
        "Her zaman durur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Net kuvvet sıfır olması
      const options = [
        "Cisme etki eden kuvvet yoksa",
        "Cisme etki eden kuvvetlerin bileşkesi sıfırsa",
        "Cisim hareketsizse",
        "Cisim yavaşlıyorsa"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // İtme kuvveti
      const options = [
        "Elma ağaçtan yere düşerken",
        "Kapı kolunu çekerken",
        "Asansörün halatı koparsa",
        "Arabayı ileriye doğru iterken"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // 50 N = ? kgf
      const options = [
        "5 kgf",
        "50 kgf",
        "0,5 kgf",
        "500 kgf"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // Kütlesi 2 kg olan cisme 6 N kuvvet
      const options = [
        "6 m/s² ivme ile hızlanır",
        "2 m/s² ivme ile hızlanır",
        "3 m/s² ivme ile hızlanır",
        "4 m/s² ivme ile hızlanır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // Hareket halindeki cismi durduran etki
      const options = [
        "Ağırlık",
        "Sürtünme kuvveti",
        "İtme kuvveti",
        "Çekme kuvveti"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // Hızlanma (ivme)
      const options = [
        "Birim zamandaki konum değişimi",
        "Birim zamandaki hız değişimi",
        "Birim zamandaki kuvvet değişimi",
        "Birim zamandaki kütle değişimi"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // Hız ölçen alet
      const options = [
        "Barometre",
        "Termometre",
        "Manometre",
        "Hızölçer (Speedometer)"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Işık ve Ses (Light and Sound)
  if (unitTitle === "Işık ve Ses") {
    if (challengeOrder === 1) { // Işık nedir?
      const options = [
        "Bir enerji türüdür",
        "Bir madde türüdür",
        "Bir ısı türüdür",
        "Bir kuvvet türüdür"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Işık nasıl yayılır?
      const options = [
        "Dairesel olarak",
        "Doğrusal olarak",
        "Zikzak şeklinde",
        "Kare şeklinde"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Işık kaynağı olmayanlar
      const options = [
        "Ayna",
        "Mum",
        "Güneş",
        "Fener"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Ses nasıl yayılır?
      const options = [
        "Dalgalar halinde",
        "Doğrusal olarak",
        "Kesintili olarak",
        "Yalnızca boşlukta"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Ses hangi ortamda daha hızlı?
      const options = [
        "Hava",
        "Katı",
        "Boşluk",
        "Gaz"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // Işık hızı
      const options = [
        "3 m/s",
        "300.000 km/s",
        "150.000 km/s",
        "340 m/s"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // Ses dalgalarının frekansı
      const options = [
        "Sesin yüksekliğini",
        "Sesin şiddetini",
        "Sesin hızını",
        "Sesin yayılma mesafesini"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // Işığın yansıma kanunu
      const options = [
        "Işık her zaman aynı açıyla geri yansır",
        "Işık gelme açısı ile yansıma açısı farklıdır",
        "Işık her zaman dik yansır",
        "Gelme açısı, yansıma açısına eşittir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // Sesin yankı yapması için
      const options = [
        "Sesin çok güçlü olması",
        "Ses kaynağı ile yansıtıcı yüzey arasındaki mesafenin en az 17 metre olması",
        "Ses kaynağının sabit olması",
        "Ortamın sıcaklığının yüksek olması"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // Işık prizmadan geçerken
      const options = [
        "Prizmanın yapısı bozulur",
        "Işığın yönü değişmez",
        "Işığın farklı dalga boyları farklı açılarda kırılır",
        "Işık tamamen yansır"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Madde ve Isı (Matter and Heat)
  if (unitTitle === "Madde ve Isı") {
    if (challengeOrder === 1) {
      const options = [
        "Sıcaklığı yüksek cisimden sıcaklığı düşük cisme aktarılan enerjidir",
        "Sıcaklığı düşük cisimden sıcaklığı yüksek cisme aktarılan enerjidir",
        "Maddenin sahip olduğu potansiyel enerjidir",
        "Maddenin sahip olduğu kinetik enerjidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) {
      const options = [
        "Maddenin sahip olduğu ısı enerjisidir",
        "Maddenin moleküllerinin ortalama kinetik enerjisinin bir ölçüsüdür",
        "Maddenin yalnızca katı haldeki enerjisidir",
        "Maddelerin sahip olduğu toplam enerji miktarıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) {
      const options = [
        "Isı bir enerji türü, sıcaklık ise bu enerjinin derecesidir",
        "Isı ve sıcaklık aynı kavramlardır",
        "Isı maddenin öz ısısı, sıcaklık ise maddenin miktarıdır",
        "Isı madde miktarına bağlı değildir, sıcaklık ise bağlıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) {
      const options = [
        "Her zaman sıcak cisimden soğuk cisme doğru",
        "Her zaman soğuk cisimden sıcak cisme doğru",
        "Maddenin cinsine göre yön değiştirir",
        "Maddelerin kütlelerine göre değişir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) {
      const options = [
        "Erime, donma, buharlaşma, yoğuşma, süblimleşme, kırağılaşma",
        "Erime, donma, buharlaşma",
        "Kaynama, erime, donma",
        "Katı, sıvı, gaz"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Elektrik (Electricity)
  if (unitTitle === "Elektrik") {
    if (challengeOrder === 1) {
      const options = [
        "Elektronların hareketinden kaynaklanan enerji türüdür",
        "Atom çekirdeğinde bulunan bir parçacıktır",
        "Maddenin en küçük yapı taşıdır",
        "Işık enerjisinin bir türüdür"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) {
      const options = [
        "Elektronların belirli bir yönde hareketine denir",
        "Elektronların düzensiz hareketine denir",
        "Protonların belirli bir yönde hareketine denir",
        "Elektrik yüklü parçacıkların dağılımıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) {
      const options = [
        "Volt (V)",
        "Watt (W)",
        "Amper (A)",
        "Ohm (Ω)"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for other units
  if (unitTitle === "Kuvvet ve Hareket") {
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
    if (challengeOrder === 5) { // Dengelenmiş kuvvet nedir?
      const options = [
        "Cismi hızlandıran kuvvettir",
        "Cismi yavaşlatan kuvvettir",
        "Cismin üzerine etki eden net kuvvetin sıfır olduğu durumdur",
        "Cismin şeklini değiştiren kuvvettir"
      ];
      return options[optionOrder - 1];
    }
  }
  
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
    if (challengeOrder === 3) { // Sesin özellikleri nelerdir?
      const options = [
        "Sadece şiddeti vardır",
        "Şiddet, yükseklik ve tını gibi özellikleri vardır",
        "Sadece yüksekliği vardır",
        "Sadece tınısı vardır"
      ];
      return options[optionOrder - 1];
    }
  }
  
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
    if (challengeOrder === 3) { // Işığın özellikleri nelerdir?
      const options = [
        "Sadece yansıma özelliği vardır",
        "Yansıma, kırılma, soğurulma, dağılma gibi özellikleri vardır",
        "Sadece kırılma özelliği vardır",
        "Sadece soğurulma özelliği vardır"
      ];
      return options[optionOrder - 1];
    }
  }
  
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