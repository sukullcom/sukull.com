"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProfileAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { AvatarGenerator } from "random-avatar-generator";
import { ProfileSchoolSelector } from "./profile-school-selector";
import { CircularProgressbarWithChildren } from "react-circular-progressbar";

// 1) Fetch user’s current profile => { userName, userImageSrc, profileLocked, schoolId }
async function fetchProfileData() {
  const res = await fetch("/api/me");
  if (!res.ok) {
    throw new Error("Profil bilgileri alınamadı");
  }
  return res.json(); // e.g. { userName, userImageSrc, profileLocked, schoolId }
}

// 2) Fetch all schools => returns [{ id: number, name: string, type: string }, ...]
async function fetchAllSchools() {
  const res = await fetch("/api/schools");
  if (!res.ok) {
    throw new Error("Okullar yüklenemedi");
  }
  return res.json();
}

export default function ProfilePage() {
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileLocked, setProfileLocked] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);

  const [pending, startTransition] = useTransition();

  // All schools
  const [allSchools, setAllSchools] = useState<any[]>([]);

  useEffect(() => {
    // 3) Load both profile & schools in parallel
    Promise.all([fetchProfileData(), fetchAllSchools()])
      .then(([profile, schools]) => {
        // from /api/me
        setUsername(profile.userName || "Anonymous");
        setAvatarUrl(profile.userImageSrc || "/mascot_purple.svg");
        setProfileLocked(profile.profileLocked || false);
        setSelectedSchoolId(profile.schoolId ?? null);

        // from /api/schools
        setAllSchools(schools);

      })
      .catch((err) => {
        console.error("Profile or schools load error:", err);
        toast.error("Bilgiler yüklenemedi.");
      });
  }, []);

  // Handle random avatar if not locked
  const handleRandomAvatar = () => {
    if (profileLocked) return;
    const generator = new AvatarGenerator();
    setAvatarUrl(generator.generateRandomAvatar());
  };

  // Save => calls your server action
  const handleSave = async () => {
    if (profileLocked) return;
    if (!selectedSchoolId) {
      toast.error("Lütfen bir okul seçin!");
      return;
    }
    startTransition(() => {
      updateProfileAction(username, avatarUrl, selectedSchoolId)
        .then(() => {
          toast.success("Profil güncellendi. Artık değiştiremezsiniz!");
          setProfileLocked(true);
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
        <h1 className="text-2xl font-bold text-center text-gray-800">
          Profil Ayarları
        </h1>

        {profileLocked && (
          <p className="text-sm text-red-600 text-center">
            Profil bilgilerinde artık değişiklik yapılamaz.
          </p>
        )}

        {/* Avatar + Randomize Button */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-32 h-32 overflow-hidden rounded-full border-2 border-gray-300">
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <Button
            variant="secondary"
            size="lg"
            onClick={handleRandomAvatar}
            disabled={pending || profileLocked}
          >
            Rastgele Avatar Oluştur
          </Button>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Kullanıcı Adı
          </label>
          <input
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={profileLocked}
          />
        </div>

        {/* School Selector */}
        <div>
          <ProfileSchoolSelector
            schools={allSchools}
            disabled={profileLocked}
            initialSchoolId={selectedSchoolId}
            onSelect={(schoolId) => setSelectedSchoolId(schoolId)}
          />
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleSave}
          disabled={pending || profileLocked}
        >
          {profileLocked ? "Profil Kİlİtlendİ" : "Kaydet"}
        </Button>
      </div>
    </div>
  );
}
