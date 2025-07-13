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
  STREAK_REQUIREMENTS,
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
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(profile.schoolId ?? null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  // Check granular profile editing requirements
  const userAchievements = {
    profileEditingUnlocked: profile.profileEditingUnlocked,
    studyBuddyUnlocked: profile.studyBuddyUnlocked,
    codeShareUnlocked: profile.codeShareUnlocked,
  };
  
  const canChangeUsername = checkStreakRequirement(profile.istikrar, "USERNAME_CHANGE", userAchievements);
  const canChangeDailyGoal = checkStreakRequirement(profile.istikrar, "DAILY_GOAL_CHANGE", userAchievements);
  const canChangeAvatar = checkStreakRequirement(profile.istikrar, "AVATAR_CHANGE", userAchievements);
  const canSelectSchool = checkStreakRequirement(profile.istikrar, "SCHOOL_SELECTION", userAchievements);
  
  // Legacy check for backwards compatibility (keeping for potential future use)
  // const canEditProfile = canChangeUsername && canChangeDailyGoal && canChangeAvatar && canSelectSchool;
  
  // Memoize the avatar generator to avoid recreating it on each render
  const generator = useMemo(() => new AvatarGenerator(), []);

  // Use useCallback to memoize the function reference
  const handleRandomAvatar = useCallback(() => {
    if (!canChangeAvatar) {
      toast.error(getStreakRequirementMessage("AVATAR_CHANGE"));
      return;
    }
    
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
  }, [generator, canChangeAvatar]);

  // Use useCallback for the save handler
  const handleSave = useCallback(() => {
    setError(null);
    
    // Check individual requirements before proceeding
    if (username.trim() !== profile.userName && !canChangeUsername) {
      toast.error(getStreakRequirementMessage("USERNAME_CHANGE"));
      return;
    }
    
    if (avatarUrl !== profile.userImageSrc && !canChangeAvatar) {
      toast.error(getStreakRequirementMessage("AVATAR_CHANGE"));
      return;
    }
    
    if (dailyTarget !== profile.dailyTarget && !canChangeDailyGoal) {
      toast.error(getStreakRequirementMessage("DAILY_GOAL_CHANGE"));
      return;
    }

    if (selectedSchoolId !== profile.schoolId && !canSelectSchool) {
      toast.error(getStreakRequirementMessage("SCHOOL_SELECTION"));
      return;
    }
    
    if (!username.trim()) {
      setError("Kullanıcı adı boş olamaz.");
      return;
    }
    
    // School selection logic:
    // 1. If user is trying to change school and doesn't have permission -> block
    // 2. If user has no school and can select one -> require selection
    // 3. If user has no school and can't select one -> allow saving without school
    // 4. If user already has a school -> keep existing school unless they selected a new one
    
    let schoolToSave = profile.schoolId; // Default to current school
    
    if (selectedSchoolId !== profile.schoolId) {
      // User is trying to change their school
      if (!canSelectSchool) {
        // Already checked above, but this is a fallback
        toast.error(getStreakRequirementMessage("SCHOOL_SELECTION"));
        return;
      }
      schoolToSave = selectedSchoolId;
    }
    
    // Only require school selection if user has no school, has permission to select, but hasn't selected one
    if (!profile.schoolId && !selectedSchoolId && canSelectSchool) {
      setError("Lütfen bir okul seçin!");
      return;
    }
    
    startTransition(() => {
      updateProfileAction(username.trim(), avatarUrl, schoolToSave, dailyTarget)
        .then(() => {
          if (!profile.schoolId && !schoolToSave && !canSelectSchool) {
            toast.success("Profil güncellendi! Okul seçimi için " + STREAK_REQUIREMENTS.SCHOOL_SELECTION + " günlük istikrar gerekli.");
          } else {
          toast.success("Profil güncellendi!");
          }
        })
        .catch((err) => {
          console.error("Profile update error:", err);
          setError(err.message || "Profil güncellenirken hata oluştu.");
          toast.error(err.message || "Profil güncellenirken hata oluştu.");
        });
    });
  }, [username, avatarUrl, selectedSchoolId, dailyTarget, canChangeUsername, canChangeAvatar, canChangeDailyGoal, canSelectSchool, profile]);

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
                }}
              />
            </div>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleRandomAvatar}
              disabled={pending || !canChangeAvatar}
              title={!canChangeAvatar ? getStreakRequirementMessage("AVATAR_CHANGE") : ""}
            >
              Rastgele Avatar Oluştur
            </Button>
            {!canChangeAvatar && (
              <p className="text-xs text-amber-600 text-center mt-2">
                🔒 Avatar değiştirmek için {STREAK_REQUIREMENTS.AVATAR_CHANGE} günlük istikrar gerekli
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Kullanıcı Adı</label>
            <input
              className={`mt-1 block w-full rounded-md border shadow-sm p-3 focus:ring-blue-500 ${
                !canChangeUsername 
                  ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed' 
                  : 'border-gray-200 focus:border-blue-500'
              }`}
              value={username}
              onChange={(e) => canChangeUsername && setUsername(e.target.value)}
              maxLength={30}
              disabled={!canChangeUsername}
              title={!canChangeUsername ? getStreakRequirementMessage("USERNAME_CHANGE") : ""}
            />
            {!canChangeUsername && (
              <p className="text-xs text-amber-600 mt-1">
                🔒 Kullanıcı adı değiştirmek için {STREAK_REQUIREMENTS.USERNAME_CHANGE} günlük istikrar gerekli
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Günlük Hedeflenen Puan</label>
            <select
              className={`mt-1 block w-full rounded-md border shadow-sm p-3 focus:ring-blue-500 ${
                !canChangeDailyGoal 
                  ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed' 
                  : 'border-gray-200 focus:border-blue-500'
              }`}
              value={dailyTarget}
              onChange={(e) => canChangeDailyGoal && setDailyTarget(parseInt(e.target.value))}
              disabled={!canChangeDailyGoal}
              title={!canChangeDailyGoal ? getStreakRequirementMessage("DAILY_GOAL_CHANGE") : ""}
            >
              {dailyTargetOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {!canChangeDailyGoal && (
              <p className="text-xs text-amber-600 mt-1">
                🔒 Günlük hedef değiştirmek için {STREAK_REQUIREMENTS.DAILY_GOAL_CHANGE} günlük istikrar gerekli
              </p>
            )}
          </div>
          
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-gray-700">Aylık İstikrar Takvimi</h2>
            <StreakCalendarAdvanced startDate={profile.startDate} />
          </div>
          
          <div>
            <div className={`${
              !canSelectSchool 
                ? 'opacity-50 pointer-events-none' 
                : ''
            }`}>
            <ProfileSchoolSelector
              schools={allSchools}
              initialSchoolId={selectedSchoolId}
                onSelect={(schoolId) => canSelectSchool && setSelectedSchoolId(schoolId)}
            />
            </div>
            {!canSelectSchool && (
              <p className="text-xs text-amber-600 mt-2">
                🔒 Okul seçmek için {STREAK_REQUIREMENTS.SCHOOL_SELECTION} günlük istikrar gerekli
              </p>
            )}
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
          
          {/* Streak Progress Information */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">📊 Profil Özellikleriniz</h3>
            <div className="space-y-2 text-xs">
              <div className={`flex justify-between items-center ${canChangeUsername ? 'text-green-700' : 'text-amber-700'}`}>
                <span>Kullanıcı Adı Değiştirme</span>
                <span className="font-medium">
                  {canChangeUsername ? '✅ Açık' : `🔒 ${STREAK_REQUIREMENTS.USERNAME_CHANGE} gün gerekli`}
                </span>
              </div>
              <div className={`flex justify-between items-center ${canChangeDailyGoal ? 'text-green-700' : 'text-amber-700'}`}>
                <span>Günlük Hedef Belirleme</span>
                <span className="font-medium">
                  {canChangeDailyGoal ? '✅ Açık' : `🔒 ${STREAK_REQUIREMENTS.DAILY_GOAL_CHANGE} gün gerekli`}
                </span>
              </div>
              <div className={`flex justify-between items-center ${canChangeAvatar ? 'text-green-700' : 'text-amber-700'}`}>
                <span>Avatar Değiştirme</span>
                <span className="font-medium">
                  {canChangeAvatar ? '✅ Açık' : `🔒 ${STREAK_REQUIREMENTS.AVATAR_CHANGE} gün gerekli`}
                </span>
              </div>
              <div className={`flex justify-between items-center ${canSelectSchool ? 'text-green-700' : 'text-amber-700'}`}>
                <span>Okul Seçimi</span>
                <span className="font-medium">
                  {canSelectSchool ? '✅ Açık' : `🔒 ${STREAK_REQUIREMENTS.SCHOOL_SELECTION} gün gerekli`}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-blue-200">
              <div className="flex justify-between items-center text-sm font-medium text-blue-800">
                <span>Mevcut İstikrarınız</span>
                <span>{profile.istikrar} gün</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 