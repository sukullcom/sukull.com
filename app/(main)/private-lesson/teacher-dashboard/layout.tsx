import { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Teacher Dashboard | Sukull",
  description: "Manage your teaching profile and classes",
};

export default async function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    // This will redirect if the user is not a teacher
    await requireTeacher();
    
    return (
      <div className="h-full">
        <div className="container h-full py-4">
          {children}
        </div>
      </div>
    );
  } catch (error) {
    // Redirect to unauthorized page in case any error occurs
    console.error("Teacher access error:", error);
    redirect("/unauthorized");
  }
} 