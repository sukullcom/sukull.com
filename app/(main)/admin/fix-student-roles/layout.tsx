import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import db from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Fix Student Roles | Admin",
  description: "Admin tool to fix user roles for approved students",
};

export default async function AdminFixStudentRolesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    // Get authenticated user - redirects to login if not authenticated
    const user = await getServerUser();
    
    if (!user) {
      redirect("/login");
    }
    
    // Check if user is an admin
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { role: true }
    });
    
    if (userRecord?.role !== "admin") {
      // If authenticated but not an admin, redirect to unauthorized
      redirect("/unauthorized");
    }
    
    return (
      <div className="h-full">
        <div className="h-full">
          {children}
        </div>
      </div>
    );
  } catch (error) {
    // Handle any other errors
    console.error("Access error:", error);
    redirect("/unauthorized");
  }
} 