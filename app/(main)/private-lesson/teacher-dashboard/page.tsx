"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import GoogleMeetLinkManager from "./meet-link";
import { Select, SelectItem, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type TeacherProfile = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  field?: string;
};

const FIELD_OPTIONS = [
  "Matematik",
  "Fizik", 
  "Kimya",
  "Biyoloji",
  "Tarih",
  "Coğrafya",
  "Edebiyat",
  "İngilizce",
  "Almanca",
  "Fransızca",
  "Felsefe",
  "Müzik",
  "Resim",
  "Bilgisayar Bilimleri",
  "Ekonomi",
  "Diğer"
];



export default function TeacherDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [bio, setBio] = useState("");
  const [editingField, setEditingField] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isTeacher, setIsTeacher] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/private-lesson/teacher-details");
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setBio(data.bio || "");
          setEditingField(data.field || "");
          setIsTeacher(true);
        } else if (response.status === 403) {
          // User is not a teacher
          setIsTeacher(false);
        } else {
          console.error("Failed to fetch profile");
          setIsTeacher(false);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setIsTeacher(false);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Use useEffect for navigation to avoid render-time side effects
  useEffect(() => {
    if (!loading && !isTeacher) {
      router.push("/private-lesson");
    }
  }, [loading, isTeacher, router]);

  const saveProfile = async () => {
    if (!editingField) {
      toast.error("Lütfen uzmanlık alanınızı seçin");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/private-lesson/teacher-details", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          bio,
          field: editingField
        }),
      });

      if (response.ok) {
        toast.success("Profil başarıyla kaydedildi!");
        // Update the profile state
        if (profile) {
          setProfile({ 
            ...profile, 
            bio,
            field: editingField
          });
        }
      } else {
        toast.error("Profil kaydedilemedi");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!isTeacher) {
    return null;
  }

  return (
    <div className="container max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Profil Yönetimi</h1>
      
      <div className="space-y-8">
        {/* Profile Summary and Bio Combined */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">{profile?.name}</h2>
            {profile?.field && profile.field !== "Belirtilmemiş" ? (
              <p className="text-primary mt-1 font-medium">{profile.field}</p>
            ) : (
              <p className="text-gray-500 mt-1 text-sm">Uzmanlık alanı belirtilmemiş</p>
            )}
          </div>
          
          <div className="space-y-6">
            {/* Profile Fields */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                <Input value={profile?.name || ""} disabled />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Uzmanlık Alanı</label>
                <Select value={editingField} onValueChange={setEditingField}>
                  <SelectValue placeholder="Uzmanlık alanınızı seçin" />
                  {FIELD_OPTIONS.map((field) => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>
            
            {/* Biography Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Biyografi</label>
              <p className="text-gray-600 text-sm mb-2">
                Öğrencilerin sizi daha iyi tanıması için kendinizi tanıtan bir biyografi yazın.
              </p>
              <Textarea 
                value={bio} 
                onChange={(e) => setBio(e.target.value)}
                className="min-h-[120px]"
                placeholder="Kendinizi tanıtın, eğitim ve öğretim deneyimlerinizden bahsedin..."
              />
            </div>
            
            {/* Single Save Button */}
            <Button 
              onClick={saveProfile} 
              disabled={saving || !editingField}
              variant="primary"
              className="w-full"
              size="lg"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 mr-2 border-2 border-white border-t-transparent animate-spin rounded-full"></span>
                  Kaydediliyor...
                </>
              ) : "Profili Kaydet"}
            </Button>
          </div>
        </div>
        
        {/* Google Meet Link */}
        <GoogleMeetLinkManager />
      </div>
    </div>
  );
} 