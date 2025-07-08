"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Account detail error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <AlertTriangle className="h-16 w-16 text-amber-500" />
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground text-center max-w-md">
        We encountered an error while loading the account details. Please try again.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        <Button asChild>
          <Link href="/customer-accounts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Accounts
          </Link>
        </Button>
      </div>
    </div>
  );
} 