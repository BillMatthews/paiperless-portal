"use server"
import {OnboardingsSearchResponse, SearchOptions} from "@/lib/types/search.types";
import {OnboardingDecisionState, OnboardingDto, OnboardingResponse} from "@/lib/types/onboarding.types";
import {RegistrationDetails} from "@/lib/types/registration.types";
import { apiRequest } from "@/lib/utils";


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

        const response = await apiRequest(url, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch deals: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
        return data;
    } catch (error) {
        console.error('Error fetching deals:', error);
        throw error;
    }
}

export async function getOnboardingDetails(registrationId: string): Promise<OnboardingDto> {
    try {
        const response = await fetch(`${apiUrl}/onboarding/${registrationId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Onboarding details not found');
            }
            throw new Error(`Failed to fetch onboarding: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching onboarding details:', error);
        throw error;
    }
}
export async function getRegistrationDetails(registrationId: string): Promise<RegistrationDetails> {
    try {
        const response = await fetch(`${apiUrl}/registration/${registrationId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Registration details not found');
            }
            throw new Error(`Failed to fetch onboarding: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching onboarding details:', error);
        throw error;
    }
}

export async function getRegistrationDocumentFileDataUrl(registrationId: string, documentId: string): Promise<{
    data: string | null;
    contentType: string | null;
    error?: string
}> {
    try {

        const url = `${apiUrl}/registration/${registrationId}/files/${documentId}`;

        const response = await fetch(url);
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
        console.error('Error getting document file:', error);
        return {
            data: null,
            contentType: null,
            error: 'Failed to get document file'
        };
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
        console.error(`Error fetching onboarding details: ${error}`)
        throw error;
    }

}

export async function updateOnboardingDecision(onboardingId: string, decision: OnboardingDecisionState, notes: string) {
    try {
        const response = await fetch(`${apiUrl}/onboarding/${onboardingId}/decision`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                decision,
                note: notes,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update deal decision: ${response.statusText}`);
        }

        return { success: true };
    } catch (error) {
        console.error('Error updating deal decision:', error);
        throw error;
    }
}