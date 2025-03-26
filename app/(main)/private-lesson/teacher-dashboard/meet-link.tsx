"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import Input from "@/components/ui/input";

export default function GoogleMeetLinkManager() {
  const [meetLink, setMeetLink] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch the current meet link when the component loads
  useEffect(() => {
    const fetchMeetLink = async () => {
      try {
        const response = await fetch("/api/teacher-meet-link");
        if (response.ok) {
          const data = await response.json();
          setMeetLink(data.meetLink || "");
        } else {
          toast.error("Bağlantı yüklenirken bir hata oluştu");
        }
      } catch (error) {
        console.error("Error fetching meet link:", error);
        toast.error("Bağlantı yüklenirken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    fetchMeetLink();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await fetch("/api/teacher-meet-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ meetLink }),
      });
      
      if (response.ok) {
        toast.success("Google Meet bağlantısı başarıyla kaydedildi");
        setIsEditing(false);
      } else {
        const data = await response.json();
        toast.error(`Hata: ${data.message || "Bir hata oluştu"}`);
      }
    } catch (error) {
      console.error("Error saving meet link:", error);
      toast.error("Bağlantı kaydedilirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded p-4 mb-6">
        <div className="animate-pulse h-32 flex items-center justify-center">
          <p className="text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded p-4 mb-6">
      <h2 className="text-xl font-bold mb-4">Google Meet Bağlantısı</h2>
      
      <div className="space-y-4">
        <p className="text-gray-600">
          Aşağıda öğrencilerinizle paylaşılacak olan Google Meet bağlantınızı düzenleyebilirsiniz.
          Bu bağlantı, öğrenciler özel ders aldığında onlara gösterilecektir.
        </p>
        
        {isEditing ? (
          <div className="space-y-4">
            <Input
              value={meetLink}
              onChange={(e) => setMeetLink(e.target.value)}
              placeholder="https://meet.google.com/abc-defg-hij"
              className="w-full"
            />
            
            <div className="text-sm text-gray-500 border-l-4 border-blue-500 pl-3 py-2 bg-blue-50">
              <p>Google Meet bağlantısı nasıl oluşturulur:</p>
              <ol className="list-decimal ml-5 mt-1">
                <li><Link href="https://meet.google.com/landing" target="_blank" className="text-blue-500 underline">Google Meet</Link> sayfasına gidin</li>
                <li>&quot;Yeni toplantı&quot; düğmesine tıklayın</li>
                <li>&quot;Anlık toplantı başlat&quot; seçeneğini seçin</li>
                <li>Açılan toplantının bağlantısını kopyalayıp buraya yapıştırın</li>
              </ol>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="secondary"
              >
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
              <Button
                onClick={() => setIsEditing(false)}
                variant="default"
                disabled={saving}
              >
                İptal
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {meetLink ? (
              <div className="flex items-center space-x-2">
                <div className="flex-1 p-3 bg-gray-100 rounded break-all">
                  <a 
                    href={meetLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    {meetLink}
                  </a>
                </div>
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="primary"
                >
                  Düzenle
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-amber-600">
                  Henüz bir Google Meet bağlantısı belirlemediniz. Öğrencilerle ders yapabilmek için bir bağlantı eklemeniz gerekiyor.
                </p>
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="secondary"
                >
                  Bağlantı Ekle
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 