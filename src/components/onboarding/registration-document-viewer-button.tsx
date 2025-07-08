'use client';

import { Button } from "@/components/ui/button";
import { FileText, ExternalLink } from "lucide-react";
import { useState } from "react";
import {getRegistrationDocumentFileDataUrl} from "@/lib/actions/onboarding.actions";

interface RegistrationDocumentViewerButtonProps {
  registrationId: string;
  documentId: string;
}

export function RegistrationDocumentViewerButton({ registrationId, documentId }: RegistrationDocumentViewerButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleViewRegistrationDocument = async () => {
    try {
      setIsLoading(true);
      const result = await getRegistrationDocumentFileDataUrl(registrationId, documentId);
      
      if (result.error || !result.data) {
        console.error('Failed to load registration document:', result.error);
        return;
      }

      // Create a new window and write the data URL
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Registration Document</title>
            </head>
            <body style="margin: 0; padding: 0;">
              <iframe 
                src="${result.data}" 
                style="width: 100%; height: 100vh; border: none;"
                title="Registration Document"
              ></iframe>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } catch (error) {
      console.error('Error viewing registration document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleViewRegistrationDocument}
      disabled={isLoading}
    >
      <FileText className="h-4 w-4 mr-2" />
      {isLoading ? 'Loading...' : 'View Document'}
      <ExternalLink className="h-4 w-4 ml-1" />
    </Button>
  );
} 