"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, Download, Eye, Percent, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getProgramAttendanceSummary } from "@/lib/services/attendance.service";
import { getAllPrograms } from "@/lib/services/program.service";
import { Program, StudentSummary } from "@/types";
import { StudentAttendanceSheet } from "@/components/manager/StudentAttendanceSheet"; // Use the new Sheet component

export default function ManagerAttendancePage() {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [summaryData, setSummaryData] = useState<StudentSummary[]>([]);
    const [totalSessions, setTotalSessions] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedProgramId, setSelectedProgramId] = useState<string>("");
    
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    const [dateRange, setDateRange] = useState({ from: thirtyDaysAgo, to: today });

    // State for the Sheet (previously modal)
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);

    const handleViewDetails = (student: StudentSummary) => {
        setSelectedStudent(student);
        setIsSheetOpen(true);
    };

    // Fetch initial list of programs
    useEffect(() => {
        const fetchPrograms = async () => {
            setLoading(true);
            try {
                const progs = await getAllPrograms();
                setPrograms(progs);
                if (progs.length > 0) {
                    setSelectedProgramId(progs[0]._id);
                }
            } catch (err: any) {
                toast.error("Could not load your programs.", { description: err.message });
            } finally {
                setLoading(false);
            }
        };
        fetchPrograms();
    }, []);

    // Fetch summary report when program or date changes
    useEffect(() => {
        if (!selectedProgramId) {
            setSummaryData([]);
            setTotalSessions(0);
            return;
        }

        const fetchReport = async () => {
            setLoading(true);
            try {
                const { report, totalSessions } = await getProgramAttendanceSummary(selectedProgramId, dateRange.from, dateRange.to);
                setSummaryData(report);
                setTotalSessions(totalSessions);
            } catch (err: any) {
                toast.error("Failed to fetch attendance summary.", { description: err.message });
                setSummaryData([]);
                setTotalSessions(0);
            } finally {
                setLoading(false);
            }
        };
        
        fetchReport();
    }, [selectedProgramId, dateRange]);

    const overallStats = useMemo(() => {
        if (summaryData.length === 0 || totalSessions === 0) {
            return { rate: 0, present: 0, absent: 0, late: 0 };
        }
        
        const totalPresentRecords = summaryData.reduce((acc, s) => acc + s.present, 0);
        const totalExcusedRecords = summaryData.reduce((acc, s) => acc + s.excused, 0);
        const totalPossibleAttendances = summaryData.length * totalSessions;

        const denominator = totalPossibleAttendances - totalExcusedRecords;
        const rate = denominator > 0 ? Math.round((totalPresentRecords / denominator) * 100) : 0;
        
        return {
            rate: isNaN(rate) ? 0 : rate,
            present: summaryData.reduce((acc, s) => acc + s.present, 0),
            absent: summaryData.reduce((acc, s) => acc + s.absent, 0),
            late: summaryData.reduce((acc, s) => acc + s.late, 0),
        };
    }, [summaryData, totalSessions]);

    return (
        <>
            <StudentAttendanceSheet 
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                student={selectedStudent}
            />
            <div className="space-y-6 p-4 md:p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Attendance Dashboard</h1>
                    <p className="text-muted-foreground">Monitor attendance summaries across your programs.</p>
                </div>
                
                <Card>
                    <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="program-select">Select Program</Label>
                            <Select value={selectedProgramId} onValueChange={setSelectedProgramId} disabled={loading}>
                                <SelectTrigger id="program-select"><SelectValue placeholder="Select a program..."/></SelectTrigger>
                                <SelectContent>{programs.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="start-date">Start Date</Label>
                            <Input id="start-date" type="date" value={dateRange.from} onChange={(e) => setDateRange(d => ({...d, from: e.target.value}))}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end-date">End Date</Label>
                            <Input id="end-date" type="date" value={dateRange.to} onChange={(e) => setDateRange(d => ({...d, to: e.target.value}))}/>
                        </div>
                    </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Overall Attendance Rate</CardTitle><Percent className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{overallStats.rate}%</div><p className="text-xs text-muted-foreground">Across {totalSessions} sessions</p></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Present</CardTitle><CheckCircle className="h-4 w-4 text-green-500"/></CardHeader><CardContent><div className="text-2xl font-bold">{overallStats.present}</div><p className="text-xs text-muted-foreground">Total attendances marked 'Present' or 'Late'</p></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Absences</CardTitle><XCircle className="h-4 w-4 text-red-500"/></CardHeader><CardContent><div className="text-2xl font-bold">{overallStats.absent}</div><p className="text-xs text-muted-foreground">Total unexcused absences</p></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Late</CardTitle><Clock className="h-4 w-4 text-yellow-500"/></CardHeader><CardContent><div className="text-2xl font-bold">{overallStats.late}</div><p className="text-xs text-muted-foreground">A subset of 'Present'</p></CardContent></Card>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Student Summary</CardTitle>
                            <CardDescription>Overall attendance for each student in the selected period. ({totalSessions} total sessions)</CardDescription>
                        </div>
                        <Button variant="outline" disabled={loading || summaryData.length === 0}><Download className="mr-2 h-4 w-4"/>Export CSV</Button>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center items-center h-48">
                                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader><TableRow><TableHead>Student</TableHead><TableHead className="text-center">Rate</TableHead><TableHead className="text-center">Present</TableHead><TableHead className="text-center">Absent</TableHead><TableHead className="text-center">Late</TableHead><TableHead className="text-center">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {summaryData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                                No student data found for the selected program and date range.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        summaryData.map(student => (
                                            <TableRow key={student.userId}>
                                                <TableCell className="font-medium">
                                                    <div>{student.name}</div>
                                                    <div className="text-sm text-muted-foreground">{student.email}</div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`text-lg font-bold ${student.attendanceRate >= 80 ? 'text-green-600' : student.attendanceRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                        {student.attendanceRate}%
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center text-green-600">{student.present}</TableCell>
                                                <TableCell className="text-center text-red-600">{student.absent}</TableCell>
                                                <TableCell className="text-center text-yellow-600">{student.late}</TableCell>
                                                <TableCell className="text-center">
                                                    <Button variant="ghost" size="icon" onClick={() => handleViewDetails(student)}>
                                                        <Eye className="h-4 w-4" />
                                                        <span className="sr-only">View Details</span>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}