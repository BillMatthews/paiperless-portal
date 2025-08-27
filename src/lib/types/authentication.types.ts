export interface AuthResponseBody {
    success: boolean;
    accountId: string;
    userId: string;
    accountName: string;
    accountEmail: string;
    accessToken: string;
    refreshToken: string;
    walletAddress?: string; // Only present for SIWE authentication
    mfaRequired?: boolean; // Only present for email/password authentication
    mfaSetupRequired?: boolean; // Only present when MFA setup is needed
    passwordResetRequired?: boolean; // Only present when password reset is needed
    permissions: UserPermission[];
}

// SIWE Authentication
export interface SiweLoginRequest {
    message: string;
    signature: string;
}

export interface SiweLoginResponse extends AuthResponseBody {
    walletAddress: string;
}

// Email/Password Authentication
export interface EmailLoginRequest {
    email: string;
    password: string;
}

export interface EmailLoginResponse extends AuthResponseBody {
    mfaRequired: boolean;
    mfaSetupRequired?: boolean;
}

// MFA Verification
export interface MfaVerificationRequest {
    userId: string;
    code: string;
    isBackupCode: boolean;
}

export interface MfaVerificationResponse extends AuthResponseBody {
    // Same as AuthResponseBody - returns tokens after successful verification
}

// MFA Setup
export interface MfaSetupRequest {
    userId: string;
}

export interface MfaSetupResponse {
    success: boolean;
    qrCodeUrl: string;
    secret: string;
    backupCodes: string[];
    message?: string;
}

export interface MfaVerifySetupRequest {
    userId: string;
    totpCode: string;
}

export interface MfaVerifySetupResponse {
    success: boolean;
    message?: string;
}

// MFA Management
export interface MfaDisableRequest {
    userId: string;
    currentPassword: string;
    verificationCode: string;
}

export interface MfaDisableResponse {
    success: boolean;
    message?: string;
}

export interface MfaRegenerateBackupCodesRequest {
    userId: string;
    currentPassword: string;
    totpCode: string;
}

export interface MfaRegenerateBackupCodesResponse {
    success: boolean;
    backupCodes: string[];
    message?: string;
}

export interface MfaStatusResponse {
    success: boolean;
    enabled: boolean;
    setupComplete: boolean;
    backupCodesRemaining: number;
}

// Password Management Types
export interface ChangePasswordRequest {
    userId: string;
    currentPassword: string;
    newPassword: string;
}

export interface ChangePasswordResponse {
    success: boolean;
    message?: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ForgotPasswordResponse {
    success: boolean;
    message: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

export interface ResetPasswordResponse {
    success: boolean;
    message?: string;
}

// Token Refresh
export interface TokenRefreshRequest {
    refreshToken: string;
}

export interface TokenRefreshResponse extends AuthResponseBody {
    // Same as AuthResponseBody - returns new tokens
}

// Nonce for SIWE
export interface NonceResponse {
    nonce: string;
    message: string;
}

// Error Response Types
export interface ApiErrorResponse {
    statusCode: number;
    message: string;
    error: string;
    details?: Record<string, any>;
    timestamp: string;
    path: string;
}

// User Creation Types (from API_INTEGRATION_GUIDE.md)
export interface CreateUserRequest {
    accountId: string;
    name: string;
    emailAddress: string;
    walletAddress?: string; // Optional for email/password users
    permissions: UserPermission[];
    authMethod: AuthMethod;
    enableMfa: boolean;
    sendInvitation: boolean;
    inviterId: string;
    inviterName: string;
    temporaryPassword?: string;
}

export interface CreateUserResponse {
    success: boolean;
    userId: string;
    message?: string;
}

// User Permission Types
export enum ApplicationModule {
    PAIPERLESS_TRADE_DOCUMENTS = 'Paiperless-Trade-Documents',
    PAIPERLESS_TRADE_FINANCE = 'Paiperless-Trade-Finance',
    PAIPERLESS_ADMIN = 'Paiperless-Admin',
}


export enum ApplicationRole {
    AGENT = 'Agent',
    SUPERVISOR = 'Supervisor',
    MANAGER = 'Manager',
}

export interface UserPermission {
    module:ApplicationModule
    role: ApplicationRole,
    description?: string
}

// Authentication Method Type
export type AuthMethod = 'siwe' | 'email-password';
