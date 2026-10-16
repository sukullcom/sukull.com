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

function course(title, section, unitTitle, description, tags, lessons) {
  return {
    course: { title, imageSrc: "/courses/genel-kultur.svg", section },
    units: [{ title: unitTitle, description, order: 1, lessons }],
  };
}

const basari = course(
  "Başarı ve çevre",
  "dusunce",
  "Çizginin Dışındakiler",
  "Malcolm Gladwell’in Çizginin Dışındakiler kitabında işlenen başarı fikirleri. Her ders üç okuma ve bu okumadan cevaplanan bir sorudan oluşur.",
  "cizginin-disindakiler",
  [
    lesson("On bin saat", 1, "cizginin-disindakiler,sure", [
      [
        "Kitaba göre ustalık nerede birikir?",
        "Çizginin Dışındakiler, ustalığı bir gecede parlayan bir yetenek olarak anlatmaz. Aynı işin yıllarca, kesintisiz tekrarlanmasıdır asıl birikim. Kitapta on bin saat, sihirli bir sayıdan çok, erken yaşta başlayan uzun bir emeğin kısaltması olarak durur.\n\nKısa bir heves bu süreyi doldurmaz. Saat, ancak aynı işe dönüldükçe işe yarar. Kitap, parlak görünen insanların gerisinde bu uzun tekrarın bulunduğunu söyler.",
        ["Doğuştan gelen bir ışıltıda", "Aynı işin yıllarca tekrarında", "Tek bir şanslı günde", "Başkalarının alkışında"],
        1,
        "Kitap ustalığı, aynı işin yıllarca tekrarında görür.",
      ],
      [
        "Kitaba göre on bin saat neden tek başına sihirli bir sayı değildir?",
        "Kitap, saatin kendisini bir tılsım gibi koymaz. Önemli olan o sürenin erken başlaması ve aynı işte kalmasıdır. Geç başlayan, dağınık tekrar, sayıyı tutturmuş gibi görünse de aynı birikimi vermez.\n\nBu yüzden kitap, başarıyı yalnızca toplam saate bakarak açıklamaz. Saatin hangi yaşta ve ne kadar kesintisiz dolduğu da anlatının parçasıdır.",
        ["Sayı tutturulunca iş bittiği için", "Sürecin erken ve kesintisiz olması gerektiği için", "Saat saymak yasak olduğu için", "Yalnızca akşam saatleri sayıldığı için"],
        1,
        "Erken ve kesintisiz tekrar, sayının kendisinden daha belirleyicidir.",
      ],
      [
        "Kitaba göre parlak görünen insanın gerisinde ne vardır?",
        "Kitap, dışarıdan bir anda yükselmiş gibi duran insanların gerisine bakar. Orada gizli bir mucize değil, aynı işe ayrılmış uzun bir zaman bulunur. Seyirci sonucu görür. Kitap ise o sonuca varan tekrarı gösterir.\n\nBu bakış, yeteneği inkâr etmez. Yeteneğin, tekrar olmadan görünür bir ustalığa dönmediğini söyler.",
        ["Gizli bir mucize", "Uzun ve aynı işe ayrılmış zaman", "Yalnızca şanslı bir soyadı", "Tek bir sınav gecesi"],
        1,
        "Parlak sonucun gerisinde uzun tekrar vardır.",
      ],
    ]),
    lesson("Doğum ayı", 2, "cizginin-disindakiler,takvim", [
      [
        "Kitaba göre aynı yıl doğan çocuklar neden eşit başlamaz?",
        "Kitap, aynı yıl doğan çocukların takvim karşısında eşit durmadığını anlatır. Yaş grubu bir tarihte kesilince, o kesime yakın doğan çocuk arkadaşlarından aylarca büyüktür. Bu fark ilk bakışta küçüktür. Seçilince ise antrenman ve ilgi de ona gider.\n\nKitap, avantajın karakterden önce takvimden gelebileceğini söyler.",
        ["Hepsi aynı gün okula başladığı için", "Kesim tarihine yakın doğan daha büyük göründüğü için", "Küçük olan her zaman seçildiği için", "Ayın hiçbir önemi olmadığı için"],
        1,
        "Kesim tarihi, aynı yıl içinde bir kısmını daha hazır gösterir.",
      ],
      [
        "Kitaba göre küçük yaş farkı sonradan nasıl büyür?",
        "Kitapta ilk seçilme, ikinci fırsatı da getirir. Biraz daha büyük görünen çocuk takıma alınır. Takım daha çok idman demektir. İdman da bir sonraki seçimde yine onu öne çıkarır. Başlangıçtaki birkaç ay, yıllar sonra yetenek gibi görünür.\n\nKitap bu döngüye, farkın kendiliğinden kapandığı bir şey olarak bakmaz.",
        ["Fark kendiliğinden kapandığı için büyümez", "Seçilmek daha çok idman ve ilgi getirdiği için", "Küçük olanlar idmandan men edildiği için", "Takvim yalnızca bir yıl geçerli olduğu için"],
        1,
        "Seçilmek daha çok pratik getirir, fark büyür.",
      ],
      [
        "Kitaba göre yıllar sonra yetenek sandığımız şey ne olabilir?",
        "Kitap, sonradan yetenek diye okunan bazı farkların izini takvime kadar sürer. Erken doğmuş olmak, erken seçilmek ve daha çok çalışmak birbirine eklenir. Dışarıdan bakınca yalnızca üstün bir çocuk görülür.\n\nKitabın uyarısı, görünen sonucu doğuştan bir üstünlük sanmamaktır.",
        ["Her zaman doğuştan bir üstünlük", "Erken seçilmenin biriktirdiği pratik", "Yalnızca son sınavın puanı", "Arkadaşların kıskançlığı"],
        1,
        "Görünen yetenek, erken seçilmenin biriktirdiği pratik olabilir.",
      ],
    ]),
    lesson("Fırsatın yılı", 3, "cizginin-disindakiler,firsat", [
      [
        "Kitaba göre bazı insanların şansı neye denk gelir?",
        "Kitap, bazı yükselişleri kişisel bir sihirle açıklamaz. Doğulan yıl, o sırada açılan bir kapıya denk gelmiş olabilir. Bilgisayar ucuzlarken genç olan, o kapının önündedir. Aynı zekâ, kapı kapandıktan on yıl sonra aynı yolu bulamaz.\n\nKitap, hazır olmayı küçümsemez. Hazırlığın, kapının açık olduğu zamana denk gelmesi gerektiğini söyler.",
        ["Her yıl aynı kapının açık olmasına", "Doğulan yılın açık bir kapıya denk gelmesine", "Kapıların hiç kapanmamasına", "Yalnızca soyadının uzunluğuna"],
        1,
        "Şans, doğulan yılın açık bir kapıya denk gelmesidir.",
      ],
      [
        "Kitaba göre aynı zekâ neden her zaman aynı yolu bulamaz?",
        "Kitapta yol, yalnızca zekânın ürünü değildir. Yolun açık olduğu yıllar vardır. O yıllarda hazır olan girer. Aynı yetenek, kapı kapandıktan sonra başka bir işin içine doğar ve o işi de doldurur. Fark, insanın değerinden çok zamanlamasındadır.\n\nBu anlatı, geç kalanı suçlamaz. Kapının herkese aynı anda açılmadığını gösterir.",
        ["Zekâ yıllar içinde silindiği için", "Kapı herkese aynı anda açılmadığı için", "Geç doğanlar okula alınmadığı için", "Zekâ yalnızca bir yıl sürdüğü için"],
        1,
        "Kapı herkese aynı anda açılmaz.",
      ],
      [
        "Kitabın hazır olmakla ilgili söylediği nedir?",
        "Kitap, kapının önünde boş durmayı övmez. Kapı açıldığında içeri girecek birikim gerekir. Birikim de kendiliğinden o yıl bitmez. Yıllar süren bir hazırlık, tam o açıklığa denk gelince görünür olur.\n\nBu yüzden kitap, fırsatı şans kelimesine hapsetmez. Şans, hazırlığın zamanla karşılaşmasıdır.",
        ["Hazırlık gereksizdir", "Fırsat, hazırlığın açık kapıyla karşılaşmasıdır", "Kapı açılınca hazırlık silinir", "Yalnızca beklemek yeter"],
        1,
        "Fırsat, hazırlığın açık kapıyla karşılaşmasıdır.",
      ],
    ]),
    lesson("Kültürün izi", 4, "cizginin-disindakiler,kultur", [
      [
        "Kitaba göre zor anda davranış yalnızca neye bağlı değildir?",
        "Kitap, insanın zor anda nasıl davrandığını yalnızca o anki kişiliğine bağlamaz. Büyüdüğü kültürün alışkanlıkları da o anda devrededir. Bir yerde büyüğe itiraz etmek ayıp sayılıyorsa, tehlike görüldüğünde ses çıkarmak da zorlaşır.\n\nKitap bunu bir özür olarak değil, görünmeyen bir miras olarak anlatır.",
        ["Yalnızca o anki cesarete", "Büyüdüğü kültürün alışkanlıklarına da", "Yalnızca o günkü havaya", "Yalnızca mesleğin adına"],
        1,
        "Zor an, büyünülen kültürün alışkanlığını da taşır.",
      ],
      [
        "Kitaba göre otoriteye itirazın zor olduğu yerde ne zorlaşır?",
        "Kitap, hiyerarşinin yalnızca nezaket kuralı olarak kalmadığını söyler. Üstteki yanıldığında ses çıkarmamak öğretilmişse, bu alışkanlık tehlike anında da suskunluk üretir. İnsan korkak olduğu için değil, itiraz etmenin yolunu öğrenmediği için susar.\n\nKitabın örneği, sonucun kişilik etiketiyle kapanmaması gerektiğidir.",
        ["Daha çok konuşmak", "Tehlike görülünce ses çıkarmak", "Üstü övmek", "İşi bırakmak"],
        1,
        "İtiraz alışkanlığı yoksa tehlike anında ses çıkarmak zorlaşır.",
      ],
      [
        "Kitap bu mirası nasıl adlandırır?",
        "Kitap, kültürün izini bir suç ya da bir övgü diye koymaz. İnsan o izle büyümüştür. İz, karar anında fark edilmeden çalışır. Bunu görmek, kişiyi küçültmez. Davranışın bir kısmının nereden geldiğini gösterir.\n\nKitaba göre değiştirilebilecek olan da önce görülen bu izdir.",
        ["Kişiyi küçülten bir suç olarak", "Fark edilmeden çalışan görünmeyen bir miras olarak", "Yalnızca bir övgü olarak", "Unutulması gereken bir hata olarak"],
        1,
        "Kültürün izi, fark edilmeden çalışan bir mirastır.",
      ],
    ]),
    lesson("Zekâ yetmez", 5, "cizginin-disindakiler,zeka", [
      [
        "Kitaba göre yüksek zekâ insanı nereye kadar taşır?",
        "Kitap, zekâyı yok saymaz. Yüksek zekâ bir yere kadar kapı açar. O kapıdan sonra fırsat, destek ve sürdürülen çalışma belirleyici olur. Zekâ tek başına, açılmayan bir kapının önünde beklemek demektir.\n\nKitabın cümlesi, parlak zihnin çevresiz kalabileceğidir.",
        ["Her kapıyı kendiliğinden açar", "Bir yere kadar taşır, sonrası çevreye kalır", "Hiçbir işe yaramaz", "Yalnızca sınavda işe yarar"],
        1,
        "Zekâ bir yere kadar taşır. Sonrası fırsat ve çalışmadır.",
      ],
      [
        "Kitaba göre aynı zekâdaki iki insan neden ayrılır?",
        "Kitap, benzer ölçüdeki zihinlerin farklı yerlere vardığını anlatır. Biri desteklenmiş, denenmiş ve işin içine alınmıştır. Diğeri aynı ölçüyle kapının dışında kalmıştır. Ayrım, testin sonucundan çok o sonucun kullanıldığı yerdedir.\n\nBu yüzden kitap, başarı listesini bir zekâ listesi olarak okumaz.",
        ["Test her şeyi açıkladığı için ayrılmazlar", "Biri işin içine alınmış, diğeri dışarıda kaldığı için", "Zekâ yıllar içinde eşitlendiği için", "İkisi de aynı kapıdan geçtiği için"],
        1,
        "Ayrım, zekânın kullanıldığı fırsattadır.",
      ],
      [
        "Kitabın başarı listesi hakkında söylediği nedir?",
        "Kitap, yukarıdaki isimlere bakıp yalnızca doğuştan bir üstünlük okumayı eksik bulur. O isimlerin yanında yıl, takvim, kültür ve uzun tekrar vardır. Liste, bu çevreyi gizlediğinde adaletsiz bir hikâye anlatır.\n\nKitaba göre dürüst okuma, ismin yanına o çevreyi de yazmaktır.",
        ["Listenin yalnızca zekâyı gösterdiği", "İsmin yanına yıl, tekrar ve çevrenin de yazılması gerektiği", "Listenin hiç okunmaması gerektiği", "Çevrenin ismi sildiği"],
        1,
        "Başarı listesi, çevreyi gizlememelidir.",
      ],
    ]),
  ],
);

const kuran = course(
  "Kur'an",
  "islam",
  "Namaz sureleri",
  "Namazda okunan kısa sureler. Her derste Diyanet mealinden kısa bir anlam ve ayette ne dendiği, ardından üç soru vardır.",
  "namaz-sureleri",
  [
    lesson("Fatiha", 1, "kuran,fatiha", [
      [
        "Meal, hamdi kime ait sayar?",
        "Diyanet meali, «Hamd, âlemlerin Rabbi Allah'a mahsustur» der. Övgünün yeri kulun kendi başarısı değildir. Her şeyin Rabbi olan Allah anılır. Sure, Rahman ve Rahim olan Allah'ın adıyla açılır.\n\nAyette bahsedilen, insanın övgüyü kendine ayırması değil, onu her şeyin sahibine çevirmesidir.",
        ["Kulun kendi başarısına", "Âlemlerin Rabbi olan Allah'a", "Yalnızca o günkü işe", "İnsanın soyuna"],
        1,
        "Hamd, âlemlerin Rabbi olan Allah'a aittir.",
      ],
      [
        "Fatiha'da kul kimden yardım ister?",
        "Meal, kulluğun ve yardım dilemenin tek bir yöne çevrildiğini bildirir. Yalnız sana ibadet eder, yalnız senden yardım dileriz. Ayette bahsedilen, yardımın birkaç kapıya bölünmesi değildir. İbadet de yardım da Allah'a bağlanır.\n\nBu cümle, surenin ortasında duran bir yön tayinidir.",
        ["Her kapıdan biraz", "Yalnız Allah'tan", "Yalnızca kendi aklından", "O günkü kalabalıktan"],
        1,
        "İbadet de yardım da yalnız Allah'a bağlanır.",
      ],
      [
        "Surenin son isteği nedir?",
        "Meal, doğru yola iletilmeyi diler. Bu yol, nimet verilenlerin yoludur. Gazaba uğrayanların ve sapmışların yolu ayrı tutulur. Ayette bahsedilen, her yolun aynı olduğu değildir. Kul, doğru olanı ayırt eden bir iletiliş ister.\n\nFatiha bu istekle kapanır.",
        ["Her yolun aynı sayılması", "Doğru yola iletilmek", "Yolun hiç sorulmaması", "Yalnızca dünya yolunun istenmesi"],
        1,
        "Sure, doğru yola iletilmeyi diler.",
      ],
    ]),
    lesson("İhlas", 2, "kuran,ihlas", [
      [
        "İhlas, Allah hakkında neyi söyler?",
        "Diyanet meali, «De ki: O, Allah'tır, bir tektir» diye açılır. O, Samed'dir. Her şey O'na muhtaçtır, O hiçbir şeye muhtaç değildir. Ayette bahsedilen, Allah'ın parçalara ayrılması ya da bir benzerinin bulunması değildir.\n\nSure, tevhidi kısa bir cümlede toplar.",
        ["Allah'ın birçok parçadan oluştuğunu", "Allah'ın bir olduğunu", "Allah'ın bir varlığa benzediğini", "Allah'ın sayılabileceğini"],
        1,
        "İhlas, Allah'ın bir olduğunu söyler.",
      ],
      [
        "Meal, doğmak ve doğurmak hakkında ne der?",
        "Meal, Allah'ın doğurmadığını ve doğurulmadığını bildirir. Ayette bahsedilen, Allah'ın bir soy zincirine bağlanmasıdır diye bir kapı bırakmaz. O, bir başlangıcın çocuğu ya da bir devamın babası olarak anlatılmaz.\n\nBu, birliği koruyan bir sınırdır.",
        ["Allah'ın bir soydan geldiğini", "Doğurmadığını ve doğurulmadığını", "Soy zincirinin O'nu açıkladığını", "Doğmanın O'na benzediğini"],
        1,
        "Allah doğurmamış ve doğurulmamıştır.",
      ],
      [
        "Surenin son ayeti neyi reddeder?",
        "Meal, hiçbir şeyin Allah'a denk olmadığını söyler. Ayette bahsedilen, O'nun yanına konacak bir ortağın bulunmasıdır. Ne bir put, ne bir kul, ne de bir kuvvet O'na eşitlenir.\n\nİhlas bu cümleyle kapanır.",
        ["Her şeyin O'na denk olduğunu", "Hiçbir şeyin O'na denk olmadığını", "Denkliğin mümkün olduğunu", "Ortağın övüldüğünü"],
        1,
        "Hiçbir şey Allah'a denk değildir.",
      ],
    ]),
    lesson("Felak", 3, "kuran,felak", [
      [
        "Felak'ta kul nereye sığınır?",
        "Diyanet meali, «Yarattığı şeylerin şerrinden felakın Rabbine sığınırım» diye açılır. Felak, yarıp ortaya çıkarmaktır. Ayette bahsedilen, sığınılacak yerin kulun kendi gücü olmadığıdır. Sığınma, yaratılışı yarıp aydınlığı çıkaran Allah'adır.\n\nSure, korkuyu gizlemez. Onu bir sığınmaya çevirir.",
        ["Kendi gücüne", "Felakın Rabbine", "Karanlığın kendisine", "Başka bir kulun sözüne"],
        1,
        "Kul, felakın Rabbine sığınır.",
      ],
      [
        "Karanlık hakkında ayette ne vardır?",
        "Meal, karanlığı çöktüğünde onun şerrinden sığınmayı bildirir. Ayette bahsedilen, gecenin yalnızca bir saat olması değildir. Karanlık basınca ortaya çıkan kötülük de sığınmanın konusudur.\n\nSure, görünen aydınlığın çekildiği anı da Allah'a bağlar.",
        ["Karanlığın şerri olmadığı", "Karanlık çökünce onun şerrinden sığınmak", "Gecenin hiç anılmadığı", "Aydınlığın gereksiz olduğu"],
        1,
        "Karanlığın şerrinden de sığınılır.",
      ],
      [
        "Hasete dair meal ne söyler?",
        "Meal, haset ettiği zaman hasetçinin şerrinden sığınmayı söyler. Ayette bahsedilen, kıskançlığın zararsız bir duygu olarak kalması değildir. Haset harekete geçtiğinde bir şer taşır. Kul bundan da Allah'a sığınır.\n\nFelak, bu şerri sayarak kapanır.",
        ["Hasedin hiç şerri olmadığı", "Hasetçinin şerrinden sığınmak", "Kıskançlığın övüldüğü", "Hasedin yalnızca sevinç olduğu"],
        1,
        "Hasetçinin şerrinden Allah'a sığınılır.",
      ],
    ]),
    lesson("Nas", 4, "kuran,nas", [
      [
        "Nas suresi sığınmayı kimlere bağlar?",
        "Diyanet meali, «İnsanların Rabbine, insanların hükümdarına, insanların ilahına sığınırım» diye açılır. Ayette bahsedilen, sığınılacak yerin kalabalığın kendisi değildir. İnsanların Rabbi, hükümdarı ve ilahı olan Allah'tır.\n\nSure, insanı anar ama yönü Allah'a çevirir.",
        ["Kalabalığın kendisine", "İnsanların Rabbi, Meliki ve İlahı olan Allah'a", "İnsanın kendi vesvesesine", "Yalnızca bir isme"],
        1,
        "Sığınma, insanların Rabbi olan Allah'adır.",
      ],
      [
        "Vesvese hakkında ayette ne denir?",
        "Meal, sinsi vesvesecinin şerrinden sığınmayı bildirir. Vesvese, insanın içine gizlice bırakılan bir fısıltıdır. Ayette bahsedilen, her iç sesin doğru olduğu değildir. O fısıltı saptırabilir. Kul ondan da Allah'a sığınır.\n\nSure, kötülüğü yalnızca dışarıda aramaz.",
        ["Her iç sesin doğru olduğu", "Sinsi vesvesenin şerrinden sığınmak", "Vesvesenin hiç olmadığı", "Fısıltının ibadet sayıldığı"],
        1,
        "Sinsi vesvesenin şerrinden sığınılır.",
      ],
      [
        "Vesvese kimlerden gelir?",
        "Meal, vesvesenin cinlerden ve insanlardan gelebileceğini söyler. Ayette bahsedilen, saptıran fısıltının tek bir kaynaktan çıkması değildir. Görünmeyen bir varlık da bir insan da o şerri taşıyabilir.\n\nNas bu ayrımla kapanır.",
        ["Yalnızca rüzgârdan", "Cinlerden ve insanlardan", "Yalnızca uykudan", "Yalnızca kitaptan"],
        1,
        "Vesvese cinlerden de insanlardan da gelebilir.",
      ],
    ]),
  ],
);

const hadis = course(
  "Hadisler",
  "islam",
  "Niyet ve amel",
  "Niyet ve amel üzerine hadisler. Her derste hadiste ne dendiği kendi cümlelerimizle anlatılır ve üç soru sorulur.",
  "niyet-amel",
  [
    lesson("Ameller niyetlere göredir", 1, "hadis,niyet", [
      [
        "Hadiste amel neye göre değer kazanır?",
        "Hadiste, amellerin niyetlere göre olduğu belirtilir. Kişinin varacağı yer, niyetinde taşıdığıdır. Aynı iş, başka bir niyetle başka bir amele döner. Hadiste bahsedilen, dışarıdan görünen hareketin tek başına yetmesidir diye bir kapı bırakmaz.\n\nNiyet, işin içindeki yönüdür.",
        ["Yalnızca görenlerin sayısına", "Niyetine", "İşin süresine bakılmaksızın şansa", "İşin gürültüsüne"],
        1,
        "Amel, niyete göre değer kazanır.",
      ],
      [
        "Aynı iş neden başka amel sayılır?",
        "Hadiste, hicret edenin hicretinin neye göreyse ona ait olduğu anlatılır. Allah ve Resulü için çıkan ile dünyalık bir amaçla çıkan aynı yolu yürümüş olabilir. Hadiste bahsedilen, yolun aynı görünmesinin niyeti de aynı yaptığı değildir.\n\nGörünen hareket bir, içteki yön iki olabilir.",
        ["Yol aynıysa niyet de aynı olduğu için", "Niyet farklı olduğu için", "Herkesin niyeti bir sayıldığı için", "Dünyalık amaç niyeti sildiği için"],
        1,
        "Aynı yol, farklı niyetle başka amel olur.",
      ],
      [
        "Hadis dışarıdan görünen hareket hakkında ne der?",
        "Hadiste bahsedilen, insanların gördüğü hareketin ölçünün tamamı olmadığıdır. Ölçü, o hareketin kimin için ve ne için yapıldığıdır. Görünen iş övülse bile niyet başka yere bakıyorsa amel o yere aittir.\n\nBu, işi küçültmez. İşi niyetiyle birlikte okur.",
        ["Görünen hareket ölçünün tamamıdır", "Ölçü, işin kimin için yapıldığıdır", "Niyetin hiç bakılmadığı", "Yalnızca alkışın yeterli olduğu"],
        1,
        "Ölçü, işin kimin için yapıldığıdır.",
      ],
    ]),
    lesson("Devamlı olan amel", 2, "hadis,devam", [
      [
        "Hadiste en sevimli amel hangisidir?",
        "Hadiste, Allah'a en sevimli amelin az da olsa devamlı olan olduğu belirtilir. Bir kez taşan, sonra bırakılan iş, her gün küçük duran işin önüne geçmez. Hadiste bahsedilen, büyüklüğün coşkuda aranması değildir.\n\nSevimli olan, kopmayan ameldir.",
        ["Bir kez çok büyük yapılan", "Az da olsa devam eden", "Yalnızca bayramda yapılan", "Başkasına devredilen"],
        1,
        "En sevimli amel, az da olsa devam edendir.",
      ],
      [
        "Büyük ama bırakılan iş neden geride kalır?",
        "Hadiste bahsedilen, coşkunun ilk günü değil, ertesi gündür. Taşan iş bırakılınca amel durur. Küçük iş sürerse amel yerinde kalır. Ölçü, o günkü büyüklük değil, yarın da durup durmadığıdır.\n\nBu, azı övmek için değil, kopmamayı övmek içindir.",
        ["Küçük iş yasak olduğu için", "Bırakılınca amel durduğu için", "Büyük iş her zaman sürdüğü için", "Devamın önemi olmadığı için"],
        1,
        "Bırakılan işin ameli durur.",
      ],
      [
        "Hadis az amel hakkında ne söyler?",
        "Hadiste az amel küçümsenmez. Az olup da devam eden, çok olup da kesilenden sevimli sayılır. Hadiste bahsedilen, insanın elinden gelmeyeni yüklenmesi değildir. Elden gelen küçük işin bırakılmamasıdır.\n\nKüçük iş, sürdükçe amel olur.",
        ["Az amelin sayılmadığı", "Az ama devamlı olanın sevimli olduğu", "Azın haram olduğu", "Çok kesilse de önde olduğu"],
        1,
        "Az ama devamlı amel sevimli sayılır.",
      ],
    ]),
    lesson("Güzel ahlak", 3, "hadis,ahlak", [
      [
        "Hadiste iyilik neyle anlatılır?",
        "Hadiste iyiliğin güzel ahlak olduğu belirtilir. İyilik, yalnızca bir işin dış görünüşü değildir. İnsanın başkasına ve kendine karşı duruşudur. Hadiste bahsedilen, ahlakın ibadetten ayrı bir süs sayılması değildir.\n\nİyilik, huyla belli olur.",
        ["Yalnızca dışarıdan görünen bir törenle", "Güzel ahlakla", "Yalnızca malın çokluğuyla", "Konuşmanın uzunluğuyla"],
        1,
        "İyilik, güzel ahlaktır.",
      ],
      [
        "Günah hadiste nasıl tarif edilir?",
        "Hadiste, günahın içte bir burukluk bırakan ve insanların duymasını istemediğin şey olduğu anlatılır. Hadiste bahsedilen, her sıkıntının günah sayılması değildir. İçin daraldığı ve gizlemeye çalıştığın iş, sana bir işaret olur.\n\nÖlçü, alkış değil, içindeki rahatsızlıktır.",
        ["Herkesin alkışladığı her iş", "İçte burukluk bırakıp gizlenen iş", "Yalnızca büyük cezalar", "Hiç fark edilmeyen bir şey"],
        1,
        "Günah, içte burukluk bırakıp gizlenen iş olarak da tarif edilir.",
      ],
      [
        "Hadis ölçüyü nereye koyar?",
        "Hadiste bahsedilen, insanın başkasının listesine bakıp ahlakını ölçmesi değildir. İyilik huydadır. Günah, içinde saklamak istediğin o daralmadadır. İkisi de dışarıdaki gürültüden önce gelir.\n\nBu tarif, insanı kendi içine çevirir.",
        ["Başkasının listesine", "Huya ve içteki daralmaya", "Yalnızca cezanın büyüklüğüne", "Kalabalığın kararına"],
        1,
        "Ölçü, huy ve içteki daralmadır.",
      ],
    ]),
    lesson("Kalp", 4, "hadis,kalp", [
      [
        "Hadiste Allah neye bakar?",
        "Hadiste, Allah'ın suretlere ve mallara değil, kalplere ve amellere baktığı belirtilir. Hadiste bahsedilen, dış görünüşün ölçü sayılmasıdır diye bir övgü yoktur. Kalbin yönü ve yapılan iş öndedir.\n\nSuret, hükmün yeri değildir.",
        ["Surete ve mala", "Kalbe ve amele", "Yalnızca boya", "Yalnızca söze"],
        1,
        "Allah kalplere ve amellere bakar.",
      ],
      [
        "Bedenin içinde ne anılır?",
        "Hadiste, bedende bir et parçası olduğu, o düzelirse bedenin düzeleceği, bozulursa bedenin bozulacağı anlatılır. O parça kalptir. Hadiste bahsedilen, bedenin kalpten bağımsız bir hayat sürmesidir değil.\n\nKalp bozulunca iş de bozulur.",
        ["Yalnızca el", "Kalp", "Yalnızca dil", "Yalnızca göz"],
        1,
        "O parça kalptir.",
      ],
      [
        "Hadis dış görünüş hakkında ne söyler?",
        "Hadiste bahsedilen, güzel suretin ya da malın kendiliğinden bir üstünlük taşımadığıdır. Bakılan yer orası değildir. Kalp düzelmeden suret övünmeye yetmez. Amel de kalple birlikte okunur.\n\nBu, bedeni hor görmez. Ölçünün yerini değiştirir.",
        ["Suretin ölçünün kendisi olduğu", "Suretin ve malın ölçü olmadığı", "Malın kalbi düzelttiği", "Amelin hiç bakılmadığı"],
        1,
        "Suret ve mal, ölçünün yeri değildir.",
      ],
    ]),
    lesson("Söz ve susmak", 5, "hadis,soz", [
      [
        "Hadiste konuşmak nasıl sınırlanır?",
        "Hadiste, hayır söylemek ya da susmak gerektiği belirtilir. Her söz bir ameldir. Hadiste bahsedilen, dilin boş kaldıkça zararsız olduğudur diye bir rahatlık yoktur. Hayır yoksa susmak da bir amel olur.\n\nDil, ölçüsüz bırakılmaz.",
        ["Her sözün hayır sayıldığı", "Hayır söylemek ya da susmak", "Susmanın yasak olduğu", "Çok sözün her zaman üstün olduğu"],
        1,
        "Hayır yoksa susmak gerekir.",
      ],
      [
        "Kişinin İslam'ının güzelliği hadiste neye bağlanır?",
        "Hadiste, kişinin kendisini ilgilendirmeyen şeyi bırakmasının, İslam'ının güzelliğinden olduğu anlatılır. Hadiste bahsedilen, her işe karışmanın iyilik sayılması değildir. İlgilendirmeyen söz ve iş, güzelliği eksiltir.\n\nSınır, merakın değil, sorumluluğun çizdiği yerdir.",
        ["Her söze karışmasına", "Kendisini ilgilendirmeyeni bırakmasına", "Hiç konuşmamasına", "Herkesin işini üstlenmesine"],
        1,
        "İlgilendirmeyen şeyi bırakmak, İslam'ın güzelliğindendir.",
      ],
      [
        "Hadis boş söz hakkında ne der?",
        "Hadiste bahsedilen, dilin her açılışının sevap biriktirmesidir değil. Hayır taşımayan söz, söylenmemiş olsa daha iyi durur. Susmak, o anda bir kaçış değil, bir ameldir.\n\nİnsan dilini tutabildiğinde hadisin sınırına yaklaşır.",
        ["Boş sözün sevap biriktirdiği", "Hayır taşımayan sözün söylenmemesinin daha iyi olduğu", "Susmanın amel sayılmadığı", "Her cümlenin hayır olduğu"],
        1,
        "Hayır taşımayan sözün söylenmemesi daha iyidir.",
      ],
    ]),
  ],
);

const kissalar = course(
  "Kıssalar",
  "islam",
  "Ashab-ı Kehf",
  "Ashab-ı Kehf kıssası. Anlatım bizim cümlemizdir. Her ders üç okuma ve bu okumadan cevaplanan bir sorudan oluşur.",
  "ashab-i-kehf",
  [
    lesson("Şehirden ayrılış", 1, "kissa,ayrilis", [
      [
        "Gençler şehri neden bırakır?",
        "Kıssada bir grup genç, şehirde Allah'tan başkasına kulluk istendiğini görür. Onlar buna razı olmaz. İnandıkları Rabbi tek bilir, başkasını O'na ortak koşmazlar. Kıssada bahsedilen, gençlerin bir gezinti için dağa çıkması değildir.\n\nAyrılış, inancı korumak içindir.",
        ["Bir gezinti için", "İnancını ortak koşmadan korumak için", "Ticaret yolunu kısaltmak için", "Bir yarışa katılmak için"],
        1,
        "Şehri, inancı korumak için bırakırlar.",
      ],
      [
        "Kıssa onların sayısını neden belirsiz bırakır?",
        "Anlatıda gençlerin kaçı olduğu üzerinde durulmaz. Asıl olan sayı değil, şehrin baskısına rağmen Rabbi tek bilmeleridir. Kıssada bahsedilen, kalabalığın büyüklüğünün imanı ölçmesidir değil.\n\nAz kişi de o ayrılışı göze alabilir.",
        ["Sayının imanı ölçtüğü", "Sayının değil, duruşun önemli olduğu", "Yalnızca bir kişi oldukları kesin olduğu", "Sayının gizlenmesinin yasak olduğu"],
        1,
        "Önemli olan sayı değil, duruştur.",
      ],
      [
        "Şehirde onlardan ne istenmektedir?",
        "Kıssada şehir, Allah'tan başkasına da kulluk edilmesini ister. Gençler bunu kabul etmez. Kıssada bahsedilen, inancın şehirle uyumlu olsun diye eğilmesidir değil. Onlar eğilmeyince kalmak da zorlaşır.\n\nAyrılış bu zorluktan doğar.",
        ["Yalnızca vergi", "Allah'tan başkasına da kulluk", "Bir yolculuk izni", "Sessizce kalmaları"],
        1,
        "Şehir, Allah'tan başkasına da kulluk ister.",
      ],
    ]),
    lesson("Mağara", 2, "kissa,magara", [
      [
        "Mağara onlar için ne olur?",
        "Kıssada mağara, kaçılan şehre karşı bir sığınaktır. Gençler orada Rablerine dayanır. Kıssada bahsedilen, mağaranın bir hazine odası olması değildir. Dar bir yer, inancı koruyan bir örtü olur.\n\nSığınma, taşın kendisinde değil, Allah'a dayanmaktadır.",
        ["Bir hazine odası", "İnancı koruyan bir sığınak", "Şehre dönüş kapısı", "Bir pazar"],
        1,
        "Mağara, inancı koruyan bir sığınaktır.",
      ],
      [
        "Köpek kıssada nerede durur?",
        "Anlatıda köpekleri mağaranın girişinde, kollarını uzatmış halde anılır. İçeri alınmayan bir yabancı gibi değil, onlarla birlikte duran bir bekçi gibi. Kıssada bahsedilen, hayvanın hikâyeden silinmesi değildir.\n\nO da bu sığınmanın parçasıdır.",
        ["Şehirde bırakıldığı", "Mağaranın girişinde onlarla birlikte durduğu", "Hikâyede hiç olmadığı", "Dağın tepesinde uyuduğu"],
        1,
        "Köpek, mağaranın girişinde onlarla durur.",
      ],
      [
        "Kıssa mağaradaki duruşu nasıl anlatır?",
        "Gençler mağarada Rablerinden bir rahmet ve doğru bir iş için hazırlık diler. Kıssada bahsedilen, sığınmanın bir isyan şenliği olması değildir. Onlar korkuyla değil, bir dua ile orada kalır.\n\nMağara, duanın örtüsü olur.",
        ["Bir isyan şenliği olarak", "Bir rahmet ve doğruluk duasıyla", "Bir savaş planı olarak", "Bir unutuş olarak"],
        1,
        "Mağarada bir rahmet ve doğruluk duası vardır.",
      ],
    ]),
    lesson("Uzun uyku", 3, "kissa,uyku", [
      [
        "Mağaradaki uyku sıradan bir uyku mudur?",
        "Kıssada Allah onları mağarada uzun yıllar uyutur. Uyku, bir öğle kestirmesi değildir. Dışarıda şehir değişirken içeride zaman onlar için durur gibi olur. Kıssada bahsedilen, bunun insanların kurduğu bir plan olması değildir.\n\nUyku, Allah'ın bir ayetidir.",
        ["Evet, öğle uykusudur", "Hayır, yıllar süren ve Allah'ın ayeti olan bir uykudur", "Hayır, hiç uyumamışlardır", "Evet, nöbetleşe uyumuşlardır"],
        1,
        "Uyku yıllar sürer ve Allah'ın ayetidir.",
      ],
      [
        "Güneş kıssada nasıl anılır?",
        "Anlatıda güneş mağaraya doğarken ve batarken onların üzerini yakmayacak biçimde döner. Kıssada bahsedilen, mağaranın ışıksız bir çukur olarak unutulması değildir. Allah onları hem uykuda tutar hem de o uykuyu bir düzene bağlar.\n\nKoruma, uykunun içindedir.",
        ["Mağarayı yakıp yıktığı", "Onları yakmayacak biçimde döndüğü", "Hiç doğmadığı", "Yalnızca şehirde kaldığı"],
        1,
        "Güneş onları yakmayacak biçimde döner.",
      ],
      [
        "Uyuyanların hali dışarıdan nasıl görünür?",
        "Kıssada onlara bakan, uyanık sanabilir. Oysa onlar uykudadır. Kıssada bahsedilen, görünen halin her zaman gerçeği vermesidir değil. Allah'ın tuttuğu uyku, bakanın sandığı uyanıklığa benzeyebilir.\n\nGörüntü, süreyi ele vermez.",
        ["Her zaman gerçeği verdiği", "Uyanık sandıracak kadar sakin olduğu", "Toz içinde kaybolduğu", "Şehirden seçildiği"],
        1,
        "Bakan onları uyanık sanabilir.",
      ],
    ]),
    lesson("Uyanış", 4, "kissa,uyanis", [
      [
        "Uyandıklarında süreyi nasıl sanırlar?",
        "Kıssada uyanınca bir gün ya da bir günün bir parçası kadar kaldıklarını sanırlar. Aradan yıllar geçmiştir. Kıssada bahsedilen, insanın kendi hissinin takvimi tam ölçmesidir değil. Onlar süreyi bilemez.\n\nAsıl bilgi Allah'tadır.",
        ["Yüzyılı tam saydıkları", "Bir gün ya da daha az sandıkları", "Hiç uyumadıklarını bildikleri", "Şehrin değiştiğini hemen anladıkları"],
        1,
        "Bir gün ya da daha az kaldıklarını sanırlar.",
      ],
      [
        "Şehre neden biri iner?",
        "Anlatıda içlerinden biri, yiyeceklerin en temizinden almak üzere şehre gönderilir. Gizlice girmesi istenir. Kıssada bahsedilen, bir ziyafet kurmak değildir. Açlıkları vardır ve şehir artık onları tanıyan şehir değildir.\n\nİnen genç, değişmiş bir çarşıyla karşılaşır.",
        ["Bir ziyafet duyurmak için", "Temiz bir yiyecek almak için", "Eski evine dönmek için", "Bir ordu toplamak için"],
        1,
        "Şehre, temiz bir yiyecek almak için inilir.",
      ],
      [
        "Para neden şaşırtır?",
        "Kıssada gencin elindeki para, şehrin o günkü parası değildir. Görenler bunu fark eder. Kıssada bahsedilen, paranın yalnızca bir alışveriş aracı olarak kalması değildir. Para, aradan geçen uzun zamanı ele verir.\n\nUyanış, çarşıda anlaşılır.",
        ["Paranın yeni basılmış olması", "Paranın o günün parası olmaması", "Paranın hiç geçmemesi", "Çarşının kapalı olması"],
        1,
        "Eski para, geçen zamanı ele verir.",
      ],
    ]),
    lesson("Süre Allah'ın bilgisindedir", 5, "kissa,sure", [
      [
        "Kıssa kalış süresini kime bırakır?",
        "Kıssada mağarada ne kadar kaldıkları üzerinde insanların tartıştığı anlatılır. Kimisi bir sayı söyler, kimisi başka. Asıl bilgi Allah'a bırakılır. Kıssada bahsedilen, her tahminin aynı derecede doğru olması değildir.\n\nSüre, tartışmanın değil, Allah'ın bilgisindedir.",
        ["Çarşıdaki herkese", "Allah'a", "Yalnızca köpeğe", "İnen gencin saymasına"],
        1,
        "Kalış süresi Allah'ın bilgisindedir.",
      ],
      [
        "İnsanların sayısı neden kıssanın merkezi değildir?",
        "Anlatıda kaç kişi olduklarını bilenin az olduğu, bu yüzden o tartışmaya girilmemesi gerektiği sezdirilir. Kıssada bahsedilen, merakın yasaklanması değildir. Merkez, sayı yarışı değil, Allah'ın onları nasıl koruduğudur.\n\nTartışma uzadıkça ayet geriye düşer.",
        ["Merkez, kaç kişi olduklarıdır", "Merkez, Allah'ın onları nasıl koruduğudur", "Sayı bilinmeden kıssa okunamaz", "Köpeğin sayısı esastır"],
        1,
        "Merkez, korumadır, sayı yarışı değil.",
      ],
      [
        "Kıssanın sonunda kul neyi görür?",
        "Kıssada bahsedilen, bir grubun kendi gücüyle yüzyılı aşması değildir. Allah dilediğini uzun bir uykuda tutar, dilediği anda uyandırır ve süreyi kendi bilgisine saklar. Kul, takvimi tam sayamasa da korumayı görür.\n\nAshab-ı Kehf bu yüzden bir zaman bilmecesi olarak değil, bir ayet olarak okunur.",
        ["İnsanın takvimi tam bildiğini", "Allah'ın dilediğini uyutup uyandırdığını", "Mağaranın hiç var olmadığını", "Şehrin hiç değişmediğini"],
        1,
        "Kul, Allah'ın dilediğini uyutup uyandırdığını görür.",
      ],
    ]),
  ],
);

const gazali = course(
  "Gazali",
  "islam",
  "Ey Oğul",
  "Gazali’nin Ey Oğul diye bilinen öğüdünde işlenen fikirler. Anlatım bizim cümlemizdir. Her ders üç okuma ve bu okumadan cevaplanan bir sorudan oluşur.",
  "ey-ogul",
  [
    lesson("İlim amel ister", 1, "gazali,ilim", [
      [
        "Gazali ilmi neye bağlar?",
        "Ey Oğul'da ilmin, amel edilmeyen bir yük olarak kaldığı anlatılır. Bilmek, yapmak için biriktirilir. Yapılmayan bilgi, sahibine bir övünç değil, bir sorumluluk olur. Eserde bahsedilen, çok bilmenin kendiliğinden olgunluk sayılması değildir.\n\nİlim, amele inmezse eksik kalır.",
        ["Yalnızca ezbere", "Amele", "Başkasına anlatıp bırakmaya", "Sayıca çok olmaya"],
        1,
        "İlim, amel için biriktirilir.",
      ],
      [
        "Yapılmayan bilgi eserde nasıl durur?",
        "Gazali, bilip de yapmayanın haline bakılmasını ister. O bilgi, yol göstermesi gerekirken sahibinin aleyhine dönebilir. Eserde bahsedilen, öğrenmenin yasaklanması değildir. Öğrenilenin hayata inmemesidir sorun.\n\nBilgi, rafta kaldıkça öğüt olmaktan çıkar.",
        ["Her zaman bir övünç olarak", "Yapılmazsa sorumluluk olarak", "Unutulunca sevaba döndüğü", "Hiç öğrenilmemesi gerektiği"],
        1,
        "Yapılmayan bilgi sorumluluk olur.",
      ],
      [
        "Eser çok bilmeyi nasıl görür?",
        "Ey Oğul'da bahsedilen, sayfası çok olanın herkesten üstün olduğudur değil. Üstünlük, bilinenin yaşanmasındadır. Az bilip yapan, çok bilip bırakanın önüne geçebilir. Ölçü, dağarcık değil, ameldir.\n\nGazali öğüdü bu ölçüyle açar.",
        ["Sayfa çokluğunun yeter olduğu", "Yaşanan bilginin önde olduğu", "Amelin ilmi sildiği", "Hiç bilmemenin daha güvenli olduğu"],
        1,
        "Üstünlük, bilinenin yaşanmasındadır.",
      ],
    ]),
    lesson("Dili tutmak", 2, "gazali,dil", [
      [
        "Gazali dili neden tehlikeli sayar?",
        "Ey Oğul'da dil, en kolay işleyen ve en çok zarar veren organ olarak anlatılır. Bir cümle, bir gıybet, bir övünme, geri alınması zor bir izin bırakır. Eserde bahsedilen, konuşmanın haram kılınması değildir.\n\nTehlike, ölçüsüz açılan dildedir.",
        ["Hiç konuşulmadığı için", "Ölçüsüz açıldığı için", "Yalnızca şiir söylediği için", "Susmak farz olduğu için"],
        1,
        "Tehlike, ölçüsüz açılan dildedir.",
      ],
      [
        "Boş söz eserde neye benzer?",
        "Gazali, hayır taşımayan sözün insanı meşgul edip kalbi dağıttığını anlatır. Eserde bahsedilen, her sessizliğin ibadet sayılması değildir. Hayırsız söz, vaktin ve kalbin israfıdır.\n\nDil tutulunca kalp de toplanır.",
        ["Bir ibadet", "Vaktin ve kalbin israfı", "İlmin kendisi", "Bir farz"],
        1,
        "Hayırsız söz, vaktin ve kalbin israfıdır.",
      ],
      [
        "Öğüt dil hakkında ne ister?",
        "Ey Oğul'da bahsedilen, öğrencinin bildiği her şeyi hemen söylemesidir değil. Söylemeden önce o sözün hayır getirip getirmediğine bakılır. Hayır yoksa susmak, bir eksiklik değil, bir edeptir.\n\nGazali dili bir kapı gibi tutmayı öğütler.",
        ["Her bilginin hemen söylenmesi", "Hayır yoksa susulması", "Susmanın yasaklanması", "Sözün hiç tartılmaması"],
        1,
        "Hayır yoksa susmak bir edeptir.",
      ],
    ]),
    lesson("Az uyku az lokma", 3, "gazali,nefis", [
      [
        "Gazali uykuyu nasıl sınırlar?",
        "Ey Oğul'da çok uykunun kalbi ağırlaştırdığı anlatılır. Uyku ihtiyaçtır. Fazlası ise geceyi ve sabahı siler. Eserde bahsedilen, hiç uyumamanın bir üstünlük sayılması değildir.\n\nAz uyku, ibadet ve ilim için yer açmaktır.",
        ["Hiç uyumamak", "Fazlasını bırakıp ibadete yer açmak", "Gündüz hiç uyanmamak", "Uykuyu tamamen unutmak"],
        1,
        "Fazla uyku bırakılır ki ibadete yer açılsın.",
      ],
      [
        "Lokma hakkında ne denir?",
        "Gazali, doyurucu çok yemeğin nefsi şımartıp bedeni uyuşturduğunu söyler. Az lokma, açlığı bir işkenceye çevirmek için değil, kalbi hafif tutmak içindir. Eserde bahsedilen, yemeğin haram kılınması değildir.\n\nÖlçü, sofranın gösterişi değil, yeten kadardır.",
        ["Sofranın dolu olması", "Yeten kadar, kalbi ağırlaştırmayan lokma", "Hiç yenmemesi", "Yalnızca tatlı yenmesi"],
        1,
        "Yeten kadar lokma, kalbi hafif tutar.",
      ],
      [
        "Nefis bu öğütte nerede durur?",
        "Ey Oğul'da bahsedilen, nefsin her istediğinin hemen verilmesi değildir. Çok uyku ve çok lokma nefsi güçlendirir, kalbi gevşetir. Azaltmak, nefsi kırmak için bir gösteri değil, kulluğa yer açmaktır.\n\nGazali bedeni düşman ilan etmez. Onu ölçülü tutar.",
        ["Her istediği verilir", "Ölçülü tutulur ki kulluğa yer açılsın", "Tamamen yok sayılır", "Yalnızca başkası doyurur"],
        1,
        "Nefis ölçülü tutulur.",
      ],
    ]),
    lesson("Dünyaya bağ", 4, "gazali,dunya", [
      [
        "Gazali dünyayı nasıl görür?",
        "Ey Oğul'da dünya, kalıcı bir yurt olarak sevilmemesi gereken bir uğrak diye anlatılır. İnsan oradan geçmektedir. Eserde bahsedilen, dünyadaki helal işin terk edilmesi değildir. Kalbin oraya çakılmasıdır sakınca.\n\nBağ, geçici olanı ebedi sanmaktır.",
        ["Ebedi bir yurt olarak", "Geçilen bir uğrak olarak", "Hiç var olmayan bir yer olarak", "Yalnızca bir ceza olarak"],
        1,
        "Dünya, geçilen bir uğraktır.",
      ],
      [
        "Mal ve makam eserde neye benzer?",
        "Gazali, malın ve makamın insanı oyalayıp asıl işten alıkoyabildiğini söyler. Eserde bahsedilen, rızkın haram sayılması değildir. Onların kalpte birinci sıraya oturmasıdır. Birinci sıra Allah'a ait kalmalıdır.\n\nOyalanma, dünyanın en sessiz bağıdır.",
        ["Rızkın haram olduğu", "Kalpte birinci sıraya otururlarsa oyaladıkları", "Makamın ibadet sayıldığı", "Malın ilmi sildiği"],
        1,
        "Mal ve makam, kalbin birinci sırasına oturursa oyalar.",
      ],
      [
        "Öğüt dünyayı terk etmeyi nasıl anlar?",
        "Ey Oğul'da bahsedilen, dağa çıkıp her helali bırakmak değildir. Kalbin dünyaya köle olmamasıdır. İnsan işini görür, rızkını kazanır, ama orayı son durak sanmaz. Bağ kopunca dünya eşya olarak kalır, ilah olmaz.\n\nGazali bu ayrımı öğüdün ortasına koyar.",
        ["Her helalin bırakılması", "Kalbin dünyaya köle olmaması", "İşin terk edilmesi", "Rızkın reddedilmesi"],
        1,
        "Terk, kalbin köle olmamasıdır.",
      ],
    ]),
    lesson("Gece ve pişmanlık", 5, "gazali,gece", [
      [
        "Gazali geceyi neye ayırır?",
        "Ey Oğul'da gecenin bir kısmı, gaflet uykusuna değil, bir uyanışa ayrılır. Kul o saatte kendi haline bakar. Eserde bahsedilen, bütün geceyi ibadet sayıp gündüzü silmek değildir.\n\nGece, pişmanlığın ve yönelişin vaktidir.",
        ["Yalnızca daha çok uykuya", "Bir uyanışa ve yönelişe", "Eğlenceye", "İş bitirmeye"],
        1,
        "Gecenin bir kısmı uyanışa ayrılır.",
      ],
      [
        "Pişmanlık eserde nasıl durur?",
        "Gazali, hatadan sonra dönmeyi bir zayıflık diye koymaz. Pişmanlık, kalbin hâlâ diri olduğunun işaretidir. Eserde bahsedilen, günahı övmek değildir. Günahın üstünü örtüp yoluna devam etmeyi reddetmektir.\n\nDönüş, öğüdün kapanışıdır.",
        ["Bir zayıflık olarak", "Kalbin diri olduğunun işareti olarak", "Günahın övgüsü olarak", "Gereksiz bir duygu olarak"],
        1,
        "Pişmanlık, kalbin diri olduğunun işaretidir.",
      ],
      [
        "Öğüt öğrenciden en son ne ister?",
        "Ey Oğul'da bahsedilen, bilginin artıp kalbin aynı kalması değildir. Öğrenci bildiğini yapacak, dilini tutacak, dünyaya köle olmayacak ve hata ederse dönecektir. Gece bu dönüşün hatırlatıcısıdır.\n\nGazali mektubu bir ünvan değil, bir yol bırakır.",
        ["Daha uzun bir ünvan", "Bildğini yapması ve hata ederse dönmesi", "Geceyi tamamen uyku yapması", "Dünyayı ilk sıraya koyması"],
        1,
        "Öğrenciden, bildiğini yapması ve dönebilmesi istenir.",
      ],
    ]),
  ],
);

const hayat = course(
  "Dikkat ve çalışma",
  "hayat",
  "Bir işe oturmak",
  "Öğrencinin dersin başına oturmasını kolaylaştıran özgün notlar. Kitap özeti değildir. Her ders üç okuma ve bu okumadan cevaplanan bir sorudan oluşur.",
  "dikkat",
  [
    lesson("Uyku", 1, "hayat,uyku", [
      [
        "Metne göre uykusuz sabah neyi bozar?",
        "Bir işe oturmanın ilk şartı, o sabah ayakta olmaktır. Gece geç yatıp sabah mahmur kalkan kişi, dersi zor sandığı için değil, zihni henüz açılmadığı için dağılır. Uyku bir ödül gibi ertelenirse ertesi günün dikkati peşin harcanmış olur.\n\nMetinde bahsedilen, çok uyumanın erdem sayılması değildir. Yeterince uyumadan masaya oturmanın dikkat sanılmasıdır hata.",
        ["Dersin konusunu", "Ertesi günün dikkatini", "Kalemin mürekkebini", "Sınıfın sırasını"],
        1,
        "Uykusuz sabah, ertesi günün dikkatini bozar.",
      ],
      [
        "Metne göre uyku ne zaman ayarlanır?",
        "Uyku, sınav gecesi birden düzelmez. Beden, her gece aynı saatte kapanmaya alışır. Metinde bahsedilen, yatış saatini yalnızca önemli günden bir gece önce çekmektir değil. Alışkanlık, sıradan gecelerde kurulur.\n\nSabahki netlik, önceki gecenin saatine benzer.",
        ["Yalnızca sınav gecesi", "Sıradan gecelerde, aynı saatte", "Öğleden sonra bir kez", "Hiç uyumadan"],
        1,
        "Uyku, sıradan gecelerde aynı saatte kurulur.",
      ],
      [
        "Metin erken kalkmayı neye bağlar?",
        "Erken kalkmak bir irade gösterisi olarak anlatılmaz. Gece zamanında yatılmışsa sabah kendiliğinden gelir. Metinde bahsedilen, alarmın insanı uyandırıp uykunun yerini tutmasıdır değil.\n\nErken saat, önceki gecenin devamıdır.",
        ["Yalnızca güçlü bir alarma", "Önceki gece zamanında yatmaya", "Hiç uyumamaya", "Sabah kahvesine"],
        1,
        "Erken kalkış, zamanında yatmanın devamıdır.",
      ],
    ]),
    lesson("Telefon", 2, "hayat,telefon", [
      [
        "Metne göre telefon masada neden çalışmayı böler?",
        "Telefon gözün önündeyken zihin işin içinde kalamaz. Bildirim gelmese de gelme ihtimali dikkati bölmüştür. Metinde bahsedilen, telefonun yasak bir eşya olması değildir. Ders süresince başka bir odada durmasıdır.\n\nGörünen cihaz, görünmeyen bir çağrıdır.",
        ["Bildirim sesi kapalı olduğu için bölmez", "Gelme ihtimali dikkati böldüğü için", "Yalnızca şarjı bitince", "Masada durunca suskun kaldığı için"],
        1,
        "Gelme ihtimali bile dikkati böler.",
      ],
      [
        "Metne göre kısa bir bakış ne kadar sürer?",
        "Bir bakış, ekranda birkaç dakika sanılır. Geri dönünce cümlenin yeri kaybolmuştur. Metinde bahsedilen, bakışın bedava olduğu değildir. İşin yeniden kurulması, bakışın kendisinden uzun sürer.\n\nKısa sandığımız ara, dersi ikiye böler.",
        ["Hiç sürmez", "İşin yeniden kurulması bakıştan uzun sürer", "Tam bir ders saati sayılmaz", "Yalnızca bir saniye sürer ve iz bırakmaz"],
        1,
        "Geri dönüş, bakıştan uzun sürer.",
      ],
      [
        "Metin telefonu nereye koyar?",
        "Ders bitene kadar telefon başka odadadır. Çanta da yetmez. Elin değdiği yer, bir süre sonra açılır. Metinde bahsedilen, iradeyle ekrana bakmamaktır değil. Eşyayı uzakta tutmaktır.\n\nMesafe, dikkatin yerine geçer.",
        ["Masanın üstüne, ters çevrilmiş", "Başka odaya", "Yastığın altına", "Elin içine"],
        1,
        "Telefon, ders bitene kadar başka odada durur.",
      ],
    ]),
    lesson("Sınav kaygısı", 3, "hayat,kaygi", [
      [
        "Metne göre kaygı dersi ne zaman yer?",
        "Kaygı, sınav sabahı birden gelmez. Çalışılmayan günlerin boşluğu, o sabah korku diye görünür. Metinde bahsedilen, korkunun bir karakter kusuru olmasıdır değil. Hazırlığın yokluğudur.\n\nKüçük tekrar, kaygının beslendiği boşluğu daraltır.",
        ["Yalnızca sınav sabahı", "Çalışılmayan günlerin boşluğunda", "Yalnızca çok çalışanlarda", "Uykudan bağımsız"],
        1,
        "Kaygı, çalışılmayan günlerin boşluğundan beslenir.",
      ],
      [
        "Metne göre bütün konuyu bir gecede bitirmek ne yapar?",
        "Bir gece her şeyi bitirme planı, kaygıyı azaltmaz. Yetişmeyecek bir yığın, korkuyu büyütür. Metinde bahsedilen, o gecenin bir kahramanlık sayılmasıdır değil. Dar bir parçanın bitirilmesidir o günün işi.\n\nBitirilen parça, yığından daha sakinleştirir.",
        ["Kaygıyı siler", "Yetişmeyecek yığın korkuyu büyütür", "Her zaman en iyi yoldur", "Uykunun yerini tutar"],
        1,
        "Yetişmeyecek yığın, korkuyu büyütür.",
      ],
      [
        "Metin sınav sabahı için neyi yeterli sayar?",
        "Sabah, yeni bir kitap açma vakti değildir. Daha önce bitirilmiş küçük parçaların üstünden geçilir. Metinde bahsedilen, sabahın boş olması değildir. Yeni yük bindirilmemesidir.\n\nTanıdık bir sayfa, tanımadığı bir yığından daha az korkutur.",
        ["Yeni bir kitabın açılması", "Bitmiş parçaların üstünden geçilmesi", "Hiç bakılmaması", "Bütün yılın o sabah okunması"],
        1,
        "Sabah, bitmiş parçaların üstünden geçilir.",
      ],
    ]),
    lesson("Başlamak", 4, "hayat,baslamak", [
      [
        "Metne göre iş neden ağır görünür?",
        "İş, tamamı bir anda düşünülünce ağırlaşır. Bir sayfa, bir soru, on dakika düşünülünce kapı açılır. Metinde bahsedilen, hedefin küçültülmesi değildir. İlk adımın küçültülmesidir.\n\nBaşlamak, bitirmekten ayrı bir iştir.",
        ["Hedef küçük olduğu için", "Tamamı bir anda düşünüldüğü için", "On dakika uzun olduğu için", "Sayfa yasak olduğu için"],
        1,
        "İş, tamamı bir anda düşünülünce ağır görünür.",
      ],
      [
        "Metne göre ilk on dakika ne işe yarar?",
        "İlk on dakika işi bitirmez. Masaya oturmayı başlatır. Metinde bahsedilen, o sürenin bir aldatmaca olmasıdır değil. Eşik geçilince birçok gün iş kendiliğinden uzar. Uzamazsa da oturuş kopmuş sayılmaz.\n\nOn dakika, bahanesini zayıflatır.",
        ["İşi tamamen bitirir", "Masaya oturmayı başlatır", "Hiçbir işe yaramaz", "Yalnızca süreyi uzatır"],
        1,
        "İlk on dakika, oturmayı başlatır.",
      ],
      [
        "Metin yarım kalan güne ne der?",
        "Yarım kalan gün, hiç oturulmayan günden ayrıdır. Eşik geçilmiştir. Metinde bahsedilen, yarım işin tam işe eşit olmasıdır değil. Zincirin koptuğu yerin, hiç başlanmayan yer olmadığıdır.\n\nErtesi gün, aynı küçük adımla yeniden açılır.",
        ["Hiç oturulmayan günle aynı olduğu", "Eşik geçildiği için zincirin kopmadığı", "Tam iş sayıldığı", "Silinmesi gerektiği"],
        1,
        "Yarım gün, hiç başlanmayan günden ayrıdır.",
      ],
    ]),
  ],
);

const files = {
  "data/basari-ve-cevre.json": basari,
  "data/gazali.json": gazali,
  "data/dikkat-ve-calisma.json": hayat,
};

for (const [path, data] of Object.entries(files)) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
  const n = data.units[0].lessons.reduce((s, l) => s + l.challenges.length, 0);
  console.log(path, data.units[0].lessons.length, "ders", n, "soru");
}
