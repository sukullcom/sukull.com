type Props = {
  children: React.ReactNode;
};

/** Sağ sütun: puanlar, günlük ilerleme, görev kartları vb. Genişlik ~400px; sticky kalır. */
export function StickyWrapper({ children }: Props) {
  return (
    <div className="sticky bottom-6 hidden w-[400px] self-end lg:block">
      <div className="sticky top-6 flex min-h-[calc(100vh-48px)] flex-col gap-y-4">
        {children}
      </div>
    </div>
  );
}