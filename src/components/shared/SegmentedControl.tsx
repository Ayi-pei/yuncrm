"use client";

import * as React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SegmentedControlProps {
  options: {
    value: string;
    label: string;
    icon?: React.ElementType;
    disabled?: boolean;
  }[];
  value: string;
  onValueChangeAction: (value: string) => void;
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onValueChangeAction,
  className,
}: SegmentedControlProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={onValueChangeAction}
      className={cn(
        "grid w-full grid-cols-3 gap-2 rounded-lg bg-muted p-1",
        className
      )}
    >
      {options.map((option) => (
        <div key={option.value}>
          <RadioGroupItem
            value={option.value}
            id={option.value}
            className="peer sr-only"
            disabled={option.disabled}
          />
          <Label
            htmlFor={option.value}
            className={cn(
              "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-muted p-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
              "cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
            )}
          >
            {option.icon && <option.icon className="mb-1 h-5 w-5" />}
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
