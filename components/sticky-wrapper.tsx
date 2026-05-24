type Props = {
    children: React.ReactNode;
}

/** Sağ kenar sticky paneli (puan, günlük hedef, görevler vb.). Varsayılan 400px; içeriğe nefes bırakır. */
export const StickyWrapper = ({ children }: Props) => {
    return (
        <div className="hidden lg:block w-[400px] sticky self-end bottom-6">
            <div className="min-h-[calc(100vh-48px)] sticky top-6 flex flex-col gap-y-4">
                {children}
            </div>
        </div>
    )
}