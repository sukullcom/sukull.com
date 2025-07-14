"use client";

import { useState } from "react";
import { courses } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, BookOpen, Edit, Trash2, Upload, Image as ImageIcon } from "lucide-react";
import { createCourse, deleteCourse, updateCourse } from "../actions";
import { toast } from "sonner";
import Image from "next/image";

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
    imageSrc: "/course_logos/default.svg"
  });
  const [editCourse, setEditCourse] = useState({
    title: "",
    imageSrc: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editPreviewImage, setEditPreviewImage] = useState<string | null>(null);

  const handleCreateCourse = async () => {
    if (!newCourse.title.trim()) {
      toast.error("Ders başlığı gereklidir");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createCourse(newCourse);
      if (result.success) {
        setCourses([...courses, result.course]);
        resetCreateForm();
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
        resetEditForm();
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
      imageSrc: course.imageSrc || "/course_logos/default.svg"
    });
    setEditPreviewImage(course.imageSrc || "/course_logos/default.svg");
    setIsEditOpen(true);
  };

  const handleImageUpload = async (file: File, isEdit: boolean = false) => {
    setUploadingImage(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        if (isEdit) {
          setEditCourse(prev => ({ ...prev, imageSrc: result.imageSrc }));
          setEditPreviewImage(result.imageSrc);
        } else {
          setNewCourse(prev => ({ ...prev, imageSrc: result.imageSrc }));
          setPreviewImage(result.imageSrc);
        }
        toast.success("Image uploaded successfully");
      } else {
        toast.error(result.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const resetCreateForm = () => {
    setNewCourse({ title: "", imageSrc: "/course_logos/default.svg" });
    setPreviewImage(null);
    setIsCreateOpen(false);
  };

  const resetEditForm = () => {
    setIsEditOpen(false);
    setEditingCourse(null);
    setEditPreviewImage(null);
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
          <p className="text-gray-600">Manage your courses</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
              <p className="text-sm text-gray-600">Fill in the details to create a new course</p>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  placeholder="Enter course title"
                />
              </div>
              <div>
                <Label>Course Image</Label>
                <div className="space-y-3">
                  {/* Image Preview */}
                  <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    {previewImage || newCourse.imageSrc !== "/course_logos/default.svg" ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={previewImage || newCourse.imageSrc}
                          alt="Course preview"
                          fill
                          className="object-contain rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No image selected</p>
                      </div>
                    )}
                  </div>
                  
                  {/* File Upload */}
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingImage}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            handleImageUpload(file, false);
                          }
                        };
                        input.click();
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingImage ? "Uploading..." : "Upload Image"}
                    </Button>
                    
                    {/* Manual URL Input */}
                    <div className="flex-1">
                      <Input
                        placeholder="Or enter image URL"
                        value={newCourse.imageSrc === "/course_logos/default.svg" ? "" : newCourse.imageSrc}
                        onChange={(e) => {
                          const value = e.target.value || "/course_logos/default.svg";
                          setNewCourse({ ...newCourse, imageSrc: value });
                          setPreviewImage(null);
                        }}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={resetCreateForm}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCourse} disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Course"}
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
            <DialogTitle>Edit Course</DialogTitle>
            <p className="text-sm text-gray-600">Update the course details</p>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Course Title</Label>
              <Input
                id="edit-title"
                value={editCourse.title}
                onChange={(e) => setEditCourse({ ...editCourse, title: e.target.value })}
                placeholder="Enter course title"
              />
            </div>
            <div>
              <Label>Course Image</Label>
              <div className="space-y-3">
                {/* Image Preview */}
                <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  {editPreviewImage || editCourse.imageSrc !== "/course_logos/default.svg" ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={editPreviewImage || editCourse.imageSrc}
                        alt="Course preview"
                        fill
                        className="object-contain rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No image selected</p>
                    </div>
                  )}
                </div>
                
                {/* File Upload */}
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingImage}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          handleImageUpload(file, true);
                        }
                      };
                      input.click();
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingImage ? "Uploading..." : "Upload Image"}
                  </Button>
                  
                  {/* Manual URL Input */}
                  <div className="flex-1">
                    <Input
                      placeholder="Or enter image URL"
                      value={editCourse.imageSrc === "/course_logos/default.svg" ? "" : editCourse.imageSrc}
                      onChange={(e) => {
                        const value = e.target.value || "/course_logos/default.svg";
                        setEditCourse({ ...editCourse, imageSrc: value });
                        setEditPreviewImage(null);
                      }}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
                          <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={resetEditForm}>
                  Cancel
                </Button>
              <Button onClick={handleEditCourse} disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Course"}
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
                  Manage Course
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {courses.length === 0 && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-600 mb-4">Create your first course to get started</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Course
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 