// Core RBAC types and enums
export { EntityType, RbacAction } from './permissions.types';
export type { PermissionCheckResult, EntityActionPermission, RbacRule, PermissionChecker } from './permissions.types';

// Permission service and convenience functions
export { PermissionsService, canPerformAction } from './permissions.service';

// Entity-action permission mappings
export { ENTITY_ACTION_PERMISSIONS } from './actions.constants';

// Server-side RBAC utilities
export { 
  withPermissionCheck, 
  withPermissionCheckOrFallback, 
  checkPermission, 
  getCurrentUserPermissions,
} from './server-actions';

// Re-export authentication types for convenience
export type { UserPermission, ApplicationModule, ApplicationRole } from '@/lib/types/authentication.types';
