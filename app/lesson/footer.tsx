import { useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MathRenderer } from "@/components/ui/math-renderer";

type Props = {
  onCheck: () => void;
  onSkipWrong?: () => void;
  status: "correct" | "wrong" | "none" | "completed";
  disabled?: boolean;
  lessonId?: number;
  explanation?: string | null;
};

// Safe alternative to useKey hook
const useKey = (key: string, callback: () => void) => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === key) {
        callback();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [key, callback]);
};

export const Footer = ({ onCheck, onSkipWrong, status, disabled, lessonId, explanation }: Props) => {
  // Kaldırdık: useMedia("(max-width: 1024px)")
  // Çünkü SSR'da className mismatch yaratıyordu
  // OnEnter => onCheck
  useKey("Enter", onCheck);

  return (
    <footer
      className={cn(
        "min-h-[100px] border-t-2 flex items-center py-3",
        status === "correct" && "border-transparent bg-green-100",
        status === "wrong" && "border-transparent bg-rose-100"
      )}
    >
      <div className="max-w-[1140px] mx-auto w-full min-h-0 flex flex-wrap items-center justify-between gap-3 px-6 lg:px-10">
        {status === "correct" && (
          <div className="text-green-500 font-bold text-base lg:text-2xl flex items-center">
            <CheckCircle className="h-6 w-6 lg:h-10 lg:w-10 mr-4" />
            Doğru cevap!
          </div>
        )}
        {status === "wrong" && (
          <div className="text-rose-500 font-bold text-base lg:text-2xl flex items-start min-w-0 flex-1 pr-2">
            <XCircle className="h-6 w-6 lg:h-10 lg:w-10 mr-3 lg:mr-4 shrink-0 mt-0.5" />
            {explanation ? (
              <div className="flex flex-col min-w-0 font-normal">
                <span className="text-sm font-medium text-rose-600 mb-1">İpucu:</span>
                <div className="text-sm lg:text-base leading-relaxed text-rose-800 [&_.katex]:text-rose-900">
                  <MathRenderer>{explanation}</MathRenderer>
                </div>
              </div>
            ) : (
              "Yeniden dene."
            )}
          </div>
        )}
        {status === "completed" && (
          <Button
            variant="default"
            size="lg" // sabit "lg"
            onClick={() => {
              window.location.href = `/lesson/${lessonId}`;
            }}
          >
            Tekrar Çöz
          </Button>
        )}
        <div
          className={cn(
            "flex flex-col sm:flex-row items-stretch sm:items-center gap-2 ml-auto shrink-0",
            status === "wrong" && onSkipWrong && "w-full sm:w-auto"
          )}
        >
          {status === "wrong" && onSkipWrong && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="border-rose-300 text-rose-800 hover:bg-rose-50"
              onClick={onSkipWrong}
            >
              Sonraki soruya geç
            </Button>
          )}
          <Button
            disabled={disabled}
            onClick={onCheck}
            size="lg"
            variant={status === "wrong" ? "danger" : "secondary"}
          >
            {status === "none" && "Kontrol Et"}
            {status === "correct" && "Sonraki"}
            {status === "wrong" && "Tekrar Dene"}
            {status === "completed" && "Devam Et"}
          </Button>
        </div>
      </div>
    </footer>
  );
};
