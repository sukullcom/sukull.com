type Props = {
    children: React.ReactNode;
}

/**
 * Sağ kenar sticky paneli (puan + günlük hedef + günlük görev + Quests).
 * Genişlik Duolingo'daki ile karşılaştırmalı olarak biraz daha cömert:
 * 368 → 400 px. İçerikler (rozet listeleri, davet metni) artık nefes alır.
 */
export const StickyWrapper = ({ children }: Props) => {
    return (
        <div className="hidden lg:block w-[400px] sticky self-end bottom-6">
            <div className="min-h-[calc(100vh-48px)] sticky top-6 flex flex-col gap-y-4">
                {children}
            </div>
        </div>
    )
}