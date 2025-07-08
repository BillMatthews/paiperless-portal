"use client";

import { useState } from "react";
import { DealStatusBadge } from "@/components/deal-desk/deal-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { 
  ChevronDown, 
  ChevronUp,
  EyeIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {DealDto} from "@/lib/types/deal-desk.types";
import {SearchMetadata} from "@/lib/types/search.types";

interface DealsTableProps {
  deals: DealDto[];
  metadata?: SearchMetadata;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
}

type SortField = "accountName" | "dealReference" | "totalInvoiceValue" | "requestedLoanAmount" | "createdOn" | "status";
type SortDirection = "asc" | "desc";

export function DealsTable({ deals, metadata, onPageChange, isLoading }: DealsTableProps) {
  const [sortField, setSortField] = useState<SortField>("accountName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedDeals = [...deals].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case "accountName":
        comparison = a.accountName.localeCompare(b.accountName);
        break;
      case "totalInvoiceValue":
        comparison = a.invoiceTotal - b.invoiceTotal;
        break;
      case "requestedLoanAmount":
        comparison = a.loanAmount - b.loanAmount;
        break;
      case "createdOn":
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
    }
    
    return sortDirection === "asc" ? comparison : -comparison;
  });
  
  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) return null;
    return sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />;
  };
  
  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <div className="relative overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/70"
                  onClick={() => handleSort("accountName")}
                >
                  <div className="flex items-center">
                    Company
                    <SortIcon field="accountName" />
                  </div>
                </TableHead>
                <TableHead
                    className="cursor-pointer hover:bg-muted/70"
                    onClick={() => handleSort("dealReference")}
                >
                  <div className="flex items-center">
                    Deal Reference
                    <SortIcon field="dealReference" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/70"
                  onClick={() => handleSort("totalInvoiceValue")}
                >
                  <div className="flex items-center">
                    Invoice Value
                    <SortIcon field="totalInvoiceValue" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/70"
                  onClick={() => handleSort("requestedLoanAmount")}
                >
                  <div className="flex items-center">
                    Loan Amount
                    <SortIcon field="requestedLoanAmount" />
                  </div>
                </TableHead>
                <TableHead>
                  Duration
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/70"
                  onClick={() => handleSort("createdOn")}
                >
                  <div className="flex items-center">
                    Age
                    <SortIcon field="createdOn" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/70"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    Status
                    <SortIcon field="status" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : sortedDeals.length > 0 ? (
                sortedDeals.map((deal) => {
                  const createdDate = new Date(deal.createdAt);
                  const dealAge = formatDistanceToNow(createdDate, { addSuffix: false });
                  
                  return (
                    <TableRow key={deal.dealId} className="group hover:bg-muted/50">
                      <TableCell className="font-medium">{deal.accountName}</TableCell>
                      <TableCell className="font-medium">{deal.dealReference}</TableCell>
                      <TableCell>{formatCurrency(deal.invoiceTotal)}</TableCell>
                      <TableCell>{formatCurrency(deal.loanAmount)}</TableCell>
                      <TableCell>{deal.loanTerm} days</TableCell>
                      <TableCell>{dealAge}</TableCell>
                      <TableCell>
                        <DealStatusBadge status={deal.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <Link href={`/deal-desk/deal/${deal._id}`}>
                            <EyeIcon className="h-4 w-4" />
                            <span className="sr-only">View details</span>
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No deals found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Pagination Controls */}
      {metadata && metadata.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {metadata.page} of {metadata.totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={metadata.page <= 1 || isLoading}
              onClick={() => onPageChange?.(metadata.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={metadata.page >= metadata.totalPages || isLoading}
              onClick={() => onPageChange?.(metadata.page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}