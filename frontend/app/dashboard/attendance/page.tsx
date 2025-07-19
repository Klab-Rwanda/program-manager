"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, UserCheck } from "lucide-react";
import { useAuth } from "@/lib/contexts/RoleContext"; 
import api from "@/lib/api";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// --- Type Definitions ---
interface Program {
    _id: string;
    name: string;
    description: string;
    status: string;
    trainees: AttendanceUser[];
    facilitators: AttendanceUser[];
}

interface AttendanceUser {
    _id: string;
    name: string;
    email: string;
}

interface AttendanceRecord {
    _id: string;
    user: AttendanceUser | null;
    program: string;
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    method: 'Geolocation' | 'QRCode' | 'Manual';
    status: 'Present' | 'Absent' | 'Excused';
    reason?: string;
    markedBy?: string;
}

interface ExcuseFormData {
    userId: string;
    date: string;
    reason: string;
}

// --- Main Component ---
export default function AttendancePage() {
    const { user, role, loading: authLoading } = useAuth();

    if (authLoading) {
        return <div className="flex h-full w-full items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!user) {
        return <div className="text-center p-10"><p>Please log in to view this page.</p></div>;
    }

    if (role === 'program_manager' || role === 'super_admin') {
        return <ProgramManagerAttendanceView />;
    }
    
    if (role === 'trainee') {
        return <TraineeAttendanceView />;
    }

    return (
        <Card>
            <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">Your role does not have permission to view this page.</p></CardContent>
        </Card>
    );
}

// ===================================================================
//   COMPONENT FOR PROGRAM MANAGER / SUPER ADMIN VIEW
// ===================================================================
function ProgramManagerAttendanceView() {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [traineesInProgram, setTraineesInProgram] = useState<AttendanceUser[]>([]);
    const [facilitatorsInProgram, setFacilitatorsInProgram] = useState<AttendanceUser[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExcuseModalOpen, setIsExcuseModalOpen] = useState(false);
    const [isSubmittingExcuse, setIsSubmittingExcuse] = useState(false);
    const [selectedProgramId, setSelectedProgramId] = useState<string>("");
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0],
        to: new Date().toISOString().split("T")[0],
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<'all' | 'trainee' | 'facilitator'>('all');
    const [excuseFormData, setExcuseFormData] = useState<ExcuseFormData>({ userId: "", date: "", reason: "" });

    const fetchMyPrograms = useCallback(async () => {
        try {
            const response = await api.get('/programs');
            const fetchedPrograms: Program[] = response.data.data;
            setPrograms(fetchedPrograms);
            if (fetchedPrograms.length > 0 && !selectedProgramId) {
                setSelectedProgramId(fetchedPrograms[0]._id);
            }
        } catch (err) {
            console.error("Failed to fetch programs", err);
            setError("Could not load your programs.");
        }
    }, [selectedProgramId]);

    const fetchAttendanceReport = useCallback(async () => {
        if (!selectedProgramId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ startDate: dateRange.from, endDate: dateRange.to });
            const [attendanceResponse, programDetailsResponse] = await Promise.all([
                api.get(`/attendance/report/program/${selectedProgramId}`, { params }),
                api.get(`/programs/${selectedProgramId}`)
            ]);
            
            setAttendanceData(attendanceResponse.data.data.docs || []);

            const programData: Program = programDetailsResponse.data.data;
            setTraineesInProgram(programData.trainees || []);
            setFacilitatorsInProgram(programData.facilitators || []);

        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch attendance report.");
            setAttendanceData([]);
        } finally {
            setLoading(false);
        }
    }, [selectedProgramId, dateRange]);

    useEffect(() => { fetchMyPrograms(); }, [fetchMyPrograms]);
    useEffect(() => { fetchAttendanceReport(); }, [fetchAttendanceReport]);

    const handleMarkAsExcused = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingExcuse(true);
        try {
            await api.post('/attendance/excuse', {
                programId: selectedProgramId,
                traineeId: excuseFormData.userId, 
                date: excuseFormData.date,
                reason: excuseFormData.reason
            });
            alert("Absence marked as excused successfully.");
            setIsExcuseModalOpen(false);
            setExcuseFormData({ userId: "", date: "", reason: "" });
            fetchAttendanceReport();
        } catch (err: any) {
            alert(`Error: ${err.response?.data?.message || "Failed to mark as excused."}`);
        } finally {
            setIsSubmittingExcuse(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap: { [key: string]: string } = {
            'Present': 'bg-green-100 text-green-800', 'Absent': 'bg-red-100 text-red-800', 'Excused': 'bg-blue-100 text-blue-800',
        };
        return <Badge className={statusMap[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
    };

    const filteredAttendance = useMemo(() => {
        const traineeIds = new Set(traineesInProgram.map(t => t._id));
        const facilitatorIds = new Set(facilitatorsInProgram.map(f => f._id));

        return attendanceData.filter(record => {
            if (!record.user) return false;

            const matchesSearch = record.user.name.toLowerCase().includes(searchTerm.toLowerCase());
            
            let matchesRole = true;
            if (roleFilter === 'trainee') {
                matchesRole = traineeIds.has(record.user._id);
            } else if (roleFilter === 'facilitator') {
                matchesRole = facilitatorIds.has(record.user._id);
            }
            
            return matchesSearch && matchesRole;
        });
    }, [attendanceData, searchTerm, roleFilter, traineesInProgram, facilitatorsInProgram]);

    const allUsersInProgram = useMemo(() => [...traineesInProgram, ...facilitatorsInProgram], [traineesInProgram, facilitatorsInProgram]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
                    <p className="text-muted-foreground">Monitor and manage attendance across your programs.</p>
                </div>
                <Button variant="outline" onClick={() => setIsExcuseModalOpen(true)} disabled={!selectedProgramId}>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Mark as Excused
                </Button>
            </div>
             <Card>
                <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="space-y-2 lg:col-span-2">
                        <Label>Program</Label>
                        <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                            <SelectTrigger><SelectValue placeholder="Select a program" /></SelectTrigger>
                            <SelectContent>{programs.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input type="date" value={dateRange.from} onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input type="date" value={dateRange.to} onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label>Participant Type</Label>
                        <Select value={roleFilter} onValueChange={(value: 'all' | 'trainee' | 'facilitator') => setRoleFilter(value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Participants</SelectItem>
                                <SelectItem value="trainee">Trainees Only</SelectItem>
                                <SelectItem value="facilitator">Facilitators Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 lg:col-span-5">
                        <Label>Search by Name</Label>
                        <Input placeholder="Search participant name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Attendance Report</CardTitle><CardDescription>Displaying records for {programs.find(p => p._id === selectedProgramId)?.name || '...'}</CardDescription></CardHeader>
                <CardContent>
                    <div className="rounded-md border"><Table><TableHeader><TableRow><TableHead>Participant</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Check-in</TableHead><TableHead>Check-out</TableHead><TableHead>Method</TableHead></TableRow></TableHeader><TableBody>
                        {loading && <TableRow><TableCell colSpan={6} className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></TableCell></TableRow>}
                        {error && <TableRow><TableCell colSpan={6} className="text-center p-8 text-red-500">{error}</TableCell></TableRow>}
                        {!loading && filteredAttendance.length === 0 && (<TableRow><TableCell colSpan={6} className="text-center p-8 text-muted-foreground">No attendance records found for the selected filters.</TableCell></TableRow>)}
                        {!loading && filteredAttendance.map(record => (<TableRow key={record._id}><TableCell className="font-medium">{record.user?.name || 'Deleted User'}</TableCell><TableCell>{new Date(record.date).toLocaleDateString()}</TableCell><TableCell>{getStatusBadge(record.status)}</TableCell><TableCell>{record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</TableCell><TableCell>{record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</TableCell><TableCell>{record.method}</TableCell></TableRow>))}
                    </TableBody></Table></div>
                </CardContent>
            </Card>
            <Dialog open={isExcuseModalOpen} onOpenChange={setIsExcuseModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Mark Absence as Excused</DialogTitle><DialogDescription>Select a participant and provide a reason for their excused absence.</DialogDescription></DialogHeader>
                    <form onSubmit={handleMarkAsExcused} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="userId">Participant</Label>
                            <Select value={excuseFormData.userId} onValueChange={value => setExcuseFormData(f => ({ ...f, userId: value }))}>
                                <SelectTrigger><SelectValue placeholder="Select a participant" /></SelectTrigger>
                                <SelectContent>{allUsersInProgram.map(u => <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2"><Label htmlFor="date">Date of Absence</Label><Input id="date" type="date" value={excuseFormData.date} onChange={e => setExcuseFormData(f => ({ ...f, date: e.target.value }))} required /></div>
                        <div className="space-y-2"><Label htmlFor="reason">Reason for Excuse</Label><Textarea id="reason" value={excuseFormData.reason} onChange={e => setExcuseFormData(f => ({ ...f, reason: e.target.value }))} placeholder="e.g., Doctor's appointment" required /></div>
                        <DialogFooter><Button type="button" variant="outline" onClick={() => setIsExcuseModalOpen(false)}>Cancel</Button><Button type="submit" disabled={isSubmittingExcuse}>{isSubmittingExcuse && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit Excuse</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}


// ===================================================================
//   COMPONENT FOR TRAINEE VIEW
// ===================================================================
function TraineeAttendanceView() {
    const [myPrograms, setMyPrograms] = useState<Program[]>([]);
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProgramId, setSelectedProgramId] = useState<string>("");
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0],
        to: new Date().toISOString().split("T")[0],
    });

    const fetchTraineePrograms = useCallback(async () => {
        try {
            const response = await api.get('/programs');
            const fetchedPrograms: Program[] = response.data.data;
            setMyPrograms(fetchedPrograms);
            if (fetchedPrograms.length > 0 && !selectedProgramId) {
                setSelectedProgramId(fetchedPrograms[0]._id);
            }
        } catch (err) {
            console.error("Failed to fetch programs", err);
            setError("Could not load your programs.");
        }
    }, [selectedProgramId]);

    const fetchTraineeAttendance = useCallback(async () => {
        if (!selectedProgramId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ startDate: dateRange.from, endDate: dateRange.to });
            const response = await api.get(`/attendance/report/program/${selectedProgramId}`, { params });
            setAttendanceData(response.data.data.docs || []);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch your attendance.");
            setAttendanceData([]);
        } finally {
            setLoading(false);
        }
    }, [selectedProgramId, dateRange]);

    useEffect(() => { fetchTraineePrograms(); }, [fetchTraineePrograms]);
    useEffect(() => { fetchTraineeAttendance(); }, [fetchTraineeAttendance]);

    const getStatusBadge = (status: string) => {
        const statusMap: { [key: string]: string } = {
            'Present': 'bg-green-100 text-green-800', 'Absent': 'bg-red-100 text-red-800', 'Excused': 'bg-blue-100 text-blue-800',
        };
        return <Badge className={statusMap[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
    };

    const attendancePercentage = () => {
        const requiredDays = attendanceData.filter(r => r.status !== 'Excused').length;
        if (requiredDays === 0) return 100;
        const presentDays = attendanceData.filter(r => r.status === 'Present').length;
        return Math.round((presentDays / requiredDays) * 100);
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
                <p className="text-muted-foreground">Review your attendance record for your enrolled programs.</p>
            </div>
            <Card>
                <CardHeader><CardTitle>My Attendance Summary</CardTitle></CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                        <Label>Program</Label>
                        <Select value={selectedProgramId} onValueChange={setSelectedProgramId}><SelectTrigger><SelectValue placeholder="Select a program" /></SelectTrigger><SelectContent>{myPrograms.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={dateRange.from} onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))} /></div>
                    <div className="space-y-2"><Label>End Date</Label><Input type="date" value={dateRange.to} onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))} /></div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Attendance Record</CardTitle>
                    <CardDescription>
                        Your attendance rate for the selected period is <strong className="text-primary">{attendancePercentage()}%</strong>.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Check-in</TableHead><TableHead>Check-out</TableHead><TableHead>Method</TableHead></TableRow></TableHeader><TableBody>
                        {loading && <TableRow><TableCell colSpan={5} className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></TableCell></TableRow>}
                        {error && <TableRow><TableCell colSpan={5} className="text-center p-8 text-red-500">{error}</TableCell></TableRow>}
                        {!loading && attendanceData.length === 0 && (<TableRow><TableCell colSpan={5} className="text-center p-8 text-muted-foreground">No records found.</TableCell></TableRow>)}
                        {!loading && attendanceData.map(record => (<TableRow key={record._id}><TableCell>{new Date(record.date).toLocaleDateString()}</TableCell><TableCell>{getStatusBadge(record.status)}</TableCell><TableCell>{record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</TableCell><TableCell>{record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</TableCell><TableCell>{record.method}</TableCell></TableRow>))}
                    </TableBody></Table></div>
                </CardContent>
            </Card>
        </div>
    );
}