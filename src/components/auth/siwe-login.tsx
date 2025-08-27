'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useSignMessage, useDisconnect } from 'wagmi';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, Shield, AlertCircle } from 'lucide-react';
import { ChainId } from '@/constants/chain-info.constants';
import { getNonce } from '@/lib/actions/nextauth.actions';
import { SiweMessage } from 'siwe';
import { truncateMiddle } from '@/lib/utils/text-utils';

interface SiweLoginProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export function SiweLogin({ 
  onSuccess, 
  onError, 
  disabled = false, 
  className = '' 
}: SiweLoginProps) {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Update wallet address when connected
  useEffect(() => {
    if (isConnected) {
      setWalletAddress(address || "");
    }
  }, [isConnected, address]);

  const handleConnect = async (connector: any) => {
    try {
      setError("");
      connect({
        connector,
        chainId: ChainId.Stability
      });
    } catch (err) {
      const errorMessage = "Failed to connect wallet. Please try again.";
      setError(errorMessage);
      onError?.(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      if (!walletAddress) {
        const errorMessage = "Please connect your wallet.";
        setError(errorMessage);
        onError?.(errorMessage);
        setLoading(false);
        return;
      }

      const nonce = await getNonce(walletAddress);
      const domain = window.location.host;

      // Set timestamps for message validity
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

      const siweMessage = new SiweMessage({
        domain,
        address: walletAddress,
        statement: `Sign in to ${domain} to access Paiperless. (Valid from ${now.toISOString()} to ${expiresAt.toISOString()})`,
        uri: window.location.origin,
        version: "1",
        chainId: ChainId.Stability,
        nonce,
        notBefore: now.toISOString(),
        expirationTime: expiresAt.toISOString()
      });

      const messageToSign = siweMessage.prepareMessage();
      let signature;
      
      try {
        signature = await signMessageAsync({ message: messageToSign });
      } catch (error) {
        const signError = error as { code?: number };
        console.log("Sign Error: ", JSON.stringify(error));
        
        let errorMessage = "Failed to sign message. Please try again.";
        if (signError.code === 4001) {
          errorMessage = "You declined to sign the message. Please try again.";
        }
        
        setError(errorMessage);
        onError?.(errorMessage);
        toast.error(errorMessage);
        return;
      }

      try {
        // Use NextAuth signIn
        const result = await signIn("siwe", {
          message: messageToSign,
          signature: signature,
          walletAddress: walletAddress,
          redirect: false,
        });
        
        console.log("SignIn result:", result);
        
        if (result?.error) {
          console.error("SignIn error:", result.error);
          const errorMessage = "Authentication failed. Please try again.";
          setError(errorMessage);
          onError?.(errorMessage);
          toast.error(errorMessage);
          return;
        }
       
        toast.success("Sign in successful");
        onSuccess?.();
        
      } catch (error) {
        // Check if it's a Next.js redirect
        if (error && typeof error === 'object' && 'digest' in error && 
            String(error.digest).startsWith('NEXT_REDIRECT')) {
          // This is a successful redirect, not an error
          return;
        }
        
        const errorMessage = "Authentication failed. Please try again.";
        setError(errorMessage);
        onError?.(errorMessage);
        toast.error(errorMessage);
      }

    } catch (err) {
      const errorMessage = "An error occurred while logging in. Please try again.";
      setError(errorMessage);
      onError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    try {
      disconnect();
      setWalletAddress("");
      setError("");
      toast.success("Wallet disconnected successfully");
    } catch (err) {
      const errorMessage = "Failed to disconnect wallet. Please try again.";
      setError(errorMessage);
      onError?.(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wallet className="h-5 w-5" />
          <span>Sign-In with Ethereum (SIWE)</span>
        </CardTitle>
        <CardDescription>
          Connect your wallet to sign in using blockchain technology
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Wallet Address</Label>
          <Input
            value={walletAddress ? truncateMiddle(walletAddress) : ""}
            readOnly
            placeholder="Connect your wallet"
            className="font-mono"
            disabled={disabled}
          />
        </div>

        {!isConnected && (
          <div className="space-y-2">
            <Label>Available Wallets</Label>
            <div className="flex flex-col gap-2">
              {connectors.map((connector) => (
                <Button
                  key={connector.uid}
                  onClick={() => handleConnect(connector)}
                  className="w-full"
                  disabled={disabled}
                >
                  Connect {connector.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {isConnected && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            </div>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleLogin} 
                disabled={loading || disabled} 
                className="w-full"
              >
                {loading ? "Signing In..." : "Login with SIWE"}
              </Button>
              <Button 
                onClick={handleDisconnect} 
                variant="outline" 
                className="w-full"
                disabled={disabled}
              >
                Disconnect Wallet
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 text-red-500 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Security:</strong> Your wallet will prompt you to sign a message to verify your identity.</p>
          <p><strong>Privacy:</strong> No personal data is stored on the blockchain.</p>
          <p><strong>Chain:</strong> Currently supports Stability network.</p>
        </div>
      </CardContent>
    </Card>
  );
} 