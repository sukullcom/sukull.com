"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import GoogleMeetLinkManager from "./meet-link";
import Image from "next/image";

type TeacherProfile = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  field?: string;
  priceRange?: string;
};

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [isTeacher, setIsTeacher] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [bio, setBio] = useState("");

  // Check if the user is a teacher and load profile
  useEffect(() => {
    const loadTeacherProfile = async () => {
      try {
        // Check teacher status
        const statusResponse = await fetch("/api/private-lesson/check-teacher-status");
        const statusData = await statusResponse.json();
        
        if (!statusData.teacher) {
          setIsTeacher(false);
          setLoading(false);
          return;
        }
        
        setIsTeacher(true);
        
        // Fetch teacher profile details
        const profileResponse = await fetch("/api/private-lesson/teacher-details");
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setProfile(profileData);
          setBio(profileData.bio || "");
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading teacher profile:", error);
        setLoading(false);
      }
    };

    loadTeacherProfile();
  }, []);

  const saveBio = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/private-lesson/teacher-details/${profile.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ bio })
      });
      
      if (response.ok) {
        // Update local state
        setProfile(prev => prev ? {...prev, bio} : null);
        alert("Profiliniz başarıyla güncellendi!");
      } else {
        alert("Profil güncellenirken bir hata oluştu.");
      }
    } catch (error) {
      console.error("Error saving bio:", error);
      alert("Profil güncellenirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // If not a teacher, redirect to private lesson page
  if (!isTeacher) {
    router.push("/private-lesson");
    return null;
  }

  return (
    <div className="container max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Profil Yönetimi</h1>
      
      <div className="space-y-8">
        {/* Profile Summary */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">{profile?.name}</h2>
            {profile?.field && (
              <p className="text-primary mt-1 font-medium">{profile.field}</p>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
              <Input value={profile?.name || ""} disabled className="bg-gray-50" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Uzmanlık Alanı</label>
              <Input value={profile?.field || ""} disabled className="bg-gray-50" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat Aralığı</label>
              <Input value={profile?.priceRange || ""} disabled className="bg-gray-50" />
            </div>
          </div>
        </div>
        
        {/* Bio Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Biyografi</h2>
          <p className="text-gray-600 text-sm mb-4">
            Öğrencilerin sizi daha iyi tanıması için kendinizi tanıtan bir biyografi yazın.
          </p>
          
          <Textarea 
            value={bio} 
            onChange={(e) => setBio(e.target.value)}
            className="min-h-[150px] mb-4"
            placeholder="Kendinizi tanıtın, eğitim ve öğretim deneyimlerinizden bahsedin..."
          />
          
          <Button 
            onClick={saveBio} 
            disabled={saving}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 mr-2 border-2 border-white border-t-transparent animate-spin rounded-full"></span>
                Kaydediliyor...
              </>
            ) : "Biyografiyi Kaydet"}
          </Button>
        </div>
        
        {/* Google Meet Link */}
        <GoogleMeetLinkManager />
      </div>
    </div>
  );
} 