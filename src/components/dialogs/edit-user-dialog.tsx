'use client';

import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { Loader2, Plus, X, Key, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AccountUserDetails, AccountUserStatus, PermissionCombination, ModuleDetails, RoleDetails, AuthMethod } from "@/lib/types/account-user.types";
import { updateOtherAccountUser, getValidPermissionsCombinations, getModules, getRoles } from "@/lib/actions/account-users.actions";
import { adminForcedPasswordReset } from "@/lib/actions/password.actions";

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AccountUserDetails | null;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  emailAddress: string;
  walletAddress: string;
  status: AccountUserStatus;
  permissions: PermissionCombination[];
}

interface PasswordResetData {
  reason: string;
  sendEmail: boolean;
}

export function EditUserDialog({ open, onOpenChange, user, onSuccess }: EditUserDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    emailAddress: '',
    walletAddress: '',
    status: AccountUserStatus.ACTIVE,
    permissions: []
  });
  const [passwordResetData, setPasswordResetData] = useState<PasswordResetData>({
    reason: '',
    sendEmail: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [validCombinations, setValidCombinations] = useState<PermissionCombination[]>([]);
  const [modules, setModules] = useState<ModuleDetails[]>([]);
  const [roles, setRoles] = useState<RoleDetails[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [showPasswordResetForm, setShowPasswordResetForm] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        emailAddress: user.emailAddress,
        walletAddress: user.walletAddress || '',
        status: user.status as AccountUserStatus,
        permissions: user.permissions || []
      });
    }
  }, [user]);

  useEffect(() => {
    if (open) {
      loadPermissionsData();
      setShowPasswordResetForm(false);
      setPasswordResetData({
        reason: '',
        sendEmail: true
      });
    }
  }, [open]);

  const loadPermissionsData = async () => {
    setIsLoadingPermissions(true);
    try {
      const [combinationsResult, modulesResult, rolesResult] = await Promise.all([
        getValidPermissionsCombinations(),
        getModules(),
        getRoles()
      ]);

      if (combinationsResult.success) {
        setValidCombinations(combinationsResult.data);
      }
      if (modulesResult.success) {
        setModules(modulesResult.data);
      }
      if (rolesResult.success) {
        setRoles(rolesResult.data);
      }
    } catch (error) {
      console.error('Error loading permissions data:', error);
      toast.error('Failed to load permissions data');
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  // Get available roles for a selected module
  const getAvailableRolesForModule = (moduleId: string) => {
    const validRolesForModule = validCombinations
      .filter(combo => combo.module === moduleId)
      .map(combo => combo.role);
    
    return roles.filter(role => validRolesForModule.includes(role.id));
  };

  // Check if a module-role combination is valid
  const isValidCombination = (moduleId: string, roleId: string) => {
    return validCombinations.some(combo => 
      combo.module === moduleId && combo.role === roleId
    );
  };

  const getCombinationDescription = (moduleId: string, roleId: string) => {
    return (
      validCombinations.find(c => c.module === moduleId && c.role === roleId)?.description || ''
    );
  };

  const splitCapabilities = (description: string) => {
    return description.split('.').map(s => s.trim()).filter(Boolean);
  };

  // Handle module selection - reset role selection if current role is not valid for new module
  const handleModuleChange = (moduleId: string) => {
    setSelectedModule(moduleId);
    const availableRoles = getAvailableRolesForModule(moduleId);
    const currentRoleValid = availableRoles.some(role => role.id === selectedRole);
    
    if (!currentRoleValid) {
      setSelectedRole('');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('No user selected');
      return;
    }

    if (!user.id) {
      toast.error('Invalid user data: missing user ID');
      return;
    }

    // Validate wallet address for SIWE users
    if (user.authMethod === 'siwe' && !formData.walletAddress.trim()) {
      toast.error('Wallet address is required for SIWE users');
      return;
    }
    
    setIsSaving(true);
    try {
      const result = await updateOtherAccountUser(user.id, {
        name: formData.name,
        emailAddress: formData.emailAddress,
        authMethod: user.authMethod as AuthMethod,
        walletAddress: user.authMethod === 'siwe' ? formData.walletAddress : undefined,
        status: formData.status,
        permissions: formData.permissions.map(p => ({
          module: p.module as any, // Cast to match the expected type
          role: p.role as any,     // Cast to match the expected type
          description: p.description
        }))
      });
      
      if (result.success) {
        toast.success(`Updated user ${formData.name}`);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error('Failed to update user');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error updating user:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user) {
      toast.error('No user selected');
      return;
    }

    if (!passwordResetData.reason.trim()) {
      toast.error('Please provide a reason for the password reset');
      return;
    }

    setIsResettingPassword(true);
    try {
      const result = await adminForcedPasswordReset(
        user.emailAddress,
        passwordResetData.reason,
        passwordResetData.sendEmail
      );
      
      if (result.success) {
        toast.success(result.message || 'Password reset initiated successfully');
        setShowPasswordResetForm(false);
        setPasswordResetData({
          reason: '',
          sendEmail: true
        });
      } else {
        toast.error(result.error || 'Failed to initiate password reset');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error forcing password reset:', error);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const addPermission = () => {
    if (selectedModule && selectedRole) {
      // Double-check that this is a valid combination
      if (!isValidCombination(selectedModule, selectedRole)) {
        toast.error('This module-role combination is not valid');
        return;
      }

      const newPermission: PermissionCombination = {
        module: selectedModule,
        role: selectedRole,
        description: getCombinationDescription(selectedModule, selectedRole)
      };
      
      // Check if this combination already exists
      const exists = formData.permissions.some(
        p => p.module === selectedModule && p.role === selectedRole
      );
      
      if (!exists) {
        setFormData(prev => ({
          ...prev,
          permissions: [...prev.permissions, newPermission]
        }));
        setSelectedModule('');
        setSelectedRole('');
      } else {
        toast.error('This permission combination already exists');
      }
    } else {
      toast.error('Please select both module and role');
    }
  };

  const removePermission = (index: number) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.filter((_, i) => i !== index)
    }));
  };

  const getModuleName = (moduleId: string) => {
    const appModule = modules.find(m => m.id === moduleId);
    return appModule?.name || moduleId;
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role?.name || roleId;
  };

  const getStatusBadgeVariant = (status: AccountUserStatus) => {
    switch (status) {
      case AccountUserStatus.ACTIVE:
        return 'default';
      case AccountUserStatus.SUSPENDED:
        return 'destructive';
      case AccountUserStatus.UNDER_REVIEW:
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getAuthMethodDisplay = (authMethod: string) => {
    switch (authMethod) {
      case 'siwe':
        return 'Web3 (SIWE)';
      case 'email-password':
        return 'Email/Password';
      default:
        return authMethod;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleEdit}>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update the user information and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              {/* Authentication Method Display */}
              <div className="space-y-2">
                <Label>Authentication Method</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {getAuthMethodDisplay(user.authMethod)}
                  </Badge>
                  {user.authMethod === 'siwe' && (
                    <span className="text-xs text-muted-foreground">
                      Uses wallet-based authentication
                    </span>
                  )}
                  {user.authMethod === 'email-password' && (
                    <span className="text-xs text-muted-foreground">
                      Uses traditional email/password authentication
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      name: e.target.value
                    }))}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      status: value as AccountUserStatus
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(AccountUserStatus)
                        .filter(status => status !== AccountUserStatus.DELETED)
                        .map((status) => (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center gap-2">
                              <Badge variant={getStatusBadgeVariant(status)}>
                                {status}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.emailAddress}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    emailAddress: e.target.value
                  }))}
                  placeholder="Enter email address"
                  required
                />
              </div>
              
              {/* Conditional Wallet Address Field */}
              {user.authMethod === 'siwe' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-wallet">Wallet Address *</Label>
                  <Input
                    id="edit-wallet"
                    value={formData.walletAddress}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      walletAddress: e.target.value
                    }))}
                    placeholder="Enter wallet address"
                    required
                  />
                </div>
              )}
            </div>

            {/* Password Reset Section for Email/Password Users */}
            {user.authMethod === 'email-password' && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Password Management</h3>
                  
                  {!showPasswordResetForm ? (
                    <div className="space-y-4">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          You can force a password reset for this user. This will require them to set a new password on their next login.
                        </AlertDescription>
                      </Alert>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPasswordResetForm(true)}
                        className="w-full"
                      >
                        <Key className="mr-2 h-4 w-4" />
                        Force Password Reset
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                      <div className="space-y-2">
                        <Label htmlFor="reset-reason">Reason for Reset *</Label>
                        <Textarea
                          id="reset-reason"
                          value={passwordResetData.reason}
                          onChange={(e) => setPasswordResetData(prev => ({
                            ...prev,
                            reason: e.target.value
                          }))}
                          placeholder="Enter reason for password reset (e.g., security concern, user request)"
                          required
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="send-email"
                          checked={passwordResetData.sendEmail}
                          onCheckedChange={(checked) => setPasswordResetData(prev => ({
                            ...prev,
                            sendEmail: checked
                          }))}
                        />
                        <Label htmlFor="send-email">Send email notification to user</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowPasswordResetForm(false);
                            setPasswordResetData({
                              reason: '',
                              sendEmail: true
                            });
                          }}
                          disabled={isResettingPassword}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={handlePasswordReset}
                          disabled={isResettingPassword || !passwordResetData.reason.trim()}
                        >
                          {isResettingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <Key className="mr-2 h-4 w-4" />
                          Force Password Reset
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator />

            {/* Permissions */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Permissions</h3>
              
              {/* Current Permissions */}
              <div className="space-y-2">
                <Label>Current Permissions</Label>
                {formData.permissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No permissions assigned</p>
                ) : (
                  <TooltipProvider>
                    <div className="flex flex-wrap gap-2">
                      {formData.permissions.map((permission, index) => {
                        const description = permission.description || getCombinationDescription(permission.module, permission.role);
                        const capabilities = splitCapabilities(description);
                        return (
                          <Tooltip key={`${permission.module}-${permission.role}-${index}`}>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="flex items-center gap-1">
                                {getModuleName(permission.module)} - {getRoleName(permission.role)}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto p-0 ml-1"
                                  onClick={() => removePermission(index)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            </TooltipTrigger>
                            {description && (
                              <TooltipContent side="top" align="center" className="max-w-[min(80vw,32rem)] text-left break-words">
                                <div className="max-w-xs">
                                  {capabilities.length > 1 ? (
                                    <ul className="list-disc pl-4 space-y-1">
                                      {capabilities.map((cap, i) => (
                                        <li key={i}>{cap}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p>{capabilities[0]}</p>
                                  )}
                                </div>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        );
                      })}
                    </div>
                  </TooltipProvider>
                )}
              </div>

              {/* Add New Permission */}
              <div className="space-y-2">
                <Label>Add Permission</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Select
                    value={selectedModule}
                    onValueChange={handleModuleChange}
                    disabled={isLoadingPermissions}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select module" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedRole}
                    onValueChange={setSelectedRole}
                    disabled={isLoadingPermissions || !selectedModule}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedModule ? "Select role" : "Select module first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableRolesForModule(selectedModule).map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPermission}
                    disabled={!selectedModule || !selectedRole || isLoadingPermissions}
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
                {selectedModule && (
                  <p className="text-xs text-muted-foreground">
                    {getAvailableRolesForModule(selectedModule).length} valid role{getAvailableRolesForModule(selectedModule).length !== 1 ? 's' : ''} available for {getModuleName(selectedModule)}
                  </p>
                )}
                {selectedModule && selectedRole && isValidCombination(selectedModule, selectedRole) && (
                  (() => {
                    const description = getCombinationDescription(selectedModule, selectedRole);
                    if (!description) return null;
                    const capabilities = splitCapabilities(description);
                    return (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p className="font-medium">Capabilities</p>
                        {capabilities.length > 1 ? (
                          <ul className="list-disc pl-4 space-y-1">
                            {capabilities.map((cap, i) => (
                              <li key={i}>{cap}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>{capabilities[0]}</p>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 