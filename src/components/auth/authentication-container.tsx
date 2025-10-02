'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthMethodSelector } from './auth-method-selector';
import { SiweLogin } from './siwe-login';
import { EmailLogin } from './email-login';
import { MfaVerification } from './mfa-verification';
import { AuthMethod } from '@/lib/types/authentication.types';
import { toast } from 'sonner';

interface AuthenticationContainerProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

type AuthStep = 'method-selection' | 'siwe-login' | 'email-login' | 'mfa-verification';

export function AuthenticationContainer({ 
  onSuccess, 
  onError, 
  disabled = false, 
  className = '' 
}: AuthenticationContainerProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState<AuthStep>('method-selection');
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod>('email-password');
  const [mfaUserId, setMfaUserId] = useState<string>('');
  const [mfaSetupRequired, setMfaSetupRequired] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Redirect if already authenticated
  React.useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  const handleMethodSelection = (method: AuthMethod) => {
    setSelectedMethod(method);
    setError('');
    
    if (method === 'siwe') {
      setCurrentStep('siwe-login');
    } else {
      setCurrentStep('email-login');
    }
  };

  const handleSiweSuccess = () => {
    toast.success('SIWE authentication successful');
    onSuccess?.();
    // NextAuth will handle the redirect automatically
  };

  const handleSiweError = (error: string) => {
    setError(error);
    onError?.(error);
  };

  const handleEmailSuccess = () => {
    toast.success('Email authentication successful');
    onSuccess?.();
    // NextAuth will handle the redirect automatically
  };

  const handleEmailError = (error: string) => {
    setError(error);
    onError?.(error);
  };

  const handleMfaRequired = (userId: string, setupRequired: boolean) => {
    setMfaUserId(userId);
    setMfaSetupRequired(setupRequired);
    setCurrentStep('mfa-verification');
  };

  const handleMfaSuccess = () => {
    toast.success('MFA verification successful');
    onSuccess?.();
    // NextAuth will handle the redirect automatically
  };

  const handleMfaError = (error: string) => {
    setError(error);
    onError?.(error);
  };

  const handleBackToMethodSelection = () => {
    setCurrentStep('method-selection');
    setSelectedMethod('email-password');
    setMfaUserId('');
    setMfaSetupRequired(false);
    setError('');
  };

  const handleBackToEmailLogin = () => {
    setCurrentStep('email-login');
    setMfaUserId('');
    setMfaSetupRequired(false);
    setError('');
  };

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Step indicator */}
      {currentStep !== 'method-selection' && (
        <div className="flex items-center justify-between">
          <button
            onClick={currentStep === 'mfa-verification' ? handleBackToEmailLogin : handleBackToMethodSelection}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
            disabled={disabled}
          >
            ← Back to {currentStep === 'mfa-verification' ? 'Email Login' : 'Method Selection'}
          </button>
          <div className="text-xs text-muted-foreground">
            Step {currentStep === 'siwe-login' || currentStep === 'email-login' ? '2' : '3'} of 3
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Authentication steps */}
      {currentStep === 'method-selection' && (
        <AuthMethodSelector
          value={selectedMethod}
          onChange={handleMethodSelection}
          disabled={disabled}
        />
      )}

      {currentStep === 'siwe-login' && (
        <SiweLogin
          onSuccess={handleSiweSuccess}
          onError={handleSiweError}
          disabled={disabled}
        />
      )}

      {currentStep === 'email-login' && (
        <EmailLogin
          onSuccess={handleEmailSuccess}
          onError={handleEmailError}
          onMfaRequired={handleMfaRequired}
          disabled={disabled}
        />
      )}

      {currentStep === 'mfa-verification' && (
        <MfaVerification
          userId={mfaUserId}
          mfaSetupRequired={mfaSetupRequired}
          onSuccess={handleMfaSuccess}
          onError={handleMfaError}
          onBack={handleBackToEmailLogin}
          disabled={disabled}
        />
      )}

      {/* Help text */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>Need help?</strong> Contact support if you&apos;re having trouble signing in.</p>
        <p><strong>Security:</strong> All authentication methods use industry-standard security protocols.</p>
        <p><strong>Privacy:</strong> Your data is protected and never shared with third parties.</p>
      </div>
    </div>
  );
} 