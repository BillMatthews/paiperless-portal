import {AddressRegistrationDetails} from "@/lib/types/registration.types";


export interface AccountContactDetails {
    name: string;
    position: string;
    emailAddress: string;
    phone?: string;
}

export interface AccountCompanyAddressDetails {
    street: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
}
export interface AccountCompanyDetails {
    name: string;
    address: AddressRegistrationDetails;
    website: string;
}

export enum AccountStatus{
    ACTIVE='ACTIVE',
    SUSPENDED='SUSPENDED',
    UNDER_REVIEW='UNDER_REVIEW',
    CLOSED='CLOSED',
}

export interface AccountsSummaryDto {
    id: string;
    accountName: string;
    status: AccountStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface AccountDetailsDto {
    id: string;
    accountName: string;
    walletAddress: string;
    company: AccountCompanyDetails;
    contact: AccountContactDetails;
    status: AccountStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface AccountUpdatesDto {
    status: AccountStatus;
}