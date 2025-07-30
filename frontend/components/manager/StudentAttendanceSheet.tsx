import React from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StudentSummary } from "@/types";
import { CheckCircle2, XCircle, Clock, Percent, CalendarDays } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface SheetProps {
    isOpen: boolean;
    onClose: () => void;
    student: StudentSummary | null;
}

// Helper for status badges
const getStatusBadge = (status: string) => {
    const map: { [key: string]: string } = {
        'Present': 'border-transparent bg-green-100 text-green-800 hover:bg-green-100',
        'Late': 'border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
        'Absent': 'border-transparent bg-red-100 text-red-800 hover:bg-red-100',
        'Excused': 'border-transparent bg-blue-100 text-blue-800 hover:bg-blue-100',
    };
    return <Badge variant="outline" className={map[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
};

// Helper for building the calendar's highlighted days
const getCalendarModifiers = (records: StudentSummary['records']) => {
    const modifiers: { [key: string]: Date[] } = {
        present: [], late: [], absent: [], excused: []
    };
    records.forEach(r => {
        const date = new Date(r.date);
        date.setUTCHours(12); // Normalize to avoid timezone issues with highlighting
        if (r.status === 'Present') modifiers.present.push(date);
        else if (r.status === 'Late') modifiers.late.push(date);
        else if (r.status === 'Absent') modifiers.absent.push(date);
        else if (r.status === 'Excused') modifiers.excused.push(date);
    });
    return modifiers;
};

// A small sub-component for the stat cards to keep the main return clean
const StatCard = ({ icon, title, value, subtext, colorClass }: { icon: React.ReactNode, title: string, value: string | number, subtext: string, colorClass: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className={colorClass}>{icon}</div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{subtext}</p>
        </CardContent>
    </Card>
);

export function StudentAttendanceSheet({ isOpen, onClose, student }: SheetProps) {
    if (!student) return null;

    const calendarModifiers = getCalendarModifiers(student.records);
    const totalRecords = student.present + student.absent + student.excused; // Total check-ins

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-2xl font-bold">{student.name}</SheetTitle>
                    <SheetDescription>{student.email}</SheetDescription>
                </SheetHeader>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                     <StatCard 
                        icon={<Percent size={20}/>}
                        title="Attendance Rate"
                        value={`${student.attendanceRate}%`}
                        subtext="Based on attended vs. total sessions"
                        colorClass="text-blue-500"
                     />
                     <StatCard 
                        icon={<CheckCircle2 size={20}/>}
                        title="Present"
                        value={student.present}
                        subtext="Includes 'Late' arrivals"
                        colorClass="text-green-500"
                     />
                     <StatCard 
                        icon={<XCircle size={20}/>}
                        title="Absent"
                        value={student.absent}
                        subtext="Unexcused absences"
                        colorClass="text-red-500"
                     />
                     <StatCard 
                        icon={<Clock size={20}/>}
                        title="Late"
                        value={student.late}
                        subtext="Counted as Present"
                        colorClass="text-yellow-600"
                     />
                </div>

                <Separator className="my-6" />
                
                <div className="space-y-6">
                    {/* Calendar View */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center"><CalendarDays className="mr-2 h-5 w-5"/> Attendance Calendar</h3>
                        <div className="flex flex-col md:flex-row gap-4 items-start">
                            <DayPicker
                                mode="multiple"
                                min={0}
                                selected={Object.values(calendarModifiers).flat()}
                                modifiers={calendarModifiers}
                                modifiersClassNames={{
                                    present: 'rdp-day_present',
                                    late: 'rdp-day_late',
                                    absent: 'rdp-day_absent',
                                    excused: 'rdp-day_excused',
                                }}
                                className="bg-muted p-3 rounded-md border"
                            />
                            <div className="space-y-2 text-sm p-3 bg-muted/50 rounded-md border w-full md:w-auto">
                                <p className="font-semibold mb-2">Legend:</p>
                               <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-400 mr-2 border border-green-600"></span> Present</div>
                               <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-400 mr-2 border border-yellow-600"></span> Late</div>
                               <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-400 mr-2 border border-red-600"></span> Absent</div>
                               <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-400 mr-2 border border-blue-600"></span> Excused</div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Detailed Log Table */}
                    <div>
                         <h3 className="text-lg font-semibold mb-3">Detailed Log</h3>
                         <div className="border rounded-md max-h-[350px] overflow-y-auto">
                            <Table>
                               <TableHeader className="sticky top-0 bg-secondary">
                                   <TableRow>
                                       <TableHead className="w-[120px]">Date</TableHead>
                                       <TableHead>Session Title</TableHead>
                                       <TableHead>Status</TableHead>
                                       <TableHead className="text-right">Check-in Time</TableHead>
                                   </TableRow>
                               </TableHeader>
                               <TableBody>
                                   {student.records.length > 0 ? student.records.map((record, index) => (
                                       <TableRow key={index}>
                                           <TableCell className="font-medium">{record.date}</TableCell>
                                           <TableCell>{record.sessionTitle || 'N/A'}</TableCell>
                                           <TableCell>{getStatusBadge(record.status)}</TableCell>
                                           <TableCell className="text-right">{record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</TableCell>
                                       </TableRow>
                                   )) : <TableRow><TableCell colSpan={4} className="text-center h-24">No attendance records in this period.</TableCell></TableRow>}
                               </TableBody>
                           </Table>
                         </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}