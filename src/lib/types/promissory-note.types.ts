export enum PromissoryNoteStatus {
    IN_PROGRESS="In Progress",
    ISSUED="Issued",
    PROCESSING="Processing",
    SIGNED="Signed"
}
export interface PromissoryNoteContent {
    noteReference: string,
    issueDate: Date,
    maturityDate: Date,
    lender: {
        name: string,
        address?: string,
        country: string,
        contactEmail?: string,

    },
    borrower: {
        name: string,
        address?: string,
        country: string,
        contactEmail?: string,
    },
    loanDetails: {
        amount: {
            value: number,
            currency: string
        },
        placeOfPayment?: string,
        interestRate: number,
        paymentTerms: string,
    },
    specialConditions: string

}

export interface DealPromissoryNoteDetails {
    documentId: string,
    content: PromissoryNoteContent;
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

export const  InitialPromissoryNoteContent: PromissoryNoteContent= {
    noteReference: '',
    issueDate: new Date(),
    maturityDate: new Date(),
    lender: {
        name: '',
        address: '',
        country: '',
        contactEmail: '',

    },
    borrower: {
        name: '',
        address: '',
        country: '',
        contactEmail: '',
    },
    loanDetails: {
        amount: {
            value: 0,
            currency: "USD"
        },
        placeOfPayment: '',
        interestRate: 0,
        paymentTerms: '',
    },
    specialConditions: '',

}