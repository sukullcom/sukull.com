# Canlı açılış rehberi (Sukull)

Bu dosya, siteyi gerçek kullanıcılara açmadan önce **sizin panelde yapmanız gerekenler** ile
**repoda hazırlanan araçları** bir arada listeler.

---

## A) Sizin yapmanız gerekenler (panel / hesap)

### 1. Yedek (5 dk)

1. [Supabase Dashboard](https://supabase.com/dashboard) → projeniz → **Database** → **Backups**
2. Manuel snapshot alın veya mevcut otomatik yedeğin tarihini not edin.

### 2. Vercel ortam değişkenleri (10 dk)

[vercel.com](https://vercel.com) → Proje → **Settings** → **Environment Variables** → **Production**

| Değişken | Beklenen |
|----------|----------|
| `NEXT_PUBLIC_APP_URL` | `https://sukull.com` |
| `IYZICO_BASE_URL` | `https://api.iyzipay.com` (**sandbox değil**) |
| `IYZICO_API_KEY` / `IYZICO_SECRET_KEY` | Iyzico **canlı** panelinden |
| `CRON_SECRET` | Uzun rastgele string |
| `INTERNAL_API_KEY` | Uzun rastgele string |
| `RESEND_API_KEY` / `RESEND_FROM` | `Sukull <noreply@sukull.com>` (doğrulanmış domain) |
| `ADMIN_EMAILS` | Korunacak admin e-postaları (virgülle) |

`.env.example` dosyasına bakın; eksik anahtar varsa ekleyin.

### 3. Railway (payment-server) (5 dk)

Railway → servis → **Variables** → Production:

- `NODE_ENV=production`
- `IYZICO_BASE_URL=https://api.iyzipay.com`
- Canlı Iyzico anahtarları
- `NEXT_PUBLIC_APP_URL=https://sukull.com`

> Kod artık production + sandbox Iyzico kombinasyonunda **sunucuyu başlatmaz** (kazara test ödemesi engeli).

### 4. Supabase Auth & e-posta (10 dk)

**Authentication → URL Configuration**

- Site URL: `https://sukull.com`
- Redirect URLs: `https://sukull.com/auth/confirm`, `https://sukull.com/api/auth/callback`

**Authentication → Email Templates → Confirm signup**

- Subject: `Sukull — E-postanı doğrula`
- Gövde: Türkçe şablon (önceki mesajdaki HTML)

**Project Settings → Auth → SMTP**

- Sender: `Sukull <noreply@sukull.com>` (veya `auth@sukull.com`)

**DNS (domain sağlayıcı)**

- Resend DKIM/SPF yeşil
- `_dmarc.sukull.com` TXT: `v=DMARC1; p=none; rua=mailto:...`

### 5. Test kullanıcılarını temizleme (15–30 dk)

Bilgisayarınızda proje klasöründe (`.env` dolu olmalı):

```bash
cd sukull.com

# 1) Önce liste — silmez
npm run launch:purge-users

# 2) Listeyi kontrol edin; ADMIN_EMAILS'teki hesaplar KEEP görünmeli

# 3) Gerçek silme
npm run launch:purge-users -- --execute

# 4) Tablolarda kalan eski test verisi (purge "silinecek yok" dese bile)
npm run launch:purge-orphans
npm run launch:purge-orphans -- --execute

# 5) Hâlâ satır varsa — tüm aktivite/ödeme tablolarını boşalt (admin hesapları kalır)
npm run launch:purge-orphans -- --execute --wipe-all

# 6) Okul puanları + yetim raporu
npm run launch:post-cleanup
```

`rate_limits` hatası alırsanız: script artık tabloyu yoksa atlar. Kalıcı çözüm için bir kez:

```bash
npm run db:apply -- supabase/migrations/0019_add_rate_limits.sql
```

`ADMIN_EMAILS` içinde **tutulacak tüm e-postalar** olmalı (sizin admin hesaplarınız).

### 6. Deploy & smoke test (10 dk)

1. `main` branch’i deploy edin (Vercel + Railway).
2. Kontrol:
   - [ ] https://sukull.com açılıyor
   - [ ] https://sukull.com/api/health → 200
   - [ ] Yeni kayıt → e-posta → doğrulama → giriş
   - [ ] Bir ders sorusu çöz → puan artıyor
   - [ ] `/admin` (admin hesabıyla)

Detay: `docs/RUNBOOK.md` §8.

### 7. İsteğe bağlı — sandbox ödeme kayıtları

Tüm `payment_logs` **sadece test** ise, Supabase SQL Editor’da
`scripts/launch-post-cleanup.sql` içindeki yorumlu `DELETE` satırlarını **bilinçli** açıp çalıştırın.
Gerçek para geçtiyse **açmayın**.

---

## B) Repoda hazırlananlar (bu PR)

| Ne | Nerede |
|----|--------|
| Test kullanıcı silme scripti | `npm run launch:purge-users` |
| Okul puanı / yetim raporu SQL | `npm run launch:post-cleanup` |
| Hesap silme DB mantığı (ortak) | `lib/account-purge-db.ts` |
| Abonelik yasal onay kutuları | `components/subscription-purchase.tsx` |
| Production’da sandbox Iyzico engeli | `payment-server/server.js` |
| Örnek env şablonu | `.env.example` |

---

## C) Canlıya “hazır” sayılma kriteri

| Madde | Kim |
|-------|-----|
| Test kullanıcılar silindi | Siz (script) |
| Iyzico canlı anahtarlar | Siz (Vercel + Railway) |
| E-posta domain doğrulama | Siz (Resend + DNS) |
| Smoke test geçti | Siz |
| Yasal onaylar (kredi + abonelik) | Kod ✓ |

---

## Sorun çıkarsa

- Purge script hata verirse: Supabase log + hangi e-posta FAIL oldu not alın; o kullanıcıyı panelden Auth → Delete deneyin.
- Ödeme çalışmıyorsa: Railway log’da `Iyzico initialized (live)` görünmeli; `sandbox` görünüyorsa env yanlış.
- E-posta spam: `docs/CANLI_ACILIS.md` §4 DNS + şablon konuları.
