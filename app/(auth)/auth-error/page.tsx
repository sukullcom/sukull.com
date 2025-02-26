import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AuthErrorPageProps {
  searchParams: { error?: string };
}

export default function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { error: errorMessage } = searchParams;

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-135px)] gap-4 p-4">
      <h2 className="text-lg font-bold">Hesap işlemleri sırasında Bir Hata Oluştu</h2>
      <p className="text-sm text-muted-foreground">
        {errorMessage}
        <ul className="list-disc list-inside mt-2">
          <li>Kullanım zamanı dolmuş bir bağlantı</li>
          <li>İptal edilmiş bir OAuth süreci</li>
          <li>Tekniki bir sorun</li>
        </ul>
      </p>
      <Button asChild className="w-full">
        <Link href="/login">Tekrar Gİrİş Yap</Link>
      </Button>
      <Button asChild variant="primaryOutline" className="w-full">
        <Link href="/">Ana Sayfaya Dön</Link>
      </Button>
    </div>
  );
}
