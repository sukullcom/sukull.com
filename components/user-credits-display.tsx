'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

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
  const router = useRouter()

  useEffect(() => {
    fetchCredits()
  }, [])

  const fetchCredits = async () => {
    try {
      const response = await axios.get('/api/user/credits')
      setCredits(response.data)
    } catch (error) {
      console.error('Error fetching credits:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchaseCredits = () => {
    router.push('/private-lesson/credits')
  }

  return (
    <Card className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Ders Kredilerim</h3>
              <p className="text-sm text-gray-600">
                {loading ? 'Yükleniyor...' : `${credits.availableCredits} kredi kullanılabilir`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {loading ? '...' : credits.availableCredits}
              </div>
              <p className="text-xs text-gray-500">
                Toplam: {credits.totalCredits}
              </p>
            </div>
            
            {showPurchaseButton && (
              <Button
                onClick={handlePurchaseCredits}
                size="sm"
                className="flex items-center gap-2"
                variant={credits.availableCredits === 0 ? "default" : "outline"}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Kredi Al</span>
              </Button>
            )}
          </div>
        </div>
        
        {credits.availableCredits === 0 && (
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              ⚠️ Ders ayırtmak için kredi satın almanız gerekiyor.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 