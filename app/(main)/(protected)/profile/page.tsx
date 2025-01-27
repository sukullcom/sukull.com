"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProfileAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { AvatarGenerator } from "random-avatar-generator";

// 1) Fetch user’s current profile => { userName, userImageSrc, profileLocked, schoolId }
async function fetchProfileData() {
  const res = await fetch("/api/me");
  if (!res.ok) {
    throw new Error("Profil bilgileri alınamadı");
  }
  return res.json(); // e.g. { userName, userImageSrc, profileLocked, schoolId }
}

// 2) Fetch all schools => returns [{ id: number, name: string }, ...]
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

  const [initLoading, setInitLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  // List of schools for the select
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
        setAllSchools(schools); // e.g. [ {id: 1, name: "Boğaziçi"}, ... ]

        setInitLoading(false);
      })
      .catch((err) => {
        console.error("Profile or schools load error:", err);
        toast.error("Bilgiler yüklenemedi.");
        setInitLoading(false);
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

  if (initLoading) {
    return <div className="p-4">Yükleniyor...</div>;
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Profil Ayarları</h1>

      {profileLocked && (
        <p className="text-sm text-red-600 mb-2">
          Bu profil kilitlenmiştir, artık değişiklik yapamazsınız.
        </p>
      )}

      <div className="flex flex-col items-center gap-4 mb-4">
        <div className="w-32 h-32 overflow-hidden rounded-full border border-gray-300">
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <Button
          variant="secondary"
          onClick={handleRandomAvatar}
          disabled={pending || profileLocked}
        >
          Rastgele Avatar
        </Button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Kullanıcı Adı
        </label>
        <input
          className="w-full border border-gray-300 p-2 rounded-xl"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={profileLocked}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Okul Seç
        </label>
        <select
          className="w-full border border-gray-300 p-2 rounded-xl"
          value={selectedSchoolId ? String(selectedSchoolId) : ""}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedSchoolId(val ? Number(val) : null);
          }}
          disabled={profileLocked}
        >
          <option value="">-Seç-</option>
          {allSchools.map((sch) => (
            <option key={sch.id} value={String(sch.id)}>
              {sch.name}
            </option>
          ))}
        </select>
      </div>

      <Button
        className="w-full py-3 bg-green-600 text-white rounded-xl"
        onClick={handleSave}
        disabled={pending || profileLocked}
      >
        {profileLocked ? "Profil Kilitlendi" : "Kaydet"}
      </Button>
    </div>
  );
}
