"use client";

import { useState } from "react";
import { courses } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, BookOpen, Edit, Trash2 } from "lucide-react";
import { createCourse, deleteCourse, updateCourse } from "../actions";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ui/image-upload";

type Course = typeof courses.$inferSelect;

interface CourseManagerProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
}

export function CourseManager({ courses: initialCourses, onSelectCourse }: CourseManagerProps) {
  const [courses, setCourses] = useState(initialCourses);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [newCourse, setNewCourse] = useState({
    title: "",
    imageSrc: "/mascot_purple.svg"
  });
  const [editCourse, setEditCourse] = useState({
    title: "",
    imageSrc: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateCourse = async () => {
    if (!newCourse.title.trim()) {
      toast.error("Ders başlığı gereklidir");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createCourse(newCourse);
      if (result.success && result.course) {
        setCourses([...courses, result.course]);
        setNewCourse({ title: "", imageSrc: "/mascot_purple.svg" });
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

  const handleEditCourse = async () => {
    if (!editCourse.title.trim()) {
      toast.error("Ders başlığı gereklidir");
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateCourse(editingCourse!.id, editCourse);
      if (result.success) {
        setCourses(courses.map(course => 
          course.id === editingCourse!.id 
            ? { ...course, ...editCourse }
            : course
        ));
        setIsEditOpen(false);
        setEditingCourse(null);
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

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    setEditCourse({
      title: course.title,
      imageSrc: course.imageSrc || "/mascot_purple.svg"
    });
    setIsEditOpen(true);
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!window.confirm("Bu dersi silmek istediğinizden emin misiniz?")) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await deleteCourse(courseId);
      if (result.success) {
        setCourses(courses.filter(course => course.id !== courseId));
        toast.success("Ders başarıyla silindi");
      } else {
        toast.error(result.error || "Ders silinemedi");
      }
    } catch {
      toast.error("Ders silinirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Courses</h2>
          <p className="text-gray-600">Kurslarınızı yönetin</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Kurs Oluştur
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Yeni Kurs Oluştur</DialogTitle>
              <p className="text-sm text-gray-600">Yeni bir kurs oluşturmak için detayları doldurun</p>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Kurs Başlığı</Label>
                <Input
                  id="title"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  placeholder="Kurs başlığını girin"
                />
              </div>
              <div>
                <Label htmlFor="imageSrc">Kurs Resmi</Label>
                <ImageUpload
                  value={newCourse.imageSrc}
                  onChange={(url) => setNewCourse({ ...newCourse, imageSrc: url || "/mascot_purple.svg" })}
                  disabled={isLoading}
                  placeholder="Kurs resmi yükleyin"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="primaryOutline" onClick={() => setIsCreateOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handleCreateCourse} disabled={isLoading}>
                  {isLoading ? "Oluşturuluyor..." : "Kurs Oluştur"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Course Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kursu Düzenle</DialogTitle>
            <p className="text-sm text-gray-600">Kurs detaylarını güncelleyin</p>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Kurs Başlığı</Label>
              <Input
                id="edit-title"
                value={editCourse.title}
                onChange={(e) => setEditCourse({ ...editCourse, title: e.target.value })}
                placeholder="Kurs başlığını girin"
              />
            </div>
            <div>
              <Label htmlFor="edit-imageSrc">Kurs Resmi</Label>
              <ImageUpload
                value={editCourse.imageSrc}
                onChange={(url) => setEditCourse({ ...editCourse, imageSrc: url || "/mascot_purple.svg" })}
                disabled={isLoading}
                placeholder="Kurs resmi yükleyin"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="primaryOutline" onClick={() => setIsEditOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleEditCourse} disabled={isLoading}>
                {isLoading ? "Güncelleniyor..." : "Kursu Güncelle"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <p className="text-sm text-gray-500">ID: {course.id}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(course)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCourse(course.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  Image: {course.imageSrc}
                </div>
                <Button
                  onClick={() => onSelectCourse(course)}
                  className="w-full"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Kursu Yönet
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {courses.length === 0 && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz kurs yok</h3>
            <p className="text-gray-600 mb-4">Başlamak için ilk kursunuzu oluşturun</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              İlk Kursunuzu Oluşturun
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 