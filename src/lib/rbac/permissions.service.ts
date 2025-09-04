import { UserPermission } from "@/lib/types/authentication.types";
import { EntityType, RbacAction, PermissionCheckResult } from "./permissions.types";
import { ENTITY_ACTION_PERMISSIONS } from "./actions.constants";

/**
 * RBAC Service - Server-side only permission checking service
 * 
 * This service encapsulates all RBAC logic and prevents exposure of business rules
 * to client-side code. It should only be imported and used on the server side.
 */
export class PermissionsService {
  static canPerformAction(
    entity: EntityType, 
    action: RbacAction, 
    userPermissions: UserPermission[]
  ): PermissionCheckResult {
    if (!userPermissions || userPermissions.length === 0) {
      return {
        allowed: false,
        reason: "No permissions found",
        requiredPermissions: []
      };
    }

    // Find the permission requirements for this entity-action combination
    const permissionRequirement = ENTITY_ACTION_PERMISSIONS.find(
      perm => perm.entity === entity && perm.action === action
    );

    if (!permissionRequirement) {
      return {
        allowed: false,
        reason: `Action ${action} not allowed on entity ${entity}`,
        requiredPermissions: []
      };
    }

    // Check if user has ANY of the required permission combinations
    for (const requiredPermission of permissionRequirement.requiredPermissions) {
      if (this.hasPermission(requiredPermission, userPermissions)) {
        return {
          allowed: true,
          reason: `User has required permission: ${requiredPermission.module} - ${requiredPermission.role}`
        };
      }
    }

    return {
      allowed: false,
      reason: `Insufficient permissions for ${action} on ${entity}`,
      requiredPermissions: permissionRequirement.requiredPermissions
    };
  }


  private static hasPermission(requiredPermission: UserPermission, userPermissions: UserPermission[]): boolean {
    return userPermissions.some(userPermission =>
      userPermission.module === requiredPermission.module &&
      userPermission.role === requiredPermission.role
    );
  }

  static hasModuleAccess(module: string, userPermissions: UserPermission[]): boolean {
    if (!userPermissions || userPermissions.length === 0) {
      return false;
    }
    return userPermissions.some(permission => permission.module === module);
  }

  static hasRole(module: string, role: string, userPermissions: UserPermission[]): boolean {
    if (!userPermissions || userPermissions.length === 0) {
      return false;
    }
    return userPermissions.some(permission =>
      permission.module === module && permission.role === role
    );
  }

  static getUserModules(userPermissions: UserPermission[]): string[] {
    if (!userPermissions || userPermissions.length === 0) {
      return [];
    }
    const modules = new Set(userPermissions.map(permission => permission.module));
    return Array.from(modules);
  }

  static getUserRolesInModule(module: string, userPermissions: UserPermission[]): string[] {
    if (!userPermissions || userPermissions.length === 0) {
      return [];
    }
    return userPermissions
      .filter(permission => permission.module === module)
      .map(permission => permission.role);
  }
}

// Convenience function for the new entity-action system
export const canPerformAction = (
  entity: EntityType, 
  action: RbacAction, 
  permissions: UserPermission[]
): PermissionCheckResult => {
  return PermissionsService.canPerformAction(entity, action, permissions);
};

