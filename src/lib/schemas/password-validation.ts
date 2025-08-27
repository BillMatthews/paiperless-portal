import { z } from 'zod';

/**
 * Schema for password change request
 */
export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
});

/**
 * Schema for forgot password request
 */
export const forgotPasswordRequestSchema = z.object({
  email: z.string().email('Valid email address is required')
});

/**
 * Schema for password reset request
 */
export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
});

/**
 * Schema for password confirmation
 */
export const passwordConfirmationSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirmPassword: z.string().min(1, 'Password confirmation is required')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * Schema for forced password reset request
 */
export const forcedPasswordResetRequestSchema = z.object({
  email: z.string().email('Valid email address is required'),
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
});

/**
 * Schema for admin-forced password reset request
 */
export const adminForcedPasswordResetRequestSchema = z.object({
  email: z.string().email('Valid email address is required'),
  reason: z.string().min(1, 'Reason is required'),
  sendEmail: z.boolean()
});

/**
 * Type exports
 */
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type PasswordConfirmation = z.infer<typeof passwordConfirmationSchema>;
export type ForcedPasswordResetRequest = z.infer<typeof forcedPasswordResetRequestSchema>;
export type AdminForcedPasswordResetRequest = z.infer<typeof adminForcedPasswordResetRequestSchema>; 