/**
 * İslamiyet ünitelerindeki bariz soruları, ayetin/hadisin altındaki ayrımdan
 * sorulan sorularla değiştirir. Aynı ders adları kalır.
 */
import { config } from "dotenv";
import fs from "fs";
import pg from "pg";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const { Client } = pg;

function challenge(question, reading, choices, correctIndex, explanation, difficulty, tags) {
  if (choices.length !== 4 || correctIndex < 0 || correctIndex > 3) {
    throw new Error(question);
  }
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

function lesson(title, tags, triples) {
  const levels = ["EASY", "MEDIUM", "HARD"];
  const challenges = triples.map((item, i) =>
    challenge(item[0], item[1], item[2], item[3], item[4], levels[i], tags),
  );
  if (challenges.length !== 3) throw new Error(title);
  return { title, challenges };
}

const units = [
  {
    unit: "Kur'an",
    description:
      "Namazda okunan kısa sureler. Her ders, ezberlenen cümlenin altında duran bir ayrımı okutur ve soruyu o ayrımdan sorar.",
    file: "data/kuran.json",
    lessons: [
      lesson("Fatiha", "kuran,fatiha", [
        [
          "Fatiha neden bir nimet listesiyle açılmaz?",
          "Diyanet meali, «Hamd, âlemlerin Rabbi Allah'a mahsustur» diye açılır. Hamd, o gün ele geçenleri sayıp teşekkür etmek değildir. Şükür, gelene karşıdır. Hamd, Allah'ın kim olduğuna karşıdır. Sure, kulun isteğinden önce âlemlerin Rabbini anar.\n\nİstek, «bizi doğru yola ilet» ile sonra gelir. Açılış bir dilekçe değildir. Önce övgü kurulur, yol onun ardından istenir.",
          [
            "Hamd, kulun sayabildiği nimetlerin listesidir",
            "Hamd, geleni saymak değil, âlemlerin Rabbi olan Allah'ın kendisi içindir",
            "Sure nimet kelimesini hiç kullanmadığı için dua eksik kalır",
            "İstek ayeti surenin ilk cümlesidir",
          ],
          1,
          "Hamd nimet listesi değildir. Allah'ın kim olduğuna dair övgüdür. İstek sonra gelir.",
        ],
        [
          "Namazı tek başına kılan neden «ederim» değil «ederiz» der?",
          "Meal, «Yalnız sana kulluk eder, yalnız senden yardım dileriz» der. Fiil çoğuldur. O an camide tek kişi de olsa cümle «ederim»e dönmez. Sure, kulluğu bir kişinin özel başarısı olmaktan çıkarır.\n\nÇoğul, gösteriş için konmuş bir süs değildir. Kul yol isterken kendini bir ümmetin ağzında sayar. Yardım da aynı ağızdan istenir.",
          [
            "Fatiha yalnızca cemaatle kılınan namazda okunduğu için",
            "Ayet yalnızca imama söyletildiği için",
            "Sure kulluğu tek kişinin başarısı olmaktan çıkarıp bir ümmetin ağzına verdiği için",
            "Tekil fiil bu surede yasak bir kelime olduğu için",
          ],
          2,
          "Tek kişi de çoğul söyler. Kulluk, bir kişinin özel başarısı olmaktan çıkar.",
        ],
        [
          "Son ayet gazaba uğrayanla sapmışı neden aynı kelimede birleştirmez?",
          "Meal, doğru yolun nimet verilenlerin yolu olduğunu, gazaba uğrayanların ve sapmışların yolunun bundan ayrıldığını söyler. Bu iki grup aynı sapma değildir. Gazaba uğrayan, hakkı görüp yüz çevirendir. Sapmış, yolu kaybedendir. Biri bilip direnir. Öbürü bilmeden dağılır.\n\nİstenen yol da bir sloganın adı değildir. Nimet verilenlerin yürüdüğü izdir. Ve bu yol, din gününün sahibinden istenir. Kariyer cümlesi değil, o güne dayanacak yoldur.",
          [
            "İkisi de aynı günah olduğu için ayet yalnızca tekrar eder",
            "Biri hakkı görüp yüz çevirir, öbürü yolu kaybeder. Sure bu iki sapmayı ayırır",
            "Gazap bir millete, sapma bir kişiye kilitlendiği için",
            "Son ayet yol istemez, yalnızca iki grubu över",
          ],
          1,
          "Biri bilip direnir, öbürü yolu kaybeder. Sure bu iki hali aynı saymaz.",
        ],
      ]),
      lesson("İhlas", "kuran,ihlas", [
        [
          "Sure neden «inan» diye değil «de ki» diye açılır?",
          "Diyanet meali, «De ki: O, Allah'tır, bir tektir» diye açılır. Tevhid burada yalnızca içte saklanan bir duygu olarak bırakılmaz. Söylenecek bir cümledir. Sure, inancı ağza verir.\n\n«De ki» emri, bu cümlenin bir tartışmanın içinde söylendiğini de gösterir. Muhatap, Allah'ın nesebini ve benzerini soran bir sorudur. Cevap, tarif değil, ikrardır.",
          [
            "Sure okunmak için değil, yalnızca ezberlenmek için indiği için",
            "Tevhid içte kalsın diye söylenmesi yasaklandığı için",
            "Tevhid, içte kalan bir duygu değil, söylenecek bir ikrar olduğu için",
            "«De ki» yalnızca peygambere özel olup ümmete geçmediği için",
          ],
          2,
          "Sure tevhidi içte bırakmaz. Söylenecek bir ikrar yapar.",
        ],
        [
          "Samed, «bir» demenin üstüne ne ekler?",
          "Meal Allah'ı bir der ve ardından Samed der. Bir olmak, sayıdaki tekilliktir. Samed, her şeyin kendisine muhtaç olduğu, kendisi hiçbir şeye muhtaç olmayandır. Yanına konacak bir ilah da bir şeye muhtaç olurdu. Samed, o ihtimali düşürür.\n\nBu yüzden sure, «Allah tektir» deyip susmaz. Muhtaç olmayan tekliği ayrıca söyler. Sayı ile muhtaçsızlık aynı cümle değildir.",
          [
            "Samed, Allah'ın bir çocuk sahibi olduğunu söyler",
            "Samed, sayıdaki tekliğin yanına muhtaç olmama halini ekler",
            "Samed, bir kelimesinin eş anlamlısı olduğu için sure onu süs diye koyar",
            "Samed, yalnızca insanların Rabbi olduğu, başka varlıkları kapsamadığı anlamına gelir",
          ],
          1,
          "Bir, sayıdaki tekliktir. Samed, her şeyin O'na muhtaç olup O'nun hiçbir şeye muhtaç olmamasıdır.",
        ],
        [
          "Son ayetler hangi üç bağı kapatır?",
          "Meal, Allah'ın doğurmadığını, doğurulmadığını ve hiçbir şeyin O'na denk olmadığını söyler. Üç ret vardır. Doğurmak, soyu aşağı doğru bağlamaktır. Doğurulmak, soyu yukarı doğru bağlamaktır. Denk olmak, yanına bir türdeş koymaktır.\n\nSure Allah'ı bir aileye, bir başlangıca ve bir benzerine kapatır. Tevhid burada bir slogan değil, bu üç kapının kapanmasıdır.",
          [
            "Yalnızca putların adını sayarak",
            "Soyu aşağı, soyu yukarı ve yanına konacak bir dengi kapatarak",
            "Namazın vakitlerini belirleyerek",
            "Allah'ın bir yerde oturduğunu tarif ederek",
          ],
          1,
          "Doğurmak, doğurulmak ve denk olmak kapanır. Üçü de Allah'ı bir zincire bağlardı.",
        ],
      ]),
      lesson("Felak", "kuran,felak", [
        [
          "Sure şerri neden ayrı bir ilah gibi kurmaz?",
          "Diyanet meali, yaratılan şeylerin şerrinden felakın Rabbine sığınmayla açılır. Felak, yarıp ortaya çıkarmaktır. Sabahın karanlıktan ayrılması bu kelimenin taşıdığı görüntüdür. Sığınılan, şerri yaratan bir ikinci güç değil, karanlığı yaran Rabdir.\n\n«Yarattığı şeylerin şerrinden» demek, şerri yaratılışın dışında bir ilaha vermemektir. Şer, yaratılmışın bir yönüdür. Sığınma da o yönün sahibine değil, yaratana olur.",
          [
            "Şer, Allah'ın yanında duran ikinci bir yaratıcıdır",
            "Şer yaratılmışın bir yönüdür. Sure ona ayrı bir ilah vermez",
            "Felak, şerrin adıdır",
            "Sure yalnızca insanlardan gelen şerri sayar, yaratılmışı dışarıda bırakır",
          ],
          1,
          "Şer, yaratılmışın yönüdür. Sığınma, ayrı bir şer ilahına değil, felakın Rabbine olur.",
        ],
        [
          "Karanlık ayeti şerri neden bir saate bağlar?",
          "Meal, karanlığı çöktüğü zaman onun şerrinden sığınmayı da söyler. Şer her saatte aynı kılıkta görünmez. Gündüzün açık işi ile karanlığın örttüğü iş ayrılır. Sure, kötülüğü soyut bir kelime olarak bırakmaz. Bir vakte yerleştirir.\n\nKaranlık basınca gizlenen, gündüz söylenemeyen ve örtülen şer bu ayetin konusudur. Sığınma, o saati de Allah'a bağlar.",
          [
            "Karanlıkta şer olmadığı için ayet geceyi över",
            "Şer her saatte aynı göründüğü için vakit fark etmez",
            "Örtülen şer, karanlık çökünce başka bir kılığa girdiği için",
            "Sure gündüz namazını kaldırdığı için",
          ],
          2,
          "Şer her saatte aynı görünmez. Karanlık, örtülen işin vaktidir.",
        ],
        [
          "Haset surenin konusu hangi anda olur?",
          "Meal, haset ettiği zaman hasetçinin şerrinden sığınmayı söyler. Kıskançlık bir mizaç olarak dururken sure onu lanetlemez. Haset eden haset ettiği anda, duygu bir şerre döndüğünde sığınma başlar. Aynı sure, düğümlere üfleyenlerin şerrini de sayar. Gizli bir bağlama işidir bu.\n\nSure şerri tek biçime indirgemez. Yaratılmışın şerri, karanlığın şerri, gizli bağın şerri ve harekete geçmiş hasedin şerri ayrı ayrı anılır.",
          [
            "Kıskançlık hissedildiği anda, daha hiç davranışa dökülmeden",
            "Haset eden haset ettiği anda, duygu şerre döndüğünde",
            "Yalnızca hasetçi tövbe ettiğinde",
            "Haset surenin dışında bırakıldığı için hiç",
          ],
          1,
          "Sure mizacı değil, hasedin harekete geçtiği anı konu eder.",
        ],
      ]),
      lesson("Nas", "kuran,nas", [
        [
          "Sure sığınmayı neden tek isimle bırakmaz?",
          "Diyanet meali, insanların Rabbine, insanların hükümdarına ve insanların ilahına sığınmayla açılır. Üç bağ vardır. Rab, var edip büyüten. Melik, hükmeden. İlah, kendisine yönelinen. Vesvese bu bağların her birine sokulur. «Seni büyüten o değil», «söz sahibi o değil», «yalnız ona yönelme.»\n\nTek isim, bu üç sızıntının hepsini kapatmaz. Sure sığınmayı, insanın Allah'la kurduğu üç ilişkiyi birden sayarak kurar.",
          [
            "Üç isim aynı anlama geldiği için sure yalnızca tekrar eder",
            "Vesvese terbiye, hüküm ve kulluk bağlarının her birine sokulduğu için",
            "Rab insanlara, Melik cinlere, İlah meleklere ait olduğu için",
            "Sure isim saymayı bir süs olarak koyduğu için",
          ],
          1,
          "Rab, Melik ve İlah üç ayrı bağdır. Vesvese her birine sokulur.",
        ],
        [
          "Hannâs kelimesi vesvese hakkında neyi gösterir?",
          "Meal, sinsi vesvesecinin şerrinden sığınmayı bildirir. Hannâs, sokulup sonra sinendir. Vesvese ele geçiren bir sahip gibi kurulmaz. Fısıltı gelir, Allah anılınca geri çekilir. Sure, kötülüğü insanın içini tamamen ele geçirmiş bir zorunluluk diye anlatmaz.\n\nBu, vesveseyi hafife almak değildir. Kaynağı göğüslerin içidir. Kulakla duyulan bir ses değildir. Yine de anılınca sinen bir fısıltıdır. Sığınma, o sinmenin adıdır.",
          [
            "Vesvesenin hiç geri çekilmeyen bir sahip olduğunu",
            "Fısıltının Allah anılınca sinip geri çekildiğini",
            "Vesvesenin yalnızca kulaktan giren bir ses olduğunu",
            "Hannâs'ın surenin dışında bir kelime olduğunu",
          ],
          1,
          "Hannâs, sokulup sinendir. Vesvese anılınca geri çekilen bir fısıltıdır.",
        ],
        [
          "Sure vesveseyi neden yalnızca cine bağlamaz?",
          "Meal, vesvesenin cinlerden ve insanlardan geleceğini söyler. Kötülük görünmeyen bir varlığa kilitlenmez. Bir insanın fısıltısı da aynı şerri taşır. Sure, bahaneyi cine devredip insanın payını silmez.\n\nİki kaynak da göğse bırakılan fısıltıda birleşir. Sığınma ikisine birden karşıdır. Cinni anıp insanı temize çıkarmak, ayetin saydığı ikinci kapıyı kapatır.",
          [
            "İnsan vesvese veremediği için ayet onu yalnızca cinle sınırlar",
            "Cin ve insan aynı fısıltıyı taşıyabildiği için",
            "İnsanların vesvesesi sevap sayıldığı için",
            "Sure kaynağı hiç söylemediği için",
          ],
          1,
          "Vesvese cinden de insandan da gelir. Sure bahaneyi cine kilitlemez.",
        ],
      ]),
    ],
  },
  {
    unit: "Hadisler",
    description:
      "Niyet ve amel üzerine hadisler. Her ders, herkesin ezberlediği cümlenin altında duran ayrımı okutur.",
    file: "data/hadisler.json",
    lessons: [
      lesson("Ameller niyetlere göredir", "hadis,niyet", [
        [
          "Hadis kuralı söyledikten sonra hicreti neden örnek verir?",
          "Hadiste amellerin niyetlere göre olduğu belirtilir. Ardından hicret anılır. Allah ve Resulü için çıkan ile dünyalık bir bağ ya da bir evlilik için çıkan aynı yolu yürümüş olabilir. Gideceği yer, adımın değil, niyetin gösterdiği yerdir.\n\nÖrnek, kuralı süslemek için konmaz. Aynı dış hareketin iki amel olabildiğini göstermek için konur. Hicret gibi ağır bir iş bile niyet değişince başka işe döner.",
          [
            "Hicret niyetsiz de aynı sevabı verdiği için",
            "Aynı gidişin, niyet değişince başka amel olduğunu göstermek için",
            "Yalnızca hicretin amel sayıldığını, başka işlerin sayılmadığını söylemek için",
            "Niyetin yalnızca yolculukta arandığını belirtmek için",
          ],
          1,
          "Hicret örneği, aynı dış hareketin iki ayrı amel olabildiğini gösterir.",
        ],
        [
          "Görenlerin övdüğü iş hadiste neden ölçü olmaz?",
          "Hadiste kişinin varacağı yer, niyetinde taşıdığıdır. Dışarıdan bakınca iki hareket aynı durabilir. Biri Allah için, öbürü görülsün diye yapılmışsa amel ikiye ayrılır. Hadiste bahsedilen, gösterişin niyeti bozmayacağı değildir.\n\nÖlçü, alkışın büyüklüğü değil, işin kimin için kurulduğudur. Övülen iş de bu ölçüye girer.",
          [
            "Alkış büyüdükçe niyet kendiliğinden düzeldiği için",
            "Dışarıdan aynı görünen iş, kimin için yapıldığına göre ayrıldığı için",
            "Gösteriş yalnızca farz ibadetlerde arandığı için",
            "Niyet bir kez kurulunca sonradan değişmediği için",
          ],
          1,
          "Aynı görünen iş, kimin için yapıldığına göre iki amel olur.",
        ],
        [
          "Hadis niyeti işin neresine koyar?",
          "Hadiste niyet, iş bittikten sonra yapıştırılan bir etiket değildir. İş, niyetiyle birlikte o iş olur. Dünya için çıkan, hicret etmiş sayılmaz. Allah için çıkan, aynı kapıdan başka bir amele varır.\n\nBu, niyeti sözle süslemek değildir. Niyet, hareketin hangi amele dönüşeceğini baştan belirler.",
          [
            "İş bittikten sonra söylenen bir cümle olarak",
            "Hareketin hangi amele dönüşeceğini baştan belirleyen yön olarak",
            "Yalnızca kalabalık işlerde aranan bir şart olarak",
            "Ameli değiştirmediği için gereksiz bir his olarak",
          ],
          1,
          "Niyet sonradan yapışan etiket değildir. Hareketi baştan bir amele çevirir.",
        ],
      ]),
      lesson("Devamlı olan amel", "hadis,devam", [
        [
          "Az ama süren amel, taşan büyük amelden neden sevimli sayılır?",
          "Hadiste Allah'a en sevimli amelin, az da olsa devamlı olan olduğu belirtilir. Ölçü, ilk günün coşkusu değildir. Amelin hayatı, ertesi gün de yerinde durmasındadır. Bir kez taşan iş bırakılınca amel durur. Küçük iş sürerse amel yarın da vardır.\n\nSevimli olan, göze büyük gelen değildir. Kopmayan olandır. Az burada küçümseme değil, sürdürülebilir olandır.",
          [
            "Az amel daha kısa sürdüğü için",
            "Amelin hayatı ertesi gün de durmasında olduğu için",
            "Büyük amel hadiste yasaklandığı için",
            "Coşku kendiliğinden devam sayıldığı için",
          ],
          1,
          "Sevimli olan büyüklük değil, ertesi gün de duran ameldir.",
        ],
        [
          "Bir gecelik uzun ibadet hadiste neden öne geçmez?",
          "Hadiste bahsedilen, o gecenin değersiz olduğudur değil. Taşan gece, sabahı da aynı yükle kurmuyorsa amel kopar. Küçük ve her gün dönen iş, o kopuşu yaşamaz. Ölçü, bir gecenin uzunluğu değil, işin yarına kalıp kalmadığıdır.\n\nBu yüzden hadiste devam, miktarın önüne konur.",
          [
            "Uzun ibadet hiç sevap yazılmadığı için",
            "Taşan gece yarına kalmayınca amelin koptuğu için",
            "Yalnızca farzların devamının sayıldığı için",
            "Gece ibadeti hadiste anılmadığı için",
          ],
          1,
          "Taşan gece yarına kalmazsa amel kopar. Devam, miktarın önündedir.",
        ],
        [
          "Hadis «az» kelimesini ne anlamda kullanır?",
          "Hadiste az, önemsiz demek değildir. Elden gelen ve bırakılmayan miktardır. İnsan kaldıramayacağı yükü alıp üçüncü gün bırakacağına, kaldırdığı küçük işi yerinde tutar. Hadiste bahsedilen, büyük hedefi silmek değildir.\n\nBüyük hedef, ancak dönen küçük işle ayakta kalır.",
          [
            "Amelin önemsiz ve isteğe bağlı olduğu anlamında",
            "Kaldırılabilen ve bırakılmayan miktar anlamında",
            "Yalnızca bir kez yapılan iş anlamında",
            "Başkasına devredilen iş anlamında",
          ],
          1,
          "Az, önemsiz demek değildir. Kaldırılan ve bırakılmayan miktardır.",
        ],
      ]),
      lesson("Güzel ahlak", "hadis,ahlak", [
        [
          "Hadis iyiliği neden bir törenle değil huy ile tarif eder?",
          "Hadiste iyiliğin güzel ahlak olduğu belirtilir. İyilik, dışarıdan tamamlanmış bir hareketin adı olarak bırakılmaz. İnsanın başkasına ve kendine karşı duruşudur. Aynı doğru iş, huy bozuksa iyilik cümlesini taşımayabilir.\n\nHadiste bahsedilen, ibadetin ahlaktan ayrı bir süs olduğudur değil. İyilik, huyla belli olur.",
          [
            "Dış hareket hiç iyilik sayılmadığı için",
            "İyilik, tamamlanmış bir tören değil, huy olduğu için",
            "Ahlak yalnızca oruçta arandığı için",
            "Güzel huyun ibadeti sildiği için",
          ],
          1,
          "İyilik hadiste güzel ahlaktır. Törenin tamamlanmış görünmesi yetmez.",
        ],
        [
          "İçteki burukluk hangi durumda ölçü olur?",
          "Hadiste günah, içte burukluk bırakan ve insanların duymasını istemediğin şey diye de anılır. Bu, bilinen yasağın yerine konmuş bir ölçü değildir. Haram olduğu açık olan iş, iç rahat diye helal olmaz. Burukluk, hükmün henüz netleşmediği yerde kişiye verilen bir işarettir.\n\nİç daralıyor ve gözlerden gizlemek istiyorsan, o iş sana «burada dur» der. Alkış bu işareti silmez.",
          [
            "Bilinen haramı, iç rahat diye helal ettiği durumda",
            "Hüküm henüz net değilken, iç daralması ve gizlemek isteme durumunda",
            "Yalnızca başkası o işi günah saydığı durumda",
            "Burukluk hiç ölçü olmadığı için hiçbir durumda",
          ],
          1,
          "Burukluk, bilinen yasağın yerine geçmez. Hüküm net değilken verilen işarettir.",
        ],
        [
          "İnsanların duymasını istememek hadiste neyi ele verir?",
          "Hadiste bahsedilen, her gizli işin günah olduğudur değil. Gizlemek istediğin şey, içinin o işten rahatsız olduğunun işaretidir. Rahatsızlık yoksa ve işin hükmü de biliniyorsa ölçü zaten bellidir. Rahatsızlık varsa ve hüküm bulanıksa, gizleme isteği o bulanıklığı sana gösterir.\n\nÖlçü, alkışın rahatlığı değil, göstermeye utanılan yerdir.",
          [
            "Her gizli işin günah olduğunu",
            "Hüküm bulanıkken içindeki rahatsızlığı ele verdiğini",
            "Gizlemenin kendisinin sevap olduğunu",
            "Açıkça yapılan hiçbir işin günah olmayacağını",
          ],
          1,
          "Gizlemek isteği, hüküm bulanıkken içteki rahatsızlığı ele verir.",
        ],
      ]),
      lesson("Kalp", "hadis,kalp", [
        [
          "Aynı namazı kılan iki kişi hadiste neden bir sayılmaz?",
          "Hadiste, bedende bir et parçası olduğu, o düzelirse bedenin düzeleceği, bozulursa bedenin bozulacağı anlatılır. O parça kalptir. İki kişi aynı vakitte aynı namazı kılmış görünebilir. Kalp bozulmuşsa bedenin o ameli de bozulur.\n\nHadiste bahsedilen, namazın şeklinin önemsiz olduğudur değil. Şekil yerinde durur. Onu ayakta tutan parça kalptir.",
          [
            "Namazın şekli hadiste hiç aranmadığı için",
            "Kalp bozuksa bedenin aynı görünen ameli de bozulduğu için",
            "İki kişinin namazı zaten hiç bir olmadığı için",
            "Kalp yalnızca sadakada arandığı için",
          ],
          1,
          "Aynı görünen namaz, kalp bozuksa aynı amel olmaktan çıkar.",
        ],
        [
          "Hadis bakılan yeri neden suretten ve maldan ayırır?",
          "Hadiste Allah'ın suretlere ve mallara değil, kalplere ve amellere baktığı belirtilir. Suret ve mal görünür. Kalp görünmez. Hadis, görünen üstünlüğü ölçü olmaktan çıkarır. Güzel yüz ya da çok mal, bakılan yer değildir.\n\nBu, bedeni hor görmek değildir. Ölçünün adresini değiştirmektir. Adres kalp ve o kalple yapılan ameldir.",
          [
            "Suret de mal da kalple aynı ölçüde bakıldığı için",
            "Görünen üstünlük ölçü olmaktan çıkarıldığı için",
            "Amelin hiç bakılmadığı için",
            "Malın kalbi kendiliğinden düzelttiği için",
          ],
          1,
          "Bakılan yer suret ve mal değildir. Kalp ve ameldir.",
        ],
        [
          "Kalp düzelince hadise göre beden neden düzelir?",
          "Hadiste kalp, bedenin içinde hükmeden parça diye konur. O sağlanırsa azalar da o yöne döner. O bozulursa dil, el ve göz de bozulur. Hadiste bahsedilen, azaların kalpten bağımsız bir hayat sürdüğüdür değil.\n\nBu yüzden dışı düzeltip içi bırakmak, hadisin tarifine uymaz. İç, dışın hükmüdür.",
          [
            "Azalar kalpten bağımsız yaşadığı için düzelmez",
            "Kalp bedenin hükmü olduğu için azalar ona döner",
            "Beden düzelince kalp kendiliğinden düzeldiği için",
            "Hadis yalnızca kalbi anıp bedeni dışarıda bıraktığı için",
          ],
          1,
          "Kalp hükmeder. O düzelince azalar o yöne döner.",
        ],
      ]),
      lesson("Söz ve susmak", "hadis,soz", [
        [
          "«Hayır söyle ya da sus» ile «seni ilgilendirmeyeni bırak» aynı şey midir?",
          "Bir hadiste, hayır söylemek ya da susmak gerektiği belirtilir. Bu, sözün içeriğine bakar. Başka bir hadiste, kişinin kendisini ilgilendirmeyen şeyi bırakması, İslam'ının güzelliğinden sayılır. Bu, sözün doğru olup olmadığına değil, o sözün kişiye düşüp düşmediğine bakar.\n\nDoğru bir cümle de kişiyi ilgilendirmeyebilir. İki hadis iki ayrı sınırdır. Biri ne söylendiği, öbürü söylemenin sana ait olup olmadığıdır.",
          [
            "Evet. İkisi de yalnızca yalanı yasaklar",
            "Hayır. Biri sözün içeriğine, öbürü o sözün sana düşüp düşmediğine bakar",
            "Evet. İlgilendirmeyen her söz zaten hayırdır",
            "Hayır. İkinci hadis susmayı yasaklar",
          ],
          1,
          "Biri ne söylendiğine, öbürü o sözün sana ait olup olmadığına bakar.",
        ],
        [
          "Doğru bir gıybet bu ikinci hadiste neden düşer?",
          "Hadiste bahsedilen, yalanın tek yasak olduğudur değil. Kardeşini ilgilendiren, senin işin olmayan doğru bir söz de «seni ilgilendirmeyen»in içine girer. Doğruluk, o sözü senin ağzına vermez.\n\nİslam'ın güzelliği burada, her doğruyu her yerde söylemek değil, sana düşmeyen doğruyu da bırakmaktır.",
          [
            "Doğru söz her zaman kişinin işine girdiği için düşmez",
            "Doğru olsa da sana düşmeyen söz, ilgilendirmeyenin içinde kaldığı için",
            "Gıybet yalnızca yalan olunca yasak olduğu için",
            "İkinci hadis yalnızca yalan yemin için söylendiği için",
          ],
          1,
          "Doğruluk, sana düşmeyen sözü ağzına vermez.",
        ],
        [
          "Susmak hadiste ne zaman amel olur?",
          "Hadiste hayır yoksa susmak, boş bir ara değildir. O anda bir ameldir. Konuşmak da, ilgilendirmeyen bir doğruyu taşımak da ameldir. Dil her açılışta sevap biriktirmez.\n\nİki sınır yan yana durur. Söz hayır taşımıyorsa susulur. Söz doğru olsa da sana ait değilse bırakılır.",
          [
            "Yalnızca kızgınlık geçince",
            "Hayır yokken ya da söz sana ait değilken",
            "Hiçbir zaman, çünkü susmak amel sayılmaz",
            "Yalnızca namazın içinde",
          ],
          1,
          "Susmak, hayır yokken ya da söz sana ait değilken bir ameldir.",
        ],
      ]),
    ],
  },
  {
    unit: "Ashab-ı Kehf",
    description:
      "Ashab-ı Kehf. Anlatım bizim cümlemizdir. Her ders, kıssanın meşhur sahnesinin altında duran ayrımı okutur.",
    file: "data/kissalar.json",
    lessons: [
      lesson("Şehirden ayrılış", "kissa,ayrilis", [
        [
          "Sure bu kıssayı neden bir harika diye öne çıkarmaz?",
          "Kehf suresi kıssaya, «mağara ve kitabe ehlinin bizim ayetlerimiz içinde bir harika mı sandın» diye girer. Uyku meşhurdur. Sure o uykuyu ayetlerin içinde tek mucize diye kurmaz. Bir ayettir. Ayetlerin tamamı değildir.\n\nBu giriş, anlatıyı küçültmez. Seyircinin «bundan daha şaşırtıcısı yok» cümlesini kapatır. Asıl olan, gençlerin neye inandığıdır.",
          [
            "Mağaranın hiç var olmadığını söylemek için",
            "Uykuyu ayetlerin içinde tek harika sanmayı kapatmak için",
            "Kıssayı yalnızca bir masal diye işaretlemek için",
            "Gençlerin inancını anlatmamak için",
          ],
          1,
          "Sure, uykuyu ayetler içinde tek harika sanmayı kapatır.",
        ],
        [
          "Gençler mağaraya bir planla mı çıkar?",
          "Kıssada onlar, Rablerinden bir rahmet ve işlerinde bir doğruluk ister. Şehir, Allah'tan başkasına da kulluk istemektedir. Ayrılış bir sefer planı değildir. Önce dua vardır. Reşat, yani işin doğrultulması, mağaradan önce istenir.\n\nKıssada bahsedilen, cesaretin duayı gereksiz kıldığıdır değil. Çıkış, doğrultu istendikten sonra olur.",
          [
            "Evet. Şehri ele geçirecek bir düzen kurmuşlardır",
            "Hayır. Önce rahmet ve işlerinin doğrultulması istenir",
            "Evet. Sayıları belli olsun diye sayım yapmışlardır",
            "Hayır. Mağarayı tesadüfen bulup orada kalmışlardır",
          ],
          1,
          "Çıkıştan önce rahmet ve doğrultu istenir. Bu bir sefer planı değildir.",
        ],
        [
          "Şehrin istediği kulluk neden kalmalarını zorlaştırır?",
          "Kıssada şehir, inancı ortak koşmaya doğru eğer. Gençler Rabbi tek bilir. Eğilmeden kalmak, o şehirde görünmez bir uzlaşı ister. Onlar uzlaşmayınca ayrılık kaçınılmaz olur.\n\nKıssada bahsedilen, her yolculuğun hicret olduğudur değil. Bu ayrılış, inancı şehrin istediği kalıba sokmamaktır.",
          [
            "Vergi yüzünden",
            "İnancın, şehrin istediği ortak koşmaya eğilmemesi yüzünden",
            "Ticaret yolu kapandığı için",
            "Sayıları fazla olduğu için",
          ],
          1,
          "Şehir inancı eğmek ister. Onlar eğilmeyince ayrılırlar.",
        ],
      ]),
      lesson("Mağara", "kissa,magara", [
        [
          "Mağaraya bakan biri kıssada neden korkarak döner?",
          "Kıssada onlara bakacak olsan, korkuyla dönüp kaçarsın. Mağara, anlatıldığı gibi ılık bir saklanış değildir. Uyuyanların hali, bakanı ürpertir. Sure, sığınağı bir huzur resmi diye çizmez.\n\nKorku, Allah'ın onları tuttuğu halin dışarıdan görünen yüzüdür. Seyirci rahat bir tablo bekler. Ayet o tabloyu bozar.",
          [
            "Mağara boş olduğu için",
            "Uyanık sandığı halde ürperten bir halle karşılaştığı için",
            "Köpek havladığı için",
            "Güneş mağarayı yaktığı için",
          ],
          1,
          "Bakan, rahat bir uyku tablosu değil, ürperten bir hal görür.",
        ],
        [
          "Güneş kıssada neden gelişigüzel doğmaz?",
          "Anlatıda güneş doğarken mağaranın sağından, batarken solundan dolaşır. Onlar güneşin altında kavrulmaz. Sure, uykuyu karanlık bir çukura kilitlemez. Işık vardır. Işık yakmayacak biçimde çevrilir.\n\nKoruma, uykunun içindedir. Güneş de o korumanın düzenine bağlanır.",
          [
            "Mağara yerin altında hiç ışık almadığı için",
            "Işık vardır ama yakmayacak biçimde dolaştırıldığı için",
            "Güneş o yıllarda doğmadığı için",
            "Gençler güneşi kendileri perdelediği için",
          ],
          1,
          "Işık vardır. Yakmayacak biçimde dolaştırılır. Koruma uykunun içindedir.",
        ],
        [
          "Köpek bu sahnede neden silinmez?",
          "Kıssada köpek, mağaranın eşiğinde kollarını uzatmış durur. İçeri alınmayan bir yabancı gibi değil, sahnenin parçası olarak anılır. Sure, merhametin çizildiği yere onu da koyar.\n\nKıssada bahsedilen, köpeğin sayıyı değiştirdiğidir değil. Eşikte duran da bu tutuluşun içindedir.",
          [
            "Sayının asıl parçası olduğu için",
            "Eşikte duran da bu tutuluşun içine katıldığı için",
            "Şehirde bırakıldığı için",
            "Kıssada hiç anılmadığı için",
          ],
          1,
          "Köpek eşikte, sahnenin parçası olarak durur. Merhamet onu da içine alır.",
        ],
      ]),
      lesson("Uzun uyku", "kissa,uyku", [
        [
          "Uykunun uzunluğu onlara neden bir gün gibi gelir?",
          "Kıssada uyandırılınca birbirlerine sorarlar. Bir gün ya da bir günün bir parçası kadar kaldıklarını sanırlar. Sure, mucizeyi yalnızca bedenin uyumasında bırakmaz. Kalan süreyi ölçemezler. Saat, uyuyanın elinden alınmıştır.\n\nKıssada bahsedilen, zamanın gerçekten bir gün olduğudur değil. Onların hissi bir gündür. Aradan geçen, Allah'ın tuttuğu süredir.",
          [
            "Gerçekten bir gün uyudukları için",
            "Süreyi ölçecek saat ellerinden alındığı için",
            "Şehir saati mağarada durduğu için",
            "Birbirlerine sormayı unuttukları için",
          ],
          1,
          "Hisleri bir gün der. Süreyi ölçmek ellerinden alınmıştır.",
        ],
        [
          "Sure onları neden uyandırır?",
          "Kıssada uyandırılış, uykunun bittiğini seyrettirmek için değildir. Birbirlerine ne kadar kaldıklarını sorsunlar diye uyandırılırlar. Soru, cevabı bilmediklerini ortaya çıkarır. Mucize, sorunun cevapsız kalmasında da durur.\n\nBilen, o süreyi tutandır. Uyanan, sorandır.",
          [
            "Şehre hemen dönsünler diye",
            "Ne kadar kaldıklarını birbirlerine sorsunlar diye",
            "Köpeği uyandırsınlar diye",
            "Sayılarını saysınlar diye",
          ],
          1,
          "Uyandırılış, süreyi birbirlerine sordurmak içindir. Cevap onlarda değildir.",
        ],
        [
          "Bu uyku insanların kurduğu bir plan mıdır?",
          "Kıssada onları mağarada yıllarca tutan, gençlerin tedbir listesi değildir. Kulakları mühürlenir, yanları çevrilir, güneş dolaştırılır. Düzen Allah'ındır. Kıssada bahsedilen, tedbirin hiç olmadığıdır değil. Tedbir, bu uykunun süresini açıklamaz.\n\nUyku bir ayettir. Ayeti gençler üretmez.",
          [
            "Evet. Ne kadar uyuyacaklarını baştan kararlaştırmışlardır",
            "Hayır. Süreyi ve düzeni Allah tutar. Tedbir bu uykuyu açıklamaz",
            "Evet. Nöbetleşe uyumuşlardır",
            "Hayır. Hiç uyumamış, yalnızca susmuşlardır",
          ],
          1,
          "Uykunun düzeni Allah'ındır. Gençlerin tedbiri süreyi açıklamaz.",
        ],
      ]),
      lesson("Uyanış", "kissa,uyanis", [
        [
          "Şehre inen gencin parası neyi ele verir?",
          "Kıssada içlerinden biri, en temiz yiyecek için şehre gönderilir. Gizlice girmesi istenir. Elindeki para, o günün parası değildir. Gören, zamanın geçtiğini paradan anlar. Kıssada bahsedilen, paranın yalnızca alışveriş aracı olduğudur değil.\n\nPara, mağarada ölçülemeyen süreyi çarşıda okunur kılar.",
          [
            "Gencin zengin olduğunu",
            "Mağarada ölçülemeyen süreyi",
            "Şehrin hiç değişmediğini",
            "Yiyeceğin pahalı olduğunu",
          ],
          1,
          "Eski para, mağarada ölçülemeyen süreyi çarşıda ele verir.",
        ],
        [
          "Gizlice girmek neden istenir?",
          "Kıssada genç, tanınmadan ve incelikle girmesi için gönderilir. Şehir, onları kovan şehir olmayabilir. Yine de karşılaşma hazırlıksız bir kalabalık işi diye kurulmaz. Kıssada bahsedilen, korkunun imanı sildiğidir değil.\n\nİnmek, bir duyuru değildir. Süreyi henüz bilmeyen birinin, değişmiş şehre temkinli adımıdır.",
          [
            "Yiyecek çalsın diye",
            "Değişmiş şehre tanınmadan ve temkinli girsin diye",
            "Eski evine yerleşsin diye",
            "Ordu toplasın diye",
          ],
          1,
          "İniş bir duyuru değildir. Değişmiş şehre temkinli bir adımdır.",
        ],
        [
          "Şehir onları bulunca kıssa neye döner?",
          "Kıssada durumları açığa çıkınca insanlar bir bina tartışmasına girer. Kimi üzerlerine bir yapı dikelim der, kimi mescit. Gençlerin imanı, bulunanların elinde bir anıt kavgasına döner. Kıssada bahsedilen, anıtın kıssanın merkezi olduğudur değil.\n\nSure, keşfin coşkusunu bir yapı yarışında bırakır. Okuyan, anıtın değil, Allah'ın vaadinin doğrulandığını görsün diye bu sahne konur.",
          [
            "Gençlerin şehri yönetmesine",
            "İmanın bir anıt kavgasına çevrilmesine",
            "Paranın yeniden basılmasına",
            "Uykunun hiç yaşanmadığının anlaşılmasına",
          ],
          1,
          "Bulunanlar bina tartışmasına girer. Sure, merkezin anıt olmadığını gösterir.",
        ],
      ]),
      lesson("Süre Allah'ın bilgisindedir", "kissa,sure", [
        [
          "İnsanların üç, beş, yedi demesi neden tahmindir?",
          "Kıssada kimi üç der, köpekleri dördüncü. Kimi beş der, köpekleri altıncı. Kimi yedi der, köpekleri sekizinci. Sure, gayb hakkında atılan bu sayıları tahmin diye kapatır. Sayıyı bilenin az olduğunu, bu yüzden o tartışmaya girilmemesini söyler.\n\nMerkez, kaç kişi oldukları değildir. Tahmin, görünmeyeni saymaya kalkmaktır.",
          [
            "Sayılar ayette hiç geçmediği için",
            "Görünmeyeni saymaya kalktığı için",
            "Köpek sayılmadığı için",
            "Herkes aynı sayıyı tutturduğu için",
          ],
          1,
          "Üç, beş, yedi bir sayım değil, gayb hakkında tahmindir.",
        ],
        [
          "Üç yüz yıl ve üzerine dokuz, tartışmayı neden kapatmaz?",
          "Kıssada mağarada üç yüz yıl kaldıkları ve buna dokuz eklendiği anılır. Hemen ardından süre Allah'ın bilgisine bırakılır. Bir okuma, üç yüzü güneş yılı, eklenen dokuzu ay yılı farkı diye kurar. Ayet bu okumayı bir yarışın birincisi ilan etmez.\n\nSayı bir uç verir. Kesinlik verilmez. «Allah daha iyi bilir» cümlesi, sayının üstüne konur.",
          [
            "Üç yüz kesin güneş yılı olduğu için kapatır",
            "Sayı anılır ama kesinlik hemen Allah'ın bilgisine bırakıldığı için kapatmaz",
            "Dokuz sayısı ayette olmadığı için",
            "Süre hiç söylenmediği için",
          ],
          1,
          "Sayı verilir ve hemen Allah'ın bilgisine bırakılır. Kesinlik yarışı kapanır.",
        ],
        [
          "Kıssa neden «yarın şöyle yapacağım» cümlesine bağlanır?",
          "Sure, süre tartışmasının yanına bir söz kuralı koyar. Yarın şunu yapacağım diyen, Allah dilerse demeden konuşmasın. Unutursa sonra ansın. Mağarada saat ellerinden alınmıştı. Aynı sınır, gündelik cümleye de konur.\n\nKıssada bahsedilen, planın yasak olduğudur değil. Plan, sürenin sahibiymiş gibi kurulmasın. Süre, uyuyanın da konuşanın da elinde değildir.",
          [
            "Plan kurmak yasaklandığı için",
            "Sürenin, uyuyanın da konuşanın da elinde olmadığını göstermek için",
            "Yarın kelimesi mağarada geçtiği için",
            "Gençler söz vermeden ayrıldığı için",
          ],
          1,
          "Yarın diye kesin konuşmak, süreyi elinde sanmaktır. Kıssa o sınırı gündelik söze de koyar.",
        ],
      ]),
    ],
  },
  {
    unit: "Peygamberler",
    description:
      "Kur’an’da anlatılan peygamber kıssaları. Her ders, bilinen sahnenin altında duran bir ayrımı okutur.",
    file: "data/peygamberler.json",
    lessons: [
      lesson("Nuh", "peygamberler,nuh", [
        [
          "Nuh’un oğlu gemiye neden soy sayesinde binemez?",
          "Kıssada Nuh, oğlu için yakarır. Cevap, oğlunun onun ehli sayılmayacağıdır. Ehil, soy adıyla değil, oğlun tuttuğu işle kurulur. Kan, geminin kapısını açmaz.\n\nKıssada bahsedilen, akrabalığın silindiğidir değil. Kurtuluşun soydan geçmediğidir. Peygamberin evladı olmak, tek başına biniş hakkı vermez.",
          [
            "Gemiye yer kalmadığı için",
            "Ehil, soy adıyla değil tutulan işle kurulduğu için",
            "Nuh oğlunu çağırmadığı için",
            "Oğul gemiyi reddetmeden önce boğulduğu için sure onu anmaz",
          ],
          1,
          "Oğul, soy adıyla ehil sayılmaz. Kurtuluş kandan geçmez.",
        ],
        [
          "Gemi neden sular gelmeden kurulur?",
          "Kıssada Nuh gemiyi karada, kavmin alayı altında kurar. Su henüz yoktur. Emir, delilden önce gelir. Kıssada bahsedilen, alayın Nuh’u durdurduğudur değil.\n\nGören, kuru toprakta bir tekne görür ve güler. Tekne, görülen delile göre değil, gelen emre göre kurulur.",
          [
            "Su kıssada hiç anılmadığı için",
            "Emir, görünen delilden önce geldiği için",
            "Kavim gemiyi birlikte istediği için",
            "Gemi bir depo olarak kullanıldığı için",
          ],
          1,
          "Gemi, su görünmeden kurulur. Emir, delilden önce gelir.",
        ],
        [
          "Uzun çağrı kıssada neyi ölçmez?",
          "Kıssada çağrı uzun sürer. Uyanlar azdır. Sürenin uzunluğu, kalabalığın haklılığını ölçmez. Çoğunluk geminin dışında kalır. Kıssada bahsedilen, çağrının boşa gittiğidir değil.\n\nÖlçü, kaç yıl söylendiği değil, söylenenin ne olduğudur. Az biner. Çokluk, dışarıda kalanı haklı çıkarmaz.",
          [
            "Çağrının kabul oranını",
            "Kalabalığın haklı olup olmadığını",
            "Geminin büyüklüğünü",
            "Tufanın gününü",
          ],
          1,
          "Uzun süre ve büyük kalabalık, hakkın ölçüsü değildir.",
        ],
      ]),
      lesson("İbrahim", "peygamberler,ibrahim", [
        [
          "Yıldız, ay ve güneş kıssada neden elenir?",
          "Kıssada İbrahim yıldızı, ayı ve güneşi görür. Batanı sevmem der. Elenen, parlak oldukları için değil, kayboldukları içindir. Kalıcı olmayan, Rab diye duramaz.\n\nKıssada bahsedilen, göğün yok sayıldığıdır değil. Batanın ilah olamayacağıdır. Delil, ışığın gücünde değil, ışığın kesilmesindedir.",
          [
            "Az parladıkları için",
            "Battıkları için. Kalmayan, Rab diye duramaz",
            "Yalnızca put oldukları için gök hiç anılmaz",
            "Kavim onları hiç tanımadığı için",
          ],
          1,
          "Parlaklık yetmez. Batan, kalıcı Rab olamaz.",
        ],
        [
          "Büyük putu kırmayıp bırakması neyi söyletir?",
          "Kıssada İbrahim putları kırar, büyüğünü bırakır. Kavme, bunu o yaptı, sorun ona dersiniz. Kavim, putların konuşamayacağını kendi ağzıyla söyler. Delil, İbrahim’in nutku değil, onların cümlesidir.\n\nKıssada bahsedilen, büyüğün gerçekten kırdığıdır değil. Konuşamayan ilahın, ilah olamayacağının onların sözünden çıkmasıdır.",
          [
            "Büyük putun gerçekten diğerlerini kırdığını",
            "Kavmin, putlar konuşamaz cümlesini kendi ağzından kurduğunu",
            "Putların bir kısmının helal sayıldığını",
            "İbrahim’in kırmaktan vazgeçtiğini",
          ],
          1,
          "Delil onların cümlesidir. Konuşamayanı ilah diye bırakamazlar.",
        ],
        [
          "Ateş kıssada nasıl söner?",
          "Kıssada ateşe, İbrahim’e karşı serin ve esen ol denir. Söndüren, İbrahim’in bir tekniği değildir. Silah diye kullanılan şeyin kendisine bir emir verilir. Kıssada bahsedilen, ateşin hiç yanmadığıdır değil.\n\nTehlike yerindedir. Koruma, o tehlikeye söylenen sözdedir.",
          [
            "İbrahim’in üzerine su dökmesiyle",
            "Ateşin kendisine serin ve esen ol denmesiyle",
            "Kavmin pişman olup söndürmesiyle",
            "Ateşin kıssada hiç yakılmamasıyla",
          ],
          1,
          "Ateşe emir verilir. Söndüren, İbrahim’in tekniği değildir.",
        ],
      ]),
      lesson("Yusuf", "peygamberler,yusuf", [
        [
          "Yakup rüyayı kardeşlerden neden saklar?",
          "Kıssada Yusuf rüyayı babasına anlatır. Yakup, bunu kardeşlerine anlatmamasını ister. Rüya, kardeşlerin dilinde bir üstünlük kavgasına dönecektir. Kıssada bahsedilen, rüyanın yanlış olduğudur değil.\n\nSaklamak, rüyayı inkâr etmek değildir. Kardeşliğin, bir rütbe haberiyle parçalanmasını önlemektir.",
          [
            "Rüya yalan olduğu için",
            "Kardeşlerin onu bir üstünlük kavgası diye okumasın diye",
            "Yusuf rüyayı unutsun diye",
            "Şehir duymasın diye rüya hiç anlatılmaz",
          ],
          1,
          "Rüya saklanır çünkü kardeşler onu bir rütbe kavgası diye okuyabilir.",
        ],
        [
          "Zindandan çıkış neden «beni an» cümlesiyle gelmez?",
          "Kıssada Yusuf, kralın adamına zindandan çıkınca beni an der. Adam unutur. Yusuf yıllarca daha kalır. Çıkış, o ricayla kurulmuş bir bağlantıdan gelmez. Kral bir rüya görünce, yorum için ona ihtiyaç doğar.\n\nKıssada bahsedilen, vesilenin günah olduğudur değil. Vesile tutmayabilir. Kurtuluş, o cümlenin başarısına bağlanmaz.",
          [
            "Yusuf kimseye bir şey söylemediği için",
            "Adam unutur ve çıkış, kralın rüyaya muhtaç olduğu anda geldiği için",
            "Zindan kıssada bir gün sürdüğü için",
            "Kral Yusuf’u baştan tanıdığı için",
          ],
          1,
          "«Beni an» tutmaz. Çıkış, kral rüyaya muhtaç olunca gelir.",
        ],
        [
          "Aklanınca Yusuf nefsi neden temize çıkarmaz?",
          "Kıssada iftira düşüp Yusuf yükselince, nefsi temize çıkarmadığını söyler. Nefis kötülüğe yaslanır. Ancak Rabbi’nin merhamet ettikleri bunun dışındadır. Aklanma, «ben zaten temizdim» cümlesine dönmez.\n\nKıssada bahsedilen, Yusuf’un suçu olduğudur değil. Kurtuluşu kendi nefsinin sağlamlığına yazmadığıdır.",
          [
            "Suçu kabul ettiği için",
            "Kurtuluşu nefsinin sağlamlığına yazmadığı için",
            "Kral öyle istediği için",
            "Kardeşleri ısrar ettiği için",
          ],
          1,
          "Aklanınca «ben temizdim» demez. Kurtuluşu nefsine yazmaz.",
        ],
      ]),
      lesson("Musa", "peygamberler,musa", [
        [
          "Çağrı Musa’ya nerede gelir?",
          "Kıssada Musa, ailesi için bir ateş ararken ağaç tarafından çağrılır. Bu, sarayda kurulmuş bir tören değildir. Evinin gecesi için çıktığı bir işin içindedir. Peygamberlik, o ev işinin ortasında gelir.\n\nKıssada bahsedilen, görevin küçük olduğudur değil. Görevin, insanın gündelik halinin içinde aradığıdır.",
          [
            "Firavun’un taht odasında",
            "Ailesi için ateş aradığı bir gecede",
            "Ordu toplanmışken",
            "Yalnızca rüyada, uyanınca silinerek",
          ],
          1,
          "Çağrı, ailesi için ateş aradığı gecede gelir. Saray töreninde değil.",
        ],
        [
          "Musa Harun’u neden ister?",
          "Kıssada Musa, göğsünün daraldığını ve dilinin açılmadığını söyler. Kardeşi Harun’un yanında gönderilmesini ister. Zayıflığı gizlemez. Görev, kusursuz bir hatip şartına bağlanmaz.\n\nKıssada bahsedilen, Musa’nın konuşamadığıdır değil. Konuşmanın zorluğunu söyleyip yardım istemesidir. Risalet, o isteği küçültmez.",
          [
            "Harun Firavun’u tanıdığı için saltanat ona kalsın diye",
            "Dilinin zorlandığını söyleyip görevi kusursuz hatiplik şartından çıkardığı için",
            "Kendisi gitmek istemediği için",
            "Harun daha önce peygamber olduğu için Musa susar",
          ],
          1,
          "Musa dilinin zorluğunu söyler ve Harun’u ister. Görev, kusursuz hatiplik değildir.",
        ],
        [
          "Sihirbazlar secde edince neyi ayırt etmiş olur?",
          "Kıssada Firavun’un sihirbazları, Musa’nın asasından çıkanı görünce secde eder. Onlar göz bağının ustasıdır. Gördükleri, kendi işlerinin türünden değildir. Firavun ellerini keseceğini söyleyince de dönmezler.\n\nKıssada bahsedilen, her büyünün ayet olduğudur değil. İşi hile olanların, hile olmayanı tanımasıdır.",
          [
            "Firavun’un da inandığını",
            "Kendi işleri olan hile ile ayeti ayırdıklarını",
            "Asanın bir sihir tekniği olduğunu",
            "Secdenin bir savaş hilesi olduğunu",
          ],
          1,
          "Sihirbazlar, kendi işleri olan hile ile ayeti ayırır.",
        ],
      ]),
      lesson("Risalet", "peygamberler,risalet", [
        [
          "Çağrı birken muhatap neden değişir?",
          "Nuh’un karşısında alay eden bir kavim, İbrahim’in karşısında put, Yusuf’un karşısında kıskançlık ve zindan, Musa’nın karşısında bir saltanat vardır. Söz aynıdır: Allah birdir, zulüm ve şirk karşısında susulmaz. Sureler bu sözü her seferinde o yerin reddine göre kurar.\n\nKıssada bahsedilen, her peygamberin başka bir din getirdiğidir değil. Aynı çağrının, o kavmin hayır dediği yere söylendiğidir.",
          [
            "Her peygamber başka bir ilah söylediği için",
            "Aynı çağrı, o kavmin hayır dediği yere söylendiği için",
            "Muhatap hiç değişmediği için kıssalar aynı sahneyi tekrar eder",
            "Çağrı yalnızca bir kavme ait olduğu için",
          ],
          1,
          "Söz birdir. Her kıssa onu, o yerin reddine söyler.",
        ],
        [
          "Kıssalar zayıflığı neden gizlemez?",
          "Nuh alay altında gemi kurar. İbrahim ateşe atılır. Yusuf yıllarca zindanda kalır. Musa dilinin zorlandığını söyler. Kıssa, peygamberi kusursuz bir kahraman diye çizmez. Zayıflık anılır. Görev o anının üstünden de gider.\n\nKıssada bahsedilen, korkunun görevden düşürdüğüdür değil. Görevin, korkunun ve zorluğun yok sayılmasına bağlı olmadığıdır.",
          [
            "Zayıflık görevi düşürdüğü için anılır",
            "Görev, korkunun ve zorluğun yok sayılmasına bağlı olmadığı için",
            "Kıssalar yalnızca yenilgi anlattığı için",
            "Peygamberler yardım istemediği için",
          ],
          1,
          "Zayıflık gizlenmez. Görev, o halin yok sayılmasına bağlı değildir.",
        ],
        [
          "Nuh’un oğlu risalet hakkında neyi kapatır?",
          "Peygamberin yakarışı, soy için bir istisna açmaz. Oğul, işi yüzünden ehil sayılmaz. Makam da kan da ölçüyü değiştirmez. Kıssada bahsedilen, duanın yasak olduğudur değil.\n\nDua edilir. Cevap, ölçüyü bozmaz. Risalet, yakınlara ayrı bir kapı demek değildir.",
          [
            "Peygamberin duasının her zaman kabul olduğunu",
            "Yakınlığa ayrı bir kurtuluş kapısı açılmadığını",
            "Oğlun gemiye bindiğini",
            "Soyun ibadetin yerine geçtiğini",
          ],
          1,
          "Peygamberin yakarışı da soy için istisna açmaz.",
        ],
      ]),
    ],
  },
];

function sessionPoolerUrl(databaseUrl) {
  const raw = databaseUrl?.trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (!parsed.hostname.includes("pooler.supabase.com")) return null;
    parsed.port = "5432";
    return parsed.toString();
  } catch {
    return null;
  }
}

async function connect() {
  const direct = process.env.DIRECT_URL?.trim();
  const pooled = sessionPoolerUrl(process.env.DATABASE_URL) || process.env.DATABASE_URL?.trim();
  const candidates = [direct, pooled].filter((value, index, all) => Boolean(value) && all.indexOf(value) === index);
  if (candidates.length === 0) throw new Error("DIRECT_URL veya DATABASE_URL yok.");
  let lastError;
  for (const url of candidates) {
    const client = new Client({
      connectionString: url,
      ssl: url.includes("supabase") ? { rejectUnauthorized: false } : undefined,
    });
    try {
      await client.connect();
      return client;
    } catch (error) {
      lastError = error;
      await client.end().catch(() => undefined);
    }
  }
  throw lastError;
}

async function replaceLesson(client, unitTitle, lesson) {
  const found = await client.query(
    `SELECT l.id
     FROM lessons l
     JOIN units u ON u.id = l.unit_id
     JOIN courses c ON c.id = u.course_id
     WHERE c.section = 'kitaplar' AND u.title = $1 AND l.title = $2`,
    [unitTitle, lesson.title],
  );
  if (found.rows.length !== 1) {
    throw new Error(`${unitTitle} / ${lesson.title}: ${found.rows.length} ders`);
  }
  const lessonId = found.rows[0].id;
  await client.query("DELETE FROM challenges WHERE lesson_id = $1", [lessonId]);
  for (let i = 0; i < lesson.challenges.length; i++) {
    const item = lesson.challenges[i];
    const row = await client.query(
      `INSERT INTO challenges
        (lesson_id, type, question, explanation, "order", difficulty, tags, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [lessonId, item.type, item.question, item.explanation, i + 1, item.difficulty, item.tags, item.metadata],
    );
    for (const option of item.options) {
      await client.query(
        "INSERT INTO challenge_options (challenge_id, text, correct) VALUES ($1, $2, $3)",
        [row.rows[0].id, option.text, option.correct],
      );
    }
  }
}

async function main() {
  for (const unit of units) {
    fs.writeFileSync(
      unit.file,
      JSON.stringify({ title: unit.unit, description: unit.description, lessons: unit.lessons }, null, 2) + "\n",
    );
  }

  const client = await connect();
  try {
    await client.query("BEGIN");
    for (const unit of units) {
      await client.query(
        `UPDATE units u SET description = $2
         FROM courses c
         WHERE u.course_id = c.id AND c.section = 'kitaplar' AND u.title = $1`,
        [unit.unit, unit.description],
      );
      for (const item of unit.lessons) {
        await replaceLesson(client, unit.unit, item);
        console.log(`${unit.unit} / ${item.title}`);
      }
    }
    await client.query("COMMIT");
    const check = await client.query(`
      SELECT u.title AS unit, l.title AS lesson, ch."order", left(ch.question, 72) AS question
      FROM courses c
      JOIN units u ON u.course_id = c.id
      JOIN lessons l ON l.unit_id = u.id
      JOIN challenges ch ON ch.lesson_id = l.id
      WHERE c.section = 'kitaplar'
        AND u.title IN ('Kur''an', 'Hadisler', 'Ashab-ı Kehf', 'Peygamberler')
        AND ch."order" = 1
      ORDER BY u.title, l."order"
    `);
    console.log(JSON.stringify(check.rows, null, 2));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
