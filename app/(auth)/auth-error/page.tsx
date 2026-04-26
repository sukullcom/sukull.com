import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertTriangle, Search, Lightbulb, RefreshCw, Home } from 'lucide-react';

interface AuthErrorPageProps {
  searchParams: {
    /** @deprecated Legacy field kept only so old links don't 404. New
     *  callbacks pass `error_code` with a stable, documented code. */
    error?: string;
    error_code?: string;
  };
}

type ErrorDetails = {
  title: string;
  description: string;
  possibleCauses: string[];
  solutions: string[];
};

// Stable code → user-facing copy. The callback route (and any other
// surface that redirects here) MUST pass one of these codes via
// `error_code` rather than the raw Supabase / Postgres error message:
// that message can include table names, token fragments, or internal
// hostnames that leak into browser history and Referer headers.
const ERROR_COPY: Record<string, ErrorDetails> = {
  bad_oauth_state: {
    title: 'OAuth Durum Hatası',
    description:
      'OAuth kimlik doğrulama süreci sırasında bir durum hatası oluştu.',
    possibleCauses: [
      'Oturum süresi dolmuş olabilir',
      'Tarayıcı çerezleri engellenmiş olabilir',
      'Sayfa çok uzun süre açık kalmış olabilir',
      'Teknik bir yapılandırma sorunu',
    ],
    solutions: [
      'Tarayıcınızı yenileyin ve tekrar deneyin',
      'Çerezleri temizleyin ve gizli pencerede deneyin',
      'Farklı bir tarayıcı kullanarak deneyin',
      'Birkaç dakika bekleyip tekrar deneyin',
    ],
  },
  otp_verify_failed: {
    title: 'Doğrulama Bağlantısı Geçersiz',
    description:
      'E-postanızdaki doğrulama bağlantısı süresi dolmuş veya daha önce kullanılmış olabilir.',
    possibleCauses: [
      'Bağlantının süresi dolmuş (genelde 1 saat)',
      'Bağlantı daha önce kullanılmış',
      'Bağlantı kopyalanırken bozulmuş olabilir',
    ],
    solutions: [
      'Giriş ekranından yeni bir doğrulama bağlantısı isteyin',
      'E-postayı aynı tarayıcıda açtığınızdan emin olun',
      'Sorun sürerse destek ekibine ulaşın',
    ],
  },
  code_exchange_failed: {
    title: 'Oturum Oluşturulamadı',
    description:
      'Girişinizi tamamlamak için gerekli güvenlik kodu doğrulanamadı.',
    possibleCauses: [
      'Tarayıcı çerezleri temizlendi veya engellendi',
      'Aynı bağlantıyı iki farklı tarayıcıda açtınız',
      'Geçici bir sunucu problemi',
    ],
    solutions: [
      'Giriş sayfasından yeniden deneyin',
      'Gizli pencere kapalıysa çerezlere izin verin',
      'Birkaç dakika bekleyip tekrar deneyin',
    ],
  },
  missing_params: {
    title: 'Eksik Doğrulama Parametresi',
    description:
      'Kimlik doğrulama bağlantısı eksik veya bozuk bir biçimde açıldı.',
    possibleCauses: [
      'E-postadaki bağlantı tam kopyalanmadı',
      'Bağlantıya dışarıdan erişildi',
    ],
    solutions: [
      'E-postadaki bağlantıyı doğrudan tıklayın',
      'Giriş sayfasından yeni bir bağlantı talep edin',
    ],
  },
  callback_unexpected: {
    title: 'Beklenmeyen Bir Hata Oluştu',
    description:
      'Giriş işleminiz tamamlanırken beklenmeyen bir sorun yaşandı. Lütfen tekrar deneyin.',
    possibleCauses: [
      'Geçici bir sunucu sorunu',
      'İnternet bağlantısı problemi',
    ],
    solutions: [
      'Sayfayı yenileyin ve tekrar deneyin',
      'Birkaç dakika bekleyip tekrar deneyin',
      'Sorun devam ederse destek ekibiyle iletişime geçin',
    ],
  },
};

const DEFAULT_ERROR_COPY: ErrorDetails = {
  title: 'Kimlik Doğrulama Hatası',
  description:
    'Giriş sürecinde bir sorun oluştu. Lütfen tekrar deneyin veya destek ekibine ulaşın.',
  possibleCauses: [
    'Geçici bir sunucu sorunu',
    'İnternet bağlantısı problemi',
    'Hesap doğrulama sorunu',
  ],
  solutions: [
    'Sayfayı yenileyin ve tekrar deneyin',
    'İnternet bağlantınızı kontrol edin',
    'Birkaç dakika bekleyip tekrar deneyin',
  ],
};

export default function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  // `searchParams.error` is the legacy free-text payload that older
  // deploys of the callback route may still emit; we intentionally
  // ignore its value (it can contain raw upstream messages we don't
  // want to render) and rely solely on the documented `error_code`
  // → copy mapping below.
  const { error_code } = searchParams;

  const errorDetails = (error_code && ERROR_COPY[error_code]) || DEFAULT_ERROR_COPY;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-135px)] gap-6 p-4 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2 flex items-center justify-center gap-2"><AlertTriangle className="w-6 h-6" /> {errorDetails.title}</h1>
        <p className="text-gray-600 mb-4">{errorDetails.description}</p>
        
        {/* Only surface a stable error CODE (not the raw server
            message) so support teams can correlate with `error_log`
            but browser history / screenshots don't leak backend
            internals. */}
        {error_code && (
          <div className="bg-gray-100 p-3 rounded-lg text-sm text-left mb-4">
            <strong>Hata Kodu:</strong> {error_code}
          </div>
        )}
      </div>

      {/* Possible causes */}
      <div className="w-full bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-1.5"><Search className="w-4 h-4" /> Olası Nedenler:</h3>
        <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
          {errorDetails.possibleCauses.map((cause, index) => (
            <li key={index}>{cause}</li>
          ))}
        </ul>
      </div>

      {/* Solutions */}
      <div className="w-full bg-green-50 p-4 rounded-lg">
        <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-1.5"><Lightbulb className="w-4 h-4" /> Çözüm Önerileri:</h3>
        <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
          {errorDetails.solutions.map((solution, index) => (
            <li key={index}>{solution}</li>
          ))}
        </ul>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Button asChild className="flex-1">
          <Link prefetch={false} href="/login" className="flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4" /> Tekrar Giriş Yap</Link>
        </Button>
        <Button asChild variant="primaryOutline" className="flex-1">
          <Link prefetch={false} href="/" className="flex items-center justify-center gap-2"><Home className="w-4 h-4" /> Ana Sayfaya Dön</Link>
        </Button>
      </div>

      {/* Additional help */}
      <div className="text-center text-sm text-gray-500 mt-4">
        <p>Sorun devam ederse, lütfen destek ekibiyle iletişime geçin.</p>
      </div>
    </div>
  );
}
