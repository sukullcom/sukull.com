"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProfileAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { AvatarGenerator } from "random-avatar-generator";
import { ProfileSchoolSelector } from "./profile-school-selector";

// Accept the server-fetched props
export default function ProfilePageClient({
  profile,
  allSchools,
}: {
  profile: {
    userName: string;
    userImageSrc: string;
    profileLocked: boolean;
    schoolId: number | null;
  };
  allSchools: Array<any>;
}) {
  // Initialize state from the server data
  const [username, setUsername] = useState(profile.userName || "Anonymous");
  const [avatarUrl, setAvatarUrl] = useState(profile.userImageSrc || "/mascot_purple.svg");
  const [profileLocked, setProfileLocked] = useState(profile.profileLocked);
  const [selectedSchoolId, setSelectedSchoolId] = useState(profile.schoolId ?? null);
  const [pending, startTransition] = useTransition();

  const handleRandomAvatar = () => {
    if (profileLocked) return;
    const generator = new AvatarGenerator();
    setAvatarUrl(generator.generateRandomAvatar());
  };

  const handleSave = () => {
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
        <h1 className="text-2xl font-bold text-center text-gray-800">Profil Ayarları</h1>
        {profileLocked && (
          <p className="text-sm text-red-600 text-center">
            Profil bilgilerinde artık değişiklik yapılamaz.
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
            disabled={pending || profileLocked}
          >
            Rastgele Avatar Oluştur
          </Button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Kullanıcı Adı</label>
          <input
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-3 focus:border-blue-500 focus:ring-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={profileLocked}
          />
        </div>
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
          {profileLocked ? "Profil Kilitlendi" : "Kaydet"}
        </Button>
      </div>
    </div>
  );
}
