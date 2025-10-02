import {DealDto} from "@/lib/types/deal-desk.types";
import {OnboardingDto} from "@/lib/types/onboarding.types";
import { AccountsSummaryDto} from "@/lib/types/accounts.types";


export interface SearchOptions {
    queryTerm?: string;
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }

  export interface SearchMetadata {
    page: number;
    totalPages: number;
    limit: number;
  }

export interface DealsSearchResponse {
    data: DealDto[];
    metadata: SearchMetadata;
}
export interface OnboardingsSearchResponse {
    data: OnboardingDto[];
    metadata: SearchMetadata;
}


export interface AccountsSearchResponse {
    data: AccountsSummaryDto[],
    metadata: SearchMetadata;
}