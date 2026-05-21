/**
 * Gönderici (`From:`) başlığını "Display Name <email>" biçiminde garanti
 * altına alır.
 *
 * SMTP/Resend için yapılandırma genellikle iki türlü ayarlanır:
 *  1. Sadece e-posta:  `iletisim@sukull.com`
 *  2. Ad + e-posta:    `Sukull <iletisim@sukull.com>`
 *
 * Birinci durumda Gmail/Outlook gibi istemciler local-part'ı (`iletisim`)
 * gönderici adı gibi gösterir — kullanıcı maili "İletişim" diye okur. Bu
 * yardımcı, raw değerde `<>` ile sarılı bir e-posta yoksa, varsayılan
 * görünen adı (`Sukull`) ekler.
 *
 * Görünen adı `EMAIL_FROM_NAME` env'i ile override edilebilir; böylece
 * marka adı değiştiğinde kod değiştirmek gerekmez.
 */

const DEFAULT_DISPLAY_NAME = "Sukull";

/**
 * `raw` → "Sukull <iletisim@sukull.com>" gibi normalize edilmiş gönderici.
 * Boş/geçersiz girişte `null` döner; çağıran taraf provider'ı atlamalı.
 */
export function resolveSenderAddress(raw: string | undefined | null): string | null {
  const cleaned = (raw ?? "").trim();
  if (!cleaned) return null;

  const displayName =
    process.env.EMAIL_FROM_NAME?.trim() || DEFAULT_DISPLAY_NAME;

  // 1) Halihazırda `Foo <foo@bar>` biçiminde mi?
  //    `Foo Bar <foo@bar.com>` veya `<foo@bar.com>` gibi varyasyonlara izin ver.
  const angleMatch = cleaned.match(/^(.*)<\s*([^<>\s]+@[^<>\s]+)\s*>\s*$/);
  if (angleMatch) {
    const namePart = angleMatch[1].trim().replace(/^"|"$/g, "");
    const email = angleMatch[2].trim();
    if (namePart.length > 0) {
      return `${quoteIfNeeded(namePart)} <${email}>`;
    }
    return `${quoteIfNeeded(displayName)} <${email}>`;
  }

  // 2) Sade e-posta: `foo@bar.com`
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
    return `${quoteIfNeeded(displayName)} <${cleaned}>`;
  }

  // 3) Tanınmayan format — değişiklik yapmadan döndür; SMTP/Resend kendi
  //    hatasını basacak ve `error_log`'da görünür.
  return cleaned;
}

/**
 * Görünen adda virgül, parantez, `<>`, tırnak gibi karakterler varsa
 * RFC 5322 uyarınca tırnak içine almak gerekir.
 */
function quoteIfNeeded(name: string): string {
  if (/[",<>()@]/.test(name)) {
    return `"${name.replace(/"/g, '\\"')}"`;
  }
  return name;
}
