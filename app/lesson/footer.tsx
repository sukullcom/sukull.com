import { useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  onCheck: () => void;
  status: "correct" | "wrong" | "none" | "completed";
  disabled?: boolean;
  lessonId?: number;
  explanation?: string | null; // Add explanation prop
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

export const Footer = ({ onCheck, status, disabled, lessonId, explanation }: Props) => {
  // Kaldırdık: useMedia("(max-width: 1024px)")
  // Çünkü SSR'da className mismatch yaratıyordu
  // OnEnter => onCheck
  useKey("Enter", onCheck);

  return (
    <footer
      className={cn(
        "h-[100px] border-t-2 flex items-center",
        status === "correct" && "border-transparent bg-green-100",
        status === "wrong" && "border-transparent bg-rose-100"
      )}
    >
      <div className="max-w-[1140px] mx-auto w-full h-full flex items-center justify-between px-6 lg:px-10">
        {status === "correct" && (
          <div className="text-green-500 font-bold text-base lg:text-2xl flex items-center">
            <CheckCircle className="h-6 w-6 lg:h-10 lg:w-10 mr-4" />
            Nicely done!
          </div>
        )}
        {status === "wrong" && (
          <div className="text-rose-500 font-bold text-base lg:text-2xl flex items-center">
            <XCircle className="h-6 w-6 lg:h-10 lg:w-10 mr-4" />
            {explanation ? (
              <div className="flex flex-col">
                <span className="text-sm font-medium text-rose-600 mb-1">Açıklama:</span>
                <span className="text-sm lg:text-base font-normal leading-relaxed">{explanation}</span>
              </div>
            ) : (
              "Try again."
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
            Practice again
          </Button>
        )}
        {/* "Check/Next/Retry/Continue" */}
        <Button
          disabled={disabled}
          className="ml-auto"
          onClick={onCheck}
          size="lg" // sabit "lg"
          variant={status === "wrong" ? "danger" : "secondary"}
        >
          {status === "none" && "Check"}
          {status === "correct" && "Next"}
          {status === "wrong" && "Retry"}
          {status === "completed" && "Continue"}
        </Button>
      </div>
    </footer>
  );
};
