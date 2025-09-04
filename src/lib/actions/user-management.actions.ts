'use server';

import { z } from 'zod';
import { getAccountDetails as getNextAuthAccountDetails } from '@/lib/actions/nextauth.actions';
import { 
  CreateUserRequest, 
  CreateUserResponse, 
  UserPermission,
  AuthMethod 
} from '@/lib/types/authentication.types';
import { 
  createUserRequestSchema,
  validateEthereumAddress,
  validatePasswordStrength 
} from '@/lib/schemas/user-creation-validation';
import {apiPost} from "@/lib/utils/api-client";
import { handleServerActionErrorWithFallback } from "@/lib/utils/error-handler";

// API base URL - should come from environment variables
const API_BASE_URL = process.env.TRADE_DOCUMENTS_API_URL || 'http://localhost:3001/api';

/**
 * Create a new user with dual authentication support
 */
export async function createUser(
  userData: {
    name: string;
    emailAddress: string;
    authMethod: AuthMethod;
    walletAddress?: string;
    temporaryPassword?: string;
    mfaEnabled?: boolean;
    permissions: UserPermission[];
  }
): Promise<{ success: boolean; userId?: string; message?: string; error?: string }> {
  try {
    // Get current session for inviter details
    const session = await getNextAuthAccountDetails();

    // Prepare the request payload
    const requestPayload: CreateUserRequest = {
      accountId: session.accountId,
      name: userData.name,
      emailAddress: userData.emailAddress,
      walletAddress: userData.walletAddress,
      permissions: userData.permissions,
      authMethod: userData.authMethod,
      enableMfa: userData.mfaEnabled || false,
      sendInvitation: true,
      inviterId: session.userId,
      inviterName: session.accountName,
      temporaryPassword: userData.temporaryPassword,
    };

    // Validate the request payload
    const validatedPayload = createUserRequestSchema.parse(requestPayload);

    // Additional validation based on authentication method
    if (validatedPayload.authMethod === 'siwe') {
      if (!validatedPayload.walletAddress) {
        return {
          success: false,
          error: 'Wallet address is required for SIWE users'
        };
      }
      
      if (!validateEthereumAddress(validatedPayload.walletAddress)) {
        return {
          success: false,
          error: 'Invalid Ethereum wallet address format'
        };
      }
    } else if (validatedPayload.authMethod === 'email-password') {
      if (userData.temporaryPassword) {
        const passwordValidation = validatePasswordStrength(userData.temporaryPassword);
        if (!passwordValidation.isValid) {
          return {
            success: false,
            error: `Password does not meet requirements: ${passwordValidation.feedback.join(', ')}`
          };
        }
      }
    }

    // Make API call
    const response = await apiPost(`${API_BASE_URL}/auth/users`, validatedPayload);

    const data = await response.json();
    console.log(`*Data: ${JSON.stringify(data)}`);

    if (!response.ok) {
      console.error(`API Error: ${response.status} - ${JSON.stringify(data)}`);
      return {
        success: false,
        error: data.message || `Failed to create user (${response.status})`
      };
    }

    const result = data as CreateUserResponse;
    console.log(`result: ${JSON.stringify(result)}`);
    return {
      success: response.ok,
      userId: result.userId,
      message: result.message || 'User created successfully'
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return {
        success: false,
        error: `Validation failed: ${errorMessages}`
      };
    }

    return handleServerActionErrorWithFallback(
      error,
      {
        success: false,
        error: 'An unexpected error occurred while creating the user'
      },
      "createUser"
    );
  }
}

/**
 * Bulk create users with dual authentication support
 */
export async function bulkCreateUsers(
  usersData: Array<{
    name: string;
    emailAddress: string;
    authMethod: AuthMethod;
    walletAddress?: string;
    temporaryPassword?: string;
    mfaEnabled?: boolean;
    permissions: UserPermission[];
  }>
): Promise<{ 
  success: boolean; 
  createdUsers?: Array<{ userId: string; emailAddress: string; success: boolean; message?: string }>;
  message?: string; 
  error?: string 
}> {
  try {
    const session = await getNextAuthAccountDetails();

    // Validate each user
    const validatedUsers = [];
    for (const userData of usersData) {
      try {
        const requestPayload: CreateUserRequest = {
          accountId: session.accountId,
          name: userData.name,
          emailAddress: userData.emailAddress,
          walletAddress: userData.walletAddress,
          permissions: userData.permissions,
          authMethod: userData.authMethod,
          enableMfa: userData.mfaEnabled || false,
          sendInvitation: true,
          inviterId: session.userId,
          inviterName: session.accountName
        };

        createUserRequestSchema.parse(requestPayload);
        validatedUsers.push(requestPayload);
      } catch (validationError) {
        return {
          success: false,
          error: `Validation failed for user ${userData.emailAddress}: ${validationError instanceof Error ? validationError.message : 'Unknown error'}`
        };
      }
    }

    // Prepare bulk request
    const bulkRequest = {
      accountId: session.accountId,
      users: validatedUsers,
      sendInvitations: true,
      inviterId: session.userId,
      inviterName: session.accountName
    };

    // Make API call
    const response = await apiPost(`${API_BASE_URL}/auth/users/bulk`, bulkRequest);

    const data = await response.json();

    if (!response.ok) {
      console.error(`API Error: ${response.status} - ${JSON.stringify(data)}`);
      return {
        success: false,
        error: data.message || `Failed to create users (${response.status})`
      };
    }

    return {
      success: true,
      createdUsers: data.createdUsers,
      message: data.message || 'Users created successfully'
    };

  } catch (error) {
    return handleServerActionErrorWithFallback(
      error,
      {
        success: false,
        error: 'An unexpected error occurred while creating users'
      },
      "bulkCreateUsers"
    );
  }
}

/**
 * Validate user creation data without making API calls
 */
export async function validateUserCreationData(
  userData: {
    name: string;
    emailAddress: string;
    authMethod: AuthMethod;
    walletAddress?: string;
    temporaryPassword?: string;
    mfaEnabled?: boolean;
    permissions: UserPermission[];
  }
): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    const session = await getNextAuthAccountDetails();
    
    const requestPayload: CreateUserRequest = {
      accountId: session.accountId,
      name: userData.name,
      emailAddress: userData.emailAddress,
      walletAddress: userData.walletAddress,
      permissions: userData.permissions,
      authMethod: userData.authMethod,
      enableMfa: userData.mfaEnabled || false,
      sendInvitation: true,
      inviterId: session.userId,
      inviterName: session.accountName
    };

    createUserRequestSchema.parse(requestPayload);

    // Additional method-specific validation
    if (userData.authMethod === 'siwe') {
      if (!userData.walletAddress) {
        errors.push('Wallet address is required for SIWE users');
      } else if (!validateEthereumAddress(userData.walletAddress)) {
        errors.push('Invalid Ethereum wallet address format');
      }
    } else if (userData.authMethod === 'email-password') {
      if (userData.temporaryPassword) {
        const passwordValidation = validatePasswordStrength(userData.temporaryPassword);
        if (!passwordValidation.isValid) {
          errors.push(`Password validation failed: ${passwordValidation.feedback.join(', ')}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      errors.push(...validationErrors);
    } else {
      errors.push('An unexpected error occurred during validation');
    }

    return {
      isValid: false,
      errors
    };
  }
} 