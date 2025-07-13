"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectItem, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";

interface FieldOption {
  subject: string;
  grade: string;
  displayName: string;
}

interface FieldSelectorProps {
  onFieldsChange: (fields: FieldOption[]) => void;
  isOpen: boolean;
  onClose: () => void;
  applicationId: number;
  teacherName: string;
}

export function FieldSelector({ onFieldsChange, isOpen, onClose, applicationId, teacherName }: FieldSelectorProps) {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [grades, setGrades] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<FieldOption[]>([]);
  const [currentSubject, setCurrentSubject] = useState<string>("");
  const [currentGrade, setCurrentGrade] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchFieldOptions();
    }
  }, [isOpen]);

  const fetchFieldOptions = async () => {
    try {
      const response = await fetch("/api/admin/field-options");
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || []);
        setGrades(data.grades || []);
      } else {
        toast.error("Alan seçenekleri yüklenirken hata oluştu");
      }
    } catch (error) {
      console.error("Error fetching field options:", error);
      toast.error("Alan seçenekleri yüklenirken hata oluştu");
    }
  };

  const addField = () => {
    if (!currentSubject || !currentGrade) {
      toast.error("Lütfen ders ve sınıf seçin");
      return;
    }

    const displayName = `${currentSubject} ${currentGrade}`;
    
    // Check if this field combination already exists
    const exists = selectedFields.some(
      field => field.subject === currentSubject && field.grade === currentGrade
    );
    
    if (exists) {
      toast.error("Bu alan ve sınıf kombinasyonu zaten eklenmiş");
      return;
    }

    const newField: FieldOption = {
      subject: currentSubject,
      grade: currentGrade,
      displayName
    };

    const updatedFields = [...selectedFields, newField];
    setSelectedFields(updatedFields);
    onFieldsChange(updatedFields);
    
    // Reset selectors
    setCurrentSubject("");
    setCurrentGrade("");
  };

  const removeField = (index: number) => {
    const updatedFields = selectedFields.filter((_, i) => i !== index);
    setSelectedFields(updatedFields);
    onFieldsChange(updatedFields);
  };

  const handleApprove = async () => {
    if (selectedFields.length === 0) {
      toast.error("En az bir alan seçmelisiniz");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/teacher-applications/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          action: "approve",
          selectedFields 
        }),
      });

      if (response.ok) {
        toast.success("Başvuru onaylandı ve alanlar belirlendi");
        onClose();
        // Trigger parent component refresh
        window.location.reload();
      } else {
        const errorData = await response.json();
        toast.error(`İşlem başarısız: ${errorData.message || "Bilinmeyen hata"}`);
      }
    } catch (error) {
      console.error("Error approving application:", error);
      toast.error("İşlem başarısız: Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Alan Seçimi: {teacherName}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Field */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Yeni Alan Ekle</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={currentSubject} onValueChange={setCurrentSubject}>
                <SelectValue placeholder="Ders Seçin" />
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </Select>

              <Select value={currentGrade} onValueChange={setCurrentGrade}>
                <SelectValue placeholder="Sınıf Seçin" />
                {grades.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </Select>

              <Button 
                onClick={addField}
                disabled={!currentSubject || !currentGrade}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ekle
              </Button>
            </div>
          </div>

          {/* Selected Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Seçilen Alanlar</h3>
            {selectedFields.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Henüz alan seçilmemiş. Yukarıdan alan ekleyin.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedFields.map((field, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-1"
                  >
                    {field.displayName}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => removeField(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="primaryOutline" onClick={onClose} disabled={loading}>
              İptal
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={selectedFields.length === 0 || loading}
            >
              {loading ? "Onaylanıyor..." : "Onayla"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 