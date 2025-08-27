'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wallet, Mail, Shield, Lock, Info } from 'lucide-react';
import { AuthMethod } from '@/lib/types/authentication.types';

interface AuthMethodSelectorProps {
  value: AuthMethod;
  onChange: (value: AuthMethod) => void;
  disabled?: boolean;
  className?: string;
}

export function AuthMethodSelector({ 
  value, 
  onChange, 
  disabled = false, 
  className = '' 
}: AuthMethodSelectorProps) {
  const authMethods = [
    {
      value: 'siwe' as AuthMethod,
      title: 'Sign-In with Ethereum (SIWE)',
      description: 'Web3 wallet-based authentication using blockchain technology',
      features: [
        'No password required',
        'Cryptographic security',
        'Decentralized identity',
        'No MFA needed (wallet provides security)'
      ],
      badge: 'Web3',
      securityLevel: 'High Security',
      icon: Wallet,
      helpText: 'SIWE: User will need to provide a valid Ethereum wallet address and sign a message to authenticate. This method provides the highest level of security through cryptographic signatures.'
    },
    {
      value: 'email-password' as AuthMethod,
      title: 'Email & Password',
      description: 'Traditional email and password authentication with optional MFA',
      features: [
        'Familiar login experience',
        'Optional MFA support',
        'Password recovery options',
        'Email verification'
      ],
      badge: 'Traditional',
      securityLevel: 'Standard Security',
      icon: Mail,
      helpText: 'Email/Password: User will receive a temporary password and can optionally enable MFA for enhanced security. This method provides a familiar authentication experience.'
    }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label className="text-base font-semibold">Authentication Method</Label>
        <p className="text-sm text-muted-foreground">
          Choose how you want to authenticate to your account
        </p>
      </div>

      <RadioGroup
        value={value}
        onValueChange={(newValue) => onChange(newValue as AuthMethod)}
        disabled={disabled}
        className="space-y-3"
      >
        {authMethods.map((method) => {
          const IconComponent = method.icon;
          return (
            <TooltipProvider key={method.value}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      value === method.value 
                        ? 'ring-2 ring-primary border-primary' 
                        : 'border-border hover:border-primary/50'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem
                          value={method.value}
                          id={method.value}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <IconComponent className="h-5 w-5 text-primary" />
                              <Label 
                                htmlFor={method.value}
                                className="text-base font-medium cursor-pointer"
                              >
                                {method.title}
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="text-xs">
                                {method.badge}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {method.securityLevel}
                              </Badge>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {method.description}
                          </p>
                          
                          <div className="space-y-1">
                            {method.features.map((feature, index) => (
                              <div key={index} className="flex items-center space-x-2 text-sm">
                                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                <span className="text-muted-foreground">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Info className="h-4 w-4" />
                      <span className="font-medium">Authentication Method Selection</span>
                    </div>
                    <p className="text-sm">{method.helpText}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </RadioGroup>

      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>SIWE:</strong> Best for users familiar with Web3 wallets and blockchain technology</p>
        <p><strong>Email/Password:</strong> Best for users who prefer traditional authentication</p>
      </div>
    </div>
  );
} 