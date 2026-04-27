'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, CreditCard, MapPin } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { clientLogger } from '@/lib/client-logger'

interface CreditPackage {
  id: string
  credits: number
  price: number
  popular?: boolean
}

// Quantity-based discount packages. Per-credit price falls as you
// buy more; the `popular` flag biases the initial selection toward
// the 4-pack which has the best early discount.
//
// These are placeholders — pricing is a business lever, not a
// contract. If you want to change them, update here and in the
// payment server's price list so checkout validates.
const creditPackages: CreditPackage[] = [
  { id: '1', credits: 1, price: 40 },
  { id: '4', credits: 4, price: 140, popular: true },
  { id: '10', credits: 10, price: 300 },
  { id: '25', credits: 25, price: 650 },
]

export default function CreditPurchase() {
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage>(creditPackages[1])
  const [userCredits, setUserCredits] = useState({ totalCredits: 0, availableCredits: 0 })
  const [loading, setLoading] = useState(false)
  const [loadingCredits, setLoadingCredits] = useState(true)

  // Payment form state
  const [cardNumber, setCardNumber] = useState('')
  const [expireMonth, setExpireMonth] = useState('')
  const [expireYear, setExpireYear] = useState('')
  const [cvc, setCvc] = useState('')
  const [holderName, setHolderName] = useState('')

  // Billing address state
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [identityNumber, setIdentityNumber] = useState('')

  // Legal acknowledgement — required before "Öde" unlocks. Distinct
  // state flags for each document so we can tell which one was missed
  // (e.g. for localized inline error messages) and so the checkbox
  // state survives re-renders of the parent.
  const [agreeDistanceSales, setAgreeDistanceSales] = useState(false)
  const [agreePreInfo, setAgreePreInfo] = useState(false)

  const supabase = createClient()

  // Load user credits on component mount
  useEffect(() => {
    fetchUserCredits()
  }, [])

  const fetchUserCredits = async () => {
    try {
      const response = await axios.get('/api/user/credits')
      setUserCredits(response.data)
    } catch (error) {
      clientLogger.error({ message: 'fetch credits failed', error, location: 'credit-purchase/fetchCredits' })
      toast.error('Kredi bilgileri yüklenirken hata oluştu')
    } finally {
      setLoadingCredits(false)
    }
  }

  const handlePayment = async () => {
    if (loading) return

    // Yasal onay — butonu zaten `disabled` yapıyoruz ama hem klavye
    // tetiklemelerine karşı hem de future refactor'larda bir güvenlik
    // ağı olarak sunucuya gitmeden önce burada da blokluyoruz.
    if (!agreeDistanceSales || !agreePreInfo) {
      toast.error(
        "Devam edebilmek için Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu'nu onaylamanız gerekir.",
      )
      return
    }

    setLoading(true)

    // Validate form fields
    if (!holderName.trim() || !cardNumber.trim() || !expireMonth.trim() || !expireYear.trim() || !cvc.trim()) {
      toast.error('Lütfen tüm kart bilgilerini doldurun')
      setLoading(false)
      return
    }

    if (!contactName.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      toast.error('Lütfen tüm fatura adresi bilgilerini doldurun')
      setLoading(false)
      return
    }

    const tc = identityNumber.replace(/\D/g, '')
    if (tc.length !== 11) {
      toast.error('Geçersiz TC kimlik numarası. 11 haneli olmalıdır.')
      setLoading(false)
      return
    }

    const idempotencyKey =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `cred_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

    const paymentData = {
      creditsAmount: selectedPackage.credits,
      totalPrice: selectedPackage.price,
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
    }

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.')
        return
      }

      // Use environment variable for payment server URL, fallback based on environment
      const paymentServerUrl = process.env.NEXT_PUBLIC_PAYMENT_SERVER_URL || 
        (process.env.NODE_ENV === 'production' ? 'https://sukullcom-production.up.railway.app' : 'http://localhost:3001')

      // --- 3-D Secure path -------------------------------------------------
      // When the flag is on, initialize a 3DS session and hand the browser
      // off to the issuer bank. The bank will POST back to our
      // /api/payment/3ds/callback route once the user completes OTP auth;
      // credit settlement happens on the result page.
      const use3ds = process.env.NEXT_PUBLIC_PAYMENT_USE_3DS === 'true'

      if (use3ds) {
        // The callback URL must include credits + price so the result page
        // can finalize without re-prompting. The server cross-checks the
        // idempotency record, so a tampered query string cannot inflate
        // what the user actually receives.
        const callbackUrl = new URL('/api/payment/3ds/callback', window.location.origin)
        const resultQuery = new URLSearchParams({
          credits: String(selectedPackage.credits),
          totalPrice: String(selectedPackage.price),
        }).toString()
        callbackUrl.search = resultQuery

        const initUrl = `${paymentServerUrl}${paymentServerUrl.endsWith('/') ? '' : '/'}api/payment/3ds/initialize-credit`
        const initResponse = await fetch(initUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ ...paymentData, callbackUrl: callbackUrl.toString() }),
        })
        const initJson = await initResponse.json()
        if (!initResponse.ok || !initJson.success || !initJson.threeDSHtmlContent) {
          toast.error(initJson.message || '3D Secure başlatılamadı. Lütfen tekrar deneyin.')
          return
        }

        // Decode and hand off to the bank. `document.write` is the
        // Iyzico-documented approach — the returned HTML contains a
        // self-submitting form that expects to own the top-level window.
        let decoded: string
        try {
          decoded = atob(initJson.threeDSHtmlContent)
        } catch {
          toast.error('3D Secure yanıtı bozuk. Lütfen tekrar deneyin.')
          return
        }
        document.open()
        document.write(decoded)
        document.close()
        // Intentional: loading stays true; the page is about to be replaced.
        return
      }

      // --- Legacy non-3DS path --------------------------------------------
      // Kept working until 3DS is rolled out to 100 % of traffic. Remove
      // after the cut-over and the card-testing rate-limit metrics confirm
      // no regressions.

      // Call the payment server (ensure no double slash)
      const apiUrl = `${paymentServerUrl}${paymentServerUrl.endsWith('/') ? '' : '/'}api/payment/create`
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(paymentData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message || `Ödeme başarılı! ${selectedPackage.credits} kredi hesabınıza eklendi.`)
        // Refresh credits
        await fetchUserCredits()
        // Clear form
        setCardNumber('')
        setExpireMonth('')
        setExpireYear('')
        setCvc('')
        setHolderName('')
        setContactName('')
        setPhone('')
        setAddress('')
        setCity('')
        setZipCode('')
        setIdentityNumber('')
      } else {
        toast.error(result.message || 'Ödeme işlenemedi. Lütfen tekrar deneyin.')
      }
    } catch (error: unknown) {
      clientLogger.error({ message: 'credit payment failed', error, location: 'credit-purchase/payment' })
      toast.error('Ödeme sırasında bir hata oluştu. Lütfen tekrar dene.')
    } finally {
      setLoading(false)
    }
  }

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  return (
    <div className="min-h-0 w-full max-w-6xl mx-auto px-4 py-8 sm:py-10">
      <div
        className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-slate-50/90 via-white to-white p-6 sm:p-8 shadow-sm"
        aria-label="Kredi satın alma"
      >
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 tracking-tight">
          Kredi Satın Al
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          Krediler hem öğrenciler hem öğretmenler için geçerlidir. Öğrenciler
          bir öğretmene mesaj göndermek için <b className="text-slate-800">1 kredi</b>, öğretmenler bir
          ilana teklif vermek için <b className="text-slate-800">1 kredi</b> harcar. Daha büyük paket
          aldıkça kredi başına fiyat düşer.
        </p>
      </div>

      <Card className="mb-6 sm:mb-8 border border-emerald-200/60 bg-gradient-to-r from-emerald-50/90 to-teal-50/40 shadow-none">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 text-left">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                Mevcut kredin
              </h3>
              <p className="text-sm text-slate-600">
                Kullanılabilir bakiye
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              {loadingCredits ? (
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              ) : (
                <div className="text-2xl sm:text-3xl font-bold tabular-nums text-emerald-700">
                  {userCredits.availableCredits}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">Kredi paketleri</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {creditPackages.map((pkg) => (
              <Card 
                key={pkg.id}
                className={`cursor-pointer border transition-all duration-200 ${
                  selectedPackage.id === pkg.id
                    ? 'ring-2 ring-emerald-500/90 border-emerald-200 bg-emerald-50/50 shadow-sm'
                    : 'border-slate-200/90 bg-white hover:border-emerald-200/80 hover:shadow-md'
                } ${
                  pkg.popular
                    ? selectedPackage.id === pkg.id
                      ? ''
                      : 'border-amber-200/70 bg-amber-50/30'
                    : ''
                }`}
                onClick={() => setSelectedPackage(pkg)}
              >
                <CardContent className="p-4 text-center">
                  {pkg.popular && (
                    <div className="text-[10px] font-semibold tracking-wide text-amber-800/90 mb-1.5 uppercase">
                      En popüler
                    </div>
                  )}
                  <div className="text-2xl font-bold text-slate-900 tabular-nums">{pkg.credits}</div>
                  <div className="text-sm text-slate-500 mb-1">kredi</div>
                  <div className="text-lg font-semibold text-slate-900">
                    {pkg.price.toLocaleString('tr-TR')}{" "}
                    <span className="text-slate-600 text-base font-medium">₺</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {(pkg.price / pkg.credits).toLocaleString('tr-TR', {
                      maximumFractionDigits: 2,
                    })}{" "}
                    ₺/kredi
                  </div>
                  {pkg.id !== '1' && (
                    <div className="text-[10px] text-emerald-700/90 font-medium mt-1.5">
                      %{Math.round((1 - pkg.price / pkg.credits / 40) * 100)}{" "}
                      indirim
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">Ödeme bilgileri</h2>
          
          <Card className="mb-6 border border-slate-200/90 bg-slate-50/80 shadow-none">
            <CardContent className="p-4 sm:p-5">
              <div className="flex justify-between items-center gap-2">
                <span className="font-medium text-slate-800">
                  {selectedPackage.credits} kredi
                </span>
                <span className="text-xl font-bold text-emerald-700 tabular-nums">
                  {selectedPackage.price.toLocaleString('tr-TR')} ₺
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 border border-slate-200/90 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold text-slate-900">
                <CreditCard className="h-5 w-5 text-emerald-600" aria-hidden />
                Kart bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Kart sahibi adı</label>
                <Input
                  className="border-slate-200/90 focus-visible:ring-emerald-500/40"
                  type="text"
                  placeholder="AD SOYAD"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value.toUpperCase())}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Kart numarası</label>
                <Input
                  className="border-slate-200/90 focus-visible:ring-emerald-500/40"
                  type="text"
                  placeholder="5890 0400 0000 0016"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Ay</label>
                  <Input
                    className="border-slate-200/90 focus-visible:ring-emerald-500/40"
                    type="text"
                    placeholder="12"
                    value={expireMonth}
                    onChange={(e) => setExpireMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Yıl</label>
                  <Input
                    className="border-slate-200/90 focus-visible:ring-emerald-500/40"
                    type="text"
                    placeholder="25"
                    value={expireYear}
                    onChange={(e) => setExpireYear(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">CVC</label>
                  <Input
                    className="border-slate-200/90 focus-visible:ring-emerald-500/40"
                    type="text"
                    placeholder="123"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    maxLength={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 border border-slate-200/90 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold text-slate-900">
                <MapPin className="h-5 w-5 text-emerald-600" aria-hidden />
                Fatura adresi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Ad soyad</label>
                <Input
                  className="border-slate-200/90 focus-visible:ring-emerald-500/40"
                  type="text"
                  placeholder="Ahmet Yılmaz"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">TC Kimlik numarası</label>
                <Input
                  className="border-slate-200/90 focus-visible:ring-emerald-500/40"
                  type="text"
                  inputMode="numeric"
                  placeholder="11 haneli TC kimlik numarası"
                  value={identityNumber}
                  onChange={(e) =>
                    setIdentityNumber(e.target.value.replace(/\D/g, "").slice(0, 11))
                  }
                  maxLength={11}
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Ödeme yasası gereği zorunludur; saklanmaz, sadece bankanıza iletilir.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Telefon</label>
                <Input
                  className="border-slate-200/90 focus-visible:ring-emerald-500/40"
                  type="text"
                  placeholder="+90 555 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Adres</label>
                <Input
                  className="border-slate-200/90 focus-visible:ring-emerald-500/40"
                  type="text"
                  placeholder="Mahalle, Sokak, No"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Şehir</label>
                  <Input
                    className="border-slate-200/90 focus-visible:ring-emerald-500/40"
                    type="text"
                    placeholder="İstanbul"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Posta kodu</label>
                  <Input
                    className="border-slate-200/90 focus-visible:ring-emerald-500/40"
                    type="text"
                    placeholder="34000"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal acknowledgement — mesafeli satış mevzuatı gereği
              ödeme öncesinde tüketicinin sözleşmeleri okuyup onayladığı
              teyit edilmeli. İki ayrı checkbox kullanmak, Ticaret
              Bakanlığı yönetmeliğinin "her belge için açık onay" ifadesiyle
              uyumludur. */}
          <div className="mt-6 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4 sm:p-5 text-sm text-slate-700">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={agreeDistanceSales}
                onChange={(e) => setAgreeDistanceSales(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/30"
              />
              <span>
                <a
                  href="/yasal/mesafeli-satis"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-emerald-800 underline decoration-emerald-300/80 underline-offset-2 hover:text-emerald-900"
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
                className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/30"
              />
              <span>
                <a
                  href="/yasal/on-bilgilendirme"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-emerald-800 underline decoration-emerald-300/80 underline-offset-2 hover:text-emerald-900"
                >
                  Ön Bilgilendirme Formu
                </a>
                {"'nu okudum, bilgilendirildim ve onaylıyorum."}
              </span>
            </label>
          </div>

          <Button
            onClick={handlePayment}
            disabled={loading || !agreeDistanceSales || !agreePreInfo}
            variant="super"
            className="mt-4 w-full shadow-md shadow-emerald-900/10"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ödeme işleniyor…
              </>
            ) : (
              `${selectedPackage.price.toLocaleString("tr-TR")} ₺ öde`
            )}
          </Button>

          <p className="text-xs text-slate-500 text-center mt-4 leading-relaxed">
            Ödeme, kart bilgileri Sukull sunucularında tutulmaksızın Iyzico üzerinden
            işlenir.
          </p>
        </div>
      </div>
      </div>
    </div>
  )
} 