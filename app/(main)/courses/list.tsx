"use client";

import { courses, userProgress } from "@/db/schema";
import { Card } from "./card";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useCallback, memo, useEffect, useRef } from "react";
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
    const searchParams = useSearchParams();
    const [pending, startTransition] = useTransition();
    const toastShownRef = useRef(false);

    // Show toast message when user is redirected from protected routes
    useEffect(() => {
        const message = searchParams.get('message');
        if (message === 'select-course' && !toastShownRef.current) {
            toast.info("🎯 Öğrenmeye başlamak için önce bir ders seçmelisiniz!");
            toastShownRef.current = true;
            
            // Clean up the URL
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('message');
            window.history.replaceState({}, '', newUrl.toString());
        }
    }, [searchParams]);

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
};