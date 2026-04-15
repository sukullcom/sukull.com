import {
  getTopUsers,
  getUserProgress,
  getSchoolPointsByType,
  getUserRank,
} from "@/db/queries";
import { getServerUser } from "@/lib/auth";
import db from "@/db/drizzle";
import { schools } from "@/db/schema";
import { sql } from "drizzle-orm";
import Image from "next/image";
import { redirect } from "next/navigation";
import { RankCards } from "./rank-cards";
import { LeaderboardClient } from "./leaderboard-client";

export const revalidate = 300;

const INITIAL_LIMIT = 50;

const LeaderboardPage = async () => {
  try {
    const [
      userProgress,
      user,
      topUsers,
      universityData,
      highSchoolData,
      secondaryData,
      elementaryData,
      userAndSchoolRank,
      citiesData,
    ] = await Promise.all([
      getUserProgress(),
      getServerUser(),
      getTopUsers(INITIAL_LIMIT, 0),
      getSchoolPointsByType("university", INITIAL_LIMIT, 0),
      getSchoolPointsByType("high_school", INITIAL_LIMIT, 0),
      getSchoolPointsByType("secondary_school", INITIAL_LIMIT, 0),
      getSchoolPointsByType("elementary_school", INITIAL_LIMIT, 0),
      getUserRank(),
      db
        .selectDistinct({ city: schools.city })
        .from(schools)
        .orderBy(sql`${schools.city} ASC`),
    ]);

    if (!userProgress || !userProgress.activeCourse) {
      redirect("/courses?message=select-course");
    }

    const cities = citiesData.map((c) => c.city);

    return (
      <div className="w-full pb-10 px-3 sm:px-6 overflow-x-hidden">
        <div className="w-full flex flex-col items-center overflow-hidden">
          <Image
            src="/mascot_red.svg"
            alt="Leaderboard"
            height={90}
            width={90}
            priority={false}
          />
          <h1 className="text-center font-bold text-neutral-800 text-2xl mt-4 mb-1">
            Puan Tabloları
          </h1>
          <p className="text-muted-foreground text-center text-sm mb-6 max-w-md">
            Bir gün puan tablolarına bir göz attın ve ne gördün? Hem sen hem
            de okulun oradaydı!
          </p>

          <RankCards
            userRank={userAndSchoolRank?.userRank ?? null}
            schoolRank={userAndSchoolRank?.schoolRank ?? null}
            userRankInSchool={userAndSchoolRank?.userRankInSchool ?? null}
          />

          <LeaderboardClient
            initialUsers={topUsers}
            initialSchools={{
              university: universityData,
              high_school: highSchoolData,
              secondary_school: secondaryData,
              elementary_school: elementaryData,
            }}
            currentUserId={user?.id ?? null}
            currentSchoolId={userAndSchoolRank?.schoolId ?? null}
            cities={cities}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in leaderboard page:", error);
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <p className="text-neutral-600">
          Puan tablolarına erişirken bir hata oluştu. Lütfen sayfayı yenileyin.
        </p>
      </div>
    );
  }
};

export default LeaderboardPage;
