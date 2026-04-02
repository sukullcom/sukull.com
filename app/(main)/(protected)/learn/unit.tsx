import { lessons, units } from "@/db/schema"
import { UnitBanner } from "./unit-banner"
import { LessonButton } from "./lesson-button"

type LessonWithProgress = typeof lessons.$inferSelect & {
    completed: boolean
    challengeCount: number
}

type Props = {
    id: number
    order: number
    title: string
    description: string
    lessons: LessonWithProgress[]
    activeLesson: typeof lessons.$inferSelect & {
        unit: typeof units.$inferSelect
    } | undefined
    activeLessonPercentage: number
}

export const Unit = ({
    id,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    order,
    title,
    description,
    lessons,
    activeLesson,
    activeLessonPercentage,
}: Props) => {
    const unitActiveLesson = lessons.find(
        (lesson) => !lesson.completed && lesson.challengeCount > 0
    )
    const isGlobalActiveInThisUnit = activeLesson?.unit?.id === id
    const hasAnyContent = lessons.some((l) => l.challengeCount > 0)

    return (
        <>
            <UnitBanner
                title={title}
                description={description}
                activeLessonId={unitActiveLesson?.id}
                hasContent={hasAnyContent}
            />
            <div className="flex items-center flex-col relative">
                {lessons.map((lesson, index) => {
                    const hasContent = lesson.challengeCount > 0
                    const isCurrent = hasContent && lesson.id === unitActiveLesson?.id
                    const isLocked = !hasContent || (!lesson.completed && !isCurrent)

                    const percentage = isCurrent && isGlobalActiveInThisUnit
                        ? activeLessonPercentage
                        : 0

                    return (
                        <LessonButton 
                            key={lesson.id}
                            id={lesson.id}
                            index={index}
                            totalCount={lessons.length - 1}
                            current={isCurrent}
                            locked={isLocked}
                            percentage={percentage}
                        />
                    )
                })}
            </div>
        </>
    )
}