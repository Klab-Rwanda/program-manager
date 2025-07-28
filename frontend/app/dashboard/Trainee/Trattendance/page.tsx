"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Loader2, MapPin, Video, CheckCircle, Info, Calendar, History, BarChart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getTraineeSessions, getMyAttendanceHistory, markGeolocationAttendance, ClassSession } from "@/lib/services/attendance.service";
import { AttendanceRecord } from "@/types";

export default function TraineeAttendancePage() {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGeoSession, setActiveGeoSession] = useState<ClassSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch both current sessions and past history in parallel
      const [sessionsData, historyData] = await Promise.all([
        getTraineeSessions(),
        getMyAttendanceHistory()
      ]);
      setSessions(sessionsData);
      setHistory(historyData);
    } catch (err) {
      toast.error("Failed to load your attendance data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  
  const handleGeoAttendance = async (session: ClassSession) => {
    setIsProcessing(true);
    toast.info("Getting your location...");
    
    // *** REMOVED DEVELOPMENT ONLY MOCK BLOCK ***
    // Now, always execute the production geolocation logic

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await markGeolocationAttendance(session.sessionId, position.coords.latitude, position.coords.longitude);
          toast.success("Attendance marked successfully!");
          setActiveGeoSession(null);
          fetchData(); // Refetch data after marking
        } catch (err: any) {
          toast.error(err.response?.data?.message || "Failed to mark attendance.");
        } finally {
          setIsProcessing(false);
        }
      },
      (error) => { 
        let msg = 'Location Error: ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg += 'You denied geolocation access. Please enable it in browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            msg += 'Location request timed out.';
            break;
          default:
            msg += error.message || 'An unknown error occurred.';
        }
        toast.error(msg); 
        setIsProcessing(false); 
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // High accuracy, 10s timeout
    );
  };

  const activeSessions = useMemo(() => sessions.filter(s => s.status === 'active'), [sessions]);
  const upcomingSessions = useMemo(() => sessions.filter(s => s.status === 'scheduled'), [sessions]);

  const getStatusBadge = (status: string) => {
      const map: { [key: string]: string } = { 'Present': 'bg-green-100 text-green-800', 'Absent': 'bg-red-100 text-red-800', 'Excused': 'bg-blue-100 text-blue-800', 'Late': 'bg-yellow-100 text-yellow-800' };
      return <Badge className={map[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin"/></div>;
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
        <p className="text-muted-foreground">Manage your session attendance and view your history.</p>
      </div>
      
      <Tabs defaultValue="actions">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="history">My History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="actions" className="space-y-6 mt-4">
            <Card className="border-blue-300 bg-blue-50">
                <CardHeader><CardTitle>Active Sessions ({activeSessions.length})</CardTitle></CardHeader>
                <CardContent>
                    {activeSessions.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {activeSessions.map(session => (
                                <div key={session._id} className="p-4 bg-white rounded-lg border shadow-sm space-y-3">
                                    <h3 className="font-semibold">{session.title}</h3>
                                    <p className="text-sm text-muted-foreground">{session.programId.name}</p>
                                    {session.type === 'physical' ? (
                                        <Button className="w-full" onClick={() => setActiveGeoSession(session)} disabled={isProcessing}>
                                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <MapPin className="mr-2 h-4 w-4" />} Mark Attendance
                                        </Button>
                                    ) : (
                                        <Link href={`/dashboard/classroom/${session.sessionId}`} passHref className="flex-1"><Button className="w-full bg-[#1f497d] hover:bg-[#1a3f6b]"><Video className="mr-2"/> Join Classroom</Button></Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : <div className="text-center py-6 text-muted-foreground"><CheckCircle className="mx-auto h-8 w-8 mb-2 text-green-500"/><p>No sessions are currently active.</p></div>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Upcoming Sessions ({upcomingSessions.length})</CardTitle></CardHeader>
                <CardContent>
                    {upcomingSessions.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {upcomingSessions.map(session => (
                                <div key={session._id} className="p-4 bg-gray-50 rounded-lg border space-y-2">
                                    <h3 className="font-semibold text-gray-700">{session.title}</h3>
                                    <p className="text-sm text-muted-foreground">{session.programId.name}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3"/> Starts: {new Date(session.startTime).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    ) : <div className="text-center py-6 text-muted-foreground"><Info className="mx-auto h-8 w-8 mb-2 text-gray-400"/><p>You have no upcoming sessions scheduled.</p></div>}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
            <Card>
                <CardHeader><CardTitle>Full Attendance Log</CardTitle><CardDescription>Your complete attendance record for all programs.</CardDescription></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Program</TableHead><TableHead>Status</TableHead><TableHead>Time</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {history.length === 0 ? <TableRow><TableCell colSpan={4} className="h-24 text-center">No attendance history found.</TableCell></TableRow> :
                            history.map(record => (
                                <TableRow key={record._id}>
                                    <TableCell className="font-medium">{record.date}</TableCell>
                                    <TableCell>{record.programId?.name || 'N/A'}</TableCell>
                                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                                    <TableCell>{record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</TableCell>
                                    <TableCell className="capitalize">{record.method?.replace('_', ' ')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!activeGeoSession} onOpenChange={() => setActiveGeoSession(null)}>
        <DialogContent>
            <DialogHeader><DialogTitle>Mark Physical Attendance</DialogTitle></DialogHeader>
            <div className="text-center space-y-4 py-4">
                <MapPin className="h-16 w-16 mx-auto text-[#1f497d]"/>
                <p>Confirm your location for "{activeGeoSession?.title}".</p>
                <Button onClick={() => handleGeoAttendance(activeGeoSession!)} disabled={isProcessing} size="lg" className="w-full">
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <MapPin className="mr-2 h-4 w-4" />}
                    Confirm My Location
                </Button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}