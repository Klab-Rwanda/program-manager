
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, MapPin, QrCode, CheckCircle, Info, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  getTraineeSessions,
  markGeolocationAttendance,
  ClassSession
} from "@/lib/services/attendance.service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TraineeAttendancePage() {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeSession, setActiveSession] = useState<ClassSession | null>(null);
  const [isGeoModalOpen, setGeoModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTraineeSessions();
      setSessions(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load sessions.");
    } finally {
      setLoading(false);

    }
  }, []);


  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleOpenGeoModal = (session: ClassSession) => {
    if (session.status !== 'active') {
      toast.info("This session is not currently active for attendance marking.");
      return;
    }
    setActiveSession(session);
    setGeoModalOpen(true);
  };

  const handleCloseModal = () => {
    setActiveSession(null);
    setGeoModalOpen(false);
    setIsProcessing(false);
  };
  
  const handleGeoAttendance = async () => {
    if (!activeSession) return;
    setIsProcessing(true);
    toast.info("Getting your location...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          await markGeolocationAttendance(activeSession.sessionId, latitude, longitude);
          toast.success("Attendance marked successfully!");
          handleCloseModal();
          fetchSessions();
        } catch (err: any) {
          toast.error(err.response?.data?.message || "Failed to mark attendance.");
        } finally {
          setIsProcessing(false);
        }
      },
      (error) => {
        toast.error(`Location Error: ${error.message}`);
        setIsProcessing(false);
      }, { enableHighAccuracy: true }
    );
  };

  const activeSessions = sessions.filter(s => s.status === 'active');
  const upcomingOrCompletedSessions = sessions.filter(s => s.status !== 'active');

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Sessions</h1>
        <p className="text-muted-foreground">Join your sessions and mark your attendance.</p>
      </div>
      
      {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
            <CardTitle>Active Sessions ({activeSessions.length})</CardTitle>
            <CardDescription>These sessions are live. Join or mark your attendance now.</CardDescription>
        </CardHeader>
        <CardContent>
            {activeSessions.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {activeSessions.map(session => (
                        <div key={session._id} className="p-4 bg-white rounded-lg border shadow-sm space-y-3">
                            <h3 className="font-semibold">{session.title}</h3>
                            <p className="text-sm text-muted-foreground">{session.programId.name}</p>
                            <div className="flex gap-2">
                               {session.type === 'physical' ? (
                                    <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleOpenGeoModal(session)}>
                                        <MapPin className="mr-2 h-4 w-4" /> Mark Attendance
                                    </Button>
                               ) : (
                                    <Link href={`/dashboard/classroom/${session.sessionId}`} passHref className="flex-1">
                                        <Button className="w-full bg-[#1f497d] hover:bg-[#1a3f6b]">
                                            <Eye className="mr-2 h-4 w-4" /> Join Classroom
                                        </Button>
                                    </Link>
                               )}
                            </div>
                        </div>
                    ))}
                </div>

            ) : (
                <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle className="mx-auto h-8 w-8 mb-2 text-green-500"/>
                    <p>No sessions are currently active.</p>
                </div>
            )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>Upcoming & Past Sessions</CardTitle></CardHeader>
        <CardContent>
            {upcomingOrCompletedSessions.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {upcomingOrCompletedSessions.map(session => (
                        <div key={session._id} className="p-4 bg-gray-50 rounded-lg border space-y-2">
                            <h3 className="font-semibold text-gray-700">{session.title}</h3>
                            <p className="text-sm text-muted-foreground">{session.programId.name}</p>
                            <p className="text-xs text-muted-foreground">{session.status === 'scheduled' ? 'Starts' : 'Ended'}: {new Date(session.startTime).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="text-center py-6 text-muted-foreground">
                    <Info className="mx-auto h-8 w-8 mb-2 text-gray-400"/>
                    <p>You have no other scheduled or completed sessions.</p>

                </div>
            )}
        </CardContent>
      </Card>

      <Dialog open={isGeoModalOpen} onOpenChange={setGeoModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Mark Physical Attendance</DialogTitle>
                <DialogDescription>Confirm your location for {activeSession?.title}.</DialogDescription>
            </DialogHeader>
            <div className="text-center space-y-4 py-4">
                <MapPin className="h-16 w-16 mx-auto text-[#1f497d]"/>
                <p>We will use your device's location to verify you are at the class.</p>
                <Button onClick={handleGeoAttendance} disabled={isProcessing} size="lg" className="w-full">
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <MapPin className="mr-2 h-4 w-4" />}
                    Confirm My Location
                </Button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}