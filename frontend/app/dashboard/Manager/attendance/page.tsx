"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getSessionAttendance, AttendanceRecord, getFacilitatorSessions, ClassSession } from "@/lib/services/attendance.service";

export default function ManagerAttendancePage() {
    const [sessions, setSessions] = useState<ClassSession[]>([]);
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [reportLoading, setReportLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedSessionId, setSelectedSessionId] = useState<string>("");
    
    // Fetch sessions available for reporting
    const fetchSessions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const sessionsData = await getFacilitatorSessions(); // For demo, assuming manager can see facilitator sessions
            setSessions(sessionsData);
            if (sessionsData.length > 0) {
                setSelectedSessionId(sessionsData[0]._id);
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || "Could not load sessions for reporting.";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    // Fetch attendance report for the selected session
    const fetchAttendanceReport = useCallback(async () => {
        if (!selectedSessionId) {
            setAttendanceData([]);
            return;
        }
        setReportLoading(true);
        try {
            const records = await getSessionAttendance(selectedSessionId);
            setAttendanceData(records);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to fetch attendance report.");
            setAttendanceData([]);
        } finally {
            setReportLoading(false);
        }
    }, [selectedSessionId]);

    useEffect(() => {
        fetchAttendanceReport();
    }, [fetchAttendanceReport]);

    const getStatusBadge = (status: string) => {
        const statusMap: { [key: string]: string } = {
            'present': 'bg-green-100 text-green-800', 'absent': 'bg-red-100 text-red-800', 'excused': 'bg-blue-100 text-blue-800', 'late': 'bg-yellow-100 text-yellow-800'
        };
        return <Badge className={statusMap[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Attendance Reports</h1>
                <p className="text-muted-foreground">Review attendance records for specific class sessions.</p>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Select Session</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="max-w-md">
                        <Label htmlFor="session-select">Session</Label>
                        <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                            <SelectTrigger id="session-select"><SelectValue placeholder="Select a session" /></SelectTrigger>
                            <SelectContent>{sessions.map(s => <SelectItem key={s._id} value={s._id}>{s.title} ({new Date(s.startTime).toLocaleDateString()})</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Attendance Log</CardTitle>
                            <CardDescription>
                                Displaying {attendanceData.length} records for the selected session.
                            </CardDescription>
                        </div>
                        <Button variant="outline"><Download className="mr-2 h-4 w-4"/>Export Report</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Trainee</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Method</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportLoading && <TableRow><TableCell colSpan={4} className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></TableCell></TableRow>}
                                {!reportLoading && attendanceData.length === 0 && (
                                    <TableRow><TableCell colSpan={4} className="text-center p-8 text-muted-foreground">No attendance records found for this session.</TableCell></TableRow>
                                )}
                                {!reportLoading && attendanceData.map(record => (
                                    <TableRow key={record._id}>
                                        <TableCell className="font-medium">{record.userId?.name || 'Unknown User'}</TableCell>
                                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                                        <TableCell>{new Date(record.timestamp).toLocaleTimeString()}</TableCell>
                                        <TableCell>{record.method.replace('_', ' ')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}