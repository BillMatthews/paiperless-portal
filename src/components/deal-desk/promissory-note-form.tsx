"use client";

import {useEffect, useState} from "react";
import {AccountDetails, DealDetails, DealDto} from "@/lib/types/deal-desk.types";
import {
  getIssuedPromissoryNoteFileDataUrl,
  issuePromissoryNote,
  savePromissoryNote,
  signPromissoryNote
} from "@/lib/actions/deal-desk.actions";
import {useToast} from "@/hooks/use-toast";
import {useRouter} from "next/navigation";
import {
  InitialPromissoryNoteContent,
  PromissoryNoteContent,
  PromissoryNoteStatus
} from "@/lib/types/promissory-note.types";
import { PromissoryNoteEditor } from "./promissory-note-editor";
import { PromissoryNoteSigner } from "./promissory-note-signer";
import { PromissoryNoteProcessing } from "./promissory-note-processing";

interface PromissoryNoteFormProps {
  accountDetails: AccountDetails;
  dealDetails: DealDetails;
  processingDetails: DealDto;
}

export function PromissoryNoteForm({ accountDetails, dealDetails, processingDetails }: PromissoryNoteFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

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

  const handleSign = async (party: 'lender' | 'borrower') => {
    try {
      setIsSigning(true);
      const signedBy = party === 'lender' ? 'John Smith' : accountDetails.accountName;
      await signPromissoryNote(dealDetails.id, party, signedBy);
      toast({
        title: "Success",
        description: "Promissory note signed successfully",
      });
      router.refresh();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign promissory note",
      });
    } finally {
      setIsSigning(false);
    }
  };

  const isProcessing = () => {
    if (processingDetails.promissoryNote && processingDetails.promissoryNote.status === PromissoryNoteStatus.PROCESSING) {
      return true;
    } else {
      return false;
    }
  }
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

  const handleDownload = async () => {
    try {
      const { data, contentType, error } = await getIssuedPromissoryNoteFileDataUrl(processingDetails._id);
      if (error || !data || !contentType) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error || "Failed to download promissory note",
        });
        return;
      }
      
      // Create a blob from the array buffer
      const blob = new Blob([new Uint8Array(data)], { type: contentType });
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `promissory-note-${processingDetails.dealId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download promissory note",
      });
    }
  };

  // Show processing state
  if (isProcessing()) {
    return <PromissoryNoteProcessing />;
  }

  // Show signing interface when promissory note is issued
  if (processingDetails.promissoryNote?.status === PromissoryNoteStatus.ISSUED) {
    return (
      <PromissoryNoteSigner
        accountDetails={accountDetails}
        dealDetails={dealDetails}
        processingDetails={{
          _id: processingDetails._id,
          dealId: processingDetails.dealId,
          promissoryNote: processingDetails.promissoryNote
        }}
      />
    );
  }

  // Show editing interface for draft state
  return (
    <PromissoryNoteEditor
      accountDetails={accountDetails}
      dealDetails={dealDetails}
      processingDetails={processingDetails}
    />
  );
}