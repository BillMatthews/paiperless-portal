"use server";

import {DealsSearchResponse, SearchOptions} from "@/lib/types/search.types";
import {
  AccountDetails,
  DealDetails,
  DealDto,
  DealResponse,
  FundingProgress,
  InvoiceDocument
} from "@/lib/types/deal-desk.types";
import {DealPromissoryNoteDetails} from "@/lib/types/promissory-note.types";
import {getChecklistTemplate} from "@/lib/actions/checklist.actions";
import {apiRequest} from "@/lib/utils";

const apiUrl = process.env.TRADE_DOCUMENTS_API_URL;
if (!apiUrl) {
  throw new Error('TRADE_DOCUMENTS_API_URL environment variable is not set');
}

/**
 * Fetch all deals with optional search, sorting, and pagination
 */
export async function getDeals(options: SearchOptions = {}): Promise<DealsSearchResponse> {
    try {
      const { queryTerm, page, limit, orderBy, orderDirection } = options;
      
      // Build query parameters
      const params = new URLSearchParams();
      if (queryTerm) params.append('queryTerm', queryTerm);
      if (page !== undefined) params.append('page', page.toString());
      if (limit !== undefined) params.append('limit', limit.toString());
      if (orderBy) params.append('orderBy', orderBy);
      if (orderDirection) params.append('orderDirection', orderDirection);
      
      const queryString = params.toString();
      const url = queryString ? `${apiUrl}/deal-processing?${queryString}` : `${apiUrl}/deal-processing`;

      const response = await apiRequest(url, {
        method: 'GET',
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch deals: ${response.statusText}`);
      }

    return await response.json();
    } catch (error) {
      console.error('Error fetching deals:', error);
      throw error;
    }
  }
  
  /**
   * Fetch a single deal by ID
   */
  export async function getDeal(dealId: string): Promise<DealResponse> {
    try {
      // First, get the processing details which contains accountId and dealId
      const processingDetails = await getDealProcessingDetails(dealId);
      if (!processingDetails) {
        throw new Error(`Deal not found: ${dealId}`);
      }
  
      // Get account details and deal details in parallel
      const [accountDetails, dealDetails, checklistTemplate] = await Promise.all([
        getDealAccountDetails(processingDetails.accountId),
        getDealDetails(processingDetails.accountId, processingDetails.dealId),
        getChecklistTemplate(processingDetails.dueDiligenceChecklistVersion)
      ]);
  
      // If we have a checklist template and due diligence checks, populate the guidance
      if (checklistTemplate && Array.isArray(processingDetails.dueDiligenceChecks)) {
        // Convert the array to the expected ChecklistInstance structure
        const updatedChecks = {
          sections: processingDetails.dueDiligenceChecks.map(section => {
            // Find matching section in template
            const templateSection = checklistTemplate.sections.find(
              (templateSection: { title: string; guidance: string; checklistItems: Array<{ title: string; guidance: string }> }) => 
                templateSection.title === section.title
            );
  
            if (templateSection) {
              // Update section guidance
              section.guidance = templateSection.guidance;
  
              // Update checklist items guidance
              if (section.items) {
                section.items = section.items.map((item: { title: string; status: string; notes: any[] }) => {
                  const templateItem = templateSection.items.find(
                    (templateItem: { title: string; guidance: string }) => 
                      templateItem.title === item.title
                  );
                  if (templateItem) {
                    return {
                      ...item,
                      guidance: templateItem.guidance
                    };
                  }
                  return item;
                });
              }
            }
            return section;
          })
        };
        
        // Update the processing details with the new structure
        processingDetails.dueDiligenceChecks = updatedChecks;
      }
  
  
      // Get invoice documents using the document IDs from deal details
      const invoiceDocuments = await getInvoiceDealDetails(
        processingDetails.accountId,
        dealDetails.documentsIds
      );
  
      return {
        processingDetails,
        accountDetails,
        dealDetails,
        invoiceDocuments
      };
    } catch (error) {
      console.error('Error fetching complete deal details:', error);
      throw error;
    }
  }
  
  export async function getDealDetails(accountId: string, dealId: string): Promise<DealDetails> {
    try {
      const response = await fetch(`${apiUrl}/trade-finance/${accountId}/deals/${dealId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch deal details: ${response.statusText}`);
      }
  
      const data = await response.json();
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
      };
    } catch (error) {
      console.error('Error fetching deal details:', error);
      throw error;
    }
  }

 
  
  export async function getTradeDocumentFileDataUrl(accountId: string, documentId: string, fileVariant: string = 'issued'): Promise<{
    data: string | null;
    contentType: string | null;
    error?: string
  }> {
    try {
  
      const url = `${apiUrl}/trade-documents/${accountId}/${documentId}/file/${fileVariant}`;
  
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
  
  export async function getInvoiceDealDetails(accountId: string, invoiceIds: string[]): Promise<InvoiceDocument[]> {
    try {
      const promises = invoiceIds.map(async (invoiceId) => {
        const response = await fetch(`${apiUrl}/trade-documents/${accountId}/${invoiceId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (!response.ok) {
          throw new Error(`Failed to fetch invoice details for ${invoiceId}: ${response.statusText}`);
        }
  
        const data = await response.json();
        return {
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          documentContent: {
            ...data.documentContent,
            invoiceDate: new Date(data.documentContent.invoiceDate),
            dueDate: new Date(data.documentContent.dueDate),
          },
          issueDetails: {
            ...data.issueDetails,
            dateIssued: new Date(data.issueDetails.dateIssued),
          }
        };
      });
  
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      throw error;
    }
  }
  
  export async function getDealAccountDetails(accountId: string): Promise<AccountDetails> {
    try {
      const response = await fetch(`${apiUrl}/accounts/${accountId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch account details: ${response.statusText}`);
      }
  
      const data = await response.json();
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
      };
    } catch (error) {
      console.error('Error fetching account details:', error);
      throw error;
    }
  }
  
  export async function getDealProcessingDetails(dealProcessingId: string): Promise<DealDto | null> {
    try {
      const response = await fetch(`${apiUrl}/deal-processing/${dealProcessingId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
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
      console.error('Error fetching deal:', error);
      throw error;
    }
  }


/**
   * Update deal status and decision
   */
  export async function updateDealDecision(dealId: string, decision: string, notes: string) {
    try {
      const response = await fetch(`${apiUrl}/deal-processing/${dealId}/funding-decision`, {
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
  
  /**
   * Save promissory note draft
   */
  export async function savePromissoryNote(dealId: string, note: Partial<DealPromissoryNoteDetails>) {
    const payload = {...note.content}

    try {
      const response = await fetch(`${apiUrl}/deal-processing/${dealId}/promissory-note`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error(`Failed to save promissory note: ${response.statusText}`);
      }
  
      return { success: true };
    } catch (error) {
      console.error('Error saving promissory note:', error);
      throw error;
    }
  }
  
  /*
  Download Promissory Note file as a data url
   */
  export async function getIssuedPromissoryNoteFileDataUrl(dealId: string): Promise<{
    data: ArrayBuffer | null;
    contentType: string | null;
    error?: string
  }> {
    try {
      const url = `${apiUrl}/deal-processing/${dealId}/promissory-note/download`
  
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
  
      return {
        data: arrayBuffer,
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

  /*
  Download Promissory Note file as a Buffer
   */
  export async function getIssuedPromissoryNoteFileAsBuffer(dealId: string): Promise<{
    buffer: Buffer | null;
    contentType: string | null;
    error?: string
  }> {
    try {
      const url = `${apiUrl}/deal-processing/${dealId}/promissory-note/download`
  
      const response = await fetch(url);
      if (!response.ok) {
        return {
          buffer: null,
          contentType: null,
          error: `Failed to fetch file: ${response.statusText}`
        };
      }
  
      const contentType = response.headers.get('content-type');
      const arrayBuffer = await response.arrayBuffer();
  
      return {
        buffer: Buffer.from(arrayBuffer),
        contentType,
      };
    } catch (error) {
      console.error('Error getting document file:', error);
      return {
        buffer: null,
        contentType: null,
        error: 'Failed to get document file'
      };
    }
  }

  
  /**
   * Issue promissory note
   */
  export async function issuePromissoryNote(dealId: string) {
    try {
      const response = await fetch(`${apiUrl}/deal-processing/${dealId}/promissory-note/issue`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error(`Failed to issue promissory note: ${response.statusText}`);
      }
  
      return { success: true };
    } catch (error) {
      console.error('Error issuing promissory note:', error);
      throw error;
    }
  }
  
  /**
   * Sign promissory note
   */
  export async function signPromissoryNote(dealId: string, party: 'lender' | 'borrower', signedBy: string) {
    try {
      const response = await fetch(`${apiUrl}/deal-processing/${dealId}/promissory-note/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          party,
          signedBy,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Failed to sign promissory note: ${response.statusText}`);
      }
  
      return { success: true };
    } catch (error) {
      console.error('Error signing promissory note:', error);
      throw error;
    }
  }

/**
   * Update funding progress
   */
  export async function updateFundingProgress(dealId: string, progress: Omit<FundingProgress, 'timestamp'>) {
    try {
      const response = await fetch(`${apiUrl}/deal-processing/${dealId}/funding-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progress),
      });
  
      if (!response.ok) {
        throw new Error(`Failed to update funding progress: ${response.statusText}`);
      }
  
      return { success: true };
    } catch (error) {
      console.error('Error updating funding progress:', error);
      throw error;
    }
  }


/**
 * Update due diligence checklist
 */
export async function updateDealDueDiligenceChecklist(dealId: string, updates: Array<{
  sectionTitle: string;
  itemTitle: string;
  status?: string;
  notes?: Array<{
    text: string;
    userId: string;
  }>;
}>) {
  try {
    const response = await fetch(`${apiUrl}/deal-processing/${dealId}/checklist`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
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