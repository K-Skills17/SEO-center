import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string;
  trend?: number;
  invertTrend?: boolean;
}

function MetricCard({ label, value, trend, invertTrend }: MetricCardProps) {
  const isPositive = invertTrend ? (trend ?? 0) < 0 : (trend ?? 0) > 0;
  const TrendIcon =
    trend === undefined || trend === 0
      ? Minus
      : isPositive
        ? TrendingUp
        : TrendingDown;

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold">{value}</p>
        {trend !== undefined && (
          <div
            className={cn(
              'mt-1 flex items-center gap-1 text-xs font-medium',
              isPositive ? 'text-emerald-600' : 'text-red-600',
              trend === 0 && 'text-muted-foreground'
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MetricsGrid({
  totals,
}: {
  totals: {
    totalClicks: number;
    totalImpressions: number;
    avgCtr: number;
    avgPosition: number;
  };
}) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <MetricCard
        label="Total de Cliques"
        value={totals.totalClicks.toLocaleString()}
      />
      <MetricCard
        label="Impressoes"
        value={totals.totalImpressions.toLocaleString()}
      />
      <MetricCard
        label="CTR Medio"
        value={`${(totals.avgCtr * 100).toFixed(2)}%`}
      />
      <MetricCard
        label="Posicao Media"
        value={totals.avgPosition.toFixed(1)}
        invertTrend
      />
    </div>
  );
}
