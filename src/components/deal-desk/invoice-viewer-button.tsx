'use client';

import { Button } from "@/components/ui/button";
import { FileText, ExternalLink } from "lucide-react";
import { getTradeDocumentFileDataUrl } from "@/lib/actions/deal-desk.actions";
import { useState } from "react";

interface InvoiceViewerButtonProps {
  accountId: string;
  documentId: string;
}

export function InvoiceViewerButton({ accountId, documentId }: InvoiceViewerButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleViewInvoice = async () => {
    try {
      setIsLoading(true);
      const result = await getTradeDocumentFileDataUrl(accountId, documentId);
      
      if (result.error || !result.data) {
        console.error('Failed to load invoice:', result.error);
        return;
      }

      // Create a new window and write the data URL
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Invoice Document</title>
            </head>
            <body style="margin: 0; padding: 0;">
              <iframe 
                src="${result.data}" 
                style="width: 100%; height: 100vh; border: none;"
                title="Invoice Document"
              ></iframe>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } catch (error) {
      console.error('Error viewing invoice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleViewInvoice}
      disabled={isLoading}
    >
      <FileText className="h-4 w-4 mr-2" />
      {isLoading ? 'Loading...' : 'View Invoice'}
      <ExternalLink className="h-4 w-4 ml-1" />
    </Button>
  );
} 