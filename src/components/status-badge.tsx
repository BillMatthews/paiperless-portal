import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getVariant = (status: string) => {
    if (!status) {return 'secondary'}
    const statusLower = status.toLowerCase();
    if (statusLower === 'issued') return 'success';
    if (statusLower === 'in progress') return 'warning';
    if (statusLower === 'processing') return 'destructive';
    return 'secondary';
  };

  return (
    <Badge 
      variant={getVariant(status)} 
      className="animate-in fade-in duration-300"
    >
      {status}
    </Badge>
  );
}