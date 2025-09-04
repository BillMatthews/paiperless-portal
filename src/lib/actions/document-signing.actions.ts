"use server"

import {SigningEventDetailsDto} from "@/lib/types/document-signing.types";
import {apiGet} from "@/lib/utils/api-client";
import { handleServerActionError } from "@/lib/utils/error-handler";


const apiUrl = process.env.TRADE_DOCUMENTS_API_URL;
if (!apiUrl) {
    throw new Error('TRADE_DOCUMENTS_API_URL environment variable is not set');
}


export async function getDocumentSigningEventDetails(signingEventId: string): Promise<SigningEventDetailsDto | null> {
    try {
        const response = await apiGet(`${apiUrl}/document-signing/${signingEventId}`);

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`Failed to fetch deal: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("GET DEAL")
        console.log(JSON.stringify(data, null, 2));
        return data;
    } catch (error) {
        return await handleServerActionError(error, 'getDocumentSigningEventDetails');
    }
}

export async function getDocumentSigningEventDetailsByDocumentId(documentId: string): Promise<SigningEventDetailsDto | null> {
    try {
        const response = await apiGet(`${apiUrl}/document-signing/trade-document/${documentId}`);

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`Failed to fetch deal: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
        return data;
    } catch (error) {
        return await handleServerActionError(error, 'getDocumentSigningEventDetailsByDocumentId');
    }
}