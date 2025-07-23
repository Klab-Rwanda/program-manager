"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Loader2, QrCode, Play, Eye, Download, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  createSession,
  getFacilitatorSessions,
  startOnlineSession,
  startPhysicalSession,
  ClassSession
} from "@/lib/services/attendance.service";
import { Program } from "@/types";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";

const initialFormState = {
  type: 'online' as 'physical' | 'online',
  programId: '',
  title: '',
  description: '',
  startTime: new Date().toISOString(), // Default to now
};

export default function FacilitatorAttendancePage() {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isQrModalOpen, setQrModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState(initialFormState);
  const [activeQrCode, setActiveQrCode] = useState<string | null>(null);
  
  const fetchSessionsAndPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessionsData, programsData] = await Promise.all([
        getFacilitatorSessions(),
        api.get('/programs').then(res => res.data.data)
      ]);
      setSessions(sessionsData);
      setPrograms(programsData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to load data. Please refresh.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessionsAndPrograms();
  }, [fetchSessionsAndPrograms]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newSession = await createSession(formData);
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
    setIsSubmitting(true);
    try {
      let updatedSession;
      if (session.type === 'online') {
        const result = await startOnlineSession(session.sessionId);
        updatedSession = result.session;
        setActiveQrCode(result.qrCode);
        setQrModalOpen(true);
        toast.success("Online session started. QR Code is ready.");
      } else {
        updatedSession = await startPhysicalSession(session.sessionId);
        toast.success("Physical session is now active for attendance.");
      }
      setSessions(prev => prev.map(s => s._id === updatedSession._id ? updatedSession : s));
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to start ${session.type} session.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Session Management</h1>
          <p className="text-muted-foreground">Create and manage your class sessions for attendance.</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="bg-[#1f497d] hover:bg-[#1a3f6b]">
          <Plus className="mr-2 h-4 w-4" />
          Create New Session
        </Button>
      </div>

      {loading && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
      {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      
      {!loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map(session => (
            <Card key={session._id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{session.title}</CardTitle>
                  <Badge variant={session.status === 'active' ? 'default' : 'secondary'} className={session.status === 'active' ? 'bg-green-500 text-white' : ''}>{session.status}</Badge>
                </div>
                <CardDescription>{session.programId.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{new Date(session.startTime).toLocaleString()}</p>
                <p className="text-sm">Type: <span className="font-medium capitalize">{session.type}</span></p>
                
                {session.status === 'scheduled' && (
                  <Button className="w-full" onClick={() => handleStartSession(session)} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Play className="mr-2 h-4 w-4" />}
                    Start Session
                  </Button>
                )}
                
                {session.status === 'active' && session.type === 'online' && (
                  <Link href={`/dashboard/classroom/${session.sessionId}`} passHref>
                    <Button variant="default" className="w-full bg-green-600 hover:bg-green-700">
                      <Eye className="mr-2 h-4 w-4" />
                      Join Classroom
                    </Button>
                  </Link>
                )}

                {(session.status === 'active' || session.status === 'completed') && (
                   <Button variant="outline" className="w-full mt-2">
                    <Download className="mr-2 h-4 w-4" /> View Report
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
           {sessions.length === 0 && <p className="col-span-full text-center text-muted-foreground py-10">No sessions found. Create one to get started.</p>}
        </div>
      )}

      {/* Create Session Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Session</DialogTitle>
            <DialogDescription>Fill in the details for the new class session.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSession} className="space-y-4 py-4">
             <div className="space-y-2">
                <Label htmlFor="type">Session Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData(f => ({...f, type: v as any}))} required>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="physical">Physical</SelectItem>
                    </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <Label htmlFor="programId">Program</Label>
                <Select value={formData.programId} onValueChange={(v) => setFormData(f => ({...f, programId: v}))} required>
                    <SelectTrigger><SelectValue placeholder="Select a program"/></SelectTrigger>
                    <SelectContent>
                        {programs.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                    </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <Label htmlFor="title">Session Title</Label>
                <Input id="title" value={formData.title} onChange={(e) => setFormData(f => ({...f, title: e.target.value}))} required/>
             </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData(f => ({...f, description: e.target.value}))} />
             </div>
             <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Create Session
                </Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* QR Code Modal */}
      <Dialog open={isQrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Session QR Code</DialogTitle></DialogHeader>
          <div className="flex justify-center p-4">
             {activeQrCode ? <img src={activeQrCode} alt="Session QR Code" className="w-64 h-64" /> : <Loader2 className="h-8 w-8 animate-spin"/>}
          </div>
          <p className="text-center text-sm text-muted-foreground">Trainees should scan this code to mark their attendance.</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}