"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, Calendar, Users, BarChart, Download, Percent, Clock, FileText } from "lucide-react"; // Added FileText
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ProgramAttendanceReportData, getProgramAttendanceReport } from "@/lib/services/attendance.service"; // Updated import
import { getAllPrograms } from "@/lib/services/program.service";
import { Program } from "@/types";
import { exportProgramAttendanceExcel, exportProgramAttendancePDF, downloadBlob } from "@/lib/services/export.service"; // New imports

export default function ManagerAttendancePage() {
    const [programs, setPrograms] = useState<Program[]>([]);
    // Updated state to hold the structured report data
    const [attendanceReport, setAttendanceReport] = useState<ProgramAttendanceReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false); // New state for export loading
    const [selectedProgramId, setSelectedProgramId] = useState<string>("");
    
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    const [dateRange, setDateRange] = useState({ from: thirtyDaysAgo, to: today });

    /**
     * Fetches the list of programs accessible to the current user (Program Manager).
     */
    const fetchPrograms = useCallback(async () => {
        setLoading(true);
        try {
            const progs = await getAllPrograms(); // This correctly fetches programs the user has access to
            setPrograms(progs);
            // Automatically select the first program if available
            if (progs.length > 0) {
                setSelectedProgramId(progs[0]._id);
            } else {
                setLoading(false); // No programs to load, so stop loading
            }
        } catch (err) {
            toast.error("Could not load your programs.");
            setLoading(false);
        }
    }, []);

    /**
     * Fetches the attendance report for the selected program and date range.
     */
    const fetchReport = useCallback(async () => {
        if (!selectedProgramId) {
            setAttendanceReport(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const report = await getProgramAttendanceReport(selectedProgramId, dateRange.from, dateRange.to);
            setAttendanceReport(report);
        } catch (err) {
            toast.error("Failed to fetch attendance report.");
            setAttendanceReport(null); // Clear report on error
        } finally {
            setLoading(false);
        }
    }, [selectedProgramId, dateRange]);

    // Initial load of programs
    useEffect(() => { fetchPrograms(); }, [fetchPrograms]);

    // Fetch report whenever selected program or date range changes
    useEffect(() => { fetchReport(); }, [fetchReport]);

    /**
     * Returns a Unicode symbol for attendance status.
     * Matches the symbols used in the backend `excel_pdf_attendance_service.js`.
     * @param status The attendance status (e.g., 'Present', 'Late', 'Absent', 'Excused').
     * @returns Corresponding Unicode symbol.
     */
    const getStatusSymbol = (status: string) => {
        switch (status) {
            case 'Present': return '✔️';
            case 'Late': return '⚠️'; 
            case 'Absent': return '❌';
            case 'Excused': return '✅';
            default: return '❓';
        }
    };

    /**
     * Handles the export of the current attendance report to PDF or Excel.
     * @param format The desired export format ('pdf' or 'excel').
     */
    const handleExport = async (format: 'pdf' | 'excel') => {
        if (!selectedProgramId || !dateRange.from || !dateRange.to) {
            toast.error("Please select a program and date range first.");
            return;
        }
        if (!attendanceReport || attendanceReport.traineeReports.length === 0) {
            toast.info("No data to export for the selected criteria.");
            return;
        }
        setExporting(true);
        try {
            let blob: Blob;
            if (format === 'pdf') {
                blob = await exportProgramAttendancePDF(selectedProgramId, dateRange.from, dateRange.to);
            } else {
                blob = await exportProgramAttendanceExcel(selectedProgramId, dateRange.from, dateRange.to);
            }
            const programName = attendanceReport?.programName.replace(/\s+/g, '-') || 'program';
            const filename = `attendance_report_${programName}_${dateRange.from}_${dateRange.to}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
            downloadBlob(blob, filename);
            toast.success(`Report exported as ${format.toUpperCase()}!`);
        } catch (err) {
            toast.error("Failed to export report.");
            console.error("Export error:", err);
        } finally {
            setExporting(false);
        }
    };

    // Calculate summary statistics to display in the cards
    const summaryStats = attendanceReport?.summaryStats || {
        totalDaysInPeriod: 0, totalPresentCount: 0, totalAbsentCount: 0,
        totalLateCount: 0, totalExcusedCount: 0, totalTrainees: 0
    };

    // Calculate overall attendance rate based on present and late marks vs total possible days
    const overallAttendanceRate = summaryStats.totalDaysInPeriod > 0 && summaryStats.totalTrainees > 0
        ? Math.round(((summaryStats.totalPresentCount + summaryStats.totalLateCount) / (summaryStats.totalDaysInPeriod * summaryStats.totalTrainees)) * 100)
        : 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Attendance Dashboard</h1>
                <p className="text-muted-foreground">Monitor attendance across your programs.</p>
            </div>
            {/* Filter Card */}
            <Card>
                <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Select Program</Label>
                        <Select value={selectedProgramId} onValueChange={setSelectedProgramId} disabled={loading && programs.length === 0}>
                            <SelectTrigger>
                                {loading && programs.length === 0 ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                                <SelectValue placeholder="Select a program..."/>
                            </SelectTrigger>
                            <SelectContent>
                                {programs.length === 0 ? (
                                    <SelectItem value="no-programs" disabled>No programs available</SelectItem>
                                ) : (
                                    programs.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)
                                )}
                            </SelectContent>
                        </Select>
                        {programs.length === 0 && !loading && <p className="text-sm text-red-500">No programs found for your role.</p>}
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
            
            {/* Summary Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Overall Rate</CardTitle><Percent className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{overallAttendanceRate}%</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Present Marks</CardTitle><Users className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{summaryStats.totalPresentCount}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Absent Marks</CardTitle><Users className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{summaryStats.totalAbsentCount}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Late Marks</CardTitle><Clock className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{summaryStats.totalLateCount}</div></CardContent></Card>
            </div>

            {/* Detailed Log Table Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Detailed Log</CardTitle>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => handleExport('pdf')} 
                            disabled={exporting || !attendanceReport || attendanceReport.traineeReports.length === 0}
                        >
                            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileText className="mr-2 h-4 w-4"/>}Export PDF
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => handleExport('excel')} 
                            disabled={exporting || !attendanceReport || attendanceReport.traineeReports.length === 0}
                        >
                            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>}Export Excel
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div>
                    ) : (
                        (!attendanceReport || attendanceReport.traineeReports.length === 0) ? (
                            <div className="text-center h-24 flex items-center justify-center">
                                <p className="text-muted-foreground">No attendance data found for the selected program and date range.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="sticky left-0 bg-background z-10 w-[150px]">Trainee Name</TableHead>
                                            {attendanceReport.reportDates.map(date => (
                                                <TableHead key={date} className="text-center min-w-[70px]">
                                                    {new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' })}
                                                </TableHead>
                                            ))}
                                            <TableHead className="text-center min-w-[40px]">P</TableHead> {/* Present */}
                                            <TableHead className="text-center min-w-[40px]">L</TableHead> {/* Late */}
                                            <TableHead className="text-center min-w-[40px]">A</TableHead> {/* Absent */}
                                            <TableHead className="text-center min-w-[40px]">E</TableHead> {/* Excused */}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {attendanceReport.traineeReports.map(report => (
                                            <TableRow key={report.trainee._id}>
                                                <TableCell className="font-medium sticky left-0 bg-background">
                                                    {report.trainee.name}
                                                    <div className="text-xs text-muted-foreground">{report.trainee.email}</div>
                                                </TableCell>
                                                {report.dailyAttendance.map(daily => (
                                                    <TableCell key={daily.date} className="text-center text-lg">
                                                        {getStatusSymbol(daily.status)}
                                                    </TableCell>
                                                ))}
                                                <TableCell className="text-center font-bold">{report.summary.present}</TableCell>
                                                <TableCell className="text-center font-bold">{report.summary.late}</TableCell>
                                                <TableCell className="text-center font-bold">{report.summary.absent}</TableCell>
                                                <TableCell className="text-center font-bold">{report.summary.excused}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )
                    )}
                </CardContent>
            </Card>
        </div>
    );
}