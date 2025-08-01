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
import { 
    getTraineeSessions, 
    getMyAttendanceHistory, 
    markGeolocationAttendance, 
    ClassSession 
} from "@/lib/services/attendance.service";
import { Program, AttendanceRecord as BackendAttendanceRecord } from "@/types"; // Import original AttendanceRecord
import { getAllPrograms } from "@/lib/services/program.service"; // To get list of programs for filter
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Extend the AttendanceRecord interface to include session details
interface ExtendedAttendanceRecord extends BackendAttendanceRecord {
  sessionTitle: string;
  sessionType: 'physical' | 'online';
  sessionTime: string;
}

export default function TraineeAttendancePage() {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [history, setHistory] = useState<ExtendedAttendanceRecord[]>([]); // Use extended interface
  const [programs, setPrograms] = useState<Program[]>([]); // New state for programs
  const [loading, setLoading] = useState(true);
  const [activeGeoSession, setActiveGeoSession] = useState<ClassSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // New state for history filters
  const today = new Date();
  const defaultStartDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]; // Start of current month
  const defaultEndDate = today.toISOString().split('T')[0]; // Today's date
  const [historyFilters, setHistoryFilters] = useState({
      programId: 'all', // 'all' for all programs, or program _id
      startDate: defaultStartDate,
      endDate: defaultEndDate,
  });
  const [activeTab, setActiveTab] = useState("actions"); // State to manage active tab

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch available sessions (active/upcoming) using current date filters
      const sessionsData = await getTraineeSessions(
          historyFilters.startDate, // Pass start date for sessions
          historyFilters.endDate    // Pass end date for sessions
      );
      setSessions(sessionsData);

      // Fetch all programs the trainee is associated with (for filter dropdown)
      const allPrograms = await getAllPrograms(); // This should filter by trainee's enrollment
      setPrograms(allPrograms);

      // Fetch history based on current filters
      const historyData = await getMyAttendanceHistory(
          historyFilters.programId === 'all' ? undefined : historyFilters.programId,
          historyFilters.startDate,
          historyFilters.endDate
      ) as ExtendedAttendanceRecord[]; // Cast to ExtendedAttendanceRecord
      setHistory(historyData);
    } catch (err) {
      toast.error("Failed to load your attendance data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [historyFilters]); // Re-fetch when filters change

  useEffect(() => { fetchData(); }, [fetchData]);
  
  const handleGeoAttendance = async (session: ClassSession) => {
    setIsProcessing(true);
    toast.info("Getting your location...");
    
    // DEVELOPMENT ONLY MOCK (If you still use this, you can remove it for production)
    // if (process.env.NODE_ENV === 'development') {
    //   try {
    //     await new Promise(res => setTimeout(res, 1000));
    //     await markGeolocationAttendance(session.sessionId, -1.9441, 30.0619); // Mock kLab location
    //     toast.success("Attendance marked (dev mock)!");
    //     setActiveGeoSession(null);
    //     fetchData(); // Refetch both sessions and history
    //   } catch (err: any) {
    //     toast.error(err.response?.data?.message || "Mock attendance failed.");
    //   } finally {
    //     setIsProcessing(false);
    //   }
    //   return;
    // }
    
    // Production code
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
      const map: { [key: string]: string } = { 
          'Present': 'bg-green-100 text-green-800', 
          'Absent': 'bg-red-100 text-red-800', 
          'Excused': 'bg-blue-100 text-blue-800', 
          'Late': 'bg-yellow-100 text-yellow-800' 
      };
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
      
      <Tabs value={activeTab} onValueChange={setActiveTab}> {/* Controlled Tab */}
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
                <CardHeader>
                    <CardTitle>Full Attendance Log</CardTitle>
                    <CardDescription>Your complete attendance record for all programs.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-2">
                            <Label htmlFor="programFilter">Filter by Program</Label>
                            <Select 
                                value={historyFilters.programId} 
                                onValueChange={(value) => setHistoryFilters(prev => ({ ...prev, programId: value }))}
                            >
                                <SelectTrigger id="programFilter">
                                    <SelectValue placeholder="All Programs" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Programs</SelectItem>
                                    {programs.map(p => (
                                        <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input 
                                id="startDate" 
                                type="date" 
                                value={historyFilters.startDate} 
                                onChange={(e) => setHistoryFilters(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input 
                                id="endDate" 
                                type="date" 
                                value={historyFilters.endDate} 
                                onChange={(e) => setHistoryFilters(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                        </div>
                    </div>

                    <Table>
                        <TableHeader><TableRow><TableHead>Session Title</TableHead><TableHead>Program</TableHead><TableHead>Date</TableHead><TableHead>Time</TableHead><TableHead>Status</TableHead><TableHead>Method</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {history.length === 0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center">No attendance history found for the selected filters.</TableCell></TableRow> :
                            history.map(record => (
                                <TableRow key={record._id.toString()}> {/* Ensure _id is converted to string for key */}
                                    <TableCell className="font-medium">{record.sessionTitle}</TableCell>
                                    <TableCell>{record.programId?.name || 'N/A'}</TableCell>
                                    <TableCell>{record.date}</TableCell>
                                    <TableCell>{new Date(record.sessionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                                    <TableCell className="capitalize">{record.method?.replace('_', ' ') || 'N/A'}</TableCell>
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