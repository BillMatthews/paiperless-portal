"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import {DealDto} from "@/lib/types/deal-desk.types";
import {SearchMetadata, SearchOptions} from "@/lib/types/search.types";
import {DealsTable} from "@/components/deal-desk/deals-table";
import {Input} from "@/components/ui/input";

interface DealsPageClientProps {
  initialDeals: DealDto[];
  initialMetadata: SearchMetadata;
}

export function DealsPageClient({ initialDeals, initialMetadata }: DealsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [deals, setDeals] = useState<DealDto[]>(initialDeals);
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
    const newUrl = queryString ? `/dashboard/deals?${queryString}` : '/dashboard/deals';
    router.push(newUrl);
  };

  // Fetch deals with current search options
  const fetchDeals = async (options: SearchOptions) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/deals?${new URLSearchParams({
        ...(options.queryTerm && { queryTerm: options.queryTerm }),
        page: (options.page || 1).toString(),
        limit: (options.limit || 10).toString(),
        ...(options.orderBy && { orderBy: options.orderBy }),
        ...(options.orderDirection && { orderDirection: options.orderDirection }),
      })}`);
      
      if (response.ok) {
        const data = await response.json();
        setDeals(data.data);
        setMetadata(data.metadata);
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
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

  // Effect to fetch deals when URL changes
  useEffect(() => {
    const options = getCurrentSearchOptions();
    fetchDeals(options);
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Deals</h2>
        <p className="text-muted-foreground">
          View and manage all trade finance deals.
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search deals..."
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
            <span className="sr-only">Filter deals</span>
          </Button>
        </div>
      </div>
      
      {/* Deals Table */}
      <DealsTable 
        deals={deals} 
        metadata={metadata}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />
    </div>
  );
} 