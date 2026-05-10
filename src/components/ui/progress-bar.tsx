import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, max = 100, className, barClassName, showLabel = false }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const color = pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-blue-500" : pct >= 30 ? "bg-yellow-500" : "bg-red-400";

  return (
    <div className="flex items-center gap-2">
      <div className={cn("flex-1 bg-gray-100 rounded-full h-2", className)}>
        <div
          className={cn("h-2 rounded-full transition-all duration-300", color, barClassName)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <span className="text-xs text-gray-500 w-8 text-right">{Math.round(pct)}%</span>}
    </div>
  );
}
