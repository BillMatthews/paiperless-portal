"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import {DealDto} from "@/lib/types/deal-desk.types";
import {SearchMetadata, SearchOptions} from "@/lib/types/search.types";
import {DealsTable} from "@/components/deal-desk/deals-table";
import {Input} from "@/components/ui/input";
import {getDeals} from "@/lib/actions/deal-desk.actions";

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
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  // Get current search options from URL
  const getCurrentSearchOptions = useCallback((): SearchOptions => ({
    queryTerm: searchParams.get('queryTerm') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    orderBy: searchParams.get('orderBy') || undefined,
    orderDirection: (searchParams.get('orderDirection') as 'asc' | 'desc') || undefined,
  }), [searchParams]);

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
    const newUrl = queryString ? `/deal-desk?${queryString}` : '/deal-desk';
    router.push(newUrl);
  };

  // Fetch deals with current search options
  const fetchDeals = async (options: SearchOptions) => {
    setIsLoading(true);
    try {
      const {data, metadata} = await getDeals(options);
      setDeals(data);
     setMetadata(metadata);

    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input
  const handleSearchInput = (queryTerm: string) => {
    setSearchValue(queryTerm);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      updateSearchParams({ queryTerm: queryTerm || undefined, page: 1 });
    }, 300);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    updateSearchParams({ page });
  };



  // Handle limit change
  const handleLimitChange = (limit: number) => {
    updateSearchParams({ limit, page: 1 });
  };

  // Effect to fetch deals when URL changes
  useEffect(() => {
    const options = getCurrentSearchOptions();
    fetchDeals(options);
  }, [searchParams, getCurrentSearchOptions]);

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
              onChange={(e) => handleSearchInput(e.target.value)}
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