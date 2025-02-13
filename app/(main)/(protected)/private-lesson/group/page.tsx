"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function GroupLessonPage() {
  // We'll store the newly created application ID so we can patch it after quiz
  const [applicationId, setApplicationId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    participantName: "",
    participantSurname: "",
    participantPhoneNumber: "",
    participantEmail: "",
    priceRange: "",
  });

  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 1) Save user data with quizResult=0, classification=""
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const body = {
      ...formData,
      quizResult: 0,
      classification: "", // we will fill this after quiz
    };

    const res = await fetch("/api/private-lesson/group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
      return;
    }

    // server returns newly created "id" 
    const data = await res.json();
    if (data.id) {
      setApplicationId(data.id);
    }

    // go to quiz
    router.push(`/private-lesson/group/quiz?id=${data.id}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4">
      <div className="mb-8">
        <img
          src="/mascot_blue.svg"
          alt="mascot"
          className="h-24 mx-auto mt-6"
        />
      </div>
      <div className="border-2 rounded-xl p-6 space-y-4 shadow-lg bg-white w-full max-w-4xl">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          İngilizce Konuşma Grubuna Katılım
        </h1>
        <p className="text-gray-600 text-center">
          Bilgilerinizi doldurduktan sonra İngilizce seviyenizi belirlemek için
          kapsamlı bir teste yönlendirileceksiniz.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="participantName"
              className="block text-sm font-medium text-gray-700"
            >
              Adınız
            </label>
            <input
              type="text"
              name="participantName"
              id="participantName"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Örneğin: Ayşe"
              value={formData.participantName}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label
              htmlFor="participantSurname"
              className="block text-sm font-medium text-gray-700"
            >
              Soyadınız
            </label>
            <input
              type="text"
              name="participantSurname"
              id="participantSurname"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Örneğin: Kara"
              value={formData.participantSurname}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label
              htmlFor="participantPhoneNumber"
              className="block text-sm font-medium text-gray-700"
            >
              Telefon Numaranız
            </label>
            <input
              type="tel"
              name="participantPhoneNumber"
              id="participantPhoneNumber"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="05xx xxx xx xx"
              value={formData.participantPhoneNumber}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label
              htmlFor="participantEmail"
              className="block text-sm font-medium text-gray-700"
            >
              Email Adresiniz
            </label>
            <input
              type="email"
              name="participantEmail"
              id="participantEmail"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="ornek@mail.com"
              value={formData.participantEmail}
              onChange={handleChange}
              required
            />
          </div>
          <p className="text-xs text-gray-500">
            Bilgileriniz grup katılım değerlendirmesinde kullanılacaktır.
          </p>
          <div className="pt-4">
            <Button type="submit" variant="primary" size="lg" className="w-full">
              Başvuruyu Gönder
            </Button>
          </div>
        </form>
      </div>
      <div className="pb-10" />
    </div>
  );
}
