"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function GiveLessonPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [field, setField] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [score, setScore] = useState(0);

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

  const handleStartQuiz = async () => {
    if (!field) {
      return toast.error("Lütfen bir alan seçiniz.");
    }
    const res = await fetch(`/api/private-lesson/quiz?field=${field}`);
    if (!res.ok) {
      toast.error("Bir hata oluştu, lütfen tekrar deneyin.");
      return;
    }
    const data = await res.json();
    if (!data.questions) {
      toast.error("Bir hata oluştu, lütfen tekrar deneyin.");
      return;
    }
    if (data.questions.length === 0) {
      // no quiz => skip to form
      setStep(3);
    } else {
      setQuestions(data.questions);
      setStep(2);
    }
  };

  const handleOptionSelect = (optId: number) => {
    const updated = [...selectedOptions];
    updated[currentIndex] = optId;
    setSelectedOptions(updated);
  };

  const handleNextQuestion = () => setCurrentIndex((prev) => prev + 1);

  const handleFinishQuiz = () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      const selectedId = selectedOptions[idx];
      const correctOpt = q.options.find((o: any) => o.isCorrect);
      if (correctOpt && correctOpt.id === selectedId) correctCount++;
    });
    setScore(correctCount);

    // Need at least 7 for pass
    if (correctCount >= 7) {
      setStep(3);
    } else {
      toast.error(
        `Maalesef yeterli puan alamadınız. Doğru cevap sayısı: ${correctCount}.`
      );
      router.push("/");
    }
  };

  const handleFormInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      ...formData,
      field,
      quizResult: score,
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
        <img
          src="/mascot_pink.svg"
          alt="mascot"
          className="h-24 mx-auto mt-6"
        />
      </div>
      <div className="border-2 rounded-xl p-6 space-y-4 shadow-lg bg-white w-full max-w-4xl">
        {/* Title & info block, as get/page.tsx style */}
        <h1 className="text-2xl font-bold text-center text-gray-800">
          Özel Ders Vermek İstiyorum
        </h1>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Hangi alanda ders vermek istiyorsunuz?
              </label>
              <select
                name="field"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={field}
                onChange={handleChangeField}
              >
                <option value="">Seçiniz</option>
                <option value="English">İngilizce</option>
                <option value="Mathematics">Matematik</option>
                <option value="Physics">Fizik</option>
                <option value="Chess">Satranç</option>
              </select>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleStartQuiz}
            >
              Devam Et
            </Button>
          </div>
        )}

        {step === 2 && questions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">
              Soru {currentIndex + 1} / {questions.length}
            </h2>
            <p>{questions[currentIndex].questionText}</p>
            <div className="space-y-2">
              {questions[currentIndex].options.map((opt: any) => (
                <label
                  key={opt.id}
                  className="flex items-center space-x-2 border p-2 rounded-md"
                >
                  <input
                    type="radio"
                    name={`q-${currentIndex}`}
                    checked={selectedOptions[currentIndex] === opt.id}
                    onChange={() => handleOptionSelect(opt.id)}
                  />
                  <span>{opt.text}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end">
              {currentIndex < questions.length - 1 ? (
                <Button
                  variant="primary"
                  disabled={selectedOptions[currentIndex] == null}
                  onClick={handleNextQuestion}
                >
                  Sonrakİ Soru
                </Button>
              ) : (
                <Button
                  variant="primary"
                  disabled={selectedOptions[currentIndex] == null}
                  onClick={handleFinishQuiz}
                >
                  Testi Bitir
                </Button>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmitForm} className="space-y-4">
            <div>
              <label
                htmlFor="teacherName"
                className="block text-sm font-medium text-gray-700"
              >
                Adınız
              </label>
              <input
                type="text"
                name="teacherName"
                id="teacherName"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Örneğin: Mehmet"
                value={formData.teacherName}
                onChange={handleFormInput}
                required
              />
            </div>
            <div>
              <label
                htmlFor="teacherSurname"
                className="block text-sm font-medium text-gray-700"
              >
                Soyadınız
              </label>
              <input
                type="text"
                name="teacherSurname"
                id="teacherSurname"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Örneğin: Demir"
                value={formData.teacherSurname}
                onChange={handleFormInput}
                required
              />
            </div>
            <div>
              <label
                htmlFor="teacherPhoneNumber"
                className="block text-sm font-medium text-gray-700"
              >
                Telefon Numaranız
              </label>
              <input
                type="tel"
                name="teacherPhoneNumber"
                id="teacherPhoneNumber"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="05xx xxx xx xx"
                value={formData.teacherPhoneNumber}
                onChange={handleFormInput}
                required
              />
            </div>
            <div>
              <label
                htmlFor="teacherEmail"
                className="block text-sm font-medium text-gray-700"
              >
                Email Adresiniz
              </label>
              <input
                type="email"
                name="teacherEmail"
                id="teacherEmail"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="ornek@mail.com"
                value={formData.teacherEmail}
                onChange={handleFormInput}
                required
              />
            </div>
            <div>
              <label
                htmlFor="priceRange"
                className="block text-sm font-medium text-gray-700"
              >
                1 Saatlik Ders İçin Talep Ettiğiniz Fiyat Aralığı (Öğrenci
                eşleştirmesi için gereklidir.)
              </label>
              <input
                type="text"
                name="priceRange"
                id="priceRange"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Örneğin: 200-300 TL"
                value={formData.priceRange}
                onChange={handleFormInput}
                required
              />
            </div>
            <p className="text-xs text-gray-500">
              Bilgileriniz yalnızca size uygun öğrenciyi belirlemek ve sizinle iletişim
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
        )}
      </div>
    </div>
  );
}
