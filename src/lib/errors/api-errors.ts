/**
 * Custom error classes for API responses
 */

export class ApiError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly response?: Response;

  constructor(message: string, status: number, statusText: string, response?: Response) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.response = response;
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Access forbidden', response?: Response) {
    super(message, 403, 'Forbidden', response);
    this.name = 'ForbiddenError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized', response?: Response) {
    super(message, 401, 'Unauthorized', response);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found', response?: Response) {
    super(message, 404, 'Not Found', response);
    this.name = 'NotFoundError';
  }
}

export class ServerError extends ApiError {
  constructor(message: string = 'Internal server error', response?: Response) {
    super(message, 500, 'Internal Server Error', response);
    this.name = 'ServerError';
  }
}

/**
 * Helper function to create appropriate error based on HTTP status
 */
export function createApiError(response: Response, message?: string): ApiError {
  const status = response.status;
  const statusText = response.statusText;
  const errorMessage = message || `HTTP ${status}: ${statusText}`;

  switch (status) {
    case 401:
      return new UnauthorizedError(errorMessage, response);
    case 403:
      return new ForbiddenError(errorMessage, response);
    case 404:
      return new NotFoundError(errorMessage, response);
    case 500:
    case 502:
    case 503:
    case 504:
      return new ServerError(errorMessage, response);
    default:
      return new ApiError(errorMessage, status, statusText, response);
  }
}
