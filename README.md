# Sukull - Eğitim Platformu

## Deployment

Sukull artık [https://sukull.com](https://sukull.com) adresinde yayında!

## Geliştirme

### Gereksinimler

- Node.js 18.0.0 veya üstü
- npm veya yarn
- Supabase hesabı

### Yerel Ortamda Çalıştırma

1. Repoyu klonlayın:
   ```bash
   git clone <repo-url>
   cd sukull
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. `.env` dosyasını düzenleyin:
   ```
   # Yerel geliştirme için
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. Uygulamayı çalıştırın:
   ```bash
   npm run dev
   ```

### Vercel'e Dağıtım

1. Vercel hesabınıza giriş yapın
2. "New Project" seçeneğine tıklayın
3. Repoyu bağlayın
4. Environment variables kısmına `.env` dosyasındaki değişkenleri ekleyin
5. "Deploy" butonuna tıklayın

### Domain Ayarları

1. GoDaddy'den alınan sukull.com domaini Vercel'e bağlanmalıdır
2. GoDaddy DNS ayarlarından şu kayıtları ekleyin:
   - A kaydı: @ -> 76.76.21.21
   - CNAME kaydı: www -> sukull.com
3. Vercel dashboard'da "Domains" sekmesinden sukull.com ekleyin

## Özellikler

- Özel ders rezervasyonu
- Öğretmen ve öğrenci panoları
- Kurs içerikleri
- Quiz sistemi
- ve daha fazlası...