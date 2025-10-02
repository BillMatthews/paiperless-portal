import { UserPermission } from "./authentication.types"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      userId: string
      accountId: string
      accountName: string
      accountEmail: string
      walletAddress?: string
      authMethod?: 'siwe' | 'email-password'
      mfaRequired?: boolean
      mfaSetupRequired?: boolean
      permissions: UserPermission[]
    }
    accessToken: string
    refreshToken: string
  }

  interface User {
    id: string
    userId: string
    accountId: string
    accountName: string
    accountEmail: string
    walletAddress?: string
    authMethod?: 'siwe' | 'email-password'
    mfaRequired?: boolean
    mfaSetupRequired?: boolean
    accessToken: string
    refreshToken: string
    permissions: UserPermission[]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string
    accountId: string
    accountName: string
    accountEmail: string
    walletAddress?: string
    authMethod?: 'siwe' | 'email-password'
    mfaRequired?: boolean
    mfaSetupRequired?: boolean
    accessToken: string
    refreshToken: string
    permissions: UserPermission[]
  }
} 