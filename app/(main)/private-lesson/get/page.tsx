"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";

export default function GetLessonPage() {
  const [formData, setFormData] = useState({
    studentName: "",
    studentSurname: "",
    studentPhoneNumber: "",
    studentEmail: "",
    field: "",
    priceRange: "",
    studentNeeds: "",
  });

  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/private-lesson/get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      router.push("/private-lesson/get/success");
    } else {
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4">
      <div className="mb-8">
        <Image
          src="/mascot_pink.svg"
          alt="mascot"
          width={200}
          height={200}
          className="h-24 mx-auto mt-6"
        />
      </div>
      <div className="border-2 rounded-xl p-6 space-y-4 shadow-lg bg-white w-full max-w-4xl">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          Özel Ders Başvurusu
        </h1>
        <p className="text-gray-600 text-center">
          Lütfen aşağıdaki formu doldurarak bize taleplerinizi iletin. Bu
          bilgiler, size en uygun öğretmeni bulmamıza yardımcı olacaktır.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="studentName"
              className="block text-sm font-medium text-gray-700"
            >
              Adınız
            </label>
            <input
              type="text"
              name="studentName"
              id="studentName"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Örneğin: Ahmet"
              value={formData.studentName}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label
              htmlFor="studentSurname"
              className="block text-sm font-medium text-gray-700"
            >
              Soyadınız
            </label>
            <input
              type="text"
              name="studentSurname"
              id="studentSurname"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Örneğin: Yılmaz"
              value={formData.studentSurname}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label
              htmlFor="studentPhoneNumber"
              className="block text-sm font-medium text-gray-700"
            >
              Telefon Numaranız
            </label>
            <input
              type="tel"
              name="studentPhoneNumber"
              id="studentPhoneNumber"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="05xx xxx xx xx"
              value={formData.studentPhoneNumber}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label
              htmlFor="studentEmail"
              className="block text-sm font-medium text-gray-700"
            >
              Email Adresiniz
            </label>
            <input
              type="email"
              name="studentEmail"
              id="studentEmail"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="ornek@mail.com"
              value={formData.studentEmail}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label
              htmlFor="field"
              className="block text-sm font-medium text-gray-700"
            >
              Hangi alanda özel ders almak istiyorsunuz?
            </label>
            <select
              name="field"
              id="field"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.field}
              onChange={handleChange}
              required
            >
              <option value="">Seçiniz</option>
              <option value="Matematik">Matematik</option>
              <option value="Fizik">Fizik</option>
              <option value="Kimya">Kimya</option>
              <option value="Biyoloji">Biyoloji</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="priceRange"
              className="block text-sm font-medium text-gray-700"
            >
              Talep Ettiğiniz Fiyat Aralığı (Öğretmen eşleştirmesi için gereklidir.)
            </label>
            <input
              type="text"
              name="priceRange"
              id="priceRange"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Örneğin: 100-200 TL"
              value={formData.priceRange}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label
              htmlFor="studentNeeds"
              className="block text-sm font-medium text-gray-700"
            >
              Ek Bilgiler (Opsiyonel)
            </label>
            <textarea
              name="studentNeeds"
              id="studentNeeds"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Örneğin: Sınavlara hazırlık, belirli bir konu hakkında daha fazla pratik vb."
              value={formData.studentNeeds}
              onChange={handleChange}
            />
          </div>
          <p className="text-xs text-gray-500">
            Bilgileriniz yalnızca size uygun öğretmeni belirlemek ve sizinle iletişim
            kurmak amacıyla kullanılacaktır.
          </p>
          <div className="pt-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
            >
              Başvuruyu Gönder
            </Button>
          </div>
        </form>
      </div>
      <div className="pb-10" />
    </div>
  );
}
