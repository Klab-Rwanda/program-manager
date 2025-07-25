"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, Calendar, Users, BarChart, Download, Percent, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getProgramAttendanceReport } from "@/lib/services/attendance.service";
import { getAllPrograms } from "@/lib/services/program.service";
import { Program, AttendanceRecord } from "@/types";

export default function ManagerAttendancePage() {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProgramId, setSelectedProgramId] = useState<string>("");
    
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    const [dateRange, setDateRange] = useState({ from: thirtyDaysAgo, to: today });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const progs = await getAllPrograms();
            setPrograms(progs);
            if (progs.length > 0) {
                setSelectedProgramId(progs[0]._id);
            } else {
                setLoading(false);
            }
        } catch (err) {
            toast.error("Could not load your programs.");
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        const fetchReport = async () => {
            if (!selectedProgramId) return;
            setLoading(true);
            try {
                const records = await getProgramAttendanceReport(selectedProgramId, dateRange.from, dateRange.to);
                setAttendanceData(records);
            } catch (err) {
                toast.error("Failed to fetch attendance report.");
                setAttendanceData([]);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [selectedProgramId, dateRange]);

    const overallStats = useMemo(() => {
        const totalRecords = attendanceData.length;
        if (totalRecords === 0) return { present: 0, absent: 0, excused: 0, late: 0, rate: 0 };
        const present = attendanceData.filter(r => r.status === 'Present' || r.status === 'Late').length;
        const absent = attendanceData.filter(r => r.status === 'Absent').length;
        const excused = attendanceData.filter(r => r.status === 'Excused').length;
        const late = attendanceData.filter(r => r.status === 'Late').length;
        const rate = Math.round((present / (totalRecords - excused)) * 100) || 0;
        return { present, absent, excused, late, rate };
    }, [attendanceData]);
    
    const getStatusBadge = (status: string) => {
        const map: { [key: string]: string } = { 'Present': 'bg-green-100 text-green-800', 'Absent': 'bg-red-100 text-red-800', 'Excused': 'bg-blue-100 text-blue-800', 'Late': 'bg-yellow-100 text-yellow-800' };
        return <Badge className={map[status]}>{status}</Badge>;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Attendance Dashboard</h1>
                <p className="text-muted-foreground">Monitor attendance across your programs.</p>
            </div>
            <Card>
                <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Select Program</Label>
                        <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                            <SelectTrigger><SelectValue placeholder="Select a program..."/></SelectTrigger>
                            <SelectContent>{programs.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input type="date" value={dateRange.from} onChange={(e) => setDateRange(d => ({...d, from: e.target.value}))}/>
                    </div>
                     <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input type="date" value={dateRange.to} onChange={(e) => setDateRange(d => ({...d, to: e.target.value}))}/>
                    </div>
                </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Attendance Rate</CardTitle><Percent className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{overallStats.rate}%</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Present</CardTitle><Users className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{overallStats.present}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Absent</CardTitle><Users className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{overallStats.absent}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Late</CardTitle><Clock className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{overallStats.late}</div></CardContent></Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Detailed Log</CardTitle>
                    <Button variant="outline"><Download className="mr-2 h-4 w-4"/>Export</Button>
                </CardHeader>
                <CardContent>
                    {loading ? <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div> : (
                        <Table>
                            <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Check-in Time</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {attendanceData.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center h-24">No records found for the selected filters.</TableCell></TableRow> : 
                                attendanceData.map(record => (
                                    <TableRow key={record._id}>
                                        <TableCell className="font-medium">{record.userId?.name || 'N/A'}</TableCell>
                                        <TableCell><Badge variant="outline">{record.userId?.role || 'N/A'}</Badge></TableCell>
                                        <TableCell>{record.date}</TableCell>
                                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                                        <TableCell>{record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : 'N/A'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}