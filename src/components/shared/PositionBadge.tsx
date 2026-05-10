import { cn } from '@/lib/utils';

export function PositionBadge({ position }: { position: number }) {
  const rounded = Math.round(position * 10) / 10;

  const colorClass =
    position <= 3
      ? 'bg-emerald-100 text-emerald-700'
      : position <= 10
        ? 'bg-amber-100 text-amber-700'
        : position <= 20
          ? 'bg-orange-100 text-orange-700'
          : 'bg-red-100 text-red-700';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
        colorClass
      )}
    >
      {rounded}
    </span>
  );
}
