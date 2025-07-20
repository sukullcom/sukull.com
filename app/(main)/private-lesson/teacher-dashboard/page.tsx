"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import GoogleMeetLinkManager from "./meet-link";
import { toast } from "sonner";

type TeacherProfile = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  field?: string;
  fields?: string[];
};

// Helper function to extract simplified field names
const getSimplifiedField = (fields?: string[], fallbackField?: string): string => {
  if (fields && fields.length > 0) {
    // Extract unique subject names from fields array
    const subjects = fields.map(field => {
      // Remove grade information (like "5.sınıf", "6.sınıf", etc.)
      return field.replace(/\s*\d+\.?\s*(sınıf|Sınıf)/g, '').trim();
    });
    
    // Get unique subjects
    const uniqueSubjects = Array.from(new Set(subjects));
    return uniqueSubjects.join(', ');
  }
  
  // Fallback to single field, also cleaned
  if (fallbackField) {
    return fallbackField.replace(/\s*\d+\.?\s*(sınıf|Sınıf)/g, '').trim();
  }
  
  return "Belirtilmemiş";
};

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [bio, setBio] = useState("");

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
    setSaving(true);
    try {
      const response = await fetch("/api/private-lesson/teacher-details", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          bio
        }),
      });

      if (response.ok) {
        toast.success("Profil başarıyla kaydedildi!");
        // Update the profile state
        if (profile) {
          setProfile({ 
            ...profile, 
            bio
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
            
            {/* Display admin-assigned fields */}
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Uzmanlık Alanları (Admin Tarafından Atandı)</label>
              {(profile?.fields && profile.fields.length > 0) || profile?.field ? (
                <span className="inline-block px-3 py-1 text-sm bg-primary/10 text-primary rounded-full font-medium">
                  {getSimplifiedField(profile?.fields, profile?.field)}
                </span>
              ) : (
                <p className="text-gray-500 text-sm italic">Henüz uzmanlık alanı atanmamış. Lütfen admin ile iletişime geçin.</p>
              )}
            </div>
            
            {/* Basic profile info */}
            <div className="mt-4 pt-4 border-t">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                  <Input value={profile?.name || ""} disabled className="bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                  <Input value={profile?.email || ""} disabled className="bg-gray-50" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
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
              disabled={saving}
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