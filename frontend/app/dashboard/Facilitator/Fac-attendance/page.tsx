"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Plus, Loader2, QrCode, Play, Eye, Download, StopCircle, UserCheck, Edit, Save, Trash2, Calendar, Clock as ClockIcon } from "lucide-react"; 
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; 
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; 

import {
  createSession, getFacilitatorSessions, startOnlineSession, startPhysicalSession, endSession, 
  markManualStudentAttendance, 
  getSessionAttendance, 
  deleteSession, 
  updateSession, // NEW: Import updateSession service
  ClassSession
} from "@/lib/services/attendance.service";
import { Program, User as TraineeUser, AttendanceRecord } from "@/types"; 
import api from "@/lib/api"; 

// Update initialFormState for both create and edit.
// For edit, we'll populate it from an existing session.
const initialFormState = { 
    type: 'online' as 'physical' | 'online', 
    programId: '', 
    title: '', 
    description: '', 
    duration: 120,
    sessionDate: '', 
    sessionTime: '',
    latitude: undefined as number | undefined, // For physical session location
    longitude: undefined as number | undefined,
    radius: 50 as number | undefined // Default radius
};

export default function FacilitatorAttendancePage() {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false); // NEW: State for edit modal
  const [editingSession, setEditingSession] = useState<ClassSession | null>(null); // NEW: State to hold session being edited
  const [isQrModalOpen, setQrModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<string | boolean>(false); // Used for session creation/start/end/delete
  const [formData, setFormData] = useState(initialFormState);
  const [activeQrCode, setActiveQrCode] = useState<string | null>(null);
  
  // State for manual attendance marking
  const [isManualMarkModalOpen, setManualMarkModalOpen] = useState(false);
  const [selectedSessionForManualMark, setSelectedSessionForManualMark] = useState<ClassSession | null>(null);
  const [traineesForManualMark, setTraineesForManualMark] = useState<
    (TraineeUser & { currentAttendance?: AttendanceRecord | null; manualStatus?: string; manualReason?: string; isSaving?: boolean })[]
  >([]);
  const [manualMarkLoading, setManualMarkLoading] = useState(false);

  // State for date filtering
  const today = new Date();
  const defaultStartDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]; // Start of current month
  const defaultEndDate = today.toISOString().split('T')[0]; // Today's date
  const [filterDates, setFilterDates] = useState({ startDate: defaultStartDate, endDate: defaultEndDate });


  const fetchSessionsAndPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionsData, programsData] = await Promise.all([
        getFacilitatorSessions(filterDates.startDate, filterDates.endDate), // Pass date filters
        api.get('/programs').then(res => res.data.data) // Fetch all programs
      ]);
      setSessions(sessionsData);
      setPrograms(programsData);
    } catch (err) { toast.error("Failed to load data.");
    } finally { setLoading(false); }
  }, [filterDates]); // Re-fetch when date filters change

  useEffect(() => { fetchSessionsAndPrograms(); }, [fetchSessionsAndPrograms]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.sessionDate || !formData.sessionTime) {
        toast.error("Please select both a date and a time for the session.");
        setIsSubmitting(false);
        return;
    }

    // Combine date and time into a single ISO string for startTime
    const combinedStartTime = `${formData.sessionDate}T${formData.sessionTime}:00`;

    try {
      const newSession = await createSession({ 
          ...formData, 
          startTime: combinedStartTime // Use the combined start time
      });
      toast.success("Session created successfully!");
      setCreateModalOpen(false);
      setFormData(initialFormState); // Reset form
      fetchSessionsAndPrograms(); // Re-fetch all sessions
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create session.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // NEW: Handle update session
  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    setIsSubmitting(true);

    if (!formData.sessionDate || !formData.sessionTime) {
        toast.error("Please select both a date and a time for the session.");
        setIsSubmitting(false);
        return;
    }

    const combinedStartTime = `${formData.sessionDate}T${formData.sessionTime}:00`;

    try {
      const updatedSessionData = { 
          title: formData.title,
          description: formData.description,
          duration: formData.duration,
          type: formData.type,
          startTime: combinedStartTime,
          // Only include location if type is physical
          ...(formData.type === 'physical' && { 
            latitude: formData.latitude, 
            longitude: formData.longitude, 
            radius: formData.radius 
          })
      };

      await updateSession(editingSession.sessionId, updatedSessionData);
      toast.success("Session updated successfully!");
      setEditModalOpen(false);
      setEditingSession(null);
      setFormData(initialFormState);
      fetchSessionsAndPrograms();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update session.");
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
      } else {
        // For starting a physical session, we need facilitator's current location
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            if (!navigator.geolocation) {
                return reject(new Error('Geolocation is not supported by your browser.'));
            }
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
        }).catch(err => {
            toast.error(`Location Error: ${err.message}. Cannot start physical session without location.`);
            throw err; // Re-throw to propagate error and stop process
        });

        updatedSession = await startPhysicalSession(session.sessionId, { 
            latitude: position.coords.latitude, 
            longitude: position.coords.longitude 
        }); 
      }
      toast.success(`Session "${updatedSession.title}" is now active!`);
      fetchSessionsAndPrograms(); // Re-fetch all sessions to update status
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
                    await endSession(session.sessionId);
                    toast.success("Session has been marked as completed.");
                    fetchSessionsAndPrograms(); // Re-fetch all sessions
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

  const handleDeleteSession = (session: ClassSession) => {
    toast("Are you sure you want to delete this session?", {
        description: `This action cannot be undone. This will permanently delete the session "${session.title}" and its attendance records.`,
        action: {
            label: "Delete",
            onClick: async () => {
                setIsSubmitting(session.sessionId);
                try {
                    await deleteSession(session.sessionId);
                    toast.success("Session deleted successfully.");
                    fetchSessionsAndPrograms(); // Re-fetch sessions
                }
                catch (err: any) {
                    // Check if the error indicates a 400 or 403 response
                    if (err.response && (err.response.status === 400 || err.response.status === 403)) {
                        toast.error(err.response.data.message || "Failed to delete session due to a restriction.");
                    } else {
                        toast.error("Failed to delete session. An unexpected error occurred.");
                    }
                    console.error("Delete session error:", err);
                }
                finally {
                    setIsSubmitting(false);
                }
            },
        },
        cancel: { label: "Cancel" }
    });
  };


  // Manual marking logic
  const handleOpenManualMarkModal = useCallback(async (session: ClassSession) => {
    setSelectedSessionForManualMark(session);
    setManualMarkModalOpen(true);
    setManualMarkLoading(true);
    try {
      const { attendance: currentAttendanceRecords } = await getSessionAttendance(session.sessionId);
      
      const traineesWithStatus = currentAttendanceRecords.map((record: any) => ({
          _id: record.trainee._id,
          name: record.trainee.name,
          email: record.trainee.email,
          currentAttendance: {
              status: record.status,
              method: record.method,
              timestamp: record.timestamp,
              reason: record.reason,
              markedBy: record.markedBy
          },
          manualStatus: record.status, // Initialize with current status
          manualReason: record.reason || '',
      }));

      setTraineesForManualMark(traineesWithStatus);

    } catch (err) {
      toast.error("Failed to load trainees or attendance for manual marking.");
      console.error("Manual mark data fetch error:", err);
    } finally {
      setManualMarkLoading(false);
    }
  }, []);

  const handleManualStatusChange = (userId: string, status: string) => {
    setTraineesForManualMark(prev => prev.map(t => 
      t._id === userId ? { ...t, manualStatus: status } : t
    ));
  };

  const handleManualReasonChange = (userId: string, reason: string) => {
    setTraineesForManualMark(prev => prev.map(t => 
      t._id === userId ? { ...t, manualReason: reason } : t
    ));
  };

  const handleSaveManualMark = async (trainee: typeof traineesForManualMark[0]) => {
    if (!selectedSessionForManualMark) return;

    // Set saving state for the specific trainee
    setTraineesForManualMark(prev => prev.map(t => 
      t._id === trainee._id ? { ...t, isSaving: true } : t
    ));

    try {
      await markManualStudentAttendance(
        selectedSessionForManualMark.sessionId,
        trainee._id,
        trainee.manualStatus!, // Assumed to be set by dropdown
        trainee.manualReason!
      );
      toast.success(`Attendance for ${trainee.name} updated to ${trainee.manualStatus}.`);
      // Re-fetch data for the modal to ensure consistency
      if (selectedSessionForManualMark) {
        handleOpenManualMarkModal(selectedSessionForManualMark); 
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to update attendance for ${trainee.name}.`);
    } finally {
      setTraineesForManualMark(prev => prev.map(t => 
        t._id === trainee._id ? { ...t, isSaving: false } : t
      ));
    }
  };

  // NEW: Function to open the edit session modal
  const handleOpenEditModal = (session: ClassSession) => {
    setEditingSession(session);
    // Pre-fill form data from the selected session
    const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
    const sessionTime = new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    setFormData({
        type: session.type,
        programId: session.programId._id, // Assume programId is populated
        title: session.title,
        description: session.description || '',
        duration: session.duration,
        sessionDate: sessionDate,
        sessionTime: sessionTime,
        latitude: session.location?.lat,
        longitude: session.location?.lng,
        radius: session.location?.radius
    });
    setEditModalOpen(true);
  };

  const activeOrScheduledSessions = useMemo(() => sessions.filter(s => s.status === 'active' || s.status === 'scheduled'), [sessions]);
  const completedSessions = useMemo(() => sessions.filter(s => s.status === 'completed'), [sessions]);

  // Helper to get initials
  const getInitials = (name: string = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

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
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-4 w-4" /> 
                                    {new Date(session.startTime).toLocaleDateString()}
                                    <ClockIcon className="h-4 w-4 ml-2" />
                                    {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {session.status === 'scheduled' && (
                                    <div className="flex gap-2">
                                        <Button 
                                            className="flex-1 min-w-0" 
                                            onClick={() => handleStartSession(session)} 
                                            disabled={!!isSubmitting && isSubmitting === session.sessionId}
                                        >
                                            {/* UI Fix: Ensure button content doesn't overflow */}
                                            {!!isSubmitting && isSubmitting === session.sessionId ? 
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 
                                                <Play className="mr-2 h-4 w-4" />
                                            } 
                                            <span className="truncate">Start Session</span>
                                        </Button>
                                        <Button variant="outline" onClick={() => handleOpenEditModal(session)}> {/* NEW: Edit button for scheduled sessions */}
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" onClick={() => handleOpenManualMarkModal(session)} disabled={manualMarkLoading}>
                                            <UserCheck className="h-4 w-4" /> {/* Changed to UserCheck for clarity */}
                                        </Button>
                                    </div>
                                )}
                                {session.status === 'active' && (
                                    <div className="flex gap-2">
                                        <Link href={`/dashboard/classroom/${session.sessionId}`} className="flex-1">
                                            <Button className="w-full">
                                                <Eye className="mr-2 h-4 w-4" /> Classroom
                                            </Button>
                                        </Link>
                                        <Button variant="outline" onClick={() => handleOpenManualMarkModal(session)} disabled={manualMarkLoading}>
                                            <UserCheck className="h-4 w-4" /> {/* Changed to UserCheck for clarity */}
                                        </Button>
                                        <Button variant="destructive" size={session.type === 'online' ? 'default' : 'lg'} className="flex-1" onClick={() => handleEndSession(session)} disabled={isSubmitting === session.sessionId}>
                                            {isSubmitting === session.sessionId ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <StopCircle className="mr-2 h-4 w-4" />} End Session
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
            <Card>
                <CardHeader>
                    <CardTitle>Session History</CardTitle>
                    <CardDescription>View past sessions for specific dates.</CardDescription>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="historyStartDate">Start Date</Label>
                            <Input 
                                id="historyStartDate" 
                                type="date" 
                                value={filterDates.startDate} 
                                onChange={(e) => setFilterDates(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="historyEndDate">End Date</Label>
                            <Input 
                                id="historyEndDate" 
                                type="date" 
                                value={filterDates.endDate} 
                                onChange={(e) => setFilterDates(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div> :
                    completedSessions.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {completedSessions.map(session => (
                                <Card key={session._id} className="opacity-80">
                                    <CardHeader>
                                        <CardTitle>{session.title}</CardTitle>
                                        <CardDescription>{session.programId.name}</CardDescription>
                                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-4 w-4" /> 
                                            {new Date(session.startTime).toLocaleDateString()}
                                            <ClockIcon className="h-4 w-4 ml-2" />
                                            {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <Badge variant="outline">Completed</Badge>
                                        <p className="text-sm text-muted-foreground">Ended on: {new Date(session.updatedAt).toLocaleDateString()}</p>
                                        {/* MODIFIED: Link to the new attendance report page */}
                                        <Link href={`/dashboard/Facilitator/attendance-report/${session.sessionId}`} passHref>
                                            <Button variant="outline" className="w-full"><Download className="mr-2 h-4 w-4" /> View Report</Button>
                                        </Link>
                                        {/* Manual Mark button for completed sessions as well */}
                                        <Button variant="outline" className="w-full" onClick={() => handleOpenManualMarkModal(session)} disabled={manualMarkLoading}>
                                            <UserCheck className="mr-2 h-4 w-4" /> Manual Mark
                                        </Button>
                                        {/* Delete Button moved here for completed sessions */}
                                        <Button variant="destructive" onClick={() => handleDeleteSession(session)} disabled={!!isSubmitting && isSubmitting === session.sessionId} className="w-full">
                                            {!!isSubmitting && isSubmitting === session.sessionId ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />} Delete Session
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : <p className="text-center text-muted-foreground py-10">No completed sessions found for the selected dates.</p>}
                </CardContent>
            </Card>
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
                 
                 {/* Date and Time Pickers */}
                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                         <Label>Session Date</Label>
                         <Input type="date" value={formData.sessionDate} onChange={(e) => setFormData(f => ({...f, sessionDate: e.target.value}))} required />
                     </div>
                     <div className="space-y-2">
                         <Label>Session Time</Label>
                         <Input type="time" value={formData.sessionTime} onChange={(e) => setFormData(f => ({...f, sessionTime: e.target.value}))} required />
                     </div>
                 </div>
                 {formData.type === 'physical' && (
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                             <Label>Latitude</Label>
                             <Input type="number" step="any" value={formData.latitude ?? ''} onChange={(e) => setFormData(f => ({...f, latitude: parseFloat(e.target.value)}))} placeholder="e.g., -1.9441" />
                         </div>
                         <div className="space-y-2">
                             <Label>Longitude</Label>
                             <Input type="number" step="any" value={formData.longitude ?? ''} onChange={(e) => setFormData(f => ({...f, longitude: parseFloat(e.target.value)}))} placeholder="e.g., 30.0619" />
                         </div>
                         <div className="space-y-2 col-span-2">
                             <Label>Location Radius (meters)</Label>
                             <Input type="number" value={formData.radius ?? 50} onChange={(e) => setFormData(f => ({...f, radius: parseInt(e.target.value)}))} placeholder="Default: 50" />
                         </div>
                     </div>
                 )}

                 <div className="space-y-2"><Label>Duration (minutes)</Label><Input type="number" value={formData.duration} onChange={(e) => setFormData(f => ({...f, duration: parseInt(e.target.value)}))} required/></div>
                 <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button><Button type="submit" disabled={!!isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Create Session</Button></DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      {/* NEW: Edit Session Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Edit Session: {editingSession?.title}</DialogTitle></DialogHeader>
            <form onSubmit={handleUpdateSession} className="space-y-4 py-4">
                 <div className="space-y-2"><Label>Session Type</Label><Select value={formData.type} onValueChange={(v) => setFormData(f => ({...f, type: v as any}))} disabled><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="online">Online</SelectItem><SelectItem value="physical">Physical</SelectItem></SelectContent></Select></div>
                 <div className="space-y-2"><Label>Program</Label><Select value={formData.programId} onValueChange={(v) => setFormData(f => ({...f, programId: v}))} disabled><SelectTrigger><SelectValue placeholder="Select program"/></SelectTrigger><SelectContent>{programs.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                 <div className="space-y-2"><Label>Title</Label><Input value={formData.title} onChange={(e) => setFormData(f => ({...f, title: e.target.value}))} required/></div>
                 <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData(f => ({...f, description: e.target.value}))} /></div>
                 
                 {/* Date and Time Pickers */}
                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                         <Label>Session Date</Label>
                         <Input type="date" value={formData.sessionDate} onChange={(e) => setFormData(f => ({...f, sessionDate: e.target.value}))} required />
                     </div>
                     <div className="space-y-2">
                         <Label>Session Time</Label>
                         <Input type="time" value={formData.sessionTime} onChange={(e) => setFormData(f => ({...f, sessionTime: e.target.value}))} required />
                     </div>
                 </div>
                 {formData.type === 'physical' && (
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                             <Label>Latitude</Label>
                             <Input type="number" step="any" value={formData.latitude ?? ''} onChange={(e) => setFormData(f => ({...f, latitude: parseFloat(e.target.value)}))} placeholder="e.g., -1.9441" />
                         </div>
                         <div className="space-y-2">
                             <Label>Longitude</Label>
                             <Input type="number" step="any" value={formData.longitude ?? ''} onChange={(e) => setFormData(f => ({...f, longitude: parseFloat(e.target.value)}))} placeholder="e.g., 30.0619" />
                         </div>
                         <div className="space-y-2 col-span-2">
                             <Label>Location Radius (meters)</Label>
                             <Input type="number" value={formData.radius ?? 50} onChange={(e) => setFormData(f => ({...f, radius: parseInt(e.target.value)}))} placeholder="Default: 50" />
                         </div>
                     </div>
                 )}

                 <div className="space-y-2"><Label>Duration (minutes)</Label><Input type="number" value={formData.duration} onChange={(e) => setFormData(f => ({...f, duration: parseInt(e.target.value)}))} required/></div>
                 <DialogFooter><Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button><Button type="submit" disabled={!!isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Save Changes</Button></DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
      {/* END NEW: Edit Session Modal */}

      <Dialog open={isQrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent><DialogHeader><DialogTitle>Session QR Code</DialogTitle></DialogHeader><div className="flex justify-center p-4">{activeQrCode ? <img src={activeQrCode} alt="QR Code" /> : <Loader2 className="h-16 w-16 animate-spin"/>}</div></DialogContent>
      </Dialog>

      {/* Manual Attendance Marking Modal */}
      <Dialog open={isManualMarkModalOpen} onOpenChange={setManualMarkModalOpen}>
          {/* Modal Alignment Fix: Adjusted left and transform for better centering with sidebar */}
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto 
              !left-1/2 !-translate-x-1/2 /* Default for mobile/small screens */
              md:!left-[calc(50%+100px)] md:!top-1/2 md:!-translate-x-1/2 md:!-translate-y-1/2 /* Centered in content area for 280px sidebar, 280/2 = 140. Using 100 for some padding*/
              lg:max-w-3xl /* Keep a reasonable max-width */
              xl:max-w-4xl /* Or even larger if needed, but not full width */
          ">
              <DialogHeader>
                  <DialogTitle>Manual Attendance for {selectedSessionForManualMark?.title}</DialogTitle>
                  <DialogDescription>
                      Mark or adjust attendance for individual students in this session.
                      {selectedSessionForManualMark?.programId?.name && (
                          <span className="block mt-1">Program: {selectedSessionForManualMark.programId.name}</span>
                      )}
                  </DialogDescription>
              </DialogHeader>
              {manualMarkLoading ? (
                  <div className="py-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div>
              ) : (
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Student</TableHead>
                              <TableHead>Current Status</TableHead>
                              <TableHead>Mark As</TableHead>
                              <TableHead>Reason (Optional)</TableHead>
                              <TableHead>Actions</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {traineesForManualMark.length === 0 ? (
                              <TableRow><TableCell colSpan={5} className="text-center py-6">No trainees found for this program.</TableCell></TableRow>
                          ) : (
                              traineesForManualMark.map(trainee => (
                                  <TableRow key={trainee._id}>
                                      <TableCell>
                                          <div className="flex items-center gap-2">
                                              <Avatar className="h-8 w-8">
                                                  <AvatarFallback>{getInitials(trainee.name)}</AvatarFallback>
                                              </Avatar>
                                              <div>
                                                  <div className="font-medium">{trainee.name}</div>
                                                  <div className="text-sm text-muted-foreground">{trainee.email}</div>
                                              </div>
                                          </div>
                                      </TableCell>
                                      <TableCell>
                                          {trainee.currentAttendance ? (
                                              <Badge variant={
                                                  trainee.currentAttendance.status === 'Present' ? 'default' :
                                                  trainee.currentAttendance.status === 'Late' ? 'outline' :
                                                  trainee.currentAttendance.status === 'Absent' ? 'destructive' : 'secondary'
                                              }>
                                                  {trainee.currentAttendance.status}
                                              </Badge>
                                          ) : (
                                              <Badge variant="outline">No Record</Badge>
                                          )}
                                      </TableCell>
                                      <TableCell>
                                          <Select value={trainee.manualStatus} onValueChange={(val) => handleManualStatusChange(trainee._id, val)}>
                                              <SelectTrigger className="w-32 h-9">
                                                  <SelectValue placeholder="Select Status" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                  <SelectItem value="Present">Present</SelectItem>
                                                  <SelectItem value="Absent">Absent</SelectItem>
                                                  <SelectItem value="Late">Late</SelectItem>
                                                  <SelectItem value="Excused">Excused</SelectItem>
                                              </SelectContent>
                                          </Select>
                                      </TableCell>
                                      <TableCell>
                                          <Input 
                                              value={trainee.manualReason} 
                                              onChange={(e) => handleManualReasonChange(trainee._id, e.target.value)} 
                                              placeholder="Reason..." 
                                              className="h-9"
                                          />
                                      </TableCell>
                                      <TableCell>
                                          <Button 
                                              size="sm" 
                                              onClick={() => handleSaveManualMark(trainee)} 
                                              disabled={trainee.isSaving}
                                          >
                                              {trainee.isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
                                          </Button>
                                      </TableCell>
                                  </TableRow>
                              ))
                          )}
                      </TableBody>
                  </Table>
              )}
              <DialogFooter>
                  <Button variant="outline" onClick={() => setManualMarkModalOpen(false)}>Close</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}