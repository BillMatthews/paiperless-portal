"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {DecisionType, FundingDecisionDetails} from "@/lib/types/deal-desk.types";
import {ChecklistInstance, CheckStatus} from "@/lib/types/checklist.types";
import {updateDealDecision} from "@/lib/actions/deal-desk.actions";

interface DealDecisionProps {
  dealId: string;
  checklist: ChecklistInstance;
  dealStatus: string;
  fundingDecision?: FundingDecisionDetails;
}

function ChecklistSummary({ checklist }: { checklist: ChecklistInstance }) {
  const isCheckComplete = (status: CheckStatus) => {
    // Convert the status to uppercase for comparison since that's what we get from the database
    const upperStatus = status.toUpperCase();
    return upperStatus === "SATISFACTORY" || upperStatus === "ADVERSE";
  }

  return (
    <Accordion type="single" collapsible className="space-y-4">
      {checklist.sections.map((section) => (
        <AccordionItem key={section.title} value={section.title} className="border rounded-lg">
          <AccordionTrigger className="px-4">{section.title}</AccordionTrigger>
          <AccordionContent className="space-y-4 px-4 pb-4">
            {section.items.map((item) => (
              <div
                key={item.title}
                className={`p-4 rounded-lg ${
                  !isCheckComplete(item.status as CheckStatus)
                    ? "bg-amber-50 dark:bg-amber-950"
                    : "bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.title}</span>
                  <span
                    className={`text-sm font-medium ${
                      !isCheckComplete(item.status as CheckStatus)
                        ? "text-amber-600 dark:text-amber-400"
                        : ""
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                {item.notes && item.notes.length > 0 && (
                  <Accordion type="single" collapsible className="mt-2">
                    <AccordionItem value="notes">
                      <AccordionTrigger className="text-sm">
                        View Notes ({item.notes.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 mt-2">
                          {item.notes.map((note, index) => (
                            <div
                              key={`${note.createdAt}-${index}`}
                              className="text-sm bg-background p-3 rounded-md space-y-1"
                            >
                              <p className="text-muted-foreground text-xs">
                                {format(new Date(note.createdAt), "PPp")}
                              </p>
                              <p>{note.note}</p>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function DealDecision({ dealId, checklist, dealStatus, fundingDecision }: DealDecisionProps) {
  const [decision, setDecision] = useState<DecisionType | "">(fundingDecision?.decision as DecisionType || "");
  const [notes, setNotes] = useState(fundingDecision?.decisionNotes?.note || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const isChecklistComplete = () => {
    // Flatten all items from all sections into a single array
    const allItems = checklist.sections.flatMap(section => section.items);
    
    // Check if every item has a status of either SATISFACTORY or ADVERSE
    return allItems.every(item => {
      const upperStatus = (item.status as string).toUpperCase();
      return upperStatus === "SATISFACTORY" || upperStatus === "ADVERSE";
    });
  };

  const isEditable = dealStatus === "NEW" || dealStatus === "IN_PROGRESS";

  const handleSubmit = async () => {
    if (decision && notes.trim()) {
      try {
        setIsSubmitting(true);
        await updateDealDecision(dealId, decision, notes.trim());
        
        toast({
          title: "Decision submitted",
          description: `Deal status updated to ${decision === "Approve" ? "Awaiting Agreement" : decision}`,
        });
        
        // Reset form and refresh the page
        setDecision("");
        setNotes("");
        router.refresh();
      } catch {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to submit decision. Please try again.",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Deal Decision</h3>
      </div>

      {!isChecklistComplete() && isEditable && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            All due diligence checks must be completed before making a decision.
          </AlertDescription>
        </Alert>
      )}

      <ChecklistSummary checklist={checklist} />

      <div className="space-y-4 mt-8">
        <div className="space-y-2">
          <label className="text-sm font-medium">Decision</label>
          {isEditable ? (
            <Select
              value={decision}
              onValueChange={(value) => setDecision(value as DecisionType)}
              disabled={!isChecklistComplete()}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Approve">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    Approve
                  </div>
                </SelectItem>
                <SelectItem value="Decline">
                  <div className="flex items-center">
                    <XCircle className="h-4 w-4 mr-2 text-red-500" />
                    Decline
                  </div>
                </SelectItem>
                <SelectItem value="Refer">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                    Refer
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="p-2 bg-muted rounded-md">
              <div className="flex items-center">
                {decision === "Approve" && <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />}
                {decision === "Decline" && <XCircle className="h-4 w-4 mr-2 text-red-500" />}
                {decision === "Refer" && <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />}
                {decision}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Decision Notes</label>
          {isEditable ? (
            <Textarea
              placeholder="Enter your decision notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
              disabled={!isChecklistComplete()}
            />
          ) : (
            <div className="p-3 bg-muted rounded-md min-h-[100px]">
              {notes}
            </div>
          )}
        </div>

        {isEditable && (
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!isChecklistComplete() || !decision || !notes.trim() || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Decision"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}