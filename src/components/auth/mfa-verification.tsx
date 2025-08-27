'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Smartphone, Key, AlertCircle, ArrowLeft } from 'lucide-react';
import { verifyMfa } from '@/lib/actions/nextauth.actions';

interface MfaVerificationProps {
  userId: string;
  mfaSetupRequired?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onBack?: () => void;
  disabled?: boolean;
  className?: string;
}

export function MfaVerification({ 
  userId, 
  mfaSetupRequired = false,
  onSuccess, 
  onError, 
  onBack,
  disabled = false, 
  className = '' 
}: MfaVerificationProps) {
  const [activeTab, setActiveTab] = useState('totp');
  const [totpCode, setTotpCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');

      const code = activeTab === 'totp' ? totpCode : backupCode;
      const isBackupCode = activeTab === 'backup';

      if (!code) {
        const errorMessage = `Please enter your ${activeTab === 'totp' ? 'TOTP code' : 'backup code'}.`;
        setError(errorMessage);
        onError?.(errorMessage);
        return;
      }

      // Verify MFA with the API
      const response = await verifyMfa(userId, code, isBackupCode);
      console.log(`MFA Response: ${JSON.stringify(response)}`)
      
      if (!response.success) {
        const errorMessage = response.message || 'MFA verification failed. Please try again.';
        setError(errorMessage);
        onError?.(errorMessage);
        toast.error(errorMessage);
        return;
      }

      // If MFA verification successful, proceed with NextAuth signIn
      // Pass along the details from verifyMfa() so NextAuth can populate the user/session correctly
      const result = await signIn('email-password', {
        userId,
        mfaVerified: true,
        // Map MfaVerificationResponse (extends AuthResponseBody)
        accountId: response.accountId,
        accountName: response.accountName,
        accountEmail: response.accountEmail,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        walletAddress: response.walletAddress,
        redirect: false,
      });

      if (result?.error) {
        const errorMessage = 'Authentication failed. Please try again.';
        setError(errorMessage);
        onError?.(errorMessage);
        toast.error(errorMessage);
        return;
      }

      toast.success('MFA verification successful');
      onSuccess?.();

    } catch (err) {
      const errorMessage = 'An error occurred during MFA verification. Please try again.';
      setError(errorMessage);
      onError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setError('');
    setTotpCode('');
    setBackupCode('');
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center space-x-2">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              disabled={disabled}
              className="p-0 h-auto"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Multi-Factor Authentication</CardTitle>
          </div>
        </div>
        <CardDescription>
          {mfaSetupRequired 
            ? 'Please set up MFA to complete your authentication'
            : 'Enter your verification code to complete sign in'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="totp" disabled={disabled}>
              <Smartphone className="h-4 w-4 mr-2" />
              TOTP Code
            </TabsTrigger>
            <TabsTrigger value="backup" disabled={disabled}>
              <Key className="h-4 w-4 mr-2" />
              Backup Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="totp" className="space-y-4">
            <form onSubmit={handleVerify}>
              <div className="space-y-2">
                <Label htmlFor="totp-code">TOTP Code</Label>
                <Input
                  id="totp-code"
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="Enter 6-digit code from your authenticator app"
                  maxLength={6}
                  disabled={disabled || loading}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code from your authenticator app (Google Authenticator, Authy, etc.)
                </p>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full mt-4" 
                disabled={disabled || loading || !totpCode}
              >
                {loading ? 'Verifying...' : 'Verify TOTP Code'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="backup" className="space-y-4">
            <form onSubmit={handleVerify}>
              <div className="space-y-2">
                <Label htmlFor="backup-code">Backup Code</Label>
                <Input
                  id="backup-code"
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  placeholder="Enter your backup code"
                  disabled={disabled || loading}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter one of your backup codes if you can't access your authenticator app
                </p>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full mt-4" 
                disabled={disabled || loading || !backupCode}
              >
                {loading ? 'Verifying...' : 'Verify Backup Code'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="text-xs text-muted-foreground space-y-1 mt-4">
          <p><strong>TOTP Code:</strong> Use your authenticator app to generate a 6-digit code.</p>
          <p><strong>Backup Code:</strong> Use one of your backup codes if you can&#39;t access your authenticator.</p>
          <p><strong>Security:</strong> Each backup code can only be used once.</p>
        </div>
      </CardContent>
    </Card>
  );
} 