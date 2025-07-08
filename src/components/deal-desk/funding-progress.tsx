"use client";

import { useState } from "react";
import { DealDto } from "@/lib/types/deal-desk.types";
import { updateFundingProgress } from "@/lib/actions/deal-desk.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle2 } from "lucide-react";

// ToDo: Need to complete this once we know how the funding will be tracked
//  For the time being we can store a fundingProgress structure (status, timestamp, notes) and use this page to move the funding along
interface FundingProgressProps {
  deal: DealDto;
}

export function FundingProgress({ deal }: FundingProgressProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow = {
      'Ready for Funds Release': 'Funds Released',
      'Funds Released': 'Loan Repaid',
      'Loan Repaid': 'Deal Complete'
    };
    return statusFlow[currentStatus as keyof typeof statusFlow] || null;
  };

  const handleUpdateProgress = async () => {
    const nextStatus = getNextStatus(deal.status);
    if (!nextStatus) return;

    try {
      setIsUpdating(true);
      await updateFundingProgress(deal.dealId, {
        status: nextStatus,
        amount: amount ? parseFloat(amount) : undefined,
        reference,
        notes,
      });

      toast({
        title: "Success",
        description: "Funding progress updated successfully",
      });

      // Reset form
      setAmount("");
      setReference("");
      setNotes("");
      
      router.refresh();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update funding progress",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const renderProgressForm = () => {
    const nextStatus = getNextStatus(deal.status);
    if (!nextStatus) return null;

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Update Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(nextStatus === 'Funds Released' || nextStatus === 'Loan Repaid') && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Reference</label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Enter reference number"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any relevant notes"
            />
          </div>

          <Button
            className="w-full"
            onClick={handleUpdateProgress}
            disabled={isUpdating}
          >
            {isUpdating ? "Updating..." : `Mark as ${nextStatus}`}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">Funding Progress</h3>
          <div className="space-y-4">
            {deal.fundingProgress?.map((progress, index) => (
              <div
                key={progress.timestamp}
                className="flex items-start gap-4 relative"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                
                {index < (deal.fundingProgress?.length || 0) - 1 && (
                  <div className="absolute left-4 top-8 w-[1px] h-full -ml-[1px] bg-border" />
                )}

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{progress.status}</p>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(progress.timestamp), "PPp")}
                    </span>
                  </div>
                  
                  {progress.amount && (
                    <p className="text-sm">
                      Amount: {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(progress.amount)}
                    </p>
                  )}
                  
                  {progress.reference && (
                    <p className="text-sm">Reference: {progress.reference}</p>
                  )}
                  
                  {progress.notes && (
                    <p className="text-sm text-muted-foreground">{progress.notes}</p>
                  )}
                </div>
              </div>
            ))}

            {deal.status !== 'COMPLETED' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                <ArrowRight className="h-4 w-4" />
                <span>Next: {getNextStatus(deal.status)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {deal.status !== "COMPLETED" && renderProgressForm()}
    </div>
  );
}