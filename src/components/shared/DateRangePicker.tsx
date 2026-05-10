'use client';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const options: { label: string; value: '7d' | '28d' | '90d' }[] = [
  { label: '7 dias', value: '7d' },
  { label: '28 dias', value: '28d' },
  { label: '90 dias', value: '90d' },
];

export function DateRangePicker() {
  const { dateRange, setDateRange } = useAppStore();

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-background p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setDateRange(opt.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            dateRange === opt.value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
