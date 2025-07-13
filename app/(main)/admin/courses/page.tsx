import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import db from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { BookOpen, Plus, Settings, Users } from "lucide-react";

export default async function AdminCoursesPage() {
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Kurs Yönetimi</h1>
        <Button variant="primary">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kurs
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Kurslar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 mb-4">
              Henüz kurs yönetimi sistemi aktif değil. Bu sayfa geliştirilmektedir.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold">İngilizce Temel</h3>
                <p className="text-sm text-gray-500">Başlangıç seviyesi İngilizce kursu</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="primaryOutline">
                    <Settings className="h-3 w-3 mr-1" />
                    Düzenle
                  </Button>
                  <Button size="sm" variant="primaryOutline">
                    <Users className="h-3 w-3 mr-1" />
                    Öğrenciler
                  </Button>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold">Matematik Temel</h3>
                <p className="text-sm text-gray-500">Temel matematik konuları</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="primaryOutline">
                    <Settings className="h-3 w-3 mr-1" />
                    Düzenle
                  </Button>
                  <Button size="sm" variant="primaryOutline">
                    <Users className="h-3 w-3 mr-1" />
                    Öğrenciler
                  </Button>
                </div>
              </div>
              
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <Button variant="ghost" className="h-full w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Kurs Ekle
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hızlı İstatistikler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">24</div>
                <div className="text-sm text-gray-500">Aktif Kurs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">1,234</div>
                <div className="text-sm text-gray-500">Toplam Öğrenci</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">89</div>
                <div className="text-sm text-gray-500">Aktif Öğretmen</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">456</div>
                <div className="text-sm text-gray-500">Tamamlanan Ders</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 