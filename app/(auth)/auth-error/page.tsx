import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertTriangle, Search, Lightbulb, RefreshCw, Home } from 'lucide-react';

interface AuthErrorPageProps {
  searchParams: { 
    error?: string;
    error_code?: string;
    error_description?: string;
  };
}

export default function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { error: errorMessage, error_code, error_description } = searchParams;

  // Parse the error details
  const getErrorDetails = () => {
    if (error_code === 'bad_oauth_state') {
      return {
        title: 'OAuth Durum Hatası',
        description: 'OAuth kimlik doğrulama süreci sırasında bir durum hatası oluştu.',
        possibleCauses: [
          'Oturum süresi dolmuş olabilir',
          'Tarayıcı çerezleri engellenmiş olabilir',
          'Sayfa çok uzun süre açık kalmış olabilir',
          'Teknik bir yapılandırma sorunu'
        ],
        solutions: [
          'Tarayıcınızı yenileyin ve tekrar deneyin',
          'Çerezleri temizleyin ve gizli pencerede deneyin',
          'Farklı bir tarayıcı kullanarak deneyin',
          'Birkaç dakika bekleyip tekrar deneyin'
        ]
      };
    }

    return {
      title: 'Kimlik Doğrulama Hatası',
      description: errorMessage || error_description || 'Bilinmeyen bir hata oluştu',
      possibleCauses: [
        'Geçici bir sunucu sorunu',
        'İnternet bağlantısı problemi',
        'Hesap doğrulama sorunu'
      ],
      solutions: [
        'Sayfayı yenileyin ve tekrar deneyin',
        'İnternet bağlantınızı kontrol edin',
        'Birkaç dakika bekleyip tekrar deneyin'
      ]
    };
  };

  const errorDetails = getErrorDetails();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-135px)] gap-6 p-4 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2 flex items-center justify-center gap-2"><AlertTriangle className="w-6 h-6" /> {errorDetails.title}</h1>
        <p className="text-gray-600 mb-4">{errorDetails.description}</p>
        
        {/* Error code details for debugging */}
        {(error_code || errorMessage) && (
          <div className="bg-gray-100 p-3 rounded-lg text-sm text-left mb-4">
            <strong>Teknik Detaylar:</strong>
            <br />
            {error_code && <span>Hata Kodu: {error_code}<br /></span>}
            {errorMessage && <span>Mesaj: {errorMessage}<br /></span>}
            {error_description && <span>İpucu: {decodeURIComponent(error_description)}</span>}
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
