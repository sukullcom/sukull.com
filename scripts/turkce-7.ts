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
    console.log("Creating Türkçe (Turkish) course for 7th grade");

    // Insert the course
    const [course] = await db
      .insert(schema.courses)
      .values({ title: "Türkçe 7. Sınıf", imageSrc: "/turkce-7.svg" })
      .returning();

    // Create unit for 7th grade Turkish
    const [unit] = await db
      .insert(schema.units)
      .values({
        courseId: course.id,
        title: "Türkçe 7. Sınıf Kazanım Testleri",
        description: "7. sınıf Türkçe dersi kazanım testleri",
        order: 1,
      })
      .returning();

    // All 32 lesson topics based on MEB achievement tests
    const lessonTopics = [
      "Sözcükte Anlam - 1 (Çok Anlamlılık)",
      "Sözcükte Anlam - 2 (Çok Anlamlılık)",
      "Fiiller - 1 (Fiil Çekim Ekleri - Anlam Kayması - Fiillerin Anlam Özellikleri)",
      "Fiiller - 2 (Fiil Çekim Ekleri - Anlam Kayması - Fiillerin Anlam Özellikleri)",
      "Söz Gruplarında Anlam - 1 (Söz Grupları - Deyimler ve Atasözleri - Özdeyişler)",
      "Söz Gruplarında Anlam - 2 (Söz Grupları - Deyimler ve Atasözleri - Özdeyişler)",
      "Sözcükler Arası Anlam İlişkisi - 1 (Söz Sanatları)",
      "Sözcükler Arası Anlam İlişkisi - 2 (Söz Sanatları)",
      "Zarflar - 1",
      "Zarflar - 2",
      "Cümlede Anlam - 1",
      "Cümlede Anlam - 2",
      "Parçada Anlam - 1 (Ana Düşünce - Ana Duygu - Konu - Başlık - Yardımcı Düşünce)",
      "Parçada Anlam - 2 (Ana Düşünce - Ana Duygu - Konu - Başlık - Yardımcı Düşünce)",
      "Fiiller - 3 (Fiil Çekim Ekleri - Anlam Kayması - Fiillerin Anlam Özellikleri)",
      "Fiiller - 4 (Fiil Çekim Ekleri - Anlam Kayması - Fiillerin Anlam Özellikleri)",
      "Fiilde Yapı - Ek Fiiller - 1",
      "Fiilde Yapı - Ek Fiiller - 2",
      "Cümlede Anlam - 3",
      "Cümlede Anlam - 4",
      "Parçada Anlam - 3 (Giriş - Gelişme - Sonuç - Parça Oluşturma - Parça Tamamlama)",
      "Parçada Anlam - 4 (Giriş - Gelişme - Sonuç - Parça Oluşturma - Parça Tamamlama)",
      "Parçada Anlam - 5 (Düşünceyi Geliştirme Yolları - Anlatıcı - Hikâye Unsurları - Metin Karşılaştırma - Metnin Dil ve Anlatım Özellikleri)",
      "Parçada Anlam - 6 (Düşünceyi Geliştirme Yolları - Anlatıcı - Hikâye Unsurları - Metin Karşılaştırma - Metnin Dil ve Anlatım Özellikleri)",
      "Anlatım Bozuklukları - 1",
      "Anlatım Bozuklukları - 2",
      "Yazım Kuralları - 1",
      "Yazım Kuralları - 2",
      "Noktalama İşaretleri - 1",
      "Noktalama İşaretleri - 2",
      "Metin Türleri - 1",
      "Metin Türleri - 2"
    ];

    // Create lessons for each topic
    for (let i = 0; i < lessonTopics.length; i++) {
      const [lesson] = await db
        .insert(schema.lessons)
        .values({
          unitId: unit.id,
          title: lessonTopics[i],
          order: i + 1,
        })
        .returning();

      // Create challenges for each lesson
      await createChallenges(lesson.id, i + 1);
    }

    console.log("7th grade Türkçe course created successfully.");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await client.end();
  }
};

// Function to create challenges for a lesson
const createChallenges = async (lessonId: number, lessonNumber: number) => {
  // Create 10 challenges per lesson
  for (let i = 1; i <= 10; i++) {
    const [challenge] = await db
      .insert(schema.challenges)
      .values({
        lessonId: lessonId,
        type: "ASSIST",
        question: getQuestion(lessonNumber, i),
        order: i,
      })
      .returning();

    // Create 4 options for each challenge
    await db.insert(schema.challengeOptions).values([
      {
        challengeId: challenge.id,
        text: getOption(lessonNumber, i, 1),
        correct: isCorrect(lessonNumber, i, 1),
        imageSrc: null,
        audioSrc: null,
      },
      {
        challengeId: challenge.id,
        text: getOption(lessonNumber, i, 2),
        correct: isCorrect(lessonNumber, i, 2),
        imageSrc: null,
        audioSrc: null,
      },
      {
        challengeId: challenge.id,
        text: getOption(lessonNumber, i, 3),
        correct: isCorrect(lessonNumber, i, 3),
        imageSrc: null,
        audioSrc: null,
      },
      {
        challengeId: challenge.id,
        text: getOption(lessonNumber, i, 4),
        correct: isCorrect(lessonNumber, i, 4),
        imageSrc: null,
        audioSrc: null,
      },
    ]);
  }
};

// Function to get questions for each lesson
const getQuestion = (lessonNumber: number, challengeOrder: number): string => {
  // Lesson 1: Sözcükte Anlam - 1 (Çok Anlamlılık)
  if (lessonNumber === 1) {
    if (challengeOrder === 1) return "Aşağıdaki cümlelerin hangisinde 'yüz' sözcüğü sayı anlamında kullanılmıştır?";
    if (challengeOrder === 2) return "'Kafa' sözcüğü aşağıdaki cümlelerden hangisinde 'akıl' anlamında kullanılmıştır?";
    if (challengeOrder === 3) return "Aşağıdaki cümlelerin hangisinde 'göz' sözcüğü 'dikkat' anlamında kullanılmıştır?";
    if (challengeOrder === 4) return "'Yürek' sözcüğü hangi cümlede 'cesaret' anlamında kullanılmıştır?";
    if (challengeOrder === 5) return "Aşağıdaki cümlelerin hangisinde 'el' sözcüğü 'yardım' anlamında kullanılmıştır?";
    if (challengeOrder === 6) return "'Baş' sözcüğü hangi cümlede 'lider' anlamında kullanılmıştır?";
    if (challengeOrder === 7) return "Aşağıdaki cümlelerin hangisinde 'ayak' sözcüğü 'destek' anlamında kullanılmıştır?";
    if (challengeOrder === 8) return "'Dil' sözcüğü hangi cümlede 'konuşma' anlamında kullanılmıştır?";
    if (challengeOrder === 9) return "Aşağıdaki cümlelerin hangisinde 'sırt' sözcüğü 'destek' anlamında kullanılmıştır?";
    if (challengeOrder === 10) return "'Kol' sözcüğü hangi cümlede 'yardım' anlamında kullanılmıştır?";
  }

  // Lesson 2: Sözcükte Anlam - 2 (Çok Anlamlılık)
  if (lessonNumber === 2) {
    if (challengeOrder === 1) return "Aşağıdaki cümlelerin hangisinde 'çiçek' sözcüğü mecaz anlamda kullanılmıştır?";
    if (challengeOrder === 2) return "'Altın' sözcüğü hangi cümlede 'değerli' anlamında kullanılmıştır?";
    if (challengeOrder === 3) return "Aşağıdaki cümlelerin hangisinde 'ağaç' sözcüğü 'soy' anlamında kullanılmıştır?";
    if (challengeOrder === 4) return "'Taş' sözcüğü hangi cümlede 'katı' anlamında kullanılmıştır?";
    if (challengeOrder === 5) return "Aşağıdaki cümlelerin hangisinde 'kar' sözcüğü 'kazanç' anlamında kullanılmıştır?";
    if (challengeOrder === 6) return "'Gün' sözcüğü hangi cümlede 'zaman' anlamında kullanılmıştır?";
    if (challengeOrder === 7) return "Aşağıdaki cümlelerin hangisinde 'yol' sözcüğü 'yöntem' anlamında kullanılmıştır?";
    if (challengeOrder === 8) return "'Su' sözcüğü hangi cümlede 'berrak' anlamında kullanılmıştır?";
    if (challengeOrder === 9) return "Aşağıdaki cümlelerin hangisinde 'top' sözcüğü 'hep' anlamında kullanılmıştır?";
    if (challengeOrder === 10) return "'Kap' sözcüğü hangi cümlede 'yakala' anlamında kullanılmıştır?";
  }

  // Lesson 3: Fiiller - 1 
  if (lessonNumber === 3) {
    if (challengeOrder === 1) return "Aşağıdaki cümlelerin hangisinde fiil, geçmiş zaman ekiyle çekimlenmiştir?";
    if (challengeOrder === 2) return "'Gel-' fiili hangi cümlede şimdiki zaman ekiyle kullanılmıştır?";
    if (challengeOrder === 3) return "Aşağıdaki cümlelerin hangisinde fiil, gelecek zaman ekiyle çekimlenmiştir?";
    if (challengeOrder === 4) return "'Yap-' fiili hangi cümlede emir kipinde kullanılmıştır?";
    if (challengeOrder === 5) return "Aşağıdaki cümlelerin hangisinde fiil, istek kipi ekiyle çekimlenmiştir?";
    if (challengeOrder === 6) return "'Koş-' fiili hangi cümlede şart kipi ekiyle kullanılmıştır?";
    if (challengeOrder === 7) return "Aşağıdaki cümlelerin hangisinde fiil, gereklilik kipi ekiyle çekimlenmiştir?";
    if (challengeOrder === 8) return "'Oku-' fiili hangi cümlede bildirme kipi ekiyle kullanılmıştır?";
    if (challengeOrder === 9) return "Aşağıdaki cümlelerin hangisinde fiil, anlam kayması yaşamıştır?";
    if (challengeOrder === 10) return "'Düş-' fiili hangi cümlede 'azalma' anlamında kullanılmıştır?";
  }

  // Lesson 4: Fiiller - 2
  if (lessonNumber === 4) {
    if (challengeOrder === 1) return "Aşağıdaki cümlelerin hangisinde fiil, ettirgen çatıda kullanılmıştır?";
    if (challengeOrder === 2) return "'Çık-' fiili hangi cümlede edilgen çatıda kullanılmıştır?";
    if (challengeOrder === 3) return "Aşağıdaki cümlelerin hangisinde fiil, dönüşlü çatıda kullanılmıştır?";
    if (challengeOrder === 4) return "'Gör-' fiili hangi cümlede işteş çatıda kullanılmıştır?";
    if (challengeOrder === 5) return "Aşağıdaki cümlelerin hangisinde fiil, olumsuz çekimdedir?";
    if (challengeOrder === 6) return "'Bil-' fiili hangi cümlede soru çekiminde kullanılmıştır?";
    if (challengeOrder === 7) return "Aşağıdaki cümlelerin hangisinde fiil, birleşik zamanda çekimlenmiştir?";
    if (challengeOrder === 8) return "'Ver-' fiili hangi cümlede yardımcı fiil olarak kullanılmıştır?";
    if (challengeOrder === 9) return "Aşağıdaki cümlelerin hangisinde fiil, kip ekiyle çekimlenmiştir?";
    if (challengeOrder === 10) return "'Al-' fiili hangi cümlede zaman ekiyle kullanılmıştır?";
  }

  // Lesson 5: Söz Gruplarında Anlam - 1
  if (lessonNumber === 5) {
    if (challengeOrder === 1) return "'Ağzı kulaklarında' deyiminin anlamı nedir?";
    if (challengeOrder === 2) return "'Damlaya damlaya göl olur' atasözünün anlamı nedir?";
    if (challengeOrder === 3) return "'Elma düştüğü yerin uzağına düşmez' atasözü ne anlama gelir?";
    if (challengeOrder === 4) return "'Göze girmek' deyiminin anlamı nedir?";
    if (challengeOrder === 5) return "'Baş göz olmak' deyimi ne anlama gelir?";
    if (challengeOrder === 6) return "'Sakla samanı gelir zamanı' atasözünün anlamı nedir?";
    if (challengeOrder === 7) return "'Yüzü gülmek' deyiminin anlamı nedir?";
    if (challengeOrder === 8) return "'Dost kara günde belli olur' atasözü ne anlama gelir?";
    if (challengeOrder === 9) return "'Gözü yükseklerde' deyiminin anlamı nedir?";
    if (challengeOrder === 10) return "'Emek olmadan yemek olmaz' atasözünün anlamı nedir?";
  }

  // Lesson 6: Söz Gruplarında Anlam - 2
  if (lessonNumber === 6) {
    if (challengeOrder === 1) return "'Taş çatlasa' deyiminin anlamı nedir?";
    if (challengeOrder === 2) return "'İşleyen demir pas tutmaz' atasözü ne anlama gelir?";
    if (challengeOrder === 3) return "'Kulağına küpe olsun' deyiminin anlamı nedir?";
    if (challengeOrder === 4) return "'Acele işe şeytan karışır' atasözünün anlamı nedir?";
    if (challengeOrder === 5) return "'Burnu büyümek' deyimi ne anlama gelir?";
    if (challengeOrder === 6) return "'Ağaç yaşken eğilir' atasözünün anlamı nedir?";
    if (challengeOrder === 7) return "'Pabucu dama atılmak' deyiminin anlamı nedir?";
    if (challengeOrder === 8) return "'Her şeyin başı sağlık' özdeyişinin anlamı nedir?";
    if (challengeOrder === 9) return "'Gözden düşmek' deyimi ne anlama gelir?";
    if (challengeOrder === 10) return "'Bilgi güçtür' özdeyişinin anlamı nedir?";
  }

  // Lesson 7: Sözcükler Arası Anlam İlişkisi - 1 (Söz Sanatları)
  if (lessonNumber === 7) {
    if (challengeOrder === 1) return "Aşağıdaki cümlelerin hangisinde teşbih sanatı vardır?";
    if (challengeOrder === 2) return "Hangi cümlede mecaz sanatı kullanılmıştır?";
    if (challengeOrder === 3) return "Aşağıdaki cümlelerin hangisinde kişileştirme sanatı vardır?";
    if (challengeOrder === 4) return "Hangi cümlede abartma (mübalağa) sanatı kullanılmıştır?";
    if (challengeOrder === 5) return "Aşağıdaki cümlelerin hangisinde zıtlık (tezat) sanatı vardır?";
    if (challengeOrder === 6) return "Hangi cümlede ses tekrarı (aliterasyon) sanatı kullanılmıştır?";
    if (challengeOrder === 7) return "Aşağıdaki cümlelerin hangisinde benzetme unsuru belirgindir?";
    if (challengeOrder === 8) return "Hangi cümlede doğa olayları kişileştirilmiştir?";
    if (challengeOrder === 9) return "Aşağıdaki cümlelerin hangisinde karşıtlık (çelişki) vardır?";
    if (challengeOrder === 10) return "Hangi cümlede övgü amacıyla abartma yapılmıştır?";
  }

  // Lesson 8: Sözcükler Arası Anlam İlişkisi - 2 (Söz Sanatları)
  if (lessonNumber === 8) {
    if (challengeOrder === 1) return "Aşağıdaki cümlelerin hangisinde eş anlamlı sözcükler kullanılmıştır?";
    if (challengeOrder === 2) return "Hangi cümlede zıt anlamlı sözcükler bir arada kullanılmıştır?";
    if (challengeOrder === 3) return "Aşağıdaki cümlelerin hangisinde aynı kökten türemiş sözcükler vardır?";
    if (challengeOrder === 4) return "Hangi cümlede ses benzerliği sanatı kullanılmıştır?";
    if (challengeOrder === 5) return "Aşağıdaki cümlelerin hangisinde anlam güçlendirmesi vardır?";
    if (challengeOrder === 6) return "Hangi cümlede kelime tekrarı sanatı kullanılmıştır?";
    if (challengeOrder === 7) return "Aşağıdaki cümlelerin hangisinde anlam geçişi vardır?";
    if (challengeOrder === 8) return "Hangi cümlede sözcük oyunu sanatı kullanılmıştır?";
    if (challengeOrder === 9) return "Aşağıdaki cümlelerin hangisinde anlam zenginliği sağlanmıştır?";
    if (challengeOrder === 10) return "Hangi cümlede fonetik uyum sanatı kullanılmıştır?";
  }

  // Lesson 9: Zarflar - 1
  if (lessonNumber === 9) {
    if (challengeOrder === 1) return "Aşağıdaki cümlelerin hangisinde zaman zarfı kullanılmıştır?";
    if (challengeOrder === 2) return "Hangi cümlede yer zarfı vardır?";
    if (challengeOrder === 3) return "Aşağıdaki cümlelerin hangisinde durum zarfı kullanılmıştır?";
    if (challengeOrder === 4) return "Hangi cümlede miktar zarfı vardır?";
    if (challengeOrder === 5) return "Aşağıdaki cümlelerin hangisinde soru zarfı kullanılmıştır?";
    if (challengeOrder === 6) return "Hangi cümlede bağlaç görevi yapan zarf vardır?";
    if (challengeOrder === 7) return "Aşağıdaki cümlelerin hangisinde pekiştirme zarfı kullanılmıştır?";
    if (challengeOrder === 8) return "Hangi cümlede olumsuzluk zarfı vardır?";
    if (challengeOrder === 9) return "Aşağıdaki cümlelerin hangisinde şüphe zarfı kullanılmıştır?";
    if (challengeOrder === 10) return "Hangi cümlede işaret zarfı vardır?";
  }

  // Lesson 10: Zarflar - 2
  if (lessonNumber === 10) {
    if (challengeOrder === 1) return "'Hızla' zarfı hangi soruya cevap verir?";
    if (challengeOrder === 2) return "'Burada' zarfı hangi türde bir zarftır?";
    if (challengeOrder === 3) return "'Çok' zarfı aşağıdaki cümlelerin hangisinde farklı anlamda kullanılmıştır?";
    if (challengeOrder === 4) return "'Belki' zarfı hangi tür zarftır?";
    if (challengeOrder === 5) return "'Hiç' zarfı aşağıdaki cümlelerin hangisinde zaman zarfı olarak kullanılmıştır?";
    if (challengeOrder === 6) return "'Şöyle' zarfı hangi türden bir zarftır?";
    if (challengeOrder === 7) return "'Nasıl' zarfı hangi soruya cevap verir?";
    if (challengeOrder === 8) return "'Böyle' zarfı aşağıdaki cümlelerin hangisinde durum zarfı olarak kullanılmıştır?";
    if (challengeOrder === 9) return "'Acaba' zarfı hangi tür zarftır?";
    if (challengeOrder === 10) return "'Hemen' zarfı hangi soruya cevap verir?";
  }

  // Lesson 11: Cümlede Anlam - 1
  if (lessonNumber === 11) {
    if (challengeOrder === 1) return "Aşağıdaki cümlelerin hangisinde özne gizlidir?";
    if (challengeOrder === 2) return "Hangi cümlede nesne vardır?";
    if (challengeOrder === 3) return "Aşağıdaki cümlelerin hangisinde dolaylı tümleç bulunur?";
    if (challengeOrder === 4) return "Hangi cümlede yer tamlayıcısı vardır?";
    if (challengeOrder === 5) return "Aşağıdaki cümlelerin hangisinde durum tamlayıcısı bulunur?";
    if (challengeOrder === 6) return "Hangi cümlede sebep tamlayıcısı vardır?";
    if (challengeOrder === 7) return "Aşağıdaki cümlelerin hangisinde zaman tamlayıcısı bulunur?";
    if (challengeOrder === 8) return "Hangi cümlede vasıta tamlayıcısı vardır?";
    if (challengeOrder === 9) return "Aşağıdaki cümlelerin hangisinde amaç tamlayıcısı bulunur?";
    if (challengeOrder === 10) return "Hangi cümlede miktar tamlayıcısı vardır?";
  }

  // Lesson 12: Cümlede Anlam - 2
  if (lessonNumber === 12) {
    if (challengeOrder === 1) return "Aşağıdaki cümlelerin hangisi basit cümledir?";
    if (challengeOrder === 2) return "Hangi cümle bileşik cümledir?";
    if (challengeOrder === 3) return "Aşağıdaki cümlelerin hangisi girişik cümledir?";
    if (challengeOrder === 4) return "Hangi cümle olumlu cümledir?";
    if (challengeOrder === 5) return "Aşağıdaki cümlelerin hangisi olumsuz cümledir?";
    if (challengeOrder === 6) return "Hangi cümle soru cümlesidir?";
    if (challengeOrder === 7) return "Aşağıdaki cümlelerin hangisi ünlem cümlesidir?";
    if (challengeOrder === 8) return "Hangi cümle emir cümlesidir?";
    if (challengeOrder === 9) return "Aşağıdaki cümlelerin hangisi istek cümlesidir?";
    if (challengeOrder === 10) return "Hangi cümle dilek cümlesidir?";
  }

  // Lesson 13: Parçada Anlam - 1
  if (lessonNumber === 13) {
    if (challengeOrder === 1) return "Verilen metnin ana düşüncesi nedir?";
    if (challengeOrder === 2) return "Metnin ana duygusu hangisidir?";
    if (challengeOrder === 3) return "Bu metnin konusu nedir?";
    if (challengeOrder === 4) return "Metne en uygun başlık hangisidir?";
    if (challengeOrder === 5) return "Metnin yardımcı düşüncesi hangisidir?";
    if (challengeOrder === 6) return "Metnin ana fikri hangi cümlede verilmiştir?";
    if (challengeOrder === 7) return "Bu metinde örneklenen konu nedir?";
    if (challengeOrder === 8) return "Metnin amacı nedir?";
    if (challengeOrder === 9) return "Yazarın bu metindeki tavrı nasıldır?";
    if (challengeOrder === 10) return "Metnin hangi bölümünde yardımcı düşünce yer alır?";
  }

  // Lesson 14: Parçada Anlam - 2
  if (lessonNumber === 14) {
    if (challengeOrder === 1) return "Bu metnin türü nedir?";
    if (challengeOrder === 2) return "Metnin hangi özelliği ön plandadır?";
    if (challengeOrder === 3) return "Yazarın bu konudaki görüşü nedir?";
    if (challengeOrder === 4) return "Metinde hangi anlatım tekniği kullanılmıştır?";
    if (challengeOrder === 5) return "Bu metnin hangi bölümünde sonuç bulunur?";
    if (challengeOrder === 6) return "Metnin planı nasıldır?";
    if (challengeOrder === 7) return "Bu metinde hangi düşünce tarzı hâkimdir?";
    if (challengeOrder === 8) return "Yazarın ifade etmek istediği nedir?";
    if (challengeOrder === 9) return "Metindeki örnekler neyi desteklemektedir?";
    if (challengeOrder === 10) return "Bu metnin okuyucuya vermek istediği mesaj nedir?";
  }

  // Lesson 15: Fiiller - 3
  if (lessonNumber === 15) {
    if (challengeOrder === 1) return "Aşağıdaki cümlelerin hangisinde birleşik fiil vardır?";
    if (challengeOrder === 2) return "Hangi cümlede yardımcı fiil kullanılmıştır?";
    if (challengeOrder === 3) return "Aşağıdaki cümlelerin hangisinde fiilimsi vardır?";
    if (challengeOrder === 4) return "Hangi cümlede isim-fiil kullanılmıştır?";
    if (challengeOrder === 5) return "Aşağıdaki cümlelerin hangisinde sıfat-fiil vardır?";
    if (challengeOrder === 6) return "Hangi cümlede zarf-fiil kullanılmıştır?";
    if (challengeOrder === 7) return "Aşağıdaki cümlelerin hangisinde fiil çekimli değildir?";
    if (challengeOrder === 8) return "Hangi cümlede mastar eki vardır?";
    if (challengeOrder === 9) return "Aşağıdaki cümlelerin hangisinde fiil çekimsizdir?";
    if (challengeOrder === 10) return "Hangi cümlede fiil kök hâlindedir?";
  }

  // Lesson 16: Fiiller - 4
  if (lessonNumber === 16) {
    if (challengeOrder === 1) return "Aşağıdaki cümlelerin hangisinde geçişli fiil vardır?";
    if (challengeOrder === 2) return "Hangi cümlede geçişsiz fiil kullanılmıştır?";
    if (challengeOrder === 3) return "Aşağıdaki cümlelerin hangisinde kurallı fiil vardır?";
    if (challengeOrder === 4) return "Hangi cümlede kuralsız fiil kullanılmıştır?";
    if (challengeOrder === 5) return "Aşağıdaki cümlelerin hangisinde yeterlik fiili vardır?";
    if (challengeOrder === 6) return "Hangi cümlede tezlik fiili kullanılmıştır?";
    if (challengeOrder === 7) return "Aşağıdaki cümlelerin hangisinde süreklilik fiili vardır?";
    if (challengeOrder === 8) return "Hangi cümlede anlık fiil kullanılmıştır?";
    if (challengeOrder === 9) return "Aşağıdaki cümlelerin hangisinde çok anlamlı fiil vardır?";
    if (challengeOrder === 10) return "Hangi cümlede tek anlamlı fiil kullanılmıştır?";
  }

  // Lesson 17: Fiilde Yapı - Ek Fiiller - 1
  if (lessonNumber === 17) {
    if (challengeOrder === 1) return "Aşağıdaki cümlelerin hangisinde ek fiil vardır?";
    if (challengeOrder === 2) return "'Olmak' ek fiili hangi cümlede kullanılmıştır?";
    if (challengeOrder === 3) return "Aşağıdaki cümlelerin hangisinde '-dır' ek fiili vardır?";
    if (challengeOrder === 4) return "'İmek' ek fiili hangi cümlede geçer?";
    if (challengeOrder === 5) return "Aşağıdaki cümlelerin hangisinde gizli ek fiil vardır?";
    if (challengeOrder === 6) return "Hangi cümlede ek fiil açık olarak kullanılmıştır?";
    if (challengeOrder === 7) return "Aşağıdaki cümlelerin hangisinde ek fiil çekimlidir?";
    if (challengeOrder === 8) return "Hangi cümlede ek fiil zamanla çekimlenmiştir?";
    if (challengeOrder === 9) return "Aşağıdaki cümlelerin hangisinde ek fiil kipli çekimdedir?";
    if (challengeOrder === 10) return "Hangi cümlede ek fiil kişi ekiyle çekimlenmiştir?";
  }

  // Lesson 18: Fiilde Yapı - Ek Fiiller - 2
  if (lessonNumber === 18) {
    if (challengeOrder === 1) return "Aşağıdaki cümlelerin hangisinde ek fiil olumsuzdur?";
    if (challengeOrder === 2) return "Hangi cümlede ek fiil soru ekiyle çekimlenmiştir?";
    if (challengeOrder === 3) return "Aşağıdaki cümlelerin hangisinde ek fiil geçmiş zamanlıdır?";
    if (challengeOrder === 4) return "Hangi cümlede ek fiil gelecek zamanlıdır?";
    if (challengeOrder === 5) return "Aşağıdaki cümlelerin hangisinde ek fiil şimdiki zamanlıdır?";
    if (challengeOrder === 6) return "Hangi cümlede ek fiil şart kipindedir?";
    if (challengeOrder === 7) return "Aşağıdaki cümlelerin hangisinde ek fiil istek kipindedir?";
    if (challengeOrder === 8) return "Hangi cümlede ek fiil emir kipindedir?";
    if (challengeOrder === 9) return "Aşağıdaki cümlelerin hangisinde ek fiil gereklilik kipindedir?";
    if (challengeOrder === 10) return "Hangi cümlede ek fiil bildirme kipindedir?";
  }

  // Lesson 19: Cümlede Anlam - 3
  if (lessonNumber === 19) {
    if (challengeOrder === 1) return "Aşağıdaki cümlelerin hangisinde devrik yapı vardır?";
    if (challengeOrder === 2) return "Hangi cümle kurallı sırayla yazılmıştır?";
    if (challengeOrder === 3) return "Aşağıdaki cümlelerin hangisinde eksiltili yapı vardır?";
    if (challengeOrder === 4) return "Hangi cümlede tekrarlı yapı kullanılmıştır?";
    if (challengeOrder === 5) return "Aşağıdaki cümlelerin hangisinde pekiştirme vardır?";
    if (challengeOrder === 6) return "Hangi cümlede vurgu yapılmıştır?";
    if (challengeOrder === 7) return "Aşağıdaki cümlelerin hangisinde anlam belirsizliği vardır?";
    if (challengeOrder === 8) return "Hangi cümlede anlam netliği sağlanmıştır?";
    if (challengeOrder === 9) return "Aşağıdaki cümlelerin hangisinde söz dizimi hatası vardır?";
    if (challengeOrder === 10) return "Hangi cümle dilbilgisi açısından doğrudur?";
  }

  // Lesson 20: Cümlede Anlam - 4
  if (lessonNumber === 20) {
    if (challengeOrder === 1) return "Aşağıdaki cümlelerin hangisinde mecaz anlam vardır?";
    if (challengeOrder === 2) return "Hangi cümlede gerçek anlam kullanılmıştır?";
    if (challengeOrder === 3) return "Aşağıdaki cümlelerin hangisinde kinaye vardır?";
    if (challengeOrder === 4) return "Hangi cümlede açık anlatım kullanılmıştır?";
    if (challengeOrder === 5) return "Aşağıdaki cümlelerin hangisinde kapalı anlatım vardır?";
    if (challengeOrder === 6) return "Hangi cümlede ima yoluyla anlatım yapılmıştır?";
    if (challengeOrder === 7) return "Aşağıdaki cümlelerin hangisinde dolaylı anlatım vardır?";
    if (challengeOrder === 8) return "Hangi cümlede doğrudan anlatım kullanılmıştır?";
    if (challengeOrder === 9) return "Aşağıdaki cümlelerin hangisinde üstü kapalı anlam vardır?";
    if (challengeOrder === 10) return "Hangi cümlede net bir anlam ifade edilmiştir?";
  }

  return `Lesson ${lessonNumber}, Question ${challengeOrder}`;
};

// Function to get options for each question
const getOption = (lessonNumber: number, challengeOrder: number, optionOrder: number): string => {
  // Lesson 1: Sözcükte Anlam - 1 (Çok Anlamlılık)
  if (lessonNumber === 1) {
    if (challengeOrder === 1) {
      if (optionOrder === 1) return "Yüz çocuk bahçede oynuyor.";
      if (optionOrder === 2) return "Yüzünü güneşe dönmüş oturuyordu.";
      if (optionOrder === 3) return "Yüz karası olmak istemez.";
      if (optionOrder === 4) return "Yüzü gülmeyen insanlar üzücü.";
    }
    if (challengeOrder === 2) {
      if (optionOrder === 1) return "Kafası güzel bir çocuk.";
      if (optionOrder === 2) return "Kafasını masaya vurdu.";
      if (optionOrder === 3) return "Kafa kafaya verip düşünelim.";
      if (optionOrder === 4) return "Kafasını omzuna dayadı.";
    }
    if (challengeOrder === 3) {
      if (optionOrder === 1) return "Gözü yaşlı anne bekliyordu.";
      if (optionOrder === 2) return "Göz göze geldiler.";
      if (optionOrder === 3) return "Göz kulak ol çocuklara.";
      if (optionOrder === 4) return "Gözleri mavi renkte.";
    }
  }

  // Lesson 2: Sözcükte Anlam - 2 (Çok Anlamlılık)
  if (lessonNumber === 2) {
    if (challengeOrder === 1) {
      if (optionOrder === 1) return "Bahçede güzel çiçekler açtı.";
      if (optionOrder === 2) return "Okulumuzun çiçeği olan öğrenciler.";
      if (optionOrder === 3) return "Çiçekli elbise giydi.";
      if (optionOrder === 4) return "Çiçek sulamayı unutma.";
    }
    if (challengeOrder === 2) {
      if (optionOrder === 1) return "Altın bilezik taktı.";
      if (optionOrder === 2) return "Altın yürekli insan.";
      if (optionOrder === 3) return "Altın fiyatları arttı.";
      if (optionOrder === 4) return "Altın madeni keşfedildi.";
    }
  }

  // Lesson 3: Fiiller - 1
  if (lessonNumber === 3) {
    if (challengeOrder === 1) {
      if (optionOrder === 1) return "Okula geldim.";
      if (optionOrder === 2) return "Okula geliyorum.";
      if (optionOrder === 3) return "Okula geleceğim.";
      if (optionOrder === 4) return "Okula gel.";
    }
    if (challengeOrder === 2) {
      if (optionOrder === 1) return "Gel buraya.";
      if (optionOrder === 2) return "Geldi eve.";
      if (optionOrder === 3) return "Geliyor şimdi.";
      if (optionOrder === 4) return "Gelecek yarın.";
    }
  }

  // Lesson 5: Söz Gruplarında Anlam - 1
  if (lessonNumber === 5) {
    if (challengeOrder === 1) {
      if (optionOrder === 1) return "Çok mutlu olmak";
      if (optionOrder === 2) return "Çok üzgün olmak";
      if (optionOrder === 3) return "Çok kızmak";
      if (optionOrder === 4) return "Çok yorgun olmak";
    }
    if (challengeOrder === 2) {
      if (optionOrder === 1) return "Sabırlı olmak";
      if (optionOrder === 2) return "Acelecilik yapmak";
      if (optionOrder === 3) return "Çok içmek";
      if (optionOrder === 4) return "Çok yemek";
    }
  }

  // Lesson 6: Söz Gruplarında Anlam - 2
  if (lessonNumber === 6) {
    if (challengeOrder === 1) {
      if (optionOrder === 1) return "Hiçbir şekilde";
      if (optionOrder === 2) return "Çok kolay";
      if (optionOrder === 3) return "Çok zor";
      if (optionOrder === 4) return "Bazen";
    }
    if (challengeOrder === 2) {
      if (optionOrder === 1) return "Çalışan insan başarılı olur";
      if (optionOrder === 2) return "Metal çabuk eskir";
      if (optionOrder === 3) return "Demirci çok çalışır";
      if (optionOrder === 4) return "Pas zararlıdır";
    }
  }

  // Lesson 7: Sözcükler Arası Anlam İlişkisi - 1 (Söz Sanatları)
  if (lessonNumber === 7) {
    if (challengeOrder === 1) {
      if (optionOrder === 1) return "Ay gibi güzel kız";
      if (optionOrder === 2) return "Çok güzel bir kız";
      if (optionOrder === 3) return "Kız güzeldi";
      if (optionOrder === 4) return "Güzel bir kızdı";
    }
    if (challengeOrder === 2) {
      if (optionOrder === 1) return "Gözleri parlıyordu";
      if (optionOrder === 2) return "Kalbi taş kesildi";
      if (optionOrder === 3) return "Saçları siyahtı";
      if (optionOrder === 4) return "Eli güzeldi";
    }
  }

  // Lesson 8: Sözcükler Arası Anlam İlişkisi - 2 (Söz Sanatları)
  if (lessonNumber === 8) {
    if (challengeOrder === 1) {
      if (optionOrder === 1) return "Güzel, hoş bir bahçe";
      if (optionOrder === 2) return "Büyük, kocaman ev";
      if (optionOrder === 3) return "Sıcak, soğuk hava";
      if (optionOrder === 4) return "Kırmızı, yeşil çiçek";
    }
    if (challengeOrder === 2) {
      if (optionOrder === 1) return "Sıcak ve soğuk";
      if (optionOrder === 2) return "Büyük ve küçük";
      if (optionOrder === 3) return "Gece gündüz çalıştı";
      if (optionOrder === 4) return "Kırmızı ve beyaz";
    }
  }

  // Lesson 9: Zarflar - 1
  if (lessonNumber === 9) {
    if (challengeOrder === 1) {
      if (optionOrder === 1) return "Dün okula gittim.";
      if (optionOrder === 2) return "Çok güzel bir gün.";
      if (optionOrder === 3) return "Burada duruyorum.";
      if (optionOrder === 4) return "Hızla koşuyordu.";
    }
    if (challengeOrder === 2) {
      if (optionOrder === 1) return "Yarın gelirim.";
      if (optionOrder === 2) return "Orada bekliyor.";
      if (optionOrder === 3) return "Çok güzel.";
      if (optionOrder === 4) return "Hızla gitti.";
    }
  }

  // Lesson 10: Zarflar - 2
  if (lessonNumber === 10) {
    if (challengeOrder === 1) {
      if (optionOrder === 1) return "Nasıl?";
      if (optionOrder === 2) return "Ne zaman?";
      if (optionOrder === 3) return "Nerede?";
      if (optionOrder === 4) return "Ne kadar?";
    }
    if (challengeOrder === 2) {
      if (optionOrder === 1) return "Zaman zarfı";
      if (optionOrder === 2) return "Yer zarfı";
      if (optionOrder === 3) return "Durum zarfı";
      if (optionOrder === 4) return "Miktar zarfı";
    }
  }

  return `Option ${optionOrder}`;
};

// Function to determine correct answers
const isCorrect = (lessonNumber: number, challengeOrder: number, optionOrder: number): boolean => {
  // Lesson 1: Sözcükte Anlam - 1 (Çok Anlamlılık)
  if (lessonNumber === 1) {
    if (challengeOrder === 1 && optionOrder === 1) return true; // "Yüz çocuk" - sayı anlamı
    if (challengeOrder === 2 && optionOrder === 1) return true; // "Kafası güzel" - akıl anlamı
    if (challengeOrder === 3 && optionOrder === 3) return true; // "Göz kulak ol" - dikkat anlamı
  }

  // Lesson 2: Sözcükte Anlam - 2 (Çok Anlamlılık)
  if (lessonNumber === 2) {
    if (challengeOrder === 1 && optionOrder === 2) return true; // "Okulumuzun çiçeği" - mecaz anlam
    if (challengeOrder === 2 && optionOrder === 2) return true; // "Altın yürekli" - değerli anlam
  }

  // Lesson 3: Fiiller - 1
  if (lessonNumber === 3) {
    if (challengeOrder === 1 && optionOrder === 1) return true; // "geldim" - geçmiş zaman
    if (challengeOrder === 2 && optionOrder === 3) return true; // "geliyor" - şimdiki zaman
  }

  // Lesson 5: Söz Gruplarında Anlam - 1
  if (lessonNumber === 5) {
    if (challengeOrder === 1 && optionOrder === 1) return true; // "Ağzı kulaklarında" - çok mutlu olmak
    if (challengeOrder === 2 && optionOrder === 1) return true; // "Damlaya damlaya göl olur" - sabırlı olmak
  }

  // Lesson 6: Söz Gruplarında Anlam - 2
  if (lessonNumber === 6) {
    if (challengeOrder === 1 && optionOrder === 1) return true; // "Taş çatlasa" - hiçbir şekilde
    if (challengeOrder === 2 && optionOrder === 1) return true; // "İşleyen demir pas tutmaz" - çalışan insan başarılı olur
  }

  // Lesson 7: Sözcükler Arası Anlam İlişkisi - 1 (Söz Sanatları)
  if (lessonNumber === 7) {
    if (challengeOrder === 1 && optionOrder === 1) return true; // "Ay gibi güzel kız" - teşbih sanatı
    if (challengeOrder === 2 && optionOrder === 2) return true; // "Kalbi taş kesildi" - mecaz sanatı
  }

  // Lesson 8: Sözcükler Arası Anlam İlişkisi - 2 (Söz Sanatları)
  if (lessonNumber === 8) {
    if (challengeOrder === 1 && optionOrder === 1) return true; // "Güzel, hoş bir bahçe" - eş anlamlı sözcükler
    if (challengeOrder === 2 && optionOrder === 3) return true; // "Gece gündüz çalıştı" - zıt anlamlı sözcükler
  }

  // Lesson 9: Zarflar - 1
  if (lessonNumber === 9) {
    if (challengeOrder === 1 && optionOrder === 1) return true; // "Dün okula gittim" - zaman zarfı
    if (challengeOrder === 2 && optionOrder === 2) return true; // "Orada bekliyor" - yer zarfı
  }

  // Lesson 10: Zarflar - 2
  if (lessonNumber === 10) {
    if (challengeOrder === 1 && optionOrder === 1) return true; // "Hızla" - nasıl sorusuna cevap verir
    if (challengeOrder === 2 && optionOrder === 2) return true; // "Burada" - yer zarfı
  }

  return false;
};

main(); 