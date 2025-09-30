import React from "react";
import { cn } from "@/lib/utils";
import { ArrowDown, Check } from "lucide-react";

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 40,
  strokeWidth = 4,
  className,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const isCompleted = progress >= 100;

  // Generate size-based class name
  const sizeClass = `circular-progress-size-${size}`;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center circular-progress-container",
        sizeClass,
        className
      )}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="circular-progress-svg"
      >
        <circle
          className="text-muted circular-progress-background"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-primary circular-progress-circle"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="circular-progress-icon-container">
        {isCompleted ? (
          <Check className="h-5 w-5 text-primary" />
        ) : (
          <ArrowDown className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
    </div>
  );
};
