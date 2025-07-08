"use client";

import { useState } from "react";
import { AccountStatusBadge } from "@/components/customer-accounts/account-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { 
  ChevronDown, 
  ChevronUp,
  EyeIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountsSummaryDto } from "@/lib/types/accounts.types";
import { SearchMetadata } from "@/lib/types/search.types";

interface AccountsTableProps {
  accounts: AccountsSummaryDto[];
  metadata?: SearchMetadata;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
}

type SortField = "accountName" | "status" | "createdAt" | "updatedAt";
type SortDirection = "asc" | "desc";

export function AccountsTable({ accounts, metadata, onPageChange, isLoading }: AccountsTableProps) {
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
  
  const sortedAccounts = [...accounts].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case "accountName":
        comparison = a.accountName.localeCompare(b.accountName);
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
      case "createdAt":
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case "updatedAt":
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
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
                    Account Name
                    <SortIcon field="accountName" />
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
                <TableHead 
                  className="cursor-pointer hover:bg-muted/70"
                  onClick={() => handleSort("createdAt")}
                >
                  <div className="flex items-center">
                    Created
                    <SortIcon field="createdAt" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/70"
                  onClick={() => handleSort("updatedAt")}
                >
                  <div className="flex items-center">
                    Last Updated
                    <SortIcon field="updatedAt" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : sortedAccounts.length > 0 ? (
                sortedAccounts.map((account) => {
                  const createdDate = new Date(account.createdAt);
                  const updatedDate = new Date(account.updatedAt);
                  const createdAge = formatDistanceToNow(createdDate, { addSuffix: true });
                  const updatedAge = formatDistanceToNow(updatedDate, { addSuffix: true });
                  
                  return (
                    <TableRow key={account.id} className="group hover:bg-muted/50">
                      <TableCell className="font-medium">{account.accountName}</TableCell>
                      <TableCell>
                        <AccountStatusBadge status={account.status} />
                      </TableCell>
                      <TableCell>{createdAge}</TableCell>
                      <TableCell>{updatedAge}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <Link href={`/customer-accounts/${account.id}`}>
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
                  <TableCell colSpan={5} className="h-24 text-center">
                    No accounts found.
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