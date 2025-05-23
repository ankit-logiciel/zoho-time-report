import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatHours(hours: number): string {
  return hours.toFixed(1);
}

export function calculateDateRangeFromString(dateRange: string): { startDate: Date, endDate: Date } {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();
  
  switch (dateRange) {
    case 'Last 7 days':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      break;
    case 'This month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'Last month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    // For custom range, we would typically use a date picker component
    // and this would be handled differently
    case 'Custom range':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  }
  
  return { startDate, endDate };
}
