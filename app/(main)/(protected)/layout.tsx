// app/(main)/(protected)/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getUserProgress } from "@/db/queries";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const userProgress = await getUserProgress();
  if (!userProgress || !userProgress.activeCourse) {
    redirect("/courses");
  }

  return <>{children}</>;
}
