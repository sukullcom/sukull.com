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

// A simple modal for warnings
type WarningModalProps = {
  open: boolean;
  message: string;
  onClose: () => void;
};

export function WarningModal({ open, message, onClose }: WarningModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <div className="flex items-center w-full justify-center mb-5">
            <Image src="/mascot_sad.svg" alt="Mascot" height={80} width={80} />
          </div>
          <DialogTitle className="text-center font-bold text-2xl">
            Uyarı
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mb-4">
          <Button
            variant="danger"
            className="w-full"
            size="lg"
            onClick={onClose}
          >
            Tamam
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
