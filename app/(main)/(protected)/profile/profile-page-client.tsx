"use client";

import { useState, useTransition, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { updateProfileAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { ProfileSchoolSelector } from "./profile-school-selector";
import { AvatarGenerator } from "random-avatar-generator";
import Image from "next/image";
import { School } from "@/app/types";
import { normalizeAvatarUrl } from "@/utils/avatar";
import StreakCalendarAdvanced from "@/components/streak-calendar";
import { 
  checkStreakRequirement, 
  getStreakRequirementMessage,
} from "@/utils/streak-requirements";

export default function ProfilePageClient({
  profile,
  allSchools,
}: {
  profile: {
    userName: string;
    userImageSrc: string;
    schoolId: number | null;
    istikrar: number;
    dailyTarget: number;
    startDate: string; // The date the user started streak tracking
    profileEditingUnlocked?: boolean;
    studyBuddyUnlocked?: boolean;
    codeShareUnlocked?: boolean;
  };
  allSchools: School[];
}) {
  const [username, setUsername] = useState(profile.userName || "Anonymous");
  const [avatarUrl, setAvatarUrl] = useState(normalizeAvatarUrl(profile.userImageSrc));
  const [dailyTarget, setDailyTarget] = useState(profile.dailyTarget || 50);
  const [selectedSchoolId, setSelectedSchoolId] = useState(profile.schoolId ?? null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  // Check if user meets profile editing requirements
  const canEditProfile = checkStreakRequirement(profile.istikrar, "PROFILE_EDITING", {
    profileEditingUnlocked: profile.profileEditingUnlocked,
    studyBuddyUnlocked: profile.studyBuddyUnlocked,
    codeShareUnlocked: profile.codeShareUnlocked,
  });
  
  // Memoize the avatar generator to avoid recreating it on each render
  const generator = useMemo(() => new AvatarGenerator(), []);

  // Use useCallback to memoize the function reference
  const handleRandomAvatar = useCallback(() => {
    try {
      // Generate a new random avatar URL from the avataaars.io service
      const newAvatarUrl = generator.generateRandomAvatar();
      console.log("Generated avatar URL:", newAvatarUrl);
      
      // Set the new avatar URL
      setAvatarUrl(newAvatarUrl);
      
      // Show success message
      toast.success("Yeni avatar oluşturuldu!");
    } catch (err) {
      console.error("Error generating avatar:", err);
      toast.error("Avatar oluşturulurken bir hata oluştu.");
    }
  }, [generator]);

  // Use useCallback for the save handler
  const handleSave = useCallback(() => {
    if (!canEditProfile) {
      toast.error(getStreakRequirementMessage("PROFILE_EDITING"));
      return;
    }

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
          toast.success("Profil güncellendi!");
        })
        .catch((err) => {
          console.error("Profile update error:", err);
          setError(err.message || "Profil güncellenirken hata oluştu.");
          toast.error(err.message || "Profil güncellenirken hata oluştu.");
        });
    });
  }, [username, avatarUrl, selectedSchoolId, dailyTarget, canEditProfile]);

  // Memoize the daily target options to avoid recreating on every render
  const dailyTargetOptions = useMemo(() => [
    { value: 25, label: "25 puan" },
    { value: 50, label: "50 puan" },
    { value: 75, label: "75 puan" },
    { value: 100, label: "100 puan" },
    { value: 150, label: "150 puan" },
    { value: 200, label: "200 puan" },
    { value: 250, label: "250 puan" },
    { value: 300, label: "300 puan" },
  ], []);

  // Determine if the avatar is from avataaars.io (external URL)
  const isExternalAvatar = avatarUrl.startsWith('http');

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="border-2 rounded-xl p-6 space-y-4 shadow-lg bg-white">
          <h1 className="text-2xl font-bold text-center text-gray-800">Profil Ayarları</h1>
          
          {error && (
            <p className="text-sm text-red-600 text-center">
              {error}
            </p>
          )}
          
          <div className="flex flex-col items-center space-y-4">
            <div className="w-32 h-32 overflow-hidden rounded-full relative">
              <Image 
                src={avatarUrl} 
                alt="Avatar" 
                fill
                sizes="(max-width: 640px) 100vw, 128px"
                className="object-cover"
                priority
                unoptimized={isExternalAvatar}
                onError={() => {
                  console.error("Failed to load avatar image");
                  setAvatarUrl(normalizeAvatarUrl(null));
                  toast.error("Avatar yüklenemedi, varsayılan avatar kullanılıyor");
                }}
              />
            </div>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleRandomAvatar}
              disabled={pending}
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
              maxLength={30}
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
            disabled={pending || !username.trim()}
          >
            {pending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </div>
    </div>
  );
} 