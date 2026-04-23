import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Öğrenci Rolü Onarımı | Admin",
  description:
    "Onaylanmış öğrenci başvurularına rağmen rolü senkronize olmayan kullanıcıları onarır.",
};

// Auth gate app/(main)/admin/layout.tsx'te uygulanıyor; burada sadece metadata var.
export default function AdminFixStudentRolesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
