'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  getAccountUserDetails,
  updateNonProtectedAccountUserDetails
} from '@/lib/actions/account-users.actions';
import { AccountUserDetails, AccountUserStatus } from '@/lib/types/account-user.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
});

type FormData = z.infer<typeof formSchema>;

export function UserSettingsForm() {
  const [accountDetails, setAccountDetails] = useState<AccountUserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    loadAccountDetails();
  }, []);

  const loadAccountDetails = async () => {
    try {
      const result = await getAccountUserDetails();
      if (result.success && result.data) {
        setAccountDetails(result.data);
        form.reset({
          name: result.data.name,
        });
      } else {
        toast.error('Failed to load account details');
      }
    } catch (error) {
      console.error('Error loading account details:', error);
      toast.error('Failed to load account details');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      const result = await updateNonProtectedAccountUserDetails(data);
      if (result.success && result.data) {
        setAccountDetails(result.data);
        toast.success('Account details updated successfully');
      } else {
        toast.error('Failed to update account details');
      }
    } catch (error) {
      console.error('Error updating account details:', error);
      toast.error('Failed to update account details');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadgeVariant = (status: AccountUserStatus) => {
    switch (status) {
      case AccountUserStatus.ACTIVE:
        return 'success';
      case AccountUserStatus.SUSPENDED:
        return 'destructive';
      case AccountUserStatus.UNDER_REVIEW:
        return 'warning';
      case AccountUserStatus.DELETED:
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading account details...</p>
        </div>
      </div>
    );
  }

  if (!accountDetails) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Unable to load account details. Please try refreshing the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            View and update your account settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Editable Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Editable Information</h3>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Read-only Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Account Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Email Address</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {accountDetails.emailAddress}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Account Status</Label>
                    <div className="mt-1">
                      <Badge variant={getStatusBadgeVariant(accountDetails.status)}>
                        {accountDetails.status}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Wallet Address</Label>
                    <p className="text-sm text-muted-foreground mt-1 font-mono">
                      {accountDetails.walletAddress}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Permissions</Label>
                    <div className="mt-2 space-y-2">
                      {accountDetails.permissions?.length > 0 ? (
                        accountDetails.permissions.map((permission, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Badge variant="outline">
                              {permission.module} - {permission.role}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No permissions assigned
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}