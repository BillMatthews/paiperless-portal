import {SearchMetadata} from "@/lib/types/search.types";
import {ApplicationModule, ApplicationRole} from "@/lib/types/authentication.types";

// Authentication method enum
export type AuthMethod = 'siwe' | 'email-password';

export enum AccountUserStatus {
    ACTIVE="Active",
    SUSPENDED="Suspended",
    UNDER_REVIEW="Under Review",
    DELETED="Deleted`"
}

export interface AccountPermissions {
    module: ApplicationModule;
    role: ApplicationRole;
    description?: string;
}

export interface AccountUserDetails {
    id: string;
    accountId: string;
    name: string;
    emailAddress: string;
    walletAddress?: string;
    status: string;
    authMethod: string;
    mfaEnabled: boolean;
    mfaSetupRequired: boolean;
    mfaSetupCompleted?: Date;
    firstLoginAt?: Date;
    passwordChanged: boolean;
    permissions: AccountPermissions[];
    createdAt: Date;
    updatedAt: Date;
    accountLockedUntil?: Date;
}

export interface UpdateNonProtectedAccountUserDetailsDto {
    name: string;
}

export interface UpdateProtectedAccountUserDetailsDto {
    name: string;
    emailAddress: string;
    authMethod: AuthMethod;
    walletAddress?: string;
    mfaEnabled?: boolean;
    status: AccountUserStatus;
    permissions: AccountPermissions[]
}

// New DTOs for user creation
export interface CreateAccountUserRequestDto {
    name: string;
    emailAddress: string;
    authMethod: AuthMethod;
    walletAddress?: string;
    temporaryPassword?: string;
    mfaEnabled?: boolean;
    status: AccountUserStatus;
    permissions: AccountPermissions[];
    inviterId: string;
    inviterName: string;
}

export interface CreateAccountUserResponseDto {
    success: boolean;
    userId: string;
    message?: string;
}

export interface AccountUsersSearchResultsDto {
    data: AccountUserDetails[];
    metadata: SearchMetadata;
}

export interface AccountUserResultDto {
    data: AccountUserDetails;
    success: boolean;
}

export const InitialAccountUserDetails: AccountUserDetails = {
    id: '',
    accountId: '',
    name: '',
    emailAddress: '',
    walletAddress: '',
    status: 'Deleted',
    authMethod: 'email-password',
    mfaEnabled: false,
    mfaSetupRequired: false,
    passwordChanged: false,
    permissions: [],
    createdAt: new Date(),
    updatedAt: new Date()
}


export interface RoleDetails {
    id: string;
    name: string;
    description: string;
    active: boolean;
}
export interface ModuleDetails {
    id: string;
    name: string;
    description: string;
    active: boolean;
}

export interface PermissionCombination {
    module: string;
    role: string;
    description?: string;
}
