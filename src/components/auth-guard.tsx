'use client';

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface AuthGuardProps {
  children: React.ReactNode;
  appLayout: React.ReactNode;
}

export function AuthGuard({ children, appLayout }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/login') {
      if (status === "authenticated") {
        // If user is already logged in, redirect to home
        router.push('/');
        return;
      }
      setIsLoading(false);
      return;
    }

    // For all other routes, require authentication
    if (status === "unauthenticated") {
      // If user is not authenticated, redirect to login
      router.push('/login');
      return;
    }
    
    if (status === "authenticated") {
      setIsLoading(false);
      return;
    }
  }, [status, session, router, pathname]);

  // Show loading state
  if (isLoading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For login page, show only the login component without app layout
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // For all other routes, show the app layout (which includes sidebar and theme toggle)
  return <>{appLayout}</>;
}
