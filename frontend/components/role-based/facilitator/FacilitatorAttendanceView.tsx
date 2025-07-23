"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Plus, CalendarDays, Play, Eye, MapPin, BarChart3, QrCode,
  Loader2, AlertCircle, UserX, Users,
  Copy
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { QRCodeSVG as QRCode } from 'qrcode.react'; // Corrected import

import api from "@/lib/api";
import { cn, getCurrentLocation } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QrCodeDialog } from "@/components/shared/QrCodeDialog"; // We will create this simple component

// Type Definitions
interface Program {
  _id: string;
  name: string;
}

interface ClassSession {
  _id: string;
  type: 'physical' | 'online';
  programId: { _id: string; name: string; };
  sessionId: string;
  title: string;
  startTime: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  totalPresent: number;
  totalAbsent: number;
}

interface AttendanceRecord {
  _id: string;
  userId: { _id: string; name: string; email: string; };
  timestamp: string;
  method: 'qr_code' | 'geolocation' | 'manual';
  status: 'present' | 'absent' | 'excused' | 'late';
}

const initialFormState = {
    type: 'online' as 'physical' | 'online',
    programId: '',
    title: '',
    description: '',
    startDate: null as Date | null,
    startTime: '',
};

export function FacilitatorAttendanceView() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ClassSession | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [createSessionOpen, setCreateSessionOpen] = useState(false);
  const [sessionDetailsOpen, setSessionDetailsOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  
  const [sessionForm, setSessionForm] = useState(initialFormState);
  const [qrCodeData, setQrCodeData] = useState<{ qrDataString: string; accessLink: string; expiresAt: string } | null>(null);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [programsRes, sessionsRes] = await Promise.all([
        api.get('/programs'),
        api.get('/attendance/facilitator/sessions')
      ]);
      setPrograms(programsRes.data.data || []);
      setSessions(sessionsRes.data.data || []);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to load initial data.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const createSession = async () => {
    setFormError(null);
    if (!sessionForm.programId || !sessionForm.title || !sessionForm.startDate || !sessionForm.startTime) {
      setFormError('Program, Title, Start Date, and Start Time are required.');
      return;
    }

    const startDateTime = new Date(`${format(sessionForm.startDate, "yyyy-MM-dd")}T${sessionForm.startTime}`);
    const sessionData = { 
        ...sessionForm, 
        startTime: startDateTime.toISOString(),
        startDate: undefined // remove the date object before sending
    };

    try {
      setLoading(true);
      const response = await api.post('/attendance/sessions', sessionData);
      const newSession = response.data.data;
      setSessions(prev => [newSession, ...prev]);
      setCreateSessionOpen(false);
      setSessionForm(initialFormState);
      toast.success("Session created successfully!");
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };
  
  const startOnlineSession = async (session: ClassSession) => {
    try {
      setLoading(true);
      const response = await api.post(`/attendance/sessions/${session.sessionId}/start-online`);
      const { session: updatedSession, qrDataString, accessLink, expiresAt } = response.data.data;
      
      setSessions(prev => prev.map(s => s._id === updatedSession._id ? updatedSession : s));
      setQrCodeData({ qrDataString, accessLink, expiresAt });
      setIsQrModalOpen(true);
      toast.success("Online session started!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };
  
  const startPhysicalSession = async (session: ClassSession) => {
    if (!confirm("This will start the session. Proceed?")) return;
    try {
      setLoading(true);
      const location = await getCurrentLocation();
      const response = await api.post(`/attendance/sessions/${session.sessionId}/physical-attendance`, {
        latitude: location.lat,
        longitude: location.lng
      });
      const updatedSession = response.data.data.session;
      setSessions(prev => prev.map(s => s._id === session._id ? updatedSession : s));
      toast.success("Physical session started!");
    } catch (err: any) {
      toast.error(err.message || err.response?.data?.message || 'Failed to start session.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && sessions.length === 0) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  if (error) {
    return <div className="p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Tracking</h1>
          <p className="text-muted-foreground">Manage your class sessions.</p>
        </div>
        <Dialog open={createSessionOpen} onOpenChange={setCreateSessionOpen}>
          <DialogTrigger asChild><Button className="bg-[#1f497d] hover:bg-[#1a3d6b]"><Plus className="mr-2 h-4 w-4" /> Create Session</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Session</DialogTitle></DialogHeader>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="space-y-4 py-2">
                <div><Label>Program</Label><Select value={sessionForm.programId} onValueChange={(v) => setSessionForm(p => ({...p, programId: v}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{programs.map(p=><SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Title</Label><Input value={sessionForm.title} onChange={(e) => setSessionForm(p=>({...p, title:e.target.value}))}/></div>
                <div className="grid grid-cols-2 gap-2">
                    <div><Label>Date</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full", !sessionForm.startDate && "text-muted-foreground")}>{sessionForm.startDate ? format(sessionForm.startDate, "PPP") : "Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={sessionForm.startDate} onSelect={(d) => setSessionForm(p=>({...p, startDate: d||null}))}/></PopoverContent></Popover></div>
                    <div><Label>Time</Label><Input type="time" value={sessionForm.startTime} onChange={(e) => setSessionForm(p=>({...p, startTime:e.target.value}))}/></div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={()=>setCreateSessionOpen(false)}>Cancel</Button>
                <Button onClick={createSession} disabled={loading}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session) => (
          <Card key={session._id}>
            <CardHeader>
              <div className="flex justify-between"><CardTitle className="text-lg">{session.title}</CardTitle><Badge className="capitalize">{session.status}</Badge></div>
              <CardDescription>{session.programId.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm flex items-center gap-2"><CalendarDays size={14}/> {new Date(session.startTime).toLocaleString()}</p>
              <p className="text-sm flex items-center gap-2 capitalize"><MapPin size={14}/> {session.type} Session</p>
            </CardContent>
            <div className="p-4 border-t">
                {session.status === 'scheduled' && session.type === 'online' && <Button size="sm" onClick={() => startOnlineSession(session)} disabled={loading} className="w-full"><Play className="h-4 w-4 mr-2"/>Start QR Session</Button>}
                {session.status === 'scheduled' && session.type === 'physical' && <Button size="sm" onClick={() => startPhysicalSession(session)} disabled={loading} className="w-full"><MapPin className="h-4 w-4 mr-2"/>Start Geo Session</Button>}
                {session.status === 'active' && <Button size="sm" variant="secondary" className="w-full" disabled>Session Active</Button>}
                {session.status === 'completed' && <Button size="sm" variant="outline" className="w-full"><BarChart3 className="h-4 w-4 mr-2"/>View Report</Button>}
            </div>
          </Card>
        ))}
      </div>

      <QrCodeDialog 
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        qrData={qrCodeData}
      />
    </div>
  );
}

// You can create a new file for this simple component or keep it here
// File: components/shared/QrCodeDialog.tsx
interface QrCodeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    qrData: { qrDataString: string; accessLink: string; expiresAt: string } | null;
}
export function QrCodeDialog({ isOpen, onClose, qrData }: QrCodeDialogProps) {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Link copied!");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Session QR Code</DialogTitle>
                    <DialogDescription>Share this with trainees for attendance.</DialogDescription>
                </DialogHeader>
                {qrData && (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="p-4 bg-white rounded-lg">
                            <QRCode value={qrData.qrDataString} size={256} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Expires at: {new Date(qrData.expiresAt).toLocaleTimeString()}
                        </p>
                        <div className="w-full flex gap-2">
                            <Input value={qrData.accessLink} readOnly />
                            <Button size="sm" variant="outline" onClick={() => copyToClipboard(qrData.accessLink)}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}