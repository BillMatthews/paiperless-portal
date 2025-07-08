"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {AlertTriangle, CheckCircle2, XCircle} from "lucide-react";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {useToast} from "@/hooks/use-toast";
import {useRouter} from "next/navigation";
import {ChecklistInstance} from "@/lib/types/checklist.types";
import {OnboardingDecisionDetails, OnboardingDecisionState, OnboardingStatus} from "@/lib/types/onboarding.types";
import {ChecklistSummary} from "@/components/checklist-summary";
import {updateOnboardingDecision} from "@/lib/actions/onboarding.actions";

interface OnboardingDecisionProps {
  onboardingId: string;
  checklist: ChecklistInstance;
  onboardingStatus: OnboardingStatus;
  onboardingDecision?: OnboardingDecisionDetails;
}

export function OnboardingDecision({ onboardingId, checklist, onboardingStatus, onboardingDecision }: OnboardingDecisionProps) {
  const [decision, setDecision] = useState<OnboardingDecisionState|null>(onboardingDecision?.decision || null);
  const [notes, setNotes] = useState(onboardingDecision?.decisionNotes?.note || "");
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

  const isEditable = onboardingStatus === OnboardingStatus.NEW || onboardingStatus === OnboardingStatus.IN_PROGRESS;

  const handleSubmit = async () => {
    if (decision && notes.trim()) {
      try {
        setIsSubmitting(true);
        await updateOnboardingDecision(onboardingId, decision, notes.trim());
        
        toast({
          title: "Decision submitted",
          description: `Onboarding status updated to ${decision === (OnboardingDecisionState.APPROVED || OnboardingDecisionState.DECLINED) ? "Completed" : "Pending"}`,
        });
        
        // Reset form and refresh the page
        router.push('/onboarding');
      } catch{
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
        <h3 className="text-lg font-medium">Onboarding Decision</h3>
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
              value={decision?.toString()}
              onValueChange={(value) => setDecision(value as OnboardingDecisionState)}
              disabled={!isChecklistComplete()}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={OnboardingDecisionState.APPROVED}>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    Approve
                  </div>
                </SelectItem>
                <SelectItem value={OnboardingDecisionState.DECLINED}>
                  <div className="flex items-center">
                    <XCircle className="h-4 w-4 mr-2 text-red-500" />
                    Decline
                  </div>
                </SelectItem>
                <SelectItem value={OnboardingDecisionState.PENDING}>
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                    Pending
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="p-2 bg-muted rounded-md">
              <div className="flex items-center">
                {decision === OnboardingDecisionState.APPROVED && <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />}
                {decision === OnboardingDecisionState.DECLINED && <XCircle className="h-4 w-4 mr-2 text-red-500" />}
                {decision === OnboardingDecisionState.PENDING && <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />}
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