"use client";

import { useEffect, useState } from "react";
import { AccountDetails, DealDetails, DealDto } from "@/lib/types/deal-desk.types";
import {
  issuePromissoryNote,
  savePromissoryNote,
} from "@/lib/actions/deal-desk.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  InitialPromissoryNoteContent,
  PromissoryNoteContent,
  PromissoryNoteStatus
} from "@/lib/types/promissory-note.types";

interface PromissoryNoteEditorProps {
  accountDetails: AccountDetails;
  dealDetails: DealDetails;
  processingDetails: DealDto;
}

export function PromissoryNoteEditor({
  processingDetails 
}: PromissoryNoteEditorProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);

  const [formData, setFormData] = useState<PromissoryNoteContent>(
    processingDetails.promissoryNote?.content || InitialPromissoryNoteContent
  );

  const handleChange = (
    field: string,
    value: string | number,
    section?: "borrower" | "lender" | "loanDetails"
  ) => {
    setFormData((prev) => {
      if (section) {
        if (section === "loanDetails") {
          return {
            ...prev,
            loanDetails: {
              ...prev.loanDetails,
              [field]: value,
            },
          };
        }
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value,
          },
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleRevertChanges = () => {
    if (processingDetails.promissoryNote?.content) {
      const savedNote = processingDetails.promissoryNote.content;
      setFormData(prev => ({
        ...prev,
        loanDetails: {
          ...prev.loanDetails,
          interestRate: savedNote.loanDetails.interestRate,
          paymentTerms: savedNote.loanDetails.paymentTerms || "",
        },
        specialConditions: savedNote.specialConditions || "",
      }));
    } else {
      // If no saved note exists, reset to initial values
      setFormData(prev => ({
        ...prev,
        loanDetails: {
          ...prev.loanDetails,
          interestRate: 5.5,
          paymentTerms: "",
        },
        specialConditions: "",
      }));
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await savePromissoryNote(processingDetails._id, { content: formData });
      
      // Refresh the page to get the latest data
      router.refresh();
      
      toast({
        title: "Success",
        description: "Promissory note saved successfully",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save promissory note",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Add effect to update form data when processingDetails changes
  useEffect(() => {
    if (processingDetails.promissoryNote?.content) {
      const savedNote = processingDetails.promissoryNote.content;
      setFormData(prev => ({
        ...prev,
        loanDetails: {
          ...prev.loanDetails,
          interestRate: savedNote.loanDetails.interestRate,
          paymentTerms: savedNote.loanDetails.paymentTerms || "",
        },
        specialConditions: savedNote.specialConditions || "",
      }));
    }
  }, [processingDetails.promissoryNote]);

  const handleIssue = async () => {
    try {
      setIsIssuing(true);
      await issuePromissoryNote(processingDetails._id);
      toast({
        title: "Success",
        description: "Promissory note issued successfully",
      });
      router.refresh();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to issue promissory note",
      });
    } finally {
      setIsIssuing(false);
    }
  };

  const hasUnsavedChanges = () => {
    if (!processingDetails.promissoryNote?.content) return true;
    
    const currentNote = processingDetails.promissoryNote.content;
    return (
      JSON.stringify(currentNote.borrower) !== JSON.stringify(formData.borrower) ||
      JSON.stringify(currentNote.lender) !== JSON.stringify(formData.lender) ||
      JSON.stringify(currentNote.loanDetails) !== JSON.stringify(formData.loanDetails) ||
      currentNote.issueDate !== formData.issueDate ||
      currentNote.maturityDate !== formData.maturityDate ||
      currentNote.specialConditions !== formData.specialConditions
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Borrower Details</h3>
          <div className="space-y-2">
            <Label htmlFor="borrowerName">Company Name</Label>
            <Input
              id="borrowerName"
              value={formData.borrower?.name}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="borrowerAddress">Address</Label>
            <Textarea
              id="borrowerAddress"
              value={formData.borrower?.address}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="borrowerCountry">Country</Label>
            <Input
              id="borrowerCountry"
              value={formData.borrower?.country}
              readOnly
              className="bg-muted"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Lender Details</h3>
          <div className="space-y-2">
            <Label htmlFor="lenderName">Company Name</Label>
            <Input
              id="lenderName"
              value={formData.lender?.name}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lenderAddress">Address</Label>
            <Textarea
              id="lenderAddress"
              value={formData.lender?.address}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lenderCountry">Country</Label>
            <Input
              id="lenderCountry"
              value={formData.lender?.country}
              readOnly
              className="bg-muted"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Loan Details</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={formData.loanDetails.amount.value}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              value={formData.loanDetails.amount.currency}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issueDate">Issue Date</Label>
            <Input
              id="issueDate"
              type="date"
              value={format(new Date(formData.issueDate), 'yyyy-MM-dd')}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maturityDate">Maturity Date</Label>
            <Input
              id="maturityDate"
              type="date"
              value={format(new Date(formData.maturityDate), 'yyyy-MM-dd')}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="interestRate">Interest Rate (%)</Label>
            <Input
              id="interestRate"
              type="number"
              step="0.1"
              value={formData.loanDetails.interestRate}
              onChange={(e) =>
                handleChange("interestRate", parseFloat(e.target.value), "loanDetails")
              }
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Terms and Conditions</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <Textarea
              id="paymentTerms"
              value={formData.loanDetails.paymentTerms}
              onChange={(e) => handleChange("paymentTerms", e.target.value, "loanDetails")}
              className="min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialConditions">Special Conditions</Label>
            <Textarea
              id="specialConditions"
              value={formData.specialConditions}
              onChange={(e) => handleChange("specialConditions", e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button 
          variant="outline" 
          onClick={handleRevertChanges}
          disabled={!hasUnsavedChanges()}
        >
          Revert Changes
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Draft"}
        </Button>
        <Button
          onClick={handleIssue}
          disabled={ isIssuing || (processingDetails.promissoryNote?.status as PromissoryNoteStatus) === PromissoryNoteStatus.ISSUED || hasUnsavedChanges()}
        >
          {isIssuing ? "Issuing..." : "Issue Note"}
        </Button>
      </div>
    </div>
  );
} 