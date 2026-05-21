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
  useKey("Enter", onCheck);

  const hintText = (explanation ?? "").trim();
  const showHint = status === "wrong" && hintText.length > 0;

  return (
    <footer
      className={cn(
        "shrink-0 border-t-2 py-3",
        !showHint && "min-h-[100px] flex items-center",
        status === "correct" && "border-transparent bg-suk-brand-soft",
        status === "wrong" && "border-transparent bg-suk-danger-soft"
      )}
    >
      <div
        className={cn(
          "mx-auto w-full max-w-[1140px] min-h-0 gap-3 px-6 lg:px-10",
          showHint
            ? "flex flex-col items-stretch gap-4 py-1"
            : "flex flex-wrap items-center justify-between"
        )}
      >
        {status === "correct" && (
          <div className="text-suk-brand font-bold text-base lg:text-2xl flex items-center">
            <CheckCircle className="h-6 w-6 lg:h-10 lg:w-10 mr-4" />
            Doğru cevap!
          </div>
        )}
        {status === "wrong" && (
          <div
            className={cn(
              "text-suk-danger font-bold text-base lg:text-2xl flex items-start min-w-0",
              !showHint && "flex-1 pr-2"
            )}
          >
            <XCircle className="h-6 w-6 lg:h-10 lg:w-10 mr-3 lg:mr-4 shrink-0 mt-0.5" />
            {showHint ? (
              <div className="flex min-w-0 flex-1 flex-col font-normal">
                <span className="mb-1 text-sm font-medium text-suk-danger">İpucu:</span>
                <div className="text-sm leading-relaxed text-suk-danger-border lg:text-base [&_.katex]:text-suk-danger-hover">
                  <MathRenderer>{hintText}</MathRenderer>
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
            size="lg"
            onClick={() => {
              window.location.href = `/lesson/${lessonId}`;
            }}
          >
            Tekrar Çöz
          </Button>
        )}
        <div
          className={cn(
            "flex flex-col items-stretch gap-2 sm:flex-row sm:items-center",
            showHint ? "w-full sm:justify-end" : "ml-auto shrink-0",
            status === "wrong" && onSkipWrong && !showHint && "w-full sm:w-auto"
          )}
        >
          {status === "wrong" && onSkipWrong && (
            <Button
              type="button"
              variant="dangerOutline"
              size="lg"
              onClick={onSkipWrong}
            >
              Sonraki soruya geç
            </Button>
          )}
          <Button
            disabled={disabled}
            onClick={onCheck}
            size="lg"
            variant={status === "wrong" ? "danger" : "primary"}
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
