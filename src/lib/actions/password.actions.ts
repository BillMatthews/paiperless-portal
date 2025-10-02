'use server';

import { z } from 'zod';

// Import validation schemas
import { 
  changePasswordRequestSchema, 
  forgotPasswordRequestSchema, 
  resetPasswordRequestSchema,
  forcedPasswordResetRequestSchema,
  adminForcedPasswordResetRequestSchema
} from '@/lib/schemas/password-validation';

// Import types
import {
  ChangePasswordResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  ApiErrorResponse 
} from '@/lib/types/authentication.types';
import { apiPost } from "@/lib/utils/api-client";
import { handleServerActionErrorWithFallback } from "@/lib/utils/error-handler";

// API base URL - should come from environment variables
const API_BASE_URL = process.env.TRADE_DOCUMENTS_API_URL || 'http://localhost:3001/api';

/**
 * Change password for email/password users
 */
export async function changePassword(
  currentPassword: string, 
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Validate input
    const validatedData = changePasswordRequestSchema.parse({
      currentPassword,
      newPassword
    });

    // Make API call
    const response = await apiPost(`${API_BASE_URL}/auth/password/change`, validatedData);

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      return {
        success: false,
        error: errorData.message || 'Failed to change password',
      };
    }

    const result = data as ChangePasswordResponse;
    return {
      success: result.success,
      message: result.message || 'Password changed successfully',
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data: ' + error.issues.map(e => e.message).join(', '),
      };
    }

    return handleServerActionErrorWithFallback(
      error,
      {
        success: false,
        error: 'An unexpected error occurred while changing password',
      },
      "changePassword"
    );
  }
}

/**
 * Request password reset (forgot password)
 */
export async function forgotPassword(
  email: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Validate input
    const validatedData = forgotPasswordRequestSchema.parse({ email });

    // Make API call
    const response = await apiPost(`${API_BASE_URL}/auth/password/forgot`, validatedData);

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      return {
        success: false,
        error: errorData.message || 'Failed to send password reset email',
      };
    }




    const result = data as ForgotPasswordResponse;
    return {
      success: result.success,
      message: result.message || 'Password reset email sent successfully',
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid email address',
      };
    }

    return handleServerActionErrorWithFallback(
      error,
      {
        success: false,
        error: 'An unexpected error occurred while sending password reset email',
      },
      "forgotPassword"
    );
  }
}

/**
 * Reset password using token
 */
export async function resetPassword(
  token: string, 
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Validate input
    const validatedData = resetPasswordRequestSchema.parse({
      token,
      newPassword
    });

    // Make API call
    const response = await apiPost(`${API_BASE_URL}/auth/password/reset`, validatedData);

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      return {
        success: false,
        error: errorData.message || 'Failed to reset password',
      };
    }

    const result = data as ResetPasswordResponse;
    return {
      success: result.success,
      message: result.message || 'Password reset successfully',
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data: ' + error.issues.map(e => e.message).join(', '),
      };
    }

    return handleServerActionErrorWithFallback(
      error,
      {
        success: false,
        error: 'An unexpected error occurred while resetting password',
      },
      "resetPassword"
    );
  }
}

/**
 * Forced password reset when passwordResetRequired is true
 */
export async function forcedPasswordReset(
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Validate input
    const validatedData = forcedPasswordResetRequestSchema.parse({
      email,
      currentPassword,
      newPassword
    });

    // Make API call
    const response = await apiPost(`${API_BASE_URL}/auth/password/forced-reset`, validatedData);

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      return {
        success: false,
        error: errorData.message || 'Failed to reset password',
      };
    }

    const result = data as ChangePasswordResponse;
    return {
      success: result.success,
      message: result.message || 'Password reset successfully',
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data: ' + error.issues.map(e => e.message).join(', '),
      };
    }

    return handleServerActionErrorWithFallback(
      error,
      {
        success: false,
        error: 'An unexpected error occurred while resetting password',
      },
      "forcedPasswordReset"
    );
  }
}

/**
 * Admin-forced password reset for other users
 */
export async function adminForcedPasswordReset(
  email: string,
  reason: string,
  sendEmail: boolean
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Validate input
    const validatedData = adminForcedPasswordResetRequestSchema.parse({
      email,
      reason,
      sendEmail
    });

    // Make API call
    const response = await apiPost(`${API_BASE_URL}/auth/password/force-password-reset`, validatedData);

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      return {
        success: false,
        error: errorData.message || 'Failed to force password reset',
      };
    }

    const result = data as { success: boolean; message: string };
    return {
      success: result.success,
      message: result.message || 'Password reset forced successfully',
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data: ' + error.issues.map(e => e.message).join(', '),
      };
    }

    return handleServerActionErrorWithFallback(
      error,
      {
        success: false,
        error: 'An unexpected error occurred while forcing password reset',
      },
      "adminForcedPasswordReset"
    );
  }
}

