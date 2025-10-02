export enum ChecklistItemStatus {
    NOT_STARTED = "NOT_STARTED",
    IN_PROGRESS = "IN_PROGRESS",
    ADVERSE = "ADVERSE",
    SATISFACTORY = "SATISFACTORY",
    CRITICAL = "CRITICAL",
}

export enum CheckStatus {
    NOT_STARTED = 'Not Started',
    IN_PROGRESS = 'In Progress',
    SATISFACTORY = 'Satisfactory',
    ADVERSE = 'Adverse'
}

export enum CheckType {
    MANUAL = 'MANUAL',
    AUTOMATED = 'AUTOMATED'
}

export enum ChecklistType {
    ONBOARDING = 'ONBOARDING',
    DEAL_PROCESSING = 'DEAL_PROCESSING',
}
export interface CheckNote {
    note: string;
    createdAt: string;
}

export interface ChecklistItemInstanceNote {
    note: string;
    user: string;
    createdAt: Date;
}
export interface ChecklistItemInstance {
    id: string;
    title: string;
    guidance: string;
    status: CheckStatus;
    notes: CheckNote[];
    checkType?: CheckType
}

export interface ChecklistSectionInstance {
    id: string;
    title: string;
    guidance: string;
    items: ChecklistItemInstance[];
}
export interface ChecklistInstance {
    _id: string,
    version: number,
    sections: ChecklistSectionInstance[];
}