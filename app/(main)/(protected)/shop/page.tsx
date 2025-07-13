import { FeedWrapper } from "@/components/feed-wrapper";
import { getUserProgress, checkSubscriptionStatus } from "@/db/queries";
import { getServerUser } from "@/lib/auth";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Items } from "./items";

const ShopPage = async () => {
  const user = await getServerUser();
  if (!user) {
    redirect("/login");
  }

  const userProgressData = getUserProgress();
  const hasInfiniteHearts = checkSubscriptionStatus(user.id);

  const [userProgress, hasActiveSubscription] = await Promise.all([userProgressData, hasInfiniteHearts]);

  if (!userProgress || !userProgress.activeCourse) {
    redirect("/courses?message=select-course");
  }

  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">
      <FeedWrapper>
        <div className="w-full flex flex-col items-center">
          <Image src="/mascot_pink.svg" alt="Shop" height={120} width={120} />
          <h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
            Mağaza
          </h1>
          <p className="text-muted-foreground text-center text-lg mb-6">
            Puanlarını harcayarak yeni şeyler satın al.
          </p>
          <Items
            hearts={userProgress.hearts}
            points={userProgress.points}
            hasActiveSubscription={hasActiveSubscription}
            hasInfiniteHearts={userProgress.hasInfiniteHearts}
            subscriptionExpiresAt={userProgress.subscriptionExpiresAt}
          />
        </div>
      </FeedWrapper>
    </div>
  );
};

export default ShopPage;
