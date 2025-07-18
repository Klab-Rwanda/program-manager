"use client";

import { useState, useCallback, useEffect } from "react";
import { QrCode, CheckCircle, Eye, UserCheck, Loader2 } from "lucide-react";
import Image from "next/image";

// App-specific imports
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

// --- Type Definitions to match backend models ---
interface User {
    _id: string;
    name: string;
    email: string;
}

interface Program {
    _id: string;
    name: string;
    trainees: User[];
    facilitators: User[];
}

interface AttendanceRecord {
    _id: string;
    user: User;
    status: 'Present' | 'Absent' | 'Excused';
    checkInTime?: string;
    method: string;
}

// --- Main Page Component ---
export default function AttendanceTrackingPage() {
    // --- State Management ---
    const [loading, setLoading] = useState({ programs: true, qrCode: false });
    const [error, setError] = useState<string | null>(null);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [participants, setParticipants] = useState<User[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<Map<string, AttendanceRecord>>(new Map());
    
    // Session State
    const [sessionStarted, setSessionStarted] = useState(false);
    const [selectedProgramId, setSelectedProgramId] = useState("");
    const [generatedQRCode, setGeneratedQRCode] = useState(""); // Holds the base64 image string from the API

    // Modal State
    const [createSessionOpen, setCreateSessionOpen] = useState(false);
    const [excuseDialogOpen, setExcuseDialogOpen] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState<User | null>(null);
    const [excuseReason, setExcuseReason] = useState("");

    // --- Data Fetching and API Calls ---

    const fetchMyPrograms = useCallback(async () => {
        setLoading(p => ({ ...p, programs: true }));
        try {
            const response = await api.get("/programs");
            const userPrograms: Program[] = response.data.data;
            setPrograms(userPrograms);
            if (userPrograms.length > 0 && !selectedProgramId) {
                setSelectedProgramId(userPrograms[0]._id);
            }
        } catch (err) {
            setError("Failed to load your programs. Please refresh the page.");
            console.error(err);
        } finally {
            setLoading(p => ({ ...p, programs: false }));
        }
    }, [selectedProgramId]);

    const fetchParticipants = useCallback(async (programId: string) => {
        try {
            const response = await api.get(`/programs/${programId}`);
            const program: Program = response.data.data;
            const allParticipants = [...(program.trainees || []), ...(program.facilitators || [])];
            setParticipants(allParticipants);
        } catch (err) {
            console.error("Failed to fetch program participants:", err);
        }
    }, []);

    const fetchLiveAttendance = useCallback(async (programId: string) => {
        try {
            const today = new Date().toISOString().split("T")[0];
            const params = new URLSearchParams({ startDate: today, endDate: today });
            const response = await api.get(`/attendance/report/program/${programId}`, { params });
            
            const recordsMap = new Map<string, AttendanceRecord>();
            (response.data.data.docs || []).forEach((rec: AttendanceRecord) => {
                if (rec.user) {
                    recordsMap.set(rec.user._id, rec);
                }
            });
            setAttendanceRecords(recordsMap);
        } catch (err) {
            console.error("Polling for live attendance failed:", err);
        }
    }, []);

    const startQRCodeSession = async () => {
        if (!selectedProgramId) {
            alert("Please select a program first.");
            return;
        }
        setLoading(p => ({ ...p, qrCode: true }));
        try {
            const response = await api.get(`/attendance/qr-code/program/${selectedProgramId}`);
            setGeneratedQRCode(response.data.data.qrCodeImage); // API returns a base64 image
            setSessionStarted(true);
            setCreateSessionOpen(false);
        } catch (err: any) {
            alert(`Failed to start session: ${err.response?.data?.message || 'Please try again.'}`);
            console.error(err);
        } finally {
            setLoading(p => ({ ...p, qrCode: false }));
        }
    };

    const markParticipantExcused = async () => {
        if (!selectedParticipant || !excuseReason.trim()) {
            alert("Please provide a reason for the excuse.");
            return;
        }
        try {
            await api.post("/attendance/excuse", {
                programId: selectedProgramId,
                traineeId: selectedParticipant._id, // Backend expects 'traineeId' key
                date: new Date().toISOString().split("T")[0],
                reason: excuseReason,
            });
            alert(`${selectedParticipant.name} has been marked as excused.`);
            setExcuseDialogOpen(false);
            setSelectedParticipant(null);
            setExcuseReason("");
            fetchLiveAttendance(selectedProgramId); // Refresh the list immediately
        } catch (err: any) {
            alert(`Failed to mark as excused: ${err.response?.data?.message || 'Please try again.'}`);
            console.error(err);
        }
    };

    // --- Effects ---

    useEffect(() => {
        fetchMyPrograms();
    }, [fetchMyPrograms]);

    useEffect(() => {
        if (selectedProgramId) {
            fetchParticipants(selectedProgramId);
            fetchLiveAttendance(selectedProgramId);
        }
    }, [selectedProgramId, fetchParticipants, fetchLiveAttendance]);

    useEffect(() => {
        if (sessionStarted && selectedProgramId) {
            const intervalId = setInterval(() => {
                fetchLiveAttendance(selectedProgramId);
            }, 10000); // Poll for new attendance records every 10 seconds

            return () => clearInterval(intervalId); // Cleanup on component unmount or session end
        }
    }, [sessionStarted, selectedProgramId, fetchLiveAttendance]);
    
    if (loading.programs) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }
    
    return (
        <div className="space-y-6">
            <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white border-0">
                <CardHeader>
                    <CardTitle className="text-xl">Attendance Session</CardTitle>
                    <CardDescription className="text-gray-300">
                        Generate a QR code for today's session for your selected program.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!sessionStarted ? (
                        <Dialog open={createSessionOpen} onOpenChange={setCreateSessionOpen}>
                            <DialogTrigger asChild>
                                <Button size="lg" className="bg-yellow-500 text-black hover:bg-yellow-400 w-full" disabled={programs.length === 0}>
                                    <QrCode className="mr-2 h-5 w-5" />
                                    {programs.length > 0 ? "Start QR-Based Session" : "No Programs Available"}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Start Session</DialogTitle>
                                    <DialogDescription>Select the program for this attendance session.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="program">Select Program</Label>
                                        <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                                            <SelectTrigger><SelectValue placeholder="Choose a program" /></SelectTrigger>
                                            <SelectContent>
                                                {programs.map((program) => (
                                                    <SelectItem key={program._id} value={program._id}>
                                                        {program.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button className="w-full bg-[#1f497d] hover:bg-[#1a3d6b]" onClick={startQRCodeSession} disabled={loading.qrCode || !selectedProgramId}>
                                        {loading.qrCode ? <Loader2 className="animate-spin" /> : "Generate QR Code"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    ) : (
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="text-center">
                                <h4 className="font-medium text-white mb-2">Scan to Mark Attendance</h4>
                                {generatedQRCode ? (
                                    <div className="bg-white p-4 rounded-lg inline-block">
                                        <Image src={generatedQRCode} alt="Attendance QR Code" width={160} height={160} />
                                    </div>
                                ) : <Loader2 className="h-10 w-10 animate-spin text-white mx-auto" />}
                            </div>
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-6 w-6 text-green-400" />
                                    <div>
                                        <p className="font-medium">Session Active for {programs.find(p => p._id === selectedProgramId)?.name}</p>
                                        <p className="text-sm text-gray-300">Started at {new Date().toLocaleTimeString()}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-300">
                                    Share this QR code with participants. The live attendance list below will update automatically.
                                </p>
                                <Button variant="destructive" onClick={() => { setSessionStarted(false); setGeneratedQRCode(""); }}>
                                    End Session
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">
                        Live Attendance
                        {sessionStarted && <Badge className="ml-2 bg-green-500">Live</Badge>}
                    </CardTitle>
                    <CardDescription>
                        {sessionStarted ? "Real-time attendance tracking for the current session." : "Start a session to monitor attendance."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Participant</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Check-in Time</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {participants.length === 0 && !loading.programs ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        Select a program to see participants.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                participants.map((participant) => {
                                    const record = attendanceRecords.get(participant._id);
                                    const status = record?.status || "Absent";
                                    return (
                                        <TableRow key={participant._id}>
                                            <TableCell>
                                                <div className="font-medium">{participant.name}</div>
                                                <div className="text-xs text-muted-foreground">{participant.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={status === "Present" ? "default" : status === "Excused" ? "secondary" : "destructive"} className={status === "Present" ? "bg-green-500" : ""}>
                                                    {status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{record?.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</TableCell>
                                            <TableCell>{record?.method || 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                {status === "Absent" && sessionStarted && (
                                                    <Button size="sm" variant="outline" onClick={() => { setSelectedParticipant(participant); setExcuseDialogOpen(true); }}>
                                                        <UserCheck className="mr-1 h-3 w-3" /> Excuse
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={excuseDialogOpen} onOpenChange={setExcuseDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Mark Participant as Excused</DialogTitle>
                        <DialogDescription>Mark {selectedParticipant?.name} as excused for this session with a valid reason.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="excuse-reason">Reason for Excuse</Label>
                            <Textarea id="excuse-reason" placeholder="e.g., Medical appointment..." value={excuseReason} onChange={(e) => setExcuseReason(e.target.value)} rows={3} />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setExcuseDialogOpen(false)}>Cancel</Button>
                            <Button className="flex-1 bg-blue-500 hover:bg-blue-600" onClick={markParticipantExcused}>
                                <UserCheck className="mr-2 h-4 w-4" /> Mark as Excused
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}