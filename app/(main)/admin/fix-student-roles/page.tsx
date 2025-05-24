"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function FixStudentRolesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    updatedUsers?: string[];
    error?: string;
  } | null>(null);

  const fixStudentRoles = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/fix-student-roles", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          updatedUsers: data.updatedUsers,
        });
      } else {
        setResult({
          success: false,
          message: "Role update failed",
          error: data.error || "Unknown error occurred",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Role update failed",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Fix Student Roles</CardTitle>
          <CardDescription>
            This tool will update all users with approved student applications to have the "student" role if they don't already.
            Teachers will not be affected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-amber-800 text-sm">
                <strong>Note:</strong> This utility helps resolve inconsistencies between user roles and application status. 
                Use only if you notice users with approved student applications not correctly being assigned the student role.
              </p>
            </div>

            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                <div className="flex items-start">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mr-2" />
                  )}
                  <div>
                    <AlertTitle>{result.message}</AlertTitle>
                    <AlertDescription>
                      {result.success ? (
                        <>
                          {result.updatedUsers && result.updatedUsers.length > 0 ? (
                            <div className="mt-2">
                              <p>Updated users: {result.updatedUsers.length}</p>
                              {result.updatedUsers.length <= 10 && (
                                <ul className="list-disc pl-5 mt-1 text-sm">
                                  {result.updatedUsers.map((userId) => (
                                    <li key={userId}>{userId}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ) : (
                            <p>No users needed to be updated.</p>
                          )}
                        </>
                      ) : (
                        <p className="text-red-600">{result.error}</p>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={fixStudentRoles} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating Roles...
              </>
            ) : (
              'Fix Student Roles'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 