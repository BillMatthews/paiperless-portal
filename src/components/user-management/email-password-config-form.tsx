'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Mail, Lock, Eye, EyeOff, Info, Shield, RefreshCw } from 'lucide-react';
import { PasswordStrength } from '@/components/ui/password-strength';
import { validatePasswordStrength } from '@/lib/schemas/user-creation-validation';
import { generateStrongPassword } from '@/lib/utils/password-utils';

interface EmailPasswordConfigFormProps {
  temporaryPassword: string;
  onTemporaryPasswordChange: (password: string) => void;
  mfaEnabled: boolean;
  onMfaEnabledChange: (enabled: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function EmailPasswordConfigForm({
  temporaryPassword,
  onTemporaryPasswordChange,
  mfaEnabled,
  onMfaEnabledChange,
  disabled = false,
  className = ''
}: EmailPasswordConfigFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [hasBeenValidated, setHasBeenValidated] = useState(false);

  const passwordValidation = validatePasswordStrength(temporaryPassword);
  const showValidation = hasBeenValidated || temporaryPassword.length > 0;

  const handlePasswordChange = (value: string) => {
    onTemporaryPasswordChange(value);
    if (value.length > 0) {
      setHasBeenValidated(true);
    }
  };

  const generateRandomPassword = () => {
   const password = generateStrongPassword(12);
    
    onTemporaryPasswordChange(password);
    setHasBeenValidated(true);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Mail className="h-5 w-5" />
          <span>Email & Password Configuration</span>
          <Badge variant="secondary" className="text-xs">Traditional</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Temporary Password */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="temporary-password" className="text-sm font-medium">
                Temporary Password *
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateRandomPassword}
                disabled={disabled}
                className="h-7 px-2 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Generate
              </Button>
            </div>
            
            <div className="relative">
              <Input
                id="temporary-password"
                type={showPassword ? 'text' : 'password'}
                value={temporaryPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Enter temporary password"
                className={`font-mono ${
                  showValidation && temporaryPassword.length > 0
                    ? passwordValidation.isValid
                      ? 'border-green-500 focus:border-green-500'
                      : 'border-red-500 focus:border-red-500'
                    : ''
                }`}
                disabled={disabled}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={disabled}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {/* Password Strength Indicator */}
            {temporaryPassword && (
              <PasswordStrength 
                password={temporaryPassword} 
                showFeedback={true}
                className="mt-2"
              />
            )}

            {/* Help Text */}
            <p className="text-xs text-muted-foreground">
              Set a strong temporary password for the user. They will be required to change this 
              on their first login for security purposes.
            </p>
          </div>
        </div>

        {/* MFA Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Multi-Factor Authentication</Label>
              <p className="text-xs text-muted-foreground">
                Enable MFA for enhanced security using authenticator apps
              </p>
            </div>
            <Switch
              checked={mfaEnabled}
              onCheckedChange={onMfaEnabledChange}
              disabled={disabled}
            />
          </div>

          {/* MFA Information */}
          <Alert className={mfaEnabled ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}>
            <Shield className={`h-4 w-4 ${mfaEnabled ? 'text-green-600' : 'text-blue-600'}`} />
            <AlertDescription className={`text-xs ${mfaEnabled ? 'text-green-800' : 'text-blue-800'}`}>
              {mfaEnabled ? (
                <>
                  <strong>MFA Enabled:</strong> User will be required to set up an authenticator app 
                  (like Google Authenticator or Authy) during their first login. This provides an 
                  additional layer of security beyond their password.
                </>
              ) : (
                <>
                  <strong>MFA Disabled:</strong> User can optionally enable MFA later through their 
                  account settings. We recommend enabling MFA for enhanced security.
                </>
              )}
            </AlertDescription>
          </Alert>
        </div>

        {/* Security Information */}
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Email/Password Security:</strong> Users will authenticate with their email and password. 
            The temporary password must be changed on first login. MFA can be enabled for additional 
            security using authenticator apps.
          </AlertDescription>
        </Alert>

        {/* Password Requirements */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Password Requirements:</h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li className="flex items-center space-x-2">
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <span>Minimum 8 characters long</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <span>At least one uppercase letter (A-Z)</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <span>At least one lowercase letter (a-z)</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <span>At least one number (0-9)</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <span>At least one special character (!@#$%^&*(),.?":{}|&lt;&gt;)</span>
            </li>
          </ul>
        </div>

        {/* User Experience Information */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">User Experience:</h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li className="flex items-center space-x-2">
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <span>User will receive an invitation email with login instructions</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <span>First login will require password change for security</span>
            </li>
            {mfaEnabled && (
              <li className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                <span>User will be prompted to set up MFA during first login</span>
              </li>
            )}
            <li className="flex items-center space-x-2">
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <span>Password recovery options available via email</span>
            </li>
          </ul>
        </div>

        {/* Security Recommendations */}
        <Alert className="border-yellow-200 bg-yellow-50">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-xs text-yellow-800">
            <strong>Security Recommendations:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Use the &#34;Generate&#34; button to create a strong random password</li>
              <li>• Enable MFA for users handling sensitive data</li>
              <li>• Communicate the temporary password securely to the user</li>
              <li>• Remind users to change their password on first login</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
} 