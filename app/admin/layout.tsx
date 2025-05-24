import { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { isAdmin, syncAdminRole } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Sukull Admin Dashboard",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    // First check if the user is an admin by email
    const isAdminByEmail = await isAdmin();
    
    if (isAdminByEmail) {
      // If the user is an admin by email, make sure their role is set correctly in the database
      await syncAdminRole();
    }
    
    // Then use requireAdmin which checks the role in the database
    // This will redirect if the user is not an admin
    await requireAdmin();
    
    return (
      <div className="h-full">
        <div className="container h-full py-6">
          {children}
        </div>
      </div>
    );
  } catch (error) {
    // Redirect to unauthorized page in case any error occurs
    console.error("Admin access error:", error);
    redirect("/unauthorized");
  }
} 