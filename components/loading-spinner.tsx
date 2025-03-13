import Image from "next/image"
import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner = ({ 
  size = 'md'
}: LoadingSpinnerProps) => {
  const sizeMap = {
    sm: { width: 48, height: 48 },
    md: { width: 64, height: 64 },
    lg: { width: 96, height: 96 }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-4">
      <div className="animate-spin">
        <Image 
          src="/mascot_purple.svg" 
          alt="Sukull Mascot" 
          width={sizeMap[size].width} 
          height={sizeMap[size].height} 
        />
      </div>
      <p className="text-muted-foreground text-sm animate-pulse">Yükleniyor...</p>
    </div>
  )
} 