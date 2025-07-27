"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/RoleContext";
import { useSocket } from "@/lib/hooks/useSocket";
import { toast } from "sonner";
import jsQR from "jsqr";
import { QrCode, Loader2, CheckCircle2, Video, Info, LogOut, Badge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { markQRAttendance, getSessionDetails, ClassSession } from "@/lib/services/attendance.service";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Helper function to get initials from a name
const getInitials = (name: string = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

export default function ClassroomHubPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
    const { user, role, loading: authLoading } = useAuth();
    const socket = useSocket(sessionId);

    const [session, setSession] = useState<ClassSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // State for both facilitator and trainee
    const [meetingLink, setMeetingLink] = useState('');
    const [participants, setParticipants] = useState<{ _id: string, name: string, role: string }[]>([]);

    // Facilitator-specific state
    const [isFacilitatorQrModalOpen, setFacilitatorQrModalOpen] = useState(false);
    const [facilitatorQrCode, setFacilitatorQrCode] = useState<string | null>(null);

    // Trainee-specific state
    const [isTraineeModalOpen, setTraineeModalOpen] = useState(false);
    const [traineeQrCode, setTraineeQrCode] = useState<string | null>(null);

    // Fetch initial session details when the page loads
    useEffect(() => {
        const fetchDetails = async () => {
            if (sessionId) {
                try {
                    const sessionData = await getSessionDetails(sessionId);
                    setSession(sessionData.session);
                    // Initialize the meeting link from API data if it exists
                    if (sessionData.session.meetingLink) {
                        setMeetingLink(sessionData.session.meetingLink);
                    }
                } catch (err) {
                    toast.error("Failed to load session details.");
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchDetails();
    }, [sessionId]);

    // Set up all WebSocket event listeners
    useEffect(() => {
        if (!socket || !user) return;

        // On connecting, announce presence to the room
        socket.emit('join_session_room', { sessionId, userId: user._id });

        // Listen for when the facilitator starts an attendance check
        const handleAttendanceStarted = ({ qrCodeImage }: { qrCodeImage: string }) => {
            if (role === 'trainee') {
                setTraineeQrCode(qrCodeImage);
                setTraineeModalOpen(true);
                toast.info("The facilitator has started an attendance check!");
            }
        };

        // Listen for when the facilitator ends an attendance check
        const handleAttendanceEnded = () => {
            if (role === 'trainee') {
                setTraineeModalOpen(false);
                toast.warning("The attendance check has ended.");
            }
        };
        
        // Listen for real-time updates to the meeting link
        const handleMeetingLinkUpdate = (link: string) => {
            setMeetingLink(link);
            if (role === 'trainee') {
                toast.success("Facilitator has shared the meeting link!");
            }
        };

        // Listen for updates to the participant list
        const handleParticipantUpdate = (participantList: any[]) => {
            setParticipants(participantList);
        };

        socket.on('attendance_started', handleAttendanceStarted);
        socket.on('attendance_ended', handleAttendanceEnded);
        socket.on('meeting_link_updated', handleMeetingLinkUpdate);
        socket.on('participant_list_updated', handleParticipantUpdate);

        // Cleanup function to remove listeners when the component unmounts
        return () => {
            socket.off('attendance_started', handleAttendanceStarted);
            socket.off('attendance_ended', handleAttendanceEnded);
            socket.off('meeting_link_updated', handleMeetingLinkUpdate);
            socket.off('participant_list_updated', handleParticipantUpdate);
        };
    }, [socket, role, sessionId, user]);
    
    // Handler for the facilitator to start attendance
    const handleStartAttendanceCheck = () => {
        if (!socket) return toast.error("Not connected to the real-time server.");
        setIsProcessing(true);
        socket.emit('facilitator_start_attendance', { sessionId }, (response: any) => {
            setIsProcessing(false);
            if (response.error) {
                toast.error(response.error);
            } else {
                setFacilitatorQrCode(response.qrCodeImage);
                setFacilitatorQrModalOpen(true);
            }
        });
    };
    
    // Handler for the facilitator to end attendance
    const handleEndAttendanceCheck = () => {
        if (socket) socket.emit('facilitator_end_attendance', { sessionId });
        setFacilitatorQrModalOpen(false);
    };

    // Handler for the facilitator to share their meeting link
    const handleShareLink = () => {
        if (!socket || !meetingLink.trim()) {
            return toast.error("Please paste a valid meeting link first.");
        }
        socket.emit('facilitator_share_link', { sessionId, link: meetingLink });
        toast.success("Meeting link has been shared with all trainees!");
    };

    // Handler for the trainee to scan the QR code that appears on their screen
    const handleScanAndMark = () => {
        if (!traineeQrCode) return;
        setIsProcessing(true);
        const image = new Image();
        image.src = traineeQrCode;
        image.crossOrigin = "Anonymous";
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if(!ctx) {
                toast.error("Browser error: Could not process image.");
                setIsProcessing(false);
                return;
            }
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);
            const imageData = ctx.getImageData(0, 0, image.width, image.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code?.data) {
                markQRAttendance(code.data)
                    .then(() => { toast.success("Attendance marked successfully!"); setTraineeModalOpen(false); })
                    .catch((err) => toast.error(err.response?.data?.message || "QR code verification failed."))
                    .finally(() => setIsProcessing(false));
            } else {
                toast.error("Could not read QR code from the received image.");
                setIsProcessing(false);
            }
        };
        image.onerror = () => {
            toast.error("Failed to load QR code image for scanning.");
            setIsProcessing(false);
        }
    };
    
    // Loading and error states
    if (loading || authLoading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-lg text-muted-foreground">Preparing Classroom Hub...</p>
                </div>
            </div>
        );
    }
    if (!session || !user) {
        return (
             <div className="flex h-full w-full items-center justify-center p-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertDescription>
                        Could not load session. It may be inactive, or you might not be enrolled.
                    </AlertDescription>
                </Alert>
             </div>
        );
    }
    
    // Main JSX render
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl">{session.title}</CardTitle>
                            <CardDescription>{session.programId.name}</CardDescription>
                        </div>
                        <Button 
                            variant="outline" 
                            onClick={() => router.push(role === 'facilitator' ? '/dashboard/Facilitator/Fac-attendance' : '/dashboard/Trainee/Trattendance')}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Exit Classroom
                        </Button>
                    </div>
                </CardHeader>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    {role === 'facilitator' && (
                        <Card>
                            <CardHeader><CardTitle>Facilitator Controls</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="meetingLink">Video Call Link</Label>
                                    <div className="flex gap-2">
                                        <Input id="meetingLink" placeholder="Paste Google Meet, Zoom, etc. link here" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} />
                                        <Button onClick={handleShareLink}>Share Link</Button>
                                    </div>
                                </div>
                                <div className="text-center border-t pt-4">
                                     <Button size="lg" onClick={handleStartAttendanceCheck} disabled={isProcessing}>
                                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <QrCode className="mr-2 h-4 w-4" />}
                                        Take Attendance
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                     {role === 'trainee' && (
                        <Card>
                             <CardHeader><CardTitle>Join Your Class</CardTitle></CardHeader>
                             <CardContent className="space-y-4">
                                {meetingLink ? (
                                    <a href={meetingLink} target="_blank" rel="noopener noreferrer">
                                        <Button size="lg" className="w-full h-16 text-lg bg-green-600 hover:bg-green-700"><Video className="mr-3 h-6 w-6"/>Join Video Call</Button>
                                    </a>
                                ) : (
                                    <div className="text-center p-4 bg-gray-50 rounded-lg min-h-[96px] flex flex-col justify-center">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground mb-2"/>
                                        <p className="text-muted-foreground">Waiting for facilitator to share the meeting link...</p>
                                    </div>
                                )}
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        Keep this page open. The attendance QR code will appear here automatically when the facilitator starts the check.
                                    </AlertDescription>
                                </Alert>
                             </CardContent>
                        </Card>
                     )}
                </div>
                
                <div className="md:col-span-1">
                     <Card>
                        <CardHeader><CardTitle className="flex justify-between items-center">Participants <Badge>{participants.length}</Badge></CardTitle></CardHeader>
                        <CardContent className="space-y-2 max-h-[450px] overflow-y-auto">
                            {participants.length > 0 ? participants.map(p => (
                                <div key={p._id} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50">
                                    <Avatar className="h-8 w-8"><AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${p.name}`} /><AvatarFallback className="text-xs">{getInitials(p.name)}</AvatarFallback></Avatar>
                                    <span className="text-sm font-medium">{p.name}</span>
                                </div>
                            )) : <p className="text-sm text-muted-foreground text-center py-4">No one has joined the hub yet.</p>}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Facilitator's Modal */}
            <Dialog open={isFacilitatorQrModalOpen} onOpenChange={setFacilitatorQrModalOpen}>
                <DialogContent onEscapeKeyDown={handleEndAttendanceCheck}>
                    <DialogHeader><DialogTitle>Attendance is Live</DialogTitle><DialogDescription>Share your screen. Close this window to end the check.</DialogDescription></DialogHeader>
                    <div className="flex justify-center p-4 min-h-[300px] items-center">{facilitatorQrCode ? <img src={facilitatorQrCode} alt="QR Code" /> : <Loader2 className="h-16 w-16 animate-spin"/>}</div>
                    <Button variant="destructive" onClick={handleEndAttendanceCheck}>End Attendance Check</Button>
                </DialogContent>
            </Dialog>

            {/* Trainee's Modal */}
            <Dialog open={isTraineeModalOpen} onOpenChange={setTraineeModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Attendance Check!</DialogTitle><DialogDescription>Scan the code below to mark your presence.</DialogDescription></DialogHeader>
                    <div className="flex justify-center p-4 min-h-[300px] items-center">{traineeQrCode ? <img src={traineeQrCode} alt="QR Code" /> : <Loader2 className="h-16 w-16 animate-spin"/>}</div>
                    <Button className="w-full" onClick={handleScanAndMark} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Scan and Mark My Attendance
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}