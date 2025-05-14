import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { isApprovedStudent } from "@/db/queries";

export const metadata: Metadata = {
  title: "My Bookings | Sukull",
  description: "Manage your private lesson bookings",
};

export default async function MyBookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    // Get authenticated user - redirects to login if not authenticated
    const user = await getAuthenticatedUser();
    
    // Check if user is an approved student
    const isStudent = await isApprovedStudent(user.id);
    
    if (!isStudent) {
      // If authenticated but not a student, redirect to apply for student status
      redirect("/private-lesson/get");
    }
    
    return (
      <div className="h-full">
        <div className="container h-full py-4">
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