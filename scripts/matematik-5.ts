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
    console.log("Creating Matematik (Mathematics) course for 5th grade");

    // Insert the course
    const [course] = await db
      .insert(schema.courses)
      .values({ title: "Matematik 5. Sınıf", imageSrc: "/matematik-5.svg" })
      .returning();

    // Unit names for 5th grade Mathematics in Turkish curriculum
    const unitNames = [
      { title: "Doğal Sayılar", description: "Doğal sayılar ve işlemler" },
      { title: "Kesirler", description: "Kesirler ve kesirlerle işlemler" },
      { title: "Ondalık Gösterim", description: "Ondalık sayılar ve işlemler" },
      { title: "Temel Geometrik Kavramlar", description: "Geometrik şekiller ve ölçüler" },
      { title: "Üçgen ve Dörtgenler", description: "Üçgen ve dörtgenlerin özellikleri" },
      { title: "Veri İşleme", description: "Veri toplama, analiz etme ve yorumlama" },
      { title: "Yüzdeler", description: "Yüzde hesaplamaları ve uygulamaları" },
      { title: "Açılar", description: "Açı ölçümü ve türleri" },
      { title: "Uzunluk ve Zaman Ölçme", description: "Uzunluk ve zaman birimlerini ölçme" },
      { title: "Alan Ölçme", description: "Alan hesaplama ve birimler" }
    ];

    // Create units for the Matematik course
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
        `${unitNames[i].title} - Örnek Problemler`,
        `${unitNames[i].title} - Günlük Hayatta Kullanımı`,
        `${unitNames[i].title} - Problem Çözme Stratejileri`,
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
        
        // Create 10 challenges per lesson
        await createChallenges(lesson.id, unitNames[i].title);
      }
    }

    console.log("5th grade Matematik course created successfully.");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await client.end();
  }
};

// Function to create challenges for a lesson
const createChallenges = async (lessonId: number, unitTitle: string) => {
  // Create 10 challenges per lesson
  for (let i = 1; i <= 10; i++) {
    const [challenge] = await db
      .insert(schema.challenges)
      .values({
        lessonId: lessonId,
        type: "ASSIST",
        question: getQuestion(unitTitle, i),
        order: i,
      })
      .returning();
    
    // Create 4 options for each challenge
    await db.insert(schema.challengeOptions).values([
      {
        challengeId: challenge.id,
        text: getOption(unitTitle, i, 1),
        correct: isCorrect(unitTitle, i, 1),
        imageSrc: null,
        audioSrc: null,
      },
      {
        challengeId: challenge.id,
        text: getOption(unitTitle, i, 2),
        correct: isCorrect(unitTitle, i, 2),
        imageSrc: null,
        audioSrc: null,
      },
      {
        challengeId: challenge.id,
        text: getOption(unitTitle, i, 3),
        correct: isCorrect(unitTitle, i, 3),
        imageSrc: null,
        audioSrc: null,
      },
      {
        challengeId: challenge.id,
        text: getOption(unitTitle, i, 4),
        correct: isCorrect(unitTitle, i, 4),
        imageSrc: null,
        audioSrc: null,
      },
    ]);
  }
};

// Function to generate a question based on unit and challenge order
const getQuestion = (unitTitle: string, challengeOrder: number): string => {
  if (unitTitle === "Doğal Sayılar") {
    const questions = [
      "Doğal sayılar nelerdir?",
      "Basamak değeri nedir?",
      "Doğal sayılar nasıl sıralanır?",
      "Doğal sayılarda toplama işlemi nasıl yapılır?",
      "Doğal sayılarda çıkarma işlemi nasıl yapılır?",
      "Doğal sayılarda çarpma işlemi nasıl yapılır?",
      "Doğal sayılarda bölme işlemi nasıl yapılır?",
      "İşlem önceliği nedir?",
      "Doğal sayılarla ilgili problem nasıl çözülür?",
      "Doğal sayılarla tahmin nasıl yapılır?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Kesirler") {
    const questions = [
      "Kesir nedir?",
      "Birim kesir nedir?",
      "Bileşik kesir nedir?",
      "Tam sayılı kesir nedir?",
      "Denk kesir nedir?",
      "Kesirler nasıl sıralanır?",
      "Kesirlerde toplama işlemi nasıl yapılır?",
      "Kesirlerde çıkarma işlemi nasıl yapılır?",
      "Kesirlerde çarpma işlemi nasıl yapılır?",
      "Kesirlerde bölme işlemi nasıl yapılır?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Ondalık Gösterim") {
    const questions = [
      "Ondalık sayı nedir?",
      "Ondalık sayılar nasıl okunur?",
      "Ondalık sayılar nasıl yazılır?",
      "Ondalık sayılarda basamak değeri nedir?",
      "Ondalık sayılar nasıl sıralanır?",
      "Ondalık sayılarda toplama işlemi nasıl yapılır?",
      "Ondalık sayılarda çıkarma işlemi nasıl yapılır?",
      "Ondalık sayılarda çarpma işlemi nasıl yapılır?",
      "Ondalık sayılarda bölme işlemi nasıl yapılır?",
      "Ondalık sayılarla ilgili problemler nasıl çözülür?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Temel Geometrik Kavramlar") {
    const questions = [
      "Nokta, doğru ve düzlem nedir?",
      "Doğru parçası nedir?",
      "Işın nedir?",
      "Açı nedir?",
      "Dik açı nedir?",
      "Geniş açı nedir?",
      "Doğru nedir?",
      "Düzlem nedir?",
      "Geometrik kavramlar ne işe yarar?",
      "Soru çözümünde geometrik kavramlar nasıl kullanılır?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Üçgen ve Dörtgenler") {
    const questions = [
      "Üçgen nedir?",
      "Üçgenin açıları toplamı kaç derecedir?",
      "Üçgenin çeşitleri nelerdir?",
      "Eşkenar üçgen nedir?",
      "İkizkenar üçgen nedir?",
      "Çeşitkenar üçgen nedir?",
      "Dörtgen nedir?",
      "Kare nedir?",
      "Dikdörtgen nedir?",
      "Paralelkenar nedir?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Veri İşleme") {
    const questions = [
      "Veri nedir?",
      "Veri toplama yöntemleri nelerdir?",
      "Sıklık tablosu nedir?",
      "Sütun grafiği nedir?",
      "Çizgi grafiği nedir?",
      "Sütun grafiği nasıl çizilir?",
      "Çizgi grafiği nasıl çizilir?",
      "Grafik okuma nasıl yapılır?",
      "Aritmetik ortalama nedir?",
      "Aritmetik ortalama nasıl hesaplanır?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Yüzdeler") {
    const questions = [
      "Yüzde nedir?",
      "Bir sayının yüzdesi nasıl hesaplanır?",
      "Yüzde problemleri nasıl çözülür?",
      "Yüzde problemi nasıl çözülür?",
      "Bir miktarın yüzde kaçı nasıl bulunur?",
      "Yüzde problemi hangi yöntemle çözülür?",
      "İndirimde ne hesaplanır?",
      "Kar hesabı nasıl yapılır?",
      "Zarar nasıl tanımlanır?",
      "Kesirlerin yüzdeye dönüştürülmesi nasıl yapılır?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Açılar") {
    const questions = [
      "Açı nedir?",
      "Açı nasıl ölçülür?",
      "Dik açı kaç derecedir?",
      "Dar açı kaç derecedir?",
      "Geniş açı kaç derecedir?",
      "Doğru açı nedir?",
      "Ters açılar nedir?",
      "Komşu açılar nedir?",
      "Tümler açılar nedir?",
      "Açı ölçümü nasıl yapılır?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Uzunluk ve Zaman Ölçme") {
    const questions = [
      "Uzunluk ölçü birimleri nelerdir?",
      "Uzunluk dönüşümünde ne yapılır?",
      "Zaman ölçü birimleri nelerdir?",
      "Uzunluk ölçüleri nasıl dönüştürülür?",
      "Çevre nedir?",
      "Saat, dakika, saniye arasındaki ilişki nedir?",
      "Zaman ölçüleri nasıl hesaplanır?",
      "Uzunluk dönüşümü nasıl yapılır?",
      "Zaman problemleri nasıl çözülür?",
      "Zaman problemlerinde hangi yöntem kullanılır?"
    ];
    return questions[challengeOrder - 1];
  }
  if (unitTitle === "Alan Ölçme") {
    const questions = [
      "Alan nedir?",
      "Alan ölçü birimleri nelerdir?",
      "Karenin alanı nasıl hesaplanır?",
      "Dikdörtgenin alanı nasıl hesaplanır?",
      "Üçgenin alanı nasıl hesaplanır?",
      "Alan ölçüleri dönüşümü nasıl yapılır?",
      "Metrekare diğer birimlere göre nasıldır?",
      "Alan hesaplama problemleri nasıl çözülür?",
      "Farklı şekillerin alanları nasıl karşılaştırılır?",
      "Alan ölçme nerelerde kullanılır?"
    ];
    return questions[challengeOrder - 1];
  }
  return `${unitTitle} - Soru ${challengeOrder}: Lütfen cevabı belirleyin.`;
};

// Function to generate options based on unit and challenge order (optionOrder from 1 to 4)
const getOption = (unitTitle: string, challengeOrder: number, optionOrder: number): string => {
  if (unitTitle === "Doğal Sayılar") {
    switch (challengeOrder) {
      case 1:
        return [
          "Sadece tek sayılardır",
          "Sadece 1'den 100'e kadar olan sayılardır",
          "1, 2, 3, 4, … şeklinde olan sayma sayılarıdır",
          "0, 1, 2, 3, 4, … şeklindeki sayılardır"
        ][optionOrder - 1];
      case 2:
        return [
          "Bir sayıdaki rakamın bulunduğu yere göre değeridir",
          "Her rakamın değeri 10'dur",
          "Sadece en sağdaki rakamın değeridir",
          "Bir sayıdaki tüm rakamların toplamıdır"
        ][optionOrder - 1];
      case 3:
        return [
          "En küçük doğal sayı en başa yazılır",
          "Basamak sayısı büyük olan sayı daha büyüktür",
          "Aynı basamak sayısına sahip sayılarda soldan sağa rakamlar karşılaştırılır",
          "Rastgele sıralanabilir"
        ][optionOrder - 1];
      case 4:
        return [
          "Her zaman sonuç en büyük sayıdır",
          "Toplama işlemi birleştirme işlemidir",
          "Toplamanın sonucu her zaman çift sayıdır",
          "Sayılar basamaklarına göre alt alta yazılarak birler basamağından başlanarak toplanır"
        ][optionOrder - 1];
      case 5:
        return [
          "Çıkarma işlemi her zaman büyük sayıdan küçük sayı çıkarılarak yapılır",
          "Çıkarma işleminde eksilen ve çıkan yer değiştirebilir",
          "Sayılar basamaklarına göre alt alta yazılarak birler basamağından başlanarak çıkarılır",
          "Çıkarma işleminin sonucu her zaman tek sayıdır"
        ][optionOrder - 1];
      case 6:
        return [
          "Çarpma işlemi, aynı sayının tekrarlı toplaması şeklinde hesaplanır",
          "Çarpma işlemi, rakamların birbirleriyle toplanmasıyla yapılır",
          "Çarpma işlemi, sayıları yan yana yazarak bulunur",
          "Çarpma işlemi, bir sayıyı diğerinden çıkararak yapılır"
        ][optionOrder - 1];
      case 7:
        return [
          "Bölme işlemi, sayıları toplayarak yapılır",
          "Bölme işlemi, sayının kaç kere diğer sayıyı içerdiğini bulma işlemidir",
          "Bölme işlemi, sayıları çarparak yapılır",
          "Bölme işlemi, sayılar arasındaki farkı bularak yapılır"
        ][optionOrder - 1];
      case 8:
        return [
          "İşlem önceliği, işlemlerin rastgele yapılmasıdır",
          "İşlem önceliği, işlemler arasında özel bir sıralama yapmaktır",
          "İşlem önceliği, hangi işlemin önce yapılacağını belirler",
          "İşlem önceliği, parantez, çarpma, bölme, toplama ve çıkarma sırasına göre belirlenir"
        ][optionOrder - 1];
      case 9:
        return [
          "Sorunun tamamı okunur, sonra cevabı tahmin edilir",
          "Sadece verilen sayıların toplanarak çözülür",
          "Sorunun verileri analiz edilip, adım adım çözüm uygulanır",
          "Soruyu rastgele seçeneklerden biri seçilerek çözülür"
        ][optionOrder - 1];
      case 10:
        return [
          "Yaklaşık değerler kullanılarak hesaplama yapılır",
          "Tam sayılarla kesirli işlemler yapılır",
          "Rakamlar toplanarak bulunur",
          "Sayının tam kısmı göz ardı edilir"
        ][optionOrder - 1];
      default:
        throw new Error("Invalid challenge order for Doğal Sayılar");
    }
  } else if (unitTitle === "Kesirler") {
    switch (challengeOrder) {
      case 1:
        return [
          "Sadece tam sayıları ifade eder",
          "Bir bütünün eşit parçalarından bir veya birkaçını ifade eder",
          "Sadece yarım ifade eden sayılardır",
          "Sadece çeyrek ifade eden sayılardır"
        ][optionOrder - 1];
      case 2:
        return [
          "Payı 2 olan kesirlerdir",
          "Payı ve paydası aynı olan kesirlerdir",
          "Payı paydadan büyük olan kesirlerdir",
          "Payı 1 olan kesirlerdir"
        ][optionOrder - 1];
      case 3:
        return [
          "Payı paydadan büyük veya paydaya eşit olan kesirlerdir",
          "Payı paydadan küçük olan kesirlerdir",
          "Payı 1 olan kesirlerdir",
          "Payı ve paydası aynı olan kesirlerdir"
        ][optionOrder - 1];
      case 4:
        return [
          "Bir tam sayı ile kesrin birleşimidir",
          "Sadece kesirli kısımlardan oluşur",
          "Tam sayılı kesir, tam sayı ile kesrin birleşimidir",
          "Kesirin tam ve kesir kısımları ayrı incelenir"
        ][optionOrder - 1];
      case 5:
        return [
          "Kesirlerin birbirine eşit olduğu durumdur",
          "Kesirlerin pay ve paydalarının aynı oranda büyütülmesi veya küçültülmesidir",
          "İki kesirin de aynı tam sayı kısmı olması durumudur",
          "Kesirlerin değeri farklıdır"
        ][optionOrder - 1];
      case 6:
        return [
          "Kesirler, paydaları farklıysa doğru karşılaştırma yapılamaz",
          "Kesirler, payları farklıysa paya bölünerek bulunur",
          "Kesirler, basit kesirler olarak karşılaştırılır",
          "Kesirler, ortak payda bulunarak sıralanır"
        ][optionOrder - 1];
      case 7:
        return [
          "İlk olarak kesirler paydaları eşit hale getirilir, sonra paylar toplanır",
          "Kesirler doğrudan toplanır",
          "Kesirlerin payları toplanır ve paydaları çarpılır",
          "Kesirlerde toplama yapılmaz, çıkarma yapılır"
        ][optionOrder - 1];
      case 8:
        return [
          "Kesirlerde çıkarma için önce kesirler ortak paydaya getirilir",
          "Kesirlerde çıkarma, paylar doğrudan çıkarılarak yapılır",
          "Kesirlerde çıkarma, ortak payda bulunarak ve payların çıkarılmasıyla yapılır",
          "Kesirlerde çıkarma, kesirleri ters çevirip çarpma ile yapılır"
        ][optionOrder - 1];
      case 9:
        return [
          "Kesirlerde çarpma, önce kesirlerin toplanmasıyla yapılır",
          "Kesirlerde çarpma, payların ve paydaların çarpılmasıyla yapılır",
          "Kesirlerde çarpma, payların çıkarılmasıyla yapılır",
          "Kesirlerde çarpma, kesirleri ters çevirip bölme ile yapılır"
        ][optionOrder - 1];
      case 10:
        return [
          "Kesirlerde bölme, kesirlerin paylarının bölünmesiyle yapılır",
          "Kesirlerde bölme, kesirlerin paydalarının bölünmesiyle yapılır",
          "Kesirlerde bölme, kesirleri ters çevirip çarpmak yerine toplayarak yapılır",
          "Kesirlerde bölme, ikinci kesirin ters çevrilip birinci kesirle çarpılmasıyla yapılır"
        ][optionOrder - 1];
      default:
        throw new Error("Invalid challenge order for Kesirler");
    }
  } else if (unitTitle === "Ondalık Gösterim") {
    switch (challengeOrder) {
      case 1:
        return [
          "Sadece tam sayılardır",
          "Tam kısmı ile kesir kısmının virgülle ayrıldığı sayılardır",
          "Sadece 0 ile 1 arasındaki sayılardır",
          "Sadece negatif sayılardır"
        ][optionOrder - 1];
      case 2:
        return [
          "Virgül 'nokta' olarak okunur",
          "Virgül okunmaz",
          "Virgülden sonraki kısım basamak adlarıyla okunur",
          "Ondalık sayılar okunmaz, sadece yazılır"
        ][optionOrder - 1];
      case 3:
        return [
          "Ondalık sayılar, tam kısmı ve kesir kısmı arasına virgül konarak yazılır",
          "Ondalık sayılar, nokta ile ayrılır",
          "Ondalık sayılar, kesir kısmı önce yazılarak oluşturulur",
          "Ondalık sayılar, rakamlar arasında boşluk bırakılarak yazılır"
        ][optionOrder - 1];
      case 4:
        return [
          "Basamak değeri, rakamın bulunduğu konuma göre belirlenir",
          "Sadece ondalık kısım için geçerlidir",
          "Basamak değeri, sayının büyüklüğünü belirler",
          "Basamak değeri, tam ve kesir kısımlarında rakamın konumunu ifade eder"
        ][optionOrder - 1];
      case 5:
        return [
          "Ondalık sayılar, tam kısımları karşılaştırılarak sıralanır",
          "Ondalık sayılar, önce tam kısım sonra kesir kısmı karşılaştırılarak sıralanır",
          "Ondalık sayılar, sadece kesir kısımları karşılaştırılarak sıralanır",
          "Ondalık sayılar, rastgele sıralanır"
        ][optionOrder - 1];
      case 6:
        return [
          "Ondalık sayılar doğrudan toplanır",
          "Ondalık sayılar kesir kısımları hesaplanmaz",
          "Ondalık sayılar, virgülleri hizalayarak toplanır",
          "Ondalık sayılar, tam ve kesir kısımları ayrı toplanır"
        ][optionOrder - 1];
      case 7:
        return [
          "Ondalık sayılar, virgülleri hizalayarak çıkarılır",
          "Ondalık sayılar, tam kısımları çıkarılır, kesirler göz ardı edilir",
          "Ondalık sayılar, sadece kesir kısımları çıkarılarak yapılır",
          "Ondalık sayılar, çıkarma sırasında yer değiştirilir"
        ][optionOrder - 1];
      case 8:
        return [
          "Ondalık sayılar, normal çarpma işlemi ile çarpılır ve sonra virgül yerleştirilir",
          "Ondalık sayılar, sadece tam kısımlarla çarpılır",
          "Ondalık sayılar, kesir kısımları ayrı çarpılır",
          "Ondalık sayılar, sayıların rakamları çarpılarak virgülden sonra basamak sayısı eklenir"
        ][optionOrder - 1];
      case 9:
        return [
          "Ondalık sayılar doğrudan bölünür",
          "Ondalık sayılar, virgül kaydırılarak tam sayılarla bölünür",
          "Ondalık sayılar, kesir haline getirilip bölünür",
          "Ondalık sayılar, toplanarak bölünür"
        ][optionOrder - 1];
      case 10:
        return [
          "Problemin tüm adımları dikkatlice incelenir ve ondalık sayılar doğru şekilde kullanılır",
          "Ondalık sayılar yuvarlanarak yaklaşık sonuç elde edilir",
          "Soruda verilen veriler analiz edilir, işlemler adım adım uygulanır",
          "Ondalık problemler sadece tam sayılarla çözülür"
        ][optionOrder - 1];
      default:
        throw new Error("Invalid challenge order for Ondalık Gösterim");
    }
  } else if (unitTitle === "Temel Geometrik Kavramlar") {
    switch (challengeOrder) {
      case 1:
        return [
          "Nokta, çizgi veya düzlem değildir",
          "Nokta, boyutsuz bir konum; doğru, iki noktanın uzayda uzanması; düzlem, sonsuz noktanın oluşturduğu yüzeydir",
          "Nokta, küçük bir dairedir",
          "Nokta, geometrik şekillerin bir parçasıdır"
        ][optionOrder - 1];
      case 2:
        return [
          "Doğru parçası, iki nokta arasındaki kesitli doğru parçasıdır",
          "Doğru parçası, sonsuza kadar giden doğrudur",
          "Doğru parçası, bir noktadan oluşur",
          "Doğru parçası, eğimli bir çizgidir"
        ][optionOrder - 1];
      case 3:
        return [
          "Işın, bir noktadan başlayıp belirli bir yönde sonsuza dek giden doğru parçasıdır",
          "Işın, iki nokta arasındaki mesafedir",
          "Işın, düzlemin sınırını belirler",
          "Işın, iki doğrunun kesişimidir"
        ][optionOrder - 1];
      case 4:
        return [
          "Açı, iki ışının ortak bir noktadan ayrılmasıyla oluşur",
          "Açı, iki doğrunun birleşmesidir",
          "Açı, bir nokta etrafında ölçülen dairedir",
          "Açı, doğru parçasının uzantısıdır"
        ][optionOrder - 1];
      case 5:
        return [
          "Dik açı 60 derecedir",
          "Dik açı 45 derecedir",
          "Dik açı 90 derecedir",
          "Dik açı 120 derecedir"
        ][optionOrder - 1];
      case 6:
        return [
          "Geniş açı 100 derecedir",
          "Geniş açı 120 derecedir",
          "Geniş açı 150 derecedir",
          "Geniş açı 180 derecedir"
        ][optionOrder - 1];
      case 7:
        return [
          "Doğru, ışın ve doğru parçası arasında fark yoktur",
          "Doğru, sonsuz noktalardan oluşur",
          "Doğru, başlangıç ve son noktası olan bir doğru parçasıdır",
          "Doğru, eğridir"
        ][optionOrder - 1];
      case 8:
        return [
          "Düzlemde ölçülemeyen bir kavramdır",
          "Düzlem, sadece iki boyutludur",
          "Düzlem, sonsuz noktanın oluşturduğu yüzeydir",
          "Düzlem, üç boyutlu uzayın kesitidir"
        ][optionOrder - 1];
      case 9:
        return [
          "Geometrik kavramlar, gerçek hayatta kullanılmaz",
          "Temel kavramlar, sadece çizim amaçlıdır",
          "Geometrik kavramlar, günlük hayatta mantıklı yorumlamalar yapmamıza yardımcı olur",
          "Geometrik kavramlar, sadece sanatsaldır"
        ][optionOrder - 1];
      case 10:
        return [
          "Öğrenci, soruyu tahmin ederek cevap verir",
          "Soruda verilen bilgilerle adım adım ilerlenir",
          "Rastgele cevaplar seçilir",
          "Cevap, sadece parmak hareketiyle verilir"
        ][optionOrder - 1];
      default:
        throw new Error("Invalid challenge order for Temel Geometrik Kavramlar");
    }
  } else if (unitTitle === "Üçgen ve Dörtgenler") {
    switch (challengeOrder) {
      case 1:
        return [
          "Üç doğru parçasının birleşmesiyle oluşan kapalı şekildir",
          "Dört köşesi olan şekildir",
          "Tüm açıları dik olan şekildir",
          "Tüm kenarları eşit olan şekildir"
        ][optionOrder - 1];
      case 2:
        return [
          "180 derece",
          "90 derece",
          "360 derece",
          "270 derece"
        ][optionOrder - 1];
      case 3:
        return [
          "Dik, geniş, dar üçgen",
          "Eşkenar, ikizkenar, çeşitkenar üçgen",
          "Büyük, orta, küçük üçgen",
          "Kare, dikdörtgen, yamuk üçgen"
        ][optionOrder - 1];
      case 4:
        return [
          "Eşkenar üçgen, tüm kenarları eşit olan üçgendir",
          "İkizkenar üçgen, iki kenarı eşit olan üçgendir",
          "Çeşitkenar üçgen, kenar uzunlukları farklı olan üçgendir",
          "Dik üçgen, bir açısı 90 derece olan üçgendir"
        ][optionOrder - 1];
      case 5:
        return [
          "İkizkenar üçgen, iki kenarı eşittir",
          "Eşkenar üçgen, tüm kenarları eşittir",
          "Çeşitkenar üçgen, tüm açıları eşittir",
          "Dik üçgen, bir açısı 90 derecedir"
        ][optionOrder - 1];
      case 6:
        return [
          "Çeşitkenar üçgen, kenar uzunlukları farklı olan üçgendir",
          "Dik üçgen, kenar uzunlukları farklıdır",
          "Eşkenar üçgen, iki kenarı eşittir",
          "İkizkenar üçgen, kenarları farklı uzunluktadır"
        ][optionOrder - 1];
      case 7:
        return [
          "Dörtgenin özellikleri, kenar uzunlukları ve açıları toplamına bağlıdır",
          "Dörtgen, dört kenarı olan kapalı şekildir",
          "Dörtgen, üç kenarı olan şekildir",
          "Dörtgen, dairesel bir şekildir"
        ][optionOrder - 1];
      case 8:
        return [
          "Karenin tüm kenarları eşit ve açıları 90 derecedir",
          "Dikdörtgenin kenar uzunlukları eşittir",
          "Dikdörtgen, sadece bir açısı 90 derecedir",
          "Kare, sadece kenar uzunluklarına bakılarak tanımlanır"
        ][optionOrder - 1];
      case 9:
        return [
          "Dikdörtgen, karşılıklı kenarları paralel ve açıları 90 derecedir",
          "Dikdörtgen, karşılıklı kenarları paraleldir",
          "Üçgen, dört kenardan oluşur",
          "Yamuk, paralel kenara sahip değildir"
        ][optionOrder - 1];
      case 10:
        return [
          "Paralelkenar, karşılıklı kenarları paralel olan dörtgendir",
          "Dikdörtgen, karşılıklı kenarları paraleldir",
          "Üçgenin alanı, taban ve yükseklik çarpımının yarısıdır",
          "Karede alan, bir kenarın karesidir"
        ][optionOrder - 1];
      default:
        throw new Error("Invalid challenge order for Üçgen ve Dörtgenler");
    }
  } else if (unitTitle === "Veri İşleme") {
    switch (challengeOrder) {
      case 1:
        return [
          "Sayısal bilgilerdir",
          "Toplanmış ve düzenlenmiş bilgilerdir",
          "Sadece grafiklerdir",
          "Sadece tablolardır"
        ][optionOrder - 1];
      case 2:
        return [
          "Sadece gözlem yapmak",
          "Anket, gözlem, deney ve ölçüm yapmak",
          "Sadece kitaplardan okumak",
          "Sadece internetten araştırmak"
        ][optionOrder - 1];
      case 3:
        return [
          "Verilerin tekrarlanma sayılarını gösteren tablodur",
          "Verilerin toplamını gösteren tablodur",
          "Verilerin çarpımını gösteren tablodur",
          "Verilerin sıralandığı tablodur"
        ][optionOrder - 1];
      case 4:
        return [
          "Sütun grafiği, verileri çubuklar halinde gösterir",
          "Çizgi grafiği, verilerin değişimini gösterir",
          "Pasta grafiği, verilerin oranlarını gösterir",
          "Dağılım grafiği, verilerin yayılımını gösterir"
        ][optionOrder - 1];
      case 5:
        return [
          "Çizgi grafiği, verilerin zaman içindeki değişimini gösterir",
          "Sütun grafiği, verileri sıralı olarak gösterir",
          "Pasta grafiği, verilerin toplamını gösterir",
          "Dağılım grafiği, verilerin dağılımını gösterir"
        ][optionOrder - 1];
      case 6:
        return [
          "Sütun grafiği çizilirken eksenler belirlenir",
          "Çizgi grafiği çizilirken noktalar rastgele yerleştirilir",
          "Pasta grafiği çizilirken renkler kullanılmaz",
          "Dağılım grafiği çizilirken veriler toplanmaz"
        ][optionOrder - 1];
      case 7:
        return [
          "Çizgi grafiği çizilirken veriler noktalandırılır",
          "Sütun grafiği çizilirken verilerle oynanır",
          "Pasta grafiği çizilirken dilimler eşitlenir",
          "Dağılım grafiği çizilirken veriler sıralanır"
        ][optionOrder - 1];
      case 8:
        return [
          "Grafik okuma, verilerin yorumlanmasıdır",
          "Grafik okuma, sadece sayıları okumaktır",
          "Grafik okuma, renklerin analizidir",
          "Grafik okuma, çizgilerin takibiyle yapılır"
        ][optionOrder - 1];
      case 9:
        return [
          "Aritmetik ortalama, tüm verilerin toplamının veri sayısına bölünmesidir",
          "Aritmetik ortalama, en büyük ve en küçük verinin toplamıdır",
          "Aritmetik ortalama, verilerin medyanıdır",
          "Aritmetik ortalama, verilerin modudur"
        ][optionOrder - 1];
      case 10:
        return [
          "Aritmetik ortalama, verilerin en yaygın değeridir",
          "Aritmetik ortalama, verilerin toplamının 2 ile bölünmesidir",
          "Aritmetik ortalama, verilerin toplamının veri sayısına bölünmesidir",
          "Aritmetik ortalama, verilerin farklarının toplamıdır"
        ][optionOrder - 1];
      default:
        throw new Error("Invalid challenge order for Veri İşleme");
    }
  } else if (unitTitle === "Yüzdeler") {
    switch (challengeOrder) {
      case 1:
        return [
          "Yüzde bir sayıdır",
          "Yüzde bir kesirdir",
          "Yüzde, bir çokluğun yüzde kaçının alındığını belirten ifadedir",
          "Yüzde, bir sayının karekökünü ifade eder"
        ][optionOrder - 1];
      case 2:
        return [
          "Sayı ile yüzdeyi çarpıp 100'e böleriz",
          "Sayı ile yüzdeyi toplayıp 100'e böleriz",
          "Sayıyı 100 ile çarparız",
          "Sayıyı 100'e böleriz"
        ][optionOrder - 1];
      case 3:
        return [
          "Sadece toplama işlemi yapılır",
          "Oran ve orantı kullanılarak çözülür",
          "Sadece çarpma işlemi yapılır",
          "Sadece bölme işlemi yapılır"
        ][optionOrder - 1];
      case 4:
        return [
          "Yüzde problemi, verilen sayılarla hesaplanmaz",
          "Yüzde problemi, doğru oran bulunmadan çözülemez",
          "Yüzde problemi, yanlış yöntemle çözülür",
          "Yüzde problemi, verilen oran doğru kullanılarak çözülür"
        ][optionOrder - 1];
      case 5:
        return [
          "Bir sayının yüzde kaçı, sayının bölünmesiyle bulunur",
          "Bir miktarın yüzde kaçı, miktarın 100 ile çarpılmasıyla bulunur",
          "Bir miktarın yüzde kaçı, miktarın 100'e bölünmesiyle bulunur",
          "Bir sayının yüzde kaçı, 100 ile toplanarak bulunur"
        ][optionOrder - 1];
      case 6:
        return [
          "Yüzde problemi, her zaman toplama ile çözülür",
          "Yüzde problemi, oran ve orantı kullanılarak çözülür",
          "Yüzde problemi, sadece çarpma ile çözülür",
          "Yüzde problemi, çıkarma yöntemiyle çözülür"
        ][optionOrder - 1];
      case 7:
        return [
          "İndirimde, indirim miktarı direkt çıkarılır",
          "İndirimde, orijinal fiyatla indirimin oranı hesaplanır",
          "İndirimde, indirim yüzdesi ile orijinal fiyat çarpılır",
          "İndirimde, orijinal fiyattan indirim yüzdesi çıkarılır"
        ][optionOrder - 1];
      case 8:
        return [
          "Kar hesabı, maliyet ile satış fiyatı arasındaki farktır",
          "Kar hesabı, satış fiyatının maliyete oranıdır",
          "Kar hesabı, satış fiyatı ile maliyet arasındaki farkın yüzdesidir",
          "Kar hesabı, maliyetin satış fiyatına oranıdır"
        ][optionOrder - 1];
      case 9:
        return [
          "Zarar, sadece maliyetin azalmasıyla oluşur",
          "Zarar, maliyet ile satış fiyatı arasındaki farkın negatif olmasıdır",
          "Zarar, satış fiyatının 100'e bölünmesiyle bulunur",
          "Zarar, indirimle hesaplanır"
        ][optionOrder - 1];
      case 10:
        return [
          "Kesir, yüzdeye dönüştürülemez",
          "Kesir, önce 100 ile çarpılır sonra 100'e bölünür",
          "Kesir, doğrudan 100'e bölünerek yüzde bulunur",
          "Kesir, 100 ile çarpılıp 100'e bölünerek yüzdeye dönüştürülür"
        ][optionOrder - 1];
      default:
        throw new Error("Invalid challenge order for Yüzdeler");
    }
  } else if (unitTitle === "Açılar") {
    switch (challengeOrder) {
      case 1:
        return [
          "Açı, iki yarı düzlemin birleşimidir",
          "Açı, iki ışının kesişimidir",
          "Açı, iki doğru parçasının birleşimidir",
          "Açı, daire dilimidir"
        ][optionOrder - 1];
      case 2:
        return [
          "Açı, derece cinsinden ölçülür",
          "Açı, sadece radyanla ölçülür",
          "Açı, uzunluk birimiyle ölçülür",
          "Açı, zaman birimiyle ölçülür"
        ][optionOrder - 1];
      case 3:
        return [
          "Dik açı 90 derecedir",
          "Dik açı 45 derecedir",
          "Dik açı 60 derecedir",
          "Dik açı 120 derecedir"
        ][optionOrder - 1];
      case 4:
        return [
          "Dar açı 30 derecedir",
          "Dar açı 45 derecedir",
          "Dar açı 60 derecedir",
          "Dar açı 90 derecedir"
        ][optionOrder - 1];
      case 5:
        return [
          "Geniş açı 100 derecedir",
          "Geniş açı 120 derecedir",
          "Geniş açı 150 derecedir",
          "Geniş açı 180 derecedir"
        ][optionOrder - 1];
      case 6:
        return [
          "Doğru açı 180 derecedir",
          "Doğru açı 90 derecedir",
          "Doğru açı 360 derecedir",
          "Doğru açı 0 derecedir"
        ][optionOrder - 1];
      case 7:
        return [
          "Ters açılar, birbirini tamamlayan açılardır",
          "Ters açılar, aynı doğru üzerinde yer alır",
          "Ters açılar, eşit büyüklükteki açılardır",
          "Ters açılar, birbirinin zıt yönünde oluşan açılardır"
        ][optionOrder - 1];
      case 8:
        return [
          "Komşu açılar, birbirini takip eden açılardır",
          "Komşu açılar, toplamı 90 derece olan açılardır",
          "Komşu açılar, ortak bir kenarı paylaşan açılardır",
          "Komşu açılar, eşit olan açılardır"
        ][optionOrder - 1];
      case 9:
        return [
          "Tümler açılar, 360 dereceyi tamamlar",
          "Tümler açılar, 180 dereceyi tamamlar",
          "Tümler açılar, 90 dereceyi tamamlar",
          "Tümler açılar, 270 dereceyi tamamlar"
        ][optionOrder - 1];
      case 10:
        return [
          "Açı ölçümü, sadece cetvelle yapılır",
          "Açı ölçümü, açıölçer ile yapılır",
          "Açı ölçümü, tahminle yapılır",
          "Açı ölçümü, sadece hesap makinesi ile yapılır"
        ][optionOrder - 1];
      default:
        throw new Error("Invalid challenge order for Açılar");
    }
  } else if (unitTitle === "Uzunluk ve Zaman Ölçme") {
    switch (challengeOrder) {
      case 1:
        return [
          "Kilometre, metre, desimetre, santimetre, milimetre",
          "Kilogram, gram, miligram",
          "Litre, mililitre",
          "Saat, dakika, saniye"
        ][optionOrder - 1];
      case 2:
        return [
          "Büyük birimden küçük birime giderken 10 ile çarpılır, küçük birimden büyük birime giderken 10'a bölünür",
          "Büyük birimden küçük birime giderken 10'a bölünür, küçük birimden büyük birime giderken 10 ile çarpılır",
          "Büyük birimden küçük birime giderken 10 ile çarpılır, küçük birimden büyük birime giderken 100'e bölünür",
          "Büyük birimden küçük birime giderken 100 ile çarpılır, küçük birimden büyük birime giderken 10'a bölünür"
        ][optionOrder - 1];
      case 3:
        return [
          "Yıl, ay, hafta, gün, saat, dakika, saniye",
          "Kilometre, metre, santimetre",
          "Kilogram, gram, miligram",
          "Litre, mililitre"
        ][optionOrder - 1];
      case 4:
        return [
          "Uzunluk ölçüleri, basit çarpanlarla birbirine dönüştürülür",
          "Uzunluk ölçüleri, sabit katsayılarla çevrilir",
          "Uzunluk ölçüleri, her zaman 100 ile çarpılır",
          "Uzunluk ölçüleri, toplama ile bulunur"
        ][optionOrder - 1];
      case 5:
        return [
          "Karenin çevresi, kenar uzunluğu ile 4'ün çarpılmasıyla bulunur",
          "Dikdörtgenin çevresi, iki kısa kenar ile iki uzun kenarın toplamıdır",
          "Çevre, sadece kenar uzunluklarının toplamıdır",
          "Çevre, kenarların ortalaması alınarak hesaplanır"
        ][optionOrder - 1];
      case 6:
        return [
          "Saat, dakika, saniye sabit değerlerdir",
          "Saat, dakika, saniye arasında direk oran vardır",
          "Saat, dakika, saniye arasındaki ilişki, 60 tabanlıdır",
          "Zaman ölçüleri, birbirine dönüştürülemez"
        ][optionOrder - 1];
      case 7:
        return [
          "Zaman ölçüleri, önce gün sonra saat şeklinde hesaplanır",
          "Zaman ölçüleri, 24 saatlik dilimlerle sınırlıdır",
          "Zaman ölçüleri, küçük birimden büyük birime giderken çarpılır",
          "Zaman ölçüleri, küçük birimden büyük birime giderken bölünür"
        ][optionOrder - 1];
      case 8:
        return [
          "Uzunluk ölçü dönüşümleri, oran orantı kullanılarak yapılır",
          "Uzunluk ölçü dönüşümleri, toplama çıkarma ile hesaplanır",
          "Uzunluk ölçü dönüşümleri, sabit katsayılarla yapılır",
          "Uzunluk ölçü dönüşümleri, karışık işlemlerle bulunur"
        ][optionOrder - 1];
      case 9:
        return [
          "Zaman problemleri, verilen sürelerin doğrudan karşılaştırılmasıyla çözülür",
          "Zaman problemleri, saat, dakika, saniye dönüşümleriyle hesaplanır",
          "Zaman problemleri, sadece gün sayısı ile belirlenir",
          "Zaman problemleri, rastgele yöntemlerle çözülür"
        ][optionOrder - 1];
      case 10:
        return [
          "Zaman problemlerinde, önce birim dönüşümleri yapılır",
          "Zaman problemlerinde, verilen süreler toplanarak bulunur",
          "Zaman problemlerinde, her adım dikkatle analiz edilir",
          "Zaman problemlerinde, sonuç tahmini yapılır"
        ][optionOrder - 1];
      default:
        throw new Error("Invalid challenge order for Uzunluk ve Zaman Ölçme");
    }
  } else if (unitTitle === "Alan Ölçme") {
    switch (challengeOrder) {
      case 1:
        return [
          "Alan, bir yüzeyin kapladığı düzlemin ölçüsüdür",
          "Alan, kenar uzunluklarının toplamıdır",
          "Alan, hacmin ölçüsüdür",
          "Alan, uzunluğun karesidir"
        ][optionOrder - 1];
      case 2:
        return [
          "Alan ölçü birimleri; metrekare, desimetrekare, santimetrekaredir",
          "Alan ölçü birimleri; metre, santimetre, milimetredir",
          "Alan ölçü birimleri; kilogram, gram, miligramdır",
          "Alan ölçü birimleri; litre, mililitre, santilitredir"
        ][optionOrder - 1];
      case 3:
        return [
          "Karenin alanı, bir kenarın karesi ile hesaplanır",
          "Karenin alanı, kenar uzunluklarının toplamıdır",
          "Karenin alanı, çapın karesi ile hesaplanır",
          "Karenin alanı, kenar uzunluğunun iki katıdır"
        ][optionOrder - 1];
      case 4:
        return [
          "Dikdörtgenin alanı, uzunluk ile genişliğin çarpımıyla bulunur",
          "Dikdörtgenin alanı, kenarların toplamının yarısıdır",
          "Dikdörtgenin alanı, karekök ile hesaplanır",
          "Dikdörtgenin alanı, uzunluk ve genişliğin farkıdır"
        ][optionOrder - 1];
      case 5:
        return [
          "Üçgenin alanı, taban ile yüksekliğin çarpımının yarısıdır",
          "Üçgenin alanı, kenarların toplamıdır",
          "Üçgenin alanı, taban ile yüksekliğin toplamıdır",
          "Üçgenin alanı, tabanın iki katıdır"
        ][optionOrder - 1];
      case 6:
        return [
          "Alan ölçüleri dönüşümleri, sabit oranlarla yapılır",
          "Alan ölçüleri dönüşümleri, toplama çıkarma ile hesaplanır",
          "Alan ölçüleri dönüşümleri, orantı kullanılarak yapılır",
          "Alan ölçüleri dönüşümleri, rastgele hesaplanır"
        ][optionOrder - 1];
      case 7:
        return [
          "Metrekare, desimetrekareye, santimetrekareye göre daha büyük bir ölçüdür",
          "Metrekare, santimetrekareye eşittir",
          "Metrekare, sadece uluslararası sistemde kullanılır",
          "Metrekare, desimetrekareden küçüktür"
        ][optionOrder - 1];
      case 8:
        return [
          "Alan hesaplama problemleri, adım adım çözülür",
          "Alan hesaplama problemleri, sonuç tahminiyle bulunur",
          "Alan hesaplama problemleri, rastgele seçilen yöntemlerle yapılır",
          "Alan hesaplama problemleri, sadece hesap makinesiyle çözülür"
        ][optionOrder - 1];
      case 9:
        return [
          "Farklı şekillerin alanları, doğrudan karşılaştırılabilir",
          "Farklı şekillerin alanları, hesaplanarak karşılaştırılır",
          "Farklı şekillerin alanları, aynı formülle bulunur",
          "Farklı şekillerin alanları, ölçü birimleriyle orantısızdır"
        ][optionOrder - 1];
      case 10:
        return [
          "Alan ölçme, günlük hayatta kullanılan bir beceridir",
          "Alan ölçme, sadece matematikte kullanılır",
          "Alan ölçme, uzay biliminde önemli değildir",
          "Alan ölçme, sadece okullarda öğretilir"
        ][optionOrder - 1];
      default:
        throw new Error("Invalid challenge order for Alan Ölçme");
    }
  } else {
    throw new Error("Unit not recognized");
  }
};

// Function to determine if an option is correct based on unit and challenge order
const isCorrect = (unitTitle: string, challengeOrder: number, optionOrder: number): boolean => {
  if (unitTitle === "Doğal Sayılar") {
    switch (challengeOrder) {
      case 1: return optionOrder === 3;
      case 2: return optionOrder === 1;
      case 3: return optionOrder === 2;
      case 4: return optionOrder === 4;
      case 5: return optionOrder === 3;
      case 6: return optionOrder === 1;
      case 7: return optionOrder === 2;
      case 8: return optionOrder === 4;
      case 9: return optionOrder === 3;
      case 10: return optionOrder === 1;
      default: return false;
    }
  } else if (unitTitle === "Kesirler") {
    switch (challengeOrder) {
      case 1: return optionOrder === 2;
      case 2: return optionOrder === 4;
      case 3: return optionOrder === 1;
      case 4: return optionOrder === 3;
      case 5: return optionOrder === 2;
      case 6: return optionOrder === 4;
      case 7: return optionOrder === 1;
      case 8: return optionOrder === 3;
      case 9: return optionOrder === 2;
      case 10: return optionOrder === 4;
      default: return false;
    }
  } else if (unitTitle === "Ondalık Gösterim") {
    switch (challengeOrder) {
      case 1: return optionOrder === 2;
      case 2: return optionOrder === 3;
      case 3: return optionOrder === 1;
      case 4: return optionOrder === 4;
      case 5: return optionOrder === 2;
      case 6: return optionOrder === 3;
      case 7: return optionOrder === 1;
      case 8: return optionOrder === 4;
      case 9: return optionOrder === 2;
      case 10: return optionOrder === 3;
      default: return false;
    }
  } else if (unitTitle === "Temel Geometrik Kavramlar") {
    switch (challengeOrder) {
      case 1: return optionOrder === 2;
      case 2: return optionOrder === 1;
      case 3: return optionOrder === 1;
      case 4: return optionOrder === 1;
      case 5: return optionOrder === 3;
      case 6: return optionOrder === 2;
      case 7: return optionOrder === 2;
      case 8: return optionOrder === 3;
      case 9: return optionOrder === 3;
      case 10: return optionOrder === 2;
      default: return false;
    }
  } else if (unitTitle === "Üçgen ve Dörtgenler") {
    switch (challengeOrder) {
      case 1: return optionOrder === 1;
      case 2: return optionOrder === 1;
      case 3: return optionOrder === 2;
      case 4: return optionOrder === 1;
      case 5: return optionOrder === 1;
      case 6: return optionOrder === 1;
      case 7: return optionOrder === 2;
      case 8: return optionOrder === 1;
      case 9: return optionOrder === 1;
      case 10: return optionOrder === 1;
      default: return false;
    }
  } else if (unitTitle === "Veri İşleme") {
    switch (challengeOrder) {
      case 1: return optionOrder === 1;
      case 2: return optionOrder === 1;
      case 3: return optionOrder === 1;
      case 4: return optionOrder === 1;
      case 5: return optionOrder === 1;
      case 6: return optionOrder === 1;
      case 7: return optionOrder === 1;
      case 8: return optionOrder === 1;
      case 9: return optionOrder === 1;
      case 10: return optionOrder === 3;
      default: return false;
    }
  } else if (unitTitle === "Yüzdeler") {
    switch (challengeOrder) {
      case 1: return optionOrder === 3;
      case 2: return optionOrder === 4;
      case 3: return optionOrder === 2;
      case 4: return optionOrder === 4;
      case 5: return optionOrder === 3;
      case 6: return optionOrder === 2;
      case 7: return optionOrder === 2;
      case 8: return optionOrder === 3;
      case 9: return optionOrder === 2;
      case 10: return optionOrder === 4;
      default: return false;
    }
  } else if (unitTitle === "Açılar") {
    switch (challengeOrder) {
      case 1: return optionOrder === 1;
      case 2: return optionOrder === 1;
      case 3: return optionOrder === 1;
      case 4: return optionOrder === 2;
      case 5: return optionOrder === 2;
      case 6: return optionOrder === 1;
      case 7: return optionOrder === 4;
      case 8: return optionOrder === 3;
      case 9: return optionOrder === 1;
      case 10: return optionOrder === 2;
      default: return false;
    }
  } else if (unitTitle === "Uzunluk ve Zaman Ölçme") {
    switch (challengeOrder) {
      case 1: return optionOrder === 1;
      case 2: return optionOrder === 1;
      case 3: return optionOrder === 1;
      case 4: return optionOrder === 1;
      case 5: return optionOrder === 1;
      case 6: return optionOrder === 3;
      case 7: return optionOrder === 4;
      case 8: return optionOrder === 1;
      case 9: return optionOrder === 2;
      case 10: return optionOrder === 3;
      default: return false;
    }
  } else if (unitTitle === "Alan Ölçme") {
    switch (challengeOrder) {
      case 1: return optionOrder === 1;
      case 2: return optionOrder === 1;
      case 3: return optionOrder === 1;
      case 4: return optionOrder === 1;
      case 5: return optionOrder === 1;
      case 6: return optionOrder === 3;
      case 7: return optionOrder === 1;
      case 8: return optionOrder === 1;
      case 9: return optionOrder === 2;
      case 10: return optionOrder === 1;
      default: return false;
    }
  }
  return false;
};

main().catch((err) => {
  console.error("An error occurred while attempting to seed the database:", err);
});
