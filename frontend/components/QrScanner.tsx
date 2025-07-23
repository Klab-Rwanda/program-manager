"use client";
import { QrReader } from 'react-qr-reader';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface QrScannerProps {
  onScanSuccess: (data: string) => void;
  onScanError: (error: any) => void;
}

export const QrScanner = ({ onScanSuccess, onScanError }: QrScannerProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative w-full max-w-sm mx-auto aspect-square overflow-hidden rounded-lg border">
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Starting camera...</p>
        </div>
      )}
      <QrReader
        onResult={(result, error) => {
          if (!!result) {
            onScanSuccess(result?.getText());
          }
          if (!!error) {
            // We can ignore 'No QR code found' errors which fire continuously
            if (error.name !== "NotFoundException") {
              onScanError(error);
            }
          }
        }}
        onLoad={() => setIsLoaded(true)}
        constraints={{ facingMode: 'environment' }}
        containerStyle={{ width: '100%', height: '100%' }}
        videoContainerStyle={{ width: '100%', height: '100%', paddingTop: 0 }}
        videoStyle={{ objectFit: 'cover' }}
      />
      {isLoaded && (
         <div className="absolute inset-0 pointer-events-none border-[30px] border-black/30 rounded-lg">
           <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
           <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
           <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
           <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-lg"></div>
         </div>
      )}
    </div>
  );
};