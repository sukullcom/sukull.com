// app/(main)/(protected)/learn/page.tsx
import { FeedWrapper } from "@/components/feed-wrapper";
import { Header } from "./header";
import {
  getCourseProgress,
  getLessonPercentage,
  getUnits,
} from "@/db/queries";
import { getCurrentDayProgress } from "@/actions/daily-streak";
import { Unit } from "./unit";
import { lessons, units as unitsSchema } from "@/db/schema";
import { CelebrationChecker } from "@/components/celebration-checker";
import { getSubjectColor } from "@/lib/subject-colors";
import { getProtectedContext } from "@/lib/protected-route";

const LearnPage = async () => {
  // (protected) layout user + userProgress + activeCourse garantisi verir.
  // cache() sayesinde ek DB hit yok.
  const { activeCourse } = await getProtectedContext();

  const [units, courseProgress, lessonPercentage, dayProgress] =
    await Promise.all([
      getUnits(),
      getCourseProgress(),
      getLessonPercentage(),
      getCurrentDayProgress(),
    ]);

  if (!courseProgress) {
    return null;
  }

  const subjectColor = getSubjectColor(activeCourse.title);

  return (
    <div className="flex flex-row-reverse gap-[48px] px-3 sm:px-6">
      <FeedWrapper>
        <Header title={activeCourse.title} />
        {dayProgress && (
          <CelebrationChecker
            currentStreak={dayProgress.currentStreak}
            dailyGoalAchieved={dayProgress.achieved}
            pointsEarnedToday={dayProgress.pointsEarnedToday}
            dailyTarget={dayProgress.dailyTarget}
          />
        )}
        {units.map((unit) => (
          <div key={unit.id} className="mb-10">
            <Unit
              id={unit.id}
              order={unit.order}
              description={unit.description}
              title={unit.title}
              lessons={unit.lessons}
              subjectColor={subjectColor}
              activeLesson={
                courseProgress.activeLesson as
                  | (typeof lessons.$inferSelect & {
                      unit: typeof unitsSchema.$inferSelect;
                    })
                  | undefined
              }
              activeLessonPercentage={lessonPercentage}
            />
          </div>
        ))}
      </FeedWrapper>
    </div>
  );
};

export default LearnPage;
