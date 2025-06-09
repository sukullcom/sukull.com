"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  teacherName: string;
  selectedSlot: {
    dayOfWeek: number;
    startTime: Date;
    endTime: Date;
  } | null;
  isLoading: boolean;
}

const getDayName = (dayOfWeek: number): string => {
  const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  return days[dayOfWeek] || "Bilinmeyen";
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const ReservationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  teacherName, 
  selectedSlot, 
  isLoading 
}: ReservationModalProps) => {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setNotes("");
    }
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm(notes);
  };

  if (!selectedSlot) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <div className="flex items-center w-full justify-center mb-5">
            <Image src="/mascot_happy.svg" alt="Mascot" height={80} width={80} />
          </div>
          <DialogTitle className="text-center font-bold text-2xl">
            Ders Rezervasyonu
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {teacherName} ile {getDayName(selectedSlot.dayOfWeek)} günü saat {formatTime(selectedSlot.startTime)} için bir ders rezerve ediyorsunuz
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="notes">Notlar (İsteğe bağlı)</Label>
            <Textarea
              id="notes"
              placeholder="Görüşmek istediğiniz konuları veya özel notlarınızı buraya ekleyebilirsiniz"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 resize-none"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="mb-4">
          <div className="flex flex-col gap-y-4 w-full">
            <Button
              variant="primary"
              className="w-full"
              size="lg"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <span className="h-4 w-4 mr-2 border-2 border-white border-t-transparent animate-spin rounded-full"></span>
                  Rezervasyon yapılıyor...
                </div>
              ) : "Dersi Rezerve Et"}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              size="lg"
              onClick={onClose}
              disabled={isLoading}
            >
              İptal
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 