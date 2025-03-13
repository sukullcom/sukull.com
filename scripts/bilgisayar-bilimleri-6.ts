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
    console.log("Creating Bilgisayar Bilimleri (Computer Science) course for 6th grade");

    // Insert the course
    const [course] = await db
      .insert(schema.courses)
      .values({ title: "Bilgisayar Bilimleri 6. Sınıf", imageSrc: "/bilgisayar-bilimleri-6.svg" })
      .returning();

    // Unit names for 6th grade Computer Science in Turkish curriculum
    const unitNames = [
      { title: "Bilişim Teknolojileri", description: "Bilişim teknolojilerinin temelleri ve önemi" },
      { title: "Donanım ve Yazılım", description: "Bilgisayar donanımları ve yazılım türleri" },
      { title: "İşletim Sistemleri", description: "İşletim sistemleri ve temel özellikleri" },
      { title: "İnternet ve Ağ Teknolojileri", description: "İnternet kullanımı ve ağ teknolojileri" },
      { title: "Dijital Okuryazarlık", description: "Dijital dünyada güvenlik ve etik" },
      { title: "Algoritma ve Programlama", description: "Algoritma tasarımı ve temel programlama" },
      { title: "Görsel Programlama", description: "Blok tabanlı programlama araçları" },
      { title: "Web Tasarımı", description: "Temel web sayfası tasarımı" },
      { title: "Veritabanı İşlemleri", description: "Temel veritabanı kavramları ve uygulamaları" },
      { title: "Bilişimde Güncel Konular", description: "Yapay zeka, bulut bilişim ve diğer güncel konular" }
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

    console.log("6th grade Bilgisayar Bilimleri course created successfully.");
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
  // For "Bilişim Teknolojileri" unit (Information Technologies)
  if (unitTitle === "Bilişim Teknolojileri") {
    if (challengeOrder === 1 && optionOrder === 2) return true; // Bilişim teknolojisi nedir?
    if (challengeOrder === 2 && optionOrder === 1) return true; // Bilişim teknolojilerinin önemi
    if (challengeOrder === 3 && optionOrder === 3) return true; // Bilgisayarın icadı
    if (challengeOrder === 4 && optionOrder === 4) return true; // Bilgisayar nesilleri
    if (challengeOrder === 5 && optionOrder === 2) return true; // Bilişim teknolojilerinin kullanım alanları
    if (challengeOrder === 6 && optionOrder === 1) return true; // Veri işleme
    if (challengeOrder === 7 && optionOrder === 3) return true; // Bilgi ve veri arasındaki fark
    if (challengeOrder === 8 && optionOrder === 2) return true; // Bilgisayar sistemleri
    if (challengeOrder === 9 && optionOrder === 4) return true; // Bilişim sektöründeki meslekler
    if (challengeOrder === 10 && optionOrder === 1) return true; // Bilişim teknolojilerinin geleceği
  }
  
  // For "Donanım ve Yazılım" unit (Hardware and Software)
  else if (unitTitle === "Donanım ve Yazılım") {
    if (challengeOrder === 1 && optionOrder === 3) return true; // Donanım nedir?
    if (challengeOrder === 2 && optionOrder === 2) return true; // Yazılım nedir?
    if (challengeOrder === 3 && optionOrder === 1) return true; // Giriş birimleri
    if (challengeOrder === 4 && optionOrder === 4) return true; // Çıkış birimleri
    if (challengeOrder === 5 && optionOrder === 3) return true; // İşlemci
    if (challengeOrder === 6 && optionOrder === 2) return true; // RAM ve ROM farkı
    if (challengeOrder === 7 && optionOrder === 1) return true; // Depolama birimleri
    if (challengeOrder === 8 && optionOrder === 4) return true; // Sistem yazılımları
    if (challengeOrder === 9 && optionOrder === 3) return true; // Uygulama yazılımları
    if (challengeOrder === 10 && optionOrder === 2) return true; // Açık kaynak kodlu yazılımlar
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
  // Questions for Bilişim Teknolojileri (Information Technologies)
  if (unitTitle === "Bilişim Teknolojileri") {
    const questions = [
      "Bilişim teknolojisi nedir?",
      "Bilişim teknolojilerinin önemi nedir?",
      "İlk bilgisayar kim tarafından ve ne zaman icat edilmiştir?",
      "Bilgisayar nesilleri nasıl sınıflandırılır?",
      "Bilişim teknolojilerinin kullanım alanları nelerdir?",
      "Veri işleme nedir?",
      "Bilgi ve veri arasındaki fark nedir?",
      "Bilgisayar sistemleri hangi bileşenlerden oluşur?",
      "Bilişim sektöründeki meslekler nelerdir?",
      "Bilişim teknolojilerinin geleceği hakkında öngörüler nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Donanım ve Yazılım (Hardware and Software)
  if (unitTitle === "Donanım ve Yazılım") {
    const questions = [
      "Donanım nedir?",
      "Yazılım nedir?",
      "Bilgisayarın giriş birimleri nelerdir?",
      "Bilgisayarın çıkış birimleri nelerdir?",
      "İşlemci (CPU) nedir?",
      "RAM ve ROM arasındaki fark nedir?",
      "Bilgisayardaki depolama birimleri nelerdir?",
      "Sistem yazılımları nelerdir?",
      "Uygulama yazılımları nelerdir?",
      "Açık kaynak kodlu yazılım ne demektir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for İşletim Sistemleri (Operating Systems)
  if (unitTitle === "İşletim Sistemleri") {
    const questions = [
      "İşletim sistemi nedir?",
      "İşletim sistemlerinin görevleri nelerdir?",
      "Yaygın kullanılan işletim sistemleri nelerdir?",
      "Windows işletim sistemi özellikleri nelerdir?",
      "Linux işletim sistemi özellikleri nelerdir?",
      "macOS işletim sistemi özellikleri nelerdir?",
      "İşletim sisteminin dosya yönetimi nasıl çalışır?",
      "İşletim sistemlerinde kullanıcı arayüzü nedir?",
      "İşletim sistemlerinde güvenlik nasıl sağlanır?",
      "Mobile işletim sistemleri nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for İnternet ve Ağ Teknolojileri (Internet and Network Technologies)
  if (unitTitle === "İnternet ve Ağ Teknolojileri") {
    const questions = [
      "İnternet nedir?",
      "İnternetin tarihsel gelişimi nasıl olmuştur?",
      "Ağ (Network) nedir?",
      "Ağ türleri nelerdir? (LAN, WAN, MAN vb.)",
      "İnternet protokolleri nelerdir?",
      "WWW (World Wide Web) nedir?",
      "Web tarayıcısı nedir?",
      "İnternet bağlantı türleri nelerdir?",
      "IP adresi nedir?",
      "İnternet güvenliği için neler yapılmalıdır?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Dijital Okuryazarlık (Digital Literacy)
  if (unitTitle === "Dijital Okuryazarlık") {
    const questions = [
      "Dijital okuryazarlık nedir?",
      "İnternet etiği nedir?",
      "Siber zorbalık nedir ve nasıl önlenir?",
      "Bilişim suçları nelerdir?",
      "Telif hakları ve lisanslama nedir?",
      "Güvenli internet kullanımı için neler yapılmalıdır?",
      "Dijital kimlik nedir?",
      "Sosyal medya kullanımında dikkat edilmesi gereken hususlar nelerdir?",
      "Kişisel verilerin korunması neden önemlidir?",
      "Dijital ayak izi nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Algoritma ve Programlama (Algorithm and Programming)
  if (unitTitle === "Algoritma ve Programlama") {
    const questions = [
      "Algoritma nedir?",
      "Akış şeması nedir?",
      "Programlama dili nedir?",
      "Programlama dillerinin türleri nelerdir?",
      "Değişken nedir?",
      "Veri tipleri nelerdir?",
      "Döngüler (loops) nedir?",
      "Koşullu ifadeler nedir?",
      "Fonksiyon nedir?",
      "Hata ayıklama (debugging) nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Görsel Programlama (Visual Programming)
  if (unitTitle === "Görsel Programlama") {
    const questions = [
      "Görsel programlama nedir?",
      "Blok tabanlı programlama nedir?",
      "Scratch nedir?",
      "Scratch'teki temel bloklar nelerdir?",
      "Scratch'te karakter (Sprite) nasıl oluşturulur?",
      "Scratch'te kostüm değiştirme nasıl yapılır?",
      "Scratch'te hareket komutları nelerdir?",
      "Scratch'te değişkenler nasıl kullanılır?",
      "Scratch'te döngüler nasıl kullanılır?",
      "Scratch'te koşullu ifadeler nasıl kullanılır?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Web Tasarımı (Web Design)
  if (unitTitle === "Web Tasarımı") {
    const questions = [
      "Web tasarımı nedir?",
      "HTML nedir?",
      "CSS nedir?",
      "HTML sayfasının temel yapısı nasıldır?",
      "HTML'de başlık (heading) etiketleri nelerdir?",
      "HTML'de liste oluşturma nasıl yapılır?",
      "HTML'de resim ekleme nasıl yapılır?",
      "HTML'de link oluşturma nasıl yapılır?",
      "CSS ile metin rengi nasıl değiştirilir?",
      "CSS ile arka plan rengi nasıl değiştirilir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Veritabanı İşlemleri (Database Operations)
  if (unitTitle === "Veritabanı İşlemleri") {
    const questions = [
      "Veritabanı nedir?",
      "Veritabanı yönetim sistemi nedir?",
      "Veritabanı türleri nelerdir?",
      "Tablo nedir?",
      "Kayıt (satır) nedir?",
      "Alan (sütun) nedir?",
      "İlişkisel veritabanı nedir?",
      "Birincil anahtar (primary key) nedir?",
      "SQL nedir?",
      "Veritabanı güvenliği neden önemlidir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Bilişimde Güncel Konular (Current Topics in Informatics)
  if (unitTitle === "Bilişimde Güncel Konular") {
    const questions = [
      "Yapay zeka nedir?",
      "Makine öğrenmesi nedir?",
      "Robotik nedir?",
      "Nesnelerin interneti (IoT) nedir?",
      "Bulut bilişim nedir?",
      "Büyük veri (Big Data) nedir?",
      "Sanal gerçeklik (VR) nedir?",
      "Artırılmış gerçeklik (AR) nedir?",
      "Blok zinciri (Blockchain) nedir?",
      "Quantum bilgisayarlar nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Default question for other units
  return `${unitTitle} - Soru ${challengeOrder}: Bu soruyu cevaplayın.`;
};

// Function to generate options based on unit, lesson, and challenge
const getOption = (unitTitle: string, lessonOrder: number, challengeOrder: number, optionOrder: number): string => {
  // Options for Bilişim Teknolojileri (Information Technologies)
  if (unitTitle === "Bilişim Teknolojileri") {
    if (challengeOrder === 1) { // Bilişim teknolojisi nedir?
      const options = [
        "Sadece bilgisayarların kullanımıdır",
        "Bilginin toplanması, işlenmesi, saklanması ve iletilmesini sağlayan teknolojilerin tümüdür",
        "Sadece internet kullanımıdır",
        "Sadece cep telefonu kullanımıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Bilişim teknolojilerinin önemi
      const options = [
        "Günlük hayatı kolaylaştırması, iletişimi hızlandırması ve bilgiye erişimi artırmasıdır",
        "Sadece eğlence amaçlı kullanılmasıdır",
        "Sadece iş yerlerinde kullanılmasıdır",
        "Sadece eğitimde kullanılmasıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Bilgisayarın icadı
      const options = [
        "Bill Gates tarafından 1975'te",
        "Steve Jobs tarafından 1976'da",
        "Charles Babbage tarafından 1830'larda ilk mekanik bilgisayarın temelleri atılmıştır",
        "Thomas Edison tarafından 1900'de"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Bilgisayar nesilleri
      const options = [
        "Boyutlarına göre",
        "Renklerine göre",
        "Fiyatlarına göre",
        "Kullanılan teknolojiye göre (vakum tüpleri, transistörler, entegre devreler vb.)"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Bilişim teknolojilerinin kullanım alanları
      const options = [
        "Sadece bankacılık sektöründe",
        "Eğitim, sağlık, bankacılık, üretim, iletişim gibi hemen her alanda",
        "Sadece eğlence sektöründe",
        "Sadece eğitim alanında"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // Veri işleme
      const options = [
        "Verilerin toplanması, işlenmesi, depolanması ve dağıtılması sürecidir",
        "Sadece verilerin toplanmasıdır",
        "Sadece verilerin depolanmasıdır",
        "Sadece verilerin silinmesidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // Bilgi ve veri arasındaki fark
      const options = [
        "Aynı şeylerdir, fark yoktur",
        "Veri daha büyük dosyaları ifade eder",
        "Veri ham bilgidir, bilgi ise işlenmiş ve anlamlı hale getirilmiş veridir",
        "Bilgi her zaman doğrudur, veri yanlış olabilir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // Bilgisayar sistemleri
      const options = [
        "Sadece donanım bileşenlerinden oluşur",
        "Donanım ve yazılım bileşenlerinden oluşur",
        "Sadece yazılım bileşenlerinden oluşur",
        "Sadece internet bağlantısından oluşur"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // Bilişim sektöründeki meslekler
      const options = [
        "Sadece programcılık",
        "Sadece web tasarımı",
        "Sadece sistem yöneticiliği",
        "Yazılım geliştirici, ağ uzmanı, siber güvenlik uzmanı, veri bilimci, yapay zeka uzmanı gibi çeşitli alanlar"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // Bilişim teknolojilerinin geleceği
      const options = [
        "Yapay zeka, bulut bilişim, büyük veri, nesnelerin interneti gibi alanlarda hızlı gelişmeler olacaktır",
        "Teknolojik gelişme duracaktır",
        "Sadece telefonlar gelişecektir",
        "Bilgisayarlar tamamen ortadan kalkacaktır"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Donanım ve Yazılım (Hardware and Software)
  if (unitTitle === "Donanım ve Yazılım") {
    if (challengeOrder === 1) { // Donanım nedir?
      const options = [
        "Bilgisayarın tüm parçalarına verilen isimdir",
        "Sadece bilgisayar kasasının içindeki parçalardır",
        "Bilgisayarın fiziksel bileşenlerine verilen isimdir",
        "Bilgisayarın ekranı, klavyesi ve faresine verilen isimdir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Yazılım nedir?
      const options = [
        "Bilgisayarın fiziksel parçalarıdır",
        "Bilgisayarı çalıştıran ve belirli görevleri yerine getiren programlar ve kodlardır",
        "Sadece internetten indirilen oyunlardır",
        "Sadece Windows işletim sistemidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Giriş birimleri
      const options = [
        "Klavye, fare, tarayıcı, mikrofon, kamera gibi veri girişi sağlayan birimlerdir",
        "Sadece ekran ve yazıcıdır",
        "Sadece klavye ve faredir",
        "Bilgisayarın bağlantı noktalarıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Çıkış birimleri
      const options = [
        "Bilgisayarın bağlantı noktalarıdır",
        "Klavye ve faredir",
        "Tarayıcı ve kameradır",
        "Monitör, yazıcı, hoparlör gibi işlenmiş verileri kullanıcıya ileten birimlerdir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // İşlemci
      const options = [
        "Bilgisayarın tüm işlemlerini kaydeden birimdir",
        "Sadece bilgisayarın açılmasını sağlayan birimdir",
        "Bilgisayarın beyni olarak adlandırılan, tüm işlemleri ve hesaplamaları yapan ana birimdir",
        "Sadece internet bağlantısını sağlayan birimdir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 6) { // RAM ve ROM farkı
      const options = [
        "Aynı şeylerdir, fark yoktur",
        "RAM geçici bellek, ROM kalıcı bellektir. RAM elektrik kesildiğinde veriler silinir, ROM'daki veriler silinmez",
        "RAM daha pahalı, ROM daha ucuzdur",
        "RAM daha büyük, ROM daha küçüktür"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 7) { // Depolama birimleri
      const options = [
        "Sabit disk, SSD, flash bellek, DVD/CD gibi verilerin kalıcı olarak saklandığı birimlerdir",
        "Sadece RAM ve ROM'dur",
        "Sadece bilgisayar kasasıdır",
        "Sadece harici disklerdir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 8) { // Sistem yazılımları
      const options = [
        "Sadece oyunlardır",
        "Sadece Word, Excel gibi ofis programlarıdır",
        "Sadece internet tarayıcılarıdır",
        "İşletim sistemleri, sürücüler gibi donanımın çalışmasını sağlayan yazılımlardır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 9) { // Uygulama yazılımları
      const options = [
        "Sadece işletim sistemleridir",
        "Sadece sürücülerdir",
        "Ofis programları, oyunlar, grafik tasarım yazılımları gibi belirli işleri yapmak için tasarlanmış yazılımlardır",
        "Sadece virüs programlarıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 10) { // Açık kaynak kodlu yazılımlar
      const options = [
        "Sadece bedava yazılımlardır",
        "Kaynak kodu herkes tarafından görüntülenebilen, değiştirilebilen ve dağıtılabilen yazılımlardır",
        "Sadece virüs içeren yazılımlardır",
        "Sadece Windows işletim sistemidir"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for İşletim Sistemleri (Operating Systems)
  if (unitTitle === "İşletim Sistemleri") {
    if (challengeOrder === 1) { // İşletim sistemi nedir?
      const options = [
        "Sadece bilgisayarı açıp kapatan sistemdir",
        "Bilgisayar donanımını yöneten ve uygulama yazılımları için ortak hizmetler sağlayan sistem yazılımıdır",
        "Sadece dosyaları düzenleyen sistemdir",
        "Sadece oyun oynamayı sağlayan sistemdir"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for other units
  if (unitTitle === "Algoritma ve Programlama") {
    if (challengeOrder === 3) { // Algoritma nedir?
      const options = [
        "Bilgisayar donanımıdır",
        "Bir problemi çözmek için adım adım izlenen yol ve yöntemdir",
        "Bilgisayar programlama dilidir",
        "Bilgisayar virüsüdür"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Akış şeması nedir?
      const options = [
        "Bilgisayar programıdır",
        "Algoritmanın şekillerle gösterimidir",
        "Bilgisayar donanımıdır",
        "Bilgisayar virüsüdür"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Değişken nedir?
      const options = [
        "Bilgisayar programıdır",
        "Programlama dilinde veri saklamak için kullanılan isimlendirilmiş bellek alanıdır",
        "Bilgisayar donanımıdır",
        "Bilgisayar virüsüdür"
      ];
      return options[optionOrder - 1];
    }
  }
  
  if (unitTitle === "Programlama Dilleri") {
    if (challengeOrder === 1) { // Programlama dili nedir?
      const options = [
        "Bilgisayara komut vermek için kullanılan dildir",
        "İnsanların kendi aralarında konuştuğu dildir",
        "Bilgisayarın kendi kendine konuştuğu dildir",
        "Bilgisayar donanımıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Yüksek seviyeli programlama dilleri nelerdir?
      const options = [
        "Python, Java, C++, JavaScript gibi insan diline yakın olan dillerdir",
        "Makine dili ve assembly gibi bilgisayarın doğrudan anladığı dillerdir",
        "Sadece bilgisayar mühendislerinin kullandığı dillerdir",
        "Sadece oyun programlamada kullanılan dillerdir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Düşük seviyeli programlama dilleri nelerdir?
      const options = [
        "Python, Java, C++ gibi dillerdir",
        "Makine dili ve assembly gibi bilgisayarın doğrudan anladığı dillerdir",
        "Sadece web programlamada kullanılan dillerdir",
        "Sadece mobil programlamada kullanılan dillerdir"
      ];
      return options[optionOrder - 1];
    }
  }
  
  if (unitTitle === "Web Tasarımı") {
    if (challengeOrder === 1) { // HTML nedir?
      const options = [
        "Web sayfalarının yapısını tanımlamak için kullanılan işaretleme dilidir",
        "Web sayfalarının stilini tanımlamak için kullanılan dildir",
        "Web sayfalarına etkileşim eklemek için kullanılan dildir",
        "Web sayfalarını yayınlamak için kullanılan programdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // CSS nedir?
      const options = [
        "Web sayfalarının yapısını tanımlamak için kullanılan dildir",
        "Web sayfalarının stilini tanımlamak için kullanılan dildir",
        "Web sayfalarına etkileşim eklemek için kullanılan dildir",
        "Web sayfalarını yayınlamak için kullanılan programdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // JavaScript nedir?
      const options = [
        "Web sayfalarının yapısını tanımlamak için kullanılan dildir",
        "Web sayfalarının stilini tanımlamak için kullanılan dildir",
        "Web sayfalarına etkileşim eklemek için kullanılan programlama dilidir",
        "Web sayfalarını yayınlamak için kullanılan programdır"
      ];
      return options[optionOrder - 1];
    }
  }
  
  if (unitTitle === "Veri Tabanları") {
    if (challengeOrder === 1) { // Veri tabanı nedir?
      const options = [
        "Verilerin düzenli bir şekilde saklandığı elektronik depolama sistemidir",
        "Bilgisayar donanımıdır",
        "Bilgisayar programlama dilidir",
        "Bilgisayar virüsüdür"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // SQL nedir?
      const options = [
        "Veri tabanı donanımıdır",
        "Veri tabanlarını sorgulamak için kullanılan dildir",
        "Bilgisayar programlama dilidir",
        "Bilgisayar virüsüdür"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Veri tabanı yönetim sistemi nedir?
      const options = [
        "Veri tabanı donanımıdır",
        "Veri tabanlarını oluşturmak, yönetmek ve sorgulamak için kullanılan yazılımdır",
        "Bilgisayar programlama dilidir",
        "Bilgisayar virüsüdür"
      ];
      return options[optionOrder - 1];
    }
  }
  
  if (unitTitle === "Siber Güvenlik") {
    if (challengeOrder === 1) { // Siber güvenlik nedir?
      const options = [
        "Bilgisayar ve ağ sistemlerini kötü niyetli saldırılardan koruma bilimidir",
        "Bilgisayar donanımıdır",
        "Bilgisayar programlama dilidir",
        "Bilgisayar virüsüdür"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Bilgisayar virüsü nedir?
      const options = [
        "Bilgisayar donanımıdır",
        "Bilgisayara zarar vermek için tasarlanmış kötü amaçlı yazılımdır",
        "Bilgisayar programlama dilidir",
        "Bilgisayarı hızlandıran yazılımdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Güvenli internet kullanımı için neler yapılmalıdır?
      const options = [
        "Hiçbir şey yapmaya gerek yoktur",
        "Güçlü şifreler kullanmak, güncellemeleri yapmak, şüpheli bağlantılara tıklamamak",
        "İnterneti hiç kullanmamak",
        "Sadece geceleri internete girmek"
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