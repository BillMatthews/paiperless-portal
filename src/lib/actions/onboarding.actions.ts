"use server"
import {OnboardingsSearchResponse, SearchOptions} from "@/lib/types/search.types";
import {OnboardingDecisionState, OnboardingDto, OnboardingResponse} from "@/lib/types/onboarding.types";
import {RegistrationDetails} from "@/lib/types/registration.types";
import {apiGet, apiPost} from "@/lib/utils/api-client";
import { handleServerActionError, handleServerActionErrorWithFallback } from "@/lib/utils/error-handler";



const apiUrl = process.env.TRADE_DOCUMENTS_API_URL;
if (!apiUrl) {
    throw new Error('TRADE_DOCUMENTS_API_URL environment variable is not set');
}

export async function getOnboardings(options: SearchOptions = {}): Promise<OnboardingsSearchResponse> {
    try {
        const {queryTerm, page, limit, orderBy, orderDirection} = options;

        // Build query parameters
        const params = new URLSearchParams();
        if (queryTerm) params.append('queryTerm', queryTerm);
        if (page !== undefined) params.append('page', page.toString());
        if (limit !== undefined) params.append('limit', limit.toString());
        if (orderBy) params.append('orderBy', orderBy);
        if (orderDirection) params.append('orderDirection', orderDirection);

        const queryString = params.toString();
        const url = queryString ? `${apiUrl}/onboarding?${queryString}` : `${apiUrl}/onboarding`;

        const response = await apiGet(url);
        return await response.json();
    } catch (error) {
        return await handleServerActionError(error, 'getOnboardings');
    
    }
}

export async function getOnboardingDetails(registrationId: string): Promise<OnboardingDto> {
    try {
        const response = await apiGet(`${apiUrl}/onboarding/${registrationId}`);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Onboarding details not found');
            }
            throw new Error(`Failed to fetch onboarding: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        return await handleServerActionError(error, 'getOnboardingDetails');
        
    }
}
export async function getRegistrationDetails(registrationId: string): Promise<RegistrationDetails> {
    try {
        const response = await apiGet(`${apiUrl}/registration/${registrationId}`);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Registration details not found');
            }
            throw new Error(`Failed to fetch onboarding: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        return await handleServerActionError(error, 'getRegistrationDetails');
        
    }
}

export async function getRegistrationDocumentFileDataUrl(registrationId: string, documentId: string): Promise<{
    data: string | null;
    contentType: string | null;
    error?: string
}> {
    try {

        const url = `${apiUrl}/registration/${registrationId}/files/${documentId}`;

        const response = await apiGet(url);
        if (!response.ok) {
            return {
                data: null,
                contentType: null,
                error: `Failed to fetch file: ${response.statusText}`
            };
        }

        const contentType = response.headers.get('content-type');
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const dataUrl = `data:${contentType};base64,${base64}`;

        return {
            data: dataUrl,
            contentType,
        };
    } catch (error) {
        return handleServerActionErrorWithFallback(
            error, 
            {
                data: null,
                contentType: null,
                error: 'Failed to get document file'
            },
            'getRegistrationDocumentFileDataUrl'
        );
    }
}

export async function getOnboarding(id: string): Promise<OnboardingResponse> {

    try {
        // First get the Onboarding details
        const processingDetails = await getOnboardingDetails(id);

        // Get the registration Details
        const registrationDetails = await getRegistrationDetails(processingDetails.registrationId)

        return {
            registrationDetails: registrationDetails,
            processingDetails: processingDetails
        } as OnboardingResponse
    }
    catch (error) {
        return await handleServerActionError(error, 'getOnboarding');
    }

}

export async function updateOnboardingDecision(onboardingId: string, decision: OnboardingDecisionState, notes: string) {
    try {
        const response = await apiPost(`${apiUrl}/onboarding/${onboardingId}/decision`, JSON.stringify({
                decision,
                note: notes,
            }),
        );

        return { success: true };
    } catch (error) {
        // For this action, we might want to return a fallback instead of redirecting
        // This depends on your UX requirements
        return handleServerActionErrorWithFallback(
            error, 
            { success: false, error: 'Failed to update decision' },
            'updateOnboardingDecision'
        );
    }
}