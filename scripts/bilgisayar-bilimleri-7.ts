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
    console.log("Creating Bilgisayar Bilimleri (Computer Science) course for 7th grade");

    // Insert the course
    const [course] = await db
      .insert(schema.courses)
      .values({ title: "Bilgisayar Bilimleri 7. Sınıf", imageSrc: "/bilgisayar-bilimleri-7.svg" })
      .returning();

    // Unit names for 7th grade Computer Science in Turkish curriculum
    const unitNames = [
      { title: "Bilgisayar Sistemleri", description: "Donanım ve yazılım bileşenleri" },
      { title: "Algoritma ve Akış Şemaları", description: "Problem çözme ve algoritma geliştirme" },
      { title: "Programlama Temelleri", description: "Temel programlama kavramları" },
      { title: "Değişkenler ve Veri Tipleri", description: "Veri tipi kavramları ve değişkenler" },
      { title: "Koşullu İfadeler", description: "Karar yapıları ve kullanımı" },
      { title: "Döngüler", description: "Tekrarlı işlemler ve döngü yapıları" },
      { title: "Fonksiyonlar", description: "Modüler programlama ve fonksiyonlar" },
      { title: "Diziler", description: "Veri koleksiyonları ve diziler" },
      { title: "Web Tasarım", description: "HTML ve CSS temelleri" },
      { title: "Siber Güvenlik", description: "Güvenlik önlemleri ve bilinçli internet kullanımı" }
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
        `${unitNames[i].title} - Uygulama Örnekleri`,
        `${unitNames[i].title} - Problem Çözme`,
        `${unitNames[i].title} - Proje Geliştirme`,
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

    console.log("7th grade Bilgisayar Bilimleri course created successfully.");
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
  // For "Bilgisayar Sistemleri" unit (Computer Systems)
  if (unitTitle === "Bilgisayar Sistemleri") {
    if (challengeOrder === 1 && optionOrder === 3) return true;
    if (challengeOrder === 2 && optionOrder === 1) return true;
    if (challengeOrder === 3 && optionOrder === 4) return true;
    if (challengeOrder === 4 && optionOrder === 2) return true;
    if (challengeOrder === 5 && optionOrder === 1) return true;
    if (challengeOrder === 6 && optionOrder === 3) return true;
    if (challengeOrder === 7 && optionOrder === 2) return true;
    if (challengeOrder === 8 && optionOrder === 4) return true;
    if (challengeOrder === 9 && optionOrder === 1) return true;
    if (challengeOrder === 10 && optionOrder === 3) return true;
  }
  
  // For "Algoritma ve Akış Şemaları" unit (Algorithms and Flowcharts)
  else if (unitTitle === "Algoritma ve Akış Şemaları") {
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
  
  // For "Programlama Temelleri" unit (Programming Basics)
  else if (unitTitle === "Programlama Temelleri") {
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
  // Questions for Bilgisayar Sistemleri (Computer Systems)
  if (unitTitle === "Bilgisayar Sistemleri") {
    const questions = [
      "Bilgisayarın temel bileşenleri nelerdir?",
      "İşlemci (CPU) nedir?",
      "RAM nedir?",
      "ROM nedir?",
      "Donanım ve yazılım arasındaki fark nedir?",
      "İşletim sistemi nedir?",
      "Uygulama yazılımı nedir?",
      "Giriş ve çıkış birimleri nelerdir?",
      "Depolama birimleri nelerdir?",
      "Bilgisayarda kaç tür bellek vardır?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Algoritma ve Akış Şemaları (Algorithms and Flowcharts)
  if (unitTitle === "Algoritma ve Akış Şemaları") {
    const questions = [
      "Algoritma nedir?",
      "Akış şeması nedir?",
      "Akış şemasında dikdörtgen sembolü neyi temsil eder?",
      "Akış şemasında elmas sembolü neyi temsil eder?",
      "Akış şemasında paralel kenar sembolü neyi temsil eder?",
      "Bir algoritmanın özellikleri nelerdir?",
      "Problem çözme aşamaları nelerdir?",
      "Sözde kod (pseudocode) nedir?",
      "İki sayının toplamını bulan bir algoritma nasıl yazılır?",
      "Bir sayının faktöriyelini hesaplayan algoritmanın adımları nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Programlama Temelleri (Programming Basics)
  if (unitTitle === "Programlama Temelleri") {
    const questions = [
      "Programlama nedir?",
      "Programlama dili nedir?",
      "Yüksek seviyeli ve düşük seviyeli programlama dilleri arasındaki fark nedir?",
      "Derleyici nedir?",
      "Yorumlayıcı (interpreter) nedir?",
      "Sözdizimi (syntax) nedir?",
      "Mantıksal hata nedir?",
      "Çalışma zamanı hatası nedir?",
      "Derleme zamanı hatası nedir?",
      "Programlamada hata ayıklama (debugging) ne demektir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Değişkenler ve Veri Tipleri (Variables and Data Types)
  if (unitTitle === "Değişkenler ve Veri Tipleri") {
    const questions = [
      "Değişken nedir?",
      "Tamsayı (integer) veri tipi nedir?",
      "Ondalıklı sayı (float) veri tipi nedir?",
      "Karakter dizisi (string) veri tipi nedir?",
      "Mantıksal (boolean) veri tipi nedir?",
      "Sabit (constant) nedir?",
      "Tür dönüşümü nedir?",
      "Global ve yerel değişkenler arasındaki fark nedir?",
      "Değişken isimlendirme kuralları nelerdir?",
      "Operatör nedir ve çeşitleri nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Koşullu İfadeler (Conditional Statements)
  if (unitTitle === "Koşullu İfadeler") {
    const questions = [
      "Koşullu ifade nedir?",
      "if-else yapısı nasıl kullanılır?",
      "else-if yapısı nedir?",
      "switch-case yapısı nasıl kullanılır?",
      "Karşılaştırma operatörleri nelerdir?",
      "Mantıksal operatörler nelerdir?",
      "İç içe koşullu ifadeler nasıl kullanılır?",
      "Üçlü operatör (ternary operator) nedir?",
      "Koşullu ifadelerde kısa devre değerlendirmesi (short circuit evaluation) nedir?",
      "Bir sayının pozitif, negatif veya sıfır olduğunu kontrol eden koşullu ifade nasıl yazılır?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Döngüler (Loops)
  if (unitTitle === "Döngüler") {
    const questions = [
      "Döngü nedir?",
      "for döngüsü nasıl kullanılır?",
      "while döngüsü nasıl kullanılır?",
      "do-while döngüsü nasıl kullanılır?",
      "for, while ve do-while döngüleri arasındaki farklar nelerdir?",
      "Sonsuz döngü nedir?",
      "break ifadesi ne işe yarar?",
      "continue ifadesi ne işe yarar?",
      "İç içe döngüler nasıl kullanılır?",
      "Bir dizinin elemanlarını ekrana yazdırmak için hangi döngü kullanılabilir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Fonksiyonlar (Functions)
  if (unitTitle === "Fonksiyonlar") {
    const questions = [
      "Fonksiyon nedir?",
      "Fonksiyon tanımlama ve çağırma nasıl yapılır?",
      "Parametre nedir?",
      "Argüman nedir?",
      "Geri dönüş değeri (return value) nedir?",
      "Void fonksiyon nedir?",
      "Yerel (local) ve global değişkenler arasındaki fark nedir?",
      "Rekürsif fonksiyon nedir?",
      "Fonksiyonların avantajları nelerdir?",
      "Fonksiyon aşırı yükleme (function overloading) nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Diziler (Arrays)
  if (unitTitle === "Diziler") {
    const questions = [
      "Dizi nedir?",
      "Dizileri tanımlama ve başlatma nasıl yapılır?",
      "Dizilere erişim nasıl sağlanır?",
      "Çok boyutlu diziler nedir?",
      "Dizilerin boyutu nasıl belirlenir?",
      "Dizi elemanlarını sıralama nasıl yapılır?",
      "Dizi içinde arama nasıl yapılır?",
      "Dizilerde en büyük ve en küçük elemanı bulma nasıl yapılır?",
      "Dizi elemanlarının toplamını bulma nasıl yapılır?",
      "Dizi elemanlarının ortalamasını bulma nasıl yapılır?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Web Tasarım (Web Design)
  if (unitTitle === "Web Tasarım") {
    const questions = [
      "HTML nedir?",
      "CSS nedir?",
      "HTML etiketleri (tags) nedir?",
      "HTML sayfasının temel yapısı nasıldır?",
      "Başlık etiketleri nelerdir?",
      "Paragraf etiketi nasıl kullanılır?",
      "Bağlantı (link) oluşturma nasıl yapılır?",
      "Resim ekleme nasıl yapılır?",
      "CSS ile metin özellikleri nasıl değiştirilir?",
      "CSS ile arka plan rengi nasıl değiştirilir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Siber Güvenlik (Cyber Security)
  if (unitTitle === "Siber Güvenlik") {
    const questions = [
      "Siber güvenlik nedir?",
      "Kişisel verilerin korunması neden önemlidir?",
      "Güçlü bir şifre nasıl oluşturulur?",
      "Virüs nedir?",
      "Kötü amaçlı yazılımlar (malware) nelerdir?",
      "Phishing (oltalama) saldırısı nedir?",
      "İnternette güvenli alışveriş yapmak için nelere dikkat edilmelidir?",
      "Sosyal medya kullanırken hangi güvenlik önlemleri alınmalıdır?",
      "Firewall (güvenlik duvarı) nedir?",
      "Güvenlik güncellemeleri neden önemlidir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Default question for other units
  return `${unitTitle} ile ilgili soru ${challengeOrder}`;
};

// Function to generate options based on unit, lesson, and challenge
const getOption = (unitTitle: string, lessonOrder: number, challengeOrder: number, optionOrder: number): string => {
  // Options for Bilgisayar Sistemleri (Computer Systems)
  if (unitTitle === "Bilgisayar Sistemleri") {
    if (challengeOrder === 1) { // Bilgisayarın temel bileşenleri nelerdir?
      const options = [
        "İşlemci, anakart, RAM, sabit disk, güç kaynağı",
        "Sadece monitör ve klavye",
        "Sadece işletim sistemi ve uygulamalar",
        "Sadece fare ve yazıcı"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // İşlemci (CPU) nedir?
      const options = [
        "Bilgisayarın ekranıdır",
        "Bilgisayarın beynidir, tüm hesaplamaları ve işlemleri yapar",
        "Bilgisayarın geçici belleğidir",
        "Bilgisayarın kalıcı depolama birimidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // RAM nedir?
      const options = [
        "Bilgisayarın kalıcı depolama birimidir",
        "Bilgisayarın geçici belleğidir, çalışan programlar burada tutulur",
        "Bilgisayarın işlemcisidir",
        "Bilgisayarın ekranıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // ROM nedir?
      const options = [
        "Geçici veri depolama birimidir",
        "Salt okunur bellek birimidir",
        "İşlemcidir",
        "Görüntü işleme birimidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Donanım ve yazılım arasındaki fark nedir?
      const options = [
        "Donanım bilgisayarın fiziksel parçalarıdır, yazılım ise bilgisayara ne yapması gerektiğini söyleyen programlardır",
        "Donanım RAM'dir, yazılım ROM'dur",
        "Donanım yazılımı çalıştıran programdır",
        "Donanım klavye ve faredir, yazılım ise monitördür"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Algoritma ve Akış Şemaları (Algorithms and Flowcharts)
  if (unitTitle === "Algoritma ve Akış Şemaları") {
    if (challengeOrder === 1) { // Algoritma nedir?
      const options = [
        "Bilgisayar donanımıdır",
        "Bir problemi çözmek için adım adım izlenen yol ve yöntemdir",
        "Bilgisayar programlama dilidir",
        "Bilgisayar virüsüdür"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Akış şeması nedir?
      const options = [
        "Bilgisayar programıdır",
        "Algoritmanın şekillerle gösterimidir",
        "Bilgisayar donanımıdır",
        "Bilgisayar virüsüdür"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Akış şemasında dikdörtgen sembolü neyi temsil eder?
      const options = [
        "Karar verme işlemini",
        "İşlem adımını",
        "Giriş/çıkış işlemini",
        "Başlangıç/bitiş noktasını"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Akış şemasında elmas sembolü neyi temsil eder?
      const options = [
        "İşlem adımını",
        "Giriş ve çıkış işlemlerini",
        "Karar verme adımını (if-else)",
        "Başlangıç ve bitiş noktalarını"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Akış şemasında paralel kenar sembolü neyi temsil eder?
      const options = [
        "Karar verme adımını",
        "Giriş ve çıkış işlemlerini",
        "Başlangıç ve bitiş noktalarını",
        "İşlem adımını"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Programlama Temelleri (Programming Basics)
  if (unitTitle === "Programlama Temelleri") {
    if (challengeOrder === 1) { // Programlama nedir?
      const options = [
        "Bilgisayar oyunları oynamaktır",
        "İnternette gezinmektir",
        "Bilgisayara belirli görevleri yerine getirmesi için talimatlar vermektir",
        "Bilgisayar donanımını tamir etmektir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Programlama dili nedir?
      const options = [
        "Bilgisayara komut vermek için kullanılan dildir",
        "İnsanların kendi aralarında konuştuğu dildir",
        "Bilgisayarın kendi kendine konuştuğu dildir",
        "Bilgisayar donanımıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Yüksek seviyeli ve düşük seviyeli programlama dilleri arasındaki fark nedir?
      const options = [
        "Yüksek seviyeli diller daha pahalıdır, düşük seviyeli diller daha ucuzdur",
        "Yüksek seviyeli diller insan diline daha yakındır, düşük seviyeli diller makine diline daha yakındır",
        "Yüksek seviyeli diller sadece oyun programlamada, düşük seviyeli diller sadece web programlamada kullanılır",
        "Yüksek seviyeli diller sadece Windows'ta, düşük seviyeli diller sadece Linux'ta çalışır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Derleyici nedir?
      const options = [
        "Bilgisayarın işlemcisidir",
        "Yazılan kodları düzenleyen editördür",
        "Kodları çalıştıran programdır",
        "Yüksek seviyeli programlama dilinde yazılmış kodu makine diline çeviren programdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Yorumlayıcı (interpreter) nedir?
      const options = [
        "Kodu satır satır çevirip hemen çalıştıran programdır",
        "Kodu bir defada makine diline çeviren programdır",
        "Programcının yazdığı kodları açıklayan bir dokümandır",
        "Bilgisayarın dili çevirmesini sağlayan donanım bileşenidir"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Değişkenler ve Veri Tipleri (Variables and Data Types)
  if (unitTitle === "Değişkenler ve Veri Tipleri") {
    if (challengeOrder === 1) { // Değişken nedir?
      const options = [
        "Sabit bir değeri olan harftir",
        "Programda değeri değişebilen veri depolama birimidir",
        "Sadece sayıları ifade eden harftir",
        "Sadece işlemleri ifade eden harftir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Tamsayı (integer) veri tipi nedir?
      const options = [
        "Tam sayıları depolamak için kullanılan veri tipidir",
        "Ondalıklı sayıları depolamak için kullanılan veri tipidir",
        "Metinleri depolamak için kullanılan veri tipidir",
        "Doğru veya yanlış değerlerini depolamak için kullanılan veri tipidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Ondalıklı sayı (float) veri tipi nedir?
      const options = [
        "Tam sayıları depolamak için kullanılan veri tipidir",
        "Ondalıklı sayıları depolamak için kullanılan veri tipidir",
        "Metinleri depolamak için kullanılan veri tipidir",
        "Doğru veya yanlış değerlerini depolamak için kullanılan veri tipidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Karakter dizisi (string) veri tipi nedir?
      const options = [
        "Tam sayıları depolamak için kullanılan veri tipidir",
        "Ondalıklı sayıları depolamak için kullanılan veri tipidir",
        "Metinleri depolamak için kullanılan veri tipidir",
        "Doğru veya yanlış değerlerini depolamak için kullanılan veri tipidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Mantıksal (boolean) veri tipi nedir?
      const options = [
        "Tam sayıları depolamak için kullanılan veri tipidir",
        "Ondalıklı sayıları depolamak için kullanılan veri tipidir",
        "Metinleri depolamak için kullanılan veri tipidir",
        "Doğru veya yanlış değerlerini depolamak için kullanılan veri tipidir"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Koşullu İfadeler (Conditional Statements)
  if (unitTitle === "Koşullu İfadeler") {
    if (challengeOrder === 1) { // If-else yapısı nedir?
      const options = [
        "Belirli bir koşula bağlı olarak farklı kod bloklarının çalıştırılmasını sağlayan yapıdır",
        "Kodun belirli bir kısmını tekrar tekrar çalıştırmak için kullanılan yapıdır",
        "Değişken tanımlamak için kullanılan yapıdır",
        "Fonksiyon tanımlamak için kullanılan yapıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Switch-case yapısı nedir?
      const options = [
        "Değişken tanımlamak için kullanılan yapıdır",
        "Bir değişkenin değerine göre farklı kod bloklarının çalıştırılmasını sağlayan yapıdır",
        "Kodun belirli bir kısmını tekrar tekrar çalıştırmak için kullanılan yapıdır",
        "Fonksiyon tanımlamak için kullanılan yapıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Mantıksal operatörler nelerdir?
      const options = [
        "AND (&&), OR (||), NOT (!)",
        "Toplama (+), Çıkarma (-), Çarpma (*), Bölme (/)",
        "Büyüktür (>), Küçüktür (<), Eşittir (=)",
        "Artırma (++), Azaltma (--)"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Döngüler (Loops)
  if (unitTitle === "Döngüler") {
    if (challengeOrder === 1) { // Döngü nedir?
      const options = [
        "Kodun belirli bir kısmını tekrar tekrar çalıştırmak için kullanılan yapıdır",
        "Koşula bağlı olarak farklı kod bloklarının çalıştırılmasını sağlayan yapıdır",
        "Değişken tanımlamak için kullanılan yapıdır",
        "Fonksiyon tanımlamak için kullanılan yapıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // for döngüsü nasıl kullanılır?
      const options = [
        "for (başlangıç; koşul; artırma/azaltma) { yapılacak işlemler }",
        "while (koşul) { yapılacak işlemler }",
        "if (koşul) { yapılacak işlemler }",
        "function isim() { yapılacak işlemler }"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // while döngüsü nasıl kullanılır?
      const options = [
        "for (başlangıç; koşul; artırma/azaltma) { yapılacak işlemler }",
        "while (koşul) { yapılacak işlemler }",
        "if (koşul) { yapılacak işlemler }",
        "function isim() { yapılacak işlemler }"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Fonksiyonlar (Functions)
  if (unitTitle === "Fonksiyonlar") {
    if (challengeOrder === 1) { // Fonksiyon nedir?
      const options = [
        "Belirli bir görevi yerine getirmek için tasarlanmış, tekrar kullanılabilir kod bloğudur",
        "Değişken tanımlamak için kullanılan yapıdır",
        "Döngü oluşturmak için kullanılan yapıdır",
        "Koşullu ifade oluşturmak için kullanılan yapıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Fonksiyon tanımlama ve çağırma nasıl yapılır?
      const options = [
        "function isim() { ... } ve isim();",
        "for (i=0; i<10; i++) { ... }",
        "if (koşul) { ... }",
        "var değişken = değer;"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Parametre nedir?
      const options = [
        "Fonksiyonun geri döndürdüğü değerdir",
        "Fonksiyona gönderilen değerdir",
        "Fonksiyon içinde tanımlanan değişkendir",
        "Fonksiyonun adıdır"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Diziler (Arrays)
  if (unitTitle === "Diziler") {
    if (challengeOrder === 1) { // Dizi nedir?
      const options = [
        "Aynı türden birden fazla değeri tek bir değişkende saklayan veri yapısıdır",
        "Tek bir değeri saklayan değişkendir",
        "Fonksiyon tanımlamak için kullanılan yapıdır",
        "Koşullu ifade oluşturmak için kullanılan yapıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Dizileri tanımlama ve başlatma nasıl yapılır?
      const options = [
        "var dizi = [1, 2, 3, 4, 5];",
        "function dizi() { ... }",
        "if (dizi) { ... }",
        "for (dizi=0; dizi<10; dizi++) { ... }"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Dizilere erişim nasıl sağlanır?
      const options = [
        "dizi[indeks] şeklinde erişilir, indeks 0'dan başlar",
        "dizi.indeks şeklinde erişilir, indeks 1'den başlar",
        "dizi(indeks) şeklinde erişilir",
        "dizi->indeks şeklinde erişilir"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Web Tasarım (Web Design)
  if (unitTitle === "Web Tasarım") {
    if (challengeOrder === 1) { // HTML nedir?
      const options = [
        "Web sayfalarının yapısını oluşturmak için kullanılan işaretleme dilidir",
        "Web sayfalarının stilini belirlemek için kullanılan dildir",
        "Web sayfalarına dinamik özellikler eklemek için kullanılan programlama dilidir",
        "Web sayfalarını sunucuya yüklemek için kullanılan protokoldür"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // CSS nedir?
      const options = [
        "Web sayfalarının yapısını oluşturmak için kullanılan işaretleme dilidir",
        "Web sayfalarının stilini belirlemek için kullanılan dildir",
        "Web sayfalarına dinamik özellikler eklemek için kullanılan programlama dilidir",
        "Web sayfalarını sunucuya yüklemek için kullanılan protokoldür"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // HTML etiketleri (tags) nedir?
      const options = [
        "HTML kodunda içeriği işaretlemek için kullanılan <etiket> </etiket> şeklindeki yapılardır",
        "CSS'de stil tanımlamak için kullanılan yapılardır",
        "JavaScript'te fonksiyon tanımlamak için kullanılan yapılardır",
        "Web sayfasının adresini belirten yapılardır"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Siber Güvenlik (Cyber Security)
  if (unitTitle === "Siber Güvenlik") {
    if (challengeOrder === 1) { // Siber güvenlik nedir?
      const options = [
        "Bilgisayar sistemlerini, ağları ve verileri kötü niyetli saldırılardan koruma uygulamasıdır",
        "İnternet hızını artırmak için kullanılan teknolojilerdir",
        "Bilgisayar donanımını yükseltme işlemidir",
        "Yazılım geliştirme sürecidir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Kişisel verilerin korunması neden önemlidir?
      const options = [
        "Kimlik hırsızlığı, dolandırıcılık ve özel hayatın gizliliğinin ihlali gibi riskleri önlemek için",
        "Bilgisayarın daha hızlı çalışmasını sağlamak için",
        "İnternet bağlantısını güçlendirmek için",
        "Yazılımların daha iyi çalışmasını sağlamak için"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Güçlü bir şifre nasıl oluşturulur?
      const options = [
        "Büyük-küçük harf, rakam ve özel karakterler içeren, uzun ve tahmin edilmesi zor şifreler kullanarak",
        "Sadece rakamlardan oluşan şifreler kullanarak",
        "Doğum tarihi, isim gibi kişisel bilgileri şifre olarak kullanarak",
        "Tüm hesaplar için aynı şifreyi kullanarak"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Meaningful options for other computer science questions
  const csOptions = [
    "Programlama dilleriyle ilgili bir kavramdır",
    "Bilgisayar donanımıyla ilgili bir kavramdır",
    "Algoritma ve veri yapılarıyla ilgili bir kavramdır",
    "Bilgisayar ağları ve internet ile ilgili bir kavramdır"
  ];
  
  return csOptions[optionOrder - 1];
};

main().catch((err) => {
  console.error(
    "An error occurred while attempting to seed the database:",
    err
  );
}); 