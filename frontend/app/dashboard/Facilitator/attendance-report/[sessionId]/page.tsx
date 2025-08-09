// app/dashboard/Facilitator/attendance-report/[sessionId]/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Calendar, Clock, Users, MapPin, CheckCircle, XCircle, Info, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getSessionAttendance, ClassSession } from "@/lib/services/attendance.service";
import { AttendanceRecord } from "@/types"; // Assuming this type is defined globally or imported

export default function FacilitatorAttendanceReportPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;

  const [session, setSession] = useState<ClassSession | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!sessionId) {
      setError("Session ID is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { session, attendance } = await getSessionAttendance(sessionId);
      setSession(session);
      setAttendanceRecords(attendance);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load session attendance report.");
      toast.error(error); // Display toast for fetch error
    } finally {
      setLoading(false);
    }
  }, [sessionId, error]); // Include error in dependency array to re-fetch on error clear if needed

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate session duration for display
  const sessionDuration = useMemo(() => {
    if (!session || !session.startTime || !session.endTime) return "N/A";
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);
    const diffMs = end.getTime() - start.getTime();
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    let durationString = "";
    if (hours > 0) durationString += `${hours}h `;
    if (remainingMinutes > 0 || (hours === 0 && remainingMinutes === 0)) durationString += `${remainingMinutes}m`;
    
    return durationString.trim();
  }, [session]);

  const getStatusBadge = (status: string) => {
    const map: { [key: string]: string } = { 
        'Present': 'bg-green-100 text-green-800', 
        'Absent': 'bg-red-100 text-red-800', 
        'Excused': 'bg-blue-100 text-blue-800', 
        'Late': 'bg-yellow-100 text-yellow-800' 
    };
    return <Badge className={map[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading attendance report...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
        <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600">{error}</p>
        <Button onClick={() => router.push('/dashboard/Facilitator/Fac-attendance')} className="mt-4">Back to Sessions</Button>
      </div>
    );
  }

  // Fallback if session somehow becomes null after loading (e.g., if ID was invalid but no error thrown)
  if (!session) {
      return (
          <div className="text-center p-8">
              <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Session details could not be loaded.</p>
              <Button onClick={() => router.push('/dashboard/Facilitator/Fac-attendance')} className="mt-4">Back to Sessions</Button>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Sessions
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{session.title}</CardTitle>
          <CardDescription>Attendance Report for {session.programId?.name || 'Unknown Program'}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Start Time</p>
              <p className="font-medium">{new Date(session.startTime).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">End Time</p>
              <p className="font-medium">{session.endTime ? new Date(session.endTime).toLocaleString() : 'Not ended yet'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">{sessionDuration}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Facilitator</p>
              <p className="font-medium">{session.facilitatorId?.name || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Session Type</p>
              <p className="font-medium capitalize">{session.type}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendee List ({attendanceRecords.length})</CardTitle>
          <CardDescription>Detailed attendance for this session.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No attendance records for this session yet.
                  </TableCell>
                </TableRow>
              ) : (
                attendanceRecords.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell className="font-medium">{record.userId?.name || 'N/A'}</TableCell>
                    <TableCell className="text-muted-foreground">{record.userId?.email || 'N/A'}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell className="capitalize">{record.method?.replace('_', ' ') || 'N/A'}</TableCell>
                    <TableCell>{new Date(record.timestamp).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}