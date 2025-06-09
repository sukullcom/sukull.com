"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
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
  const handleConfirm = () => {
    onConfirm();
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
            {teacherName} ile {getDayName(selectedSlot.dayOfWeek)} günü saat {formatTime(selectedSlot.startTime)} için bir ders rezerve etmek istediğinizden emin misiniz?
          </DialogDescription>
        </DialogHeader>

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