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
    console.log("Creating Bilgisayar Bilimleri (Computer Science) course for 8th grade");

    // Insert the course
    const [course] = await db
      .insert(schema.courses)
      .values({ title: "Bilgisayar Bilimleri 8. Sınıf", imageSrc: "/bilgisayar-bilimleri-8.svg" })
      .returning();

    // Unit names for 8th grade Computer Science in Turkish curriculum
    const unitNames = [
      { title: "İleri Programlama", description: "Algoritma ve kodlama becerileri" },
      { title: "Veri Yapıları", description: "Temel veri yapıları ve kullanımları" },
      { title: "Web Geliştirme", description: "HTML, CSS ve JavaScript ile web tasarımı" },
      { title: "Mobil Uygulama Geliştirme", description: "Temel mobil uygulama geliştirme" },
      { title: "Siber Güvenlik", description: "Güvenli internet kullanımı ve temel güvenlik önlemleri" },
      { title: "Veri Tabanları", description: "Veri tabanı tasarımı ve yönetimi" },
      { title: "Yapay Zeka", description: "Yapay zeka ve makine öğrenmesi temelleri" },
      { title: "Robotik", description: "Robotik sistemler ve programlama" },
      { title: "İşletim Sistemleri", description: "İşletim sistemleri ve temel özellikleri" },
      { title: "Bilişim Etiği", description: "Dijital vatandaşlık ve etik kurallar" }
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
        `${unitNames[i].title} - Uygulama Geliştirme`,
        `${unitNames[i].title} - İleri Uygulamalar`,
        `${unitNames[i].title} - Projeler`,
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

    console.log("8th grade Bilgisayar Bilimleri course created successfully.");
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
  // For "İleri Programlama" unit
  if (unitTitle === "İleri Programlama") {
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
  
  // For "Veri Yapıları" unit
  else if (unitTitle === "Veri Yapıları") {
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
  
  // For "Web Geliştirme" unit
  else if (unitTitle === "Web Geliştirme") {
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
  // Questions for İleri Programlama (Advanced Programming)
  if (unitTitle === "İleri Programlama") {
    const questions = [
      "Algoritma nedir?",
      "Fonksiyon ve prosedür arasındaki fark nedir?",
      "Nesne yönelimli programlamanın temel özellikleri nelerdir?",
      "Kalıtım (inheritance) nedir?",
      "Kapsülleme (encapsulation) nedir?",
      "Polimorfizm (polymorphism) nedir?",
      "Soyutlama (abstraction) nedir?",
      "Recursive (özyinelemeli) fonksiyon nedir?",
      "Hata yakalama (exception handling) nedir?",
      "Modüler programlama nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Veri Yapıları (Data Structures)
  if (unitTitle === "Veri Yapıları") {
    const questions = [
      "Veri yapısı nedir?",
      "Dizi (array) nedir?",
      "Bağlı liste (linked list) nedir?",
      "Yığın (stack) veri yapısı nedir?",
      "Kuyruk (queue) veri yapısı nedir?",
      "Ağaç (tree) veri yapısı nedir?",
      "Hash tablosu nedir?",
      "Veri yapılarının program performansına etkisi nedir?",
      "Veri yapısı seçiminde dikkat edilmesi gereken faktörler nelerdir?",
      "Zaman karmaşıklığı (time complexity) nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Web Geliştirme (Web Development)
  if (unitTitle === "Web Geliştirme") {
    const questions = [
      "HTML nedir?",
      "CSS nedir?",
      "JavaScript nedir?",
      "HTML elementleri (etiketleri) nelerdir?",
      "CSS seçicileri (selectors) nelerdir?",
      "Responsive (duyarlı) web tasarımı nedir?",
      "HTML formları nasıl oluşturulur?",
      "CSS Grid ve Flexbox nedir?",
      "JavaScript ile DOM manipülasyonu nasıl yapılır?",
      "Web tarayıcısında çerezler (cookies) nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Mobil Uygulama Geliştirme (Mobile App Development)
  if (unitTitle === "Mobil Uygulama Geliştirme") {
    const questions = [
      "Mobil uygulama geliştirme platformları nelerdir?",
      "Mobil işletim sistemleri hangileridir?",
      "Uygulama yaşam döngüsü (application lifecycle) nedir?",
      "UI (Kullanıcı Arayüzü) tasarımının önemi nedir?",
      "Dokunmatik ekran için tasarım prensipleri nelerdir?",
      "Mobil cihazlardaki sensörler nelerdir?",
      "Konum tabanlı hizmetler nasıl çalışır?",
      "Mobil uygulamalarda verilerin saklanması için hangi yöntemler kullanılır?",
      "App Store ve Google Play Store'a uygulama yükleme süreci nasıldır?",
      "Kullanıcı deneyimi (UX) nedir ve neden önemlidir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Siber Güvenlik (Cyber Security)
  if (unitTitle === "Siber Güvenlik") {
    const questions = [
      "Siber güvenlik nedir?",
      "Kötü amaçlı yazılım (malware) türleri nelerdir?",
      "Güçlü şifre oluşturma kriterleri nelerdir?",
      "Kimlik avı (phishing) saldırıları nedir?",
      "Güvenlik duvarı (firewall) nedir?",
      "İki faktörlü kimlik doğrulama nedir?",
      "Şifreleme (encryption) nedir?",
      "Sosyal medyada güvenlik önlemleri nelerdir?",
      "VPN (Sanal Özel Ağ) nedir ve ne için kullanılır?",
      "Dijital ayak izi nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Veri Tabanları (Databases)
  if (unitTitle === "Veri Tabanları") {
    const questions = [
      "Veri tabanı nedir?",
      "İlişkisel veri tabanı nedir?",
      "SQL nedir?",
      "Veri tabanı tabloları arasındaki ilişki türleri nelerdir?",
      "Birincil anahtar (primary key) nedir?",
      "Yabancı anahtar (foreign key) nedir?",
      "Normalize edilmiş veri tabanı nedir?",
      "CRUD işlemleri nelerdir?",
      "NoSQL veri tabanları nedir?",
      "Veri tabanı güvenliği nasıl sağlanır?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Yapay Zeka (Artificial Intelligence)
  if (unitTitle === "Yapay Zeka") {
    const questions = [
      "Yapay zeka nedir?",
      "Makine öğrenmesi nedir?",
      "Derin öğrenme nedir?",
      "Yapay sinir ağları nasıl çalışır?",
      "Denetimli öğrenme (supervised learning) nedir?",
      "Denetimsiz öğrenme (unsupervised learning) nedir?",
      "Pekiştirmeli öğrenme (reinforcement learning) nedir?",
      "Doğal dil işleme (NLP) nedir?",
      "Bilgisayarlı görü (computer vision) nedir?",
      "Yapay zekanın günlük hayattaki uygulamaları nelerdir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Robotik (Robotics)
  if (unitTitle === "Robotik") {
    const questions = [
      "Robotik nedir?",
      "Robot türleri nelerdir?",
      "Sensör tipleri nelerdir?",
      "Aktüatör (eyleyici) nedir?",
      "Robotların programlanması nasıl yapılır?",
      "Mikrodenetleyiciler nedir ve robotlarda nasıl kullanılır?",
      "Arduino nedir?",
      "LEGO Mindstorms nedir?",
      "Robot kolu nasıl programlanır?",
      "Otonom robotlar nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for İşletim Sistemleri (Operating Systems)
  if (unitTitle === "İşletim Sistemleri") {
    const questions = [
      "İşletim sistemi nedir?",
      "İşletim sisteminin temel görevleri nelerdir?",
      "Yaygın işletim sistemleri hangileridir?",
      "İşletim sistemi çekirdeği (kernel) nedir?",
      "İşletim sisteminde süreçler (processes) nedir?",
      "İşletim sisteminde bellek yönetimi nasıl yapılır?",
      "İşletim sisteminde dosya sistemi nedir?",
      "İşletim sistemleri arasındaki temel farklar nelerdir?",
      "Açık kaynak kodlu işletim sistemi nedir?",
      "Sanal makine (virtual machine) nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Questions for Bilişim Etiği (Information Ethics)
  if (unitTitle === "Bilişim Etiği") {
    const questions = [
      "Bilişim etiği nedir?",
      "Dijital vatandaşlık nedir?",
      "Telif hakkı nedir ve neden önemlidir?",
      "Siber zorbalık nedir ve nasıl önlenir?",
      "Kişisel verilerin korunması neden önemlidir?",
      "İnternet ve sosyal medya bağımlılığı nedir?",
      "Bilişim dünyasında etik olmayan davranışlar nelerdir?",
      "Veri gizliliği nedir?",
      "Açık kaynak ve özgür yazılım felsefesi nedir?",
      "Dijital ayak izi yönetimi nasıl yapılır?"
    ];
    return questions[challengeOrder - 1];
  }
  
  // Default question for other units
  return `${unitTitle} ile ilgili soru ${challengeOrder}`;
};

// Function to generate options based on unit, lesson, and challenge
const getOption = (unitTitle: string, lessonOrder: number, challengeOrder: number, optionOrder: number): string => {
  // Options for İleri Programlama (Advanced Programming)
  if (unitTitle === "İleri Programlama") {
    if (challengeOrder === 1) { // Algoritma nedir?
      const options = [
        "Bilgisayarın donanım bileşenlerinden biridir",
        "Programlama dillerinin genel ismidir",
        "Bir problemi çözmek için adım adım izlenen yol ve yöntemdir",
        "Bilgisayar ekranında görülen grafik arayüzdür"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Fonksiyon ve prosedür arasındaki fark nedir?
      const options = [
        "Fonksiyon değer döndürürken, prosedür değer döndürmez",
        "Fonksiyon ve prosedür aynı şeylerdir",
        "Prosedürler sadece matematiksel işlemlerde kullanılır",
        "Fonksiyonlar sadece metin işlemlerinde kullanılır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Nesne yönelimli programlamanın temel özellikleri nelerdir?
      const options = [
        "Veri yapıları, algoritma, doğrusal programlama",
        "Mantıksal işlemler, veri akışı, değişkenler",
        "Operatörler, döngüler, diziler",
        "Kalıtım, polimorfizm, kapsülleme, soyutlama"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Kalıtım (inheritance) nedir?
      const options = [
        "Programdaki hataları ayıklama yöntemi",
        "Bir sınıfın başka bir sınıfın özelliklerini ve davranışlarını devralmasıdır",
        "Verilerin düzenli şekilde saklanması",
        "Farklı programlama dillerinin bir arada kullanılması"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Kapsülleme (encapsulation) nedir?
      const options = [
        "Programlama dillerinde kullanılan kütüphaneler",
        "Programın çalışma hızını artıran teknik",
        "Verilerin ve metodların bir arada tutulup, dış erişime karşı koruma sağlayan mekanizmadır",
        "Bilgisayarın işlemci gücünü artıran yöntem"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Veri Yapıları (Data Structures)
  if (unitTitle === "Veri Yapıları") {
    if (challengeOrder === 1) { // Veri yapısı nedir?
      const options = [
        "Bilgisayarın donanım özellikleri",
        "Verilerin organize edilme ve saklanma biçimidir",
        "İşletim sisteminin parçası",
        "Bilgisayarda kullanılan bellek türü"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // Dizi (array) nedir?
      const options = [
        "Birbirine bağlı düğümlerden oluşan veri yapısı",
        "Son giren ilk çıkar prensibine göre çalışan veri yapısı",
        "İlk giren ilk çıkar prensibine göre çalışan veri yapısı",
        "Aynı türdeki değerleri bellekte ardışık olarak saklayan veri yapısıdır"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // Bağlı liste (linked list) nedir?
      const options = [
        "Her elemanın bir önceki ve sonraki elemana işaretçilerle bağlandığı veri yapısıdır",
        "Verilerin ağaç şeklinde organize edildiği yapı",
        "Birbirinden bağımsız veri parçalarının topluluğu",
        "Sadece sayısal verileri tutan yapı"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // Yığın (stack) veri yapısı nedir?
      const options = [
        "İlk giren ilk çıkar prensibine göre çalışan veri yapısı",
        "Her düğümün birden fazla çocuğu olabildiği yapı",
        "Son giren ilk çıkar (LIFO) prensibine göre çalışan veri yapısıdır",
        "Verilerin rastgele erişilebildiği yapı"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // Kuyruk (queue) veri yapısı nedir?
      const options = [
        "Son giren ilk çıkar prensibine göre çalışan veri yapısı",
        "İlk giren ilk çıkar (FIFO) prensibine göre çalışan veri yapısıdır",
        "Verilerin hiyerarşik düzende saklandığı yapı",
        "Sadece anahtar-değer çiftlerini tutan yapı"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Options for Web Geliştirme (Web Development)
  if (unitTitle === "Web Geliştirme") {
    if (challengeOrder === 1) { // HTML nedir?
      const options = [
        "Web sayfalarının yapısını tanımlamak için kullanılan işaretleme dilidir",
        "Web sayfalarına stil eklemek için kullanılan dil",
        "Web sayfalarına etkileşim eklemek için kullanılan programlama dili",
        "Web tarayıcısı türü"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 2) { // CSS nedir?
      const options = [
        "Web sunucusu yazılımı",
        "Veritabanı yönetim sistemi",
        "Web sayfalarının görünümünü ve stilini düzenlemek için kullanılan stil dilidir",
        "Web tarayıcısı"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 3) { // JavaScript nedir?
      const options = [
        "Web sunucusu programlama dili",
        "Web sayfalarına etkileşim ve dinamiklik eklemek için kullanılan programlama dilidir",
        "Web sayfası düzenleme programı",
        "Tarayıcı türü"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 4) { // HTML elementleri (etiketleri) nelerdir?
      const options = [
        "Programlama dilindeki fonksiyonlar",
        "Veritabanı tabloları",
        "CSS özellikleri",
        "HTML belgesinin yapı taşları olan başlık, paragraf, liste gibi bileşenlerdir"
      ];
      return options[optionOrder - 1];
    }
    if (challengeOrder === 5) { // CSS seçicileri (selectors) nelerdir?
      const options = [
        "HTML elementlerini seçip stil uygulamak için kullanılan ifadelerdir",
        "JavaScript fonksiyonları",
        "HTML dosya türleri",
        "Web tarayıcı eklentileri"
      ];
      return options[optionOrder - 1];
    }
  }
  
  // Default options for other units
  const defaultOptions = [
    "Seçenek A",
    "Seçenek B",
    "Seçenek C", 
    "Seçenek D"
  ];
  
  return defaultOptions[optionOrder - 1];
};

main().catch((err) => {
  console.error(
    "An error occurred while attempting to seed the database:",
    err
  );
}); 