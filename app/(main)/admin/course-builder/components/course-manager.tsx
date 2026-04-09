"use client";

import { useState, useMemo } from "react";
import { courses } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, BookOpen, Edit, Trash2, Upload, Search, Settings } from "lucide-react";
import { createCourse, deleteCourse, updateCourse, importCourseFromJSON, appendToCourse } from "../actions";
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
  const [isImporting, setIsImporting] = useState(false);
  const [appendingCourseId, setAppendingCourseId] = useState<number | null>(null);

  const handleAppendJSON = async (courseId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAppendingCourseId(courseId);
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      if (!jsonData.units || !Array.isArray(jsonData.units)) {
        toast.error("Geçersiz JSON formatı. 'units' alanı gereklidir.");
        return;
      }

      const result = await appendToCourse(courseId, jsonData);
      if (result.success && result.stats) {
        const s = result.stats;
        const parts: string[] = [];
        if (s.addedUnits > 0) parts.push(s.addedUnits + " yeni ünite");
        if (s.addedLessons > 0) parts.push(s.addedLessons + " yeni ders");
        if (s.addedChallenges > 0) parts.push(s.addedChallenges + " yeni soru");
        if (s.skippedLessons > 0) parts.push(s.skippedLessons + " mevcut derse eklendi");
        toast.success("İçerik eklendi: " + parts.join(", "));
      } else {
        toast.error(result.error || "İçerik ekleme başarısız");
      }
    } catch (err) {
      toast.error(`JSON dosyası okunamadı: ${err instanceof Error ? err.message : "Geçersiz format"}`);
    } finally {
      setAppendingCourseId(null);
      e.target.value = "";
    }
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      if (!jsonData.course || !jsonData.units || !Array.isArray(jsonData.units)) {
        toast.error("Geçersiz JSON formatı. 'course' ve 'units' alanları gereklidir.");
        return;
      }

      const result = await importCourseFromJSON(jsonData);
      if (result.success && result.course) {
        setCourses([...courses, result.course]);
        toast.success(
          `Kurs başarıyla içe aktarıldı! ${result.stats?.units} ünite, ${result.stats?.lessons} ders, ${result.stats?.challenges} soru oluşturuldu.`
        );
      } else {
        toast.error(result.error || "İçe aktarma başarısız");
      }
    } catch (err) {
      toast.error(`JSON dosyası okunamadı: ${err instanceof Error ? err.message : "Geçersiz format"}`);
    } finally {
      setIsImporting(false);
      e.target.value = "";
    }
  };

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

  const [searchQuery, setSearchQuery] = useState("");

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const q = searchQuery.toLowerCase().trim();
    return courses.filter(
      (c) => c.title.toLowerCase().includes(q) || String(c.id).includes(q)
    );
  }, [courses, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Kurslar <span className="text-gray-400 font-normal text-sm">({courses.length})</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <label
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
              isImporting
                ? "bg-gray-300 pointer-events-none"
                : "bg-amber-500 hover:bg-amber-600 text-white"
            }`}
          >
            <Upload className="w-4 h-4" />
            {isImporting ? "..." : "Yeni Kurs (JSON)"}
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportJSON}
              disabled={isImporting}
            />
          </label>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Boş Kurs
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Yeni Kurs Oluştur</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Kurs Başlığı</Label>
                  <Input
                    id="title"
                    value={newCourse.title}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, title: e.target.value })
                    }
                    placeholder="Kurs başlığını girin"
                  />
                </div>
                <div>
                  <Label htmlFor="imageSrc">Kurs Resmi</Label>
                  <ImageUpload
                    value={newCourse.imageSrc}
                    onChange={(url) =>
                      setNewCourse({
                        ...newCourse,
                        imageSrc: url || "/mascot_purple.svg",
                      })
                    }
                    disabled={isLoading}
                    placeholder="Kurs resmi yükleyin"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="primaryOutline"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button onClick={handleCreateCourse} disabled={isLoading}>
                    {isLoading ? "Oluşturuluyor..." : "Oluştur"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Kurs ara (isim veya ID)..."
          className="w-full sm:w-80 pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
        />
      </div>

      {/* Edit Course Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kursu Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Kurs Başlığı</Label>
              <Input
                id="edit-title"
                value={editCourse.title}
                onChange={(e) =>
                  setEditCourse({ ...editCourse, title: e.target.value })
                }
                placeholder="Kurs başlığını girin"
              />
            </div>
            <div>
              <Label htmlFor="edit-imageSrc">Kurs Resmi</Label>
              <ImageUpload
                value={editCourse.imageSrc}
                onChange={(url) =>
                  setEditCourse({
                    ...editCourse,
                    imageSrc: url || "/mascot_purple.svg",
                  })
                }
                disabled={isLoading}
                placeholder="Kurs resmi yükleyin"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="primaryOutline"
                onClick={() => setIsEditOpen(false)}
              >
                İptal
              </Button>
              <Button onClick={handleEditCourse} disabled={isLoading}>
                {isLoading ? "Güncelleniyor..." : "Güncelle"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Compact Table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-4 py-2.5 w-16">ID</th>
              <th className="px-4 py-2.5">Kurs Adı</th>
              <th className="px-4 py-2.5 text-right w-52">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCourses.map((course) => (
              <tr
                key={course.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-2 text-gray-400 font-mono text-xs">
                  {course.id}
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => onSelectCourse(course)}
                    className="text-gray-800 font-medium hover:text-blue-600 hover:underline text-left"
                  >
                    {course.title}
                  </button>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectCourse(course)}
                      className="h-7 px-2 text-xs text-gray-600 hover:text-blue-600"
                      title="Kursu Yönet"
                    >
                      <Settings className="w-3.5 h-3.5 mr-1" />
                      Yönet
                    </Button>
                    <label
                      className={`inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                        appendingCourseId === course.id
                          ? "bg-gray-200 pointer-events-none text-gray-400"
                          : "text-emerald-600 hover:bg-emerald-50"
                      }`}
                      title="JSON ile içerik ekle"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {appendingCourseId === course.id ? "..." : "Ekle"}
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={(e) => handleAppendJSON(course.id, e)}
                        disabled={appendingCourseId === course.id}
                      />
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(course)}
                      className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600"
                      title="Düzenle"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCourse(course.id)}
                      className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCourses.length === 0 && courses.length > 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            Arama sonucu bulunamadı
          </div>
        )}

        {courses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-3">Henüz kurs yok</p>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              İlk Kursunuzu Oluşturun
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 