"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";

export default function GiveLessonPage() {
  const [field, setField] = useState("");
  const [formData, setFormData] = useState({
    teacherName: "",
    teacherSurname: "",
    teacherPhoneNumber: "",
    teacherEmail: "",
    priceRange: "",
  });

  const router = useRouter();

  const handleChangeField = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setField(e.target.value);
  };

  const handleFormInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!field) {
      return toast.error("Lütfen bir alan seçiniz.");
    }
    
    const body = {
      ...formData,
      field,
      // Setting these values as not needed but maintaining DB compatibility
      quizResult: 0,
      passed: true,
    };

    const res = await fetch("/api/private-lesson/give", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
      return;
    }
    
    router.push("/private-lesson/give/success");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4">
      <div className="mb-8">
        <Image
          src="/mascot_pink.svg"
          alt="mascot"
          width={96}
          height={96}
          className="h-24 mx-auto mt-6"
        />
      </div>
      <div className="border-2 rounded-xl p-6 space-y-4 shadow-lg bg-white w-full max-w-4xl">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          Özel Ders Vermek İstiyorum
        </h1>

        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Hangi alanda ders vermek istiyorsunuz?
            </label>
            <select
              name="field"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={field}
              onChange={handleChangeField}
              required
            >
              <option value="">Seçiniz</option>
              <option value="English">İngilizce</option>
              <option value="Mathematics">Matematik</option>
              <option value="Physics">Fizik</option>
              <option value="Chess">Satranç</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Adınız
            </label>
            <input
              type="text"
              name="teacherName"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.teacherName}
              onChange={handleFormInput}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Soyadınız
            </label>
            <input
              type="text"
              name="teacherSurname"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.teacherSurname}
              onChange={handleFormInput}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Telefon Numaranız
            </label>
            <input
              type="tel"
              name="teacherPhoneNumber"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="05xx xxx xx xx"
              value={formData.teacherPhoneNumber}
              onChange={handleFormInput}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              E-posta Adresiniz
            </label>
            <input
              type="email"
              name="teacherEmail"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="ornek@mail.com"
              value={formData.teacherEmail}
              onChange={handleFormInput}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ücret Aralığı
            </label>
            <select
              name="priceRange"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.priceRange}
              onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
              required
            >
              <option value="">Seçiniz</option>
              <option value="0-100 TL">0-100 TL / Saat</option>
              <option value="100-200 TL">100-200 TL / Saat</option>
              <option value="200-300 TL">200-300 TL / Saat</option>
              <option value="300+ TL">300+ TL / Saat</option>
            </select>
          </div>

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
