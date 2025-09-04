"use server"
import {
    AccountUserDetails,
    AccountUsersSearchResultsDto,
    AccountUserResultDto,
    InitialAccountUserDetails, UpdateNonProtectedAccountUserDetailsDto,
    UpdateProtectedAccountUserDetailsDto,
    PermissionCombination,
    ModuleDetails,
    RoleDetails
} from "@/lib/types/account-user.types";
import {getAccountDetails as getNextAuthAccountDetails} from "@/lib/actions/nextauth.actions";
import {apiGet, apiPatch, apiPost} from "@/lib/utils/api-client";
import {ITEMS_PER_PAGE} from "@/constants/app.constants";
import {handleServerActionError, handleServerActionErrorWithFallback} from "@/lib/utils/error-handler";


const API_BASE_URL = process.env.TRADE_DOCUMENTS_API_URL || 'http://localhost:3001/api';

export async function getAccountUsersForAccount(queryTerm: string = "", pageNumber: number=1, itemsPerPage: number=ITEMS_PER_PAGE, sortByColumn: string = "createdOn", sortDirection:"asc"|"desc" = "desc", showDeleted: boolean=false) {
    const session = await getNextAuthAccountDetails();
    try{
        let url = `${API_BASE_URL}/account-users/account/${session.accountId}?showDeleted=${showDeleted}&page=${pageNumber}&limit=${itemsPerPage}&orderBy=${sortByColumn}&orderDirection=${sortDirection}`;
        if (queryTerm.length > 0) {
            url += `&query=${queryTerm.toLowerCase()}`
        }

        const results = await apiGet(url);
        const resultsJson = await results.json();
        console.log(JSON.stringify(resultsJson, null, 2))
        return resultsJson as AccountUsersSearchResultsDto;
    } catch (error) {
        return  handleServerActionErrorWithFallback(
            error,
            {
            data: [],
            metadata: { page: pageNumber, totalPages: 1, limit: itemsPerPage }
        } as AccountUsersSearchResultsDto,
            "getAccountUsersForAccount")
    }
}

export async function createNewAccountUser(accountUser: AccountUserDetails): Promise<AccountUserResultDto> {
    const session = await getNextAuthAccountDetails();
    
    // Prepare payload based on authentication method
    const basePayload = {
        accountId: session.accountId,
        name: accountUser.name,
        emailAddress: accountUser.emailAddress,
        authMethod: accountUser.authMethod,
        status: accountUser.status,
        permissions: accountUser.permissions,
        inviterId: session.userId,
        inviterName: session.accountName,
        sendInvitation: true
    };

    // Add method-specific fields
    let payload: any;
    if (accountUser.authMethod === 'siwe') {
        payload = {
            ...basePayload,
            walletAddress: accountUser.walletAddress,
            enableMfa: false // MFA not applicable for SIWE
        };
    } else {
        // email-password method
        payload = {
            ...basePayload,
            walletAddress: accountUser.walletAddress || undefined, // Optional for email/password
            enableMfa: accountUser.mfaEnabled || false
        };
        

    }

    
    try {
        const res = await apiPost(`${API_BASE_URL}/account-users/account/${session.accountId}`, payload);
        
        if (!res.ok) {
            const errorData = await res.json();
            console.error(`API Error: ${res.status} - ${JSON.stringify(errorData)}`);
            return {
                data: InitialAccountUserDetails,
                success: false
            };
        }
        
        const data = await res.json();
        console.log(JSON.stringify(data));
        return {
            data: data as AccountUserDetails,
            success: true
        };
    } catch (error) {
        return handleServerActionErrorWithFallback(
            error,
            {
                data: InitialAccountUserDetails,
                success: false
            },
            "createNewAccountUser"
        )
    }
}

export async function getAccountUserDetails(): Promise<AccountUserResultDto> {
    const session = await getNextAuthAccountDetails();

    try {
        const res = await apiGet(`${API_BASE_URL}/account-users/${session.userId}`);
        const data = await res.json();
        console.log(data)
        return {
            data: data as AccountUserDetails,
            success: true
        };
    } catch (error) {
        return handleServerActionErrorWithFallback(
            error,
            {
                data: InitialAccountUserDetails,
                success: false
            },
            "getAccountUserDetails"
        );
    }
}

export async function getCurrentUserAccountUserDetails(): Promise<AccountUserResultDto> {
    const session = await getNextAuthAccountDetails();

    try {
        const res = await apiGet(`${API_BASE_URL}/account-users/${session.userId}`);
        const data = await res.json();
        console.log("Current user account user details:", data);
        return {
            data: data as AccountUserDetails,
            success: true
        };
    } catch (error) {
        return handleServerActionErrorWithFallback(
            error,
            {
                data: InitialAccountUserDetails,
                success: false
            },
            "getCurrentUserAccountUserDetails"
        );
    }
}

export async function updateNonProtectedAccountUserDetails(updates: UpdateNonProtectedAccountUserDetailsDto) {
    return await updateAccountUserDetails({name: updates.name});
}

export async function updateAccountUserDetails(updateAccountUserDetailsDto: UpdateNonProtectedAccountUserDetailsDto|UpdateProtectedAccountUserDetailsDto): Promise<AccountUserResultDto> {
    const session = await getNextAuthAccountDetails();

    try {
        const res = await apiPatch(`${API_BASE_URL}/account-users/${session.userId}`, {name: updateAccountUserDetailsDto.name});

        const data = await res.json();
        console.log(data)
        return {
            data: data as AccountUserDetails,
            success: true
        };
    } catch (error) {
        return handleServerActionErrorWithFallback(
            error,
            {
                data: InitialAccountUserDetails,
                success: false
            },
            "updateAccountUserDetails"
        );
    }
}

export async function updateOtherAccountUser(userId: string, updateData: UpdateProtectedAccountUserDetailsDto): Promise<AccountUserResultDto> {
    const session = await getNextAuthAccountDetails();

    try {
        const res = await apiPatch(`${API_BASE_URL}/account-users/${userId}`, updateData);

        const data = await res.json();
        console.log(data)
        return {
            data: data as AccountUserDetails,
            success: true
        };
    } catch (error) {
        return handleServerActionErrorWithFallback(
            error,
            {
                data: InitialAccountUserDetails,
                success: false
            },
            "updateOtherAccountUser"
        );
    }
}

export async function deleteAccountUser(userId: string): Promise<AccountUserResultDto> {
    const session = await getNextAuthAccountDetails();

    try {
        const res = await apiPatch(`${API_BASE_URL}/account-users/${userId}`,{status: "Deleted"})

        const data = await res.json();
        return {
            data: data as AccountUserDetails,
            success: true
        };
    } catch (error) {
        return handleServerActionErrorWithFallback(
            error,
            {
                data: InitialAccountUserDetails,
                success: false
            },
            "deleteAccountUser"
        );
    }
}

export async function getValidPermissionsCombinations() {
    try {
        const res = await apiGet(`${API_BASE_URL}/account-users/permissions/combinations`);

        const data = await res.json();
        console.log(data)
        return {
            data: data as PermissionCombination[],
            success: true
        };
    } catch (error) {
        return handleServerActionErrorWithFallback(
            error,
            {
                data: [],
                success: false
            },
            "getValidPermissionsCombinations"
        );
    }
}
export async function getModules() {
    try {
        const res = await apiGet(`${API_BASE_URL}/account-users/permissions/modules`);

        const data = await res.json();
        console.log(data)
        return {
            data: data as ModuleDetails[],
            success: true
        };
    } catch (error) {
        return handleServerActionErrorWithFallback(
            error,
            {
                data: [],
                success: false
            },
            "getModules"
        );
    }
}

export async function getRoles() {
    try {
        const res = await apiGet(`${API_BASE_URL}/account-users/permissions/roles`);

        const data = await res.json();
        console.log(data)
        return {
            data: data as RoleDetails[],
            success: true
        };
    } catch (error) {
        return handleServerActionErrorWithFallback(
            error,
            {
                data: [],
                success: false
            },
            "getRoles"
        );
    }
}