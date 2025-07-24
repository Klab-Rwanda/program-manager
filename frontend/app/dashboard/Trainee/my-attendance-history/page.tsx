"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, Calendar, CheckCircle, XCircle, Clock, BarChart } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getMyAttendanceHistory } from "@/lib/services/attendance.service";
import { AttendanceRecord } from "@/types";

export default function TraineeAttendanceHistoryPage() {
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const records = await getMyAttendanceHistory();
            setAttendanceData(records);
        } catch (err) {
            toast.error("Could not load your attendance history.");
            console.error("Attendance History Error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    const stats = useMemo(() => {
        const total = attendanceData.length;
        if (total === 0) return { present: 0, absent: 0, excused: 0, rate: 100 };
        const present = attendanceData.filter(r => r.status === 'Present' || r.status === 'Late').length;
        const absent = attendanceData.filter(r => r.status === 'Absent').length;
        const excused = attendanceData.filter(r => r.status === 'Excused').length;
        const validDays = total - excused;
        const rate = validDays > 0 ? Math.round((present / validDays) * 100) : 100;
        return { present, absent, excused, rate };
    }, [attendanceData]);
    
    const getStatusBadge = (status: string) => {
        const map: { [key: string]: string } = { 'Present': 'bg-green-100 text-green-800', 'Absent': 'bg-red-100 text-red-800', 'Excused': 'bg-blue-100 text-blue-800', 'Late': 'bg-yellow-100 text-yellow-800' };
        return <Badge className={map[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Attendance History</h1>
                <p className="text-muted-foreground">A detailed record of your attendance across all programs.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Overall Rate</CardDescription>
                        <CardTitle className="text-3xl">{stats.rate}%</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Days Present</CardDescription>
                        <CardTitle className="text-3xl text-green-600">{stats.present}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Days Absent</CardDescription>
                        <CardTitle className="text-3xl text-red-600">{stats.absent}</CardTitle>
                    </CardHeader>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Days Excused</CardDescription>
                        <CardTitle className="text-3xl text-blue-600">{stats.excused}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Detailed Log</CardTitle></CardHeader>
                <CardContent>
                     {loading ? (
                        <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin"/></div>
                     ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Program</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Check-in Time</TableHead>
                                    <TableHead>Method</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendanceData.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="h-24 text-center">No attendance history found.</TableCell></TableRow>
                                ) : (
                                    attendanceData.map(record => (
                                        <TableRow key={record._id}>
                                            <TableCell className="font-medium">{record.date}</TableCell>
                                            <TableCell>{record.programId?.name || 'N/A'}</TableCell>
                                            <TableCell>{getStatusBadge(record.status)}</TableCell>
                                            <TableCell>{record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</TableCell>
                                            <TableCell className="capitalize">{record.method?.replace('_', ' ')}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                     )}
                </CardContent>
            </Card>
        </div>
    );
}