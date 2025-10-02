import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserX } from "lucide-react";

export default function AccountNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <UserX className="h-16 w-16 text-muted-foreground" />
      <h1 className="text-2xl font-bold">Account Not Found</h1>
      <p className="text-muted-foreground text-center max-w-md">
        The account you&apos;re looking for doesn&apos;t exist or may have been removed.
      </p>
      <Button asChild>
        <Link href="/customer-accounts">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Accounts
        </Link>
      </Button>
    </div>
  );
} 