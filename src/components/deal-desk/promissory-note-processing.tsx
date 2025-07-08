"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export function PromissoryNoteProcessing() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Promissory Note Status</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <div>
              <h3 className="text-lg font-medium">Processing Promissory Note</h3>
              <p className="text-muted-foreground mt-2">
                The promissory note is being generated. This may take a few moments.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.refresh()}
              className="mt-4"
            >
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 