import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import db from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { UsersRound, School, BookOpen, PanelLeftOpen } from "lucide-react";

export default async function AdminDashboardPage() {
  // Get the authenticated user
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
    redirect("/unauthorized");
  }
  
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-xl">
              <UsersRound className="h-5 w-5 mr-2" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Manage user accounts, permissions, and roles.
            </p>
          </CardContent>
          <CardFooter>
            <div className="flex flex-col w-full gap-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/fix-student-roles">
                  Fix Student Roles
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-xl">
              <School className="h-5 w-5 mr-2" />
              Teacher Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Manage teacher applications and approvals.
            </p>
          </CardContent>
          <CardFooter>
            <div className="flex flex-col w-full gap-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/teacher-applications">
                  View Applications
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-xl">
              <PanelLeftOpen className="h-5 w-5 mr-2" />
              Student Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Manage student applications for private lessons.
            </p>
          </CardContent>
          <CardFooter>
            <div className="flex flex-col w-full gap-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/student-applications">
                  View Applications
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-xl">
              <BookOpen className="h-5 w-5 mr-2" />
              Course Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Manage courses, lessons, and challenges.
            </p>
          </CardContent>
          <CardFooter>
            <div className="flex flex-col w-full gap-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/courses">
                  Manage Courses
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 