"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function GroupQuizPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [classification, setClassification] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("id"); // the row we created

  // Step 1 => fetch quiz
  const handleStartQuiz = async () => {
    const field = "EnglishSpeaking";
    const res = await fetch(`/api/private-lesson/quiz?field=${field}`);
    if (!res.ok) {
      toast.error("Soru alırken hata oluştu.");
      return;
    }
    const data = await res.json();
    if (!data.questions || data.questions.length === 0) {
      toast("Bu alan için henüz soru yok. Quiz atlanıyor.");
      router.push("/private-lesson/group");
      return;
    }
    setQuestions(data.questions);
    setStep(2);
  };

  const handleSelectOption = (optId: number) => {
    const updated = [...selectedOptions];
    updated[currentIndex] = optId;
    setSelectedOptions(updated);
  };

  const handleNext = () => setCurrentIndex((prev) => prev + 1);

  const handleFinishQuiz = async () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      const chosen = selectedOptions[idx];
      const cOpt = q.options.find((o: any) => o.isCorrect);
      if (cOpt && cOpt.id === chosen) correct++;
    });
    setScore(correct);

    // We want to store final quizResult => server calculates CEFR
    if (!applicationId) {
      // if no ID, just show result
      setStep(3);
      return;
    }

    const patchRes = await fetch("/api/private-lesson/group/score", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: Number(applicationId), quizResult: correct }),
    });

    if (!patchRes.ok) {
      toast.error("Sonuç kaydedilirken hata oluştu.");
      setStep(3);
      return;
    }
    const patchData = await patchRes.json();
    // Server returns classification
    if (patchData.classification) {
      setClassification(patchData.classification);
    }

    setStep(3);
  };

  // If user refreshes or directly opens this page, we do nothing until they click start
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      {step === 1 && (
        <div className="max-w-lg w-full border-2 rounded-xl p-6 shadow-lg bg-white space-y-4">
          <h1 className="text-2xl font-bold text-center text-gray-800">
            İngilizce Seviye Testi
          </h1>
          <p className="text-gray-600 text-center">
            50 soruluk teste başlamak için butona tıklayın.
          </p>
          <Button variant="primary" onClick={handleStartQuiz} className="w-full">
            Teste Başla
          </Button>
        </div>
      )}

      {step === 2 && questions.length > 0 && (
        <div className="max-w-4xl w-full border-2 rounded-xl p-6 shadow-lg bg-white space-y-6">
          <h2 className="text-lg font-bold">
            Soru {currentIndex + 1} / {questions.length}
          </h2>
          <p className="text-gray-800">
            {questions[currentIndex].questionText}
          </p>
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
                  onChange={() => handleSelectOption(opt.id)}
                />
                <span>{opt.text}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end">
            {currentIndex < questions.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={selectedOptions[currentIndex] == null}
              >
                Sonrakİ
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleFinishQuiz}
                disabled={selectedOptions[currentIndex] == null}
              >
                Bitir
              </Button>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-lg w-full border-2 rounded-xl p-6 shadow-lg bg-white text-center">
          <h1 className="text-2xl font-bold text-green-600">
            Test Tamamlandı!
          </h1>
          <p>Doğru cevap sayısı: {score} / {questions.length}</p>
          {classification && (
            <p className="mt-2 text-blue-500 font-semibold">
              Seviyeniz: {classification}
            </p>
          )}
          <Button variant="primary" className="mt-6" onClick={() => router.push("/private-lesson")}>
            Anasayfa'ya Dön
          </Button>
        </div>
      )}
    </div>
  );
}
