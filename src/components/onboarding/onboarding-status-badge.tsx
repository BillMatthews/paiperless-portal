import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {DealStatus} from "@/lib/types/deal-desk.types";
import {OnboardingStatus} from "@/lib/types/onboarding.types";

interface OnboardingStatusBadgeProps {
  status: OnboardingStatus;
}

export function OnboardingStatusBadge({ status }: OnboardingStatusBadgeProps) {
  const getStatusStyles = (status: OnboardingStatus) => {
    switch (status) {
      case OnboardingStatus.NEW:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case OnboardingStatus.IN_PROGRESS:
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800";
      case OnboardingStatus.COMPLETE:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800";
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