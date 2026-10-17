import fs from "fs";

function challenge(question, reading, choices, correctIndex, explanation, difficulty, tags) {
  return {
    question,
    type: "SELECT",
    difficulty,
    tags,
    explanation,
    metadata: JSON.stringify({ reading }),
    options: choices.map((text, i) => ({ text, correct: i === correctIndex })),
  };
}

function lesson(title, order, tags, triples) {
  const levels = ["EASY", "MEDIUM", "HARD"];
  return {
    title,
    order,
    challenges: triples.map((item, i) =>
      challenge(item[0], item[1], item[2], item[3], item[4], levels[i], tags),
    ),
  };
}

function unit(title, description, order, lessons) {
  return { title, description, order, lessons };
}

const buUlke = unit(
  "Bu Ülke",
  "Cemil Meriç’in Bu Ülke’sinde irfan, aydın ve kelime üzerine ayrımlar. Her ders üç okuma ve bu okumadan cevaplanan bir sorudan oluşur.",
  7,
  [
    lesson("İrfan ve kültür", 1, "bu-ulke,irfan", [
      [
        "Meriç kültür kelimesini neden irfanın yerine koymaz?",
        "Bu Ülke’de kültür, raftan alınmış bir vitrin gibi durabilir. İrfan ise o vitrinin örtmediği bir bilme hâli olarak kalır. Kelimeler aynı cümlede geçince aynı şey olmazlar.\n\nKitapta anlatılan, kültürün değersiz sayılması değildir. Kültür adının, irfanın yerini sessizce almasıdır.",
        ["Kültürün hiç olmadığı", "Kültür adının irfanın yerine geçebildiği", "İrfanın yalnızca Batı’da bulunduğu", "İkisinin aynı raf olduğu"],
        1,
        "Kültür adı, irfanın yerini alabilir.",
      ],
      [
        "Vitrindeki kelime neden bilme sayılmaz?",
        "Meriç, edinilmiş kelimenin sahibini bilgin yapmadığını anlatır. Kelime rafta durur. Bilme, o kelimenin örttüğü şeyi taşımaktır. Taşımayan kişi kelimeyi kullanır, bilmeyi değil.\n\nAyrım buradadır. Söylemek, bilmiş olmanın kanıtı değildir.",
        ["Söylemenin bilmek olduğu", "Kelimeyi taşımayan kişinin onu yalnızca kullandığı", "Vitrinin irfan sayıldığı", "Bilmenin kelimesiz kaldığı"],
        1,
        "Kelimeyi kullanmak, onu taşımış olmak değildir.",
      ],
      [
        "İrfan kültürden neden daha dar bir kapıdır?",
        "Kültür geniş bir ad olarak her şeyi içine alabilir. İrfan o genişliğe sığmaz. Bir yerin kendi bilme yolunu, dışarıdan gelen adın bitirdiği yerde arar.\n\nBu yüzden iki kelimeyi yan yana yazmak, aralarındaki kapıyı kapatmaz.",
        ["İrfanın daha kolay öğrenildiği", "İrfanın dışarıdan gelen adla bitmediği", "Kültürün kapalı bir liste olduğu", "İkisinin birbirini iptal ettiği"],
        1,
        "İrfan, dışarıdan gelen adın bittiği yerde aranır.",
      ],
    ]),
    lesson("Çeviren aydın", 2, "bu-ulke,aydin", [
      [
        "Yalnızca Batı’yı okuyan aydın neden hâlâ çevirmen kalabilir?",
        "Bu Ülke’de aydın, başkasının cümlesini kendi malı sanabilir. Okumak bir cümleyi eve getirmektir. Getirilen cümle, düşünce olmaz. Düşünce, o cümlenin bu yerde neye değdiğini sormaktır.\n\nKitapta anlatılan, Batı’yı okumanın yasak olduğudur değil. Okumanın çeviri olarak kalabilmesidir.",
        ["Okumanın yasak olduğu", "Getirilen cümlenin düşünce sayılmayabildiği", "Aydının hiç okumadığı", "Çevirinin her zaman özgün olduğu"],
        1,
        "Başkasının cümlesini eve getirmek, düşünmüş olmak değildir.",
      ],
      [
        "Meriç mal edinmeyi neden tehlikeli sayar?",
        "Başkasının hükmü, tekrar edilince sahibinin hükmü gibi durur. Aydın o tekrarı bir keşif sanabilir. Keşif, cümlenin geldiği yeri unutunca başlar sanılır. Kitap tam tersini söyler. Gelen yeri unutmak, düşünceyi kaybettirir.\n\nMal sandığı şey, hâlâ başkasının cüzdanındadır.",
        ["Tekrarın keşif olduğu", "Unutulan kaynağın cümleyi mal yapmadığı", "Hükmün bu ülkede doğduğu", "Okumanın hafızayı sildiği"],
        1,
        "Kaynağı unutmak, cümleyi kişinin malı yapmaz.",
      ],
      [
        "Bu yerde sormak neden okumaktan ayrı bir iştir?",
        "Okumak cümleyi taşır. Sormak, o cümlenin bu sokakta neye çarptığını arar. Çarpışma yoksa aydın bir aktarıcı olarak kalır. Aktarıcı faydalı olabilir. Düşünmüş olmak başka bir iştir.\n\nBu Ülke o iki işi birbirine yapıştırmaz.",
        ["Sormanın gereksiz olduğu", "Çarpışmayan cümlenin aktarımda kaldığı", "Aktarmanın düşünceyi bitirdiği", "Sokağın kitaba girmemesi"],
        1,
        "Cümle bu yere çarpmıyorsa aktarımda kalır.",
      ],
    ]),
    lesson("Kelime ve hafıza", 3, "bu-ulke,kelime", [
      [
        "Sözlük neden bir kelime listesi değildir?",
        "Meriç’te sözlük, bir yerin neyi hatırlayabildiğinin rafıdır. Kelime düşünce listeye eklenmez. Kelime gidince, o kelimenin taşıdığı hatıra da söyleyecek yer bulamaz.\n\nKitapta anlatılan, eski kelimelere dönme emri değildir. Kelimesiz kalan bir yerin, kendi geçmişini adlandıramamasıdır.",
        ["Eski kelimeye dönme emri", "Kelime gidince hatıranın adlandırılamaması", "Listenin hafıza sayılması", "Sözlüğün yalnızca imla kitabı olması"],
        1,
        "Kelime gidince hatıra söyleyecek yer bulamaz.",
      ],
      [
        "Yeni kelime eski hatırayı neden her zaman taşımaz?",
        "Bir kavramın yerine başka bir kelime konabilir. Konulan kelime, gidenin gördüğü şeyi görmeyebilir. Çeviri o zaman bir köprü değil, bir örtüdür.\n\nBu Ülke bu örtüyü ilerleme sanmama konusunda durur.",
        ["Her yeni kelimenin köprü olduğu", "Yeni kelimenin gidenin gördüğünü görmeyebildiği", "Örtünün hafızayı çoğalttığı", "Eski kelimenin boş olduğu"],
        1,
        "Yerine konan kelime, gidenin gördüğünü görmeyebilir.",
      ],
      [
        "Hafıza kaybı neden unutkanlıkla aynı şey değildir?",
        "Unutkanlık bir kişinin aklından çıkar. Burada kaybolan, bir yerin ortak söyleme gücüdür. Kişi hatırlar sandığı şeyi, elindeki kelimelerle kuramayabilir.\n\nKuramayınca geçmiş silinmiş gibi değil, dilsiz kalmış gibi durur.",
        ["Kişinin adını unuttuğu", "Ortak söyleme gücü gidince geçmişin dilsiz kaldığı", "Hafızanın kelimeden bağımsız olduğu", "Listenin geçmişi sakladığı"],
        1,
        "Ortak kelime gidince geçmiş dilsiz kalır.",
      ],
    ]),
    lesson("Doğu ve Batı", 4, "bu-ulke,bati", [
      [
        "Doğu ile Batı bu kitapta neden bir harita sorusu değildir?",
        "Bu Ülke, hangi kıtanın üstün olduğunu sormaz. Sorduğu, bir yerin kendine bakarken bu ayrımı ödünç almasıdır. Ayrım coğrafyada duruyor sanılır. Asıl yara, bakışın bu ayrıma teslim olmasıdır.\n\nKitapta anlatılan, iki tarafı birleştirme sloganı da değildir.",
        ["Hangi kıtanın üstün olduğu", "Bakışın ödünç bir ayrıma teslim olması", "Haritanın yanlış çizildiği", "İki tarafın aynı olduğu"],
        1,
        "Yara, bakışın bu ayrıma teslim olmasıdır.",
      ],
      [
        "Ödünç ayrım neden kişinin kendi yerini örter?",
        "Kişi kendini Doğu ya da Batı diye adlandırınca, adlandırmadığı hali göremez. Ad, bakışı rahatlatır. Rahatlama, görme değildir.\n\nMeriç bu rahatlığı bir açıklama diye kabul etmez.",
        ["Adın görmeyi kolaylaştırdığı", "Adın, adlandırılmayan hali örttüğü", "Coğrafyanın bakışı düzelttiği", "Rahatlamanın teşhis olduğu"],
        1,
        "Taraf adı, adlandırılmayan hali örter.",
      ],
      [
        "Kitap iki tarafı neden barıştırmaya kalkmaz?",
        "Barıştırma, ayrımı doğru kabul edip üstüne bir nezaket koyar. Bu Ülke o nezaketi istemez. Önce ayrımın bu yerde ne iş gördüğünü sorar.\n\nİş görülmeden kurulan barış, yarayı kapatmış gibi durur.",
        ["Nezaketin yeteceği", "Ayrımın ne iş gördüğü sorulmadan barışın yara örttüğü", "Tarafların silineceği", "Haritanın atılacağı"],
        1,
        "Ayrım sorgulanmadan kurulan barış, yarayı örter.",
      ],
    ]),
    lesson("Teşhis", 5, "bu-ulke,teshis", [
      [
        "Bu ülke adı neden bir övgü ya da sövgü değildir?",
        "Meriç bu adı bir manzara kartı gibi kullanmaz. Öven de söven de yeri bir duyguya indirger. Kitapta ad, bakılan yerin hâline konan bir teşhistir.\n\nTeşhis, sevmek ya da nefret etmekten önce gelir. İkisi de bakmayı bırakabilir.",
        ["Yerin övülmesi", "Adın bir duyguya değil bir hâle konması", "Sövgünün daha doğru olduğu", "Manzaranın yeterli olduğu"],
        1,
        "Ad, duyguya değil bakılan hâle konur.",
      ],
      [
        "Öven ile söven neden aynı yerde buluşur?",
        "Biri yeri yükseltir, biri yerin dibine batırır. İkisi de bakmayı bitirir. Teşhis ise hâli adlandırmaya devam eder. Bu Ülke o devamı ister.\n\nDuygu güçlü olabilir. Güçlü duygu, görmenin yerine geçmez.",
        ["İkisinin de teşhis koyduğu", "Yükseltmenin de batırmanın da bakmayı bitirdiği", "Sövgünün övgüden üstün olduğu", "Duygunun görmeyi tamamladığı"],
        1,
        "Övmek de sövmek de bakmayı bitirebilir.",
      ],
      [
        "Teşhis neden sevmekten önce gelir?",
        "Seven, sevdiği şeyi düzeltmeden bırakabilir. Teşhis, bırakmadan önce hâlin adını koyar. Ad konmazsa sevgi bir örtü olur.\n\nKitap örtünün altında kalan hâli ister.",
        ["Sevginin teşhis sayıldığı", "Ad konmazsa sevginin hâli örtebildiği", "Nefretin daha dürüst olduğu", "Hâlin adsız kalması gerektiği"],
        1,
        "Ad konmazsa sevgi, hâli örtebilir.",
      ],
    ]),
  ],
);

const para = unit(
  "Paranın Psikolojisi",
  "Morgan Housel’in Paranın Psikolojisi’nde para kararının bilgi değil huy oluşu. Her ders üç okuma ve bu okumadan cevaplanan bir sorudan oluşur.",
  8,
  [
    lesson("Aynı bilgi, ayrı huy", 1, "para,huy", [
      [
        "Kitap para başarısını neden zekâya bağlamaz?",
        "Paranın Psikolojisi, aynı bilgiyi bilen iki kişinin ayrı yaşayabildiğini anlatır. Formül ortadadır. Parayı yerinde tutan, formülü daha hızlı söyleyen değildir. Tutuş, bir huydur.\n\nKitapta anlatılan, bilginin işe yaramadığı değildir. Bilginin, huyun yerine geçememesidir.",
        ["Formülün gizli olduğu", "Aynı bilgiyi bilenlerin ayrı yaşayabildiği", "Zekânın parayı iptal ettiği", "Huyun öğrenilemediği"],
        1,
        "Aynı bilgi, ayrı bir huy ile ayrı yaşanır.",
      ],
      [
        "Formülü hızlı söylemek neden tutuş sayılmaz?",
        "Toplantıda doğru cümle kurulabilir. Cümle, ertesi sabah gelen isteği durdurmaz. Kitap o isteği bir hesap hatası diye görmez. Hesap doğru, davranış başka yerden gelir.\n\nDoğru cümle ile yapılan iş arasındaki boşluk, kitabın konusu olur.",
        ["Cümlenin hesabı bozduğu", "Doğru cümlenin isteği durdurmadığı", "İsteğin her zaman hesap olduğu", "Hızlı söyleyenin kazandığı"],
        1,
        "Doğru cümle, ertesi sabahki isteği durdurmaz.",
      ],
      [
        "Huy neden tablodan okunmaz?",
        "Housel, kararın çoğu zaman sofrada kurulduğunu anlatır. Tablo o an orada değildir. Kişinin gördüğü hayat, egosu ve o güne kadarki payı oradadır.\n\nTabloyu ezberlemek, sofradaki kararı açıklamaz.",
        ["Sofranın tabloyu kopyaladığı", "Kararın, ezberlenen tablonun dışında kurulduğu", "Egonun hesaba girmediği", "Payın herkeste aynı olduğu"],
        1,
        "Karar çoğu zaman tablonun dışında, sofrada kurulur.",
      ],
    ]),
    lesson("Kimse deli değil", 2, "para,tecrube", [
      [
        "Başkasının para kararı neden dışarıdan delice görünür?",
        "Kitap, herkesin kendi gördüğü tarihle makul bir karar kurduğunu söyler. O tarih başkasının tarihi değildir. Dışarıdan bakan, kendi örneklemine uymayan seçimi hata sanır.\n\nHata sandığı şey, o hayatın içinden bakınca bir devam olabilir.",
        ["Herkesin aynı tarihi yaşadığı", "Kararın, bakanın örnekleminden değil yaşanan tarihten çıktığı", "Makul kararın olmadığı", "Deli seçimin övüldüğü"],
        1,
        "Karar, bakanın örnekleminden değil yaşanan tarihten çıkar.",
      ],
      [
        "Kendi örneklemi neden başkasının hatasını büyütür?",
        "Kişi, paranın kendi gençliğinde ne yaptığını normal sanır. Başkası başka bir on yıl görmüştür. Normal sandığı çizgi, evrensel bir çizgi değildir.\n\nKitap bu yüzden alay etmeden önce örneklemi sorar.",
        ["On yılın herkeste aynı olduğu", "Normal sandığı çizginin evrensel olmadığı", "Alayın teşhis olduğu", "Gençliğin hesabı bitirdiği"],
        1,
        "Kişinin normal sandığı çizgi, herkesin çizgisi değildir.",
      ],
      [
        "Anlamak neden hak vermekle aynı şey değildir?",
        "Bir kararın nereden çıktığını görmek, o kararı doğru ilan etmek değildir. Kitap deli demeyi bırakır. Yerine, bu hayat bu kararı neden makul buldu diye sorar.\n\nSoru, onayın yerine geçer.",
        ["Her kararın doğru olduğu", "Kökeni görmenin onay sayılmadığı", "Sormanın alay olduğu", "Makulün her zaman kazandırdığı"],
        1,
        "Kararın nereden çıktığını görmek, onu doğru ilan etmek değildir.",
      ],
    ]),
    lesson("Yeter çizgisi", 3, "para,yeter", [
      [
        "Kitap en zor para hünerini neden yeter diye adlandırır?",
        "Housel’de kazanç, hedef çıtası her kaydığında yenilir. Çıta yürürse, biriken yıl o yürüyüşün altında kalır. Yeter, daha fazlasını bilmemek değildir. Çıtanın yürümesini durdurmaktır.\n\nBileşik büyüme, duran bir çizgiye ihtiyaç duyar. Çizgi kaçarsa zamanın işi harcanır.",
        ["Daha fazlasını bilmemek", "Yürüyen çıtanın biriken yılı yemesi", "Çıtanın hiç olmaması", "Zamanın hedefi büyüttüğü"],
        1,
        "Yürüyen çıta, biriken yılı yer.",
      ],
      [
        "Yeter neden azla yetinmek değildir?",
        "Azla yetinmek bir yoksunluk olabilir. Kitaptaki yeter, kişinin kendi çizgisini tanımasıdır. Tanımadan yapılan kısıtlama, yine başkasının çıtasından kaçıştır.\n\nKaçış da yürümek de çizgiyi kişinin elinden alır.",
        ["Kısıtlamanın yeter olduğu", "Başkasının çıtasından kaçışın da yeter sayılmadığı", "Çizginin başkasına ait olduğu", "Yoksunluğun hüner olduğu"],
        1,
        "Başkasının çıtasından kaçmak da yeter değildir.",
      ],
      [
        "Bileşik büyüme neden sabit bir isteğe muhtaçtır?",
        "Yıl, ancak aynı yerde bırakılan para üzerinde çalışır. İstek her yıl yeri değiştirirse yılın çalışacağı para kalmaz. Hüner, daha iyi bir formül bulmak değil, yeri değiştirmemektir.\n\nFormül doğru olsa da yer değişince sonuç dağılır.",
        ["Formülün yeri önemsiz kıldığı", "İstek yeri değiştirince yılın çalışacağı paranın kalmadığı", "Her yıl yer değiştirmenin büyüttüğü", "Sabit isteğin büyümeyi durdurduğu"],
        1,
        "Yer her yıl değişirse zamanın çalışacağı para kalmaz.",
      ],
    ]),
    lesson("Görünmeyen servet", 4, "para,servet", [
      [
        "Kitap serveti neden görünen eşyada aramaz?",
        "Görünen alış, paranın çıktığı yerdir. Kalan para görünmez. Housel serveti, alınmamış olanda arar. Alınmış olan, servetin kendisi gibi dolaşır.\n\nKomşu o dolaşanı görür. Görmediği, duran paradır.",
        ["Alınmış olanın servet olduğu", "Kalan paranın görünmemesi", "Eşyanın birikimi büyüttüğü", "Komşunun duran parayı gördüğü"],
        1,
        "Servet, alınan şeyde değil, duran parada aranır.",
      ],
      [
        "Gösterilen hayat neden zenginlik ölçüsü olmaz?",
        "Gösterilen şey, harcanmış olmaktır. Harcamak bir zevk olabilir. Zevk, duran paranın kanıtı değildir. Kitap bu ikisini ayırır.\n\nÖlçüyü gösterilene koyan, çıkışı giriş sanır.",
        ["Harcamanın duran parayı gösterdiği", "Gösterilenin harcanmış olmak olduğu", "Zevkin servet sayıldığı", "Çıkışın girişle aynı olduğu"],
        1,
        "Gösterilen hayat, harcanmış olanıdır.",
      ],
      [
        "Komşunun gördüğü neden yanıltır?",
        "Komşu yalnızca sokağa çıkanı görür. Sokağa çıkmayan para, kıyasın dışında kalır. Kıyas bu yüzden serveti değil, servetten çıkanı yarıştırır.\n\nYarış, duran parayı küçültür. Çünkü duran para yarışa gelmez.",
        ["Sokağa çıkmayan paranın görüldüğü", "Kıyasın, duran parayı değil çıkanı yarıştırdığı", "Yarışın serveti büyüttüğü", "Komşunun kasayı bildiği"],
        1,
        "Kıyas, serveti değil servetten çıkanı yarıştırır.",
      ],
    ]),
    lesson("Oyunda kalmak", 5, "para,sure", [
      [
        "Kitap her yıl haklı çıkmayı neden asıl hüner saymaz?",
        "Paranın Psikolojisi’nde sonucun büyük kısmını az sayıda olay taşır. Her yıl doğru olmak, o olaylar gelene kadar oyunda kalmaktan daha az iş görür. Bir kez oyundan düşmek, doğru yılları da götürür.\n\nHata payı bu yüzden bir korkaklık değil, sürenin şartıdır.",
        ["Her yılın eşit ağırlıkta olduğu", "Az sayıda olayın sonucu taşıması ve düşmenin yılları götürmesi", "Hata payının kazancı iptal ettiği", "Doğru yılın düşmeyi önlediği"],
        1,
        "Az sayıda olay sonucu taşır. Düşmek, doğru yılları da götürür.",
      ],
      [
        "Hata payı neden ihtiyatlı bir süs değildir?",
        "Pay, plan tutmazsa kişinin masada kalması için bırakılır. Süs olan ihtiyat, ilk sıkıntıda harcanır. Kitaptaki pay, harcanmasın diye durur.\n\nDurduğu için zaman, işini yapacak birini bulur.",
        ["Payın ilk sıkıntıda harcandığı", "Payın, plan tutmazsa masada kalmak için durduğu", "İhtiyatın zamanı durdurduğu", "Süsün süre sayıldığı"],
        1,
        "Hata payı, plan tutmazsa masada kalmak için durur.",
      ],
      [
        "Zaman neden haklı çıkmaktan daha çok çalışır?",
        "Haklı çıkmak bir yılın olayıdır. Zaman, oyunda kalanın üzerinden tekrar tekrar geçer. Kitap bu geçişi, zekânın tek atışından daha ağır sayar.\n\nTek atış parlaktır. Parlak atış, masa boşaldıysa iş göremez.",
        ["Tek atışın zamanı yendiği", "Zamanın, masada kalanın üzerinden geçtiği", "Parlak yılın payı sildiği", "Haklı çıkmanın süre olduğu"],
        1,
        "Zaman, masada kalanın üzerinden geçer.",
      ],
    ]),
  ],
);

const pur = unit(
  "Pür Dikkat",
  "Cal Newport’un Pür Dikkat’inde bölünmeyen iş ile meşgul günün ayrımı. Her ders üç okuma ve bu okumadan cevaplanan bir sorudan oluşur.",
  9,
  [
    lesson("Pür ve sığ", 1, "pur,is", [
      [
        "Kitap iki işi neden aynı mesai saymaz?",
        "Pür Dikkat, bölünmeden yapılan işi, kopyası zor bir değer olarak anlatır. Sığ iş ise lojistiktir. Yerine başkası geçebilir, dikkat dağılsa da yürür.\n\nİkisi de yorabilir. Yorulmak, yapılan işin türünü değiştirmez.",
        ["İkisinin de aynı değeri ürettiği", "Birinin kopyasının zor, diğerinin devredilebilir olduğu", "Sığ işin hiç yormadığı", "Pür işin lojistik olduğu"],
        1,
        "Biri zor kopyalanır, diğeri devredilebilir.",
      ],
      [
        "Yorulmak neden işin derinliğini göstermez?",
        "Gün, haber ve küçük kararlarla da dolabilir. Kişi akşam bitkin olur. Bitkinlik, o gün kopyası zor bir şey üretildiğinin kanıtı değildir.\n\nKitap yorgunluğu bir ölçü diye kullanmaz.",
        ["Bitkinliğin eseri kanıtladığı", "Dağınık günün de bitkin bırakabildiği", "Sığ işin dinlendirdiği", "Ölçünün yorgunluk olduğu"],
        1,
        "Dağınık bir gün de bitkin bırakabilir.",
      ],
      [
        "Devredilen iş neden değersiz sayılmaz?",
        "Newport sığ işi yasaklamaz. O iş olmazsa gün durur. Ayrım, durduran işin bütün güne yayılmasıdır. Yayılınca, kopyası zor olan işe yer kalmaz.\n\nYer kalmaması, sığ işin suçudur diye kurulmaz. Günün onu tek iş sanmasıdır.",
        ["Sığ işin yasak olduğu", "Sığ iş günü tek başına doldurunca pür işe yer kalmadığı", "Lojistiğin değeri olmadığı", "Devretmenin üretimi bitirdiği"],
        1,
        "Sığ iş günü doldurursa pür işe yer kalmaz.",
      ],
    ]),
    lesson("Dikkat kalıntısı", 2, "pur,kalinti", [
      [
        "İş değiştirmek neden zihni sıfırlamaz?",
        "Kitapta, bırakılan işin dikkatte bir kalıntı bıraktığı anlatılır. Yeni iş, boş bir masada başlamaz. Önceki iş hâlâ masadadır.\n\nHızlı geçiş bu yüzden iki işi birden yapmak değildir. İkisini de yarım bir zihinle taşımaktır.",
        ["Yeni işin boş masada başladığı", "Bırakılan işin dikkatte kaldığı", "Geçişin iki işi tamamladığı", "Kalıntının yalnızca yorgunluk olduğu"],
        1,
        "Bırakılan iş, yeni işin masasında kalır.",
      ],
      [
        "Hızlı geçiş neden verim sanılır?",
        "Gün çok işe değdiği için dolu görünür. Değmek, bitirmek değildir. Kalıntı, değilen her işten bir parça alıkoyar. Parçalar akşam bir başarı listesi gibi durur.\n\nListe, yarım kalan dikkatleri sayar.",
        ["Listenin biten işi saydığı", "Değmenin bitirmek sanılması", "Kalıntının listeyi sildiği", "Çok işin zihni boşalttığı"],
        1,
        "Çok işe değmek, onları bitirmek değildir.",
      ],
      [
        "Kalıntı neden yalnızca mola eksikliği değildir?",
        "Mola, yorgunluğu indirir. Kalıntı ise konu değiştirince de durur. Dinlenmiş bir zihin, az önce bıraktığı dosyayı hâlâ taşıyabilir.\n\nKitap bu yüzden süreyi bölmekle dinlenmeyi ayırır.",
        ["Molanın kalıntıyı sildiği", "Dinlenmiş zihnin de önceki işi taşıyabildiği", "Dosyanın molada bittiği", "Süreyi bölmenin dinlenmek olduğu"],
        1,
        "Dinlenmiş zihin de önceki işi taşıyabilir.",
      ],
    ]),
    lesson("Nadirlik", 3, "pur,nadir", [
      [
        "Bölünmeyen dikkat neden pahalılaşır?",
        "Pür Dikkat, günün dikkati bölmek üzerine kurulduğunu anlatır. Her boşluk bir uyarıyla dolar. Bu ortamda bölünmeden durabilmek seyrek kalır. Seyrek kalan, pahalanır.\n\nPahalık, kişinin özel bir yetenekle doğmasından gelmez. Etrafın tersini ödüllendirmesinden gelir.",
        ["Yeteneğin doğuştan pahalı olduğu", "Etraf bölünmeyi ödüllendirdiği için bölünmemenin seyrek kaldığı", "Uyarının işi derinleştirdiği", "Pahaların meşguliyetten geldiği"],
        1,
        "Bölünmeme, etraf tersini ödüllendirdiği için seyrek kalır.",
      ],
      [
        "Uyarı neden nötr bir araç değildir?",
        "Araç, haber taşıyabilir. Taşıdığı sırada açık olan işi de böler. Kitap aracı yasak bir eşya diye kurmaz. Aracın, dikkatin varsayılan hâli olmasını sorar.\n\nVarsayılan bölünme olunca, bölünmeme bir tercih olarak kalır. Tercih edilmeyeni gün kendiliğinden vermez.",
        ["Aracın yasak olduğu", "Bölünmenin varsayılan olunca kendiliğinden derinleşilmediği", "Haberin işi bitirdiği", "Tercihin gün tarafından verildiği"],
        1,
        "Bölünme varsayılan olursa gün derinliği kendiliğinden vermez.",
      ],
      [
        "Kıymet neden meşgul olanın değil, durabilenin üstünde toplanır?",
        "Meşgul olan çoğalır. Durabilen azalır. Newport kıymeti, azalan tarafa koyar. Çoğalan taraf günü doldurur, kopyası zor olan işi değil.\n\nDolu gün ile kıymetli gün bu yüzden ayrılır.",
        ["Meşgul olanın azaldığı", "Kıymetin, seyrek kalan bölünmemede toplandığı", "Dolu günün kopyasının zor olduğu", "Azalan tarafın değersiz olduğu"],
        1,
        "Kıymet, seyrek kalan bölünmemede toplanır.",
      ],
    ]),
    lesson("Meşgul takvim", 4, "pur,mesgul", [
      [
        "Dolu bir takvim neden işin ölçüsü olmaz?",
        "Kitapta takvim, sığ işlerle de ağzına kadar dolabilir. Doluluk bir hareket hissi verir. Hareket, kopyası zor bir üretimin yerine geçebilir.\n\nAkşam sorulacak soru, günün dolu olup olmadığı değildir. Günün hangi tür işle dolduğudur.",
        ["Dolu günün derin olduğu", "Doluluğun, işin türünü gizleyebildiği", "Boş günün her zaman üretken olduğu", "Hareketin eseri kanıtladığı"],
        1,
        "Takvim dolu olabilir ve iş yine sığ kalabilir.",
      ],
      [
        "Hareket hissi neden tehlikelidir?",
        "Kişi gün boyu cevap vermiştir. Cevap vermek, bir şeyin ilerlediği duygusunu üretir. Duygu, ilerlemeyi ölçmez. Kitap bu duyguyu bir rapor diye kabul etmez.\n\nRapor, biten derin işi sorar.",
        ["Cevabın ilerleme olduğu", "Cevap vermenin ilerleme duygusu üretip ilerlemeyi ölçmediği", "Raporun duyguya baktığı", "Boş cevabın derin iş olduğu"],
        1,
        "Cevap vermek ilerleme hissi verir, ilerlemeyi ölçmez.",
      ],
      [
        "Akşam sorusu neden saat saymaz?",
        "Sekiz saat, sekiz saat sığ iş de olabilir. Saat, türü söylemez. Pür Dikkat türü sorar. Tür sorulmazsa uzun gün, kendiliğinden kıymetli gün olur.\n\nOlmaz. Uzunluk ile derinlik ayrı eksenlerdir.",
        ["Saatin türü söylediği", "Uzun günün kendiliğinden derin olmadığı", "Sığ işin kısa sürdüğü", "Eksenlerin aynı olduğu"],
        1,
        "Günün uzunluğu, işin derinliğini söylemez.",
      ],
    ]),
    lesson("Sıkıntı", 5, "pur,sikinti", [
      [
        "Kitap sıkıntıyı neden bir arıza saymaz?",
        "Pür Dikkat’te boş dakika hemen doldurulursa zihin, tek bir zor şeyin yanında durmayı çalışmamış olur. Sıkıntı o çalışmanın boş sahasıdır. Saha kapanırsa derin iş, istenince birden gelmez.\n\nSıkıntı bir erdem gösterisi değildir. Dikkatin idmanıdır.",
        ["Sıkıntının erdem gösterisi olduğu", "Boş dakikanın, tek işin yanında durma idmanı olduğu", "Doldurmanın dikkati eğittiği", "Derin işin istenince geldiği"],
        1,
        "Boş dakika, dikkatin tek işte durma idmanıdır.",
      ],
      [
        "Boşluğu doldurmak neden dinlenmek değildir?",
        "Dinlenmek, dikkati bir işten çözer. Doldurmak, onu başka bir uyarıya bağlar. Kişi ikisini aynı sanır. Kitap bağlamayı dinlenme diye yazmaz.\n\nBağlı dikkat, boş görünen dakikada da meşguldür.",
        ["Uyarının dinlendirdiği", "Doldurmanın dikkati başka bir uyarıya bağladığı", "Çözmenin meşguliyet olduğu", "Boş dakikanın uyarı sayıldığı"],
        1,
        "Boşluğu doldurmak, dikkati başka bir uyarıya bağlar.",
      ],
      [
        "Derin iş neden canı isteyince başlamaz?",
        "Zihin, her boşlukta kaçmaya alışmışsa zor işin yanında duracak kası yoktur. Newport o kası, sıkıntıya katlanılan küçük aralıklarda arar. Aralık yoksa istek de işi taşımaz.\n\nİstek bir kıvılcımdır. Kas yoksa kıvılcım söner.",
        ["İsteğin kasın yerini tuttuğu", "Kaçmaya alışmış zihnin zor işin yanında duramadığı", "Aralığın işi böldüğü", "Kıvılcımın idmanı bitirdiği"],
        1,
        "Her boşlukta kaçan zihin, zor işin yanında duramaz.",
      ],
    ]),
  ],
);

const hizli = unit(
  "Hızlı ve Yavaş Düşünme",
  "Kahneman’ın Hızlı ve Yavaş Düşünme’sinde hızlı hükmün yavaş imzası. Her ders üç okuma ve bu okumadan cevaplanan bir sorudan oluşur.",
  10,
  [
    lesson("İmza", 1, "hizli,sistem", [
      [
        "Yavaş düşünce neden her zaman yöneten taraf değildir?",
        "Kitapta hızlı olan önerir. Yavaş olan çoğu zaman o öneriyi incelmez, imzalar. Yavaş düşünebilmek ile o an yavaş düşünmek ayrıdır.\n\nKişi ikinci sistemi taşıdığını bilir. Taşımak, her hükümde onu çalıştırmak değildir.",
        ["Hızlı olanın hiç hüküm vermediği", "Yavaş olanın çoğu zaman öneriyi yalnızca imzaladığı", "İmzanın inceleme olduğu", "İkinci sistemin her an çalıştığı"],
        1,
        "Yavaş sistem çoğu zaman incelmez, imzalar.",
      ],
      [
        "Taşımak neden kullanmak değildir?",
        "Kişi mantıklı düşünebildiğini söyler. Söylemek, o cümlenin kurulduğu anda yavaş sistemin uyanık olduğunu göstermez. Hızlı hüküm çoktan kurulmuştur. Yavaş olan yetişirse düzeltir. Yetişmeyebilir.\n\nKitap bu yetişmemeyi bir arıza diye değil, olağan hâli diye anlatır.",
        ["Hızlı hükmün her zaman düzeltildiği", "Yavaş sistemin yetişmeyebildiği ve bunun olağan olduğu", "Söylemenin uyanıklık olduğu", "Arızanın imkânsız olduğu"],
        1,
        "Yavaş sistem her hükümde yetişmez. Bu olağan hâldir.",
      ],
      [
        "İmza neden bir düşünce başarı sayılmaz?",
        "İmza, önerinin üstünden geçmektir. Geçmek, öneriyi kurmakla karışır. Kişi imzaladığı hükmü, yavaşça bulduğu hüküm sanır.\n\nKahneman o sanıyı, sistemin tembelliği olarak bırakır. Tembel olan aptal değildir. Çoğu zaman çalışmamayı seçer.",
        ["İmzanın hükmü kurduğu", "İmzalanan hükmün yavaşça bulunmuş sanıldığı", "Tembelliğin aptallık olduğu", "Hızlı önerinin hiç imzalanmadığı"],
        1,
        "Kişi, imzaladığı hükmü yavaşça bulduğunu sanabilir.",
      ],
    ]),
    lesson("Görünen yeter", 2, "hizli,gorunen", [
      [
        "Zihin neden elindeki bilgiyi bütün sanır?",
        "Hızlı ve Yavaş Düşünme’de zihin, önündekilerle eksiksiz bir hikâye kurar. Eksik parça, eksik diye değil, yokmuş gibi durur. Hikâye bu yüzden kendinden emin olur.\n\nEminlik, bilginin tamam olduğunun kanıtı değildir. Tamam sanmanın kendisidir.",
        ["Eksik parçanın hesaba katıldığı", "Eksik parçanın yokmuş gibi durması", "Eminliğin bilgiyi tamamladığı", "Hikâyenin şüphe ürettiği"],
        1,
        "Eksik parça yokmuş gibi durur. Hikâye bundan emin olur.",
      ],
      [
        "Emin hikâye neden tehlikelidir?",
        "Kişi, gördüğüne uyan bir son yazar. Uymayan bilgi henüz gelmemiştir. Gelmemiş olmak, hikâyede bir delik olarak görünmez. Delik görünmeyince arama da durur.\n\nKitap aramayı, eminliğin susturduğunu söyler.",
        ["Eminliğin aramayı açtığı", "Delik görünmeyince aramanın durduğu", "Uymayan bilginin hikâyeye girdiği", "Sonun şüpheli kaldığı"],
        1,
        "Delik görünmezse arama durur.",
      ],
      [
        "Daha fazla bilgi neden her zaman aynı hikâyeyi bozar?",
        "Yeni bilgi, kurulmuş hikâyeye uymuyorsa hikâye direnir. Direniş, kişinin inatçı olmasından önce, hikâyenin kendini tamam sanmasından gelir.\n\nTamam sanılan hikâye, eklemeyi bir tehdit gibi karşılar.",
        ["Yeni bilginin hemen içeri girdiği", "Tamam sanılan hikâyenin eklemeye direndiği", "Direnişin yalnızca inat olduğu", "Tehdidin bilgiyi çoğalttığı"],
        1,
        "Kendini tamam sanan hikâye, yeni bilgiye direnir.",
      ],
    ]),
    lesson("Kayıp ve kazanç", 3, "hizli,kayip", [
      [
        "Aynı miktar neden inişte ve çıkışta aynı his değildir?",
        "Kitapta kayıp, aynı büyüklükteki kazançtan daha ağır basar. Yüz lira bulmak ile yüz lira kaybetmek, hesapta simetriktir. His o simetriyi tanımaz.\n\nKarar çoğu zaman hesaba değil, bu ağırlığa göre kurulur.",
        ["Hesabın hisle aynı olduğu", "Kaybın, aynı kazançtan daha ağır basması", "Çıkışın her zaman daha acı verdiği", "Simetrinin kararı yönettiği"],
        1,
        "Kayıp, aynı büyüklükteki kazançtan daha ağır basar.",
      ],
      [
        "Kişi neden kazancı korumayı kazancı aramaktan önde tutar?",
        "Ağır basan kayıp, eldekinden olmamayı birinci iş yapar. Yeni kazanç ikinci sıraya düşer. Bu bir cimrilik ilanı değildir. Tartının nasıl eğildiğinin adıdır.\n\nEğik tartı, iki seçeneği eşit görmez.",
        ["İki seçeneğin eşit görüldüğü", "Eldekinden olmamak isteğinin yeni kazancın önüne geçtiği", "Cimriliğin tartıyı düzelttiği", "Kazancın her zaman birinci olduğu"],
        1,
        "Eldekinden olmamak, yeni kazancın önüne geçebilir.",
      ],
      [
        "Eğik tartı neden bir hesap hatası sayılmaz?",
        "Kişi toplama yapabilir ve yine de kaybı ağır yaşar. Hata, dört işlemin yanlış olması değildir. Dört işlem doğru olsa da karar o işlemin dışındaki ağırlıkla verilir.\n\nKahneman o ağırlığı bir kusur diye silmez. Kararın içine yazar.",
        ["Toplamanın her zaman yanlış olduğu", "Doğru hesabın da kaybın ağırlığını silmediği", "Ağırlığın karara girmediği", "Kusurun tartıyı düzelttiği"],
        1,
        "Doğru hesap, kaybın daha ağır yaşanmasını silmez.",
      ],
    ]),
    lesson("Hatırlanan gün", 4, "hizli,hatira", [
      [
        "Anlatılan gün neden yaşanan gün değildir?",
        "Kitap, yaşayan ben ile hatırlayan beni ayırır. Yaşayan, saatleri tek tek geçer. Hatırlayan, zirveyi ve sonu ağırlaştırır. Arada kalan saatler hikâyede incelir.\n\nKişi incelmiş saatleri yaşamamış gibi konuşabilir. Yaşamıştır. Hikâye onları taşımaz.",
        ["Her saatin eşit hatırlandığı", "Zirve ile sonun, aradaki saatleri incelttiği", "Yaşayan benin hikâyeyi kurduğu", "Sonun hiç ağırlık taşımadığı"],
        1,
        "Hatıra zirveyi ve sonu ağırlaştırır, aradaki saatleri inceltir.",
      ],
      [
        "Kötü bir son neden güzel saatleri silebilir?",
        "Son, hatırlayanın elindeki son fırçadır. Fırça koyuysa önceki açık saatler kararır. Kararma, o saatlerin yaşanmadığı anlamına gelmez.\n\nKitap bu kararmayı bir yalan diye değil, hatıranın kuralı diye anlatır.",
        ["Sonun önceki saatleri değiştirmediği", "Koyu bir sonun önceki saatleri hatırada kararttığı", "Yaşanmış saatin silindiği", "Fırçanın hesabı düzelttiği"],
        1,
        "Koyu bir son, önceki saatleri hatırada karartabilir.",
      ],
      [
        "Karar neden yaşanan saate değil hatıraya bakabilir?",
        "Kişi bir sonraki seçimi, saatlerin ortalamasına göre kurmaz. Kurduğu şey, aklında kalan zirve ve sondur. Ortalama daha adil olabilir. Adil olan, kararı yönetmeyebilir.\n\nBu yüzden tekrar edilen tercih, en uzun süren hâli değil, en çok hatırlanan hâli seçer.",
        ["Ortalamanın kararı yönettiği", "Tercihin, en uzun hâli değil en çok hatırlanan hâli seçtiği", "Zirvenin hesaba girmediği", "Adil ölçünün her zaman kazanması"],
        1,
        "Tekrar edilen tercih, en çok hatırlanan hâli seçer.",
      ],
    ]),
    lesson("İçerden plan", 5, "hizli,plan", [
      [
        "Plan neden benzer işlerin süresini atlar?",
        "Hızlı ve Yavaş Düşünme’de plan, bu işin içinden kurulur. Umut, engel ve niyet oradadır. Benzer işlerin gerçekte ne kadar sürdüğü dışarıda kalır. İçerideki hikâye, dışarıdaki süreyi gereksiz sanır.\n\nGereksiz sanılan süre, sonunda takvimi bozar.",
        ["Dışarıdaki sürenin plana girdiği", "Planın bu işin umuduyla kurulup benzer süreleri dışarıda bıraktığı", "Takvimin umudu düzelttiği", "Benzer işin hiç var olmadığı"],
        1,
        "Plan bu işin içinden kurulur, benzer süreler dışarıda kalır.",
      ],
      [
        "Umut neden bir süre ölçüsü değildir?",
        "Umut, işin nasıl gitmesini istediğini söyler. Süre, benzer işin nasıl gittiğini söyler. İkisi aynı cümlede durunca umut, sürenin yerine geçer.\n\nKitap o geçişi plan yanılması diye adlandırır.",
        ["Umudun süreyi ölçtüğü", "Umudun, benzer işin süresinin yerine geçebildiği", "Yanılmanın takvimi kısalttığı", "Benzer işin umudu doğruladığı"],
        1,
        "Umut, benzer işin sürdüğü yerin yerine geçebilir.",
      ],
      [
        "Dışarıdaki süre neden moral bozmak için hatırlanmaz?",
        "Benzer işin uzamış olması, bu işin değersiz olduğunu söylemez. Söylediği, takvimin içerideki hikâyeye göre çizilmemesidir. Çizgi dışarıdan gelince umut iptal olmaz. Yeri değişir.\n\nUmut işi ister. Süre, isteğin takvimini düzeltir.",
        ["Uzayan işin değersiz olduğu", "Dış sürenin umudu iptal etmeden takvimi düzelttiği", "Moralin süreyi kısalttığı", "İç hikâyenin her zaman tuttuğu"],
        1,
        "Benzer süre umudu iptal etmez, takvimin yerini değiştirir.",
      ],
    ]),
  ],
);

const tteok = unit(
  "Tteokbokki",
  "Baek Sehee’nin Ölmek İstiyorum Ama Tteokbokki de Yemek İstiyorum kitabında süren alçaklık. Her ders üç okuma ve bu okumadan cevaplanan bir sorudan oluşur. Bu bir tedavi değildir.",
  1,
  [
    lesson("Süren alçaklık", 1, "tteok,distimi", [
      [
        "Kitap bu hâli neden tek bir çöküş sahnesi diye kurmaz?",
        "Tteokbokki, bir günün içinde biten bir kriz diye yazılmaz. Distimi, kişi işine devam ederken süren alçak bir hâldir. Mesaj cevaplanır. Gün yürür. Yürüyen gün, içerinin de yürüdüğünü göstermez.\n\nKitapta anlatılan, acının hafif olduğu değildir. Acının, günü durdurmadan da durabildiğidir.",
        ["Acının hafif olduğu", "Günün yürürken de alçaklığın sürebileceği", "Çöküşün hiç olmadığı", "Mesajın iyileşmeyi kanıtladığı"],
        1,
        "Gün yürürken de alçaklık sürebilir.",
      ],
      [
        "İdare etmek neden iyileşmek sayılmaz?",
        "Kişi toplantıya girer, işi bitirir, eve döner. Dışarıdan bakınca idare vardır. Kitap o idareyi, içerideki hâlin ölçüsü yapmaz.\n\nÖlçü karışınca, yürüyen gün sağlam gün sanılır.",
        ["Toplantının içeriyi ölçtüğü", "Yürüyen günün sağlam gün sanılmaması", "İdarenin acıyı sildiği", "Eve dönmenin teşhis olduğu"],
        1,
        "Yürüyen gün, sağlam gün değildir.",
      ],
      [
        "Sessiz süren hâl neden geç fark edilir?",
        "Bağıran bir kriz etrafa haber verir. Süren alçaklık haber vermez. Kişi de bunu huyu sanabilir. Kitap huy ile hastalığı ayırır.\n\nAyırmayınca yıllar, karakter diye taşınır.",
        ["Krizin her zaman sessiz olduğu", "Haber vermeyen hâlin huy sanılabildiği", "Yılların teşhisi kolaylaştırdığı", "Karakterin hastalığı bitirdiği"],
        1,
        "Haber vermeyen alçaklık, huy sanılabilir.",
      ],
    ]),
    lesson("İki istek", 2, "tteok,istek", [
      [
        "Tteokbokki istemek acıyı neden yalan çıkarmaz?",
        "Kitabın adı iki cümleyi birden tutar. Ölmek istemek, küçük bir iştahın öldüğünü göstermez. Tteokbokki istemek de acının numara olduğunu göstermez.\n\nİki cümle birbirini silmez. Silinmeyi bekleyen okuma, kitabın kurduğu hâli kaçırır.",
        ["İştahın acıyı sildiği", "İki cümlenin birbirini silmeden durabildiği", "Küçük isteğin numara olduğu", "Adın tek bir duygu taşıdığı"],
        1,
        "İki istek birbirini silmeden durabilir.",
      ],
      [
        "Küçük iştah neden iyileşme kanıtı değildir?",
        "Kişi bir şeyi hâlâ isteyebilir ve aynı saatte yaşamayı ağır bulabilir. İstek, terazinin diğer kefesini kaldırmaz. Kitap o kefeyi kaldırmadan da iştahı ciddiye alır.\n\nCiddiye almak, acıyı küçültmek değildir.",
        ["İştahın kefeyi kaldırdığı", "Küçük isteğin, ağır olanı iptal etmediği", "Acının iştahı yasakladığı", "Terazinin tek kefesi olduğu"],
        1,
        "Küçük istek, ağır olanı iptal etmez.",
      ],
      [
        "Tek cümleye indirmek neden kitabı eksiltir?",
        "Yalnızca ölmek istemeyi okuyan, günün içindeki iştahı atar. Yalnızca tteokbokkiyi okuyan, acıyı şakaya çevirir. Kitap ikisini de atmaz.\n\nAtılan taraf, okurun rahatladığı taraftır. Rahatlama, kitabın cümlesi değildir.",
        ["Tek cümlenin kitabı tamamladığı", "Rahatlamak için atılan tarafın kitabın cümlesi olmadığı", "İştahın şaka olduğu", "Acının okunmaması gerektiği"],
        1,
        "Rahatlamak için taraflardan birini atmak, kitabı eksiltir.",
      ],
    ]),
    lesson("İyi yüz", 3, "tteok,yuz", [
      [
        "Dışarıdan idare etmek içeriyi neden ölçmez?",
        "Sehee’nin anlattığı yerde yüz, işini görür. Gören, o yüzü hâl sanır. Kitap yüz ile hâl arasındaki boşlukta durur.\n\nBoşluk kapanmış gibi konuşmak, görenin rahatlığıdır. Yaşayanın ölçüsü değildir.",
        ["Yüzün hâli gösterdiği", "Görenin rahatlığının yaşayanın ölçüsü olmadığı", "Boşluğun kapandığı", "İdarenin içeriyi düzelttiği"],
        1,
        "Görenin rahatlığı, yaşayanın ölçüsü değildir.",
      ],
      [
        "İyi görünen kişiye neden soru sorulmaz?",
        "Soru, dağılmış olana gider. Dağılmadan süren alçaklık soru almaz. Kitap bu suskunluğu bir nezaket diye değil, bir körlük diye bırakır.\n\nNezaket sanılan şey, bakmamaktır.",
        ["Nezaketin bakmak olduğu", "Dağılmadan süren hâlin soru dışı kalması", "Sorunun yalnızca meraklı olduğu", "İyi yüzün davet ettiği"],
        1,
        "Dağılmadan süren hâle çoğu zaman soru sorulmaz.",
      ],
      [
        "Kişi kendi yüzüne neden inanır?",
        "Yüz iş gördükçe kişi de işin görüldüğünü, kendisinin de görüldüğünü sanabilir. Sanmak, içeriyi yoklamaz. Kitap yoklamanın yüzün başarısından ayrı olduğunu söyler.\n\nBaşarı, yoklamanın yerine geçerse hâl adını kaybeder.",
        ["Başarının hâli adlandırdığı", "Yüzün başarısının yoklamanın yerine geçebildiği", "İnanmanın teşhis olduğu", "İçerinin yüzle aynı kaldığı"],
        1,
        "Yüz iş görürse kişi, yoklamayı bırakabilir.",
      ],
    ]),
    lesson("Başkasının notu", 4, "tteok,bakis", [
      [
        "Kitap öz değeri neden yalnızca üzüntüye bağlamaz?",
        "Kayıtlarda dönen düğümlerden biri, kişinin kendini başkasının bakışıyla notlamasıdır. Üzüntü tek konu değildir. Konu, o notu kendi değeri sanmaktır.\n\nBakış değişince not değişir. Değer de bakışla birlikte oynar. Kitap bu oynamayı bir karakter kusuru diye kapatmaz.",
        ["Üzüntünün tek konu olduğu", "Değerin, başkasının bakışının notu sanılması", "Notun sabit kaldığı", "Bakışın kişiyi iyileştirdiği"],
        1,
        "Kişi, başkasının bakışını kendi değeri sanabilir.",
      ],
      [
        "Not değişince değer neden de değişiyor sanılır?",
        "Övgü gelince kişi yükselir. İlgisizlik gelince düşer. İkisi de dışarıdaki havadır. Kitap, havayı içerideki ölçü diye kullanan hâli gösterir.\n\nHava ölçüsü olunca, kişinin kendi tartısı boş kalır.",
        ["Havanın içerideki tartı olduğu", "Dışarıdaki havanın tartının yerine geçmesi", "Övgünün tartıyı kurduğu", "İlgisizliğin her zaman doğru ölçtüğü"],
        1,
        "Dışarıdaki hava, kişinin kendi tartısının yerine geçebilir.",
      ],
      [
        "Bu düğüm neden bir utanma hikâyesi değildir?",
        "Başkasının notuyla yaşamak, kitabın teşhir ettiği bir ayıp değildir. Teşhis ettiği bir bağdır. Bağ görülünce utanmak yetmez. Görülen şey, değerin nereden ödünç alındığıdır.\n\nÖdünç alınan değer, sahibinin sandığı yerde durmaz.",
        ["Utanmanın teşhis olduğu", "Bağın bir ayıp değil, değerin ödünç alındığı yer olduğu", "Notun kişiye ait olduğu", "Ödüncün sahibini değiştirmediği"],
        1,
        "Bu bir ayıp listesi değil, değerin nereden ödünç alındığıdır.",
      ],
    ]),
    lesson("Rehber değil", 5, "tteok,rehber", [
      [
        "Seans kaydı neden bir tedavi yöntemi sayılmaz?",
        "Sehee kayıtları önce kendisi için tutar. Kitap, distimiyi bitiren bir usul sunmaz. Birinin odada söylediği, okuyanın tedavisinin yerine geçmez.\n\nOkumak, o odada olmak değildir. Bilinen bir acıda quiz de tedavi değildir.",
        ["Okumanın tedavi olduğu", "Kaydın, hastalığı bitiren bir usul olarak yazılmadığı", "Quiz’in odanın yerine geçtiği", "Usulün kitapta tamamlandığı"],
        1,
        "Kayıt bir tedavi usulü değildir. Okumak, odada olmak değildir.",
      ],
      [
        "Başkasının seansı neden kişinin kendi hâlinin tarifi olmaz?",
        "Tanıdık bir cümle, aynı hastalığın aynı yerde durduğunu göstermez. Kitap bir ayna tutabilir. Ayna, muayene değildir.\n\nTanımak rahatlatır. Rahatlama, bir hükmün yerine geçmez.",
        ["Aynanın muayene olduğu", "Tanıdık cümlenin muayenenin yerine geçmediği", "Rahatlamanın teşhis olduğu", "Aynı cümlenin aynı hastalık olduğu"],
        1,
        "Tanıdık bir cümle, muayene değildir.",
      ],
      [
        "Kitap neden bitiş vaat etmez?",
        "Son sayfa, hâlin kapandığı yer değildir. Kayıt, bir sürecin ortasından alınmıştır. Orta, finale benzetilirse okur yanlış bir eşik bekler.\n\nEşik gelmeyince kitap başarısız olmuş sayılır. Sayılmaz. Kitap o eşiği kurmamıştır.",
        ["Son sayfanın hâli kapattığı", "Kaydın bir final değil, sürecin ortası olduğu", "Eşiğin kitapta vaat edildiği", "Ortada bitenin başarısızlık olduğu"],
        1,
        "Kayıt bir final değildir. Son sayfa hâli kapamaz.",
      ],
    ]),
  ],
);

const hala = unit(
  "Hâlâ tteokbokki",
  "Aynı yazarın Ölmek İstiyorum Ama Hâlâ Tteokbokki Yemek İstiyorum kitabında süren tedavi. Her ders üç okuma ve bu okumadan cevaplanan bir sorudan oluşur. Bu bir tedavi değildir.",
  2,
  [
    lesson("Kapanmayan kitap", 1, "hala,son", [
      [
        "İkinci kitap neden birincinin mutlu sonu değildir?",
        "Hâlâ tteokbokki, ilk kitabın distimiyi bitirmediği için vardır. Son sayfa bir eşik sanılmıştır. Eşik, hastalığın takvimi değildir.\n\nDevam kitabı, bir zafer turu diye yazılmaz. Süren hâlin ikinci kaydıdır.",
        ["İlk kitabın hastalığı bitirdiği", "Devamın, kapanmayan hâlin ikinci kaydı olduğu", "Son sayfanın eşik olduğu", "İkinci kitabın zafer turu olduğu"],
        1,
        "İkinci kitap, kapanmayan hâlin kaydıdır.",
      ],
      [
        "Eşik beklentisi neden okuru yanlıştır?",
        "Okur, birinci kitabın sonunda bir düzelme hakkı ister. İstemek, yazarın kurduğu şeyi değiştirmez. Kitap o hakkı vaat etmemiştir.\n\nVaat edilmeyen eşiği aramak, süren hâli bir başarısızlık gibi okutur.",
        ["Vaat edilen eşiğin geldiği", "Kurulmayan eşiği aramanın süren hâli başarısızlık sandırdığı", "Düzelmenin takvim olduğu", "Okurun vaadi tamamladığı"],
        1,
        "Kurulmayan eşiği aramak, süren hâli başarısızlık sandırır.",
      ],
      [
        "Devam etmek neden aynı şeyi tekrar etmek değildir?",
        "Aynı oda, aynı konu sanılabilir. İkinci kayıt, birincinin fotokopisi değildir. Hâl kapanmadığı için yeni bir tur atılır. Tur, aynı cümleyi ezberletmez.\n\nEzber arayan, turdaki değişen düğümü kaçırır.",
        ["İkinci kaydın fotokopi olduğu", "Kapanmadığı için atılan turda düğümün değişebildiği", "Aynı odanın aynı cümle olduğu", "Tekrarın derinleşmeyi bitirdiği"],
        1,
        "Hâl kapanmadığı için atılan tur, aynı cümlenin ezberi değildir.",
      ],
    ]),
    lesson("Karmaşıklaşan iç", 2, "hala,dugum", [
      [
        "Tedavi sürdükçe iç neden sadeleşmez?",
        "İkinci kitapta çatışma, çözüldükçe sadeleşen bir düğüm değildir. Bakıldıkça daha karmaşık hâle gelir. İyileşme, hissin azalması sanılır. Kitap, hissin adının çoğalabildiğini gösterir.\n\nAdı çoğalan his, daha hafif olmak zorunda değildir.",
        ["Hissin tedaviyle sadeleştiği", "Bakıldıkça çatışmanın daha karmaşık görünebildiği", "Adı çoğalan hissin hafiflediği", "Düğümün ilk seansta çözüldüğü"],
        1,
        "Bakıldıkça çatışma daha karmaşık görünebilir.",
      ],
      [
        "Daha iyi bir hafta neden düğümü bitirmez?",
        "Hafta hafifleyebilir. Hafifleyen hafta, düğümün çözüldüğü hafta değildir. Kişi hafifliği final sanır. Final sanılan yerden dönünce her şey başa sarılmış gibi olur.\n\nSarılmaz. Hafiflik, çözümün kendisi değildir.",
        ["Hafif haftanın final olduğu", "Hafifliğin, düğümün çözümü sayılmadığı", "Dönüşün her şeyi sildiği", "Çözümün hafiflikle aynı olduğu"],
        1,
        "Hafif bir hafta, düğümün çözüldüğü hafta değildir.",
      ],
      [
        "Karmaşa neden tedavinin bozulması değildir?",
        "Kişi, daha çok düğüm görünce odanın işe yaramadığını düşünebilir. Kitap o görünmeyi, işe yaramamak diye yazmaz. Örtülen şey açılmıştır.\n\nAçılan örtü, dağınıklık gibi durur. Dağınıklık, örtünün altındayken de oradadır.",
        ["Çok düğümün odayı iptal ettiği", "Görünen karmaşanın, örtülen şeyin açılması olduğu", "Örtünün düğümü sildiği", "Açıklığın bozulma olduğu"],
        1,
        "Görünen karmaşa, örtülen şeyin açılması olabilir.",
      ],
    ]),
    lesson("Aynı oda", 3, "hala,oda", [
      [
        "İkinci kitap neden yeni bir yöntem getirmez?",
        "Hâlâ tteokbokki, başka bir teknikle gelen bir el kitabı değildir. Yine psikiyatristin odasıdır. Yöntem değişmemiştir. Süren, konuşmanın kendisidir.\n\nYeni bir kapak, yeni bir usul sanılır. Kapak değişir. Usul aynı odada kalır.",
        ["Kapağın usulü değiştirdiği", "Sürecin aynı odada, yeni bir teknik olmadan devam ettiği", "El kitabının ikinci ciltte başladığı", "Konuşmanın yerini yöntemin aldığı"],
        1,
        "İkinci kitap yeni bir teknik getirmez. Aynı odada devam eder.",
      ],
      [
        "Aynı oda neden sıkıcı bir tekrar sayılmaz?",
        "Oda değişmeyince okur, konunun da değişmediğini sanabilir. Konu aynı kişi olabilir. Düğüm aynı yerde durmak zorunda değildir.\n\nKitap mekânı sabit tutar, düğümü değil.",
        ["Mekân değişmeyince düğümün de donduğu", "Odanın sabit, düğümün ise donmak zorunda olmadığı", "Tekrarın her sayfada aynı olduğu", "Kişinin değişmediği"],
        1,
        "Oda aynı kalabilir, düğüm donmak zorunda değildir.",
      ],
      [
        "Usul aramak neden bu kitabı kaçırır?",
        "Okur, uygulanacak bir adım ister. Kitap adım vermek için yazılmamıştır. Adım arayan, kaydın gösterdiği bağı atlar.\n\nAtlanan bağ, tam da süren hâlin bağdır.",
        ["Kitabın bir adımlar listesi olduğu", "Adım arayanın, kayıttaki bağı atladığı", "Usulün bağı çözdüğü", "Listenin ikinci kitabın konusu olduğu"],
        1,
        "Uygulanacak adım aramak, kayıttaki bağı atlar.",
      ],
    ]),
    lesson("Tanımak", 4, "hala,okur", [
      [
        "Kitap genç okura neden bir teknik yüzünden ulaşmaz?",
        "Sehee, sesinin bu kadar gence gideceğini beklememiştir. Gidiş, öğretilen bir numara yüzünden değildir. Giden, günü yürürken süren hâli tanıyan kişidir.\n\nTanımak, aynı hastalığı paylaşmak zorunda değildir. Tanıdık olan, acının bağırarak gelmek zorunda olmamasıdır.",
        ["Numaranın kitabı taşıdığı", "Okurun, bağırmadan süren hâli tanıması", "Gençliğin teşhis olduğu", "Beklentinin yöntemi değiştirdiği"],
        1,
        "Kitap, bağırmadan süren hâli tanıyan kişiye gider.",
      ],
      [
        "Tanımak neden aynı teşhise sahip olmak değildir?",
        "Okur kendi gününde bir benzerlik görebilir. Benzerlik, aynı hastalığın kopyası değildir. Kitap bu kopya sanısını kurmaz.\n\nKurulsaydı her tanıyan, aynı odanın hastası olurdu. Olmaz.",
        ["Her tanıyanın aynı hasta olduğu", "Benzerliğin, aynı teşhisin kopyası olmadığı", "Günün teşhisi koyduğu", "Kopyanın kitabı tamamladığı"],
        1,
        "Benzerlik görmek, aynı teşhise sahip olmak değildir.",
      ],
      [
        "Yayılmak neden kitabın vaadini değiştirmez?",
        "Çok kişi okuyunca kitap bir çözüm sanılabilir. Okur sayısı, vaat edilen şeyi büyütmez. Vaat, baştan dardır. Dar olan, bir kayıttır.\n\nKalabalık, kaydı bir usule çevirmez.",
        ["Kalabalığın kaydı usule çevirdiği", "Okur sayısının, kitabın vaadini büyütmediği", "Dar vaadin başarısızlık olduğu", "Çözümün baskıyla geldiği"],
        1,
        "Çok okunmak, kaydı bir tedavi usulüne çevirmez.",
      ],
    ]),
    lesson("Eşlik", 5, "hala,eslik", [
      [
        "Kitap el uzatmayı neden iyileştirmek saymaz?",
        "İkinci kitap, çaresizliği bir ömürlük iş olarak gören kişiye eşlik eder. Eşlik, o işi bitiren el değildir. Yanında durmaktır.\n\nDurmak, tedavi vaadi kurulunca bozulur. Kitap o vaadi kurmaz.",
        ["Eşliğin tedaviyi bitirdiği", "Yanında durmanın, işi bitiren el olmadığı", "Vaadin kitapta kurulduğu", "Ömürlük işin bir bölüm olduğu"],
        1,
        "Eşlik, hastalığı bitiren el değildir.",
      ],
      [
        "Ömürlük iş neden bir yenilgi ilanı değildir?",
        "Bitmeyen hâl, kişinin kaybettiği anlamına gelmez. Kitap bitmeyeni, utanç verici bir skor diye yazmaz. Skor arayan, süren işi bir maça çevirir.\n\nMaç olmayan yerde beraberlik de bozgun da yanlış sözdür.",
        ["Bitmeyenin yenilgi olduğu", "Süren işin bir maç skoruna çevrilemeyeceği", "Beraberliğin tedavi olduğu", "Utancın kitabın ölçüsü olduğu"],
        1,
        "Bitmeyen hâl, bir maç skoru değildir.",
      ],
      [
        "Yanında durmak neden öğüt vermek değildir?",
        "Öğüt, karşıdakinin hâline bir sonraki adımı koyar. Eşlik, o adımı koymaz. Koyunca kayıt yine bir rehbere döner.\n\nKitap rehbere dönmemek için yanında kalır. Kalmak, söyleyecek sözün bittiği yer değildir. Sözün yerini değiştirdiği yerdir.",
        ["Öğüdün eşlik olduğu", "Adım koyan sözün kaydı yeniden rehber yaptığı", "Susmanın eşlik sayıldığı", "Rehberin ikinci kitapta başladığı"],
        1,
        "Bir sonraki adımı koymak, eşliği yeniden rehbere çevirir.",
      ],
    ]),
  ],
);

const tutunmak = unit(
  "Yaşama tutunmak",
  "Matt Haig’in Yaşama Tutunmak İçin Nedenler’inde duygunun gelecek hükmü. Her ders üç okuma ve bu okumadan cevaplanan bir sorudan oluşur. Bu bir tedavi değildir.",
  3,
  [
    lesson("Yarının hükmü", 1, "tutunmak,yarin", [
      [
        "Kitap duygunun yarın hakkında neden hüküm kurduğunu ayırır?",
        "Haig yirmi dört yaşındayken duygu, geleceği çoktan bitmiş bir haber gibi getirir. Haber sıkıdır. Kitap o sıkılığı, yarının kendisi diye kabul etmez. Duygu bir hâldir. Hâl, takvim değildir.\n\nTakvim sanılan hâl, kişiyi yarın yokmuş gibi konuşturur.",
        ["Duygunun takvim olduğu", "Hâlin, yarının haberi sanılmaması", "Yarının kitapta bittiği", "Sıkılığın geleceği düzelttiği"],
        1,
        "Duygu bir hâldir. Yarının haberi değildir.",
      ],
      [
        "Sıkı haber neden inandırıcıdır?",
        "Hâl, bağırarak gelince kişi onu bir yorum sanmaz. Sanmadığı için tartışmaz. Kitap tartışmanın, bağırışın içinde yapılamadığını gösterir. Yapılamaması, haberin doğru olduğunu göstermez.\n\nDoğru sanılan şey, o saatin sesidir.",
        ["Bağırışın haberin doğruluğu olduğu", "O saatin sesinin, yarının kendisi sanıldığı", "Tartışmanın bağırtıyı yendiği", "Yorumun her an mümkün olduğu"],
        1,
        "O saatin sesi, yarının kendisi sanılır.",
      ],
      [
        "Hâl ile haber ayrılınca ne değişir?",
        "Kişi yarını iptal etmiş olmaz. İptal ettiği, hâlin yarın üzerinde kurduğu tek söz hakkıdır. Yarın hâlâ gelmemiştir. Gelmemiş olan, bitmiş sayılamaz.\n\nKitap bitmemiş olanı, hissedilenin elinden geri alır.",
        ["Yarının iptal olduğu", "Hissedilenin, gelmemiş yarın üzerinde tek söz hakkı olmadığı", "Hâlin susması gerektiği", "Geri almanın acıyı sildiği"],
        1,
        "Gelmemiş yarın, o saatin hükmüyle bitmiş sayılmaz.",
      ],
    ]),
    lesson("Küçük tutamak", 2, "tutunmak,kucuk", [
      [
        "Kitap tutunmayı neden büyük bir hayat lafzına bağlamaz?",
        "Yaşama tutunmak, anlam üzerine bir söylev diye kurulmaz. Tutamak küçüktür. Okumak, yürümek, bir günü geçirmek. Büyük laf, en ağır saatte elde durmaz.\n\nElde duran, küçük olandır. Kitap küçüğü hafif diye küçümsemez.",
        ["Büyük lafzın o saatte yettiği", "Elde duranın küçük tutamak olduğu", "Yürümenin anlam söylevi olduğu", "Küçüğün hafif sayıldığı"],
        1,
        "Ağır saatte elde duran, küçük tutamaktır.",
      ],
      [
        "Küçük tutamak neden iyileşme vaadi değildir?",
        "Bir yürüyüş, hastalığı kapatmaz. Kapamadan da o saati taşır. Kitap taşımayı kapatmakla karıştırmaz.\n\nKarıştıran, yürüyüş işe yaramadı diye küçük olanı atar. Atılan şey, tam da taşımış olandır.",
        ["Yürüyüşün hastalığı kapattığı", "Taşımanın, kapatmak sayılmaması", "Küçük olanın atılınca güçlendiği", "Vaadin kitapta yürüyüşe konduğu"],
        1,
        "Küçük tutamak o saati taşır, hastalığı kapatmaz.",
      ],
      [
        "Büyük laf neden en ağır saatte elde durmaz?",
        "Söylev, sakin bir masada kurulur. Ağır saat o masayı kapatır. Kapanan masadaki cümle, kişiyle birlikte odaya girmez.\n\nHaig bu yüzden odaya giren şeyi, masada hazırlanan büyük cümlede aramaz.",
        ["Söylevin odaya birlikte girdiği", "Ağır saatin, masada kurulan büyük cümleyi içeri almadığı", "Küçük tutamağın söylev olduğu", "Masanın her saatte açık olduğu"],
        1,
        "Ağır saat, masada kurulan büyük cümleyi içeri almaz.",
      ],
    ]),
    lesson("Düz çizgi değil", 3, "tutunmak,cizgi", [
      [
        "İyi bir haftadan sonraki kötü gün neden başa dönmek değildir?",
        "Kitap iyileşmeyi yükselen bir çizgi diye çizmez. İyi günler gelmişken kötü bir gün, sayacı sıfırlamaz. Sıfır sanılan yer, çizginin kırığıdır. Kırık, başladığı yere dönüş değildir.\n\nDönüş sanılınca kişi, aradaki günleri de siler.",
        ["Kötü günün sayacı sıfırladığı", "Kırığın, başa dönüş sayılmaması", "Çizginin yalnızca yükseldiği", "Aradaki günlerin hiç yaşanmadığı"],
        1,
        "Kötü gün sayacı sıfırlamaz. Kırık, başa dönüş değildir.",
      ],
      [
        "Aradaki günler neden silinir sanılır?",
        "Kişi son kötü güne bakar ve önceki hafif günleri saymamış olur. Saymamak, o günlerin hükmünü kaldırır. Kitap hükmü, son güne vermez.\n\nSon gün gürültülüdür. Gürültü, önceki günlerin yokluğu değildir.",
        ["Son günün önceki günleri sildiği", "Gürültülü günün, öncekilerin yokluğu olmadığı", "Hafif günün hiç hükmü olmadığı", "Sayacın yalnızca kötü günü tuttuğu"],
        1,
        "Son kötü gün, önceki hafif günleri yok etmez.",
      ],
      [
        "Çizgi metaforu neden zarar verir?",
        "Yükselen çizgi, her kırığı bir ihanet gibi gösterir. Kitap o metaforu kullanmaz. Kullanmayan yerde kırık, yolun şeklidir.\n\nŞekil bozulunca kişi yolu bırakır. Bıraktığı şey, bozuk bir grafik değil, kendi günüdür.",
        ["Yükselen çizginin kitabı anlattığı", "Kırığı ihanet sanmanın yolu bıraktırdığı", "Grafiğin günü düzelttiği", "Şeklin her zaman düz olduğu"],
        1,
        "Kırığı ihanet sanmak, yolu bıraktırır.",
      ],
    ]),
    lesson("Kalıcı değil", 4, "tutunmak,sure", [
      [
        "En ağır saati neden tek bir cümle taşımaz?",
        "Haig o saatten, parlak bir fikirle çıkmış gibi anlatmaz. Taşıyan, duygunun kalıcı bir kimlik olmamasıdır. Saat bağırır. Bağırış, kişinin değişmez adı değildir.\n\nAd sanılan bağırış, süreye yenilir. Yenilme o saatin içinde hissedilmeyebilir.",
        ["Parlak fikrin saati bitirdiği", "Bağırışın, kişinin değişmez adı olmadığı", "Kimliğin o saatte kurulduğu", "Sürenin bağırışı büyüttüğü"],
        1,
        "O saatin bağırışı, kişinin değişmez adı değildir.",
      ],
      [
        "Hissedilmeyen yenilgi neden yine yenilgidir?",
        "Kişi o anda sürenin işlediğini görmez. Görmemek, sürenin durduğu anlamına gelmez. Kitap görmeden de geçen zamanı hesaba katar.\n\nHesap, o saatte teselli diye sunulmaz. Sonradan bakınca görülen yapıdır.",
        ["Görülmeyenin durduğu", "O anda görülmese de sürenin işlediği", "Tesellinin saati bitirdiği", "Yapının bağırışla aynı olduğu"],
        1,
        "O anda görülmese de süre işler.",
      ],
      [
        "Kalıcı sanmak neden hâli kimliğe çevirir?",
        "Kişi bu benim diyebilir. Diyen, bir saati bütün hayata yayar. Kitap yayılan saati geri çağırır. Geri çağrı, acıyı inkâr değildir.\n\nİnkâr, saati yok sayar. Kitap saati yerinde bırakır, bütün hayatın adı yapmaz.",
        ["Saatin bütün hayat olduğu", "Bir saatin bütün hayatın adı yapılmaması", "İnkârın kitabın yöntemi olduğu", "Geri çağırmanın acıyı sildiği"],
        1,
        "Bir saat bütün hayatın adı yapılmaz. Acı yok sayılmaz.",
      ],
    ]),
    lesson("Kafanın haritası", 5, "tutunmak,harita", [
      [
        "Kafanın içindeki dünya neden dünya değildir?",
        "Kitapta zihin, çok canlı bir harita çizebilir. Canlılık, haritanın araziyi doğru gösterdiğini kanıtlamaz. Kişi haritanın içinden çıkamayınca araziyi de harita sanır.\n\nSanmak, arazinin kaybolduğu anlamına gelmez. Görüşün kilitlendiği anlamına gelir.",
        ["Canlı haritanın araziyi kanıtladığı", "Görüşün kilitlenmesinin araziyi yok etmediği", "Zihnin harita çizmediği", "Kilidin dünyayı düzelttiği"],
        1,
        "Canlı bir harita, arazinin kendisi değildir.",
      ],
      [
        "Çıkamamak haritayı neden doğru yapmaz?",
        "Kişi odadan çıkamayınca, odadaki resmi bütün şehir sanır. Şehir odanın dışında durmaya devam eder. Kitap bu devamı, hissin inkârı diye değil, hissin sınırı diye koyar.\n\nSınır, acının sahte olduğunu söylemez. Acının, şehrin tamamı olmadığını söyler.",
        ["Odanın şehri kapattığı", "Çıkamamış olmanın haritayı doğru kılmadığı", "Sınırın acıyı sahtelediği", "Şehrin odada bittiği"],
        1,
        "Odadan çıkamamak, odadaki resmi bütün şehir yapmaz.",
      ],
      [
        "Haritayı şüpheli bulmak neden duygusuzluk değildir?",
        "Kişi haritaya itiraz edince duygusunu inkâr etmiş sayılabilir. Kitap itirazı inkâr diye kurmaz. İtiraz, duygunun varlığını bırakır, onun çizdiği yarını bırakır.\n\nBırakılan yarın, bırakılan acı değildir.",
        ["İtirazın duyguyu sildiği", "Şüphenin, acıyı değil acının çizdiği yarını bıraktığı", "Duygusuzluğun kitabın hedefi olduğu", "Yarının acıyla birlikte gittiği"],
        1,
        "Haritayı şüpheli bulmak, acıyı değil onun çizdiği yarını bırakır.",
      ],
    ]),
  ],
);

function check(name, data) {
  if (data.lessons.length !== 5) throw new Error(`${name} ders sayısı`);
  for (const lesson of data.lessons) {
    if (lesson.challenges.length !== 3) throw new Error(`${name} ${lesson.title}`);
    const diffs = lesson.challenges.map((item) => item.difficulty).join(",");
    if (diffs !== "EASY,MEDIUM,HARD") throw new Error(`${name} ${lesson.title} zorluk`);
    for (const item of lesson.challenges) {
      if (item.options.length !== 4) throw new Error(`${name} seçenek`);
      if (item.options.filter((option) => option.correct).length !== 1) throw new Error(`${name} doğru`);
      const reading = JSON.parse(item.metadata).reading;
      if (!reading || reading.length < 80) throw new Error(`${name} okuma`);
    }
  }
}

const files = {
  "data/bu-ulke.json": buUlke,
  "data/paranin-psikolojisi.json": para,
  "data/pur-dikkat.json": pur,
  "data/hizli-ve-yavas.json": hizli,
  "data/tteokbokki.json": tteok,
  "data/hala-tteokbokki.json": hala,
  "data/yasama-tutunmak.json": tutunmak,
};

for (const [file, data] of Object.entries(files)) {
  check(file, data);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(file, data.lessons.length);
}
