'use client';

import {usePermissions} from '@/contexts/permissions.context';
import {EntityType, RbacAction} from '@/lib/rbac/permissions.types';
import {ApplicationModule, ApplicationRole} from '@/lib/types/authentication.types';

export function useRbac() {
    const {permissions, hasPermission: contextHasPermission, hasModuleAccess} = usePermissions();

    const canPerformAction = (entity: EntityType, action: RbacAction): boolean => {
        // Client-side permission check - simplified version
        // For full security, always validate on the server side
        return hasPermissionForEntityAction(entity, action, permissions, contextHasPermission);
    };

    return {
        canPerformAction,
        permissions,
        hasPermission: contextHasPermission,
        hasModuleAccess,
        // Export the enums for convenience
        EntityType,
        RbacAction,
    };
}

// Helper function to check permissions for entity-action combinations
function hasPermissionForEntityAction(
    entity: EntityType,
    action: RbacAction,
    permissions: any[],
    hasPermission: (module: string, role: string) => boolean
): boolean {
    // This is a simplified client-side check
    // For production, always validate on the server side
    console.log('hasPermissionForEntityAction', entity, action, permissions);
    switch (entity) {
        case EntityType.ONBOARDING_REQUEST:
            switch (action) {
                case RbacAction.READ:
                    return hasPermission(ApplicationModule.PORTAL_ONBOARDING_DESK, ApplicationRole.AGENT) ||
                        hasPermission(ApplicationModule.PORTAL_ONBOARDING_DESK, ApplicationRole.SUPERVISOR) ||
                        hasPermission(ApplicationModule.PORTAL_ONBOARDING_DESK, ApplicationRole.MANAGER);
                case RbacAction.CREATE:
                    return hasPermission(ApplicationModule.PORTAL_ONBOARDING_DESK, ApplicationRole.AGENT);
                case RbacAction.UPDATE:
                    return hasPermission(ApplicationModule.PORTAL_ONBOARDING_DESK, ApplicationRole.AGENT);
                case RbacAction.APPROVE:
                    return hasPermission(ApplicationModule.PORTAL_ONBOARDING_DESK, ApplicationRole.SUPERVISOR) ||
                        hasPermission(ApplicationModule.PORTAL_ONBOARDING_DESK, ApplicationRole.MANAGER);
                default:
                    return false;
            }

        case EntityType.TRADE_FINANCE_DEAL:
            switch (action) {
                case RbacAction.READ:
                    return hasPermission(ApplicationModule.PORTAL_DEAL_DESK, ApplicationRole.AGENT) ||
                        hasPermission(ApplicationModule.PORTAL_DEAL_DESK, ApplicationRole.SUPERVISOR) ||
                        hasPermission(ApplicationModule.PORTAL_DEAL_DESK, ApplicationRole.MANAGER);
                case RbacAction.CREATE:
                case RbacAction.UPDATE:
                    return hasPermission(ApplicationModule.PORTAL_DEAL_DESK, ApplicationRole.AGENT);
                case RbacAction.APPROVE:
                    return hasPermission(ApplicationModule.PORTAL_DEAL_DESK, ApplicationRole.SUPERVISOR);
                case RbacAction.ISSUE:
                case RbacAction.SIGN:
                    return hasPermission(ApplicationModule.PORTAL_DEAL_DESK, ApplicationRole.MANAGER);
                default:
                    return false;
            }
        // Approve the Deal Agreement and sign the promissory note
        case EntityType.ACCOUNT_MANAGEMENT:
            switch (action) {
                case RbacAction.READ:
                case RbacAction.UPDATE:
                    return hasPermission(ApplicationModule.PORTAL_ADMIN, ApplicationRole.MANAGER);
                default:
                    return false;
            }
        case EntityType.USER_MANAGEMENT:
            switch (action) {
                case RbacAction.READ:
                case RbacAction.CREATE:
                case RbacAction.UPDATE:
                case RbacAction.DELETE:
                    return hasPermission(ApplicationModule.PORTAL_ADMIN, ApplicationRole.MANAGER);
                default:
                    return false;
            }
        default:
            return false;
    }
}


