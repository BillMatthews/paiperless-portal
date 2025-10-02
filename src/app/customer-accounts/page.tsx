import { searchAccounts } from "@/lib/actions/accounts.actions";
import { AccountsPageClient } from "@/components/customer-accounts/accounts-page-client";
import { AccountsErrorBoundary } from "@/components/customer-accounts/accounts-error-boundary";
import { AccountsSearchResponse } from "@/lib/types/search.types";

// Force dynamic rendering to avoid static generation issues with cookies
export const dynamic = 'force-dynamic';

export default async function CustomerAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await searchParams before accessing its properties
  const params = await searchParams;
  
  // Get search parameters from URL
  const queryTerm = typeof params.queryTerm === 'string' ? params.queryTerm : undefined;
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
  const limit = typeof params.limit === 'string' ? parseInt(params.limit) : 10;
  const orderBy = typeof params.orderBy === 'string' ? params.orderBy : undefined;
  const orderDirection = typeof params.orderDirection === 'string' ? params.orderDirection as 'asc' | 'desc' : undefined;

  // Default fallback data
  const fallbackData: AccountsSearchResponse = {
    data: [],
    metadata: {
      page: 1,
      totalPages: 1,
      limit: 10,
    },
  };

  let initialData: AccountsSearchResponse;

  try {
    // Fetch initial accounts data
    initialData = await searchAccounts({
      queryTerm,
      page,
      limit,
      orderBy,
      orderDirection,
    });

    // Ensure we have valid data structure
    if (!initialData || !initialData.data || !initialData.metadata) {
      console.warn('Invalid response structure from searchAccounts, using fallback data');
      initialData = fallbackData;
    }
  } catch (error) {
    console.error('Error fetching accounts:', error);
    initialData = fallbackData;
  }

  return (
    <AccountsErrorBoundary>
      <AccountsPageClient initialAccounts={initialData.data} initialMetadata={initialData.metadata} />
    </AccountsErrorBoundary>
  );
} 