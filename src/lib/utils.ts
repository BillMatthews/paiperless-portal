import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// API utility function with automatic API key header
export async function apiRequest(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const apiKey = process.env.APP_API_KEY;
  
  if (!apiKey) {
    throw new Error('APP_API_KEY environment variable is not set');
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
  };

  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  return fetch(url, mergedOptions);
}