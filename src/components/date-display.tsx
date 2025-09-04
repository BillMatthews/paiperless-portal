import { format } from "date-fns";

interface DateDisplayProps {
  date: string | Date;
  format?: string;
}

export function DateDisplay({ 
  date, 
  format: formatString = "PPp" 
}: DateDisplayProps) {
  if (!date) {
    return '';
  }
  try {
    if (date instanceof Date) {
      const formattedDate = format(date, formatString);
      return <span>{formattedDate}</span>;
    } else {
      const formattedDate = format(new Date(date), formatString);
      return <span>{formattedDate}</span>;
    }


  } catch (error) {
    // Fallback if date cannot be parsed
    return <span>{date.toString()}</span>;
  }
}