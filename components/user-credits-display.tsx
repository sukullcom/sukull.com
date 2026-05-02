'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Plus, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { clientLogger } from '@/lib/client-logger'

interface UserCreditsDisplayProps {
  showPurchaseButton?: boolean
  className?: string
}

interface UserCredits {
  totalCredits: number
  usedCredits: number
  availableCredits: number
}

export default function UserCreditsDisplay({ 
  showPurchaseButton = true, 
  className = "" 
}: UserCreditsDisplayProps) {
  const [credits, setCredits] = useState<UserCredits>({ 
    totalCredits: 0, 
    usedCredits: 0, 
    availableCredits: 0 
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchCredits()
  }, [])

  const fetchCredits = async () => {
    try {
      setError(false)
      const response = await axios.get('/api/user/credits')
      setCredits(response.data)
    } catch (err) {
      clientLogger.error({ message: 'fetch user credits failed', error: err, location: 'user-credits-display' })
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchaseCredits = () => {
    router.push('/private-lesson/credits')
  }

  return (
    <Card
      className={`border-suk-payment/25 bg-gradient-to-r from-suk-payment-soft to-suk-play-soft ${className}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-suk-payment-soft p-2">
              <CreditCard className="h-5 w-5 text-suk-payment" />
            </div>
            <div>
              <h3 className="font-semibold text-suk-fg-primary">Kredilerim</h3>
              <p className="text-sm text-suk-fg-muted">
                {loading ? 'Yükleniyor...' : error ? 'Yüklenemedi' : `${credits.availableCredits} kredi kullanılabilir`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {error ? (
              <Button
                onClick={fetchCredits}
                size="sm"
                variant="paymentOutline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Tekrar dene</span>
              </Button>
            ) : (
              <>
                <div className="text-right">
                  <div className="text-2xl font-bold text-suk-payment">
                    {loading ? '...' : credits.availableCredits}
                  </div>
                </div>
                
                {showPurchaseButton && (
                  <Button
                    onClick={handlePurchaseCredits}
                    size="sm"
                    variant="payment"
                    className="flex items-center gap-2 shrink-0"
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Kredi Al</span>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        
        {!error && !loading && credits.availableCredits === 0 && (
          <div className="mt-3 rounded-lg border border-suk-warning-border bg-suk-warning-soft p-3">
            <p className="text-sm text-suk-warning-soft-fg">
              İlan açmak, eğitmenlere teklif göndermek veya bir eğitmenle mesajlaşmayı
              açmak için kredi kullanılır. Devam etmek için kredi satın alabilirsin.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 