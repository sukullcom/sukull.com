'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, CreditCard, MapPin } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface CreditPackage {
  id: string
  credits: number
  price: number
  popular?: boolean
}

const creditPackages: CreditPackage[] = [
  { id: '1', credits: 1, price: 500 },
  { id: '4', credits: 4, price: 2000, popular: true },
  { id: '8', credits: 8, price: 3800 },
  { id: '12', credits: 12, price: 5400 }
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
      console.error('Error fetching credits:', error)
      toast.error('Kredi bilgileri yüklenirken hata oluştu')
    } finally {
      setLoadingCredits(false)
    }
  }

  const handlePayment = async () => {
    if (loading) return

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

    const paymentData = {
      creditsAmount: selectedPackage.credits,
      totalPrice: selectedPackage.price,
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
        toast.success(`Ödeme başarılı! ${selectedPackage.credits} kredi hesabınıza eklendi.`)
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
      } else {
        toast.error('Ödeme başarısız: ' + (result.message || 'Bilinmeyen hata'))
      }
    } catch (error: unknown) {
      console.error('Payment error:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Ödeme sırasında hata oluştu'
      toast.error(errorMessage)
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ders Kredisi Satın Al</h1>
        <p className="text-gray-600">Özel derslerinizi ayırtabilmek için kredi satın alın</p>
      </div>

      {/* Current Credits Display */}
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Mevcut Kredileriniz</h3>
              <p className="text-gray-600">Kullanılabilir ders kredisi sayınız</p>
            </div>
            <div className="text-right">
              {loadingCredits ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="text-3xl font-bold text-blue-600">
                  {userCredits.availableCredits}
                </div>
              )}
              <p className="text-sm text-gray-500">Toplam: {userCredits.totalCredits}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Credit Packages Selection */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Kredi Paketleri</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {creditPackages.map((pkg) => (
              <Card 
                key={pkg.id}
                className={`cursor-pointer transition-all ${
                  selectedPackage.id === pkg.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                } ${pkg.popular ? 'border-orange-300 bg-orange-50' : ''}`}
                onClick={() => setSelectedPackage(pkg)}
              >
                <CardContent className="p-4 text-center">
                  {pkg.popular && (
                    <div className="text-xs font-semibold text-orange-600 mb-2">
                      EN POPÜLER
                    </div>
                  )}
                  <div className="text-2xl font-bold text-gray-900">{pkg.credits}</div>
                  <div className="text-sm text-gray-600 mb-2">Kredi</div>
                  <div className="text-lg font-semibold text-blue-600">
                    {pkg.price.toLocaleString('tr-TR')} ₺
                  </div>
                  <div className="text-xs text-gray-500">
                    {(pkg.price / pkg.credits).toLocaleString('tr-TR')} ₺/kredi
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Payment Form */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Ödeme Bilgileri</h2>
          
          {/* Selected Package Summary */}
          <Card className="mb-6 bg-gray-50">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">{selectedPackage.credits} Ders Kredisi</span>
                <span className="text-xl font-bold text-blue-600">
                  {selectedPackage.price.toLocaleString('tr-TR')} ₺
                </span>
              </div>
            </CardContent>
          </Card>

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
                <label className="block text-sm font-medium mb-1">Kart Sahibi Adı</label>
                <Input
                  type="text"
                  placeholder="JOHN DOE"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value.toUpperCase())}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Kart Numarası</label>
                <Input
                  type="text"
                  placeholder="5890 0400 0000 0016"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                />
                <p className="text-xs text-gray-500 mt-1">Test kartı: 5890 0400 0000 0016</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ay</label>
                  <Input
                    type="text"
                    placeholder="12"
                    value={expireMonth}
                    onChange={(e) => setExpireMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Yıl</label>
                  <Input
                    type="text"
                    placeholder="25"
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
            </CardContent>
          </Card>

          {/* Billing Address Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Fatura Adresi
              </CardTitle>
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
                  type="text"
                  placeholder="+90 555 123 4567"
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

          {/* Payment Button */}
          <Button 
            onClick={handlePayment}
            disabled={loading}
            variant="primary"
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ödeme İşleniyor...
              </>
            ) : (
              `${selectedPackage.price.toLocaleString('tr-TR')} ₺ Öde`
            )}
          </Button>
          
          <p className="text-xs text-gray-500 text-center mt-4">
            Bu bir test ödeme sistemidir. Gerçek kart bilgileri kullanmayın.
          </p>
        </div>
      </div>
    </div>
  )
} 