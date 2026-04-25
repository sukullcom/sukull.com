import type { Metadata } from "next";
import { getTeacherProfile, getTeacherFields } from "@/db/queries";

/**
 * Dinamik per-teacher metadata. Client page SEO'yu sadece sağlayamaz çünkü
 * arama motorları ilk HTML'de işaretleme bekler. Bu layout server-side fetch
 * yapar ve kullanıcının gördüğü sayfa render'ını bloke etmez (sayfa zaten
 * client-side fetch yaptığından paralel çalışır).
 */
export async function generateMetadata(
  { params }: { params: { id: string } },
): Promise<Metadata> {
  const teacher = await getTeacherProfile(params.id);

  if (!teacher) {
    return {
      title: "Öğretmen Bulunamadı | Sukull",
      description: "Aradığınız öğretmen bulunamadı.",
      robots: { index: false, follow: false },
    };
  }

  const fields = await getTeacherFields(params.id);
  const fieldText = fields.length
    ? fields.map((f) => f.displayName).join(", ")
    : "özel ders";

  const name = teacher.name ?? "Sukull Öğretmeni";
  const title = `${name} | Özel Ders | Sukull`;
  const description = teacher.bio
    ? teacher.bio.slice(0, 160)
    : `${name} ile ${fieldText} alanında birebir özel ders al.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      ...(teacher.avatar ? { images: [{ url: teacher.avatar }] } : {}),
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function TeacherDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
