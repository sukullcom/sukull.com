// app/(main)/(protected)/profile/profile-page-client.tsx
"use client";

import { useState, useTransition, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { updateProfileAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { ProfileSchoolSelector } from "./profile-school-selector";
import { AvatarGenerator } from "random-avatar-generator";
import StreakCalendarAdvanced from "@/components/streak-calendar";

export default function ProfilePageClient({
  profile,
  allSchools,
}: {
  profile: {
    userName: string;
    userImageSrc: string;
    profileLocked: boolean;
    schoolId: number | null;
    istikrar: number;
    dailyTarget: number;
    startDate: string; // The date the user started streak tracking
  };
  allSchools: Array<any>;
}) {
  const [username, setUsername] = useState(profile.userName || "Anonymous");
  const [avatarUrl, setAvatarUrl] = useState(profile.userImageSrc || "/mascot_purple.svg");
  const [dailyTarget, setDailyTarget] = useState(profile.dailyTarget || 50);
  const [selectedSchoolId, setSelectedSchoolId] = useState(profile.schoolId ?? null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  // Memoize the avatar generator to avoid recreating it on each render
  const generator = useMemo(() => new AvatarGenerator(), []);

  // Use useCallback to memoize the function reference
  const handleRandomAvatar = useCallback(() => {
    if (profile.profileLocked) return;
    try {
      setAvatarUrl(generator.generateRandomAvatar());
    } catch (err) {
      console.error("Error generating avatar:", err);
      toast.error("Avatar oluşturulurken bir hata oluştu.");
    }
  }, [profile.profileLocked, generator]);

  // Use useCallback for the save handler
  const handleSave = useCallback(() => {
    setError(null);
    
    if (!username.trim()) {
      setError("Kullanıcı adı boş olamaz.");
      return;
    }
    
    if (!selectedSchoolId) {
      setError("Lütfen bir okul seçin!");
      return;
    }
    
    startTransition(() => {
      updateProfileAction(username.trim(), avatarUrl, selectedSchoolId, dailyTarget)
        .then(() => {
          toast.success("Profil güncellendi! Günlük hedeflenen puan her zaman değiştirilebilir.");
        })
        .catch((err) => {
          console.error("Profile update error:", err);
          setError(err.message || "Profil güncellenirken hata oluştu.");
          toast.error(err.message || "Profil güncellenirken hata oluştu.");
        });
    });
  }, [username, avatarUrl, selectedSchoolId, dailyTarget]);

  // Memoize the daily target options to avoid recreating on every render
  const dailyTargetOptions = useMemo(() => [
    { value: 10, label: "10" },
    { value: 20, label: "20" },
    { value: 30, label: "30" },
    { value: 50, label: "50" },
    { value: 100, label: "100" },
    { value: 200, label: "200" },
    { value: 500, label: "500" },
    { value: 1000, label: "1000" },
    { value: 2000, label: "2000" },
    { value: 5000, label: "5000" },
  ], []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4">
      <div className="border-2 rounded-xl p-6 space-y-4 shadow-lg bg-white w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800">Profil Ayarları</h1>
        {profile.profileLocked && (
          <p className="text-sm text-red-600 text-center">
            Profil bilgilerinde isim, avatar ve okul güncellenemiyor.
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600 text-center">
            {error}
          </p>
        )}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-32 h-32 overflow-hidden rounded-full border-2 border-gray-300">
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              className="w-full h-full object-cover"
              loading="lazy" // Lazy load the avatar image
            />
          </div>
          <Button
            variant="secondary"
            size="lg"
            onClick={handleRandomAvatar}
            disabled={pending || profile.profileLocked}
          >
            Rastgele Avatar Oluştur
          </Button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Kullanıcı Adı</label>
          <input
            className="mt-1 block w-full rounded-md border border-gray-200 shadow-sm p-3 focus:border-blue-500 focus:ring-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={profile.profileLocked}
            maxLength={30} // Limit username length
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Günlük Hedeflenen Puan</label>
          <select
            className="mt-1 block w-full rounded-md border border-gray-200 shadow-sm p-3 focus:border-blue-500 focus:ring-blue-500"
            value={dailyTarget}
            onChange={(e) => setDailyTarget(parseInt(e.target.value))}
          >
            {dailyTargetOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <ProfileSchoolSelector
            schools={allSchools}
            disabled={profile.profileLocked}
            initialSchoolId={selectedSchoolId}
            onSelect={(schoolId) => setSelectedSchoolId(schoolId)}
          />
        </div>
        <div className="mt-4">
          <h2 className="text-sm font-semibold text-gray-700">Aylık İstikrar Takvimi</h2>
          <StreakCalendarAdvanced startDate={profile.startDate} />
        </div>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleSave}
          disabled={pending || (!profile.profileLocked && !username.trim())}
        >
          {pending ? "Kaydediliyor..." : profile.profileLocked ? "Profil Kilitlendi" : "Kaydet"}
        </Button>
      </div>
    </div>
  );
}
