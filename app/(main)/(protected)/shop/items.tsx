"use client";

import { refillHearts } from "@/actions/user-progress";
import { purchaseStreakFreeze } from "@/actions/user-progress";
import { Button } from "@/components/ui/button";
import { POINTS_TO_REFILL, SCORING_SYSTEM } from "@/constants";
import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { InfinityIcon, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SubscriptionPurchase from "@/components/subscription-purchase";

type Props = {
  hearts: number;
  points: number;
  hasActiveSubscription: boolean;
  hasInfiniteHearts: boolean;
  subscriptionExpiresAt: Date | null;
  streakFreezeCount: number;
};

export const Items = ({
  hearts,
  points,
  hasInfiniteHearts,
  subscriptionExpiresAt,
  streakFreezeCount,
}: Props) => {
  const [pending, startTransition] = useTransition();
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [localFreezeCount, setLocalFreezeCount] = useState(streakFreezeCount);
  const [localPoints, setLocalPoints] = useState(points);

  const freezeCost = SCORING_SYSTEM.STREAK_FREEZE_COST;

  const onRefillHearts = () => {
    if (pending || hearts === 5 || localPoints < POINTS_TO_REFILL) return;
    startTransition(() => {
      refillHearts()
        .then(() => setLocalPoints((p) => p - POINTS_TO_REFILL))
        .catch(() => toast.error("Bir şeyler yanlış gitti"));
    });
  };

  const onBuyStreakFreeze = () => {
    if (pending || localPoints < freezeCost) return;
    startTransition(() => {
      purchaseStreakFreeze()
        .then((res) => {
          if (res?.error) {
            toast.error(res.error);
          } else {
            setLocalFreezeCount((c) => c + 1);
            setLocalPoints((p) => p - freezeCost);
            toast.success("İstikrar Koruma satın alındı!");
          }
        })
        .catch(() => toast.error("Bir şeyler yanlış gitti"));
    });
  };

  return (
    <div className="w-full">
      {/* Heart Refill */}
      <div className="flex items-center w-full p-4 gap-x-4 border-t-2">
        <Image src="/heart.svg" alt="Can" height={60} width={60} />
        <div className="flex-1">
          <p className="text-neutral-700 text-base lg:text-xl font-bold">
            Canını doldur
          </p>
          <p className="text-neutral-500 text-sm">
            {POINTS_TO_REFILL} puanla canlarını 5&apos;e tamamla
          </p>
        </div>
        <Button
          onClick={onRefillHearts}
          disabled={pending || hearts === 5 || localPoints < POINTS_TO_REFILL || hasInfiniteHearts}
        >
          {hasInfiniteHearts ? (
            <InfinityIcon className="h-4 w-4" />
          ) : hearts === 5 ? (
            "Dolu"
          ) : (
            <div className="flex items-center">
              <Image src="/points.svg" alt="Puan" height={20} width={20} />
              <p>{POINTS_TO_REFILL}</p>
            </div>
          )}
        </Button>
      </div>

      {/* Streak Freeze */}
      <div className="flex items-center w-full p-4 gap-x-4 border-t-2">
        <div className="flex items-center justify-center w-[60px] h-[60px]">
          <ShieldCheck className="h-10 w-10 text-blue-500" />
        </div>
        <div className="flex-1">
          <p className="text-neutral-700 text-base lg:text-xl font-bold">
            İstikrar Koruma
          </p>
          <p className="text-neutral-500 text-sm">
            Bir gün hedefini tutturamasan bile istikrarın bozulmasın.
            {localFreezeCount > 0 && (
              <span className="text-blue-600 font-medium"> ({localFreezeCount} adet mevcut)</span>
            )}
          </p>
        </div>
        <Button
          onClick={onBuyStreakFreeze}
          disabled={pending || localPoints < freezeCost}
        >
          <div className="flex items-center">
            <Image src="/points.svg" alt="Puan" height={20} width={20} />
            <p>{freezeCost}</p>
          </div>
        </Button>
      </div>

      {/* Infinite Hearts Subscription */}
      <div className="flex items-center w-full p-4 gap-x-4 border-t-2">
        <div className="relative">
          <Image src="/heart.svg" alt="Can" height={60} width={60} />
          <InfinityIcon className="absolute -top-1 -right-1 h-6 w-6 text-red-500 bg-white rounded-full p-1" />
        </div>
        <div className="flex-1">
          <p className="text-neutral-700 text-base lg:text-xl font-bold">
            Sonsuz Can
          </p>
          <p className="text-neutral-500 text-sm">
            {hasInfiniteHearts ? (
              subscriptionExpiresAt ? (
                `Aktif - ${new Date(subscriptionExpiresAt).toLocaleDateString('tr-TR')} tarihine kadar`
              ) : (
                "Aktif"
              )
            ) : (
              "Aylık 100₺ ile sınırsız can kullan"
            )}
          </p>
        </div>
        <Button
          onClick={() => !hasInfiniteHearts && setShowSubscriptionDialog(true)}
          disabled={false}
          variant={hasInfiniteHearts ? "secondary" : "primary"}
        >
          {hasInfiniteHearts ? "Aktif" : "100₺/ay"}
        </Button>
      </div>

      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xl">
          <DialogHeader>
            <DialogTitle>Sonsuz Can Aboneliği</DialogTitle>
          </DialogHeader>
          <SubscriptionPurchase
            onSuccess={() => setShowSubscriptionDialog(false)}
            onCancel={() => setShowSubscriptionDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
