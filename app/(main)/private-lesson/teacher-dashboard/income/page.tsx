"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, TrendingUp, Calendar, Users, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useLessonStatusUpdater } from "@/hooks/use-lesson-status-updater";

interface MonthlyIncomeData {
  lessons: number;
  income: number;
}

interface StudentBooking {
  id: number;
  startTime: string;
  student: {
    name: string;
    email: string;
  };
}

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  student: {
    name: string;
  };
  booking: {
    startTime: string;
  };
}

interface IncomeData {
  totalLessons: number;
  totalIncome: number;
  monthlyIncome: Record<string, MonthlyIncomeData>;
  recentBookings: StudentBooking[];
}

interface ReviewData {
  averageRating: number;
  totalReviews: number;
  reviews: Review[];
}

export default function TeacherIncomePage() {
  const [incomeData, setIncomeData] = useState<IncomeData | null>(null);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use the lesson status updater hook to automatically update completed lessons
  useLessonStatusUpdater();

  // Listen for lesson status updates
  useEffect(() => {
    const handleLessonStatusUpdate = () => {
      // Refresh the data when lesson statuses are updated
      fetchData();
    };

    window.addEventListener('lessonStatusUpdated', handleLessonStatusUpdate);
    
    return () => {
      window.removeEventListener('lessonStatusUpdated', handleLessonStatusUpdate);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch income data
      const incomeResponse = await fetch("/api/private-lesson/teacher-income");
      const reviewResponse = await fetch("/api/private-lesson/teacher-reviews");
      
      if (!incomeResponse.ok || !reviewResponse.ok) {
        throw new Error("Failed to fetch data");
      }
      
      const income = await incomeResponse.json();
      const reviews = await reviewResponse.json();
      
      setIncomeData(income);
      setReviewData(reviews);
    } catch (error) {
      console.error("Error fetching teacher data:", error);
      setError("Veriler yüklenirken bir hata oluştu");
      toast.error("Veriler yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error || !incomeData || !reviewData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Hata</h1>
          <p className="text-gray-700 mb-6">{error || "Veriler yüklenemedi"}</p>
        </div>
      </div>
    );
  }

  // Prepare monthly data for display
  const monthlyData = Object.entries(incomeData.monthlyIncome)
    .sort()
    .reverse()
    .slice(0, 6); // Last 6 months

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Gelir Takibi ve Değerlendirmeler</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Ders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incomeData.totalLessons}</div>
            <p className="text-xs text-muted-foreground">
              Tamamlanan ders sayısı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{incomeData.totalIncome}</div>
            <p className="text-xs text-muted-foreground">
              Brüt gelir (ders başına ₺25)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Puan</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {reviewData.averageRating > 0 ? reviewData.averageRating.toFixed(1) : "N/A"}
              {reviewData.averageRating > 0 && (
                <div className="flex">
                  {renderStars(Math.round(reviewData.averageRating))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {reviewData.totalReviews} değerlendirme
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bu Ay</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyData[0] ? `₺${monthlyData[0][1].income}` : "₺0"}
            </div>
            <p className="text-xs text-muted-foreground">
              {monthlyData[0] ? `${monthlyData[0][1].lessons} ders` : "0 ders"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Income */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Aylık Gelir Dağılımı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.length > 0 ? (
                monthlyData.map(([month, data]) => (
                  <div key={month} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">
                        {new Date(month + "-01").toLocaleDateString("tr-TR", {
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-sm text-gray-600">{data.lessons} ders</div>
                    </div>
                    <div className="text-lg font-bold text-green-600">₺{data.income}</div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Henüz tamamlanmış ders bulunmuyor.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Son Değerlendirmeler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviewData.reviews.length > 0 ? (
                reviewData.reviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{review.student.name}</div>
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 mb-2">&ldquo;{review.comment}&rdquo;</p>
                    )}
                    <div className="text-xs text-gray-500">
                      {formatDate(review.createdAt)} - {formatTime(review.booking.startTime)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Henüz değerlendirme bulunmuyor.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Son Tamamlanan Dersler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {incomeData.recentBookings.length > 0 ? (
              incomeData.recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{booking.student.name}</div>
                    <div className="text-sm text-gray-600">{booking.student.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">₺25</div>
                    <div className="text-sm text-gray-600">
                      {formatDate(booking.startTime)} - {formatTime(booking.startTime)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">
                Henüz tamamlanmış ders bulunmuyor.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 