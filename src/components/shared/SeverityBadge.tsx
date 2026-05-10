import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const severityConfig = {
  critical: { label: 'Critico', className: 'bg-red-100 text-red-700 border-red-200' },
  warning: { label: 'Aviso', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  opportunity: { label: 'Oportunidade', className: 'bg-blue-100 text-blue-700 border-blue-200' },
};

export function SeverityBadge({ severity }: { severity: string }) {
  const config = severityConfig[severity as keyof typeof severityConfig] || {
    label: severity,
    className: 'bg-gray-100 text-gray-700',
  };

  return (
    <Badge variant="outline" className={cn('text-xs font-medium', config.className)}>
      {config.label}
    </Badge>
  );
}
