"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { Timer, AlertCircle } from "lucide-react";
import Image from "next/image"; // Add Image import

type Props = {
  children: React.ReactNode;
  timeLimit: number; // in seconds
  onTimeUp: () => void;
  disabled?: boolean;
  status: "correct" | "wrong" | "none";
  questionImageSrc?: string | null | undefined; // Add question image support
};

export const TimerChallenge = ({
  children,
  timeLimit,
  onTimeUp,
  disabled,
  status,
  questionImageSrc, // Add questionImageSrc prop
}: Props) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isActive, setIsActive] = useState(true);
  const [hasExpired, setHasExpired] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle time expiration in separate useEffect to avoid setState during render
  useEffect(() => {
    if (timeLeft === 0 && !hasExpired && status === "none") {
      setHasExpired(true);
      setIsActive(false);
      // Use setTimeout to call onTimeUp after the current render cycle
      setTimeout(() => {
        onTimeUp();
      }, 0);
    }
  }, [timeLeft, hasExpired, status, onTimeUp]);

  useEffect(() => {
    // Start the timer
    if (isActive && timeLeft > 0 && status === "none" && !disabled) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            // Don't call onTimeUp here - let the other useEffect handle it
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeLeft, disabled, status]);

  // Stop timer when challenge is completed or disabled
  useEffect(() => {
    if (status !== "none" || disabled) {
      setIsActive(false);
    }
  }, [status, disabled]);

  // Reset component state when status changes to "none" (for practice mode and next challenge)
  useEffect(() => {
    if (status === "none") {
      // Reset timer state
      setTimeLeft(timeLimit);
      setIsActive(true);
      setHasExpired(false);
    }
  }, [status, timeLimit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (timeLeft / timeLimit) * 100;

  // Function to render question image if it exists
  const renderQuestionImage = () => {
    if (!questionImageSrc) return null;
    
    return (
      <div className="mb-4 flex justify-center">
        <div className="relative max-w-sm w-full aspect-square">
          <Image
            src={questionImageSrc}
            alt="Challenge question image"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-contain rounded-lg"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="relative space-y-6">
      {renderQuestionImage()}
      
      {/* Timer UI */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Timer 
              className={cn(
                "w-5 h-5",
                hasExpired ? "text-red-500" : timeLeft <= 10 ? "text-orange-500" : "text-blue-500"
              )} 
            />
            <span className={cn(
              "font-bold text-lg",
              hasExpired ? "text-red-500" : timeLeft <= 10 ? "text-orange-500" : "text-blue-500"
            )}>
              {formatTime(timeLeft)}
            </span>
          </div>
          
          {hasExpired && (
            <div className="flex items-center space-x-1 text-red-500">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Süre doldu!</span>
            </div>
          )}
        </div>
        
        {/* Timer Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className={cn(
              "h-3 rounded-full transition-all duration-1000 ease-linear",
              progressPercentage > 50 ? "bg-green-500" : 
              progressPercentage > 20 ? "bg-yellow-500" : 
              "bg-red-500"
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {hasExpired && (
          <div className="text-center text-gray-600 text-sm mb-4">
            Süre sona erdi. Cevabını gözden geçir ve devam et.
          </div>
        )}
      </div>
      
      {/* Challenge Content */}
      <div className={cn(
        "transition-opacity duration-300",
        hasExpired ? "opacity-60" : "opacity-100"
      )}>
        {children}
      </div>
    </div>
  );
};

// Higher-order component to wrap any challenge with timer
export const withTimer = <T extends Record<string, unknown>>(
  WrappedComponent: React.ComponentType<T>,
  timeLimit?: number
) => {
  const TimerWrapper = (props: T & { timeLimit?: number; onTimeUp?: () => void }) => {
    const [timeExpired, setTimeExpired] = useState(false);
    
    const effectiveTimeLimit = props.timeLimit || timeLimit;
    const disabled = Boolean((props as Record<string, unknown>).disabled) || timeExpired;

    if (!effectiveTimeLimit) {
      return <WrappedComponent {...props} />;
    }

    const handleTimeUp = () => {
      setTimeExpired(true);
      if (props.onTimeUp) {
        props.onTimeUp();
      }
    };

    return (
      <TimerChallenge
        timeLimit={effectiveTimeLimit}
        onTimeUp={handleTimeUp}
        disabled={disabled}
        status={(props as Record<string, unknown>).status as "correct" | "wrong" | "none" || "none"}
      >
        <WrappedComponent {...props} disabled={disabled} />
      </TimerChallenge>
    );
  };

  TimerWrapper.displayName = `withTimer(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return TimerWrapper;
}; 