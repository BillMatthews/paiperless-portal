import { UserPermission } from "@/lib/types/authentication.types";

export enum EntityType {
  // Core entities
  TRADE_FINANCE_DEAL = 'trade_finance_deal',
  ONBOARDING_REQUEST = 'onboard_request',
  ACCOUNT_MANAGEMENT = 'account_management',
  USER_MANAGEMENT = 'user_management',
  
}

export enum RbacAction {
  READ = 'read',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  ISSUE = 'issue',
  SIGN = 'sign'
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  requiredPermissions?: UserPermission[];
}

export interface EntityActionPermission {
  entity: EntityType;
  action: RbacAction;
  requiredPermissions: UserPermission[];
  description: string;
}

export interface RbacRule {
  entity: EntityType;
  action: RbacAction;
  requiredPermissions: UserPermission[];
  description: string;
}


export interface ActionPermissions {
  canRead?: boolean,
  canCreate?: boolean,
  canUpdate?: boolean,
  canDelete?: boolean,
  canIssue?: boolean,
  canApprove?: boolean,
}
export type PermissionChecker = (entity: EntityType, action: RbacAction, permissions: UserPermission[]) => PermissionCheckResult;
