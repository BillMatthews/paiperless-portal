'use client';

import { notFound } from "next/navigation";
import {getDeal, updateDealDueDiligenceChecklist} from "@/lib/actions/deal-desk.actions";
import { getAccountDetails } from "@/lib/actions/accounts.actions";
import { DealStatusBadge } from "@/components/deal-desk/deal-status-badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { DueDiligenceChecklist } from "@/components/due-diligence-checklist";

import { PromissoryNoteForm } from "@/components/deal-desk/promissory-note-form";
import { FundingProgress } from "@/components/deal-desk/funding-progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {  DealResponse } from "@/lib/types/deal-desk.types";
import type { AccountDetailsDto } from "@/lib/types/accounts.types";
import { InvoiceViewerButton } from "@/components/deal-desk/invoice-viewer-button";
import { useState, useEffect } from "react";
import {ChecklistInstance, ChecklistItemInstance} from "@/lib/types/checklist.types";
import {DealDecision} from "@/components/deal-desk/deal-decision";

interface ChecklistSection {
  title: string;
  guidance?: string;
  items: ChecklistItemInstance[];
}

interface DealPageProps {
  params: { id: string };
}

export default function DealPage({ params }: DealPageProps) {
  const [deal, setDeal] = useState<DealResponse | null>(null);
  const [accountDetails, setAccountDetails] = useState<AccountDetailsDto | null>(null);
  const [checklist, setChecklist] = useState<ChecklistInstance | null>(null);
  const [localChanges, setLocalChanges] = useState<ChecklistInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadDeal() {
      try {
        const dealData = await getDeal(params.id);
        setDeal(dealData);
        
        // Fetch account details
        if (dealData.dealDetails.accountId) {
          try {
            const accountData = await getAccountDetails(dealData.dealDetails.accountId);
            setAccountDetails(accountData);
          } catch (error) {
            console.error('Error loading account details:', error);
          }
        }
        
        // Create deep copies of the checklist data
        const checklistData = JSON.parse(JSON.stringify(dealData.processingDetails.dueDiligenceChecks));
        setChecklist(checklistData);
        setLocalChanges(JSON.parse(JSON.stringify(checklistData)));
      } catch (error) {
        console.error('Error loading deal:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDeal();
  }, [params]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!deal) {
    notFound();
  }
  
  const createdDate = new Date(deal.processingDetails.createdAt);
  const updatedDate = new Date(deal.processingDetails.updatedAt);
  const dealAge = formatDistanceToNow(createdDate, { addSuffix: false });

  const handleLocalChange = (updatedChecklist: { sections: ChecklistSection[] }) => {
    setLocalChanges({
      sections: updatedChecklist.sections.map(section => ({
        id: section.title,
        title: section.title,
        guidance: section.guidance || "",
        items: section.items.map(item => ({
          id: item.title,
          title: item.title,
          guidance: item.guidance || "",
          status: item.status,
          notes: item.notes
        }))
      }))
    });
  };

  const handleSaveChanges = async () => {
    if (!localChanges || !checklist) return;

   
    try {
      setIsSaving(true);
      
      // Prepare updates array for the API
      const updates = localChanges.sections.flatMap(section => 
        section.items.map((item: ChecklistItemInstance) => {
          const originalItem = checklist.sections
            .find(s => s.title === section.title)
            ?.items.find(i => i.title === item.title);

          if (!originalItem) {
            return {
              sectionTitle: section.title,
              itemTitle: item.title,
              status: item.status,
              notes: item.notes?.map(note => ({
                text: note.note,
                userId: 'current-user'
              }))
            };
          }

          // Check if status has changed
          const statusChanged = originalItem.status !== item.status;
          
          // Check if there are new notes
          const originalNotesLength = originalItem.notes?.length ?? 0;
          const hasNewNotes = item.notes && item.notes.length > originalNotesLength;

          if (statusChanged || hasNewNotes) {
            const update: {
              sectionTitle: string;
              itemTitle: string;
              status?: string;
              notes?: Array<{ text: string; userId: string; }>;
            } = {
              sectionTitle: section.title,
              itemTitle: item.title
            };

            if (statusChanged) {
              update.status = item.status;
            }

            if (hasNewNotes) {
              update.notes = item.notes
                .slice(originalNotesLength)
                .map(note => ({
                  text: note.note,
                  userId: 'current-user'
                }));
            }

            return update;
          }

          return null;
        })
      ).filter((update): update is NonNullable<typeof update> => update !== null);

      // Only make API call if there are actual updates
      if (updates.length > 0) {
        await updateDealDueDiligenceChecklist(params.id, updates);
        // Update the main checklist with the saved changes
        setChecklist(localChanges);
      }
    } catch (error) {
      console.error('Error updating checklist:', error);
      // TODO: Add error handling UI feedback
    } finally {
      setIsSaving(false);
    }
  };

  return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/deal-desk">
              <ArrowLeft className="h-4 w-4"/>
              <span className="sr-only">Back to deals</span>
            </Link>
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">{deal.accountDetails.accountName}</h2>
          <DealStatusBadge status={deal.processingDetails.status}/>
        </div>

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Deal Details</TabsTrigger>
            {["IN_PROGRESS", "NEW"].includes(deal.processingDetails.status) && (<TabsTrigger value="dueDiligence">Due Diligence</TabsTrigger> )}
            <TabsTrigger value="decision">Decision</TabsTrigger>
            {deal.processingDetails.status === "AWAITING_AGREEMENT" && (
                <TabsTrigger value="promissoryNote">Promissory Note</TabsTrigger>
            )}
            {(deal.processingDetails.status === "FUNDS_RELEASED" ||
                deal.processingDetails.status === "FUNDING_REQUESTED" ||
                deal.processingDetails.status === "LOAN_REPAID" ||
                deal.processingDetails.status === "COMPLETED") && (
                <TabsTrigger value="funding">Funding Progress</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="text-lg font-medium mb-4">Deal Information</h3>
                  <dl className="grid grid-cols-1 gap-y-4 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      <dt className="text-muted-foreground">Customer Deal Reference</dt>
                      <dd className="font-medium">{deal.dealDetails.dealReference}</dd>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      <dt className="text-muted-foreground">Created</dt>
                      <dd className="font-medium">{format(createdDate, 'PPP')}</dd>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      <dt className="text-muted-foreground">Last Updated</dt>
                      <dd className="font-medium">{format(updatedDate, 'PPP')}</dd>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      <dt className="text-muted-foreground">Deal Age</dt>
                      <dd className="font-medium">{dealAge}</dd>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      <dt className="text-muted-foreground">Status</dt>
                      <dd className="font-medium">
                        <DealStatusBadge status={deal.processingDetails.status}/>
                      </dd>
                    </div>
                  </dl>
                </div>

                {accountDetails && (
                  <div className="rounded-lg border bg-card p-6">
                    <h3 className="text-lg font-medium mb-4">Account Information</h3>
                    <dl className="grid grid-cols-1 gap-y-4 text-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        <dt className="text-muted-foreground">Account Name</dt>
                        <dd className="font-medium">{accountDetails.accountName}</dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        <dt className="text-muted-foreground">Account Status</dt>
                        <dd className="font-medium">{accountDetails.status}</dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        <dt className="text-muted-foreground">Company Name</dt>
                        <dd className="font-medium">{accountDetails.company.name}</dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        <dt className="text-muted-foreground">Website</dt>
                        <dd className="font-medium">
                          <a 
                            href={accountDetails.company.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline break-all"
                          >
                            {accountDetails.company.website}
                          </a>
                        </dd>
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <dt className="text-muted-foreground">Company Address</dt>
                        <dd className="font-medium">
                          {accountDetails.company.address.street}<br/>
                          {accountDetails.company.address.city}
                          {accountDetails.company.address.state && `, ${accountDetails.company.address.state}`}
                          {accountDetails.company.address.postalCode && ` ${accountDetails.company.address.postalCode}`}<br/>
                          {accountDetails.company.address.country}
                        </dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        <dt className="text-muted-foreground">Contact Name</dt>
                        <dd className="font-medium">{accountDetails.contact.name}</dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        <dt className="text-muted-foreground">Position</dt>
                        <dd className="font-medium">{accountDetails.contact.position}</dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        <dt className="text-muted-foreground">Email</dt>
                        <dd className="font-medium">
                          <a 
                            href={`mailto:${accountDetails.contact.emailAddress}`}
                            className="text-blue-600 hover:text-blue-800 underline break-all"
                          >
                            {accountDetails.contact.emailAddress}
                          </a>
                        </dd>
                      </div>
                      {accountDetails.contact.phone && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          <dt className="text-muted-foreground">Phone</dt>
                          <dd className="font-medium">
                            <a 
                              href={`tel:${accountDetails.contact.phone}`}
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              {accountDetails.contact.phone}
                            </a>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

                <div className="rounded-lg border bg-card p-6">
                  <h3 className="text-lg font-medium mb-4">Financial Details</h3>
                  <dl className="grid grid-cols-1 gap-y-4 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      <dt className="text-muted-foreground">Total Invoice Value</dt>
                      <dd className="font-medium">{formatCurrency(deal.processingDetails.invoiceTotal)}</dd>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      <dt className="text-muted-foreground">Requested Loan Amount</dt>
                      <dd className="font-medium">{formatCurrency(deal.processingDetails.loanAmount)}</dd>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      <dt className="text-muted-foreground">Loan-to-Value Ratio</dt>
                      <dd className="font-medium">
                        {((deal.processingDetails.loanAmount / deal.processingDetails.invoiceTotal) * 100).toFixed(1)}%
                      </dd>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      <dt className="text-muted-foreground">Requested Duration</dt>
                      <dd className="font-medium">{deal.processingDetails.loanTerm} days</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border bg-card">
                  <div className="p-6">
                    <h3 className="text-lg font-medium mb-4">Invoice Breakdown</h3>
                    <div className="space-y-4">
                      {deal.invoiceDocuments.map((invoice) => (
                          <div key={invoice.documentContent.invoiceNumber} className="rounded-lg border p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                              <h4 className="font-medium">{invoice.documentContent.invoiceNumber}</h4>
                              <InvoiceViewerButton
                                  accountId={deal.processingDetails.accountId}
                                  documentId={invoice.id}
                              />
                            </div>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                              <div>
                                <dt className="text-muted-foreground">Amount</dt>
                                <dd className="font-medium">{formatCurrency(invoice.documentContent.invoiceTotal)}</dd>
                              </div>
                              <div>
                                <dt className="text-muted-foreground">Date Raised</dt>
                                <dd className="font-medium">{format(new Date(invoice.documentContent.invoiceDate), 'PP')}</dd>
                              </div>
                              <div>
                                <dt className="text-muted-foreground">Due Date</dt>
                                <dd className="font-medium">{format(new Date(invoice.documentContent.dueDate), 'PP')}</dd>
                              </div>
                              <div className="col-span-1 sm:col-span-2">
                                <dt className="text-muted-foreground">Invoice To</dt>
                                <dd className="font-medium">
                                  {invoice.documentContent.billTo.companyName}<br/>
                                  {invoice.documentContent.billTo.city}<br/>
                                  {invoice.documentContent.billTo.country}
                                </dd>
                              </div>
                            </dl>
                          </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {["IN_PROGRESS", "NEW"].includes(deal.processingDetails.status) && (
            <TabsContent value="dueDiligence">
              <DueDiligenceChecklist
                  checklist={localChanges || {sections: []}}
                  onChecklistUpdate={handleLocalChange}
                  expandedSections={expandedSections}
                  onExpandedSectionsChange={setExpandedSections}
                  isSaving={isSaving}
                  onSaveChanges={handleSaveChanges}
              />
            </TabsContent>
          )}

          <TabsContent value="decision">
            <DealDecision
                dealId={deal.processingDetails._id}
                checklist={localChanges || {sections: []}}
                dealStatus={deal.processingDetails.status}
                fundingDecision={deal.processingDetails.fundingDecision}
            />
          </TabsContent>

          {deal.processingDetails.status === "AWAITING_AGREEMENT" && (
              <TabsContent value="promissoryNote">
                <PromissoryNoteForm accountDetails={deal.accountDetails} dealDetails={deal.dealDetails} processingDetails={deal.processingDetails}/>
              </TabsContent>
          )}

          {(deal.processingDetails.status === "FUNDING_REQUESTED" ||
              deal.processingDetails.status === "FUNDS_RELEASED" ||
              deal.processingDetails.status === "LOAN_REPAID" ||
              deal.processingDetails.status === "COMPLETED") && (
              <TabsContent value="funding">
                <FundingProgress deal={deal.processingDetails}/>
              </TabsContent>
          )}
        </Tabs>

      </div>
  );
}