export enum ChecklistItemStatus {
    NOT_STARTED = "NOT_STARTED",
    IN_PROGRESS = "IN_PROGRESS",
    ADVERSE = "ADVERSE",
    SATISFACTORY = "SATISFACTORY",
}

export enum CheckStatus {
    NOT_STARTED = 'Not Started',
    IN_PROGRESS = 'In Progress',
    SATISFACTORY = 'Satisfactory',
    ADVERSE = 'Adverse'
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
}

export interface ChecklistSectionInstance {
    id: string;
    title: string;
    guidance: string;
    items: ChecklistItemInstance[];
}
export interface ChecklistInstance {
    sections: ChecklistSectionInstance[];
}