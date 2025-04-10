"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface Teacher {
  id: string;
  name: string;
  email: string;
  bio?: string;
  meetLink?: string;
  avatar?: string;
  field?: string;
  priceRange?: string;
}

export default function TeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await fetch("/api/private-lesson/available-teachers");
        
        if (!response.ok) {
          if (response.status === 403) {
            // Not an approved student, redirect to main page
            router.push("/private-lesson");
            return;
          }
          throw new Error("Failed to fetch teachers");
        }
        
        const data = await response.json();
        setTeachers(data.teachers);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching teachers:", error);
        setError("Failed to load teachers. Please try again later.");
        setLoading(false);
      }
    };

    fetchTeachers();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <Button onClick={() => router.push("/private-lesson")}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Öğretmenler</h1>

      {teachers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">No teachers are available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((teacher) => (
            <Card key={teacher.id} className="hover:shadow-lg transition-shadow border">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 border-4 border-primary/20">
                    <Image
                      src={teacher.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(teacher.name)}`}
                      alt={teacher.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                </div>
                <CardTitle className="text-center text-xl">{teacher.name}</CardTitle>
                {teacher.field && (
                  <CardDescription className="text-center font-medium text-primary mt-1">
                    {teacher.field}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 line-clamp-3 text-center">
                  {teacher.bio || "No bio available"}
                </p>
                {teacher.priceRange && (
                  <div className="flex justify-center mt-4">
                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                      {teacher.priceRange}
                    </span>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90" 
                  onClick={() => router.push(`/private-lesson/teachers/${teacher.id}`)}
                >
                  Programa Bak
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 