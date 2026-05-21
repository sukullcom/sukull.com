"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { CreditCard, Loader2, InfinityIcon } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { clientLogger } from '@/lib/client-logger';
import { isValidTcKimlik } from '@/lib/tc-kimlik';
import { getPaymentServerBaseUrl } from '@/lib/payment-server-base-url';
import { PaymentTrustStrip } from '@/components/payment-trust-strip';

type SubscriptionPurchaseProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function SubscriptionPurchase({ onCancel }: SubscriptionPurchaseProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Card information state
  const [cardNumber, setCardNumber] = useState('');
  const [expireMonth, setExpireMonth] = useState('');
  const [expireYear, setExpireYear] = useState('');
  const [cvc, setCvc] = useState('');
  const [holderName, setHolderName] = useState('');

  // Billing address state
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [identityNumber, setIdentityNumber] = useState('');

  const [agreeDistanceSales, setAgreeDistanceSales] = useState(false);
  const [agreePreInfo, setAgreePreInfo] = useState(false);

  const handlePayment = async () => {
    if (loading) return;

    if (!agreeDistanceSales || !agreePreInfo) {
      toast.error(
        "Devam edebilmek için Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu'nu onaylamanız gerekir.",
      );
      return;
    }

    setLoading(true);

    const errors: string[] = [];
    if (!holderName.trim() || !cardNumber.trim() || !expireMonth.trim() || !expireYear.trim() || !cvc.trim()) {
      errors.push('Kart bilgileri eksik');
    }
    if (!contactName.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      errors.push('Fatura adresi eksik');
    }
    const tc = identityNumber.replace(/\D/g, '');
    if (!isValidTcKimlik(tc)) {
      errors.push('TC kimlik geçersiz');
    }
    if (errors.length > 0) {
      toast.error(`Lütfen şu alanları kontrol et: ${errors.join(', ')}.`);
      setLoading(false);
      return;
    }

    const idempotencyKey =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `sub_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const paymentData = {
      identityNumber: tc,
      idempotencyKey,
      paymentCard: {
        cardHolderName: holderName,
        cardNumber: cardNumber.replace(/\s/g, ''), // Remove spaces
        expireMonth: expireMonth.padStart(2, '0'),
        expireYear: expireYear,
        cvc: cvc
      },
      billingAddress: {
        contactName: contactName,
        phone: phone,
        address: address,
        city: city,
        country: 'Turkey',
        zipCode: zipCode
      }
    };

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
        return;
      }

      const paymentServerUrl = getPaymentServerBaseUrl();

      // Canlıda çoğu kart 3DS olmadan reddedilir; kredi akışındaki gibi abonelik de
      // her zaman 3-D Secure ile başlatılır (initialize → banka OTP → sonuç sayfasında finalize).
      const callbackUrl = new URL('/api/payment/3ds/callback', window.location.origin);
      callbackUrl.searchParams.set('flow', 'subscription');

      const initUrl = `${paymentServerUrl}${paymentServerUrl.endsWith('/') ? '' : '/'}api/payment/3ds/initialize-subscribe`;
      const initResponse = await fetch(initUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...paymentData,
          callbackUrl: callbackUrl.toString(),
        }),
      });
      const initJson = (await initResponse.json()) as {
        success?: boolean;
        message?: string;
        threeDSHtmlContent?: string;
      };
      if (!initResponse.ok || !initJson.success || !initJson.threeDSHtmlContent) {
        toast.error(initJson.message || '3D Secure başlatılamadı. Lütfen tekrar deneyin.');
        return;
      }

      let decoded: string;
      try {
        decoded = atob(initJson.threeDSHtmlContent);
      } catch {
        toast.error('3D Secure yanıtı bozuk. Lütfen tekrar deneyin.');
        return;
      }
      document.open();
      document.write(decoded);
      document.close();
      return;
    } catch (error: unknown) {
      clientLogger.error({ message: 'subscription payment failed', error, location: 'subscription-purchase/payment' });
      toast.error('Abonelik ödemesi sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Add space every 4 digits
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Son kullanma tarihi: kullanıcının tek bir "AA/YY" kutusu görmesini
  // sağlıyoruz; alttaki state hâlâ ay/yıl ayrı duruyor ki payload (Iyzico)
  // değişmesin.
  const formatExpiry = (month: string, year: string) => {
    if (!month && !year) return '';
    if (year) return `${month}/${year}`;
    return month;
  };
  const parseExpiry = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    return {
      month: digits.slice(0, 2),
      year: digits.slice(2, 4),
    };
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <CreditCard className="h-8 w-8 text-suk-payment" />
            <InfinityIcon className="absolute -top-1 -right-1 h-4 w-4 text-suk-payment" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Premium platform hizmeti</h1>
            <p className="text-muted-foreground">
              Tek seferlik 100₺ — 30 gün süreyle sınırsız can ve profilde detaylı analiz
            </p>
          </div>
        </div>

        {/* Subscription Package Summary */}
        <Card className="mb-6 border border-suk-payment-ring/40 bg-gradient-to-r from-suk-payment-soft to-suk-play-soft">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg text-foreground">Premium — 30 günlük paket</h3>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Sınırsız kalp (yanlışta can düşmez)</li>
                  <li>• Profil → Analiz: konu/kurs performansı, zorluk ve soru türü dağılımı</li>
                  <li>• Kesintisiz çözüm deneyimi</li>
                  <li>• 30 gün geçerlidir; otomatik yenileme yoktur, süre bitince tekrar satın alınır</li>
                </ul>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-suk-payment">100₺</div>
                <div className="text-sm text-muted-foreground">30 gün</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Ödeme Bilgileri</h2>
        
        {/* Payment Card Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Kart Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Kart Numarası</label>
              <Input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => formatCardNumber(e.target.value)}
                maxLength={19}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Son kullanma (AA/YY)
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="AA/YY"
                  value={formatExpiry(expireMonth, expireYear)}
                  onChange={(e) => {
                    const { month, year } = parseExpiry(e.target.value);
                    setExpireMonth(month);
                    setExpireYear(year);
                  }}
                  maxLength={5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CVC</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="123"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  maxLength={3}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Kart Sahibi</label>
              <Input
                type="text"
                placeholder="AD SOYAD"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value.toUpperCase())}
              />
            </div>
          </CardContent>
        </Card>

        {/* Billing Address Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Fatura Adresi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ad Soyad</label>
              <Input
                type="text"
                placeholder="Ahmet Yılmaz"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">TC Kimlik Numarası</label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="11 haneli TC kimlik numarası"
                value={identityNumber}
                onChange={(e) =>
                  setIdentityNumber(e.target.value.replace(/\D/g, '').slice(0, 11))
                }
                maxLength={11}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ödeme yasası gereği zorunludur; saklanmaz, sadece bankanıza iletilir.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Telefon</label>
              <Input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0535 123 45 67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Adres</label>
              <Input
                type="text"
                placeholder="Mahalle, Sokak, No"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Şehir</label>
                <Input
                  type="text"
                  placeholder="İstanbul"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Posta Kodu</label>
                <Input
                  type="text"
                  placeholder="34000"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 rounded-2xl border border-border/90 bg-muted/80 p-4 text-sm text-foreground">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={agreeDistanceSales}
              onChange={(e) => setAgreeDistanceSales(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-input text-suk-payment focus:ring-2 focus:ring-suk-payment/25"
            />
            <span>
              <a
                href="/yasal/mesafeli-satis"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-suk-payment-soft-fg underline decoration-suk-payment/40 underline-offset-2 hover:text-suk-payment"
              >
                Mesafeli Satış Sözleşmesi
              </a>
              {"'ni okudum ve kabul ediyorum."}
            </span>
          </label>
          <label className="mt-4 flex items-start gap-3">
            <input
              type="checkbox"
              checked={agreePreInfo}
              onChange={(e) => setAgreePreInfo(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-input text-suk-payment focus:ring-2 focus:ring-suk-payment/25"
            />
            <span>
              <a
                href="/yasal/on-bilgilendirme"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-suk-payment-soft-fg underline decoration-suk-payment/40 underline-offset-2 hover:text-suk-payment"
              >
                Ön Bilgilendirme Formu
              </a>
              {"'nu okudum, bilgilendirildim ve onaylıyorum."}
            </span>
          </label>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Bu ödeme tek seferliktir; kartınızdan otomatik yenileme tahsilatı yapılmaz. Süre
            sonunda Premium&apos;u sürdürmek için yeniden satın almanız gerekir.
          </p>
        </div>

        <div className="mt-4 flex flex-col items-center gap-2">
          <PaymentTrustStrip variant="compact" />
          <p className="text-center text-[11px] text-muted-foreground">
            <a
              href="/yasal/teslimat-ve-iade"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground"
            >
              Teslimat ve İade Şartları
            </a>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-4">
          <Button 
            onClick={onCancel}
            variant="muted"
            className="flex-1"
            disabled={loading}
          >
            İptal
          </Button>
          <Button 
            onClick={handlePayment}
            disabled={loading || !agreeDistanceSales || !agreePreInfo}
            variant="payment"
            className="flex-1"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ödeme İşleniyor...
              </>
            ) : (
              "100₺ Öde ve Aktifleştir"
            )}
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center mt-4">
          Ödemeniz güvenli bir şekilde iyzico altyapısı ile işlenmektedir.
        </p>
      </div>
    </div>
  );
} 