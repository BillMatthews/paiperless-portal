'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, CheckCircle, XCircle, Info, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validateEthereumAddress } from '@/lib/schemas/user-creation-validation';

interface SiweConfigFormProps {
  walletAddress: string;
  onWalletAddressChange: (address: string) => void;
  disabled?: boolean;
  className?: string;
}

export function SiweConfigForm({ 
  walletAddress, 
  onWalletAddressChange, 
  disabled = false, 
  className = '' 
}: SiweConfigFormProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [hasBeenValidated, setHasBeenValidated] = useState(false);

  const isValid = validateEthereumAddress(walletAddress);
  const showValidation = hasBeenValidated || walletAddress.length > 0;

  const handleWalletAddressChange = (value: string) => {
    onWalletAddressChange(value);
    if (value.length > 0) {
      setHasBeenValidated(true);
    }
  };

  const handleCopyExample = () => {
    navigator.clipboard.writeText('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
  };

  const formatWalletAddress = (address: string) => {
    if (address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Wallet className="h-5 w-5" />
          <span>SIWE Configuration</span>
          <Badge variant="default" className="text-xs">Web3</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet Address Input */}
        <div className="space-y-2">
          <Label htmlFor="wallet-address" className="text-sm font-medium">
            Ethereum Wallet Address *
          </Label>
          <div className="relative">
            <Input
              id="wallet-address"
              value={walletAddress}
              onChange={(e) => handleWalletAddressChange(e.target.value)}
              placeholder="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
              className={`font-mono ${
                showValidation && walletAddress.length > 0
                  ? isValid
                    ? 'border-green-500 focus:border-green-500'
                    : 'border-red-500 focus:border-red-500'
                  : ''
              }`}
              disabled={disabled}
            />
            {showValidation && walletAddress.length > 0 && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            )}
          </div>
          
          {/* Validation Message */}
          {showValidation && walletAddress.length > 0 && (
            <div className="flex items-center space-x-2 text-xs">
              {isValid ? (
                <>
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">Valid Ethereum address</span>
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 text-red-500" />
                  <span className="text-red-600">Invalid Ethereum address format</span>
                </>
              )}
            </div>
          )}

          {/* Help Text */}
          <p className="text-xs text-muted-foreground">
            Enter the user&#39;s Ethereum wallet address. This will be used for Sign-In with Ethereum authentication.
          </p>
        </div>

        {/* Example Address */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Example format:</span>
          </div>
          <div className="flex items-center space-x-2">
            <code className="text-xs font-mono bg-background px-2 py-1 rounded">
              {formatWalletAddress('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopyExample}
              className="h-6 px-2"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Security Information */}
        <Alert>
          <Wallet className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>SIWE Security:</strong> Users will authenticate by signing messages with their wallet. 
            No password is required, and the wallet address serves as their unique identifier. 
            This provides cryptographic security through blockchain technology.
          </AlertDescription>
        </Alert>

        {/* Requirements */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Requirements:</h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li className="flex items-center space-x-2">
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <span>Must start with "0x"</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <span>Must be exactly 42 characters long</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <span>Must contain only hexadecimal characters (0-9, a-f, A-F)</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <span>Must be a valid Ethereum address format</span>
            </li>
          </ul>
        </div>

        {/* MFA Notice */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-xs text-blue-800">
            <strong>Note:</strong> Multi-Factor Authentication is not applicable for SIWE users. 
            The cryptographic signature from their wallet provides the necessary security.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
} 