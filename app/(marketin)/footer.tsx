import { Button } from '@/components/ui/button'
import Image from 'next/image'
import React from 'react'

export const Footer = () => {
  return (
    <footer className='h-auto w-full border-t-2 border-slate-200 py-3 px-2'>
        <div className='max-w-screen-lg mx-auto flex flex-wrap items-center justify-center gap-2 sm:justify-evenly'>
            <Button size="lg" variant="ghost" className='flex-shrink-0'>
                <Image
                    src="/mascot_blue.svg"
                    alt="Matematik dersi"
                    height={32}
                    width={40}
                    className='mr-2 rounded-md'
                />
                Matematik
            </Button>
            <Button size="lg" variant="ghost" className='flex-shrink-0'>
                <Image
                    src="/mascot_orange.svg"
                    alt="Fen Bilimleri dersi"
                    height={32}
                    width={40}
                    className='mr-2 rounded-md'
                />
                Fen Bilimleri
            </Button>
            <Button size="lg" variant="ghost" className='flex-shrink-0'>
                <Image
                    src="/mascot_pink.svg"
                    alt="Türkçe dersi"
                    height={32}
                    width={40}
                    className='mr-2 rounded-md'
                />
                Türkçe
            </Button>
            <Button size="lg" variant="ghost" className='flex-shrink-0'>
                <Image
                    src="/mascot_sad.svg"
                    alt="İngilizce dersi"
                    height={32}
                    width={40}
                    className='mr-2 rounded-md'
                />
                İngilizce
            </Button>
            <Button size="lg" variant="ghost" className='flex-shrink-0'>
                <Image
                    src="/mascot_bad.svg"
                    alt="Daha fazla ders"
                    height={32}
                    width={40}
                    className='mr-2 rounded-md'
                />
                ve daha fazlası...
            </Button>
        </div>
    </footer>
  )
}
