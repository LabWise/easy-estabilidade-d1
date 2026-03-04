import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function formatDateSafe(dateString: string, format: string = 'dd/MM/yyyy'): string {
  try {
    if (!dateString) return '-';
    
    // Parse the date string properly using parseISO to avoid timezone issues
    const date = parseISO(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return 'Data inválida';
    }
    
    // Format the date to dd/MM/yyyy using UTC to avoid timezone shifts
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error, dateString);
    return 'Erro na data';
  }
}
