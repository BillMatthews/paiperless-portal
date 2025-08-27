"use server"

import { getServerSession } from "next-auth"
import { getToken } from "next-auth/jwt"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { 
    AuthResponseBody, 
    EmailLoginRequest, 
    EmailLoginResponse,
    MfaVerificationRequest,
    MfaVerificationResponse,
    MfaSetupRequest,
    MfaSetupResponse,
    MfaVerifySetupRequest,
    MfaVerifySetupResponse,
    MfaStatusResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    TokenRefreshRequest,
    TokenRefreshResponse,
    NonceResponse
} from "@/lib/types/authentication.types"
import { cookies } from "next/headers"
import { apiGet, apiPatch, apiPost } from "@/lib/utils/api-client"

export async function getNonce(wallet: string): Promise<string> {
    const res = await apiGet(`${process.env.TRADE_DOCUMENTS_API_URL}/auth/nonce/${wallet}`);
    return await res.text();
}

export async function authenticateSIWE(message: string, signature: string, walletAddress: string): Promise<AuthResponseBody> {
    // This function now uses NextAuth's signIn method
    // The actual authentication is handled in the NextAuth API route
    const res = await apiPost(`${process.env.TRADE_DOCUMENTS_API_URL}/auth/login`, { message, signature });
    
    const data = await res.json() as AuthResponseBody;
    console.log("Data: ", JSON.stringify(data));

    return data;
}

export async function authenticateEmailPassword(email: string, password: string): Promise<EmailLoginResponse> {
    const payload: EmailLoginRequest = { email, password };
    const res = await apiPost(`${process.env.TRADE_DOCUMENTS_API_URL}/auth/login/email`, payload);
    
    const data = await res.json() as EmailLoginResponse;
    console.log("Email login response: ", JSON.stringify(data));

    return data;
}

export async function verifyMfa(userId: string, code: string, isBackupCode: boolean = false): Promise<MfaVerificationResponse> {
    const payload: MfaVerificationRequest = { userId, code, isBackupCode };
    const res = await apiPost(`${process.env.TRADE_DOCUMENTS_API_URL}/auth/mfa/verify`, payload);
    
    const data = await res.json() as MfaVerificationResponse;
    console.log("MFA verification response: ", JSON.stringify(data));

    return data;
}

export async function setupMfa(userId: string): Promise<MfaSetupResponse> {
    const payload: MfaSetupRequest = { userId };
    const res = await apiPost(`${process.env.TRADE_DOCUMENTS_API_URL}/auth/mfa/setup`, payload);
    
    const data = await res.json() as MfaSetupResponse;
    console.log("MFA setup response: ", JSON.stringify(data));

    return data;
}

export async function verifyMfaSetup(userId: string, totpCode: string): Promise<MfaVerifySetupResponse> {
    const payload: MfaVerifySetupRequest = { userId, totpCode };
    const res = await apiPost(`${process.env.TRADE_DOCUMENTS_API_URL}/auth/mfa/verify-setup`, payload);
    
    const data = await res.json() as MfaVerifySetupResponse;
    console.log("MFA setup verification response: ", JSON.stringify(data));

    return data;
}

export async function getMfaStatus(userId: string): Promise<MfaStatusResponse> {
    const res = await apiGet(`${process.env.TRADE_DOCUMENTS_API_URL}/auth/mfa/status/${userId}`);
    const data = await res.json() as MfaStatusResponse;
    console.log("MFA status response: ", JSON.stringify(data));

    return data;
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<ChangePasswordResponse> {
    const payload: ChangePasswordRequest = { userId, currentPassword, newPassword };
    const res = await apiPost(`${process.env.TRADE_DOCUMENTS_API_URL}/auth/password/change`, payload);
    
    const data = await res.json() as ChangePasswordResponse;
    console.log("Change password response: ", JSON.stringify(data));

    return data;
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const payload: ForgotPasswordRequest = { email };
    const res = await apiPost(`${process.env.TRADE_DOCUMENTS_API_URL}/auth/password/forgot`, payload);
    
    const data = await res.json() as ForgotPasswordResponse;
    console.log("Forgot password response: ", JSON.stringify(data));

    return data;
}

export async function resetPassword(token: string, newPassword: string): Promise<ResetPasswordResponse> {
    const payload: ResetPasswordRequest = { token, newPassword };
    const res = await apiPost(`${process.env.TRADE_DOCUMENTS_API_URL}/auth/password/reset`, payload);
    
    const data = await res.json() as ResetPasswordResponse;
    console.log("Reset password response: ", JSON.stringify(data));

    return data;
}

export async function refreshToken(): Promise<TokenRefreshResponse> {
    // Get the JWT token directly
    const token = await getToken({ 
        req: { cookies: await cookies() } as any,
        secret: process.env.NEXTAUTH_SECRET
    }) as any;
    
    if (!token?.refreshToken) {
        throw new Error('No refresh token found in session');
    }

    // Call the refresh endpoint
    const payload: TokenRefreshRequest = { refreshToken: token.refreshToken };
    const res = await apiPost(`${process.env.TRADE_DOCUMENTS_API_URL}/auth/refresh`, payload);
    
    const data = await res.json() as TokenRefreshResponse;
    console.log("Refresh response: ", JSON.stringify(data));

    return data;
}

export async function getCurrentSession() {
    return await getServerSession(auth);
}

export async function getAccessToken(): Promise<string> {
    // Get the JWT token directly
    const token = await getToken({ 
        req: { cookies: await cookies() } as any,
        secret: process.env.NEXTAUTH_SECRET
    }) as any;
    
    if (!token?.accessToken) {
        throw new Error('No access token found in session');
    }

    return token.accessToken;
}

export async function getAccountDetails() {
    // Get the JWT token directly since session callback isn't called in server actions
    const token = await getToken({ 
        req: { cookies: await cookies() } as any,
        secret: process.env.NEXTAUTH_SECRET
    }) as any;
    
    //console.log("JWT Token from getToken:", JSON.stringify(token, null, 2));
    console.log("JWT Token from getToken:");
    
    if (token) {
        return {
            accountId: token.accountId,
            userId: token.userId,
            accountName: token.accountName,
            accountEmail: token.accountEmail,
            walletAddress: token.walletAddress,
        };
    }
    
    // Fallback to session (though this likely won't work)
    const session = await getServerSession(auth) as any;

    if (!session?.user) {
        throw new Error('No user found in session');
    }

    return {
        accountId: session.user.accountId,
        userId: session.user.userId,
        accountName: session.user.accountName,
        accountEmail: session.user.accountEmail,
        walletAddress: session.user.walletAddress,
    };
} 