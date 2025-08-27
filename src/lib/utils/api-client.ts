import { getToken } from "next-auth/jwt"
import { cookies } from "next/headers"

interface ApiClientOptions extends RequestInit {
  requireAuth?: boolean
  retryOnAuthFailure?: boolean
}

interface RefreshResponse {
  accessToken: string
  refreshToken: string
}

/**
 * Attempts to refresh the access token using the refresh token
 */
async function attemptTokenRefresh(): Promise<string | null> {
  try {
    const token = await getToken({ 
      req: { cookies: await cookies() } as any,
      secret: process.env.NEXTAUTH_SECRET
    }) as any
    
    if (!token?.refreshToken) {
      console.warn("No refresh token available for token refresh")
      return null
    }

    const response = await fetch(`${process.env.TRADE_DOC_API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    })

    if (!response.ok) {
      console.warn("Token refresh failed:", response.status, response.statusText)
      return null
    }

    const data = await response.json() as RefreshResponse
    
    // Update the JWT token with new tokens
    // Note: In a real implementation, you might want to update the session here
    // For now, we'll return the new access token to use immediately
    return data.accessToken
  } catch (error) {
    console.error("Error during token refresh:", error)
    return null
  }
}

/**
 * Wrapper around fetch that automatically includes bearer token from NextAuth session
 * and handles token refresh on 401 responses
 */
export async function apiClient(
  url: string, 
  options: ApiClientOptions = {}
): Promise<Response> {
  const { 
    requireAuth = true, 
    retryOnAuthFailure = true,
    headers = {}, 
    ...restOptions 
  } = options

  // Get the access token if authentication is required
  let accessToken: string | undefined
  if (requireAuth) {
    try {
      const token = await getToken({ 
        req: { cookies: await cookies() } as any,
        secret: process.env.NEXTAUTH_SECRET
      }) as any
      
      accessToken = token?.accessToken
    } catch (error) {
      console.warn("Failed to get access token:", error)
    }
  }

  // Prepare headers
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  }

  // Add any additional headers
  if (typeof headers === 'object' && !Array.isArray(headers)) {
    Object.assign(requestHeaders, headers)
  }

  // Add bearer token if available
  if (accessToken) {
    requestHeaders.Authorization = `Bearer ${accessToken}`
  }

  // Make the initial request
  let response = await fetch(url, {
    ...restOptions,
    headers: requestHeaders,
  })

  // If we get a 401 and retry is enabled, attempt token refresh
  if (response.status === 401 && retryOnAuthFailure && requireAuth) {
    console.log("Received 401, attempting token refresh...")
    
    const newAccessToken = await attemptTokenRefresh()
    
    if (newAccessToken) {
      console.log("Token refresh successful, retrying original request...")
      
      // Update headers with new token
      const retryHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${newAccessToken}`
      }
      
      // Add any additional headers if they exist
      if (typeof headers === 'object' && !Array.isArray(headers)) {
        Object.assign(retryHeaders, headers)
      }

      // Retry the original request with the new token
      response = await fetch(url, {
        ...restOptions,
        headers: retryHeaders,
      })
    } else {
      console.warn("Token refresh failed, returning original 401 response")
    }
  }

  return response
}

/**
 * Convenience function for GET requests
 */
export async function apiGet(url: string, options: ApiClientOptions = {}) {
  return apiClient(url, { ...options, method: "GET" })
}

/**
 * Convenience function for POST requests
 */
export async function apiPost(url: string, data?: any, options: ApiClientOptions = {}) {
  return apiClient(url, {
    ...options,
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * Convenience function for PUT requests
 */
export async function apiPut(url: string, data?: any, options: ApiClientOptions = {}) {
  return apiClient(url, {
    ...options,
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * Convenience function for PATCH requests
 */
export async function apiPatch(url: string, data?: any, options: ApiClientOptions = {}) {
  return apiClient(url, {
    ...options,
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * Convenience function for DELETE requests
 */
export async function apiDelete(url: string, options: ApiClientOptions = {}) {
  return apiClient(url, { ...options, method: "DELETE" })
}

/**
 * Convenience function for FormData requests (e.g., file uploads)
 */
export async function apiFormData(url: string, formData: FormData, options: ApiClientOptions = {}) {
  const { 
    retryOnAuthFailure = true,
    headers = {}, 
    ...restOptions 
  } = options

  // Get the access token if authentication is required
  let accessToken: string | undefined
  if (options.requireAuth !== false) {
    try {
      const token = await getToken({ 
        req: { cookies: await cookies() } as any,
        secret: process.env.NEXTAUTH_SECRET
      }) as any
      
      accessToken = token?.accessToken
    } catch (error) {
      console.warn("Failed to get access token:", error)
    }
  }

  // Prepare headers (don't set Content-Type for FormData)
  const requestHeaders: Record<string, string> = {}

  // Add any additional headers
  if (typeof headers === 'object' && !Array.isArray(headers)) {
    Object.assign(requestHeaders, headers)
  }

  // Add bearer token if available
  if (accessToken) {
    requestHeaders.Authorization = `Bearer ${accessToken}`
  }

  // Make the initial request
  let response = await fetch(url, {
    ...restOptions,
    method: "POST",
    headers: requestHeaders,
    body: formData,
  })

  // If we get a 401 and retry is enabled, attempt token refresh
  if (response.status === 401 && retryOnAuthFailure && options.requireAuth !== false) {
    console.log("Received 401 on FormData request, attempting token refresh...")
    
    const newAccessToken = await attemptTokenRefresh()
    
    if (newAccessToken) {
      console.log("Token refresh successful, retrying original FormData request...")
      
      // Update headers with new token
      const retryHeaders: Record<string, string> = {
        Authorization: `Bearer ${newAccessToken}`
      }
      
      // Add any additional headers if they exist
      if (typeof headers === 'object' && !Array.isArray(headers)) {
        Object.assign(retryHeaders, headers)
      }

      // Retry the original request with the new token
      response = await fetch(url, {
        ...restOptions,
        method: "POST",
        headers: retryHeaders,
        body: formData,
      })
    } else {
      console.warn("Token refresh failed, returning original 401 response")
    }
  }

  return response
} 