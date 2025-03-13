"use client";

import { courses, userProgress } from "@/db/schema";
import { Card } from "./card";
import { useRouter } from "next/navigation";
import { useTransition, useCallback, memo } from "react";
import { upsertUserProgress } from "@/actions/user-progress";
import { toast } from "sonner";

type Props = {
    courses: typeof courses.$inferSelect[];
    activeCourseId?: typeof userProgress.$inferSelect.activeCourseId;
}

// Memoize the card component to prevent unnecessary re-renders
const MemoizedCard = memo(Card);

export const List = ({courses, activeCourseId}: Props) => {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    // Memoize the onClick handler to prevent recreation on each render
    const onClick = useCallback((id: number) => {
        if (pending) return;

        if (id === activeCourseId){
            return router.push("/learn");
        }

        startTransition(() => {
            upsertUserProgress(id)
                .then(() => {
                    // Success: redirect to learn page
                    router.push("/learn");
                })
                .catch((error) => {
                    console.error("Failed to update course progress:", error);
                    toast.error("Ders ilerlemeniz güncellenirken bir hata oluştu. Lütfen tekrar deneyin.");
                });
        });
    }, [pending, activeCourseId, router]);

    return (
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
                <MemoizedCard
                    key={course.id}
                    id={course.id}
                    title={course.title}
                    imageSrc={course.imageSrc}
                    onClick={onClick}
                    disabled={pending}
                    active={course.id === activeCourseId}
                />
            ))}
            {courses.length === 0 && (
                <div className="col-span-full text-center py-10 text-gray-500">
                    Mevcut ders bulunmamaktadır.
                </div>
            )}
        </div>
    );
}