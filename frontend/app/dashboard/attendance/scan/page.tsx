"use client";

import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Video, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function ScanAttendancePage() {
    const [scanResult, setScanResult] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleScanResult = async (result: any, error: any) => {
        if (!!result) {
            const scannedData = result?.getText();
            if (scannedData && scannedData !== scanResult) {
                setScanResult(scannedData);
                setLoading(true);
                setError(null);
                setSuccess(null);
                
                try {
                    // Send the scanned data to the backend for verification and marking
                    const response = await api.post('/attendance/mark', {
                        method: 'QRCode',
                        data: { qrCodeData: scannedData }
                    });
                    
                    setSuccess(response.data.message || 'Attendance marked successfully!');

                } catch (err: any) {
                    setError(err.response?.data?.message || 'Invalid or expired QR code.');
                } finally {
                    setLoading(false);
                }
            }
        }

        if (!!error) {
            // console.info(error);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Scan QR Code</h1>
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Mark Your Attendance</CardTitle>
                    <CardDescription>Point your camera at the QR code presented by your facilitator.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="w-full aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden relative">
                        <QrReader
                            onResult={handleScanResult}
                            constraints={{ facingMode: 'environment' }}
                            videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            containerStyle={{ width: '100%', height: '100%' }}
                        />
                        <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                            <div className='w-2/3 h-2/3 border-4 border-white/50 rounded-lg' />
                        </div>
                    </div>
                    <div className="mt-4 text-center">
                        {loading && <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />}
                        {error && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Scan Failed</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                         {success && (
                            <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertTitle>Success!</AlertTitle>
                                <AlertDescription>{success}</AlertDescription>
                            </Alert>
                        )}
                        {!loading && !error && !success && (
                             <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                                <Video className="h-4 w-4"/>
                                Awaiting QR code...
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}