'use client';

import { cn } from '@/lib/utils';

function getScoreColor(score: number): string {
  if (score < 40) return 'text-red-500';
  if (score <= 70) return 'text-amber-500';
  return 'text-emerald-500';
}

function getStrokeColor(score: number): string {
  if (score < 40) return '#ef4444';
  if (score <= 70) return '#f59e0b';
  return '#10b981';
}

export function HealthScoreRing({
  score,
  size = 80,
  strokeWidth = 6,
  className,
}: {
  score: number | null;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const displayScore = score ?? 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getStrokeColor(displayScore)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className={cn(
            'font-bold leading-none',
            size >= 100 ? 'text-2xl' : 'text-lg',
            getScoreColor(displayScore)
          )}
        >
          {score !== null ? displayScore : '--'}
        </span>
        {size >= 80 && (
          <span className="text-[10px] text-muted-foreground">/100</span>
        )}
      </div>
    </div>
  );
}
