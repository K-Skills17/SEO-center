import { cn } from '@/lib/utils';

export function ScoreBar({
  score,
  className,
}: {
  score: number | null;
  className?: string;
}) {
  const value = score ?? 0;

  const barColor =
    value < 40 ? 'bg-red-500' : value <= 70 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-medium text-muted-foreground">
        {score !== null ? value : '--'}
      </span>
    </div>
  );
}
