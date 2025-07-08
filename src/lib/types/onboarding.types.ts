import {NoteEntry} from "@/lib/types/note.types";
import {RegistrationDetails} from "@/lib/types/registration.types";
import {ChecklistInstance} from "@/lib/types/checklist.types";

export enum OnboardingStatus {
    NEW = "NEW",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETE = "COMPLETE",
}

export enum OnboardingDecisionState {
    PENDING="PENDING",
    APPROVED="APPROVED",
    DECLINED="DECLINED"
}

export interface OnboardingDecisionDetails {
    decision: OnboardingDecisionState;
    decisionNotes: NoteEntry;
}

export interface OnboardingDto {
    _id: string;
    registrationId: string;
    status: OnboardingStatus,
    dueDiligenceChecklistId: string;
    dueDiligenceChecks?: ChecklistInstance;
    onboardingDecision: OnboardingDecisionDetails;
    createdAt: Date;
    updatedAt: Date;
    companyName: string;
}



export interface OnboardingResponse {
    processingDetails: OnboardingDto;
    registrationDetails: RegistrationDetails;
}