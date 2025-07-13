"use client";

import { useState } from "react";
import { courses } from "@/db/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Users, Target, Settings } from "lucide-react";

import { CourseManager } from "./components/course-manager";
import { UnitManager } from "./components/unit-manager";
import { LessonManager } from "./components/lesson-manager";
import { ChallengeManager } from "./components/challenge-manager";

type Course = typeof courses.$inferSelect;

interface CourseBuilderProps {
  initialCourses: Course[];
}

export function CourseBuilder({ initialCourses }: CourseBuilderProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState("courses");

  return (
    <div className="space-y-6">
      {/* Course Selection */}
      {selectedCourse && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-900">
                  Editing: {selectedCourse.title}
                </h3>
                <p className="text-sm text-blue-600">
                  Course ID: {selectedCourse.id}
                </p>
              </div>
            </div>
            <Button
              variant="primaryOutline"
              size="sm"
              onClick={() => {
                setSelectedCourse(null);
                setActiveTab("courses");
              }}
            >
              Back to Courses
            </Button>
          </div>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="courses" className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>Courses</span>
          </TabsTrigger>
          <TabsTrigger
            value="units"
            disabled={!selectedCourse}
            className="flex items-center space-x-2"
          >
            <Users className="w-4 h-4" />
            <span>Units</span>
          </TabsTrigger>
          <TabsTrigger
            value="lessons"
            disabled={!selectedCourse}
            className="flex items-center space-x-2"
          >
            <Target className="w-4 h-4" />
            <span>Lessons</span>
          </TabsTrigger>
          <TabsTrigger
            value="challenges"
            disabled={!selectedCourse}
            className="flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Challenges</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="mt-6">
          <CourseManager
            courses={initialCourses}
            onSelectCourse={(course) => {
              setSelectedCourse(course);
              setActiveTab("units");
            }}
          />
        </TabsContent>

        <TabsContent value="units" className="mt-6">
          {selectedCourse && (
            <UnitManager
              courseId={selectedCourse.id}
              courseName={selectedCourse.title}
            />
          )}
        </TabsContent>

        <TabsContent value="lessons" className="mt-6">
          {selectedCourse && (
            <LessonManager
              courseId={selectedCourse.id}
              courseName={selectedCourse.title}
            />
          )}
        </TabsContent>

        <TabsContent value="challenges" className="mt-6">
          {selectedCourse && (
            <ChallengeManager
              courseId={selectedCourse.id}
              courseName={selectedCourse.title}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 