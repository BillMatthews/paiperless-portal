"use server"

import { getToken } from 'next-auth/jwt';
import { cookies } from 'next/headers';
import { PermissionsService } from './permissions.service';
import { EntityType, RbacAction } from './permissions.types';

export async function withPermissionCheck<T>(
  entity: EntityType,
  action: RbacAction,
  actionFunction: () => Promise<T>
): Promise<T> {
  const token = await getToken({
    req: { cookies: await cookies() } as any,
    secret: process.env.NEXTAUTH_SECRET
  });

  if (!token?.permissions) {
    throw new Error('No permissions found in session');
  }

  const permissionCheck = PermissionsService.canPerformAction(entity, action, token.permissions);

  if (!permissionCheck.allowed) {
    throw new Error(`Insufficient permissions: ${permissionCheck.reason}`);
  }

  return actionFunction();
}

export async function withPermissionCheckOrFallback<T>(
  entity: EntityType,
  action: RbacAction,
  actionFunction: () => Promise<T>,
  fallbackValue: T
): Promise<T> {
  try {
    return await withPermissionCheck(entity, action, actionFunction);
  } catch (error) {
    console.warn(`Permission check failed for ${action} on ${entity}:`, error);
    return fallbackValue;
  }
}

export async function checkPermission(entity: EntityType, action: RbacAction): Promise<boolean> {
  try {
    const token = await getToken({
      req: { cookies: await cookies() } as any,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token?.permissions) {
      return false;
    }

    const permissionCheck = PermissionsService.canPerformAction(entity, action, token.permissions);
    return permissionCheck.allowed;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

export async function getCurrentUserPermissions() {
  try {
    const token = await getToken({
      req: { cookies: await cookies() } as any,
      secret: process.env.NEXTAUTH_SECRET
    });

    return token?.permissions || [];
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}
