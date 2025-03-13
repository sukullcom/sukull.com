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
    console.log("Creating Bilgisayar Bilimleri (Computer Science) course for 5th grade");

    // Insert the course
    const [course] = await db
      .insert(schema.courses)
      .values({ title: "Bilgisayar Bilimleri 5. Sınıf", imageSrc: "/bilgisayar-bilimleri-5.svg" })
      .returning();

    // Unit names for 5th grade Computer Science in Turkish curriculum
    const unitNames = [
      { title: "Bilgisayar Temel Kavramları", description: "Bilgisayar ile ilgili temel kavramlar" },
      { title: "Donanım", description: "Bilgisayarın donanım bileşenleri" },
      { title: "Yazılım", description: "İşletim sistemleri ve uygulama yazılımları" },
      { title: "İnternet Kullanımı", description: "İnternet kullanımı ve güvenlik" },
      { title: "Dijital Vatandaşlık", description: "Dijital vatandaşlık ve güvenli internet kullanımı" },
      { title: "Algoritma", description: "Algoritma ve problem çözme teknikleri" },
      { title: "Programlama", description: "Temel programlama kavramları" },
      { title: "Blok Tabanlı Kodlama", description: "Scratch ve benzeri platformlarda kodlama" },
      { title: "Ofis Programları", description: "Temel ofis programlarının kullanımı" },
      { title: "Dijital İçerik Üretimi", description: "Dijital içerik oluşturma ve paylaşma" }
    ];

    // Create units for the Bilgisayar Bilimleri course
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
        `${unitNames[i].title} - Uygulamalar`,
        `${unitNames[i].title} - Günlük Hayatta Kullanımı`,
        `${unitNames[i].title} - Proje Çalışmaları`,
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

    console.log("5th grade Bilgisayar Bilimleri course created successfully.");
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
  // For "Bilgisayar Temel Kavramları" unit (Basic Computer Concepts)
  if (unitTitle === "Bilgisayar Temel Kavramları") {
    if (challengeOrder === 1 && optionOrder === 3) return true; // Bilgisayar nedir?
    if (challengeOrder === 2 && optionOrder === 1) return true; // Bilgisayarın tarihçesi
    if (challengeOrder === 3 && optionOrder === 4) return true; // Bilgisayarın çalışma prensibi
    if (challengeOrder === 4 && optionOrder === 2) return true; // Bilgisayar türleri
    if (challengeOrder === 5 && optionOrder === 3) return true; // Bilgisayarın kullanım alanları
    if (challengeOrder === 6 && optionOrder === 1) return true; // Donanım ve yazılım farkı
    if (challengeOrder === 7 && optionOrder === 4) return true; // Veri ve bilgi farkı
    if (challengeOrder === 8 && optionOrder === 2) return true; // Bit ve byte nedir?
    if (challengeOrder === 9 && optionOrder === 3) return true; // Giriş ve çıkış birimleri
    if (challengeOrder === 10 && optionOrder === 1) return true; // Bilgisayar nesilleri
  }
  
  // For "Donanım" unit (Hardware)
  else if (unitTitle === "Donanım") {
    if (challengeOrder === 1 && optionOrder === 2) return true; // Donanım nedir?
    if (challengeOrder === 2 && optionOrder === 4) return true; // Anakart nedir?
    if (challengeOrder === 3 && optionOrder === 1) return true; // İşlemci (CPU) nedir?
    if (challengeOrder === 4 && optionOrder === 3) return true; // RAM nedir?
    if (challengeOrder === 5 && optionOrder === 2) return true; // Sabit disk nedir?
    if (challengeOrder === 6 && optionOrder === 4) return true; // Ekran kartı nedir?
    if (challengeOrder === 7 && optionOrder === 1) return true; // Giriş birimleri nelerdir?
    if (challengeOrder === 8 && optionOrder === 3) return true; // Çıkış birimleri nelerdir?
    if (challengeOrder === 9 && optionOrder === 2) return true; // Depolama birimleri nelerdir?
    if (challengeOrder === 10 && optionOrder === 4) return true; // Donanım bakımı nasıl yapılır?
  }

  // For "Yazılım" unit (Software)
  else if (unitTitle === "Yazılım") {
    if (challengeOrder === 1 && optionOrder === 1) return true; // Yazılım nedir?
    if (challengeOrder === 2 && optionOrder === 3) return true; // İşletim sistemi nedir?
    if (challengeOrder === 3 && optionOrder === 2) return true; // Uygulama yazılımları nelerdir?
    if (challengeOrder === 4 && optionOrder === 4) return true; // Windows işletim sistemi nedir?
    if (challengeOrder === 5 && optionOrder === 1) return true; // Linux işletim sistemi nedir?
    if (challengeOrder === 6 && optionOrder === 3) return true; // macOS işletim sistemi nedir?
    if (challengeOrder === 7 && optionOrder === 2) return true; // Mobil işletim sistemleri nelerdir?
    if (challengeOrder === 8 && optionOrder === 4) return true; // Ofis yazılımları nelerdir?
    if (challengeOrder === 9 && optionOrder === 1) return true; // Virüs programları nelerdir?
    if (challengeOrder === 10 && optionOrder === 3) return true; // Yazılım güncelleme neden önemlidir?
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
  // Questions for Bilgisayar Temel Kavramları (Basic Computer Concepts)
  if (unitTitle === "Bilgisayar Temel Kavramları") {
    const questions = [
      "Bilgisayar nedir?",
      "Bilgisayarın tarihsel gelişimi nasıl olmuştur?",
      "Bilgisayarın çalışma prensibi nedir?",
      "Bilgisayar türleri nelerdir?",
      "Bilgisayarın günlük hayattaki kullanım alanları nelerdir?",
      "Donanım ve yazılım arasındaki fark nedir?",
      "Veri ve bilgi arasındaki fark nedir?",
      "Bit ve byte nedir?",
      "Giriş ve çıkış birimleri nelerdir?",
      "Bilgisayar nesilleri nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Donanım (Hardware)
  if (unitTitle === "Donanım") {
    const questions = [
      "Donanım nedir?",
      "Anakart nedir ve ne işe yarar?",
      "İşlemci (CPU) nedir ve ne işe yarar?",
      "RAM nedir ve ne işe yarar?",
      "Sabit disk nedir ve ne işe yarar?",
      "Ekran kartı nedir ve ne işe yarar?",
      "Bilgisayarda hangi giriş birimleri bulunur?",
      "Bilgisayarda hangi çıkış birimleri bulunur?",
      "Depolama birimleri nelerdir?",
      "Donanım bakımı nasıl yapılır?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Yazılım (Software)
  if (unitTitle === "Yazılım") {
    const questions = [
      "Yazılım nedir?",
      "İşletim sistemi nedir?",
      "Uygulama yazılımları nelerdir?",
      "Windows işletim sistemi nedir?",
      "Linux işletim sistemi nedir?",
      "macOS işletim sistemi nedir?",
      "Mobil işletim sistemleri nelerdir?",
      "Ofis yazılımları nelerdir?",
      "Virüs programları nelerdir?",
      "Yazılım güncelleme neden önemlidir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for İnternet Kullanımı (Internet Usage)
  if (unitTitle === "İnternet Kullanımı") {
    const questions = [
      "İnternet nedir?",
      "İnternetin tarihsel gelişimi nasıl olmuştur?",
      "Web tarayıcısı nedir?",
      "Arama motorları nelerdir ve nasıl kullanılır?",
      "E-posta nedir ve nasıl kullanılır?",
      "İnternet üzerinden dosya indirme nasıl yapılır?",
      "İnternet güvenliği neden önemlidir?",
      "Güvenli internet kullanımı için neler yapılmalıdır?",
      "İnternet bağlantı türleri nelerdir?",
      "İnternet hızı neye bağlıdır?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Dijital Vatandaşlık (Digital Citizenship)
  if (unitTitle === "Dijital Vatandaşlık") {
    const questions = [
      "Dijital vatandaşlık nedir?",
      "İnternet etiği nedir?",
      "Dijital ayak izi nedir?",
      "Kişisel bilgilerin korunması neden önemlidir?",
      "Siber zorbalık nedir ve nasıl önlenir?",
      "Telif hakları nedir?",
      "İnternette bilgi doğruluğu nasıl kontrol edilir?",
      "Sosyal medya kullanımında dikkat edilmesi gerekenler nelerdir?",
      "İnternet bağımlılığı nedir ve nasıl önlenir?",
      "Dijital vatandaş olarak sorumluluklarımız nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Algoritma (Algorithm)
  if (unitTitle === "Algoritma") {
    const questions = [
      "Algoritma nedir?",
      "Algoritmanın hayatımızdaki örnekleri nelerdir?",
      "Algoritmik düşünce nedir?",
      "Problem çözme aşamaları nelerdir?",
      "Algoritma oluşturma aşamaları nelerdir?",
      "Akış şeması nedir?",
      "Bir problemin algoritmasını nasıl oluştururuz?",
      "Karar yapıları nedir?",
      "Döngü yapıları nedir?",
      "Algoritma örnekleri nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Programlama (Programming)
  if (unitTitle === "Programlama") {
    const questions = [
      "Programlama nedir?",
      "Programlama dillerinin çeşitleri nelerdir?",
      "Değişken nedir?",
      "Veri tipleri nelerdir?",
      "Operatörler nelerdir?",
      "Koşullu ifadeler nedir?",
      "Döngüler nedir?",
      "Fonksiyon nedir?",
      "Hata ayıklama (debugging) nedir?",
      "Programlama örnekleri nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Blok Tabanlı Kodlama (Block-Based Coding)
  if (unitTitle === "Blok Tabanlı Kodlama") {
    const questions = [
      "Blok tabanlı kodlama nedir?",
      "Scratch nedir?",
      "Scratch'te karakterler (sprite) nasıl oluşturulur?",
      "Scratch'te hareket blokları nasıl kullanılır?",
      "Scratch'te kontrol blokları nasıl kullanılır?",
      "Scratch'te olaylar nasıl kullanılır?",
      "Scratch'te değişkenler nasıl kullanılır?",
      "Scratch ile basit bir oyun nasıl yapılır?",
      "Scratch ile animasyon nasıl yapılır?",
      "Blok tabanlı kodlamanın faydaları nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Ofis Programları (Office Software)
  if (unitTitle === "Ofis Programları") {
    const questions = [
      "Ofis programları nelerdir?",
      "Kelime işlemci (Word) programı nedir?",
      "Kelime işlemci programında metin nasıl biçimlendirilir?",
      "Kelime işlemci programında tablo nasıl oluşturulur?",
      "Elektronik tablolama (Excel) programı nedir?",
      "Excel'de hücre, satır ve sütun nedir?",
      "Excel'de formül nasıl oluşturulur?",
      "Sunum (PowerPoint) programı nedir?",
      "PowerPoint'te slayt nasıl oluşturulur?",
      "PowerPoint'te animasyon nasıl eklenir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Dijital İçerik Üretimi (Digital Content Creation)
  if (unitTitle === "Dijital İçerik Üretimi") {
    const questions = [
      "Dijital içerik nedir?",
      "Dijital içerik türleri nelerdir?",
      "Dijital fotoğraf düzenleme nasıl yapılır?",
      "Dijital video düzenleme nasıl yapılır?",
      "Dijital ses düzenleme nasıl yapılır?",
      "Dijital içerikleri paylaşırken nelere dikkat edilmelidir?",
      "Blog nedir ve nasıl oluşturulur?",
      "Dijital poster nasıl hazırlanır?",
      "Dijital hikaye nasıl oluşturulur?",
      "Dijital içerik üretiminin faydaları nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Default question for other units
  return `${unitTitle} - Soru ${challengeOrder}: Bu soruyu cevaplayın.`;
};

// Function to generate options based on unit, lesson, and challenge
const getOption = (unitTitle: string, lessonOrder: number, challengeOrder: number, optionOrder: number): string => {
  // Options for Bilgisayar Temel Kavramları (Basic Computer Concepts)
  if (unitTitle === "Bilgisayar Temel Kavramları") {
    if (challengeOrder === 1) { // Bilgisayar nedir?
      const options = [
        "Sadece oyun oynamaya yarayan bir cihazdır",
        "Sadece internete bağlanmaya yarayan bir cihazdır",
        "Veri ve bilgiyi işleyen, depolayan ve sonuç üreten elektronik bir cihazdır",
        "Sadece film izlemeye yarayan bir cihazdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Bilgisayarın tarihçesi
      const options = [
        "İlk bilgisayar 1940'larda ENIAC adıyla geliştirilmiştir",
        "İlk bilgisayar 2000'li yıllarda geliştirilmiştir",
        "İlk bilgisayar sadece hesap makinesi işlevi görmüştür",
        "İlk bilgisayar sadece metin yazma işlevi görmüştür"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Bilgisayarın çalışma prensibi
      const options = [
        "Sadece elektrik ile çalışır",
        "Sadece batarya ile çalışır",
        "Sadece internet bağlantısı ile çalışır",
        "Giriş, işleme, çıkış ve depolama işlemlerini bir döngü halinde gerçekleştirir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Bilgisayar türleri
      const options = [
        "Sadece masaüstü bilgisayarlar vardır",
        "Masaüstü, dizüstü, tablet, akıllı telefon gibi türleri vardır",
        "Sadece dizüstü bilgisayarlar vardır",
        "Sadece tablet bilgisayarlar vardır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Bilgisayarın kullanım alanları
      const options = [
        "Sadece oyun oynamak için kullanılır",
        "Sadece internete girmek için kullanılır",
        "Eğitim, sağlık, bankacılık, iletişim, eğlence gibi birçok alanda kullanılır",
        "Sadece film izlemek için kullanılır"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Donanım (Hardware)
  if (unitTitle === "Donanım") {
    if (challengeOrder === 1) { // Donanım nedir?
      const options = [
        "Bilgisayarda çalışan programlardır",
        "Bilgisayarın fiziksel parçalarıdır",
        "İnternet bağlantısıdır",
        "Bilgisayarın yazılımıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Anakart nedir?
      const options = [
        "Bilgisayarın dış kasasıdır",
        "Bilgisayarın belleğidir",
        "Bilgisayarın işlemcisidir",
        "Bilgisayarın tüm donanım bileşenlerini bir araya getiren ana devre kartıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // İşlemci (CPU) nedir?
      const options = [
        "Bilgisayarın beyni olarak adlandırılan ve tüm hesaplamaları yapan birimdir",
        "Bilgisayarın belleğidir",
        "Bilgisayarın dış kasasıdır",
        "Bilgisayarın ekranıdır"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Yazılım (Software)
  if (unitTitle === "Yazılım") {
    if (challengeOrder === 1) { // Yazılım nedir?
      const options = [
        "Bilgisayarın çalışmasını sağlayan programlar ve kodlardır",
        "Bilgisayarın fiziksel parçalarıdır",
        "Bilgisayarın dış kasasıdır",
        "Bilgisayarın ekranıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // İşletim sistemi nedir?
      const options = [
        "Bilgisayarda oyun oynamayı sağlayan yazılımdır",
        "Bilgisayarda internete bağlanmayı sağlayan yazılımdır",
        "Bilgisayar donanımını yöneten ve diğer yazılımlar için ortak hizmetler sağlayan temel yazılımdır",
        "Bilgisayarda dosyaları düzenleyen yazılımdır"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for other subjects
  if (unitTitle === "İnternet Kullanımı") {
    if (challengeOrder === 3) { // Web tarayıcısı nedir?
      const options = [
        "İnternet bağlantısını sağlayan donanım parçasıdır",
        "Web sayfalarını görüntülemeye yarayan yazılımdır",
        "E-posta göndermeye yarayan programdır",
        "İnternette arama yapmaya yarayan sitedir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Arama motorları nelerdir ve nasıl kullanılır?
      const options = [
        "İnternette bilgi aramaya yarayan web siteleridir, arama kutusuna kelimeler yazarak kullanılır",
        "Bilgisayarı hızlandıran yazılımlardır, otomatik çalışırlar",
        "İnternet bağlantısını sağlayan cihazlardır, kablo ile bağlanırlar",
        "Dosya indirmeye yarayan programlardır, linkler ile kullanılırlar"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // E-posta nedir ve nasıl kullanılır?
      const options = [
        "Elektronik postadır, e-posta adresi ve şifre ile giriş yapılarak kullanılır",
        "İnternet tarayıcısıdır, web adreslerini yazarak kullanılır",
        "Sosyal medya platformudur, arkadaş ekleyerek kullanılır",
        "Video izleme sitesidir, arama yaparak kullanılır"
      ];
      return options[optionOrder - 1];
    }
  }
  
  if (unitTitle === "Programlama") {
    if (challengeOrder === 1) { // Programlama nedir?
      const options = [
        "Bilgisayar oyunları oynamaktır",
        "İnternette gezinmektir",
        "Bilgisayara belirli görevleri yerine getirmesi için talimatlar vermektir",
        "Bilgisayar donanımını tamir etmektir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Algoritma nedir?
      const options = [
        "Bilgisayar programlama dilidir",
        "Bir problemi çözmek için adım adım izlenen yol ve yöntemdir",
        "Bilgisayar virüsüdür",
        "Matematik formülüdür"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Akış şeması nedir?
      const options = [
        "Algoritmanın şekillerle gösterimidir",
        "İnternet hızını gösteren grafiktir",
        "Bilgisayarın çalışma hızını gösteren tablodur",
        "Dosya indirme hızını gösteren göstergedir"
      ];
      return options[optionOrder - 1];
    }
  }
  
  if (unitTitle === "Dijital Vatandaşlık") {
    if (challengeOrder === 1) { // Dijital vatandaşlık nedir?
      const options = [
        "İnternette güvenli ve sorumlu şekilde davranmaktır",
        "E-devlet şifresi almaktır",
        "İnternette çok zaman geçirmektir",
        "Dijital oyunlar oynamaktır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // İnternet etiği nedir?
      const options = [
        "İnternette uyulması gereken ahlaki kurallardır",
        "İnternet hızını artıran ayarlardır",
        "İnternet faturasıdır",
        "İnternet şifreleridir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Siber zorbalık nedir?
      const options = [
        "İnternette başkalarına zarar verici davranışlarda bulunmaktır",
        "İnternet hızını artırmaktır",
        "Bilgisayar oyunlarında yüksek skor yapmaktır",
        "İnternette çok zaman geçirmektir"
      ];
      return options[optionOrder - 1];
    }
  }
  
  if (unitTitle === "Bilişim Teknolojileri") {
    if (challengeOrder === 1) { // Bilişim teknolojileri nedir?
      const options = [
        "Bilgisayar ve iletişim teknolojilerinin birlikte kullanılmasıdır",
        "Sadece bilgisayar donanımıdır",
        "Sadece internet teknolojisidir",
        "Sadece cep telefonlarıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Bilişim teknolojilerinin günlük hayattaki önemi nedir?
      const options = [
        "Hayatımızı kolaylaştırır, iletişimi hızlandırır ve bilgiye erişimi artırır",
        "Sadece oyun oynamak için önemlidir",
        "Sadece ödev yapmak için önemlidir",
        "Hiçbir önemi yoktur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Bilişim teknolojilerinin eğitimdeki rolü nedir?
      const options = [
        "Öğrenmeyi kolaylaştırır, bilgiye erişimi artırır ve eğitimi daha etkileşimli hale getirir",
        "Sadece öğretmenlerin not girmesi için kullanılır",
        "Eğitimde hiçbir rolü yoktur",
        "Sadece okul web sitesi için kullanılır"
      ];
      return options[optionOrder - 1];
    }
  }
  
  if (unitTitle === "Veri İşleme") {
    if (challengeOrder === 1) { // Veri nedir?
      const options = [
        "İşlenmemiş ham bilgilerdir",
        "Bilgisayar programıdır",
        "İnternet bağlantısıdır",
        "Bilgisayar donanımıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Veri işleme nedir?
      const options = [
        "Verilerin toplanması, düzenlenmesi ve analiz edilmesi sürecidir",
        "Bilgisayarın açılmasıdır",
        "İnternete bağlanmaktır",
        "Dosya kaydetmektir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Veri tabanı nedir?
      const options = [
        "Verilerin düzenli şekilde saklandığı yapıdır",
        "İnternet sitesidir",
        "Bilgisayar programıdır",
        "Dosya klasörüdür"
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