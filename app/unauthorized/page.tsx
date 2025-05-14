import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-sm border text-center">
        <div className="mb-6 flex justify-center">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Erişim Engellendi</h1>
        
        <p className="text-gray-600 mb-6">
          Bu sayfaya erişmek için gerekli izinlere sahip değilsiniz. Lütfen hesap durumunuzu kontrol edin veya yardım için destek ekibimize başvurun.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default">
            <Link href="/">
              Ana Sayfaya Dön
            </Link>
          </Button>
          
          <Button asChild variant="primaryOutline">
            <Link href="/login">
              Giriş Yap
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 