"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { useCompletionModal } from "@/store/use-completion-modal";

export const CompletionModal = () => {
  const [isClient, setIsClient] = useState(false);
  const { isOpen, points, close } = useCompletionModal();
  const router = useRouter();

  useEffect(() => setIsClient(true), []);

  const handleContinue = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    close();
    // Redirect to SubScribe home page using relative path
    router.push('/games/SubScribe');
  };

  const handleModalClose = (open: boolean) => {
    // Prevent accidental closing - only allow explicit button click
    if (!open) {
      return;
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-md bg-white" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center w-full justify-center mb-5">
            <Image src="/mascot_normal.svg" alt="Congratulations" height={100} width={100} />
          </div>
          <DialogTitle className="text-center font-bold text-2xl text-green-600">
            🎉 Tebrikler! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Tüm kelimeleri tamamladın! Harika iş çıkardın.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-lg p-4 text-white text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Image src="/points.svg" alt="Points" width={28} height={28} />
              <span className="text-2xl font-bold">+{points}</span>
            </div>
            <p className="text-sm opacity-90">Puan kazandın!</p>
          </div>
        </div>

        <DialogFooter className="mb-4">
          <div className="flex flex-col gap-y-4 w-full">
            <Button
              variant="primary"
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
              onClick={handleContinue}
              type="button"
            >
              Devam Et
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 