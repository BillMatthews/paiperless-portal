"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccountStatusBadge } from "@/components/customer-accounts/account-status-badge";
import { AccountDetailsDto, AccountStatus } from "@/lib/types/accounts.types";
import {updateAccountStatus} from "@/lib/actions/accounts.actions";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface AccountDetailClientProps {
  account: AccountDetailsDto;
}

export function AccountDetailClient({ account }: AccountDetailClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<AccountStatus>(account.status);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (status === account.status) {
      return; // No changes to save
    }

    setIsSaving(true);
    setError(null);

    try {
      await updateAccountStatus(account.id, { status });
      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Error updating account:', error);
      setError('Failed to update account status. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = status !== account.status;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/customer-accounts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{account.accountName}</h1>
            <p className="text-muted-foreground">Account Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pr-8">
          <AccountStatusBadge status={account.status} />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Status Management */}
      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
          <CardDescription>Update the account status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Select value={status} onValueChange={(value) => setStatus(value as AccountStatus)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AccountStatus.ACTIVE}>Active</SelectItem>
                <SelectItem value={AccountStatus.SUSPENDED}>Suspended</SelectItem>
                <SelectItem value={AccountStatus.UNDER_REVIEW}>Under Review</SelectItem>
                <SelectItem value={AccountStatus.CLOSED}>Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !hasChanges}
              size="sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Basic account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Account Name</Label>
              <p className="text-sm">{account.accountName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Wallet Address</Label>
              <p className="text-sm font-mono bg-muted p-2 rounded text-xs break-all">
                {account.walletAddress}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                <p className="text-sm">{formatDistanceToNow(new Date(account.createdAt), { addSuffix: true })}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                <p className="text-sm">{formatDistanceToNow(new Date(account.updatedAt), { addSuffix: true })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Company details and address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Company Name</Label>
              <p className="text-sm">{account.company.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Website</Label>
              <p className="text-sm">
                <a 
                  href={account.company.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {account.company.website}
                </a>
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Address</Label>
              <div className="text-sm space-y-1">
                <p>{account.company.address.street}</p>
                <p>
                  {account.company.address.city}
                  {account.company.address.state && `, ${account.company.address.state}`}
                  {account.company.address.postalCode && ` ${account.company.address.postalCode}`}
                </p>
                <p>{account.company.address.country}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Primary contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Contact Name</Label>
              <p className="text-sm">{account.contact.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Position</Label>
              <p className="text-sm">{account.contact.position}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
              <p className="text-sm">
                <a 
                  href={`mailto:${account.contact.emailAddress}`}
                  className="text-blue-600 hover:underline"
                >
                  {account.contact.emailAddress}
                </a>
              </p>
            </div>
            {account.contact.phone && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                <p className="text-sm">
                  <a 
                    href={`tel:${account.contact.phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {account.contact.phone}
                  </a>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 