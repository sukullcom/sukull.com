import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface CardProps {
  imageSrc: string;
  title: string;
  href: string;
  buttonText: string;
  variant?: "locked" | "super";
  disabled?: boolean;
}

const Card = ({
  imageSrc,
  title,
  href,
  buttonText,
  variant = "super",
  disabled = false,
}: CardProps) => {
  return (
    <div
      className={cn(
        "flex flex-col justify-between h-full border-2 rounded-xl border-b-4 hover:bg-gray-100 p-4 lg:p-6 cursor-pointer active:border-b-2 shadow-md transition-transform duration-300 hover:scale-105"
      )}
    >
      <div className="flex flex-col items-center">
        {/* Kartın Resmi */}
        <div className="relative aspect-square mb-4 max-h-[120px] lg:max-h-[200px] w-full">
          <Image
            src={imageSrc}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="rounded-lg"
          />
        </div>

        {/* Kart Başlığı */}
        <h3 className="text-center text-gray-800 text-lg lg:text-xl font-semibold">
          {title}
        </h3>
      </div>

      {/* Kart Butonu */}
      {disabled ? (
        <Button
          className="mt-4 w-full py-1.5 text-xs lg:text-xs font-medium rounded-lg bg-gray-500 text-white cursor-not-allowed whitespace-normal text-center"
          variant="locked"
          disabled
        >
          {buttonText}
        </Button>
      ) : (
        <Link prefetch={false} href={href}>
          <Button
            className="mt-4 w-full py-2 text-sm lg:text-base font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 transition-colors"
            variant={variant}
          >
            {buttonText}
          </Button>
        </Link>
      )}
    </div>
  );
};

export default Card;
