# Kayıt ve oturum (e-posta doğrulama yok)

E-posta + şifre ile kayıt **doğrulama maili göndermez**. Kullanıcı kayıt butonuna basınca hesap oluşur ve oturum açılır.

Şifre sıfırlama e-postaları ayrı bir akıştır; bu dosya onları kapsamaz.

## Kayıt akışı

1. Kullanıcı `/create-account` formunu doldurur.
2. `signUpWithEmail` (`app/(auth)/create-account/actions.ts`) IP rate limit + `public.users` e-posta kontrolü uygular.
3. Service-role `auth.admin.createUser({ email_confirm: true })` hesabı **onaylı** oluşturur (GoTrue confirmation maili yok).
4. Aynı istekte `signInWithPassword` oturum çerezlerini yazar.
5. `ensurePublicUserFromAuth` `public.users` satırını ekler.
6. İstemci `/courses` yönlendirir (onboarding bitmemişse orası `/onboarding`’e alır).

Eski, hiç doğrulanmamış hesaplar girişte otomatik onaylanır (`lib/confirm-auth-email.ts`).

## Oturum süresi

Uygulama **hareketsizlik yüzünden otomatik çıkış yapmaz**. Çıkış yalnızca kullanıcının “Çıkış” demesiyle (veya tarayıcının çerezi silmesiyle) olur.

Auth çerezleri ~400 gün tutulur; access JWT (~1 saat) arka planda yenilenir.

Supabase Dashboard’da da bunu bozmayın:

1. **Authentication → Providers → Email**
   - **Confirm email**: **kapalı**
2. **Authentication → Sessions** (varsa)
   - **Time-box user sessions**: kapalı
   - **Inactivity timeout**: kapalı

Şifre sıfırlama için SMTP / Resend ayarları durabilir.

## URL Configuration

**Authentication → URL Configuration**

- Site URL: `https://sukull.com` (prod) / `http://localhost:3000` (dev)
- Redirect URLs (OAuth + şifre sıfırlama):
  - `https://sukull.com/api/auth/callback`
  - `https://sukull.com/auth/confirm`
  - aynı path’ler localhost için

## Eski `/resend-verification`

Sayfa artık `/login`’e yönlendirir. Bookmark’lar kırılmaz.

## Test

1. `/create-account` → gerçek bir e-posta ile kayıt
2. Doğrulama maili **gelmemeli**
3. Doğrudan `/courses` (veya onboarding) açılmalı
4. Tarayıcıyı kapatıp açınca hâlâ girişli olmalı
5. Manuel çıkış sonrası tekrar şifre ile giriş
