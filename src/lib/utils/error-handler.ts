"use server"

import { redirect } from "next/navigation";
import { ForbiddenError } from "@/lib/errors/api-errors";

/**
 * Handles errors in server actions, with special handling for 403 Forbidden errors
 * @param error - The error to handle
 * @param context - Optional context for logging (e.g., function name)
 */
export async function handleServerActionError(error: unknown, context?: string): Promise<never> {
  const errorContext = context ? `Error in ${context}:` : 'Error:';
  
  // Handle 403 Forbidden errors by redirecting to forbidden page
  if (error instanceof ForbiddenError) {
    console.warn(`${errorContext} 403 Forbidden - redirecting to forbidden page`, error.message);
    await redirect('/forbidden');
  }
  
  // Log other errors and re-throw them
  console.error(`${errorContext}`, error);
  throw error;
}

/**
 * Handles errors and returns a fallback value instead of throwing
 * @param error - The error to handle
 * @param fallbackValue - Value to return on error
 * @param context - Optional context for logging
 */
export async function handleServerActionErrorWithFallback<T>(
  error: unknown, 
  fallbackValue: T, 
  context?: string
) {
  const errorContext = context ? `Error in ${context}:` : 'Error:';
  
  // Handle 403 Forbidden errors by returning fallback
  if (error instanceof ForbiddenError) {
    console.warn(`${errorContext} 403 Forbidden - returning fallback value`, error.message);
    return fallbackValue;
  }
  
  // Log other errors and re-throw them
  console.error(`${errorContext}`, error);
  throw error;
}
