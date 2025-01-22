"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function GiveLessonPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [field, setField] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [formData, setFormData] = useState({
    teacherName: "",
    teacherSurname: "",
    teacherPhoneNumber: "",
    teacherEmail: "",
  });

  const router = useRouter();

  const handleFieldSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setField(e.target.value);
  };

  const handleStartQuiz = async () => {
    const res = await fetch(`/api/private-lesson/quiz?field=${field}`);
    if (res.ok) {
      const data = await res.json();
      setQuestions(data.questions);
      setStep(2);
    } else {
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleOptionSelect = (optionId: number) => {
    const updatedSelectedOptions = [...selectedOptions];
    updatedSelectedOptions[currentQuestionIndex] = optionId;
    setSelectedOptions(updatedSelectedOptions);
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  };

  const handleSubmitQuiz = () => {
    let correctAnswers = 0;
    questions.forEach((question, index) => {
      const selectedOptionId = selectedOptions[index];
      const selectedOption = question.options.find(
        (option: any) => option.id === selectedOptionId
      );
      if (selectedOption && selectedOption.isCorrect) {
        correctAnswers++;
      }
    });
    setScore(correctAnswers);

    if (correctAnswers >= 2) {
      setStep(3);
    } else {
      toast.error(
        `Maalesef yeterli puan alamadınız. Doğru cevap sayısı: ${correctAnswers}`
      );
      router.push("/");
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const applicationData = {
      field,
      quizResult: score,
      passed: true,
      ...formData,
    };

    const res = await fetch("/api/private-lesson/give", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(applicationData),
    });

    if (res.ok) {
      router.push("/private-lesson/give/success");
    } else {
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
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
        {step === 1 && <p className="text-sm text-gray-500 mb-4">Adım 1 / 3</p>}
        {step === 2 && <p className="text-sm text-gray-500 mb-4">Adım 2 / 3</p>}
        {step === 3 && <p className="text-sm text-gray-500 mb-4">Adım 3 / 3</p>}

        {step === 1 && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-center text-gray-800">
              Özel Ders Vermek İçin Başvur
            </h1>
            <p className="text-gray-600 text-center">
              Bu bilgiler, sizin uzmanlık alanınızı belirleyip öğrencilerle en
              iyi şekilde eşleşmenizi sağlayacak.
            </p>
            <div>
              <label
                htmlFor="field"
                className="block text-sm font-medium text-gray-700"
              >
                Hangi alanda ders vermek istiyorsunuz?
              </label>
              <select
                id="field"
                value={field}
                onChange={handleFieldSelection}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Seçiniz</option>
                <option value="Matematik">Matematik</option>
                <option value="Fizik">Fizik</option>
              </select>
            </div>
            <div className="pt-4">
              <Button
                onClick={handleStartQuiz}
                disabled={!field}
                variant="primary"
                size="lg"
                className="w-full"
              >
                Teste Başla
              </Button>
            </div>
          </div>
        )}

        {step === 2 && questions.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">
              Soru {currentQuestionIndex + 1} / {questions.length}
            </h2>
            <p className="text-gray-700">
              {questions[currentQuestionIndex].questionText}
            </p>
            <div className="space-y-4">
              {questions[currentQuestionIndex].options.map((option: any) => (
                <div key={option.id} className="flex items-center">
                  <input
                    type="radio"
                    id={`option-${option.id}`}
                    name={`question-${currentQuestionIndex}`}
                    value={option.id}
                    checked={
                      selectedOptions[currentQuestionIndex] === option.id
                    }
                    onChange={() => handleOptionSelect(option.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label
                    htmlFor={`option-${option.id}`}
                    className="ml-3 block text-sm text-gray-700"
                  >
                    {option.text}
                  </label>
                </div>
              ))}
            </div>
            <div className="pt-4 flex justify-end space-x-4">
              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  onClick={handleNextQuestion}
                  disabled={selectedOptions[currentQuestionIndex] === undefined}
                  variant="primary"
                >
                  Sonraki Soru
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitQuiz}
                  disabled={selectedOptions[currentQuestionIndex] === undefined}
                  variant="primary"
                >
                  Testi Bitir
                </Button>
              )}
            </div>
          </div>
        )}

        {step === 2 && questions.length === 0 && (
          <div className="text-center space-y-4">
            <p>Bu alan için soru bulunamadı.</p>
            <Button
              onClick={() => setStep(1)}
              variant="secondary"
              className="mt-4"
            >
              Geri Dön
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-center text-gray-800">
              Tebrikler! Testi Başarıyla Geçtiniz.
            </h1>
            <p className="text-center text-gray-700">
              Doğru cevap sayısı: {score} / {questions.length}
            </p>
            <form onSubmit={handleFormSubmit} className="space-y-4">
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  placeholder="Örneğin: Mehmet"
                  value={formData.teacherName}
                  onChange={handleFormChange}
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  placeholder="Örneğin: Demir"
                  value={formData.teacherSurname}
                  onChange={handleFormChange}
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  placeholder="05xx xxx xx xx"
                  value={formData.teacherPhoneNumber}
                  onChange={handleFormChange}
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  placeholder="ornek@mail.com"
                  value={formData.teacherEmail}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Bu bilgileri yalnızca uygun öğrencilerle sizi eşleştirmek ve
                iletişim kurmak için kullanacağız.
              </p>
              <div className="pt-4">
                <Button
                  type="submit"
                  variant="secondary"
                  size="lg"
                  className="w-full"
                >
                  Başvuruyu Gönder
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
