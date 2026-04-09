import { FeedWrapper } from "@/components/feed-wrapper";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  getTopTenUsers,
  getUserProgress,
  getUniversityPoints,
  getHighSchoolPoints,
  getSecondarySchoolPoints,
  getElementarySchoolPoints,
  getUserRank,
} from "@/db/queries";
import Image from "next/image";
import { redirect } from "next/navigation";

// Add ISR to leaderboard page
export const revalidate = 300; // Revalidate this page every 5 minutes

const LeaderboardPage = async () => {
  try {
    // Remove the heavy school points update to speed up page loading
    // This will be handled by a background job or cron task instead
    
    // Start all data fetches in parallel for better performance
    const userProgressData = getUserProgress();
    const leaderboardData = getTopTenUsers();
    const universityLeaderboardData = getUniversityPoints();
    const highSchoolLeaderboardData = getHighSchoolPoints();
    const secondarySchoolLeaderboardData = getSecondarySchoolPoints();
    const elementarySchoolLeaderboardData = getElementarySchoolPoints();
    const userAndSchoolRankData = getUserRank();
  
    const [
      userProgress,
      leaderboard,
      universityLeaderboard,
      highSchoolLeaderboard,
      secondarySchoolLeaderboard,
      elementarySchoolLeaderboard,
      userAndSchoolRank,
    ] = await Promise.all([
      userProgressData,
      leaderboardData,
      universityLeaderboardData,
      highSchoolLeaderboardData,
      secondarySchoolLeaderboardData,
      elementarySchoolLeaderboardData,
      userAndSchoolRankData,
    ]);
  
    if (!userProgress || !userProgress.activeCourse) {
      redirect("/courses?message=select-course");
    }
  
    return (
      <div className="flex flex-row-reverse gap-[48px] px-3 sm:px-6">
        <FeedWrapper>
          <div className="w-full flex flex-col items-center">
            <Image
              src="/mascot_red.svg"
              alt="Leaderboard"
              height={120}
              width={120}
              priority={false} // Don't prioritize this image loading
            />
            <h1 className="text-center font-bold text-neutral-800 text-2xl mt-6 mb-2">
              Puan Tabloları
            </h1>
            <p className="text-muted-foreground text-center text-lg mb-6 max-w-2xl">
              Bir gün puan tablolarına bir göz attın ve ne gördün? Hem sen hem de
              okulun oradaydı!
            </p>
  
            {/* User Rank and School Rank */}
            {userAndSchoolRank?.userRank !== undefined &&
              userAndSchoolRank?.schoolRank !== undefined && (
                <div className="w-full flex flex-col items-center bg-gray-50 p-4 sm:p-6 rounded-lg shadow-md mb-8">
                  <h2 className="text-lg font-semibold text-neutral-800 mb-4">
                    Sıralamalar
                  </h2>
                  <div className="grid grid-cols-3 gap-3 w-full max-w-md">
                    <div className="text-center">
                      <p className="text-neutral-600 text-xs sm:text-sm">
                        Öğrenci Sıran
                      </p>
                      <p className="font-bold text-lime-700 text-lg sm:text-xl">
                        {userAndSchoolRank.userRank}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-neutral-600 text-xs sm:text-sm">
                        Okul Sırası
                      </p>
                      <p className="font-bold text-lime-700 text-lg sm:text-xl">
                        {userAndSchoolRank.schoolRank}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-neutral-600 text-xs sm:text-sm">
                        Okuldaki Sıran
                      </p>
                      <p className="font-bold text-lime-700 text-lg sm:text-xl">
                        {userAndSchoolRank.userRankInSchool}
                      </p>
                    </div>
                  </div>
                </div>
              )}
  
            {/* User Leaderboard */}
            <h2 className="text-2xl font-extrabold text-neutral-800 text-center mt-6 mb-4">
              Öğrenciler
            </h2>
            <Separator className="mb-4 h-1 rounded-full bg-gray-300 mx-auto w-24" />
  
            {leaderboard.map((userProgress, index) => (
              <div
                key={userProgress.userId}
                className="flex items-center w-full p-2 sm:p-3 rounded-lg shadow-sm transition-transform transform hover:scale-[1.02] mb-2 bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex items-center justify-center w-8 sm:w-10 mr-2 sm:mr-4 shrink-0">
                  {index === 0 && (
                    <span className="text-xl sm:text-2xl" role="img" aria-label="gold">
                      🏅
                    </span>
                  )}
                  {index === 1 && (
                    <span className="text-xl sm:text-2xl" role="img" aria-label="silver">
                      🥈
                    </span>
                  )}
                  {index === 2 && (
                    <span className="text-xl sm:text-2xl" role="img" aria-label="bronze">
                      🥉
                    </span>
                  )}
                  {index > 2 && (
                    <p className="font-bold text-lime-700 text-base sm:text-lg">{index + 1}</p>
                  )}
                </div>
                <Avatar className="border bg-green-500 h-9 w-9 sm:h-11 sm:w-11 mr-2 sm:mr-4 shrink-0">
                  <AvatarImage
                    className="object-cover"
                    src={userProgress.userImageSrc}
                  />
                </Avatar>
                <p className="font-bold text-neutral-800 flex-1 text-sm sm:text-base truncate mr-2">
                  {userProgress.userName}
                </p>
                <p className="text-neutral-600 text-sm sm:text-base shrink-0">{userProgress.points} Puan</p>
              </div>
            ))}
  
            {/* School Leaderboards - Memoized to avoid re-rendering */}
            {[
              { title: "Üniversiteler", data: universityLeaderboard },
              { title: "Liseler", data: highSchoolLeaderboard },
              { title: "Ortaokullar", data: secondarySchoolLeaderboard },
              { title: "İlkokullar", data: elementarySchoolLeaderboard },
            ].map(({ title, data }) => (
              <div key={title} className="w-full mt-10">
                <h2 className="text-2xl font-extrabold text-neutral-800 text-center mt-6 mb-4">
                  {title}
                </h2>
                <Separator className="mb-4 h-1 rounded-full bg-gray-300 mx-auto w-24" />
                {data.map((school, index) => (
                  <div
                    key={school.schoolId}
                    className="flex items-center w-full p-2 sm:p-3 rounded-lg shadow-sm transition-transform transform hover:scale-[1.02] mb-2 bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex items-center justify-center w-8 sm:w-10 mr-2 sm:mr-4 shrink-0">
                      {index === 0 && (
                        <span className="text-xl sm:text-2xl" role="img" aria-label="gold">
                          🏅
                        </span>
                      )}
                      {index === 1 && (
                        <span className="text-xl sm:text-2xl" role="img" aria-label="silver">
                          🥈
                        </span>
                      )}
                      {index === 2 && (
                        <span className="text-xl sm:text-2xl" role="img" aria-label="bronze">
                          🥉
                        </span>
                      )}
                      {index > 2 && (
                        <p className="font-bold text-lime-700 text-base sm:text-lg">
                          {index + 1}
                        </p>
                      )}
                    </div>
                    <p className="font-bold text-neutral-800 flex-1 text-sm sm:text-base truncate mr-2">
                      {school.schoolName}
                    </p>
                    <p className="text-neutral-600 text-sm sm:text-base shrink-0">{school.totalPoints} Puan</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </FeedWrapper>
      </div>
    );
  } catch (error) {
    console.error("Error in leaderboard page:", error);
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <p className="text-neutral-600">Puan tablolarına erişirken bir hata oluştu. Lütfen sayfayı yenileyin.</p>
      </div>
    );
  }
};

export default LeaderboardPage;
