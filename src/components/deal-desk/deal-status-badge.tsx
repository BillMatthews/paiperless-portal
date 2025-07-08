import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {DealStatus} from "@/lib/types/deal-desk.types";

interface DealStatusBadgeProps {
  status: DealStatus;
}

export function DealStatusBadge({ status }: DealStatusBadgeProps) {
  const getStatusStyles = (status: DealStatus) => {
    switch (status) {
      case 'NEW':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case 'IN_PROGRESS':
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800";
      case 'AWAITING_AGREEMENT':
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case 'COMPLETED':
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800";
      case 'REJECTED':
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-800";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={cn("font-medium text-xs", getStatusStyles(status))}
    >
      {status}
    </Badge>
  );
}