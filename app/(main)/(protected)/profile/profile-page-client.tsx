// app/(main)/(protected)/profile/profile-page-client.tsx
"use client";

import { useState, useTransition } from "react";
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

  const handleRandomAvatar = () => {
    if (profile.profileLocked) return;
    const generator = new AvatarGenerator();
    setAvatarUrl(generator.generateRandomAvatar());
  };

  const handleSave = () => {
    if (!selectedSchoolId) {
      toast.error("Lütfen bir okul seçin!");
      return;
    }
    startTransition(() => {
      updateProfileAction(username, avatarUrl, selectedSchoolId, dailyTarget)
        .then(() => {
          toast.success("Profil güncellendi! Günlük hedeflenen puan her zaman değiştirilebilir.");
        })
        .catch((err) => {
          console.error(err);
          toast.error(err.message || "Profil güncellenirken hata oluştu.");
        });
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4">
      <div className="border-2 rounded-xl p-6 space-y-4 shadow-lg bg-white w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800">Profil Ayarları</h1>
        {profile.profileLocked && (
          <p className="text-sm text-red-600 text-center">
            Profil bilgilerinde isim, avatar ve okul güncellenemiyor.
          </p>
        )}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-32 h-32 overflow-hidden rounded-full border-2 border-gray-300">
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
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
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Günlük Hedeflenen Puan</label>
          <select
            className="mt-1 block w-full rounded-md border border-gray-200 shadow-sm p-3 focus:border-blue-500 focus:ring-blue-500"
            value={dailyTarget}
            onChange={(e) => setDailyTarget(parseInt(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={500}>500</option>
            <option value={1000}>1000</option>
            <option value={2000}>2000</option>
            <option value={5000}>5000</option>
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
        <div className="flex justify-center items-center space-x-2 mt-4">
          <span className="text-sm text-gray-700">Toplam İstikrar:</span>
          <span className="font-bold text-xl text-blue-600">{profile.istikrar}</span>
        </div>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleSave}
          disabled={pending || (!profile.profileLocked && !username)}
        >
          {profile.profileLocked ? "Profil Kilitlendi" : "Kaydet"}
        </Button>
      </div>
    </div>
  );
}
