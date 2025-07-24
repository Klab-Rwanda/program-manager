"use client";

import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScannerState } from 'html5-qrcode';
import { ScanLine } from 'lucide-react';

interface QrScannerProps {
  onResult: (result: string) => void;
  onError?: (error: string) => void;
}

const QrScanner: React.FC<QrScannerProps> = ({ onResult, onError }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerElementId = "qr-reader-container";

  useEffect(() => {
    if (scannerRef.current) {
      return;
    }

    const scanner = new Html5QrcodeScanner(
      scannerElementId,
      {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdge * 0.7);
          return { width: qrboxSize, height: qrboxSize };
        },
        rememberLastUsedCamera: true,
        supportedScanTypes: [],
      },
      false
    );

    const successCallback = (decodedText: string) => {
      if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        onResult(decodedText);
        scanner.pause(true);
      }
    };

    const errorCallback = (errorMessage: string) => {
      // Intentionally empty to avoid console spam for "QR code not found"
    };

    scanner.render(successCallback, errorCallback);
    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current && scannerRef.current.getState() !== Html5QrcodeScannerState.NOT_STARTED) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5-qrcode-scanner.", error);
        });
        scannerRef.current = null;
      }
    };
  }, [onResult]);

  return (
    <div className="relative w-full max-w-sm mx-auto p-2 border-2 border-dashed rounded-lg bg-gray-100">
      <div id={scannerElementId} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <ScanLine className="h-48 w-48 text-white/20 animate-pulse" />
      </div>
    </div>
  );
};

export default QrScanner;