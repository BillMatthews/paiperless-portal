'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

import Link from 'next/link';

interface EmailLoginProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onMfaRequired?: (userId: string, mfaSetupRequired: boolean) => void;
  onPasswordResetRequired?: (email: string) => void;
  disabled?: boolean;
  className?: string;
}

export function EmailLogin({ 
  onSuccess, 
  onError, 
  onMfaRequired,
  onPasswordResetRequired,
  disabled = false, 
  className = '' 
}: EmailLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');

      if (!email || !password) {
        const errorMessage = 'Please enter both email and password.';
        setError(errorMessage);
        onError?.(errorMessage);
        return;
      }

      // Go straight to NextAuth signIn - no pre-validation API call
      const result = await signIn('email-password', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Check if this is an MFA requirement error
        if (result.error.startsWith('MFA_REQUIRED:')) {
          // Parse the MFA requirement error
          const [, userId, mfaSetupRequired] = result.error.split(':');
          console.log("MFA required for user:", userId, "setup required:", mfaSetupRequired);
          
          // Trigger the MFA flow
          onMfaRequired?.(userId, mfaSetupRequired === 'true');
          return;
        }
        
        const errorMessage = 'Authentication failed. Please try again.';
        setError(errorMessage);
        onError?.(errorMessage);
        toast.error(errorMessage);
        return;
      }

      toast.success('Sign in successful');
      onSuccess?.();

    } catch (err) {
      const errorMessage = 'An error occurred while logging in. Please try again.';
      setError(errorMessage);
      onError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="h-5 w-5" />
          <span>Email & Password</span>
        </CardTitle>
        <CardDescription>
          Sign in with your email address and password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              disabled={disabled || loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={disabled || loading}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={disabled}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={disabled || loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>

          <div className="text-center">
            <Link 
              href="/forgot-password" 
              className="text-sm text-primary hover:underline"
            >
              Forgot your password?
            </Link>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Security:</strong> Your credentials are encrypted and securely transmitted.</p>
            <p><strong>MFA:</strong> If enabled, you may be prompted for additional verification.</p>
            <p><strong>Recovery:</strong> Use the forgot password link if you need to reset your password.</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 