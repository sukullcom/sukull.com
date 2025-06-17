"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { CreditCard, Loader2, InfinityIcon } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

type SubscriptionPurchaseProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function SubscriptionPurchase({ onSuccess, onCancel }: SubscriptionPurchaseProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
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

  const handlePayment = async () => {
    if (loading) return;

    setLoading(true);

    // Validate form fields
    if (!holderName.trim() || !cardNumber.trim() || !expireMonth.trim() || !expireYear.trim() || !cvc.trim()) {
      toast.error('Lütfen tüm kart bilgilerini doldurun');
      setLoading(false);
      return;
    }

    if (!contactName.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      toast.error('Lütfen tüm fatura adresi bilgilerini doldurun');
      setLoading(false);
      return;
    }

    const paymentData = {
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

      // Use the same payment server URL pattern as credit purchase
      const paymentServerUrl = process.env.NEXT_PUBLIC_PAYMENT_SERVER_URL || 
        (process.env.NODE_ENV === 'production' ? 'https://sukullcom-production.up.railway.app' : 'http://localhost:3001');
      
      // Call the subscription payment endpoint on Railway
      const apiUrl = `${paymentServerUrl}${paymentServerUrl.endsWith('/') ? '' : '/'}api/payment/subscribe`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Sonsuz can aboneliği başarıyla aktifleştirildi! Artık sınırsız kalp kullanabilirsiniz.');
        // Refresh the page to update the subscription status
        router.refresh();
        onSuccess?.();
      } else {
        toast.error('Abonelik ödemesi başarısız: ' + (result.message || 'Bilinmeyen hata'));
      }
    } catch (error: unknown) {
      console.error('Subscription payment error:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Abonelik ödemesi sırasında hata oluştu';
      toast.error(errorMessage);
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

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <CreditCard className="h-8 w-8 text-purple-600" />
            <InfinityIcon className="absolute -top-1 -right-1 h-4 w-4 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Sonsuz Can Aboneliği</h1>
            <p className="text-gray-600">Aylık 100₺ ile sınırsız kalp kullanın</p>
          </div>
        </div>

        {/* Subscription Package Summary */}
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">Sonsuz Can - Aylık Abonelik</h3>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  <li>• Sınırsız kalp kullanımı</li>
                  <li>• Yanlış cevapta kalp kaybı yok</li>
                  <li>• Kesintisiz öğrenme deneyimi</li>
                  <li>• Aylık otomatik yenileme</li>
                </ul>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-600">100₺</div>
                <div className="text-sm text-gray-500">Aylık</div>
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
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ay</label>
                <Input
                  type="text"
                  placeholder="MM"
                  value={expireMonth}
                  onChange={(e) => setExpireMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Yıl</label>
                <Input
                  type="text"
                  placeholder="YY"
                  value={expireYear}
                  onChange={(e) => setExpireYear(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CVC</label>
                <Input
                  type="text"
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
                placeholder="JOHN DOE"
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
                placeholder="John Doe"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Telefon</label>
              <Input
                type="tel"
                placeholder="+90 535 123 45 67"
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

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button 
            onClick={onCancel}
            variant="secondary"
            className="flex-1"
            disabled={loading}
          >
            İptal
          </Button>
          <Button 
            onClick={handlePayment}
            disabled={loading}
            variant="primary"
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
        
        <p className="text-xs text-gray-500 text-center mt-4">
          Bu bir test ödeme sistemidir. Gerçek kart bilgileri kullanmayın.
          <br />
          Test kartı: 5890040000000016, Son kullanma: 12/25, CVC: 123
        </p>
      </div>
    </div>
  );
} 