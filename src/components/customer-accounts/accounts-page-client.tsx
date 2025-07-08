"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { AccountsSummaryDto } from "@/lib/types/accounts.types";
import { SearchMetadata, SearchOptions } from "@/lib/types/search.types";
import { AccountsTable } from "@/components/customer-accounts/accounts-table";
import { Input } from "@/components/ui/input";
import { searchAccounts } from "@/lib/actions/accounts.actions";

interface AccountsPageClientProps {
  initialAccounts: AccountsSummaryDto[];
  initialMetadata: SearchMetadata;
}

export function AccountsPageClient({ initialAccounts, initialMetadata }: AccountsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [accounts, setAccounts] = useState<AccountsSummaryDto[]>(initialAccounts);
  const [metadata, setMetadata] = useState<SearchMetadata>(initialMetadata);
  const [isLoading, setIsLoading] = useState(false);
  const [searchValue, setSearchValue] = useState(searchParams.get('queryTerm') || '');
  
  // Get current search options from URL
  const getCurrentSearchOptions = (): SearchOptions => ({
    queryTerm: searchParams.get('queryTerm') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    orderBy: searchParams.get('orderBy') || undefined,
    orderDirection: (searchParams.get('orderDirection') as 'asc' | 'desc') || undefined,
  });

  // Update URL with new search options
  const updateSearchParams = (options: Partial<SearchOptions>) => {
    const current = getCurrentSearchOptions();
    const newOptions = { ...current, ...options };
    
    const params = new URLSearchParams();
    if (newOptions.queryTerm) params.set('queryTerm', newOptions.queryTerm);
    if (newOptions.page && newOptions.page !== 1) params.set('page', newOptions.page.toString());
    if (newOptions.limit && newOptions.limit !== 10) params.set('limit', newOptions.limit.toString());
    if (newOptions.orderBy) params.set('orderBy', newOptions.orderBy);
    if (newOptions.orderDirection) params.set('orderDirection', newOptions.orderDirection);
    
    const queryString = params.toString();
    const newUrl = queryString ? `/customer-accounts?${queryString}` : '/customer-accounts';
    router.push(newUrl);
  };

  // Fetch accounts with current search options
  const fetchAccounts = async (options: SearchOptions) => {
    setIsLoading(true);
    try {
      const response = await searchAccounts(options);
      setAccounts(response.data);
      setMetadata(response.metadata);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search handler
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (queryTerm: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          updateSearchParams({ queryTerm: queryTerm || undefined, page: 1 });
        }, 300);
      };
    })(),
    []
  );

  // Handle search input
  const handleSearch = (queryTerm: string) => {
    setSearchValue(queryTerm);
    debouncedSearch(queryTerm);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    updateSearchParams({ page });
  };

  // Handle sorting
  const handleSort = (orderBy: string, orderDirection: 'asc' | 'desc') => {
    updateSearchParams({ orderBy, orderDirection });
  };

  // Handle limit change
  const handleLimitChange = (limit: number) => {
    updateSearchParams({ limit, page: 1 });
  };

  // Effect to fetch accounts when URL changes
  useEffect(() => {
    const options = getCurrentSearchOptions();
    fetchAccounts(options);
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Customer Accounts</h2>
        <p className="text-muted-foreground">
          View and manage all customer accounts.
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search accounts..."
              className="w-full md:w-[300px] pl-8"
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          
          <Select
            value={searchParams.get('limit') || '10'}
            onValueChange={(value) => handleLimitChange(parseInt(value))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="sr-only">Filter accounts</span>
          </Button>
        </div>
      </div>
      
      {/* Accounts Table */}
      <AccountsTable 
        accounts={accounts} 
        metadata={metadata}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />
    </div>
  );
} 