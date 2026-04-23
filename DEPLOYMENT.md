# Sukull — Deployment Guide

Sukull, iki servisli (split) bir deploy kullanır:

- **Vercel** — Next.js uygulaması (`sukull.com`)
- **Railway** — bağımsız Node.js ödeme sunucusu (Iyzico SDK serverless'te güvenilir
  çalışmadığı için izole edildi)

```
┌─────────────────┐  API calls   ┌────────────────────┐
│ Vercel          │ ───────────► │ Railway            │
│ Next.js app     │              │ payment-server     │
│ sukull.com      │              │ (Node + Iyzico SDK)│
└─────────────────┘              └────────────────────┘
          │                                │
          ▼                                ▼
    ┌─────────────┐              ┌────────────────┐
    │ Supabase    │              │   Iyzico API   │
    │ (Postgres   │              └────────────────┘
    │  + Auth)    │
    └─────────────┘
```

## 1. Repo yapısı

```
sukull.com/
├── app/                    → Next.js routes (Vercel)
├── components/             → Next.js UI (Vercel)
├── lib/, hooks/, utils/    → Next.js (Vercel)
├── payment-server/         → Express ödeme sunucusu (Railway)
│   ├── server.js
│   └── package.json
├── supabase/migrations/    → SQL migrasyonları (manuel veya drizzle-kit)
├── vercel.json             → Vercel config (cron dahil)
└── railway.json            → Railway config (payment-server için)
```

Her iki servis de aynı repodan deploy edilir; Railway sadece `payment-server/`
altındaki kodu çalıştırır (`railway.json` içinde `buildCommand`/`startCommand`
tanımlıdır).

## 2. Supabase hazırlığı

1. Supabase projesi oluştur.
2. **Project Settings → Database → Connection String**'den üç URL'i al:
   - `postgresql://...pooler.supabase.com:6543/postgres` → `DATABASE_URL`
     (transaction pooler; runtime için)
   - `postgresql://...pooler.supabase.com:5432/postgres` → `DIRECT_URL`
     (session pooler; sadece `drizzle-kit` migrasyonları için)
3. Migrasyonları uygula:

   ```bash
   # Yerel makineden, .env içinde DIRECT_URL dolu olduğundan emin ol
   npx drizzle-kit push
   ```

   Alternatif: `supabase/migrations/*.sql` dosyalarını Supabase SQL Editor'e
   sırayla yapıştır.

## 3. Payment Server (Railway)

1. [railway.app](https://railway.app) üzerinden yeni proje → GitHub repo'ya bağla.
2. Environment Variables:

   ```bash
   NODE_ENV=production
   PORT=3001

   DATABASE_URL=postgres://...pooler.supabase.com:6543/postgres
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=...

   IYZICO_API_KEY=...
   IYZICO_SECRET_KEY=...
   IYZICO_BASE_URL=https://api.iyzipay.com

   NEXT_PUBLIC_APP_URL=https://sukull.com
   ```

3. `railway.json` zaten şu değerlerle yapılandırılmış:
   - Build: `cd payment-server && npm ci --omit=dev`
   - Start: `cd payment-server && node server.js`
4. Deploy sonrası sağlık kontrolü:
   ```
   GET https://<your-app>.up.railway.app/health
   ```
   `{"success":true,"services":{"supabase":true,"database":true,"iyzico":true}}`
   dönmeli.

## 4. Next.js App (Vercel)

1. Vercel'de **Import Project** ile GitHub repo'yu bağla.
2. Environment Variables (Production):

   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...

   # Database (transaction pooler)
   DATABASE_URL=postgres://...pooler.supabase.com:6543/postgres

   # Payment server (Railway URL'i)
   NEXT_PUBLIC_PAYMENT_SERVER_URL=https://<your-app>.up.railway.app

   # Admin listesi (virgülle ayrılmış e-postalar)
   ADMIN_EMAILS=admin1@example.com,admin2@example.com

   # Cron secret (manual tetikleme ve opsiyonel ekstra koruma için)
   CRON_SECRET=<uzun-random-string>

   # App
   NEXT_PUBLIC_APP_URL=https://sukull.com
   NODE_ENV=production
   ```

3. **Domain**: Vercel dashboard → Domains → `sukull.com` ve `www.sukull.com`
   ekle, DNS'i Vercel'e yönlendir.
4. **Cron jobs**: `vercel.json` içinde tanımlı (`/api/cron/daily`). Hobby
   planında günde 1 kez çalışır; Pro plana geçince sıklığı ayarlayabilirsin.

## 5. Geliştirme

```bash
# Her ikisi birden
npm run dev:full

# Veya ayrı terminaller
npm run dev              # Next.js → localhost:3000
npm run payment-server   # Express → localhost:3001
```

`.env.local` örneği:

```bash
NEXT_PUBLIC_PAYMENT_SERVER_URL=http://localhost:3001
DATABASE_URL=postgres://...pooler.supabase.com:6543/postgres
DIRECT_URL=postgres://...pooler.supabase.com:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
IYZICO_API_KEY=sandbox-...
IYZICO_SECRET_KEY=sandbox-...
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
ADMIN_EMAILS=you@example.com
```

## 6. CORS (payment-server)

`payment-server/server.js` `NEXT_PUBLIC_APP_URL` ortam değişkenini origin
beyaz listesine ekler. Production'da sadece `https://sukull.com` ve
`https://www.sukull.com` erişebilir.

## 7. Test checklist

- [ ] Migrasyonlar uygulandı (`npx drizzle-kit push` başarılı)
- [ ] Railway `/health` yeşil
- [ ] Vercel build geçti, `sukull.com` açılıyor
- [ ] Admin hesap girişi → `/admin` erişilebiliyor
- [ ] Öğrenci hesabı → test ödeme başarılı (sandbox)
- [ ] Günlük cron manuel tetikleme:
      `curl -H "Authorization: Bearer $CRON_SECRET" https://sukull.com/api/cron/daily`

## 8. İzleme

- **Vercel Logs** → Next.js runtime hataları
- **Railway Logs** → ödeme sunucusu hataları
- **`/admin/errors`** → uygulama genelindeki Postgres-backed hata kayıtları
- **`/admin/audit`** → yönetici eylemlerinin forensic izi
- **`/admin/analytics`** → kullanım istatistikleri
