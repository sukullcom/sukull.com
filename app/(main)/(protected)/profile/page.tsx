"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProfileAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { AvatarGenerator } from "random-avatar-generator";

async function fetchProfileData() {
  const res = await fetch("/api/me");
  if (!res.ok) {
    throw new Error("Profil bilgileri alınamadı");
  }
  return res.json(); // { userName, userImageSrc, profileLocked }
}

export default function ProfilePage() {
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileLocked, setProfileLocked] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    fetchProfileData()
      .then((data) => {
        setUsername(data.userName || "User");
        setAvatarUrl(data.userImageSrc || "");
        setProfileLocked(data.profileLocked || false);
        setInitLoading(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Profil bilgileri yüklenemedi.");
        setInitLoading(false);
      });
  }, []);

  const handleRandomAvatar = () => {
    if (profileLocked) return;
    const generator = new AvatarGenerator();
    setAvatarUrl(generator.generateRandomAvatar());
  };

  const handleSave = async () => {
    if (profileLocked) return;
    startTransition(() => {
      updateProfileAction(username, avatarUrl)
        .then(() => {
          toast.success("Profil güncellendi. Artık tekrar değiştiremezsiniz.");
          // set locked so UI updates
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

      <div className="flex flex-col items-center gap-4">
        <div className="w-32 h-32 overflow-hidden rounded-full border border-gray-300">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src="/mascot_purple.svg"
              alt="Default Avatar"
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <Button
          variant="secondary"
          onClick={handleRandomAvatar}
          disabled={pending || profileLocked}
        >
          Rastgele Avatar
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Kullanıcı Adı
        </label>
        <input
          className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={profileLocked}
        />
      </div>

      <Button
        className="mt-6 w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold"
        onClick={handleSave}
        disabled={pending || profileLocked}
      >
        {profileLocked ? "Profil Kilitlendi" : "Kaydet"}
      </Button>
    </div>
  );
}
