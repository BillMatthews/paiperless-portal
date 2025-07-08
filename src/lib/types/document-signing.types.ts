export enum DocumentSigningStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    SIGNED = "SIGNED",
    EXPIRED = "EXPIRED",
    REVOKED = "REVOKED",
    UNKNOWN = "UNKNOWN,"
}
export enum SigningPartyRole {
    ISSUER = "ISSUER",
    SIGNER = "SIGNER",
}
export interface DocumentSigningContractDetails {
    rpcUrl: string,
    contractAddress: string,
    documentId: string,
    chainId: number
}

export interface SigningPartyDetails {
    walletAddress: string;
    name?: string;
    role: SigningPartyRole;
}

export interface SigningEventDetailsDto {
    description: string;
    accountId: string;
    documentId: string;
    expiryDate: Date;
    parties: SigningPartyDetails[]
    lastKnownStatus: DocumentSigningStatus;
    contractDetails: DocumentSigningContractDetails;
    createdAt: Date;
    updatedAt: Date;
}