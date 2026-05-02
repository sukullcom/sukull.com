import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="max-w-md w-full p-8 bg-card rounded-xl shadow-sm border border-border text-center">
        <div className="mb-6 flex justify-center">
          <div className="h-16 w-16 rounded-full bg-suk-danger-soft flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-suk-danger" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-2 text-foreground">Erişim Engellendi</h1>
        
        <p className="text-muted-foreground mb-6">
          Bu sayfaya erişmek için gerekli izinlere sahip değilsiniz. Lütfen hesap durumunuzu kontrol edin veya yardım için destek ekibimize başvurun.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="muted">
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