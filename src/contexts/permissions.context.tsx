'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { UserPermission } from '@/lib/types/authentication.types';

interface PermissionsContextType {
  permissions: UserPermission[];
  hasPermission: (module: string, role: string) => boolean;
  hasModuleAccess: (module: string) => boolean;
  getUserModules: () => string[];
  getUserRolesInModule: (module: string) => string[];
  isLoading: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

interface PermissionsProviderProps {
  children: ReactNode;
}

export function PermissionsProvider({ children }: PermissionsProviderProps) {
  const { data: session, status } = useSession();
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }

    if (status === 'authenticated' && session?.user?.permissions) {
      setPermissions(session.user.permissions);
    } else {
      setPermissions([]);
    }
    
    setIsLoading(false);
  }, [session, status]);

  const hasPermission = (module: string, role: string): boolean => {
    console.log("context permissions", JSON.stringify(permissions, null, 2));
    return permissions.some(permission => 
      permission.module === module && permission.role === role
    );
  };

  const hasModuleAccess = (module: string): boolean => {
    return permissions.some(permission => permission.module === module);
  };

  const getUserModules = (): string[] => {
    const modules = new Set(permissions.map(permission => permission.module));
    return Array.from(modules);
  };

  const getUserRolesInModule = (module: string): string[] => {
    return permissions
      .filter(permission => permission.module === module)
      .map(permission => permission.role);
  };

  const value: PermissionsContextType = {
    permissions,
    hasPermission,
    hasModuleAccess,
    getUserModules,
    getUserRolesInModule,
    isLoading,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextType {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}
