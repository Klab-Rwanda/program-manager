"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Eye, Clock, CheckCircle, XCircle, FileText, Loader2, UserPlus, Check, X, AlertTriangle, BookOpen, ServerCrash } from "lucide-react";

import { useAuth } from "@/lib/contexts/RoleContext";
import { Program, User, Course } from "@/types";
import { getAllPrograms, assignManagerToProgram } from "@/lib/services/program.service";
import { getAllCoursesForAdmin, approveCourse, rejectCourse as rejectCourseService } from "@/lib/services/course.service";
import { getAllManagers } from "@/lib/services/user.service";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const ProgramApprovalPage: React.FC = () => {
    const router = useRouter();
    const { user } = useAuth();
    
    const [programs, setPrograms] = useState<Program[]>([]);
    const [managers, setManagers] = useState<User[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const [assignModal, setAssignModal] = useState<{ open: boolean; program: Program | null }>({ open: false, program: null });
    const [rejectCourseModal, setRejectCourseModal] = useState<{ open: boolean; course: Course | null }>({ open: false, course: null });
    const [selectedManagerId, setSelectedManagerId] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");
    const [confirmationDialog, setConfirmationDialog] = useState<{
        open: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
    }>({ open: false, title: '', description: '', onConfirm: () => {} });
    
    const [programSearch, setProgramSearch] = useState("");
    const [programFilter, setProgramFilter] = useState("all");
    const [courseSearch, setCourseSearch] = useState("");
    const [courseFilter, setCourseFilter] = useState("all");

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [programsData, managersData, coursesData] = await Promise.all([ getAllPrograms(), getAllManagers(), getAllCoursesForAdmin() ]);
            setPrograms(programsData);
            setManagers(managersData);
            setCourses(coursesData);
        } catch (err: any) {
            const message = err.message || "Failed to load management data";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { if (user?.role === 'SuperAdmin') fetchData(); }, [user, fetchData]);

    const handleAssignManager = async () => {
        if (!assignModal.program) return;
        setIsProcessing(true);
        try {
            await assignManagerToProgram(assignModal.program._id, selectedManagerId);
            toast.success("Program Manager updated successfully!");
            setAssignModal({ open: false, program: null });
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to assign manager.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleForceApproveCourse = (course: Course) => {
        setConfirmationDialog({
            open: true,
            title: "Are you sure you want to approve this course?",
            description: `This action will approve "${course.title}" and make it immediately available to all trainees in the "${course.program.name}" program.`,
            onConfirm: async () => {
                setProcessingId(course._id);
                try {
                    await approveCourse(course._id);
                    toast.success("Course approved successfully.");
                    fetchData();
                } catch (err: any) { 
                    toast.error(err.response?.data?.message || "Approval failed."); 
                } finally { 
                    setProcessingId(null); 
                }
            }
        });
    };

    const openRejectCourseModal = (course: Course) => {
        setRejectCourseModal({ open: true, course });
        setRejectionReason("");
    };

    const handleForceRejectCourse = async () => {
        if (!rejectCourseModal.course || !rejectionReason.trim()) return toast.error("Reason is required.");
        setProcessingId(rejectCourseModal.course._id);
        try {
            await rejectCourseService(rejectCourseModal.course._id, rejectionReason);
            toast.success("Course rejected successfully.");
            setRejectCourseModal({ open: false, course: null });
            fetchData();
        } catch (err: any) { 
            toast.error(err.response?.data?.message || "Rejection failed."); 
        } finally { 
            setProcessingId(null); 
        }
    };

    const filteredPrograms = programs.filter(p => (p.name.toLowerCase().includes(programSearch.toLowerCase())) && (programFilter === "all" || p.status === programFilter));
    const filteredCourses = courses.filter(c => 
        (c.title.toLowerCase().includes(courseSearch.toLowerCase()) || 
         c.program.name.toLowerCase().includes(courseSearch.toLowerCase()) || 
         c.facilitator.name.toLowerCase().includes(courseSearch.toLowerCase())) &&
        (courseFilter === "all" || c.status === courseFilter)
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PendingApproval': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="mr-1 h-3 w-3"/>Pending</Badge>;
            case 'Active': return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="mr-1 h-3 w-3"/>Active</Badge>;
            case 'Rejected': return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3"/>Rejected</Badge>;
            case 'Draft': return <Badge variant="secondary"><FileText className="mr-1 h-3 w-3"/>Draft</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    if (loading) return <div className="flex flex-col items-center justify-center h-full min-h-[60vh]"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="mt-4 text-muted-foreground">Loading Management Data...</p></div>;
    if (error) return <div className="flex flex-col items-center justify-center h-full min-h-[60vh] bg-muted/50 rounded-lg border border-dashed"><ServerCrash className="h-12 w-12 text-destructive mb-4" /><h3 className="text-xl font-semibold text-destructive">Failed to Load Data</h3><p className="text-muted-foreground mt-2 mb-4">{error}</p><Button onClick={fetchData}>Retry</Button></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Content & Program Management</h1>
                <p className="text-muted-foreground">Oversee all programs and course materials from one central hub.</p>
            </div>

            <Tabs defaultValue="programs" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="programs">Program Management ({programs.length})</TabsTrigger>
                    <TabsTrigger value="courses">Course Oversight ({courses.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="programs" className="space-y-4">
                    <Card>
                        <CardHeader><div className="flex flex-col md:flex-row gap-4"><Input placeholder="Search programs..." value={programSearch} onChange={(e) => setProgramSearch(e.target.value)} className="max-w-sm"/><Select value={programFilter} onValueChange={setProgramFilter}><SelectTrigger className="w-full md:w-[200px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="PendingApproval">Pending Approval</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="Rejected">Rejected</SelectItem><SelectItem value="Draft">Draft</SelectItem></SelectContent></Select></div></CardHeader>
                        <CardContent>
                            <div className="rounded-md border"><Table><TableHeader><TableRow><TableHead>Program</TableHead><TableHead>Manager</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
                                {filteredPrograms.length > 0 ? filteredPrograms.map((program) => (
                                    <TableRow key={program._id}><TableCell className="font-medium">{program.name}</TableCell><TableCell className="text-muted-foreground">{program.programManager?.name || 'Unassigned'}</TableCell><TableCell>{getStatusBadge(program.status)}</TableCell><TableCell className="text-right"><Button variant="outline" size="sm" className="mr-2" onClick={() => { setAssignModal({ open: true, program }); setSelectedManagerId(program.programManager?._id || "unassign"); }}><UserPlus className="mr-2 h-4 w-4"/> Assign</Button><Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/SuperAdmin/program-approval/${program._id}`)}><Eye className="mr-2 h-4 w-4"/> View</Button></TableCell></TableRow>
                                )) : <TableRow><TableCell colSpan={4} className="h-24 text-center">No programs match your filters.</TableCell></TableRow>}
                            </TableBody></Table></div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="courses" className="space-y-4">
                    <Card>
                        <CardHeader><div className="flex flex-col md:flex-row gap-4"><Input placeholder="Search courses..." value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)} className="max-w-sm"/><Select value={courseFilter} onValueChange={setCourseFilter}><SelectTrigger className="w-full md:w-[200px]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="PendingApproval">Pending</SelectItem><SelectItem value="Approved">Approved</SelectItem><SelectItem value="Rejected">Rejected</SelectItem><SelectItem value="Draft">Draft</SelectItem></SelectContent></Select></div></CardHeader>
                        <CardContent>
                             <div className="rounded-md border"><Table><TableHeader><TableRow><TableHead>Course Title</TableHead><TableHead>Program</TableHead><TableHead>Facilitator</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
                                    {filteredCourses.length > 0 ? filteredCourses.map(course => (
                                        <TableRow key={course._id}><TableCell className="font-medium">{course.title}</TableCell><TableCell>{course.program.name}</TableCell><TableCell>{course.facilitator.name}</TableCell><TableCell>{getStatusBadge(course.status)}</TableCell><TableCell className="text-right flex gap-1 justify-end">
                                            <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/${course.contentUrl.replace(/\\/g, '/')}`} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon" title="View Document"><Eye className="h-4 w-4"/></Button></a>
                                            {course.status !== 'Approved' && <Button size="icon" variant="ghost" className="text-green-600 hover:bg-green-100 hover:text-green-700" title="Force Approve" onClick={() => handleForceApproveCourse(course)} disabled={processingId === course._id}>{processingId === course._id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4"/>}</Button>}
                                            {course.status !== 'Rejected' && <Button size="icon" variant="ghost" className="text-red-600 hover:bg-red-100 hover:text-red-700" title="Force Reject" onClick={() => openRejectCourseModal(course)} disabled={processingId === course._id}><X className="h-4 w-4"/></Button>}
                                        </TableCell></TableRow>
                                    )) : <TableRow><TableCell colSpan={5} className="h-24 text-center">No courses match your filters.</TableCell></TableRow>}
                                </TableBody></Table>
                             </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={assignModal.open} onOpenChange={(open) => setAssignModal({ ...assignModal, open })}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Assign Manager for "{assignModal.program?.name}"</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-2"><Label>Program Manager</Label><Select value={selectedManagerId} onValueChange={setSelectedManagerId}><SelectTrigger><SelectValue placeholder="Select a manager" /></SelectTrigger><SelectContent><SelectItem value="unassign">-- Unassign --</SelectItem>{managers.map(m => <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>)}</SelectContent></Select></div>
                    <DialogFooter><Button variant="outline" onClick={() => setAssignModal({ open: false, program: null })}>Cancel</Button><Button onClick={handleAssignManager} disabled={isProcessing}>{isProcessing ? <Loader2 className="animate-spin"/> : "Save"}</Button></DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={rejectCourseModal.open} onOpenChange={(open) => setRejectCourseModal({ ...rejectCourseModal, open })}>
                 <DialogContent>
                    <DialogHeader><DialogTitle>Reject Course: {rejectCourseModal.course?.title}</DialogTitle><DialogDescription>Provide a reason for rejection.</DialogDescription></DialogHeader>
                    <div className="py-4"><Label>Reason *</Label><Textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} /></div>
                    <DialogFooter><Button variant="outline" onClick={() => setRejectCourseModal({open: false, course: null})}>Cancel</Button><Button variant="destructive" onClick={handleForceRejectCourse} disabled={!!processingId}>Confirm Rejection</Button></DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Reusable Confirmation Dialog for any action */}
            <AlertDialog open={confirmationDialog.open} onOpenChange={(open) => setConfirmationDialog({ ...confirmationDialog, open })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-primary"/>{confirmationDialog.title}</AlertDialogTitle>
                        <AlertDialogDescription>{confirmationDialog.description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmationDialog.onConfirm}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default ProgramApprovalPage;