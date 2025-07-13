"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { Timer, AlertCircle } from "lucide-react";

type Props = {
  children: React.ReactNode;
  timeLimit: number; // in seconds
  onTimeUp: () => void;
  disabled?: boolean;
  status: "correct" | "wrong" | "none";
};

export const TimerChallenge = ({
  children,
  timeLimit,
  onTimeUp,
  disabled,
  status,
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
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    const percentage = (timeLeft / timeLimit) * 100;
    if (percentage > 50) return "text-green-600";
    if (percentage > 20) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = () => {
    const percentage = (timeLeft / timeLimit) * 100;
    if (percentage > 50) return "bg-green-500";
    if (percentage > 20) return "bg-yellow-500";
    return "bg-red-500";
  };

  const progressPercentage = (timeLeft / timeLimit) * 100;

  return (
    <div className="space-y-4">
      {/* Timer Display */}
      <div className={cn(
        "flex items-center justify-center p-3 rounded-lg border-2",
        "bg-gradient-to-r from-gray-50 to-white",
        timeLeft <= 10 && timeLeft > 0 && "animate-pulse border-red-300 bg-red-50",
        timeLeft > 10 && "border-gray-200",
        timeLeft === 0 && "border-red-500 bg-red-100"
      )}>
        <div className="flex items-center space-x-3">
          <Timer className={cn("w-5 h-5", getTimerColor())} />
          <div className="flex flex-col items-center">
            <div className={cn("text-lg font-bold", getTimerColor())}>
              {formatTime(timeLeft)}
            </div>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-1000 ease-linear",
                  getProgressColor()
                )}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          
          {timeLeft <= 10 && timeLeft > 0 && (
            <AlertCircle className="w-5 h-5 text-red-500 animate-bounce" />
          )}
        </div>
      </div>

      {/* Time warning messages */}
      {timeLeft <= 30 && timeLeft > 10 && status === "none" && (
        <div className="text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm">
            <AlertCircle className="w-4 h-4 mr-1" />
            Hurry up! 30 seconds left
          </div>
        </div>
      )}

      {timeLeft <= 10 && timeLeft > 0 && status === "none" && (
        <div className="text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm animate-pulse">
            <AlertCircle className="w-4 h-4 mr-1" />
            Time is running out!
          </div>
        </div>
      )}

      {timeLeft === 0 && (
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-500 text-white font-medium">
            <AlertCircle className="w-5 h-5 mr-2" />
            Time&apos;s up!
          </div>
        </div>
      )}

      {/* Challenge Content */}
      <div className={cn(
        "transition-opacity duration-300",
        timeLeft === 0 && "opacity-50 pointer-events-none"
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
    const disabled = (props as Record<string, unknown>).disabled || timeExpired;

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