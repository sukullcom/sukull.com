/**
 * Türkçe-uyumlu büyük/küçük harf normalizasyonu.
 *
 * Default `String.prototype.toLowerCase()` Türkçedeki `İ → i` ve `I → ı`
 * eşlemelerini garanti etmiyor: tarayıcı locale'i `en-US` ise `"İstanbul"`
 * → `"i̇stanbul"` (combining dot above) gibi tuhaf sonuçlar veriyor; bu
 * yüzden `"İstanbul"` ile `"istanbul"` aynı eşleşmiyor.
 *
 * Bu modül:
 *  - {@link lowerTr}: `tr-TR` locale ile lowercase + Unicode NFC.
 *  - {@link foldTr}: lowercase + diakritik dropping (örn. `ş → s`). Filtre
 *    için "shanlıurfa" yazsa bile "Şanlıurfa"yı yakalamak istersek bunu
 *    kullanırız.
 *  - {@link normalizeForSearch}: lower + diakritik drop + whitespace
 *    collapse. UI tarafında ve server tarafında karşılaştırma sırasında
 *    aynı fonksiyonu kullan.
 */

export function lowerTr(input: string | null | undefined): string {
  if (input == null) return "";
  // NFC normalize edip locale-aware lowercase uyguluyoruz; combining
  // diacritic'ler tekleşir, `İ → i` doğru oluşur.
  return input.normalize("NFC").toLocaleLowerCase("tr-TR");
}

/**
 * Türkçe karakterleri ASCII'ye yakın hâle indirgeyip lowercase'ler.
 * `Şanlıurfa` → `sanliurfa`, `İstanbul` → `istanbul`. Kullanıcı arama
 * kutusuna `sanliurfa` yazsa bile listede `Şanlıurfa` yakalanır.
 */
export function foldTr(input: string | null | undefined): string {
  const lowered = lowerTr(input);
  // Explicit harf eşleştirmeleri — Unicode NFD üzerinden diacritic dropping
  // Türkçedeki `ı/i` ayrımını da bozar (her ikisi `i`'ye düşer); biz onu
  // değil sadece çift-aksanlı/cedillı harfleri sadeleştirmek istiyoruz.
  return lowered
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/â/g, "a")
    .replace(/î/g, "i")
    .replace(/û/g, "u");
}

export function normalizeForSearch(input: string | null | undefined): string {
  return foldTr(input).replace(/\s+/g, " ").trim();
}

/**
 * `needle` boş ya da hiçbir field'da yoksa `false` döndüren basit AND-OR
 * yardımcısı: çok-alanlı bir kayıt için "her token, en az bir alanda
 * geçiyor mu?" sorusunu cevaplar. Eğitmen filtreleri için ideal — kullanıcı
 * "matematik istanbul" yazdığında "matematik" branşta, "istanbul" şehirde
 * geçen eğitmeni getirir.
 */
export function matchesAllTokens(
  needle: string,
  haystacks: ReadonlyArray<string | null | undefined>,
): boolean {
  const n = normalizeForSearch(needle);
  if (!n) return true;
  const fields = haystacks.map((h) => normalizeForSearch(h));
  const tokens = n.split(" ").filter(Boolean);
  return tokens.every((t) => fields.some((f) => f.includes(t)));
}
