import { z } from 'zod';
import {ApplicationModule, ApplicationRole} from "@/lib/types/authentication.types";

// Authentication method enum
export const authMethodSchema = z.enum(['siwe', 'email-password']);

// User permission schema
export const userPermissionSchema = z.object({
  module: z.enum(Object.values(ApplicationModule) as [string, ...string[]]),
  role: z.enum(Object.values(ApplicationRole) as [string, ...string[]])
});

// Base user creation schema
export const baseUserCreationSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  emailAddress: z.string().email('Valid email address is required'),
  permissions: z.array(userPermissionSchema).min(1, 'At least one permission is required'),
  authMethod: authMethodSchema,
  enableMfa: z.boolean(),
  sendInvitation: z.boolean(),
  inviterId: z.string().min(1, 'Inviter ID is required'),
  inviterName: z.string().min(1, 'Inviter name is required')
});

// SIWE-specific validation
export const siweUserCreationSchema = baseUserCreationSchema.extend({
  authMethod: z.literal('siwe'),
  walletAddress: z.string()
    .min(1, 'Wallet address is required for SIWE users')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Valid Ethereum address is required'),
  enableMfa: z.literal(false), // MFA not applicable for SIWE
});

// Email/Password-specific validation
export const emailPasswordUserCreationSchema = baseUserCreationSchema.extend({
  authMethod: z.literal('email-password'),
  walletAddress: z.string().optional(), // Optional for email/password users
  enableMfa: z.boolean(), // MFA can be enabled for email/password users
  temporaryPassword: z.string()
});

// Combined user creation schema with conditional validation
export const createUserRequestSchema = z.discriminatedUnion('authMethod', [
  siweUserCreationSchema,
  emailPasswordUserCreationSchema
]);

// Form data schema for the create user dialog
export const createUserFormDataSchema = z.object({
  // Basic information
  name: z.string().min(2, 'Name must be at least 2 characters'),
  emailAddress: z.string().email('Valid email address is required'),
  status: z.enum(['Active', 'Suspended', 'Under Review']),
  permissions: z.array(z.object({
    module: z.string(),
    role: z.string()
  })).min(1, 'At least one permission is required'),
  
  // Authentication method
  authMethod: authMethodSchema,
  
  // SIWE fields (required when authMethod is 'siwe')
  walletAddress: z.string().optional(),
  
  // Email/Password fields (required when authMethod is 'email-password')
  temporaryPassword: z.string().optional(),
  mfaEnabled: z.boolean().optional(),
}).refine((data) => {
  // Validate SIWE requirements
  if (data.authMethod === 'siwe') {
    if (!data.walletAddress?.trim()) {
      return false;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(data.walletAddress)) {
      return false;
    }
  }
  return true;
}, {
  message: 'Valid wallet address is required for SIWE users',
  path: ['walletAddress']
}).refine((data) => {
  // Validate email/password requirements
  if (data.authMethod === 'email-password') {
    if (!data.temporaryPassword?.trim()) {
      return false;
    }
    // Password strength validation
    const password = data.temporaryPassword;
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/\d/.test(password)) return false;
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
  }
  return true;
}, {
  message: 'Strong temporary password is required for email/password users',
  path: ['temporaryPassword']
});

// Type exports
export type AuthMethod = z.infer<typeof authMethodSchema>;
export type UserPermission = z.infer<typeof userPermissionSchema>;
export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;
export type CreateUserFormData = z.infer<typeof createUserFormDataSchema>;

// Validation utilities
export const validateEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password must be at least 8 characters long');
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one uppercase letter');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one lowercase letter');
  }

  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one number');
  }

  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one special character');
  }

  // Additional strength checks
  if (password.length >= 12) {
    score += 0.5;
  }
  if (/(.)\1{2,}/.test(password)) {
    score -= 0.5;
    feedback.push('Avoid repeating characters');
  }
  if (/123|abc|qwe/i.test(password)) {
    score -= 0.5;
    feedback.push('Avoid common patterns');
  }

  // Cap score at 4
  score = Math.min(score, 4);

  return {
    isValid: score >= 3, // Require at least 3 out of 5 basic requirements
    score: Math.max(0, score),
    feedback: feedback.length > 0 ? feedback : ['Password meets all requirements']
  };
}; 