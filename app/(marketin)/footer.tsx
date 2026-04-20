import { Button } from '@/components/ui/button'
import { BookOpen, Gamepad2, Users, Trophy, GraduationCap } from 'lucide-react'
import React from 'react'

export const Footer = () => {
  return (
    <footer className='h-auto w-full border-t-2 border-slate-200 py-3 px-2'>
        <div className='max-w-screen-lg mx-auto flex flex-wrap items-center justify-center gap-2 sm:justify-evenly'>
            <Button size="lg" variant="ghost" className='flex-shrink-0'>
                <BookOpen className="h-5 w-5 mr-2 text-sky-500" />
                Dersler
            </Button>
            <Button size="lg" variant="ghost" className='flex-shrink-0'>
                <Gamepad2 className="h-5 w-5 mr-2 text-violet-500" />
                Beyin Oyunları
            </Button>
            <Button size="lg" variant="ghost" className='flex-shrink-0'>
                <Trophy className="h-5 w-5 mr-2 text-amber-500" />
                Sıralama
            </Button>
            <Button size="lg" variant="ghost" className='flex-shrink-0'>
                <Users className="h-5 w-5 mr-2 text-emerald-500" />
                Çalışma Arkadaşı
            </Button>
            <Button size="lg" variant="ghost" className='flex-shrink-0'>
                <GraduationCap className="h-5 w-5 mr-2 text-rose-500" />
                Özel Ders
            </Button>
        </div>
    </footer>
  )
}
