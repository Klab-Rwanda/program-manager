"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getProgramById,
  approveProgram,
  rejectProgram,
  getProgramStats,
} from "@/lib/services/program.service";
import { Program, Course, Trainee, Facilitator, ProgramStats } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  Users,
  UserCheck,
  Check,
  X,
  FileText,
  Clock,
  AlertCircle,
  BadgeCheck,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function ProgramDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const programId = Array.isArray(params.programId) ? params.programId[0] : params.programId;

    const [program, setProgram] = useState<Program | null>(null);
    const [stats, setStats] = useState<ProgramStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    const fetchData = useCallback(async () => {
        if (!programId) return;
        setLoading(true);
        try {
            const [programData, statsData] = await Promise.all([
                getProgramById(programId),
                getProgramStats(programId)
            ]);
            setProgram(programData);
            setStats(statsData);
        } catch (err) {
            toast.error("Failed to load program details.");
            router.push("/dashboard/SuperAdmin/program-approval");
        } finally {
            setLoading(false);
        }
    }, [programId, router]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleApprove = async () => {
        if (!program) return;
        setIsProcessing(true);
        try {
            await approveProgram(program._id);
            toast.success("Program approved successfully!");
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to approve program.");
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleReject = async () => {
        if (!program || !rejectReason.trim()) return toast.error("Rejection reason is required.");
        setIsProcessing(true);
        try {
            await rejectProgram(program._id, rejectReason);
            toast.success("Program has been rejected.");
            setShowRejectModal(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to reject program.");
        } finally {
            setIsProcessing(false);
        }
    };
    
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PendingApproval': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="mr-1 h-3 w-3"/>Pending Approval</Badge>;
            case 'Active': return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200"><BadgeCheck className="mr-1 h-3 w-3"/>Active</Badge>;
            case 'Rejected': return <Badge variant="destructive"><X className="mr-1 h-3 w-3"/>Rejected</Badge>;
            case 'Draft': return <Badge variant="secondary"><FileText className="mr-1 h-3 w-3"/>Draft</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    const getInitials = (name: string = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

    if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin"/></div>;
    if (!program) return <div>Program not found.</div>;

    const trainees = (program.trainees as Trainee[]) || [];
    const facilitators = (program.facilitators as Facilitator[]) || [];
    const courses = (program.courses as Course[]) || [];

    return (
        <div className="space-y-6">
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/SuperAdmin/program-approval')}>
                <ArrowLeft className="mr-2 h-4 w-4"/> Back to Program List
            </Button>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <Card><CardHeader><CardTitle className="text-3xl font-bold">{program.name}</CardTitle><CardDescription className="mt-1 text-base">{program.description}</CardDescription></CardHeader></Card>

                    <Tabs defaultValue="trainees">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="trainees"><Users className="mr-2 h-4 w-4"/>Trainees ({trainees.length})</TabsTrigger>
                            <TabsTrigger value="facilitators"><UserCheck className="mr-2 h-4 w-4"/>Facilitators ({facilitators.length})</TabsTrigger>
                            <TabsTrigger value="courses"><BookOpen className="mr-2 h-4 w-4"/>Courses ({courses.length})</TabsTrigger>
                        </TabsList>
                        
                        {/* Trainees Tab */}
                        <TabsContent value="trainees">
                             <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{trainees.length > 0 ? trainees.map(t => <TableRow key={t._id}><TableCell><div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarFallback>{getInitials(t.name)}</AvatarFallback></Avatar><span>{t.name}</span></div></TableCell><TableCell className="text-muted-foreground">{t.email}</TableCell><TableCell><Badge variant={t.isActive ? "default" : "secondary"} className={t.isActive ? "bg-green-100 text-green-800" : ""}>{t.status}</Badge></TableCell></TableRow>) : <TableRow><TableCell colSpan={3} className="text-center h-24">No trainees enrolled yet.</TableCell></TableRow>}</TableBody></Table></CardContent></Card>
                        </TabsContent>
                        
                        {/* Facilitators Tab */}
                        <TabsContent value="facilitators">
                             <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{facilitators.length > 0 ? facilitators.map(f => <TableRow key={f._id}><TableCell><div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarFallback>{getInitials(f.name)}</AvatarFallback></Avatar><span>{f.name}</span></div></TableCell><TableCell className="text-muted-foreground">{f.email}</TableCell><TableCell><Badge variant={f.isActive ? "default" : "secondary"} className={f.isActive ? "bg-green-100 text-green-800" : ""}>{f.status}</Badge></TableCell></TableRow>) : <TableRow><TableCell colSpan={3} className="text-center h-24">No facilitators assigned yet.</TableCell></TableRow>}</TableBody></Table></CardContent></Card>
                        </TabsContent>

                        {/* Courses Tab */}
                        <TabsContent value="courses">
                             <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Course Title</TableHead><TableHead>Facilitator</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{courses.length > 0 ? courses.map(c => <TableRow key={c._id}><TableCell className="font-medium">{c.title}</TableCell><TableCell>{c.facilitator.name}</TableCell><TableCell>{getStatusBadge(c.status)}</TableCell></TableRow>) : <TableRow><TableCell colSpan={3} className="text-center h-24">No courses created for this program yet.</TableCell></TableRow>}</TableBody></Table></CardContent></Card>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    {program.status === 'PendingApproval' && (
                        <Card className="border-primary bg-muted/40">
                            <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle/>Action Required</CardTitle><CardDescription>This program is awaiting your approval.</CardDescription></CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                <Button onClick={handleApprove} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">{isProcessing ? <Loader2 className="animate-spin"/> : <Check/>} Approve</Button>
                                <Button variant="destructive" onClick={() => setShowRejectModal(true)} disabled={isProcessing}><X/> Reject</Button>
                            </CardContent>
                        </Card>
                    )}
                    <Card>
                        <CardHeader><CardTitle>Program Information</CardTitle></CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div>{getStatusBadge(program.status)}</div><Separator/>
                            <div className="flex justify-between"><span>Manager:</span><span className="font-medium text-right">{program.programManager?.name || 'N/A'}</span></div>
                            <div className="flex justify-between"><span>Duration:</span><span className="font-medium text-right">{new Date(program.startDate).toLocaleDateString()} - {new Date(program.endDate).toLocaleDateString()}</span></div>
                            <Separator/>
                            <h4 className="font-semibold pt-2">Live Statistics</h4>
                            <div className="flex justify-between"><span>Attendance Rate:</span><span className="font-medium">{stats?.attendanceRate ?? 0}%</span></div>
                            <div className="flex justify-between"><span>Completion Rate:</span><span className="font-medium">{stats?.completionRate ?? 0}%</span></div>
                            {program.rejectionReason && <div className="pt-2 border-t"><span className="font-semibold text-destructive">Rejection Reason:</span><p className="text-muted-foreground text-sm">{program.rejectionReason}</p></div>}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
                <DialogContent><DialogHeader><DialogTitle>Reject Program: {program.name}</DialogTitle><DialogDescription>Provide a clear reason for rejection.</DialogDescription></DialogHeader><div className="py-4 space-y-2"><Label htmlFor="reason">Rejection Reason *</Label><Textarea id="reason" value={rejectReason} onChange={e => setRejectReason(e.target.value)} /></div><DialogFooter><Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancel</Button><Button variant="destructive" onClick={handleReject} disabled={isProcessing}>{isProcessing ? <Loader2 className="animate-spin"/> : "Confirm"}</Button></DialogFooter></DialogContent>
            </Dialog>
        </div>
    );
}