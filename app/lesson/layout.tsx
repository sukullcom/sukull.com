/**
 * Lesson (quiz) akışı tam ekran deneyim sunar — ne (main) layout'undaki
 * sidebar/mobile-header/bottom-nav'a ne de bir max-width container'a ihtiyacı
 * vardır. Bu layout bilinçli olarak minimum bir root sağlar; böylece Next.js
 * parent layout'larının wrapper gürültüsü uygulanmaz.
 */
export default function LessonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex flex-col h-full w-full">{children}</div>;
}
