"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/contexts/RoleContext";
import { toast } from "sonner";
import { QrCode, Camera, Loader2, Users, Video, Copy, CheckCircle } from "lucide-react";
import QrScanner from '@/components/QrScanner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DailyVideoComponent } from '@/components/DailyVideo';
import {
  openQrForSession,
  markQRAttendance,
  getSessionDetails,
  ClassSession
} from "@/lib/services/attendance.service";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const ParticipantsPlaceholder = ({ count }: { count: number }) => (
    <div className="space-y-3">
        <div className="flex items-center justify-between">
            <h3 className="font-semibold">Participants</h3>
            <Badge variant="secondary">{count} Online</Badge>
        </div>
        {/* Placeholder UI */}
    </div>
);

export default function ClassroomPage() {
    const params = useParams();
    const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
    const { user, role, loading: authLoading } = useAuth();

    const [session, setSession] = useState<ClassSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [isQrModalOpen, setQrModalOpen] = useState(false);
    const [isScanModalOpen, setScanModalOpen] = useState(false);
    const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
    const [qrCodeData, setQrCodeData] = useState<string | null>(null); // Store the QR data for sharing
    const [isProcessing, setIsProcessing] = useState(false);
    const [attendanceActive, setAttendanceActive] = useState(false);
    const [copied, setCopied] = useState(false);
    const [roomUrl, setRoomUrl] = useState<string | null>(null);
    const [roomLoading, setRoomLoading] = useState(true);
    
    useEffect(() => {
        const fetchDetails = async () => {
            if (sessionId) {
                try {
                    const sessionData = await getSessionDetails(sessionId);
                    setSession(sessionData.session);
                    
                    // Create or get the Daily.co room
                    await createOrGetDailyRoom(sessionId);
                } catch (err) {
                    toast.error("Failed to load session details.");
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchDetails();
    }, [sessionId]);

    const createOrGetDailyRoom = async (sessionId: string) => {
        setRoomLoading(true);
        try {
            // Call your backend to create/get Daily.co room
            const response = await fetch(`/api/daily/room/${sessionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId,
                    roomName: `klab-class-${sessionId}`
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create room');
            }

            const data = await response.json();
            setRoomUrl(data.url);
        } catch (error) {
            console.error('Error creating room:', error);
            toast.error("Failed to create video room. Please refresh the page.");
            // Fallback to direct room URL (this might not work if room doesn't exist)
            setRoomUrl(`https://klab.daily.co/klab-class-${sessionId}`);
        } finally {
            setRoomLoading(false);
        }
    };

    // Add cleanup effect to prevent memory leaks
    useEffect(() => {
        return () => {
            // Cleanup any ongoing processes when component unmounts
            setIsProcessing(false);
            setQrModalOpen(false);
            setScanModalOpen(false);
        };
    }, []);

    const handleStartAttendanceCheck = async () => {
        if (!session) return;
        setIsProcessing(true);
        try {
            const result = await openQrForSession(session.sessionId);
            setQrCodeImage(result.qrCodeImage);
            setQrCodeData(result.qrCode || result.data || "attendance-code"); // Store the actual QR data
            setAttendanceActive(true);
            setQrModalOpen(true);
            toast.success("Attendance check started! Share the QR code or attendance code with students.");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to start attendance.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleQrScanResult = async (decodedText: string) => {
        if (decodedText && !isProcessing) {
            setIsProcessing(true);
            toast.info("Verifying attendance code...");
            try {
                await markQRAttendance(decodedText);
                toast.success("Attendance marked successfully!");
                setScanModalOpen(false);
            } catch (err: any) {
                toast.error(err.response?.data?.message || "Invalid or expired attendance code.");
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleManualAttendanceCode = async () => {
        if (!qrCodeData) return;
        
        try {
            await markQRAttendance(qrCodeData);
            toast.success("Attendance marked successfully!");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to mark attendance.");
        }
    };

    const copyAttendanceCode = async () => {
        if (qrCodeData) {
            try {
                await navigator.clipboard.writeText(qrCodeData);
                setCopied(true);
                toast.success("Attendance code copied to clipboard!");
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                toast.error("Failed to copy code");
            }
        }
    };

    const handleEndAttendance = () => {
        setAttendanceActive(false);
        setQrModalOpen(false);
        setQrCodeImage(null);
        setQrCodeData(null);
        toast.info("Attendance check ended.");
    };

    if (loading || authLoading || roomLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <div className="text-center space-y-2">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                    <p className="text-sm text-gray-600">
                        {roomLoading ? "Setting up video room..." : "Loading session..."}
                    </p>
                </div>
            </div>
        );
    }

    if (!session || !user) {
        return (
            <Alert variant="destructive">
                <AlertDescription>Session or user not found.</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row gap-4 p-4">
            <div className="flex-1 h-[60vh] md:h-auto rounded-lg overflow-hidden border bg-black">
                {roomUrl ? (
                    <DailyVideoComponent
                        roomUrl={roomUrl}
                        displayName={user.name || `${role}-${user.id}`}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-white">
                        <div className="text-center space-y-2">
                            <Video className="h-12 w-12 mx-auto opacity-50" />
                            <p>Video room unavailable</p>
                        </div>
                    </div>
                )}
            </div>

            <Card className="w-full md:w-80 flex-shrink-0 flex flex-col">
                <CardHeader>
                    <CardTitle>{session.title}</CardTitle>
                    <CardDescription>{session.programId.name}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                    {role === 'facilitator' && (
                        <div className="p-4 border rounded-lg bg-gray-50 space-y-2">
                            <h3 className="font-semibold text-center">Facilitator Actions</h3>
                            {!attendanceActive ? (
                                <Button 
                                    className="w-full" 
                                    onClick={handleStartAttendanceCheck} 
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                    ) : (
                                        <QrCode className="mr-2 h-4 w-4" />
                                    )}
                                    Start Attendance Check
                                </Button>
                            ) : (
                                <div className="space-y-2">
                                    <Badge variant="default" className="w-full justify-center">
                                        Attendance Active
                                    </Badge>
                                    <Button 
                                        variant="outline" 
                                        className="w-full" 
                                        onClick={() => setQrModalOpen(true)}
                                    >
                                        <QrCode className="mr-2 h-4 w-4" />
                                        Show QR Code
                                    </Button>
                                    <Button 
                                        variant="destructive" 
                                        className="w-full" 
                                        onClick={handleEndAttendance}
                                    >
                                        End Attendance
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {role === 'trainee' && (
                        <div className="p-4 border rounded-lg bg-gray-50 space-y-2">
                            <h3 className="font-semibold text-center">Student Actions</h3>
                            <Button 
                                className="w-full" 
                                onClick={() => setScanModalOpen(true)}
                                disabled={isProcessing}
                            >
                                <Camera className="mr-2 h-4 w-4" />
                                Mark Attendance
                            </Button>
                            {attendanceActive && qrCodeData && (
                                <Button 
                                    variant="outline" 
                                    className="w-full" 
                                    onClick={handleManualAttendanceCode}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                    ) : (
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                    )}
                                    Mark Attendance (Direct)
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Facilitator's QR Code Modal */}
            <Dialog open={isQrModalOpen} onOpenChange={setQrModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Attendance QR Code</DialogTitle>
                        <DialogDescription>
                            Students can scan this QR code or use the attendance code below
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* QR Code Display */}
                        <div className="flex justify-center p-4 bg-white rounded-lg">
                            {qrCodeImage ? (
                                <img src={qrCodeImage} alt="QR Code" className="max-w-full h-auto" />
                            ) : (
                                <Loader2 className="h-16 w-16 animate-spin"/>
                            )}
                        </div>
                        
                        {/* Attendance Code */}
                        {qrCodeData && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Attendance Code:</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 p-2 bg-gray-100 rounded font-mono text-sm break-all">
                                        {qrCodeData}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={copyAttendanceCode}
                                        className="shrink-0"
                                    >
                                        {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-600">
                                    Share this code with students who can't scan the QR code
                                </p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Student's Scanning Modal */}
            <Dialog open={isScanModalOpen} onOpenChange={setScanModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mark Attendance</DialogTitle>
                        <DialogDescription>
                            Scan the QR code shown by your facilitator
                        </DialogDescription>
                    </DialogHeader>
                    {isProcessing ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-10 w-10 animate-spin"/>
                        </div>
                    ) : (
                        <QrScanner
                            onResult={handleQrScanResult}
                            onError={(error) => console.error('QR Scanner Error:', error)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}