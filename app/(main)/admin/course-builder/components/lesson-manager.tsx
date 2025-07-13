"use client";

import { useState, useEffect, useCallback } from "react";
import { lessons, units } from "@/db/schema";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Book, Trash2, Edit } from "lucide-react";
import { createLesson, deleteLesson, getLessonsForCourse, getUnitsForCourse, updateLesson } from "../actions";
import { toast } from "sonner";

type Lesson = typeof lessons.$inferSelect & {
  unit?: typeof units.$inferSelect;
};
type Unit = typeof units.$inferSelect;

interface LessonManagerProps {
  courseId: number;
  courseName: string;
}

export function LessonManager({ courseId, courseName }: LessonManagerProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [newLesson, setNewLesson] = useState({
    unitId: 0,
    title: "",
    order: 1
  });
  const [editLesson, setEditLesson] = useState({
    title: "",
    order: 1
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(true);

  const fetchData = useCallback(async () => {
    setLoadingLessons(true);
    try {
      const [lessonsResult, unitsResult] = await Promise.all([
        getLessonsForCourse(courseId),
        getUnitsForCourse(courseId)
      ]);

      if (lessonsResult.success && lessonsResult.lessons) {
        setLessons(lessonsResult.lessons);
      } else {
        toast.error("Dersler yüklenemedi");
      }

      if (unitsResult.success && unitsResult.units) {
        setUnits(unitsResult.units);
        if (unitsResult.units.length > 0) {
          setNewLesson(prev => ({ ...prev, unitId: unitsResult.units[0].id }));
        }
      } else {
        toast.error("Üniteler yüklenemedi");
      }
    } catch {
      toast.error("Veriler yüklenirken bir hata oluştu");
    } finally {
      setLoadingLessons(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUnitChange = (unitId: string) => {
    const selectedUnitId = parseInt(unitId);
    const unitLessons = lessons.filter(l => l.unit?.id === selectedUnitId);
    setNewLesson({ 
      ...newLesson, 
      unitId: selectedUnitId,
      order: unitLessons.length + 1 
    });
  };

  const handleCreateLesson = async () => {
    if (!newLesson.title.trim()) {
      toast.error("Ders başlığı gereklidir");
      return;
    }
    if (!newLesson.unitId) {
      toast.error("Lütfen bir ünite seçin");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createLesson({
        unitId: newLesson.unitId,
        title: newLesson.title,
        order: newLesson.order
      });
      
      if (result.success && result.lesson) {
        // Add unit info to the lesson for display
        const unit = units.find(u => u.id === newLesson.unitId);
        const lessonWithUnit: Lesson = { ...result.lesson, unit };
        setLessons([...lessons, lessonWithUnit]);
        setNewLesson({ unitId: newLesson.unitId, title: "", order: newLesson.order + 1 });
        setIsCreateOpen(false);
        toast.success("Ders başarıyla oluşturuldu");
      } else {
        toast.error(result.error || "Ders oluşturulamadı");
      }
    } catch {
      toast.error("Ders oluşturulurken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditLesson = async () => {
    if (!editingLesson || !editLesson.title.trim()) {
      toast.error("Ders başlığı gereklidir");
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateLesson(editingLesson.id, {
        title: editLesson.title,
        order: editLesson.order
      });
      
      if (result.success) {
        setLessons(lessons.map(l => 
          l.id === editingLesson.id 
            ? { ...l, title: editLesson.title, order: editLesson.order }
            : l
        ));
        setIsEditOpen(false);
        setEditingLesson(null);
        toast.success("Ders başarıyla güncellendi");
      } else {
        toast.error(result.error || "Ders güncellenemedi");
      }
    } catch {
      toast.error("Ders güncellenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setEditLesson({
      title: lesson.title,
      order: lesson.order
    });
    setIsEditOpen(true);
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!window.confirm("Bu dersi silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const result = await deleteLesson(lessonId);
      if (result.success) {
        setLessons(lessons.filter(l => l.id !== lessonId));
        toast.success("Ders başarıyla silindi");
      } else {
        toast.error(result.error || "Ders silinemedi");
      }
    } catch {
      toast.error("Ders silinirken bir hata oluştu");
    }
  };

  if (loadingLessons) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lessons...</p>
        </div>
      </div>
    );
  }

  // Group lessons by unit
  const lessonsByUnit = units.map(unit => ({
    unit,
    lessons: lessons.filter(lesson => lesson.unit?.id === unit.id).sort((a, b) => a.order - b.order)
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lessons</h2>
          <p className="text-gray-600">Manage lessons for {courseName}</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={units.length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Create Lesson
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Lesson</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Select value={newLesson.unitId.toString()} onValueChange={handleUnitChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        {unit.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="title">Lesson Title</Label>
                <Input
                  id="title"
                  value={newLesson.title}
                  onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                  placeholder="Enter lesson title"
                />
              </div>
              <div>
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={newLesson.order}
                  onChange={(e) => setNewLesson({ ...newLesson, order: parseInt(e.target.value) || 1 })}
                  min={1}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="primaryOutline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateLesson} disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Lesson"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Lesson Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Lesson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Lesson Title</Label>
              <Input
                id="edit-title"
                value={editLesson.title}
                onChange={(e) => setEditLesson({ ...editLesson, title: e.target.value })}
                placeholder="Enter lesson title"
              />
            </div>
            <div>
              <Label htmlFor="edit-order">Order</Label>
              <Input
                id="edit-order"
                type="number"
                value={editLesson.order}
                onChange={(e) => setEditLesson({ ...editLesson, order: parseInt(e.target.value) || 1 })}
                min={1}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="primaryOutline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditLesson} disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Lesson"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* No units warning */}
      {units.length === 0 && (
        <div className="text-center py-12 bg-yellow-50 rounded-lg border border-yellow-200">
          <Book className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-yellow-900 mb-2">No units available</h3>
          <p className="text-yellow-700 mb-4">You need to create units first before adding lessons</p>
          <p className="text-sm text-yellow-600">Go to the Units tab to create your first unit</p>
        </div>
      )}

      {/* Lessons grouped by unit */}
      <div className="space-y-8">
        {lessonsByUnit.map(({ unit, lessons: unitLessons }) => (
          <div key={unit.id} className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Book className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{unit.title}</h3>
                <p className="text-sm text-gray-500">{unitLessons.length} lessons</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-11">
              {unitLessons.map((lesson) => (
                <Card key={lesson.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{lesson.title}</CardTitle>
                        <p className="text-sm text-gray-500">Order: {lesson.order} | ID: {lesson.id}</p>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(lesson)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLesson(lesson.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}

              {unitLessons.length === 0 && (
                <div className="col-span-full text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <Book className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No lessons in this unit yet</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setNewLesson({ ...newLesson, unitId: unit.id, order: 1 });
                      setIsCreateOpen(true);
                    }}
                    className="mt-2"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Lesson
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 