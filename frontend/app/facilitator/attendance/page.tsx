"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { QrCode, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useRole } from "@/lib/contexts/RoleContext";

interface Program { _id: string; name: string; }

export default function AttendanceTracking() {
    const { user } = useRole();
    const [myPrograms, setMyPrograms] = useState<Program[]>([]);
    const [selectedProgramId, setSelectedProgramId] = useState("");
    const [qrCodeImage, setQrCodeImage] = useState("");
    const [loading, setLoading] = useState(true);
    const [qrLoading, setQrLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPrograms = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/programs');
            setMyPrograms(response.data.data);
            if (response.data.data.length > 0) {
                setSelectedProgramId(response.data.data[0]._id);
            }
        } catch (e) {
            setError("Failed to load your programs.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchPrograms();
    }, [fetchPrograms]);
    
    const handleGenerateQR = async () => {
        if (!selectedProgramId) {
            alert("Please select a program first.");
            return;
        }
        setQrLoading(true);
        setQrCodeImage(''); // Clear previous QR code
        try {
            const response = await api.get(`/attendance/qr-code/program/${selectedProgramId}`);
            setQrCodeImage(response.data.data.qrCode);
        } catch (e) {
            alert("Failed to generate QR Code. Please try again.");
            console.error(e);
        } finally {
            setQrLoading(false);
        }
    };

    if (loading) {
      return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6 p-4">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">QR Code Attendance</h1>
                {qrCodeImage && (
                    <Button variant="outline" size="sm" onClick={handleGenerateQR} disabled={qrLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${qrLoading ? 'animate-spin' : ''}`} />
                        Regenerate QR
                    </Button>
                )}
            </div>

            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

            <Card>
                <CardHeader>
                    <CardTitle>Start an Attendance Session</CardTitle>
                    <CardDescription>Select a program and generate a unique QR code. Trainees can scan this to mark their attendance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2 max-w-sm">
                        <label>Select Program</label>
                        <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a program" />
                            </SelectTrigger>
                            <SelectContent>
                                {myPrograms.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleGenerateQR} disabled={qrLoading || !selectedProgramId}>
                        {qrLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <QrCode className="mr-2 h-4 w-4" />}
                        Generate Session QR Code
                    </Button>
                    
                    {qrLoading && (
                        <div className="text-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                            <p className="text-muted-foreground mt-2">Generating secure QR code...</p>
                        </div>
                    )}

                    {qrCodeImage && !qrLoading && (
                        <div className="text-center p-6 border rounded-lg bg-white mt-4">
                            <h3 className="font-semibold mb-2 text-black">Scan to Mark Attendance</h3>
                            <div className="flex justify-center">
                                <img src={qrCodeImage} alt="Attendance QR Code" className="w-64 h-64" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">This QR code is single-use and time-sensitive. Regenerate for a new session.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}