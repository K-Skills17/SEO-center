import { FileSearch } from 'lucide-react';

export function EmptyState({
  title = 'Nenhum dado encontrado',
  description = 'Comece adicionando um site e executando uma sincronizacao.',
  icon: Icon = FileSearch,
}: {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="mb-4 h-12 w-12 text-muted-foreground/50" />
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
