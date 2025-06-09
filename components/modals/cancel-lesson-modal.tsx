"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

interface CancelLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  teacherName?: string;
  lessonTime?: string;
  isLoading?: boolean;
}

export const CancelLessonModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  teacherName, 
  lessonTime,
  isLoading = false 
}: CancelLessonModalProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  if (!isClient) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <div className="flex items-center w-full justify-center mb-5">
            <Image src="/mascot_sad.svg" alt="Mascot" height={80} width={80} />
          </div>
          <DialogTitle className="text-center font-bold text-2xl">
            Dersi İptal Et
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {teacherName && lessonTime ? (
              <>
                <span className="font-medium">{teacherName}</span> ile{" "}
                <span className="font-medium">{lessonTime}</span> tarihindeki dersinizi iptal etmek istediğinizden emin misiniz?
                <br />
                <br />
                Bu işlem geri alınamaz.
              </>
            ) : (
              "Bu dersi iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mb-4">
          <div className="flex flex-col gap-y-4 w-full">
            <Button
              variant="default"
              className="w-full"
              size="lg"
              onClick={onClose}
              disabled={isLoading}
            >
              Vazgeç
            </Button>
            <Button
              variant="danger"
              className="w-full"
              size="lg"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? "İptal Ediliyor..." : "Dersi İptal Et"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 