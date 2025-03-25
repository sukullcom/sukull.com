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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Available Teachers</h1>
        <Button variant="default" onClick={() => router.push("/private-lesson")}>
          Back to Home
        </Button>
      </div>

      {teachers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">No teachers are available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((teacher) => (
            <Card key={teacher.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                    <Image
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(teacher.name)}`}
                      alt={teacher.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <CardTitle className="text-center">{teacher.name}</CardTitle>
                <CardDescription className="text-center truncate">
                  {teacher.email}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 line-clamp-3">
                  {teacher.bio || "No bio available"}
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => router.push(`/private-lesson/teachers/${teacher.id}`)}
                >
                  View Schedule
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 