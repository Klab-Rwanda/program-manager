"use client";

import React from 'react';
import { toast } from "sonner";
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Props for the QrCodeDialog component.
 */
interface QrCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  qrData: {
    qrDataString: string; // The raw data string for the QR code
    accessLink: string;   // The shareable URL for the session
    expiresAt: string;    // The ISO string for when the QR code expires
  } | null;
}

/**
 * A reusable dialog component for displaying a session QR code and its associated link.
 */
export function QrCodeDialog({ isOpen, onClose, qrData }: QrCodeDialogProps) {
  
  // Helper function to copy text to the clipboard and show a confirmation toast.
  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success("Link copied to clipboard!");
    } else {
      toast.error("Clipboard access is not available in this browser.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Online Session Started</DialogTitle>
          <DialogDescription>
            Trainees can scan this code or use the link to mark attendance.
          </DialogDescription>
        </DialogHeader>
        
        {/* Only render the content if qrData is available */}
        {qrData ? (
          <div className="flex flex-col items-center gap-4 py-4">
            {/* QR Code Display */}
            <div className="p-4 bg-white rounded-lg border shadow-sm">
              <QRCode value={qrData.qrDataString} size={256} includeMargin={true} />
            </div>
            
            {/* Expiration Time */}
            <p className="text-sm text-muted-foreground">
              Expires at: {new Date(qrData.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            
            {/* Shareable Link Input */}
            <div className="w-full space-y-2">
              <Label htmlFor="session-link" className="sr-only">Session Link</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="session-link"
                  value={qrData.accessLink}
                  readOnly
                />
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(qrData.accessLink)}
                  aria-label="Copy session link"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Fallback content if data is not yet loaded
          <div className="py-8 text-center text-muted-foreground">
            Loading QR code data...
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}