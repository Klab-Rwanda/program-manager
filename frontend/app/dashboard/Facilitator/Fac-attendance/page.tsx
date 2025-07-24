"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Plus, Loader2, QrCode, Play, Eye, Download, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  createSession, getFacilitatorSessions, startOnlineSession, startPhysicalSession, endSession, ClassSession
} from "@/lib/services/attendance.service";
import { Program } from "@/types";
import api from "@/lib/api";

const initialFormState = { type: 'online' as 'physical' | 'online', programId: '', title: '', description: '', duration: 120 };

export default function FacilitatorAttendancePage() {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isQrModalOpen, setQrModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<string | boolean>(false);
  const [formData, setFormData] = useState(initialFormState);
  const [activeQrCode, setActiveQrCode] = useState<string | null>(null);
  
  const fetchSessionsAndPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionsData, programsData] = await Promise.all([
        getFacilitatorSessions(),
        api.get('/programs').then(res => res.data.data)
      ]);
      setSessions(sessionsData);
      setPrograms(programsData);
    } catch (err) { toast.error("Failed to load data.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSessionsAndPrograms(); }, [fetchSessionsAndPrograms]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newSession = await createSession({ ...formData, startTime: new Date().toISOString() });
      setSessions(prev => [newSession, ...prev]);
      toast.success("Session created successfully!");
      setCreateModalOpen(false);
      setFormData(initialFormState);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create session.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartSession = async (session: ClassSession) => {
    setIsSubmitting(session.sessionId);
    try {
      let updatedSession;
      if (session.type === 'online') {
        const result = await startOnlineSession(session.sessionId);
        updatedSession = result.session;
        setActiveQrCode(result.qrCode);
        setQrModalOpen(true);
      } else {
        updatedSession = await startPhysicalSession(session.sessionId);
      }
      toast.success(`Session "${updatedSession.title}" is now active!`);
      setSessions(prev => prev.map(s => s._id === updatedSession._id ? updatedSession : s));
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to start session.`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEndSession = (session: ClassSession) => {
    toast("Are you sure you want to end this session?", {
        action: {
            label: "End Session",
            onClick: async () => {
                setIsSubmitting(session.sessionId);
                try {
                    const updatedSession = await endSession(session.sessionId);
                    toast.success("Session has been marked as completed.");
                    setSessions(prev => prev.map(s => s._id === updatedSession._id ? updatedSession : s));
                } catch (err: any) {
                    toast.error(err.response?.data?.message || "Failed to end session.");
                } finally {
                    setIsSubmitting(false);
                }
            },
        },
        cancel: { label: "Cancel" }
    });
  };

  const activeOrScheduledSessions = useMemo(() => sessions.filter(s => s.status === 'active' || s.status === 'scheduled'), [sessions]);
  const completedSessions = useMemo(() => sessions.filter(s => s.status === 'completed'), [sessions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Session Management</h1>
          <p className="text-muted-foreground">Create, start, and end your class sessions.</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}><Plus className="mr-2 h-4 w-4" /> Create Session</Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active & Upcoming ({activeOrScheduledSessions.length})</TabsTrigger>
            <TabsTrigger value="history">Session History ({completedSessions.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
            {loading ? <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div> :
            activeOrScheduledSessions.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {activeOrScheduledSessions.map(session => (
                        <Card key={session._id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="pr-2">{session.title}</CardTitle>
                                    <Badge variant={session.status === 'active' ? 'default' : 'secondary'} className={session.status === 'active' ? 'bg-green-500 text-white' : ''}>{session.status}</Badge>
                                </div>
                                <CardDescription>{session.programId.name}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {session.status === 'scheduled' && <Button className="w-full" onClick={() => handleStartSession(session)} disabled={!!isSubmitting}><Play className="mr-2 h-4 w-4" /> Start Session</Button>}
                                {session.status === 'active' && (
                                    <div className="flex gap-2">
                                        {session.type === 'online' && <Link href={`/dashboard/classroom/${session.sessionId}`} className="flex-1"><Button className="w-full"><Eye className="mr-2 h-4 w-4" /> Classroom</Button></Link>}
                                        <Button variant="destructive" size={session.type === 'online' ? 'default' : 'lg'} className="flex-1" onClick={() => handleEndSession(session)} disabled={isSubmitting === session.sessionId}>
                                            {isSubmitting === session.sessionId ? <Loader2 className="h-4 w-4 animate-spin"/> : <StopCircle className="mr-2 h-4 w-4" />} End Session
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : <p className="text-center text-muted-foreground py-10">No active or upcoming sessions.</p>}
        </TabsContent>
        <TabsContent value="history" className="mt-4">
             {loading ? <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div> :
            completedSessions.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {completedSessions.map(session => (
                        <Card key={session._id} className="opacity-80">
                            <CardHeader><CardTitle>{session.title}</CardTitle><CardDescription>{session.programId.name}</CardDescription></CardHeader>
                            <CardContent className="space-y-3">
                                 <Badge variant="outline">Completed</Badge>
                                 <p className="text-sm text-muted-foreground">Ended on: {new Date(session.updatedAt).toLocaleDateString()}</p>
                                 <Button variant="outline" className="w-full"><Download className="mr-2 h-4 w-4" /> View Report</Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : <p className="text-center text-muted-foreground py-10">No completed sessions found.</p>}
        </TabsContent>
      </Tabs>

      <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Create New Session</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateSession} className="space-y-4 py-4">
                 <div className="space-y-2"><Label>Session Type</Label><Select value={formData.type} onValueChange={(v) => setFormData(f => ({...f, type: v as any}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="online">Online</SelectItem><SelectItem value="physical">Physical</SelectItem></SelectContent></Select></div>
                 <div className="space-y-2"><Label>Program</Label><Select value={formData.programId} onValueChange={(v) => setFormData(f => ({...f, programId: v}))}><SelectTrigger><SelectValue placeholder="Select program"/></SelectTrigger><SelectContent>{programs.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                 <div className="space-y-2"><Label>Title</Label><Input value={formData.title} onChange={(e) => setFormData(f => ({...f, title: e.target.value}))} required/></div>
                 <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData(f => ({...f, description: e.target.value}))} /></div>
                 <div className="space-y-2"><Label>Duration (minutes)</Label><Input type="number" value={formData.duration} onChange={(e) => setFormData(f => ({...f, duration: parseInt(e.target.value)}))} required/></div>
                 <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button><Button type="submit" disabled={!!isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Create Session</Button></DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isQrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent><DialogHeader><DialogTitle>Session QR Code</DialogTitle></DialogHeader><div className="flex justify-center p-4">{activeQrCode ? <img src={activeQrCode} alt="QR Code" /> : <Loader2 className="h-16 w-16 animate-spin"/>}</div></DialogContent>
      </Dialog>
    </div>
  );
}