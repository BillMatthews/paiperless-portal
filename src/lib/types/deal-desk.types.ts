import {ChecklistInstance} from "@/lib/types/checklist.types";
import {PromissoryNoteContent, PromissoryNoteStatus} from "@/lib/types/promissory-note.types";

export interface FundingDecisionDetails {
    decision: FundingDecision;
    decisionNotes: {
        note: string;
        user: string;
        createdAt: Date;
    }
}

export interface PromissoryNoteDetails {
    documentId: string;
    content: PromissoryNoteContent,
    status: PromissoryNoteStatus;
    signatures?: {
        lender?: {
            signedBy: string;
            signedAt: Date;
        };
        borrower?: {
            signedBy: string;
            signedAt: Date;
        };
    };
}

export interface DealDto {
    _id: string;
    dealId: string;
    accountId: string;
    accountName: string;
    dealReference: string;
    requestedFinanceAmount: number;
    invoiceTotal: number;
    loanAmount: number;
    collateralAmount: number;
    loanTerm: number;
    fundingDecision: FundingDecisionDetails;
    promissoryNote?: PromissoryNoteDetails;

    createdAt: string;
    updatedAt: string;
    status: DealStatus;
    dueDiligenceChecklistVersion: number;
    dueDiligenceChecks: ChecklistInstance;
    fundingProgress: FundingProgress[];
}

export interface InvoiceDto {
    invoiceNumber: string;
    amount: number;
    dateRaised: string;
    dueDate: string;
    invoiceTo: CompanyDto;
    fileUrl: string;
}

export interface CompanyDto {
    name: string;
    address: string;
    country: string;
}

// Todo: These should be enums
export type FundingDecision = 'Pending' | 'Approved' | 'Declined' ;
export type DecisionType = 'Approve' | 'Decline' | 'Refer';

export type DealStatus = 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'AWAITING_AGREEMENT' | 'FUNDING_REQUESTED' | 'FUNDS_RELEASED' | 'LOAN_REPAID' | 'WITHDRAWN';

export interface AccountDetails {
    id: string;
    accountName: string;
    emailAddress: string;
    walletAddress: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface InvoiceDocument {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    documentReference: string;
    status: string;
    documentContent: InvoiceContent;
    claimants: Claimants;
    issuedFile: IssuedFileDetails;
    issueDetails: IssueDetails;
}

export interface BillToDetails {
    companyName: string;
    streetAddress: string;
    city: string;
    country: string;
}

export interface InvoiceContent {
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date;
    terms: string;
    currencyCode: string;
    invoiceTotal: number;
    billTo: BillToDetails;
}

export interface Claimants {
    owner: Claimant;
    beneficiary: Claimant;
}

export interface Claimant {
    walletAddress: string;
    name: string;
    contactEmail: string;
}

export interface IssuedFileDetails {
    mimeType: string;
    originalFileName: string;
}

export interface IssueDetails {
    dateIssued: Date;
    chainId: number;
    contractAddress: string;
    transactionHash: string;
    merkleRoot: string;
}

export interface DealDetails {
    id: string;
    dealReference: string;
    accountId: string;
    loanDetails: LoanDetails;
    documentsIds: string[];
    totalValue: number;
    dealStatus: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface LoanDetails {
    currency: string;
    loanAmount: number;
    loanDurationDays: number;
    loanCollateralAmount: number;
}

export interface DealResponse {
    processingDetails: DealDto;
    accountDetails: AccountDetails;
    dealDetails: DealDetails;
    invoiceDocuments: InvoiceDocument[];
}
export interface FundingProgress {
    status: DealStatus;
    timestamp: string;
    notes?: string;
    amount?: number;
    reference?: string;
}