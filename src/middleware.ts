import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { EntityType, RbacAction } from '@/lib/rbac/permissions.types';
import { ApplicationModule, ApplicationRole } from "@/lib/types/authentication.types";

// Define route permissions using entity-action pairs
// Use path prefixes to catch nested routes
const ROUTE_PERMISSIONS: Record<string, { entity: EntityType; action: RbacAction }> = {
    '/user-management': { entity: EntityType.USER_MANAGEMENT, action: RbacAction.READ },
    '/deal-desk': { entity: EntityType.TRADE_FINANCE_DEAL, action: RbacAction.READ },
    '/customer-accounts': { entity: EntityType.ACCOUNT_MANAGEMENT, action: RbacAction.READ },
    '/onboarding': { entity: EntityType.ONBOARDING_REQUEST, action: RbacAction.READ },
};

// Paths that are always allowed (no authentication required)
const PUBLIC_PATHS = [
    '/',
    '/login',
    '/forgot-password',
    '/reset-password',
    '/unauthorized',
    '/forbidden',
    '/api/auth',
];

// Check if user has permission for a specific route
async function hasRoutePermission(
    path: string,
    userPermissions: any[]
): Promise<boolean> {
    console.log('hasRoutePermission called with:', { path, userPermissionsCount: userPermissions?.length || 0 });
    
    // Find the matching route permission by checking if the path starts with any of the protected routes
    let routePermission: { entity: EntityType; action: RbacAction } | undefined;
    
    for (const [routePath, permission] of Object.entries(ROUTE_PERMISSIONS)) {
        if (path.startsWith(routePath)) {
            routePermission = permission;
            console.log('Found matching route permission:', { routePath, permission });
            break;
        }
    }

    if (!routePermission) {
        // If no specific permission is defined, DENY access by default for security
        console.log('No permission defined for route:', path, '- denying access');
        return false;
    }

    // Simple permission check - in production, use the full PermissionsService
    const { entity, action } = routePermission;

    // Check if user has any permission for the required entity-action combination
    // This is a simplified check - the full logic is in PermissionsService
    const hasPermission = userPermissions.some((permission: any) => {
        console.log('Checking permission:', { permission, requiredEntity: entity, requiredAction: action });
        
        switch (entity) {
            case EntityType.USER_MANAGEMENT:
                if (action === RbacAction.READ) {
                    const allowed = permission.module === ApplicationModule.PORTAL_ADMIN &&
                        [ApplicationRole.MANAGER].includes(permission.role);
                    console.log('USER_MANAGEMENT check:', { allowed, permission, required: { module: ApplicationModule.PORTAL_ADMIN, role: ApplicationRole.MANAGER } });
                    return allowed;
                }
                break;
            case EntityType.ACCOUNT_MANAGEMENT:
                if (action === RbacAction.READ) {
                    const allowed = permission.module === ApplicationModule.PORTAL_ADMIN &&
                        [ApplicationRole.MANAGER].includes(permission.role);
                    console.log('ACCOUNT_MANAGEMENT check:', { allowed, permission, required: { module: ApplicationModule.PORTAL_ADMIN, role: ApplicationRole.MANAGER } });
                    return allowed;
                }
                break;
            case EntityType.TRADE_FINANCE_DEAL:
                if (action === RbacAction.READ) {
                    const allowed = permission.module === ApplicationModule.PORTAL_DEAL_DESK &&
                        [ApplicationRole.AGENT, ApplicationRole.SUPERVISOR, ApplicationRole.MANAGER].includes(permission.role);
                    console.log('TRADE_FINANCE_DEAL check:', { allowed, permission, required: { module: ApplicationModule.PORTAL_DEAL_DESK, roles: [ApplicationRole.AGENT, ApplicationRole.SUPERVISOR, ApplicationRole.MANAGER] } });
                    return allowed;
                }
                break;
            case EntityType.ONBOARDING_REQUEST:
                if (action === RbacAction.READ) {
                    const allowed = permission.module === ApplicationModule.PORTAL_ONBOARDING_DESK &&
                        [ApplicationRole.AGENT, ApplicationRole.SUPERVISOR, ApplicationRole.MANAGER].includes(permission.role);
                    console.log('ONBOARDING_REQUEST check:', { allowed, permission, required: { module: ApplicationModule.PORTAL_ONBOARDING_DESK, roles: [ApplicationRole.AGENT, ApplicationRole.SUPERVISOR, ApplicationRole.MANAGER] } });
                    return allowed;
                }
                break;
        }
        return false;
    });

    console.log('Permission check result:', { entity, action, hasPermission, userPermissions });
    return hasPermission;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    console.log('Middleware processing:', { pathname, method: request.method });

    // Allow public paths - check for exact matches or root path
    if (pathname === '/' || PUBLIC_PATHS.some(path => pathname === path)) {
        console.log('Public path allowed:', pathname);
        return NextResponse.next();
    }

    // Check if user is authenticated
    const token = await getToken({
        req: request as any,
        secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
        console.log('No token found, redirecting to login');
        // Redirect to login if not authenticated
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    console.log('Token found:', { 
        userId: token.sub, 
        permissionsCount: token.permissions?.length || 0,
        permissions: token.permissions 
    });

    // Check route permissions
    const hasPermission = await hasRoutePermission(pathname, token.permissions || []);

    if (!hasPermission) {
        console.log('Access denied for route:', pathname, 'User permissions:', token.permissions);
        // Redirect to unauthorized page if user doesn't have permission
        return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    console.log('Access granted for route:', pathname);
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};