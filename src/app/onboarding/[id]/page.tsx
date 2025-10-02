'use client';

import {notFound} from "next/navigation";
import {Button} from "@/components/ui/button";
import {format, formatDistanceToNow} from "date-fns";
import {ArrowLeft} from "lucide-react";
import Link from "next/link";
import {DueDiligenceChecklist} from "@/components/due-diligence-checklist";

import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {useEffect, useState} from "react";
import {ChecklistInstance, ChecklistItemInstance} from "@/lib/types/checklist.types"
import {getOnboarding} from "@/lib/actions/onboarding.actions";
import {OnboardingResponse} from "@/lib/types/onboarding.types";
import {OnboardingStatusBadge} from "@/components/onboarding/onboarding-status-badge";
import {OnboardingDecision} from "@/components/onboarding/onboarding-decision";
import {RegistrationDocumentViewerButton} from "@/components/onboarding/registration-document-viewer-button";

import {updateDueDiligenceChecklist} from "@/lib/actions/checklist.actions";
import {useRbac} from "@/hooks/use-rbac";
import {ActionPermissions, EntityType, RbacAction} from "@/lib/rbac/permissions.types";

interface ChecklistSection {
  title: string;
  guidance?: string;
  items: ChecklistItemInstance[];
}

interface DealPageProps {
  params: Promise<{ id: string }>;
}

export default function OnboardingProcessingPage({ params }: DealPageProps) {
  const [onboarding, setOnboarding] = useState<OnboardingResponse | null>(null);
  const [checklist, setChecklist] = useState<ChecklistInstance | null>(null);
  const [localChanges, setLocalChanges] = useState<ChecklistInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const {canPerformAction} = useRbac();
  const actionPermissions: ActionPermissions = {
    canApprove: canPerformAction(EntityType.ONBOARDING_REQUEST, RbacAction.APPROVE)
  }

  useEffect(() => {
    async function loadOnboarding() {
      try {
        const resolvedParams = await params;
        const onboardingData = await getOnboarding(resolvedParams.id);
        setOnboarding(onboardingData);
        // Create deep copies of the checklist data
        const checklistData = JSON.parse(JSON.stringify(onboardingData.processingDetails.dueDiligenceChecks));
        setChecklist(checklistData);
        setLocalChanges(JSON.parse(JSON.stringify(checklistData)));
      } catch (error) {
        console.error('Error loading onboarding:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadOnboarding();
  }, [params]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!onboarding) {
    notFound();
  }
  
  const createdDate = new Date(onboarding.processingDetails.createdAt);
  const updatedDate = new Date(onboarding.processingDetails.updatedAt);
  const onboardinglAge = formatDistanceToNow(createdDate, { addSuffix: false });

  const handleLocalChange = (updatedChecklist: { sections: ChecklistSection[] }) => {
    if (!checklist) return;
    
    setLocalChanges({
      _id: checklist._id,
      version: checklist.version,
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
        await updateDueDiligenceChecklist(onboarding.processingDetails.dueDiligenceChecklistId, updates);
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
          <h2 className="text-2xl font-bold tracking-tight">{onboarding.registrationDetails.company.name}</h2>
          <OnboardingStatusBadge status={onboarding.processingDetails.status}/>
        </div>

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Registration Details</TabsTrigger>
            <TabsTrigger value="dueDiligence">Due Diligence</TabsTrigger>
            {actionPermissions.canApprove && (
              <TabsTrigger value="decision">Decision</TabsTrigger>
              )}
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="text-lg font-medium mb-4">Onboarding Information</h3>
                  <dl className="grid grid-cols-1 gap-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-1">
                      <dt className="text-muted-foreground">Customer Deal Reference</dt>
                      <dd className="font-medium">{onboarding.processingDetails.registrationId}</dd>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <dt className="text-muted-foreground">Created</dt>
                      <dd className="font-medium">{format(createdDate, 'PPP')}</dd>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <dt className="text-muted-foreground">Last Updated</dt>
                      <dd className="font-medium">{format(updatedDate, 'PPP')}</dd>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <dt className="text-muted-foreground">Onboarding Age</dt>
                      <dd className="font-medium">{onboardinglAge}</dd>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <dt className="text-muted-foreground">Status</dt>
                      <dd className="font-medium">
                        <OnboardingStatusBadge status={onboarding.processingDetails.status}/>
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-lg border bg-card p-6">
                  <h3 className="text-lg font-medium mb-4">Company Details</h3>
                  <dl className="grid grid-cols-1 gap-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-1">
                      <dt className="text-muted-foreground">Company Name</dt>
                      <dd className="font-medium">{onboarding.registrationDetails.company.name}</dd>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <dt className="text-muted-foreground">Address</dt>
                      <dd className="font-medium">
                        {onboarding.registrationDetails.company.address.street}<br/>
                        {onboarding.registrationDetails.company.address.city}<br/>
                        {onboarding.registrationDetails.company.address.state}<br/>
                        {onboarding.registrationDetails.company.address.country}<br/>
                      </dd>

                    </div>

                    <div className="grid grid-cols-2 gap-1">
                      <dt className="text-muted-foreground">Website</dt>
                      <dd className="font-medium">{onboarding.registrationDetails.company.website}</dd>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <dt className="text-muted-foreground">Ethereum Wallet Address</dt>
                      <dd className="font-medium">{onboarding.registrationDetails.company.accountWalletAddress}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-lg border bg-card p-6">
                  <h3 className="text-lg font-medium mb-4">Primary Contact Details</h3>
                  <dl className="grid grid-cols-1 gap-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-1">
                      <dt className="text-muted-foreground">Contact Name</dt>
                      <dd className="font-medium">{onboarding.registrationDetails.contact.name}</dd>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <dt className="text-muted-foreground">Position held</dt>
                      <dd className="font-medium">{onboarding.registrationDetails.contact.position}</dd>
                    </div>

                    <div className="grid grid-cols-2 gap-1">
                      <dt className="text-muted-foreground">Email Address</dt>
                      <dd className="font-medium">{onboarding.registrationDetails.contact.email}</dd>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <dt className="text-muted-foreground">Phone</dt>
                      <dd className="font-medium">{onboarding.registrationDetails.contact.phone}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border bg-card">
                  <div className="p-6">
                    <h3 className="text-lg font-medium mb-4">Registration Documents</h3>
                    <div className="space-y-4">
                      {onboarding.registrationDetails.documents.map((document, idx) => (
                          <div key={idx} className="rounded-lg border p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{document.documentType}</h4>
                              <RegistrationDocumentViewerButton
                                  registrationId={onboarding.processingDetails.registrationId}
                                  documentId={document._id}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <div>
                                  <dt className="text-muted-foreground">Type</dt>
                                  <dd className="font-medium">{document.mimeType}</dd>
                                </div>
                              </dl>

                              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <div>
                                  <dt className="text-muted-foreground">Document Status</dt>
                                  <dd className="font-medium">{document.status}</dd>
                                </div>
                              </dl>
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dueDiligence">
            <DueDiligenceChecklist
                checklist={localChanges || checklist || {_id: '', version: 0, sections: []}}
                onChecklistUpdate={handleLocalChange}
                expandedSections={expandedSections}
                onExpandedSectionsChange={setExpandedSections}
                isSaving={isSaving}
                onSaveChanges={handleSaveChanges}
            />
          </TabsContent>

          {actionPermissions.canApprove && (
            <TabsContent value="decision">
              <OnboardingDecision
                  onboardingId={onboarding.processingDetails._id}
                  checklist={localChanges || checklist || {_id: '', version: 0, sections: []}}
                  onboardingStatus={onboarding.processingDetails.status}
                  onboardingDecision={onboarding.processingDetails.onboardingDecision}
              />
            </TabsContent>
          )}

        </Tabs>

      </div>
  );
}