'use client';

import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
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
import { AccountUserStatus, PermissionCombination, ModuleDetails, RoleDetails } from "@/lib/types/account-user.types";
import { getValidPermissionsCombinations, getModules, getRoles } from "@/lib/actions/account-users.actions";
import { createUser } from "@/lib/actions/user-management.actions";
import { AuthMethodSelector, SiweConfigForm, EmailPasswordConfigForm } from "@/components/user-management";
import { AuthMethod, createUserFormDataSchema } from "@/lib/schemas/user-creation-validation";
import { z } from 'zod';
import {ApplicationModule, ApplicationRole} from "@/lib/types/authentication.types";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  emailAddress: string;
  authMethod: AuthMethod;
  walletAddress: string;
  temporaryPassword: string;
  mfaEnabled: boolean;
  status: AccountUserStatus;
  permissions: PermissionCombination[];
}

export function CreateUserDialog({ open, onOpenChange, onSuccess }: CreateUserDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    emailAddress: '',
    authMethod: 'email-password', // Default to email/password
    walletAddress: '',
    temporaryPassword: '',
    mfaEnabled: false,
    status: AccountUserStatus.ACTIVE,
    permissions: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [validCombinations, setValidCombinations] = useState<PermissionCombination[]>([]);
  const [modules, setModules] = useState<ModuleDetails[]>([]);
  const [roles, setRoles] = useState<RoleDetails[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');

  useEffect(() => {
    if (open) {
      loadPermissionsData();
      // Reset form when dialog opens
      setFormData({
        name: '',
        emailAddress: '',
        authMethod: 'email-password',
        walletAddress: '',
        temporaryPassword: '',
        mfaEnabled: false,
        status: AccountUserStatus.ACTIVE,
        permissions: []
      });
      setSelectedModule('');
      setSelectedRole('');
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

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    try {
      createUserFormDataSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }
    
    setIsSaving(true);
    try {
      const result = await createUser({
        name: formData.name,
        emailAddress: formData.emailAddress,
        authMethod: formData.authMethod,
        walletAddress: formData.walletAddress,
        temporaryPassword: formData.temporaryPassword,
        mfaEnabled: formData.mfaEnabled,
        permissions: formData.permissions.map(p => ({
          module: p.module as ApplicationModule,
          role: p.role as ApplicationRole
        }))
      });
      
      if (result.success) {
        toast.success(result.message || `User ${formData.name} created successfully`);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error || 'Failed to create user');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error creating user:', error);
    } finally {
      setIsSaving(false);
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
    const module = modules.find(m => m.id === moduleId);
    return module?.name || moduleId;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to your account with the required information, authentication method, and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">Full Name *</Label>
                  <Input
                    id="create-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      name: e.target.value
                    }))}
                    placeholder="Enter full name"
                    required
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-status">Status *</Label>
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
                <Label htmlFor="create-email">Email Address *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={formData.emailAddress}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    emailAddress: e.target.value
                  }))}
                  placeholder="Enter email address"
                  required
                  className={errors.emailAddress ? 'border-red-500' : ''}
                />
                {errors.emailAddress && (
                  <p className="text-xs text-red-500">{errors.emailAddress}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Authentication Method Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Authentication Method</h3>
              <AuthMethodSelector
                value={formData.authMethod}
                onChange={(authMethod) => {
                  setFormData(prev => ({
                    ...prev,
                    authMethod,
                    // Reset method-specific fields when changing auth method
                    walletAddress: authMethod === 'siwe' ? prev.walletAddress : '',
                    temporaryPassword: authMethod === 'email-password' ? prev.temporaryPassword : '',
                    mfaEnabled: authMethod === 'email-password' ? prev.mfaEnabled : false
                  }));
                  setErrors({}); // Clear errors when changing method
                }}
                disabled={isSaving}
              />
            </div>

            {/* Authentication Method Configuration */}
            {formData.authMethod === 'siwe' && (
              <div className="space-y-4">
                <SiweConfigForm
                  walletAddress={formData.walletAddress}
                  onWalletAddressChange={(walletAddress) => setFormData(prev => ({
                    ...prev,
                    walletAddress
                  }))}
                  disabled={isSaving}
                />
              </div>
            )}

            {formData.authMethod === 'email-password' && (
              <div className="space-y-4">
                <EmailPasswordConfigForm
                  temporaryPassword={formData.temporaryPassword}
                  onTemporaryPasswordChange={(temporaryPassword) => setFormData(prev => ({
                    ...prev,
                    temporaryPassword
                  }))}
                  mfaEnabled={formData.mfaEnabled}
                  onMfaEnabledChange={(mfaEnabled) => setFormData(prev => ({
                    ...prev,
                    mfaEnabled
                  }))}
                  disabled={isSaving}
                />
              </div>
            )}

            <Separator />

            {/* Permissions */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Permissions</h3>
              
              {/* Current Permissions */}
              <div className="space-y-2">
                <Label>Assigned Permissions</Label>
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
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 