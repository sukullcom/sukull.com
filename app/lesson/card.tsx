import { cn } from "@/lib/utils";
import { challenges } from "@/db/schema";
import Image from "next/image";
import { useCallback, useRef, useEffect } from "react";

// Safe alternatives to react-use hooks
const useAudio = (config: { src: string }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    if (config.src) {
      audioRef.current = new Audio(config.src);
    }
  }, [config.src]);
  
  const controls = {
    play: () => audioRef.current?.play().catch(console.error)
  };
  
  return [null, null, controls] as const;
};

type Props = {
  id: number;
  imageSrc: string | null;
  audioSrc: string | null;
  text: string;
  selected?: boolean;
  onClick: () => void;
  disabled?: boolean;
  status?: "correct" | "wrong" | "none";
  type: (typeof challenges.$inferSelect)["type"];
};

export const Card = ({
  imageSrc,
  audioSrc,
  text,
  selected,
  onClick,
  status,
  disabled,
  type,
}: Props) => {
  const [audio, , controls] = useAudio({ src: audioSrc || "" });

  const handleClick = useCallback(() => {
    if (disabled) return;
    controls.play();
    onClick();
  }, [disabled, onClick, controls]);

  return (
    <div
      onClick={handleClick}
      className={cn(
        "h-full border-2 rounded-xl border-b-4 hover:bg-black/5 p-4 lg:p-6 cursor-pointer active:border-b-2",
        selected && "border-sky-300 bg-sky-100 hover:bg-sky-100",
        selected && status === "correct" && "border-green-300 bg-green-100",
        selected && status === "wrong" && "border-rose-300 bg-rose-100",
        disabled && "pointer-events-none hover:bg-white",
        type === "ASSIST" && "lg:p-3 w-full"
      )}
    >
      {audio}
      {imageSrc && (
        <div className="relative aspect-square mb-4 max-h-[140px] lg:max-h-[250px] w-full">
          <Image 
            src={imageSrc} 
            fill 
            alt={text} 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <div
        className={cn(
          "flex items-center justify-center",
          type === "ASSIST" && "flex-row-reverse"
        )}
      >
        <p
          className={cn(
            "text-neutral-600 text-sm lg:text-base text-center",
            selected && "text-sky-500",
            selected && status === "correct" && "text-green-500",
            selected && status === "wrong" && "text-rose-500"
          )}
        >
          {text}
        </p>
      </div>
    </div>
  );
};
