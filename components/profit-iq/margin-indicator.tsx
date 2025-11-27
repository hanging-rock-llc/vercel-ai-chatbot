"use client";

import { cn } from "@/lib/utils";
import { TrendingUpIcon, TrendingDownIcon, MinusIcon } from "lucide-react";

interface MarginIndicatorProps {
  marginPercent: number;
  showIcon?: boolean;
  className?: string;
}

export function MarginIndicator({
  marginPercent,
  showIcon = true,
  className,
}: MarginIndicatorProps) {
  // Green >= 15%, Yellow 5-15%, Red < 5%
  const getColor = () => {
    if (marginPercent >= 15) return "text-green-600 dark:text-green-400";
    if (marginPercent >= 5) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getBgColor = () => {
    if (marginPercent >= 15) return "bg-green-100 dark:bg-green-900/30";
    if (marginPercent >= 5) return "bg-yellow-100 dark:bg-yellow-900/30";
    return "bg-red-100 dark:bg-red-900/30";
  };

  const getIcon = () => {
    if (marginPercent > 0) return <TrendingUpIcon className="size-4" />;
    if (marginPercent < 0) return <TrendingDownIcon className="size-4" />;
    return <MinusIcon className="size-4" />;
  };

  return (
    <div
      data-testid="margin-indicator"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold",
        getBgColor(),
        getColor(),
        className
      )}
    >
      {showIcon && getIcon()}
      <span>{marginPercent.toFixed(1)}%</span>
    </div>
  );
}

interface MarginBarProps {
  marginPercent: number;
  className?: string;
}

export function MarginBar({ marginPercent, className }: MarginBarProps) {
  // Clamp to 0-100 for display
  const displayPercent = Math.min(Math.max(marginPercent, 0), 100);

  const getBarColor = () => {
    if (marginPercent >= 15) return "bg-green-500";
    if (marginPercent >= 5) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Margin</span>
        <MarginIndicator marginPercent={marginPercent} showIcon={false} />
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full transition-all duration-500", getBarColor())}
          style={{ width: `${displayPercent}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0%</span>
        <span className="text-yellow-600">5%</span>
        <span className="text-green-600">15%+</span>
      </div>
    </div>
  );
}
