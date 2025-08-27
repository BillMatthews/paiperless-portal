'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiweLogin, EmailLogin, MfaVerification, ForcedPasswordReset } from "@/components/auth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wallet, Mail, Shield } from "lucide-react";
import React from "react";

export default function LoginPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [activeTab, setActiveTab] = useState("email-password");
    const [mfaUserId, setMfaUserId] = useState<string>('');
    const [mfaSetupRequired, setMfaSetupRequired] = useState<boolean>(false);
    const [showMfa, setShowMfa] = useState<boolean>(false);
    const [showPasswordReset, setShowPasswordReset] = useState<boolean>(false);
    const [passwordResetEmail, setPasswordResetEmail] = useState<string>('');

    // Note: AuthGuard will handle redirects for authenticated users

    const handleSiweSuccess = () => {
        // NextAuth will handle the redirect automatically
    };

    const handleSiweError = (error: string) => {
        // Error handling is done within the component
    };

    const handleEmailSuccess = () => {
        // NextAuth will handle the redirect automatically
    };

    const handleEmailError = (error: string) => {
        // Error handling is done within the component
    };

    const handleMfaRequired = (userId: string, setupRequired: boolean) => {
        setMfaUserId(userId);
        setMfaSetupRequired(setupRequired);
        setShowMfa(true);
    };

    const handleMfaSuccess = () => {
        setShowMfa(false);
        // NextAuth will handle the redirect automatically
    };

    const handleMfaError = (error: string) => {
        // Error handling is done within the component
    };

    const handleBackToEmailLogin = () => {
        setShowMfa(false);
        setMfaUserId('');
        setMfaSetupRequired(false);
    };

    const handlePasswordResetRequired = (email: string) => {
        setPasswordResetEmail(email);
        setShowPasswordReset(true);
    };

    const handlePasswordResetSuccess = () => {
        setShowPasswordReset(false);
        setPasswordResetEmail('');
        // User can now try to log in again with their new password
    };

    const handleBackToLogin = () => {
        setShowPasswordReset(false);
        setPasswordResetEmail('');
    };

    // Show loading state while checking authentication
    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="flex items-center justify-center p-6">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Loading...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show MFA verification if required
    if (showMfa) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold">Multi-Factor Authentication</CardTitle>
                        <CardDescription>
                            Complete your sign in with additional verification
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MfaVerification
                            userId={mfaUserId}
                            mfaSetupRequired={mfaSetupRequired}
                            onSuccess={handleMfaSuccess}
                            onError={handleMfaError}
                            onBack={handleBackToEmailLogin}
                        />
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show password reset if required
    if (showPasswordReset) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <ForcedPasswordReset
                    email={passwordResetEmail}
                    onSuccess={handlePasswordResetSuccess}
                    onBack={handleBackToLogin}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Welcome to Paiperless Portal</CardTitle>
                    <CardDescription>
                        Sign in to your account to continue
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="email-password" className="flex items-center space-x-2">
                                <Mail className="h-4 w-4" />
                                <span>Email & Password</span>
                            </TabsTrigger>
                            <TabsTrigger value="siwe" className="flex items-center space-x-2">
                                <Wallet className="h-4 w-4" />
                                <span>Web3 Wallet</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="email-password" className="space-y-4">

                            <EmailLogin
                                onSuccess={handleEmailSuccess}
                                onError={handleEmailError}
                                onMfaRequired={handleMfaRequired}
                                onPasswordResetRequired={handlePasswordResetRequired}
                            />


                        </TabsContent>

                        <TabsContent value="siwe" className="space-y-4">


                            <SiweLogin
                                onSuccess={handleSiweSuccess}
                                onError={handleSiweError}
                            />

                            <div className="text-center">
                                <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                                    <Shield className="h-3 w-3" />
                                    <span>Cryptographic security with blockchain technology</span>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                </CardContent>
            </Card>
        </div>
    );
}