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

const dilBelasi = unit(
  "Dil Belası",
  "Gazali’nin İhya’dan dilin afetleri üzerine bilinen öğüdü. Her ders üç okuma ve bu okumadan cevaplanan bir sorudan oluşur.",
  3,
  [
    lesson("Susmak", 1, "dil-belasi,susmak", [
      [
        "Gazali dile neden tehlikeli bir aza der?",
        "Gazali, dilin afetlerinde insanın en çok karşı koyan azasının dil olduğunu anlatır. Dil yorulmaz, cephaneye ihtiyaç duymaz. Bir cümle, bir gıybet, bir yemin, geri alınması zor bir izin bırakır. Kitapta bahsedilen, konuşmanın kendisinin yasaklanması değildir.\n\nTehlike, ölçüsüz açılan dildedir. Gazali bu yüzden susmayı bir kaçış değil, dilin ilk terbiyesi sayar.",
        ["Az konuştuğu için", "Yorulmadan ve kolayca zarar verdiği için", "Yalnızca şiir söylediği için", "Hiç kullanılmadığı için"],
        1,
        "Dil, yorulmadan zarar verebildiği için tehlikelidir.",
      ],
      [
        "Kitapta susmak neye yarar?",
        "Gazali, hayır taşımayan sözün kalbi dağıttığını anlatır. Susmak, o anda bir eksiklik değildir. Söylemeden önce sözün hayır getirip getirmediğine bakılır. Hayır yoksa dil tutulur.\n\nKitapta bahsedilen, insanın hiç konuşmaması değildir. Dilin, övülecek ile kınanacak sözü ayırt etmeden açılmamasıdır.",
        ["Her bilginin hemen söylenmesi", "Hayır yoksa dilin tutulması", "Susmanın yasaklanması", "Sözün hiç tartılmaması"],
        1,
        "Hayır yoksa susmak, dilin terbiyesidir.",
      ],
      [
        "Gazali konuşmayı neden ağır bir iş sayar?",
        "Kitapta, insanın dilini kullandığında övüleceği yeri bilmesinin zor olduğu belirtilir. Dilin yaratılış gayesine göre konuşmak, çoğu kişiye ağır gelir. İnsanlar dilin tuzaklarında dikkatsizdir.\n\nGazali bu ağırlığı, şeytanın en büyük kozunun dil olmasıyla anlatır. Söz kolay çıktığı için hafif sanılır. Hesabı ise kolay değildir.",
        ["Sözün hesabı olmadığı için", "Övülecek sözü ayırt etmek zor olduğu için", "Konuşmak farz sayıldığı için", "Susmak her zaman günah olduğu için"],
        1,
        "Hangi sözün övüleceğini bilmek zordur.",
      ],
    ]),
    lesson("Boş söz", 2, "dil-belasi,bos-soz", [
      [
        "Gazali boş sözü neden afet sayar?",
        "Gazali, malayaniyi, fayda vermeyen söz diye anlatır. İnsan o sözle ne öğrenir ne de bir iş düzelir. Vakit ve kalp dağılır. Kitapta bahsedilen, her sessizliğin ibadet sayılması değildir.\n\nBoş söz, dilin en sık düştüğü afettir. Çünkü yasak gibi görünmez. Yine de insanı asıl sözden alıkoyar.",
        ["İlim sayıldığı için", "Fayda vermeden vakti ve kalbi dağıttığı için", "Her zaman sevap biriktirdiği için", "Yalnızca şiirde geçtiği için"],
        1,
        "Boş söz fayda vermez, vakti ve kalbi dağıtır.",
      ],
      [
        "Fuzuli konuşmak malayaniden nasıl ayrılır?",
        "Gazali, faydasız sözün yanında bir de lüzumsuz uzatmayı sayar. Sözün bir kısmı yerindedir. Fazlası ise aynı kapıdan içeri girer ve ölçüyü bozar. Kitapta bahsedilen, az sözün her zaman eksik olduğudur değil.\n\nYerinde bir cümle yeterken uzatmak, dilin ikinci tuzağıdır.",
        ["Kısa sözün yasak olduğu", "Yerinde sözün uzatılınca ölçüyü bozduğu", "Her uzatmanın ilim olduğu", "Fuzulinin hiç zarar vermediği"],
        1,
        "Yerinde söz uzatılınca ölçü bozulur.",
      ],
      [
        "Kitap boş söze karşı ne ister?",
        "Gazali, dilin her açılışının sevap biriktirdiğini söylemez. Faydası olmayan söz, söylenmemiş olsa daha iyi durur. İnsan bunu bir kural diye ezberlemez. Her cümleden önce o sözün bir işe yarayıp yaramadığına bakar.\n\nBakış kalkınca boş söz afet olmaktan çıkar, alışkanlık olur.",
        ["Her cümlenin hayır sayılması", "Sözün bir işe yarayıp yaramadığına bakılması", "Boş sözün övülmesi", "Konuşmanın tamamen bırakılması"],
        1,
        "Söylemeden önce sözün faydasına bakılır.",
      ],
    ]),
    lesson("Yalan", 3, "dil-belasi,yalan", [
      [
        "Gazali yalanı dilin neresine koyar?",
        "Gazali, yalanı dilin ağır afetlerinden sayar. Söz, olanı olduğundan başka göstermek için açılır. Kitapta bahsedilen, şakanın her türünün yalanla bir tutulması değildir. Bilerek gerçeğin tersine konuşmaktır asıl bozulma.\n\nYalan bir kez kolaylaşınca yemin de vaat de aynı kapıdan geçer.",
        ["Her şakanın yalan sayıldığı", "Gerçeğin bilerek tersine çevrildiği", "Susmanın yalan olduğu", "Yalnızca yazıda geçtiği"],
        1,
        "Yalan, gerçeği bilerek tersine çevirmektir.",
      ],
      [
        "Yalan vaat kitapta neden ayrıca durur?",
        "Gazali, söz verip tutmamayı yalana komşu bir afet diye anlatır. Vaat, geleceğe bırakılmış bir sözdür. Tutulmayacağı bilinerek verilirse yalan o anda söylenmiş olur. Kitapta bahsedilen, unutulan her vaadin aynı kefeye konması değildir.\n\nİnsan tutamayacağı sözü diline dolamadan önce durmalıdır.",
        ["Her unutmanın yalan olduğu", "Tutulmayacak vaadin yalana komşu olduğu", "Vadin hiç verilmemesi gerektiği", "Vaidin hesaba girmeyeceği"],
        1,
        "Tutulmayacağı bilinen vaat, yalana komşudur.",
      ],
      [
        "Kitap yalanın yayılmasını nasıl anlatır?",
        "Gazali’de yalan tek cümlede kalmaz. Bir yalan, onu örtecek ikinci sözü çağırır. Dil bu yüzden bir afetle yetinmez. Kitapta bahsedilen, küçük bir ters sözün zararsız kaldığıdır değil.\n\nİlk yalan kapıyı açar. Sonrakiler o kapıdan girer.",
        ["Tek cümlede kapandığı", "Bir yalanın ikincisini çağırdığı", "Yalanın susmayla silindiği", "Örtmenin sevap olduğu"],
        1,
        "Bir yalan, örtmek için ikincisini çağırır.",
      ],
    ]),
    lesson("Gıybet", 4, "dil-belasi,giybet", [
      [
        "Gazali gıybeti nasıl tarif eder?",
        "Gazali, gıybeti, bir kardeşini onun hoşlanmayacağı bir şeyle anmak diye anlatır. Söz doğru olsa da, o yokken ve rahatsız olacağı biçimde söylenmişse gıybettir. Kitapta bahsedilen, her doğru sözün serbest olduğudur değil.\n\nDoğruluk, arkadan konuşmayı temize çıkarmaz.",
        ["Yalnızca yalan olduğu", "Yokken, hoşlanmayacağı bir şeyle anmak olduğu", "Yüzüne söylenince de aynı kaldığı", "Övgü sayıldığı"],
        1,
        "Gıybet, kişiyi yokken hoşlanmayacağı şeyle anmaktır.",
      ],
      [
        "Kitapta gıybet neden ağır durur?",
        "Gazali, gıybeti dilin en çok yayıldığı afetlerden sayar. İnsan onu sohbet sanır. Oysa kardeşinin etini, o yokken dile dolamıştır. Kitapta bahsedilen, ayıbı örtmenin gereksiz olduğudur değil.\n\nAyıp varsa yol, onu çoğaltmak değil, örtmek ya da kendisine söylemektir.",
        ["Sohbet sayıldığı için hafif kaldığı", "Kardeşin ayıbını yokken yaydığı için", "Yalnızca yalan olunca günah olduğu", "Örtmenin yasak olduğu"],
        1,
        "Gıybet, ayıbı yokken yaymaktır.",
      ],
      [
        "Gazali gıybeti dinleyen için ne der?",
        "Kitapta, gıybeti dinleyip durdurmayanın da o sofraya oturduğu sezdirilir. Söz ağızdan çıkmıştır ama onu büyüten, susan meclistir. Gazali’nin anlattığı, yalnızca söyleyenin sorumlu olduğudur değil.\n\nDinlemek, o afeti ikinci kez işlemek olabilir.",
        ["Dinleyenin sorumlu olmadığı", "Durdurmayan dinleyicinin de o söze ortak olduğu", "Susmanın gıybeti sildiği", "Meclisin hiç duymadığı"],
        1,
        "Gıybeti durdurmayan da o söze ortak olur.",
      ],
    ]),
    lesson("Söz taşımak", 5, "dil-belasi,soz-tasimak", [
      [
        "Gazali söz taşımayı neden ayrı bir afet sayar?",
        "Gazali, laf taşımada bir kişinin sözünün, bozmak için başkasına götürüldüğünü anlatır. Gıybet arkadan anar. Söz taşımak ise iki tarafın arasını açar. Kitapta bahsedilen, her haberin taşınmasının aynı olduğu değildir.\n\nAmaç, bir kardeşliği bozmaksa o haber afettir.",
        ["Her haberin yararlı olduğu", "İki tarafın arasını açmak için söz götürüldüğü", "Susmanın söz taşımak olduğu", "Yalnızca mektupla olduğu"],
        1,
        "Söz taşımak, arasını açmak için haber götürmektir.",
      ],
      [
        "Kitapta iki dillilik neye benzer?",
        "Gazali, bir yüzde bir, öbür yüzde başka konuşmayı dilin afetlerinden sayar. İnsan her mecliste kendini sevdirir, arada kalan gerçeği ise ikiye böler. Kitapta bahsedilen, herkese aynı sertlikte konuşma zorunluluğu değildir.\n\nİki dil, güveni iki taraftan da yer.",
        ["Herkese aynı sözün farz olduğu", "Her yüzde başka konuşmanın güveni yediği", "İki dilin edep sayıldığı", "Susmanın iki dillilik olduğu"],
        1,
        "İki yüzde iki türlü konuşmak güveni yer.",
      ],
      [
        "Gazali bu afetlere karşı dilde ne bırakır?",
        "Kitapta dilin yirmi afeti sayılır. Hepsi bir ders olmaz. Ortak çizgi şudur: söz, ya hayır taşır ya da tutulur. Gıybet, yalan ve taşınan laf bu çizginin dışındadır.\n\nGazali öğrenciden uzun bir liste ezberlemesini değil, söylemeden önce o çizgiye bakmasını ister.",
        ["Yirmi afetin ezberlenmesi", "Sözün hayır taşıması ya da tutulması", "Her haberin iletilmesi", "Dilin hiç açılmaması"],
        1,
        "Söz ya hayır taşır ya da tutulur.",
      ],
    ]),
  ],
);

const guc = unit(
  "Alışkanlığın Gücü",
  "Charles Duhigg’in Alışkanlığın Gücü kitabında işlenen alışkanlık fikirleri. Her ders üç okuma ve bu okumadan cevaplanan bir sorudan oluşur.",
  5,
  [
    lesson("Döngü", 1, "aliskanligin-gucu,dongu", [
      [
        "Kitap alışkanlığı hangi üç parçayla anlatır?",
        "Alışkanlığın Gücü, alışkanlığı bir döngü diye kurar. Önce bir işaret gelir. Sonra bilinen davranış çalışır. En sonda bir ödül o davranışı yerinde tutar. Kitapta bahsedilen, iradenin her seferinde baştan karar verdiğidir değil.\n\nDöngü bir kez oturunca beyin, işaretle ödül arasında kestirme yapar.",
        ["Yalnızca güçlü bir karar", "İşaret, davranış ve ödül", "Tek bir büyük ceza", "Başkalarının alkışı"],
        1,
        "Döngü işaret, davranış ve ödülden kurulur.",
      ],
      [
        "Kitaba göre işaret ne işe yarar?",
        "Kitap, işareti döngünün kapısı diye anlatır. Bir saat, bir yer, bir duygu, davranışı başlatır. İşaret görünmezse insan alışkanlığı karakter sanır. Kitapta bahsedilen, işaretin her zaman bir alarm sesi olduğudur değil.\n\nKapı fark edilince döngü de görünür olur.",
        ["Döngüyü kapattığı", "Davranışı başlattığı", "Ödülü sildiği", "İradeyi büyüttüğü"],
        1,
        "İşaret, davranışı başlatan kapıdır.",
      ],
      [
        "Ödül döngüde neden kalır?",
        "Kitapta ödül, davranışın boşuna olmadığını bedene öğretir. Ödül kalkınca döngü zayıflar. Ödül durdukça işaret bir sonraki seferde yine aynı davranışı çağırır. Kitapta bahsedilen, ödülün yalnızca büyük bir hediye olduğudur değil.\n\nKüçük bir rahatlama da ödül olabilir.",
        ["Döngüyü bitirdiği için", "Davranışın tekrarını öğrettiği için", "İşareti yasakladığı için", "İradenin yerini tuttuğu için"],
        1,
        "Ödül, davranışın tekrarını öğretir.",
      ],
    ]),
    lesson("Kilit alışkanlık", 2, "aliskanligin-gucu,kilit", [
      [
        "Kitap kilit alışkanlığı nasıl tarif eder?",
        "Alışkanlığın Gücü, bazı alışkanlıkların diğerlerini de yerinden oynattığını anlatır. Biri düzelince uyku, söz ve düzen de ona uyar. Kitapta bahsedilen, her alışkanlığın aynı ağırlıkta olduğudur değil.\n\nKilit olan, kapıyı açan davranıştır.",
        ["En uzun süren davranış", "Diğerlerini de yerinden oynatan davranış", "Yalnızca sabah yapılan iş", "Başkasına devredilen iş"],
        1,
        "Kilit alışkanlık, diğerlerini de oynatır.",
      ],
      [
        "Kitap neden her şeyi birden değiştirmeyi önermez?",
        "Kitapta dağınık bir yenilenme, hiçbir döngüyü tam kuramaz. Bir kilit seçilince dikkat orada toplanır. Diğer değişimler o kilidin ardından gelir. Kitapta bahsedilen, küçük işlerin önemsiz olduğudur değil.\n\nDar bir kapı, geniş bir odayı açabilir.",
        ["Küçük iş yasak olduğu için", "Tek kapı diğer değişimlere yol verdiği için", "İnsan yalnızca bir iş yapabildiği için", "Listeler çalışmadığı için"],
        1,
        "Bir kilit, sonraki değişimlere yol verir.",
      ],
      [
        "Kilit alışkanlık neye benzemez?",
        "Kitap, kilit alışkanlığı bir kimlik ilanı diye koymaz. O, ölçülebilir ve tekrarlanan bir davranıştır. Söylenip bırakılan bir niyet kapı açmaz. Kitapta bahsedilen, niyetin gereksiz olduğudur değil.\n\nNiyet, ancak dönen bir davranışa bağlanınca kilit olur.",
        ["Tekrarlanan bir davranış", "Söylenip bırakılan bir niyet", "İşaretli bir döngü", "Küçük bir ödül"],
        1,
        "Söylenip bırakılan niyet kilit olmaz.",
      ],
    ]),
    lesson("Özlem", 3, "aliskanligin-gucu,ozlem", [
      [
        "Kitap özlemi döngünün neresine koyar?",
        "Alışkanlığın Gücü, ödülün kendisinden çok ödüle duyulan özlemin döngüyü çevirdiğini anlatır. İşaret gelince beden, daha davranış başlamadan o rahatlamayı ister. Kitapta bahsedilen, özlemin iradeyle susturulabildiğidir değil.\n\nÖzlem, görünmeyen motordur.",
        ["Döngünün dışında", "İşaretle birlikte uyanan istekte", "Yalnızca büyük ödüllerde", "Ceza korkusunda"],
        1,
        "Özlem, işaretle birlikte uyanır.",
      ],
      [
        "Kitaba göre yeni bir alışkanlık neden tutunmaz?",
        "Kitapta yeni davranış, eski özlemin yerine geçmezse döngü yarım kalır. İnsan doğru işi bir kez yapar, beden o işi istemez. Kitapta bahsedilen, tekrarın gereksiz olduğudur değil.\n\nTekrar, ancak özlem o davranışa bağlanırsa alışkanlık olur.",
        ["Bir kez yapılınca bittiği için", "Eski özlemin yerini almadığı için", "İşaret silindiği için", "Ödül fazla olduğu için"],
        1,
        "Yeni davranış eski özlemin yerini almazsa tutunmaz.",
      ],
      [
        "Kitap özlemi fark etmeyi neye yarar?",
        "Bu kitapta özlem, döngünün parçası olarak durur. İnsan neyi özlediğini görünce işareti de görür. Kitapta bahsedilen, özlemin bir utanç olduğu değildir.\n\nGörülen özlem, değiştirilebilir bir parçadır.",
        ["Özlemin gizlenmesi", "İşaretin de görünür olması", "Döngünün yasaklanması", "Ödülün büyütülmesi"],
        1,
        "Özlem görülünce işaret de görünür.",
      ],
    ]),
    lesson("Ortam", 4, "aliskanligin-gucu,ortam", [
      [
        "Kitap alışkanlığın nerede kırıldığını söyler?",
        "Alışkanlığın Gücü, döngünün çoğu zaman kişinin içinde değil, işaretin durduğu yerde kırıldığını anlatır. Aynı oda, aynı saat, aynı eşya eski davranışı çağırır. Kitapta bahsedilen, karakterin hiç payı olmadığı değildir.\n\nOrtam değişmeden niyet, eski işaretle baş başa kalır.",
        ["Yalnızca karakterde", "Eski işareti taşıyan ortamda", "Yalnızca ödülün adında", "Başkasının sözünde"],
        1,
        "Eski işaret ortamda duruyorsa döngü çağrılır.",
      ],
      [
        "Kitaba göre yeni ortam ne sağlar?",
        "Kitap, işaretlerin değiştiği bir yerde eski döngünün bir süre boş kaldığını söyler. O boşluk, yeni davranış için yer açar. Kitapta bahsedilen, taşınmanın sihirli bir çözüm olduğudur değil.\n\nYeni yer, ancak yeni döngü kurulursa işe yarar.",
        ["Eski döngünün kendiliğinden silinmesi", "Eski işaretin bir süre susması", "İradenin sonsuz olması", "Ödülün gerekmemesi"],
        1,
        "Yeni ortam, eski işareti bir süre susturur.",
      ],
      [
        "Kitap ortamı değiştirmeden neyin zor olduğunu söyler?",
        "Kitapta aynı işaretlerin içinde yeni bir niyet, her gün yeniden savaş ister. Savaş yorulur. Ortam, savaşı küçültür. Kitapta bahsedilen, iradenin hiç işe yaramadığı değildir.\n\nİrade, işaretler aynı kaldıkça çabuk tükenir.",
        ["Yeni niyetin kolay kazanması", "İradenin çabuk tükenmesi", "Döngünün kendiliğinden değişmesi", "Ödülün büyümesi"],
        1,
        "Aynı işaretlerin içinde irade çabuk tükenir.",
      ],
    ]),
    lesson("İradenin sınırı", 5, "aliskanligin-gucu,irade", [
      [
        "Kitap iradeyi neye benzetir?",
        "Alışkanlığın Gücü, iradeyi tükenen bir kas diye anlatır. Sabah güçlüdür. Gün içinde kararlar biriktikçe zayıflar. Kitapta bahsedilen, iradenin hiç olmadığı değildir.\n\nAkşam aynı savaşı sabahki güçle vermek zordur.",
        ["Hiç tükenmeyen bir kaynak", "Gün içinde tükenen bir kas", "Yalnızca ceza korkusu", "Başkasından ödünç alınan bir güç"],
        1,
        "İrade, gün içinde tükenen bir kastır.",
      ],
      [
        "Kitaba göre alışkanlık iradenin yerini nasıl alır?",
        "Kitapta oturmuş döngü, her seferinde karar istemez. İşaret gelir, davranış akar. İrade o sırada başka bir işe kalır. Kitapta bahsedilen, düşünmenin bittiğidir değil.\n\nAlışkanlık, iradeyi her küçük adımda harcamamak için kurulur.",
        ["Her adımda yeni bir karar isteyerek", "İşaret gelince davranışı akıtarak", "Ödülü kaldırarak", "Ortamı yok sayarak"],
        1,
        "Oturmuş döngü, her adımda yeni karar istemez.",
      ],
      [
        "Kitabın son ölçüsü nedir?",
        "Kitap, iyi niyeti küçümsemez. Niyet, döngü, kilit ve ortam kurulmadan günü taşıyamaz. İrade sınırlıdır. Sınırı bilen, savaşı alışkanlığa devreder.\n\nAlışkanlığın Gücü bu yüzden karakter vaadi değil, döngü vaadi olarak okunur.",
        ["İradenin sınırsız olduğu", "Sınırlı iradenin döngüye devredildiği", "Ortamın önemsiz olduğu", "Kilit alışkanlığın yasak olduğu"],
        1,
        "Sınırlı irade, kurulmuş döngüye devredilir.",
      ],
    ]),
  ],
);

const zirve = unit(
  "Zirve",
  "Anders Ericsson ve Robert Pool’un Zirve kitabında işlenen uzmanlık fikirleri. Her ders üç okuma ve bu okumadan cevaplanan bir sorudan oluşur.",
  6,
  [
    lesson("Bilinçli pratik", 1, "zirve,pratik", [
      [
        "Kitap sıradan tekrarı uzmanlıktan nasıl ayırır?",
        "Zirve, aynı işi yıllarca yapmanın kendiliğinden ustalık vermediğini anlatır. Bilinçli pratik, belirli bir zayıf noktaya yönelir, zorlar ve hemen düzeltilir. Kitapta bahsedilen, sürenin hiç önemi olmadığı değildir.\n\nSüre, ancak o süre zorlayıcı ve düzeltiliyorsa birikir.",
        ["Her tekrarın aynı olduğu", "Zayıf noktaya yönelip düzeltilen tekrar", "Yalnızca seyretmenin yettiği", "Rahat tempoda uzun süre"],
        1,
        "Bilinçli pratik, zayıf noktayı zorlayıp düzeltir.",
      ],
      [
        "Kitaba göre rahat tekrar ne yapmaz?",
        "Kitap, insanın iyi olduğu yeri tekrar tekrar oynamasının ustayı yerinde tuttuğunu, ileri götürmediğini söyler. Rahat bölge tanıdıktır. Hata azdır. Gelişme de azdır. Kitapta bahsedilen, ısınmanın yasak olduğudur değil.\n\nIsınma biter, asıl çalışma hata çıkan yerde başlar.",
        ["İnsanı ileri götürdüğü", "Tanıdık yerde kişiyi tuttuğu", "Hata ürettiği", "Geri bildirim verdiği"],
        1,
        "Rahat tekrar, kişiyi tanıdık yerde tutar.",
      ],
      [
        "Kitap bilinçli pratiği neyle karıştırmaz?",
        "Zirve, çok çalışmayı bilinçli pratik sanmamayı öğütler. Yorgunluk, hedefin doğru seçildiğini göstermez. Hedef, yapılamayan küçük bir parçadır. Kitapta bahsedilen, emeğin küçümsenmesi değildir.\n\nEmek, yanlış yere dökülünce saat dolar, ustalık dolmaz.",
        ["Küçük bir zayıf parçayla", "Yalnızca yorgunlukla", "Seyretmekle", "Alkışla"],
        1,
        "Yorgunluk, hedefin doğru olduğunu göstermez.",
      ],
    ]),
    lesson("On bin saat", 2, "zirve,saat", [
      [
        "Kitap on bin saat fikrini nasıl görür?",
        "Zirve, uzun emeğin gerekli olduğunu kabul eder. Aynı sayının her iş için sihirli bir eşik olduğunu kabul etmez. Kimi alan daha uzun, kimi daha kısa bir birikim ister. Kitapta bahsedilen, saatin hiç sayılmaması değildir.\n\nSayı, o saatin nasıl doldurulduğundan ayrı okunamaz.",
        ["Her iş için sihirli bir eşik", "Süreyi gerekli, sayıyı işe göre değişen bir ölçü", "Saatin yasak olduğu bir kural", "Yalnızca bir günün hesabı"],
        1,
        "Süre gerekir. Aynı sayı her işin eşiği değildir.",
      ],
      [
        "Kitaba göre saat neden tek başına yetmez?",
        "Kitap, doldurulan saatin rahat tekrarla da birikebileceğini söyler. O saatler uzun görünür, ustalık getirmez. Bilinçli pratikte ise saat daha az olsa da her dilim bir zayıf noktaya gider.\n\nÇizginin Dışındakiler’in sadeleştirdiği sayıyı Zirve yeniden niteler.",
        ["Rahat saatin de aynı ustalığı verdiği", "Saatin nasıl dolduğunun belirleyici olduğu", "Kısa çalışmanın yasak olduğu", "Sayının hiç anılmadığı"],
        1,
        "Saatin nasıl dolduğu, toplamdan daha belirleyicidir.",
      ],
      [
        "Kitap erken başlayan uzun emeği nereye koyar?",
        "Zirve, erken yaşta başlayan çalışmayı yok saymaz. Erken başlamak, bilinçli pratiğe daha çok yıl açar. Yıl, otomatik ustalık değildir. Kitapta bahsedilen, geç başlayanın hiç yetişemeyeceğidir değil.\n\nGeç başlayan da zayıf noktaya çalışırsa yol alır. Erken başlayan, o yolu daha uzun yürümüş olur.",
        ["Otomatik ustalık saydığı", "Bilinçli pratiğe daha uzun bir süre açtığı", "Geç başlayanı sildiği", "Saati tamamen reddettiği"],
        1,
        "Erken başlamak, bilinçli pratiğe daha uzun süre açar.",
      ],
    ]),
    lesson("Zayıf nokta", 3, "zirve,zayif", [
      [
        "Kitap çalışmanın hedefini nereye koyar?",
        "Zirve, çalışmanın iyi gidene değil, takılana yönelmesini ister. İyi giden parça gösteri olur. Takılan parça ders olur. Kitapta bahsedilen, güçlü yanın unutulması değildir.\n\nUstalık, yapılamayanın küçültülmesiyle ilerler.",
        ["En iyi parçanın tekrarında", "Takılınan parçanın üstünde", "Seyircinin istediği yerde", "En kolay egzersizde"],
        1,
        "Hedef, takılınan parçadır.",
      ],
      [
        "Kitaba göre hata ne işe yarar?",
        "Kitap, hatayı utanç diye koymaz. Hata, zayıf noktanın adresidir. Adres gizlenirse çalışma rahat bölgede kalır. Kitapta bahsedilen, her hatanın aynı değerde olduğudur değil.\n\nİşlenen hata, bir sonraki dilimin hedefi olur.",
        ["Gizlenmesi gerektiği", "Bir sonraki çalışmanın adresi olduğu", "Çalışmayı bitirdiği", "Yeteneğin olmadığını kanıtladığı"],
        1,
        "Hata, sonraki çalışmanın adresidir.",
      ],
      [
        "Kitap küçük hedefi neden büyüğe tercih eder?",
        "Zirve, bütün ustalığı bir günde istemeyi dağınık bulur. Küçük bir parça düzelince o parça artık zayıf değildir. Sıra sonrakine gelir. Kitapta bahsedilen, büyük hedefin yasak olduğudur değil.\n\nBüyük hedef, küçük parçalara bölünmeden çalışılmaz.",
        ["Büyük hedef yasak olduğu için", "Düzelen parça sırayı sonrakine bıraktığı için", "Küçük hedefin görünmediği için", "Hata çıkmasın diye"],
        1,
        "Düzelen küçük parça, sırayı sonrakine bırakır.",
      ],
    ]),
    lesson("Geri bildirim", 4, "zirve,geri-bildirim", [
      [
        "Kitap yalnız çalışmayı neden eksik bulur?",
        "Zirve, kişinin kendi hatasını her zaman göremediğini anlatır. Geri bildirim, o kör noktayı dışarıdan gösterir. Kitapta bahsedilen, öğretmenin sihirli olduğu değildir.\n\nGören bir göz yoksa tekrar, aynı hatayı pekiştirir.",
        ["Hatayı kendiliğinden sildiği için", "Kör noktayı gösterdiği için", "Süreyi kısalttığı için", "Rahat bölgeyi övdüğü için"],
        1,
        "Geri bildirim, kişinin görmediği hatayı gösterir.",
      ],
      [
        "Kitaba göre geç gelen düzeltme ne yapar?",
        "Kitap, hatanın üstünden günler geçince düzeltmenin zayıfladığını söyler. Çalışma biterken görülen hata, bir sonraki harekete hemen bağlanır. Geç gelen söz, o bağı kaçırır.\n\nHemen düzeltmek, bilinçli pratiğin parçasıdır.",
        ["Bağı güçlendirdiği", "Hatanın bir sonraki harekete bağlanmasını kaçırdığı", "Öğrenmeyi hızlandırdığı", "Zayıf noktayı sildiği"],
        1,
        "Geç düzeltme, hatayla sonraki hareketin bağını kaçırır.",
      ],
      [
        "Kitap geri bildirimi övgüden nasıl ayırır?",
        "Zirve, alkışı bir duygu, düzeltmeyi bir adres sayar. Alkış çalışmayı tatlılaştırabilir. Adres vermezse bir sonraki dilim yine rastgele seçilir. Kitapta bahsedilen, övgünün yasak olduğudur değil.\n\nİşine yarayan söz, neyin yanlış olduğunu söyleyen sözdür.",
        ["Yalnızca alkış", "Neyin yanlış olduğunu söyleyen söz", "Seyircinin sayısı", "Süreyi öven cümle"],
        1,
        "İşine yarayan geri bildirim, yanlışın adresini verir.",
      ],
    ]),
    lesson("Konforun dışı", 5, "zirve,konfor", [
      [
        "Kitap gelişmenin nerede durduğunu söyler?",
        "Zirve, gelişmenin konforun bittiği yerde başladığını anlatır. Orada hareket bozulur, tempo düşer, hata artar. Kitapta bahsedilen, acının amaç olduğu değildir.\n\nZorlama, yapılamayan parçayı yapılabilir kılmak içindir.",
        ["Rahat tempoda", "Yapılamayan parçanın zorlandığı yerde", "Alkışın en yüksek olduğu anda", "Hiç hata çıkmayan turda"],
        1,
        "Gelişme, yapılamayan parçanın zorlandığı yerde başlar.",
      ],
      [
        "Kitaba göre sürekli rahat çalışmak ne üretir?",
        "Kitap, rahat bölgede geçen yılların insanı işinde tuttuğunu, zirveye taşımadığını söyler. O yıllar deneyim diye adlandırılır. Deneyim, aynı hatanın uzun hafızası da olabilir.\n\nUzun deneyim, bilinçli pratik değilse aynı yerde birikir.",
        ["Kendiliğinden zirve", "Aynı yerde biriken bir deneyim", "Her yıl yeni bir ustalık", "Hatasız bir yükselme"],
        1,
        "Rahat yıllar, aynı yerde biriken deneyim olabilir.",
      ],
      [
        "Kitabın son ayrımı nedir?",
        "Zirve, yeteneği inkâr etmez. Yetenek, başlangıçta bir kolaylık verebilir. Kolaylık, zayıf noktaya çalışmanın yerini tutmaz. Kitapta bahsedilen, herkesin aynı tavana vardığıdır değil.\n\nTavan, saatin sihriyle değil, düzeltilen zorlamayla yükselir.",
        ["Kolaylığın çalışmanın yerini tuttuğu", "Düzeltilen zorlamanın tavanı yükselttiği", "Yeteneğin yasak olduğu", "Rahat bölgenin yeter olduğu"],
        1,
        "Tavan, düzeltilen zorlamayla yükselir.",
      ],
    ]),
  ],
);

const peygamberler = unit(
  "Peygamberler",
  "Kur’an’da anlatılan peygamber kıssaları. Anlatım bizim cümlemizdir. Her ders üç okuma ve bu okumadan cevaplanan bir sorudan oluşur.",
  4,
  [
    lesson("Nuh", 1, "peygamberler,nuh", [
      [
        "Kıssada Nuh kavmine neyi teklif eder?",
        "Kıssada Nuh, kavmini Allah’tan başkasına kulluktan vazgeçmeye çağırır. Çağrı uzar. Kavmin çoğu alay eder, az bir topluluk uyar. Kıssada bahsedilen, davetin bir günde bittiği değildir.\n\nNuh, sonucun gecikmesine rağmen tebliği bırakmaz.",
        ["Bir saltanat", "Allah’tan başkasına kulluğu bırakmak", "Bir ticaret yolu", "Susmak"],
        1,
        "Nuh, tevhide çağırır ve çağrıyı bırakmaz.",
      ],
      [
        "Gemi kıssada neyin işaretidir?",
        "Kıssada gemi, alay edilen sözün gerçekleşeceği haberdir. Nuh onu karada kurar. İnanmayanlar buna güler. Kıssada bahsedilen, geminin bir ustalık gösterisi olduğudur değil.\n\nGemi, azınlığın tutunduğu kurtuluştur.",
        ["Bir yarış", "Azınlığın tutunduğu kurtuluş", "Kavmin ortak bayramı", "Bir pazar"],
        1,
        "Gemi, inanan azınlığın kurtuluşudur.",
      ],
      [
        "Tufandan sonra kıssa neyi bırakır?",
        "Kıssada sular çekilince yeryüzü yeni bir başlangıca açılır. Nuh’un çağrısı boşa gitmemiştir. Uymayanlar ise çokluklarıyla korunmamıştır. Kıssada bahsedilen, kalabalığın her zaman haklı olduğudur değil.\n\nAz da olsa tutunanlar gemidedir.",
        ["Kalabalığın haklı çıktığı", "Çokluğun, uymayanı korumadığı", "Geminin boş kaldığı", "Çağrının geri alındığı"],
        1,
        "Çokluk, uymayanı korumamıştır.",
      ],
    ]),
    lesson("İbrahim", 2, "peygamberler,ibrahim", [
      [
        "İbrahim putları neden sorgular?",
        "Kıssada İbrahim, kavminin taptığı putların işitemediğini ve bir zararı gideremediğini görür. Babasına ve kavmine bunu söyler. Kıssada bahsedilen, bir gelenek olduğu için o kulluğun doğru sayılmasıdır değil.\n\nSorgusu, atadan kalma diye susmamasıdır.",
        ["Geleneği övmek için", "Putların bir işe yaramadığını gördüğü için", "Bir yarış için", "Susmak için"],
        1,
        "İbrahim, putların faydasız olduğunu söyler.",
      ],
      [
        "Ateş kıssada neye döner?",
        "Kıssada İbrahim, çağrısı yüzünden ateşe atılır. Ateş onu yakmaz. Kıssada bahsedilen, bunun bir sihir gösterisi olduğudur değil. Allah’ın, kendisine dayanan kulu korumasıdır.\n\nTehlike büyüktür. Koruma da o tehlikenin içindedir.",
        ["Bir bayram ateşi", "Allah’ın koruduğu bir imtihan", "İbrahim’in kendi söndürdüğü bir köz", "Kavmin pişmanlık şenliği"],
        1,
        "Ateş, Allah’ın korumasıyla imtihan olur.",
      ],
      [
        "Kıssa İbrahim’i neden hanif diye anar?",
        "Anlatıda İbrahim, şirkten yüz çevirip Allah’ı birler. Bu yön, bir kavmin çoğunluğuna değil, tevhide bakar. Kıssada bahsedilen, onun yolunun putlarla uzlaştığı değildir.\n\nSonraki peygamberler de bu tevhid çizgisine bağlanır.",
        ["Putlarla uzlaştığı için", "Şirkten yüz çevirip Allah’ı birlediği için", "Saltanat kurduğu için", "Susmayı seçtiği için"],
        1,
        "Haniflik, şirkten yüz çevirip Allah’ı birlemektir.",
      ],
    ]),
    lesson("Yusuf", 3, "peygamberler,yusuf", [
      [
        "Yusuf’un kıssası nerede daralır?",
        "Kıssada Yusuf, kardeşlerinin kıskançlığıyla kuyuya atılır, sonra götürülüp satılır. Gençliği bir iftira ile zindana düşer. Kıssada bahsedilen, sıkıntının bir ceza olarak anlatılmasıdır değil.\n\nDarlık, sabrın ve emanetin içinden geçer.",
        ["Bir ziyafette", "Kuyu, kölelik ve zindanda", "Tahtın üstünde hemen", "Yolculuk eğlencesinde"],
        1,
        "Kıssa kuyu, kölelik ve zindanda daralır.",
      ],
      [
        "Zindandan çıkış neye bağlanır?",
        "Kıssada Yusuf, rüyayı doğru okur ve bu bilgi onu zindandan çıkarıp bir sorumluluğa taşır. Kıssada bahsedilen, yorumun bir övünç olduğu değildir. Kıtlık gelecektir ve hazırlık gerekir.\n\nİlim, burada bir makam için değil, halkı korumak için kullanılır.",
        ["Bir intikam için", "Gelecek kıtlığa hazırlık için", "Kardeşleri unutmak için", "Rüyayı gizlemek için"],
        1,
        "Bilgi, kıtlığa hazırlık ve koruma içindir.",
      ],
      [
        "Kardeşlerle kavuşma kıssada nasıl biter?",
        "Kıssada Yusuf, kendisine kötülük eden kardeşlerine kapıyı kapatmaz. Kavuşma, bir öç sahnesi değildir. Kıssada bahsedilen, yapılanın unutulduğu da değildir. Bağış, olanı bilerek kurulur.\n\nKıssa, darlıktan sonra iffeti ve bağışı bırakır.",
        ["Bir öç sahnesiyle", "Bilerek kurulan bir bağışla", "Kardeşlerin kovulmasıyla", "Kuyunun unutulmasıyla"],
        1,
        "Kavuşma, bilerek kurulan bir bağışla biter.",
      ],
    ]),
    lesson("Musa", 4, "peygamberler,musa", [
      [
        "Musa kimi karşısına alır?",
        "Kıssada Musa, İsrailoğullarını Firavun’un zulmünden çıkarmakla görevlendirilir. Firavun, gücü ve saltanatıyla o çağrıyı küçümser. Kıssada bahsedilen, davetin güçlü olana benzeyerek yapıldığı değildir.\n\nAsa ve kardeşinin desteği, saltanatın karşısında bir kulun dayanağıdır.",
        ["Bir tüccarı", "Firavun’un zulmünü", "Kendi kavminin putlarını yalnızca", "Bir yolcuyu"],
        1,
        "Musa, Firavun’un zulmünün karşısına çıkar.",
      ],
      [
        "Denizin yarılması kıssada neyi gösterir?",
        "Kıssada kavim denizle Firavun’un ordusu arasında kalır. Musa, Rabbi’nin göstereceği yola güvenir. Deniz açılır, kavim geçer, zulüm ardında kalır. Kıssada bahsedilen, kaçışın bir savaş hilesi olduğudur değil.\n\nÇıkış, Allah’ın kudretiyle olur.",
        ["Bir savaş hilesi", "Allah’ın, kıstırılan kavme yol açması", "Firavun’un bağışı", "Musa’nın saltanatı"],
        1,
        "Deniz, kıstırılan kavme açılan yoldur.",
      ],
      [
        "Tur dağında Musa neyle döner?",
        "Kıssada Musa, kavmine bir ölçü ve bir sözle döner. Kurtuluş, dağınık bir sevinçte kalmaz. Kıssada bahsedilen, özgürlüğün kuralsız bir boşluk olduğudur değil.\n\nÇıkan kavmin önünde artık bir ahit vardır.",
        ["Kuralsız bir boşlukla", "Bir ölçü ve bir ahit ile", "Firavun’un tacıyla", "Yalnızca bir zafer türküsüyle"],
        1,
        "Musa, kurtuluşun yanına bir ölçü bırakır.",
      ],
    ]),
    lesson("Risalet", 5, "peygamberler,risalet", [
      [
        "Bu kıssaların ortak çağrısı nedir?",
        "Nuh, İbrahim, Yusuf ve Musa ayrı zamanlarda gelir. Çağrı aynı çizgidedir: Allah birdir, zulüm ve şirk karşısında kul susmaz, sabır sonucun gecikmesine dayanır. Kıssada bahsedilen, her peygamberin aynı saltanatı kurduğudur değil.\n\nRisalet, tevhidi her kavme yeniden söylemektir.",
        ["Aynı saltanat", "Allah’ın birliği ve zulme karşı duruş", "Her kavmin putunu korumak", "Yalnızca bir kavme özel bir yol"],
        1,
        "Ortak çağrı, tevhid ve zulme karşı duruştur.",
      ],
      [
        "Kıssalar kalabalığı neden ölçü yapmaz?",
        "Nuh’un kavminin çoğu uymaz. İbrahim kavminin içinde azdır. Yusuf zindanda yalnızdır. Musa’nın karşısında bir saltanat vardır. Kıssada bahsedilen, azınlığın her zaman yanıldığıdır değil.\n\nHak, o anki çoğunluğun alkışıyla ölçülmez.",
        ["Çoğunluğun alkışıyla", "Çoğunluktan bağımsız bir çağrıyla", "Saltanatın büyüklüğüyle", "Zindanın uzunluğuyla"],
        1,
        "Hak, o anki çoğunlukla ölçülmez.",
      ],
      [
        "Kıssaların sonunda kul neyi görür?",
        "Her kıssada darlık vardır: tufan, ateş, kuyu, deniz. Darlık son söz değildir. Allah, sabreden kulu bırakmaz ve daveti bir kişinin ömrüne hapsetmez. Kıssada bahsedilen, sıkıntının anlamsız olduğudur değil.\n\nRisalet, sıkıntının içinden geçen ve tevhidle biten bir yoldur.",
        ["Sıkıntının son söz olduğu", "Darlığın içinden tevhidin geçtiği", "Peygamberin hiç denenmediği", "Kavmin hiç uyarmadığı"],
        1,
        "Darlık vardır. Son söz, tevhidin ayakta kalmasıdır.",
      ],
    ]),
  ],
);

const milgram = unit(
  "Milgram deneyi",
  "Stanley Milgram’ın Otoriteye İtaat çalışmasında sorduğu soru. Her ders üç okuma ve bu okumadan cevaplanan bir sorudan oluşur.",
  1,
  [
    lesson("Eichmann’ın sorusu", 1, "milgram,soru", [
      [
        "Milgram deneyi hangi sorudan doğar?",
        "Milgram, savaş suçlusu Eichmann’ın ‘emir aldım’ demesini ciddiye alır. Sıradan bir insan, otorite isteyince başkasına zarar verecek bir noktaya gider mi? Kitapta bahsedilen, bunun yalnızca canilerin sorusu olduğudur değil.\n\nDeney, kötülüğü bir karakter damgası sanmadan önce durumu ölçmek ister.",
        ["Bir zekâ yarışından", "Emir alan sıradan insanın nereye kadar gideceğinden", "Bir hafıza şampiyonasından", "Bir arkadaşlık testinden"],
        1,
        "Soru, emir altındaki sıradan insanın sınırıdır.",
      ],
      [
        "Deney neden ‘caniler yapar’ cevabıyla yetinmez?",
        "Milgram, zulmü yalnızca hasta ruhlara bağlamanın kolay bir kapanış olduğunu düşünür. O kapanış, emri veren düzeni ve uyan insanı görünmez kılar. Çalışmada bahsedilen, herkesin aynı şeyi yapacağının peşin hükmü değildir.\n\nSoru açıktır: kaç kişi durur, kaç kişi devam eder?",
        ["Her kesin aynı olduğu peşin bilindiği için", "Düzeni ve uyan insanı görünmez kıldığı için", "Caninin olmadığı için", "Emrin önemsiz olduğu için"],
        1,
        "Karakter damgası, emri ve uyan insanı gizler.",
      ],
      [
        "Çalışmanın ölçtüğü şey nedir?",
        "Milgram itaatı bir erdem cümlesiyle değil, bir sınırla ölçer. Kişi, karşısındakinin acı çektiğini duyduğu halde otoritenin ‘devam edin’ sözüne uyar mı? Çalışmada bahsedilen, itaatin her zaman kötü olduğudur değil.\n\nÖlçülen, itaatin zarar görene rağmen sürüp sürmediğidir.",
        ["Kişinin nezaketi", "Zarar görene rağmen emre uyulup uyulmadığı", "Hafızanın gücü", "Laboratuvarın büyüklüğü"],
        1,
        "Ölçülen, acıya rağmen emre devam edip etmemektir.",
      ],
    ]),
    lesson("Laboratuvar", 2, "milgram,laboratuvar", [
      [
        "Katılımcı kendisini hangi rolde sanır?",
        "Çalışmada gelen kişi, öğrenme üzerine bir araştırmaya katıldığını sanır. Ona öğretmen rolü verilir. Yanlış cevapta karşıdaki kişiye, giderek yükselen bir ceza uygulanacaktır. Cezayı alan kişi aslında oyuncudur ve ceza gerçek değildir. Bunu öğretmen bilmez.\n\nDüzen, bilimsel bir oda ve beyaz önlükle ciddi görünür.",
        ["Bir tiyatro yönetmeni", "Öğrenme araştırmasında öğretmen", "Bir doktor", "Bir yargıç"],
        1,
        "Katılımcı, kendini bir öğrenme çalışmasının öğretmeni sanır.",
      ],
      [
        "Karşıdaki kişinin sesi neyi bozar?",
        "Öğretmen, cezayı arttırdıkça karşıdan itiraz, sonra çığlık, sonra sessizlik duyar. Çalışmada bahsedilen, odanın sessiz kaldığıdır değil. Ses, ‘bu yalnızca bir deney’ cümlesini zorlar.\n\nYine de birçok kişi, otorite devam edin deyince ele bakmadan ilerler.",
        ["Deneyin bittiğini", "Cezanın birisine dokunduğunu hissettiren itirazı", "Öğretmenin kazanmasını", "Önlüğün düştüğünü"],
        1,
        "İtiraz ve çığlık, cezanın bir kişiye dokunduğunu hissettirir.",
      ],
      [
        "Beyaz önlük bu düzende ne iş görür?",
        "Milgram, otoriteyi bağıran bir komutan diye kurmaz. Sakin bir araştırmacı, bilimsel bir dille devam edin der. Çalışmada bahsedilen, önlüğün sihirli olduğu değildir. Kurumun ciddiyeti, sorumluluğu kişinin omzundan alır gibi durur.\n\nİtaat, korkunç bir üniformalıdan çok, meşru görünen bir görevden de doğar.",
        ["Katılımcıyı güldürdüğü", "Görevi meşru ve kurumsal gösterdiği", "Cezayı durdurduğu", "Öğretmeni evine gönderdiği"],
        1,
        "Önlük, görevi meşru bir kurum işi gibi gösterir.",
      ],
    ]),
    lesson("Son kol", 3, "milgram,son-kol", [
      [
        "Temel düzende çoğu kişi nereye kadar gider?",
        "Milgram’ın anlattığı temel düzende katılımcıların büyük bölümü, karşıdaki susup cevap vermez olduktan sonra da en yüksek kolu çevirir. Çalışmada bahsedilen, herkesin bunu gülerek yaptığı değildir. Birçoğu terler, itiraz eder, yine de devam eder.\n\nSonuç, ‘birkaç sapkın’ diye kapanmaz.",
        ["İlk itirazda durur", "En yüksek kola kadar devam eder", "Deneyi baştan reddeder", "Rolü oyuncuya bırakır"],
        1,
        "Büyük bölüm, en yüksek kola kadar gider.",
      ],
      [
        "İtiraz edip yine devam etmek neyi gösterir?",
        "Çalışmada birçok öğretmen ‘bırakayım’ der, araştırmacı sakin sakin devam etmesini ister, öğretmen döner. Çalışmada bahsedilen, içlerinden razı olduklarıdır değil.\n\nRahatsızlık, itaati kendiliğinden kesmez. Kesiş, ancak davranışı durdurunca olur.",
        ["İçlerinin rahat olduğu", "Rahatsızlığın davranışı kendiliğinden durdurmadığı", "Emrin işitilmediği", "Oyuncunun güldüğü"],
        1,
        "Rahatsız olmak, devam etmeyi kendiliğinden kesmez.",
      ],
      [
        "Sonuç neden karakter listesine yazılmaz?",
        "Milgram, gelenlerin cani olmak üzere seçilmediğini vurgular. Sıradan insanlar, meşru görünen bir emir altında son kola varır. Çalışmada bahsedilen, insanın hiç duramayacağıdır değil. Bir azınlık durur.\n\nAsıl sarsıntı, çoğunluğun durmamasıdır.",
        ["Katılımcılar cani diye seçildiği için", "Sıradan insanların da son kola vardığı için", "Kimse devam etmediği için", "Deney bir anket olduğu için"],
        1,
        "Sıradan insanlar da son kola varır. Bu yüzden sonuç bir cani listesi değildir.",
      ],
    ]),
    lesson("Sorumluluk", 4, "milgram,sorumluluk", [
      [
        "Devam eden kişi sorumluluğu nereye bırakır?",
        "Milgram, devam edenlerin çoğunun ‘bana söylendi, sonuç araştırmacının’ diye düşündüğünü anlatır. Emir, kararı kişinin elinden almış gibi olur. Çalışmada bahsedilen, bu devrin kişiyi gerçekten akladığı değildir.\n\nKişi düğmeye basmıştır. Anlamı ise otoriteye devretmiştir.",
        ["Tamamen kendine", "Emri verene", "Karşıdaki oyuncuya", "Sokağa"],
        1,
        "Devam eden, sonucu emri verene bırakır.",
      ],
      [
        "Araştırmacı neden bağırmadan etkili olur?",
        "Çalışmada devam emri dört kısa cümleyle, sakin bir sesle verilir. Bağırış yoktur. Yine de cümleler sırayla kişinin itirazını kapatır. Çalışmada bahsedilen, nazik emrin zayıf olduğudur değil.\n\nKurumun dili, şiddetten daha kolay itaat üretebilir.",
        ["Kimse duymadığı için", "Sakin ve kurumsal dil itirazı kapattığı için", "Öğretmen emri yazdığı için", "Oyuncu güldüğü için"],
        1,
        "Sakin kurum dili, itirazı kapatır.",
      ],
      [
        "Eichmann cümlesi deneyde nerede yeniden duyulur?",
        "Milgram, ‘ben yalnızca isteneni yaptım’ sözünün laboratuvarda da kurulduğunu göstermek ister. Kişi kötü bir kimlik satın almaz. Görevi parçalara böler ve her parçayı otoriteye havale eder. Çalışmada bahsedilen, tarihin bire bir kopyası olduğudur değil.\n\nAynı cümle, daha küçük bir odada da kurulabilir.",
        ["Kimse söylemediği", "Görevin parçalanıp otoriteye havale edildiği", "Oyuncunun itiraf ettiği", "Önlüğün yırtıldığı"],
        1,
        "Kişi görevi parçalar ve her parçayı otoriteye bırakır.",
      ],
    ]),
    lesson("Duran azınlık", 5, "milgram,azinlik", [
      [
        "Deneyi bırakanlar ne yapar?",
        "Milgram, bir azınlığın araştırmacının tekrarlayan emrine rağmen durduğunu yazar. Onlar da tereddüt eder. Fark, tereddüdün davranışa dönmesidir. Çalışmada bahsedilen, duranların korkusuz doğduğu değildir.\n\nDurmak, rahatsızlığı son kola kadar taşımayı reddetmektir.",
        ["Baştan hiç oturmadıkları", "Emir tekrarlansa da cezayı kestikleri", "Oyuncuyla anlaştıkları", "Önlüğü giydikleri"],
        1,
        "Duranlar, emir tekrarlansa da devam etmez.",
      ],
      [
        "Durmak bu odada neden zordur?",
        "Milgram, kişinin içinden ‘bu yanlış’ demesinin her zaman ele durdurmadığını gösterir. Yanında duran başka bir itiraz da yoktur. Tek otorite devam edin der. Çalışmada bahsedilen, insanın hiç seçimi olmadığı değildir.\n\nSeçim vardır. Odada o seçimi hatırlatan ikinci bir ses yoktur.",
        ["Herkes birden bağırdığı için", "Devam emrinden başka bir ses olmadığı için", "Oyuncu güldüğü için", "Öğretmen emri kendi yazdığı için"],
        1,
        "Odada devam emrinden başka bir ses yoktur. Durmak bu yüzden zordur.",
      ],
      [
        "Milgram’ın bıraktığı uyarı nedir?",
        "Çalışma, itaati yasaklamaz. Uyardığı şey, meşru görünen bir emrin, zarar büyürken de sürdürülmesidir. Sıradan insan bundan muaf değildir. Çalışmada bahsedilen, her emrin suç olduğudur değil.\n\nSoru, emir ile vicdan çatışınca hangisinin ele hükmettiğidir.",
        ["Her emrin suç olduğu", "Zarar büyürken emrin ele hükmedip etmediği", "Kimsenin duramayacağı", "Laboratuvarın kapanması gerektiği"],
        1,
        "Uyarı, zarar büyürken emrin ele hükmetmesidir.",
      ],
    ]),
  ],
);

const asch = unit(
  "Asch’ın çizgi deneyi",
  "Solomon Asch’ın uyma deneyinde grubun yanlışta birleşmesi. Her ders üç okuma ve bu okumadan cevaplanan bir sorudan oluşur.",
  2,
  [
    lesson("Grubun yanlış çizgisi", 1, "asch,cizgi", [
      [
        "Asch kişiden neyi karşılaştırmasını ister?",
        "Asch, masaya basit çizgiler koyar. Bir çizgi, üç çizgiden hangisine eşittir? Göz bunu kolayca ayırır. Gruptaki diğer kişiler önceden anlaşılmıştır ve ara sıra hep birlikte yanlış çizgiyi söyler.\n\nAsıl denek, cevabı en son verir. Gördüğü ile duyduğu burada ayrılır.",
        ["Bir matematik sorusunu", "Hangi çizginin eşit olduğunu", "Bir tarih bilgisini", "Bir yüzü"],
        1,
        "Soru, hangi çizginin eşit olduğudur. Göz bunu kolayca ayırır.",
      ],
      [
        "Grup neden yanlışta birleşir?",
        "Çalışmada birleşenler denek değildir. Deneyci onlardan yanlış söylemelerini istemiştir. Denek bunu bilmez. Duyduğu, odadaki herkesin aynı yanlışta rahat olduğudur.\n\nBaskı, bir bağırışla değil, oybirliğiyle kurulur.",
        ["Hepsi gerçekten yanıldığı için", "Anlaşmalı kişiler aynı yanlışı söylediği için", "Çizgiler silindiği için", "Işık kapandığı için"],
        1,
        "Yanlış, anlaşmalı grubun oybirliğinden gelir.",
      ],
      [
        "Sorunun kolay olması neyi keskinleştirir?",
        "Asch, zor bir bilgi sormaz. Çizgi açıktır. İnsan yine de grubun yanlışına uyabiliyorsa baskı, bilgisizlikten gelmiyordur. Çalışmada bahsedilen, gözün bozulduğudur her zaman değil.\n\nKimi gördüğünü söyler, kimi grubu söyler.",
        ["Baskının bilgisizlikten geldiğini", "Baskının, doğru apaçıkken de işlediğini", "Çizginin görünmediğini", "Kimsenin uymadığını"],
        1,
        "Doğru apaçıkken de grup baskısı işler.",
      ],
    ]),
    lesson("Kendi gözü", 2, "asch,goz", [
      [
        "Denekler grubun yanlışını ne sıklıkla tekrarlar?",
        "Asch’ın anlattığı düzende deneklerin önemli bir kısmı, en az bir kez grubun yanlış çizgisini söyler. Yalnız kaldıklarında aynı çizgiyi neredeyse hiç kaçırmazlar. Çalışmada bahsedilen, gözlerinin zayıf olduğudur değil.\n\nHata, çizgide değil, sıra kendilerine gelince ortaya çıkar.",
        ["Yalnızken de aynı oranda", "Grup yanlış deyince, yalnızken kaçırmadıkları çizgide", "Hiçbir zaman", "Yalnızca karanlıkta"],
        1,
        "Yanlış, grup konuşunca belirir. Yalnızken aynı kişi doğruyu görür.",
      ],
      [
        "Uyan kişi çizgiyi görmez mi?",
        "Çalışmada uyduğu halde sonra ‘gözüm öyle görmedi, gruba uydum’ diyenler vardır. Bir kısmı ise bir süre sonra grubun doğru olduğuna inanır. Çalışmada bahsedilen, her uyanın aynı gerekçeyi kurduğudur değil.\n\nKimi bildiğini saklar. Kimi gördüğünü grubun sözüne çevirir.",
        ["Hiçbiri çizgiyi görmez", "Kimi saklar, kimi gördüğünü grubun sözüne çevirir", "Hepsi kör olur", "Hepsi baştan reddeder"],
        1,
        "Kimi doğruyu saklar, kimi gördüğünü grubun cevabına çevirir.",
      ],
      [
        "Asch bu uyarıyı neye karşı koyar?",
        "Çalışma, insanın grup içinde kendi duyusuna güvenmesinin sandığımız kadar otomatik olmadığını gösterir. Oybirliği, apaçık bir çizgiyi bile eğebilir. Çalışmada bahsedilen, yalnızlığın her zaman doğru olduğu değildir.\n\nUyarı, kalabalığın rahat yanlışının bir kanıt sayılmasıdır.",
        ["Yalnızlığın kutsallığına", "Oybirliğini kanıt sanmaya", "Çizgi çizmeye", "Laboratuvarı kapatmaya"],
        1,
        "Oybirliği, apaçık bir yanlışı kanıt gibi gösterebilir.",
      ],
    ]),
    lesson("Tek yandaş", 3, "asch,yandas", [
      [
        "Grupta bir kişi daha doğruyu söylerse ne olur?",
        "Asch, anlaşmalı gruba bir kişi daha koyar ve ondan doğru çizgiyi söylemesini ister. Denek artık tamamen yalnız değildir. Uyma belirgin biçimde düşer. Çalışmada bahsedilen, kalabalığın dağıldığıdır değil.\n\nTek bir yandaş, oybirliğini kırar.",
        ["Uyma artar", "Uyma belirgin biçimde düşer", "Denek odayı terk eder", "Çizgiler değişir"],
        1,
        "Tek bir doğru ses, uymayı düşürür.",
      ],
      [
        "Yandaşın uzman olması gerekir mi?",
        "Çalışmada o kişi sıradan bir katılımcı gibi durur. Ünvanı yoktur. Yine de denek, ‘bir kişi daha benim gördüğümü görüyor’ diyebilir. Çalışmada bahsedilen, otoritenin şart olduğudur değil.\n\nKırılan şey oybirliğidir, rütbe değil.",
        ["Profesör olması gerekir", "Sıradan bir ikinci ses de oybirliğini kırar", "Bağırması gerekir", "Çizgiyi yeniden çizmesi gerekir"],
        1,
        "Ünvansız bir ikinci doğru ses de yeter.",
      ],
      [
        "Bu sonuç Milgram’ın odasıyla nerede birleşir?",
        "Milgram’ın odasında devam emrinden başka ses yoktur. Asch’ın masasında ise bir yandaş, yanlış oybirliğini deler. İki çalışma da şunu bırakır: insanın durması, yanında bir doğru ses olunca kolaylaşır.\n\nYalnız kalan göz ve yalnız kalan vicdan, kalabalığa daha çabuk teslim olur.",
        ["İkisinin de ilgisiz olduğu", "İkinci bir doğru sesin durmayı kolaylaştırdığı", "Yandaşın itaati artırdığı", "Çizginin emir olduğu"],
        1,
        "Yanında bir doğru ses olunca durmak kolaylaşır.",
      ],
    ]),
    lesson("Neden uyar", 4, "asch,neden", [
      [
        "Asch uymanın iki yolunu nasıl ayırır?",
        "Kimi denek, grubun gördüğünü kendinin de gördüğüne inanır. Kimi, gördüğünü bilir ve yine de grubun sözünü söyler, dışarıda kalmamak için. Çalışmada bahsedilen, ikisinin aynı olduğu değildir.\n\nBiri algının eğilmesi, öbürü ait olma kaygısıdır.",
        ["İkisi de yalnızca korkudur", "Biri gördüğünü çevirir, öbürü bildiğini saklar", "İkisi de körlüktür", "İkisi de isyandır"],
        1,
        "Biri gördüğünü grubun sözüne çevirir, öbürü bildiğini saklar.",
      ],
      [
        "Ait olmak neden çizgiyi eğer?",
        "Çalışmada denek, birkaç yabancının yanındadır. Yine de farklı cevabı söylemek yüzünü ısıtır. Asch, bu ısının büyük bir ceza olmadığını yazar. Küçük bir ayrılık bile yeter. Çalışmada bahsedilen, grubun tehdit savurduğudur değil.\n\nFark edilmek, bazıları için yanlış çizgiyi söylemekten ağırdır.",
        ["Grup tehdit savurduğu için", "Küçük bir ayrılık bile ağır geldiği için", "Çizgi silindiği için", "Işık zayıf olduğu için"],
        1,
        "Tehdit yoktur. Farklı görünmek yeterince ağırdır.",
      ],
      [
        "Deneyin bıraktığı ölçü nedir?",
        "Asch, insanın grupta yanlış bir çizgiyi söyleyebildiğini gösterir. Ölçü, kalabalığın rahatlığı değil, kişinin kendi gördüğüdür. Yanında bir yandaş varsa o ölçüye dönmek kolaylaşır.\n\nÇizgi basittir. Basit olduğu için sonuç ağırdır.",
        ["Kalabalığın rahatlığı", "Kişinin kendi gördüğü", "En yüksek ses", "İlk söylenen cevap"],
        1,
        "Ölçü, kalabalığın rahatlığı değil, kişinin gördüğüdür.",
      ],
    ]),
  ],
);

const festinger = unit(
  "Bilişsel çelişki",
  "Leon Festinger’in, davranış ile inanç çatışınca insanın kendini nasıl haklı çıkardığı üzerine çalışması. Her ders üç okuma ve bu okumadan cevaplanan bir sorudan oluşur.",
  3,
  [
    lesson("Çatışma", 1, "celiski,catisma", [
      [
        "Festinger çelişkiyi nerede görür?",
        "Festinger, insanın iki bilgisinin birbiriyle uyuşmamasına çelişki der. Biri davranışıdır, öbürü inancıdır. Sigarayı zararlı bilip içmek, buna küçük bir örnektir. Çalışmada bahsedilen, her tereddüdün çelişki olduğudur değil.\n\nÇelişki, kişi o uyuşmazlığı taşıyamayınca başlar.",
        ["Her unutmada", "Davranış ile inanç uyuşmayınca", "Yalnızca yalan söyleyince", "Grup susunca"],
        1,
        "Çelişki, davranış ile inancın uyuşmamasıdır.",
      ],
      [
        "Çelişki neden rahatsız eder?",
        "Festinger, insanın kendini tutarlı görmek istediğini anlatır. Uyuşmazlık bu resmi bozar. Bozulan resim, bir sıkıntı olarak durur. Çalışmada bahsedilen, sıkıntının her zaman doğru yolu gösterdiğidir değil.\n\nSıkıntı, bazen davranışı değiştirir, bazen inancı.",
        ["Hiç hissedilmediği için", "Kişi kendini tutarsız gördüğü için", "Yalnızca başkası bağırdığı için", "Ceza kesin olduğu için"],
        1,
        "Kişi, tutarsız görünmeyi taşımakta zorlanır.",
      ],
      [
        "Çalışma hangi yolu daha çok izler?",
        "Festinger, davranışı geri almanın her zaman mümkün olmadığını söyler. İş işten geçince kişi, inancı davranşa uydurur. Çalışmada bahsedilen, bunun bilinçli bir kandırmaca olarak başladığı değildir her seferinde.\n\nİnanç, olanı haklı çıkarmak için eğilir.",
        ["Davranışın her zaman silindiği", "İnancın, olanı haklı çıkarmak için eğildiği", "Çelişkinin yok sayıldığı", "Grubun çizgiyi değiştirdiği"],
        1,
        "Geri alınamayan davranıştan sonra inanç eğilir.",
      ],
    ]),
    lesson("Haklı çıkarmak", 2, "celiski,hakli", [
      [
        "Sıkıcı bir işi az ücretle yapan neden işi över?",
        "Festinger ve Carlsmith’in anlattığı düzende, sıkıcı bir işi bitiren bazı kişilerden, kapıdaki bir sonrakine işin eğlenceli olduğunu söylemeleri istenir. Bunu çok küçük bir karşılıkla yapanlar, sonra işi gerçekten daha ilginç hatırlar.\n\nBüyük karşılık alanların buna ihtiyacı azdır. ‘Para için söyledim’ diyebilirler.",
        ["Büyük para aldıkları için", "Küçük karşılık, yalanı açıklamaya yetmediği için", "İş gerçekten eğlenceli olduğu için", "Kapıdaki kişi ısrar ettiği için"],
        1,
        "Küçük karşılık yalanı açıklamaz. Kişi işi ilginç hatırlayarak açığı kapatır.",
      ],
      [
        "Büyük karşılık neden inancı daha az eğer?",
        "Çalışmada büyük ücret, ‘bunu para için söyledim’ cümlesine yeter. Çelişki kapanır, iş hâlâ sıkıcı kalabilir. Küçük ücret o cümleyi kuramaz. Kişi başka bir kapanış arar.\n\nKapanış, olanı değiştirmek değil, olanı güzel hatırlamaktır.",
        ["İşi sildiği için", "Yalanın gerekçesi hazır olduğu için", "Ücreti gizlediği için", "Deneyi bozduğu için"],
        1,
        "Büyük karşılık, ‘para için söyledim’ gerekçesini verir.",
      ],
      [
        "Bu sonuç kendini kandırmak mıdır?",
        "Festinger, kişinin her zaman bilerek yalan kurduğunu söylemez. Sıkıntı, hatırayı da eğebilir. Sonra kişi, eğilmiş hatıraya inanır. Çalışmada bahsedilen, hafızanın çelik bir kayıt olduğudur değil.\n\nHaklı çıkmış hissetmek, olanın üstünü örtebilir.",
        ["Hafıza hiç eğilmediği için hayır", "Sıkıntı hatırayı da eğebildiği için bu bir örtmedir", "Ücret hatırayı sildiği için hayır", "Kapıdaki kişi hatırayı yazdığı için"],
        1,
        "Sıkıntı, hatırayı eğebilir. Kişi sonra o hatıraya inanır.",
      ],
    ]),
    lesson("Ne zaman büyür", 3, "celiski,buyume", [
      [
        "Çelişki hangi seçimde daha çok büyür?",
        "Festinger, zorla yaptırılan işte çelişkinin küçük kaldığını anlatır. Kişi ‘mecburdum’ diyebilir. Kendi seçtiği, geri dönüşü zor ve sonucu ağır bir işte ise mecburiyet cümlesi kurulamaz.\n\nSeçim kişide kaldıkça, olanı haklı çıkarma ihtiyacı artar.",
        ["Tamamen zorlandığı seçimde", "Kendi seçtiği ve geri dönemediği işte", "Ücretsiz bir ankette", "Başkası karar verince"],
        1,
        "Kendi seçimi ve geri dönememek, çelişkiyi büyütür.",
      ],
      [
        "Emek neden bağlar?",
        "Çalışmada bir işe çok emek veren, o işin boş olduğunu kabul etmekte zorlanır. Emek, ‘boşuna değildi’ cümlesini gerektirir. Çalışmada bahsedilen, emeğin her zaman doğru hedefi seçtiğidir değil.\n\nÇok ödenen bedel, yanlış bir yolu da kutsal gösterebilir.",
        ["Hedefi kendiliğinden düzelttiği için", "Boşuna olduğu kabulünü zorlaştırdığı için", "Çelişkiyi sildiği için", "Seçimi geri aldığı için"],
        1,
        "Çok emek, ‘boşunaydı’ cümlesini zorlaştırır.",
      ],
      [
        "Festinger küçümsemeyi nereye koyar?",
        "Kişi, seçmediği yolu küçümseyince seçtiği yol parlar. İki yol da başta yakınsa bu küçümseme daha çok işe yarar. Çalışmada bahsedilen, seçilmeyenin gerçekten kötü olduğunun ispatı değildir.\n\nParlama, çelişkiyi kapatmak için de üretilmiş olabilir.",
        ["Seçilmeyenin ölçülmüş kötülüğü", "Seçileni parlatmak için üretilen bir küçümseme", "Zorlamanın sonucu", "Ücretin büyüklüğü"],
        1,
        "Seçilmeyen yolu küçümsemek, seçileni parlatır.",
      ],
    ]),
    lesson("Karardan sonra", 4, "celiski,karar", [
      [
        "Karar verildikten sonra ne değişir?",
        "Festinger, seçim yapılınca seçilenin iyi yanlarının, seçilmeyenin kötü yanlarının büyüdüğünü anlatır. Karardan önce tereddüt vardır. Karardan sonra tereddüt, haklı çıkmış bir hikâyeye döner.\n\nÇalışmada bahsedilen, kararın her zaman yanlış olduğudur değil.",
        ["Tereddüt büyür", "Seçilen parlar, seçilmeyen kararır", "İki yol eşit kalır", "Kişi seçimi unutur"],
        1,
        "Karardan sonra seçilen parlar, seçilmeyen kararır.",
      ],
      [
        "Bu parlama neden tehlikelidir?",
        "Kişi, kararını gözden geçireceği anda elinde eğilmiş bir hatıra bulur. Yeni bilgi gelse de ‘ben zaten doğru seçmiştim’ cümlesi kapıyı kapatır. Çalışmada bahsedilen, pişmanlığın imkânsız olduğudur değil.\n\nPişmanlık, ancak eğilmiş hatıra fark edilince içeri girer.",
        ["Yeni bilginin kolay girdiği", "Haklı çıkmış hikâyenin yeni bilgiye kapıyı kapattığı", "Kararın silindiği", "Grubun çizgiyi düzelttiği"],
        1,
        "Haklı çıkmış hikâye, yeni bilgiye kapıyı kapatabilir.",
      ],
      [
        "Festinger’in bıraktığı ölçü nedir?",
        "Çalışma, tutarlılığı bir erdem diye övmez. Uyardığı, davranış ile inanç çatışınca insanın çoğu zaman davranışı değil, inancı eğmesidir. Milgram’ın odasında devam eden de, Asch’ın masasında uyan da sonra o anı kendine haklı kurabilir.\n\nÖlçü, kararın ardından kurulan hikâyeyi bir kez daha okumaktır.",
        ["Tutarlılığın her zaman doğru olduğu", "Karardan sonra kurulan hikâyenin yeniden okunması", "Çelişkinin hiç yaşanmadığı", "Emeğin hedefi düzelttiği"],
        1,
        "Ölçü, karardan sonra kurulan haklılık hikâyesini yeniden okumaktır.",
      ],
    ]),
  ],
);

const files = {
  "data/dil-belasi.json": dilBelasi,
  "data/aliskanligin-gucu.json": guc,
  "data/zirve.json": zirve,
  "data/milgram.json": milgram,
  "data/asch.json": asch,
  "data/bilissel-celiski.json": festinger,
};

for (const [path, data] of Object.entries(files)) {
  for (const lesson of data.lessons) {
    if (lesson.challenges.length !== 3) throw new Error(`${path} ${lesson.title} soru sayısı`);
    for (const challenge of lesson.challenges) {
      const correct = challenge.options.filter((o) => o.correct);
      if (challenge.options.length !== 4 || correct.length !== 1) {
        throw new Error(`${path} ${lesson.title} / ${challenge.question}`);
      }
    }
  }
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
  const n = data.lessons.reduce((s, l) => s + l.challenges.length, 0);
  console.log(path, data.lessons.length, "ders", n, "soru");
}
