# Server Action Error Handling Guide

This guide demonstrates how to handle HTTP 403 Forbidden responses gracefully across server actions using the new error handling utilities.

## Overview

The solution provides a clean approach for handling 403 errors by extending existing error handling logic:

1. **Redirect on 403**: Automatically redirects users to `/forbidden` page
2. **Fallback on 403**: Returns a fallback value instead of redirecting

## Error Classes

```typescript
import { ForbiddenError, UnauthorizedError, NotFoundError, ServerError } from '@/lib/errors/api-errors';

// These errors are automatically thrown by the API client when HTTP errors occur
// 403 -> ForbiddenError
// 401 -> UnauthorizedError  
// 404 -> NotFoundError
// 500+ -> ServerError
```

## API Client Integration

The API client (`api-client.ts`) has been enhanced to automatically throw appropriate errors:

```typescript
import { apiGet, apiPost } from '@/lib/utils/api-client';

// These will now throw ForbiddenError on 403 responses
const response = await apiGet('/some-protected-endpoint');
const response = await apiPost('/some-protected-endpoint', data);
```

## Error Handler Utilities

### 1. Redirect on 403 Error

Use `handleServerActionError` for actions that should redirect to `/forbidden` on 403:

```typescript
import { handleServerActionError } from '@/lib/utils/error-handler';

export async function getOnboardings(options: SearchOptions = {}): Promise<OnboardingsSearchResponse> {
    try {
        const response = await apiGet(`${apiUrl}/onboarding`);
        return await response.json();
    } catch (error) {
        await handleServerActionError(error, 'getOnboardings');
    }
}

// Usage: If 403 occurs, user is automatically redirected to /forbidden
const data = await getOnboardings({ page: 1 });
```

### 2. Fallback on 403 Error

Use `handleServerActionErrorWithFallback` for actions that should return a fallback value:

```typescript
import { handleServerActionErrorWithFallback } from '@/lib/utils/error-handler';

export async function getAccountUsers(queryTerm: string = "") {
    try {
        const response = await apiGet(`${apiUrl}/account-users?query=${queryTerm}`);
        return await response.json();
    } catch (error) {
        return handleServerActionErrorWithFallback(
            error,
            { data: [], metadata: { page: 1, totalPages: 1, limit: 10 } },
            'getAccountUsers'
        );
    }
}

// Usage: If 403 occurs, returns fallback data instead of redirecting
const result = await getAccountUsers("search term");
```

### 3. Custom Error Handling

For more control, you can handle 403 errors specifically:

```typescript
import { ForbiddenError } from '@/lib/errors/api-errors';

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
```

## Migration Guide

### Before (Manual Error Handling)

```typescript
export async function getOnboardings(options: SearchOptions = {}): Promise<OnboardingsSearchResponse> {
    try {
        const response = await apiGet(url);
        
        if (!response.ok) {
            if (response.status === 403) {
                // Manual redirect logic
                redirect('/forbidden');
            }
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching onboardings:', error);
        throw error;
    }
}
```

### After (Using Error Handler)

```typescript
export async function getOnboardings(options: SearchOptions = {}): Promise<OnboardingsSearchResponse> {
    try {
        const response = await apiGet(url);
        return await response.json();
    } catch (error) {
        await handleServerActionError(error, 'getOnboardings');
    }
}
```

## Best Practices

1. **Use `handleServerActionError`** for actions that should redirect users on 403 errors
2. **Use `handleServerActionErrorWithFallback`** for actions that should gracefully degrade
3. **Always await the error handler** since it's async
4. **Keep error handling consistent** across similar actions
5. **Provide meaningful context** in the error handler calls

## Error Page

The `/forbidden` page provides a user-friendly interface for 403 errors with:
- Clear explanation of the issue
- Actionable next steps
- Navigation options to return to dashboard or go back

## Testing

To test 403 error handling:

1. Mock API responses to return 403 status
2. Verify redirects to `/forbidden` page
3. Verify fallback values are returned when appropriate
4. Verify proper error logging occurs

## Key Benefits

- **Minimal Changes**: Just add one line to existing try/catch blocks
- **Clear Intent**: `await handleServerActionError(error, 'functionName')` is self-documenting
- **Flexibility**: Choose between redirecting or returning fallback values
- **Consistency**: Same pattern across all server actions
- **No Wrapper Complexity**: No need to change function signatures or use wrapper functions