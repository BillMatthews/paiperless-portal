'use client';

import {State, WagmiProvider} from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import {wagmiConfig} from "@/config/web3-config";
import { SessionProvider } from "next-auth/react"
import { PermissionsProvider } from "@/contexts/permissions.context";

const queryClient = new QueryClient();

function Web3ModalProvider({ children }: { children: React.ReactNode }) {
  return (
      <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </WagmiProvider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Web3ModalProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          <PermissionsProvider>
            {children}
            <Toaster />
          </PermissionsProvider>
        </ThemeProvider>
      </Web3ModalProvider>
    </SessionProvider>
  );
}