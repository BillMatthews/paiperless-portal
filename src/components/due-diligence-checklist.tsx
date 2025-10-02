"use client";

import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import {ChecklistItemInstance, CheckStatus, CheckType} from "@/lib/types/checklist.types";


interface ChecklistItemProps {
  item: ChecklistItemInstance;
  onChange: (status: CheckStatus, note?: string) => void;
}

function ChecklistItem({ item, onChange }: ChecklistItemProps) {
  const [newNote, setNewNote] = useState("");
  const statusMapping = {
    "NOT_STARTED": "Not Started",
    "IN_PROGRESS": "In Progress",
    "SATISFACTORY": "Satisfactory",
    "ADVERSE": "Adverse"
  } as const;

  const reverseStatusMapping = {
    "Not Started": "NOT_STARTED",
    "In Progress": "IN_PROGRESS",
    "Satisfactory": "SATISFACTORY",
    "Adverse": "ADVERSE"
  } as const;

  const handleAddNote = () => {
    if (newNote.trim()) {
      onChange(item.status, newNote.trim());
      setNewNote("");
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">{item.title}</span>
          <Select
            value={statusMapping[item.status as unknown as keyof typeof statusMapping]}
            onValueChange={(value: string) => onChange(reverseStatusMapping[value as keyof typeof reverseStatusMapping] as CheckStatus)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Not Started">Not Started</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Satisfactory">Satisfactory</SelectItem>
              <SelectItem value="Adverse">Adverse</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">{item.guidance}</p>
      </div>

      <div className="space-y-2">
        <Textarea
          placeholder="Add a note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="min-h-[100px]"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleAddNote}
          >
            Add Note
          </Button>
        </div>
      </div>

      {item.notes.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Previous Notes</h4>
          <div className="space-y-2">
            {item.notes.map((note, index) => (
              <div
                key={`${note.createdAt}-${index}`}
                className="text-sm bg-muted/50 p-3 rounded-md space-y-1"
              >
                <p className="text-muted-foreground text-xs">
                  {format(new Date(note.createdAt), "PPp")}
                </p>
                <p>{note.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface AutomatedChecklistItemProps {
  item: ChecklistItemInstance;
}

function AutomatedChecklistItem({ item }: AutomatedChecklistItemProps) {
  // Debug logging to help identify the issue
  console.log('AutomatedChecklistItem - item:', item);
  console.log('AutomatedChecklistItem - guidance:', item.guidance);
  
  const statusMapping = {
    "NOT_STARTED": "Not Started",
    "IN_PROGRESS": "In Progress",
    "SATISFACTORY": "Satisfactory",
    "ADVERSE": "Adverse"
  } as const;

  const getStatusColor = (status: CheckStatus) => {
    switch (status) {
      case CheckStatus.SATISFACTORY:
        return "text-green-600";
      case CheckStatus.ADVERSE:
        return "text-red-600";
      case CheckStatus.IN_PROGRESS:
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">{item.title}</span>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${getStatusColor(item.status)}`}>
              {statusMapping[item.status as unknown as keyof typeof statusMapping]}
            </span>
            <span className="text-xs text-muted-foreground bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Automated
            </span>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-sm text-gray-700 leading-relaxed">
            {item.guidance}
          </p>
        </div>
      </div>

      {item.notes.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Notes</h4>
          <div className="space-y-2">
            {item.notes.map((note, index) => (
              <div
                key={`${note.createdAt}-${index}`}
                className="text-sm bg-muted/50 p-3 rounded-md space-y-1"
              >
                <p className="text-muted-foreground text-xs">
                  {format(new Date(note.createdAt), "PPp")}
                </p>
                <p>{note.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ChecklistSection {
  title: string;
  items: ChecklistItemInstance[];
}

interface DueDiligenceChecklistProps {
  checklist: {
    sections: ChecklistSection[];
  };
  onChecklistUpdate: (checklist: { sections: ChecklistSection[] }) => void;
  expandedSections?: string[];
  onExpandedSectionsChange?: (sections: string[]) => void;
  isSaving?: boolean;
  onSaveChanges?: () => Promise<void>;
}

const isSectionComplete = (items: ChecklistItemInstance[]): boolean => {
  return items.every(item => {
    const upperStatus = item.status.toUpperCase();
    return upperStatus === "SATISFACTORY" || upperStatus === "ADVERSE";
  });
};

export function DueDiligenceChecklist({ 
  checklist, 
  onChecklistUpdate,
  expandedSections = [],
  onExpandedSectionsChange,
  isSaving = false,
  onSaveChanges
}: DueDiligenceChecklistProps) {
  const [localChecklist, setLocalChecklist] = useState<ChecklistSection[]>(checklist.sections);

  useEffect(() => {
    setLocalChecklist(checklist.sections);
  }, [checklist.sections]);

  const updateCheck = (sectionIndex: number, itemIndex: number, status: CheckStatus, note?: string) => {
    const updatedSections = [...localChecklist];
    const section = updatedSections[sectionIndex];
    const item = section.items[itemIndex];

    if (note) {
      item.notes = [
        ...item.notes,
        {
          note: note,
          createdAt: new Date().toISOString(),
        },
      ];
    }

    item.status = status;
    setLocalChecklist(updatedSections);
    onChecklistUpdate({ sections: updatedSections });
  };

  if (!checklist?.sections) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No checklist items available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Due Diligence Checklist</h2>
        {onSaveChanges && (
          <Button 
            onClick={onSaveChanges}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      <Accordion type="multiple" value={expandedSections} onValueChange={onExpandedSectionsChange}>
        {localChecklist.map((section, sectionIndex) => (
          <AccordionItem key={section.title} value={section.title}>
            <AccordionTrigger className="flex items-center">
              <div className="flex items-center gap-2">
                <span>{section.title}</span>
                <span className={`inline-block w-2 h-2 rounded-full ${
                  isSectionComplete(section.items) 
                    ? 'bg-green-500' 
                    : 'bg-yellow-500'
                }`} />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {section.items.map((item, itemIndex) => {
                  // Default to MANUAL if checkType is undefined
                  const isAutomated = item.checkType === CheckType.AUTOMATED;
                  
                  return isAutomated ? (
                    <AutomatedChecklistItem
                      key={item.title}
                      item={item}
                    />
                  ) : (
                    <ChecklistItem
                      key={item.title}
                      item={item}
                      onChange={(status, note) => updateCheck(sectionIndex, itemIndex, status, note)}
                    />
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}