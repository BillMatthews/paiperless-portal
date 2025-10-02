// Example: How to use the error handling utilities in server actions

import { apiGet, apiPost } from "@/lib/utils/api-client";
import { handleServerActionError, handleServerActionErrorWithFallback } from "@/lib/utils/error-handler";
import { ForbiddenError } from "@/lib/errors/api-errors";

// Example 1: Redirect on 403, throw other errors
export async function getData(id: string) {
    try {
        const response = await apiGet(`/api/data/${id}`);
        return await response.json();
    } catch (error) {
        // This will redirect to /forbidden on 403, throw other errors
        await handleServerActionError(error, 'getData');
    }
}

// Example 2: Return fallback on 403, throw other errors
export async function getDataWithFallback(id: string) {
    try {
        const response = await apiGet(`/api/data/${id}`);
        return await response.json();
    } catch (error) {
        // This will return fallback on 403, throw other errors
        return handleServerActionErrorWithFallback(
            error,
            { data: null, error: 'Access denied' },
            'getDataWithFallback'
        );
    }
}

// Example 3: Custom error handling with 403 check
export async function updateData(id: string, data: any) {
    try {
        const response = await apiPost(`/api/data/${id}`, data);
        return { success: true, data: await response.json() };
    } catch (error) {
        // Handle 403 specifically
        if (error instanceof ForbiddenError) {
            console.warn('Access forbidden for updateData');
            return { success: false, error: 'Access denied' };
        }
        
        // Handle other errors
        console.error('Error updating data:', error);
        throw error;
    }
}

// Example 4: Multiple error types
export async function complexOperation(id: string) {
    try {
        const response = await apiGet(`/api/complex/${id}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Resource not found');
            }
            if (response.status === 500) {
                throw new Error('Server error');
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        // This handles 403 by redirecting, other errors by throwing
        await handleServerActionError(error, 'complexOperation');
    }
}
