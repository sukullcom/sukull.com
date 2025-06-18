"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TeacherField {
  id: number;
  teacherId: string;
  subject: string;
  grade: string;
  displayName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FieldOption {
  subject: string;
  grade: string;
  displayName: string;
}

export default function TestFieldsPage() {
  const [teachers, setTeachers] = useState<TeacherField[]>([]);
  const [fieldOptions, setFieldOptions] = useState<FieldOption[]>([]);
  const [loading, setLoading] = useState(false);

  const testTeachers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/private-lesson/available-teachers");
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.teachers);
        console.log("Teachers:", data.teachers);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  const testFieldOptions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/field-options');
      const data = await response.json();
      console.log('Field options:', data);
      setFieldOptions(data || []);
    } catch (error) {
      console.error('Error testing field options:', error);
      setFieldOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/migrate-teacher-fields", {
        method: "POST",
      });
      const data = await response.json();
      console.log("Migration result:", data);
      alert(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Error running migration:", error);
      alert("Migration failed: " + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Teacher Fields Test Page</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Field Options</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={testFieldOptions} className="mb-4">
              Test Field Options API
            </Button>
            {fieldOptions.length > 0 && (
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(fieldOptions, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={testTeachers} disabled={loading} className="mb-4">
              {loading ? "Loading..." : "Test Teachers API"}
            </Button>
            {teachers.length > 0 && (
              <div className="space-y-2">
                {teachers.map((teacher, index) => (
                  <div key={index} className="p-2 border rounded">
                    <strong>{teacher.displayName}</strong>
                    <div>Field: {teacher.subject}</div>
                    <div>Fields: {JSON.stringify(teacher)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Migration</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={runMigration} disabled={loading}>
              {loading ? "Running..." : "Run Migration"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 