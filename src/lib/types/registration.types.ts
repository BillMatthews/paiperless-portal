
export enum RegistrationDocumentType {
    PROOF_OF_ADDRESS = "ProofOfAddress",
    COMPANY_REGISTRATION_CERTIFICATE = "CompanyRegistrationCertificate",
    PROOF_OF_IDENTITY = "ProofOfIdentity",
}

export enum RegistrationStatus {
    READY_FOR_ONBOARDING="READY_FOR_ONBOARDING"
}

export interface AddressRegistrationDetails {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

export interface CompanyRegistrationDetails {
    name: string;
    address: AddressRegistrationDetails;
    website: string;
    accountWalletAddress: string;
}

export interface ContactRegistrationDetails {
    name: string;
    position: string;
    phone: string;
    email:string;
}

export interface RegistrationDocumentDetails {
    _id: string;
    originalFileName: string;
    documentType: RegistrationDocumentType;
    mimeType: string;
    size: number;
    status: string;
    createdAt: Date;
}

export interface RegistrationDetails {
    _id: string;
    registrationId: string;
    company: CompanyRegistrationDetails;
    contact: ContactRegistrationDetails;
    status: RegistrationStatus;
    documents: RegistrationDocumentDetails[]
}