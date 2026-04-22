import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fix Student Roles | Admin",
  description: "Admin tool to fix user roles for approved students",
};

// The parent admin/layout.tsx already enforces the admin gate via isAdmin().
// This file only contributes metadata — no need to re-check auth here.
export default function AdminFixStudentRolesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full">
      <div className="h-full">{children}</div>
    </div>
  );
}
