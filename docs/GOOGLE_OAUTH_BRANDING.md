# Google ile giriş — «Sukull» markası (OAuth ekranı)

Kullanıcı «Google ile devam et» dediğinde Google şunu gösterebilir:

```text
Choose an account
to continue to bgmltlmpjkxojmotnhlv.supabase.co
```

Bu **normal**dir: OAuth akışı önce Supabase Auth sunucusundan geçer; Google ekranda **redirect URI’nin host adını** yazar. Uygulama kodundan (`signInWithOAuth`) bu metni «Sukull» diye değiştirmek **mümkün değildir**.

İki katmanlı düzeltme:

1. **Google OAuth consent screen** → uygulama adı «Sukull», logo, ana sayfa (güven + bazı ekranlarda marka).
2. **Supabase özel auth domain** (önerilen) → `auth.sukull.com` gibi okunaklı host; `*.supabase.co` yerine kendi alt alan adınız görünür.

---

## 1) Google Cloud Console — uygulama adı «Sukull»

1. [Google Cloud Console](https://console.cloud.google.com/) → Supabase’te kullandığınız **aynı proje** (Google provider Client ID’nin bağlı olduğu proje).
2. **APIs & Services** → **OAuth consent screen**.
3. **App information**:
   - **App name:** `Sukull`
   - **User support email:** destek e-postanız
   - **App logo:** kare logo (ör. maskot PNG, min. 120×120)
   - **Application home page:** `https://sukull.com`
   - **Privacy policy:** `https://sukull.com/yasal/gizlilik`
   - **Terms of service:** `https://sukull.com/yasal/kullanim-sartlari`
4. **Authorized domains** (ekleyin):
   - `sukull.com`
   - `supabase.co` (Supabase callback için gerekli olabilir)
5. **Publishing status:** Test modundaysa test kullanıcıları ekleyin; canlıda **Production** + gerekirse doğrulama.

**Credentials** → OAuth 2.0 Client ID (Web application):

- **Authorized JavaScript origins:** `https://sukull.com` (ve varsa `http://localhost:3000` geliştirme için)
- **Authorized redirect URIs** — Supabase’teki ile **birebir aynı** olmalı (aşağıdaki 2. bölüm).

> Consent screen’deki «Sukull» adı üst başlıkta görünür; «to continue to …» satırı çoğu zaman **host adını** göstermeye devam eder.

---

## 2) Supabase — Site URL ve redirect listesi

[Supabase Dashboard](https://supabase.com/dashboard) → proje → **Authentication** → **URL Configuration**:

| Alan | Değer |
|------|--------|
| **Site URL** | `https://sukull.com` |
| **Redirect URLs** | `https://sukull.com/api/auth/callback` |
| | `http://localhost:3000/api/auth/callback` (geliştirme) |

**Authentication** → **Providers** → **Google**:

- Kendi Google Client ID / Secret kullanıyorsanız yukarıdaki redirect URI’ler Google Console’da da kayıtlı olmalı.
- Varsayılan Supabase redirect (custom domain yokken):

```text
https://<PROJECT_REF>.supabase.co/auth/v1/callback
```

`<PROJECT_REF>` sizde `bgmltlmpjkxojmotnhlv` — Google’ın gösterdiği metin buradan gelir.

---

## 3) Önerilen: Supabase Custom Auth Domain

Böylece Google’da şuna benzer görünür:

```text
to continue to auth.sukull.com
```

(`Sukull` kelimesi değil, ama `*.supabase.co` rastgele ref’ten çok daha okunaklı.)

1. Supabase → **Project Settings** → **Custom Domains** (veya **Authentication** → custom domain bölümü — planınıza göre menü değişebilir).
2. Auth için alt alan adı: örn. `auth.sukull.com`.
3. DNS’te verilen **CNAME** kaydını domain sağlayıcınızda oluşturun; doğrulamayı tamamlayın.
4. **Google Cloud** → OAuth client → **Authorized redirect URIs** güncelleyin:

```text
https://auth.sukull.com/auth/v1/callback
```

(Eski `https://bgmltlmpjkxojmotnhlv.supabase.co/auth/v1/callback` satırını custom domain aktif olduktan sonra kaldırabilirsiniz.)

5. Supabase Google provider ayarlarının yeni domain ile uyumlu olduğundan emin olun.

Detay: [Supabase — Custom Domains](https://supabase.com/docs/guides/platform/custom-domains).

---

## 4) Ortam değişkenleri (Sukull Next.js)

`.env` / Vercel:

```env
NEXT_PUBLIC_APP_URL=https://sukull.com
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
```

Custom auth domain kullanıyorsanız Supabase dokümantasyonuna göre `NEXT_PUBLIC_SUPABASE_URL` güncellenip güncellenmeyeceğini kontrol edin (çoğu kurulumda proje URL’si aynı kalır, yalnızca OAuth host değişir).

---

## 5) Kod tarafı (zaten doğru)

- `utils/auth.ts` → `signInWithOAuth('google')` → `redirectTo`: `https://sukull.com/api/auth/callback` (`lib/oauth-callback-url.ts`).
- Giriş sonrası kullanıcı **sukull.com**’a döner; Google’daki ara ekran yine Supabase/Google host’unu gösterir.

Ek `queryParams` ile «Sukull» yazdırmak **desteklenmez**. `hd` parametresi yalnızca Google Workspace kurumsal alan adları içindir.

---

## Kontrol listesi

- [ ] Google consent screen **App name** = Sukull, logo + yasal linkler
- [ ] Supabase **Site URL** = `https://sukull.com`
- [ ] Redirect URLs’te `/api/auth/callback`
- [ ] Google redirect URI = Supabase callback (custom domain veya `*.supabase.co`)
- [ ] (İsteğe bağlı) `auth.sukull.com` custom domain

Değişikliklerden sonra gizli pencerede «Google ile devam et» ile tekrar deneyin; Google önbelleği bazen eski consent ekranını bir süre tutar.
