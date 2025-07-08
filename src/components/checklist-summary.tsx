import {ChecklistInstance, CheckStatus} from "@/lib/types/checklist.types";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion";
import {format} from "date-fns";

export function ChecklistSummary({checklist}: { checklist: ChecklistInstance }) {
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