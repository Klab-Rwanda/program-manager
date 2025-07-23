"use client";

import React from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { toast } from "sonner";
import { Camera, CameraOff } from 'lucide-react';

interface QrScannerComponentProps {
  onScanSuccess: (data: string) => void;
}

const QrScannerComponent: React.FC<QrScannerComponentProps> = ({ onScanSuccess }) => {
  
  const handleDecode = (result: string) => {
    // Automatically call the success function when a QR code is detected
    onScanSuccess(result);
  };
  
  const handleError = (error: any) => {
    console.error("QR Scanner Error:", error);
    if (error?.name === 'NotAllowedError') {
      toast.error("Camera access denied. Please enable camera permissions in your browser settings.");
    } else {
      toast.error("Could not start camera. Please ensure it is not being used by another application.");
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto border rounded-lg overflow-hidden relative">
     <Scanner
    onResult={handleDecode}
    onError={handleError}
    options={{
      delayBetweenScanAttempts: 300,
      delayBetweenScanSuccess: 500,
    }}
    components={{
        finder: true, 
        audio: false,
        onOff: false,
        torch: true,
    }}
      />
      <div className="absolute top-2 left-2 p-2 bg-black/30 rounded-full">
        <Camera className="h-5 w-5 text-white" />
      </div>
    </div>
  );
};

export default QrScannerComponent;