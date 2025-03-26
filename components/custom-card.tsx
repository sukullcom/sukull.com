import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { ButtonProps } from "@/components/ui/button";

interface CardProps {
  imageSrc: string;
  title: string;
  href: string;
  buttonText: string;
  variant?: ButtonProps["variant"];
  disabled?: boolean;
}

const CustomCard: React.FC<CardProps> = ({
  imageSrc,
  title,
  href,
  buttonText,
  variant = "default",
  disabled = false
}) => {
  return (
    <div className="border rounded-lg overflow-hidden shadow-md flex flex-col h-full">
      <div className="p-4 flex-1 flex flex-col items-center">
        <div className="relative w-24 h-24 mb-4">
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-contain"
          />
        </div>
        <h3 className="text-xl font-semibold text-center mb-4">{title}</h3>
        <div className="mt-auto w-full">
          <Link href={disabled ? "#" : href} className="w-full block">
            <Button 
              variant={variant}
              className="w-full whitespace-pre-line"
              disabled={disabled}
            >
              {buttonText}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CustomCard; 