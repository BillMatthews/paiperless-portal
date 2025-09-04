'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Info, Shield, Wallet, Mail, Lock } from 'lucide-react';
import { AuthMethod } from '@/lib/schemas/user-creation-validation';

interface AuthMethodSelectorProps {
  value: AuthMethod;
  onChange: (value: AuthMethod) => void;
  disabled?: boolean;
  className?: string;
}

interface AuthMethodOption {
  value: AuthMethod;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  features: string[];
  securityLevel: 'high' | 'medium';
}

const authMethodOptions: AuthMethodOption[] = [
  {
    value: 'siwe',
    title: 'Sign-In with Ethereum (SIWE)',
    description: 'Web3 wallet-based authentication using blockchain technology',
    icon: <Wallet className="h-5 w-5" />,
    badge: 'Web3',
    badgeVariant: 'default',
    features: [
      'No password required',
      'Cryptographic security',
      'Decentralized identity',
      'No MFA needed'
    ],
    securityLevel: 'high'
  },
  {
    value: 'email-password',
    title: 'Email & Password',
    description: 'Traditional email and password authentication with optional MFA',
    icon: <Mail className="h-5 w-5" />,
    badge: 'Traditional',
    badgeVariant: 'secondary',
    features: [
      'Familiar login experience',
      'Optional MFA support',
      'Password recovery options',
      'Email verification'
    ],
    securityLevel: 'medium'
  }
];

export function AuthMethodSelector({ 
  value, 
  onChange, 
  disabled = false, 
  className = '' 
}: AuthMethodSelectorProps) {
  const [hoveredMethod, setHoveredMethod] = useState<AuthMethod | null>(null);

  const getSecurityIcon = (level: 'high' | 'medium') => {
    return level === 'high' ? (
      <Shield className="h-4 w-4 text-green-600" />
    ) : (
      <Lock className="h-4 w-4 text-blue-600" />
    );
  };

  const getSecurityText = (level: 'high' | 'medium') => {
    return level === 'high' ? 'High Security' : 'Standard Security';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label className="text-base font-medium">Authentication Method</Label>
        <p className="text-sm text-muted-foreground">
          Choose how this user will authenticate to the system
        </p>
      </div>

      <RadioGroup
        value={value}
        onValueChange={(newValue) => onChange(newValue as AuthMethod)}
        disabled={disabled}
        className="space-y-3"
      >
        {authMethodOptions.map((option) => (
          <Card
            key={option.value}
            className={`relative cursor-pointer transition-all duration-200 ${
              value === option.value
                ? 'ring-2 ring-primary border-primary'
                : 'hover:border-muted-foreground/50'
            } ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onMouseEnter={() => !disabled && setHoveredMethod(option.value)}
            onMouseLeave={() => setHoveredMethod(null)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                  className="mt-1"
                />
                
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="text-muted-foreground">
                        {option.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">
                          {option.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={option.badgeVariant} className="text-xs">
                        {option.badge}
                      </Badge>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        {getSecurityIcon(option.securityLevel)}
                        <span>{getSecurityText(option.securityLevel)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Features:
                    </p>
                    <ul className="space-y-1">
                      {option.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Additional Info */}
                  {hoveredMethod === option.value && (
                    <div className="pt-2 border-t border-muted/50">
                      <div className="flex items-start space-x-2 text-xs text-muted-foreground">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <div>
                          {option.value === 'siwe' ? (
                            <p>
                              User will need to provide a valid Ethereum wallet address. 
                              They will authenticate by signing messages with their wallet.
                            </p>
                          ) : (
                            <p>
                              User will receive a temporary password and can optionally enable 
                              Multi-Factor Authentication for enhanced security.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </RadioGroup>

      {/* Help Text */}
      <div className="flex items-start space-x-2 p-3 bg-muted/50 rounded-md">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-1">Authentication Method Selection</p>
          <p>
            <strong>SIWE:</strong> Best for users familiar with Web3 wallets and blockchain technology. 
            Provides high security through cryptographic signatures.
          </p>
          <p className="mt-1">
            <strong>Email/Password:</strong> Best for users who prefer traditional authentication. 
            Can be enhanced with Multi-Factor Authentication for additional security.
          </p>
        </div>
      </div>
    </div>
  );
} 