import { ApplicationModule, ApplicationRole, UserPermission } from "@/lib/types/authentication.types";
import { EntityType, RbacAction, EntityActionPermission } from "./permissions.types";

const requirePermission = (module: ApplicationModule, role: ApplicationRole): UserPermission => ({
  module,
  role,
  description: `${role} access to ${module}`
});

// Entity-Action Permission Mapping
export const ENTITY_ACTION_PERMISSIONS: EntityActionPermission[] = [
  // Trade Documents
  {
    entity: EntityType.TRADE_FINANCE_DEAL,
    action: RbacAction.READ,
    requiredPermissions: [requirePermission(ApplicationModule.PORTAL_DEAL_DESK, ApplicationRole.AGENT)],
    description: "Read trade finance deals"
  },
  {
    entity: EntityType.TRADE_FINANCE_DEAL,
    action: RbacAction.UPDATE,
    requiredPermissions: [requirePermission(ApplicationModule.PORTAL_DEAL_DESK, ApplicationRole.AGENT)],
    description: "Update trade finance deals"
  },
  {
    entity: EntityType.TRADE_FINANCE_DEAL,
    action: RbacAction.APPROVE,
    requiredPermissions: [requirePermission(ApplicationModule.PORTAL_DEAL_DESK, ApplicationRole.SUPERVISOR)],
    description: "Approve trade finance deals"
  },
  {
    entity: EntityType.TRADE_FINANCE_DEAL,
    action: RbacAction.ISSUE,
    requiredPermissions: [requirePermission(ApplicationModule.PORTAL_DEAL_DESK, ApplicationRole.MANAGER)],
    description: "Issue trade finance agreements"
  },
  {
    entity: EntityType.TRADE_FINANCE_DEAL,
    action: RbacAction.SIGN,
    requiredPermissions: [requirePermission(ApplicationModule.PORTAL_DEAL_DESK, ApplicationRole.MANAGER)],
    description: "Sign trade finance agreements"
  },

  // Onboarding Requests
  {
    entity: EntityType.ONBOARDING_REQUEST,
    action: RbacAction.READ,
    requiredPermissions: [requirePermission(ApplicationModule.PORTAL_ONBOARDING_DESK, ApplicationRole.AGENT)],
    description: "Read onboarding requests"
  },
  {
    entity: EntityType.ONBOARDING_REQUEST,
    action: RbacAction.UPDATE,
    requiredPermissions: [requirePermission(ApplicationModule.PORTAL_ONBOARDING_DESK, ApplicationRole.AGENT)],
    description: "Update trade finance deals"
  },
  {
    entity: EntityType.ONBOARDING_REQUEST,
    action: RbacAction.APPROVE,
    requiredPermissions: [requirePermission(ApplicationModule.PORTAL_ONBOARDING_DESK, ApplicationRole.SUPERVISOR)],
    description: "Approve trade finance deals"
  },
  // Portal Admin - Customer Account Management
  {
    entity: EntityType.ACCOUNT_MANAGEMENT,
    action: RbacAction.READ,
    requiredPermissions: [requirePermission(ApplicationModule.PORTAL_ADMIN, ApplicationRole.MANAGER)],
    description: "Read deal agreements"
  },
  {
    entity: EntityType.ACCOUNT_MANAGEMENT,
    action: RbacAction.UPDATE,
    requiredPermissions: [requirePermission(ApplicationModule.PORTAL_ADMIN, ApplicationRole.MANAGER)],
    description: "Update deal agreements"
  },
  // Portal Admin - Portal User Management
  {
    entity: EntityType.USER_MANAGEMENT,
    action: RbacAction.READ,
    requiredPermissions: [
      requirePermission(ApplicationModule.PORTAL_ADMIN, ApplicationRole.MANAGER)
    ],
    description: "Read Portal Users"
  },
  {
    entity: EntityType.USER_MANAGEMENT,
    action: RbacAction.CREATE,
    requiredPermissions: [
      requirePermission(ApplicationModule.PORTAL_ADMIN, ApplicationRole.MANAGER)
    ],
    description: "Create new portal users"
  },
  {
    entity: EntityType.USER_MANAGEMENT,
    action: RbacAction.UPDATE,
    requiredPermissions: [
      requirePermission(ApplicationModule.PORTAL_ADMIN, ApplicationRole.MANAGER)
    ],
    description: "Update portal users"
  },
  {
    entity: EntityType.USER_MANAGEMENT,
    action: RbacAction.DELETE,
    requiredPermissions: [
      requirePermission(ApplicationModule.PORTAL_ADMIN, ApplicationRole.MANAGER)
    ],
    description: "Delete portal users"
  },

];

// Export the enums for convenience
export { EntityType, RbacAction };
