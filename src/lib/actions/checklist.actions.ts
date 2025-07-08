"use server"

import { apiRequest } from "@/lib/utils";

const apiUrl = process.env.TRADE_DOCUMENTS_API_URL;
if (!apiUrl) {
  throw new Error('TRADE_DOCUMENTS_API_URL environment variable is not set');
}

export async function getChecklistTemplate(versionNumber: number) {
    try {
        const response = await apiRequest(`${apiUrl}/due-diligence-checklists/${versionNumber}`, {
            method: 'GET',
        });

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`Failed to fetch deal: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching deal:', error);
        throw error;
    }
}

/**
 * Update due diligence checklist
 */
export async function updateDueDiligenceChecklist(checklistInstanceId: string, updates: Array<{
  sectionTitle: string;
  itemTitle: string;
  status?: string;
  notes?: Array<{
    text: string;
    userId: string;
  }>;
}>) {
  console.log(JSON.stringify(updates, null, 2));
  try {
    const response = await apiRequest(`${apiUrl}/due-diligence-checklists/${checklistInstanceId}/checklist`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update checklist: ${response.statusText}`);
    }

    return {success: true};
  } catch (error) {
    console.error('Error updating checklist:', error);
    throw error;
  }
}