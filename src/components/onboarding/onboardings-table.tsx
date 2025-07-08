import {SearchMetadata} from "@/lib/types/search.types";
import {useState} from "react";
import {ChevronDown, ChevronLeft, ChevronRight, ChevronUp, EyeIcon} from "lucide-react";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {formatDistanceToNow} from "date-fns";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {OnboardingDto} from "@/lib/types/onboarding.types";
import {OnboardingStatusBadge} from "@/components/onboarding/onboarding-status-badge";

interface OnboardingsTableProps {
    onboardings: OnboardingDto[];
    metadata?: SearchMetadata
    onPageChange?: (page: number) => void;
    isLoading?: boolean;
}

type SortField = "companyName" | "createdOn" | "status";
type SortDirection = "asc" | "desc";

export function OnboardingsTable({onboardings, metadata, onPageChange, isLoading}: OnboardingsTableProps) {

    const [sortField, setSortField] = useState<SortField>("companyName");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    const handleSort = (field: SortField) => {
        if (field === sortField) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const sortedOnboardings = [...onboardings].sort((a, b) => {
        let comparison = 0;

        switch (sortField) {
            case "companyName":
                comparison = a.companyName.localeCompare(b.companyName);
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
                                    onClick={() => handleSort("companyName")}
                                >
                                    <div className="flex items-center">
                                        Company
                                        <SortIcon field="companyName" />
                                    </div>
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
                            ) : sortedOnboardings.length > 0 ? (
                                sortedOnboardings.map((onboarding) => {
                                    const createdDate = new Date(onboarding.createdAt);
                                    const onboardingAge = formatDistanceToNow(createdDate, { addSuffix: false });

                                    return (
                                        <TableRow key={onboarding._id} className="group hover:bg-muted/50">
                                            <TableCell className="font-medium">{onboarding.companyName}</TableCell>
                                            <TableCell>{onboardingAge}</TableCell>
                                            <TableCell>
                                                <OnboardingStatusBadge status={onboarding.status} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    asChild
                                                >
                                                    <Link href={`/onboarding/${onboarding._id}`}>
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
                                        No onboardings found.
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