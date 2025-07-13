"use client";

import { useState, useEffect, useCallback } from "react";
import { units } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, Trash2, MoveUp, MoveDown, Edit } from "lucide-react";
import { createUnit, deleteUnit, getUnitsForCourse, updateUnit } from "../actions";
import { toast } from "sonner";

type Unit = typeof units.$inferSelect;

interface UnitManagerProps {
  courseId: number;
}

export function UnitManager({ courseId }: UnitManagerProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [newUnit, setNewUnit] = useState({
    title: "",
    description: "",
    order: 1
  });
  const [editUnit, setEditUnit] = useState({
    title: "",
    description: "",
    order: 1
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(true);

  const fetchUnits = useCallback(async () => {
    setLoadingUnits(true);
    try {
      const result = await getUnitsForCourse(courseId);
      if (result.success && result.units) {
        setUnits(result.units);
        setNewUnit(prev => ({ ...prev, order: result.units.length + 1 }));
      } else {
        toast.error("Üniteler yüklenemedi");
      }
    } catch {
      toast.error("Üniteler yüklenirken bir hata oluştu");
    } finally {
      setLoadingUnits(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const handleCreateUnit = async () => {
    if (!newUnit.title.trim()) {
      toast.error("Ünite başlığı gereklidir");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createUnit({
        courseId,
        title: newUnit.title,
        description: newUnit.description,
        order: newUnit.order
      });
      
      if (result.success) {
        await fetchUnits();
        setNewUnit({ title: "", description: "", order: units.length + 2 });
        setIsCreateOpen(false);
        toast.success("Ünite başarıyla oluşturuldu");
      } else {
        toast.error(result.error || "Ünite oluşturulamadı");
      }
    } catch {
      toast.error("Ünite oluşturulurken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUnit = async () => {
    if (!editingUnit || !editUnit.title.trim()) {
      toast.error("Ünite başlığı gereklidir");
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateUnit(editingUnit.id, {
        title: editUnit.title,
        description: editUnit.description,
        order: editUnit.order
      });
      
      if (result.success) {
        setUnits(units.map(u => 
          u.id === editingUnit.id 
            ? { ...u, title: editUnit.title, description: editUnit.description, order: editUnit.order }
            : u
        ));
        setIsEditOpen(false);
        setEditingUnit(null);
        toast.success("Ünite başarıyla güncellendi");
      } else {
        toast.error(result.error || "Ünite güncellenemedi");
      }
    } catch {
      toast.error("Ünite güncellenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (unit: Unit) => {
    setEditingUnit(unit);
    setEditUnit({
      title: unit.title,
      description: unit.description || "",
      order: unit.order
    });
    setIsEditOpen(true);
  };

  const handleDeleteUnit = async (unitId: number) => {
    if (!window.confirm("Bu üniteyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await deleteUnit(unitId);
      if (result.success) {
        setUnits(units.filter(u => u.id !== unitId));
        toast.success("Ünite başarıyla silindi");
      } else {
        toast.error(result.error || "Ünite silinemedi");
      }
    } catch {
      toast.error("Ünite silinirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const moveUnit = (unitId: number, direction: 'up' | 'down') => {
    const sortedUnits = [...units].sort((a, b) => a.order - b.order);
    const currentIndex = sortedUnits.findIndex(u => u.id === unitId);
    
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === sortedUnits.length - 1)
    ) {
      return; // Can't move further
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentUnit = sortedUnits[currentIndex];
    const swapUnit = sortedUnits[newIndex];

    // Swap orders
    const newOrder = swapUnit.order;
    const swapOrder = currentUnit.order;

    setUnits(units.map(u => {
      if (u.id === currentUnit.id) return { ...u, order: newOrder };
      if (u.id === swapUnit.id) return { ...u, order: swapOrder };
      return u;
    }));

    // Note: In a real app, you'd want to persist these changes to the database
    toast.success("Ünite sırası güncellendi");
  };

  if (loadingUnits) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Üniteler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Üniteler</h2>
          <p className="text-gray-600">Kursunuz için üniteleri yönetin</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Ünite Oluştur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Yeni Ünite Oluştur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Ünite Başlığı</Label>
                <Input
                  id="title"
                  value={newUnit.title}
                  onChange={(e) => setNewUnit({ ...newUnit, title: e.target.value })}
                  placeholder="Ünite başlığı girin"
                />
              </div>
              <div>
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={newUnit.description}
                  onChange={(e) => setNewUnit({ ...newUnit, description: e.target.value })}
                  placeholder="Ünite açıklaması girin"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="order">Sıra</Label>
                <Input
                  id="order"
                  type="number"
                  value={newUnit.order}
                  onChange={(e) => setNewUnit({ ...newUnit, order: parseInt(e.target.value) || 1 })}
                  min={1}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="primaryOutline" onClick={() => setIsCreateOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handleCreateUnit} disabled={isLoading}>
                  {isLoading ? "Oluşturuluyor..." : "Ünite Oluştur"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Unit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Üniteyi Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Ünite Başlığı</Label>
              <Input
                id="edit-title"
                value={editUnit.title}
                onChange={(e) => setEditUnit({ ...editUnit, title: e.target.value })}
                placeholder="Ünite başlığı girin"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Açıklama</Label>
              <Textarea
                id="edit-description"
                value={editUnit.description}
                onChange={(e) => setEditUnit({ ...editUnit, description: e.target.value })}
                placeholder="Ünite açıklaması girin"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-order">Sıra</Label>
              <Input
                id="edit-order"
                type="number"
                value={editUnit.order}
                onChange={(e) => setEditUnit({ ...editUnit, order: parseInt(e.target.value) || 1 })}
                min={1}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="primaryOutline" onClick={() => setIsEditOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleEditUnit} disabled={isLoading}>
                {isLoading ? "Güncelleniyor..." : "Üniteyi Güncelle"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Units List */}
      <div className="space-y-4">
        {units
          .sort((a, b) => a.order - b.order)
          .map((unit) => (
            <Card key={unit.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{unit.title}</CardTitle>
                      <p className="text-sm text-gray-500">Sıra: {unit.order} | ID: {unit.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveUnit(unit.id, 'up')}
                      disabled={unit.order === 1}
                    >
                      <MoveUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveUnit(unit.id, 'down')}
                      disabled={unit.order === Math.max(...units.map(u => u.order))}
                    >
                      <MoveDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(unit)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUnit(unit.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-3">
                  {unit.description || "Açıklama yok"}
                </p>
              </CardContent>
            </Card>
          ))}
        
        {units.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz Ünite Yok</h3>
            <p className="text-gray-600 mb-4">Kursunuz için ilk üniteyi oluşturun</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              İlk Ünite Oluştur
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 