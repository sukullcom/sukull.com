"use client";

import { refillHearts } from "@/actions/user-progress";
import { Button } from "@/components/ui/button";
import { POINTS_TO_REFILL } from "@/constants";
import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { InfinityIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SubscriptionPurchase from "@/components/subscription-purchase";

type Props = {
  hearts: number;
  points: number;
  hasActiveSubscription: boolean;
  hasInfiniteHearts: boolean;
  subscriptionExpiresAt: Date | null;
};

export const Items = ({ hearts, points, hasInfiniteHearts, subscriptionExpiresAt }: Props) => {
  const [pending, startTransition] = useTransition();
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);

  const onRefillHearts = () => {
    if (pending || hearts === 5 || points < POINTS_TO_REFILL) {
      return;
    }

    startTransition(() => {
      refillHearts().catch(() => toast.error("Bir şeyler yanlış gitti"))
    });
  };

  const onSubscribe = async () => {
    if (hasInfiniteHearts) {
      return;
    }

    // Open the subscription purchase dialog
    setShowSubscriptionDialog(true);
  };

  const handleSubscriptionSuccess = () => {
    setShowSubscriptionDialog(false);
    // The page will refresh automatically from the SubscriptionPurchase component
  };

  const handleSubscriptionCancel = () => {
    setShowSubscriptionDialog(false);
  };

  return (
    <div className="w-full">
      {/* Heart Refill Section */}
      <div className="flex items-center w-full p-4 gap-x-4 border-t-2">
        <Image src="/heart.svg" alt="Heart" height={60} width={60} />
        <div className="flex-1">
          <p className="text-neutral-700 text-base lg:text-xl font-bold">
            Canını doldur
          </p>
          <p className="text-neutral-500 text-sm">
            Canlarını 50 puanla doldur
          </p>
        </div>
        <Button
          onClick={onRefillHearts}
          disabled={pending || hearts === 5 || points < POINTS_TO_REFILL || hasInfiniteHearts}
        >
          {hasInfiniteHearts ? (
            <InfinityIcon className="h-4 w-4" />
          ) : hearts === 5 ? (
            "Dolu"
          ) : (
            <div className="flex items-center">
              <Image src="/points.svg" alt="Points" height={20} width={20} />
              <p>{POINTS_TO_REFILL}</p>
            </div>
          )}
        </Button>
      </div>

      {/* Infinite Hearts Subscription Section */}
      <div className="flex items-center w-full p-4 pt-8 gap-x-4 border-t-2">
        <div className="relative">
          <Image src="/heart.svg" alt="Heart" height={60} width={60} />
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
          onClick={onSubscribe}
          disabled={false}
          variant={hasInfiniteHearts ? "secondary" : "primary"}
        >
          {hasInfiniteHearts ? (
            "Aktif"
          ) : (
            <div className="flex items-center">
              <span>100₺/ay</span>
            </div>
          )}
        </Button>
      </div>

      {/* Subscription Purchase Dialog */}
      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xl">
          <DialogHeader>
            <DialogTitle>Sonsuz Can Aboneliği</DialogTitle>
          </DialogHeader>
          <SubscriptionPurchase 
            onSuccess={handleSubscriptionSuccess}
            onCancel={handleSubscriptionCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
