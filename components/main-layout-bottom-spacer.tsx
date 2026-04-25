/**
 * (main) layout’ta, kaydırılabilir sütunun *sonunda* duran boşluk: padding yerine
 * akışta blok; flex/h-full + min-h-screen etkileşimlerinde içeriğin altının
 * sabit menüyle örtülmesini tutarlı azaltır. Yükseklik --app-bottom-inset ile
 * `globals.css` ve `BottomNavigator` ile eşleşir.
 */
export function MainLayoutBottomSpacer() {
  return (
    <div
      className="w-full flex-shrink-0 h-0 max-lg:h-[var(--app-bottom-inset)]"
      aria-hidden
    />
  );
}
