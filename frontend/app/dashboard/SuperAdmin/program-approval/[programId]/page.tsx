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
import { getCourseFileViewUrl, approveCourse as approveCourseService, rejectCourse as rejectCourseService } from "@/lib/services/course.service";

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
  ExternalLink
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ProgramDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const programId = Array.isArray(params.programId) ? params.programId[0] : params.programId;

    const [program, setProgram] = useState<Program | null>(null);
    const [stats, setStats] = useState<ProgramStats | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Processing states for Program-level actions
    const [isProgramProcessing, setIsProgramProcessing] = useState(false); 
    
    // States for Program-level rejection modal
    const [showProgramRejectModal, setShowProgramRejectModal] = useState(false);
    const [programRejectReason, setProgramRejectReason] = useState("");

    // States for Course-level actions and rejection modal
    const [processingCourseId, setProcessingCourseId] = useState<string | null>(null); 
    const [showCourseRejectModal, setShowCourseRejectModal] = useState(false);
    const [courseToReject, setCourseToReject] = useState<Course | null>(null);
    const [courseRejectReason, setCourseRejectReason] = useState("");

    // New state for handling the iframe view of documents
    const [showDocumentIframeModal, setShowDocumentIframeModal] = useState(false);
    const [documentToViewUrl, setDocumentToViewUrl] = useState<string | null>(null);
    const [documentToViewTitle, setDocumentToViewTitle] = useState<string | null>(null);

    // Reusable confirmation dialog state
    const [confirmationDialog, setConfirmationDialog] = useState<{
        open: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
    }>({ open: false, title: '', description: '', onConfirm: () => {} });

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

    // --- Program-level Actions ---
    const handleApproveProgram = () => {
        if (!program) return;
        setConfirmationDialog({
            open: true,
            title: "Approve Program",
            description: `Are you sure you want to approve the program "${program.name}"? It will become active.`,
            onConfirm: async () => {
                setIsProgramProcessing(true);
                try {
                    await approveProgram(program._id);
                    toast.success("Program approved successfully!");
                    fetchData();
                } catch (err: any) {
                    toast.error(err.response?.data?.message || "Failed to approve program.");
                } finally {
                    setIsProgramProcessing(false);
                }
            }
        });
    };
    
    const openProgramRejectModal = () => {
        if (!program) return;
        setProgramRejectReason("");
        setShowProgramRejectModal(true);
    };

    const handleRejectProgram = async () => {
        if (!program || !programRejectReason.trim()) {
            toast.error("Rejection reason is required.");
            return;
        }
        setIsProgramProcessing(true);
        try {
            await rejectProgram(program._id, programRejectReason);
            toast.success("Program has been rejected.");
            setShowProgramRejectModal(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to reject program.");
        } finally {
            setIsProgramProcessing(false);
        }
    };

    // --- Course-level Actions ---
    const handleApproveCourse = (course: Course) => {
        setConfirmationDialog({
            open: true,
            title: "Approve Course",
            description: `Are you sure you want to approve the course "${course.title}"? It will become active for trainees.`,
            onConfirm: async () => {
                setProcessingCourseId(course._id);
                try {
                    await approveCourseService(course._id);
                    toast.success("Course approved successfully!");
                    fetchData();
                } catch (err: any) {
                    toast.error(err.response?.data?.message || "Failed to approve course.");
                } finally {
                    setProcessingCourseId(null);
                }
            }
        });
    };

    const openCourseRejectModal = (course: Course) => { 
        setCourseToReject(course);
        setCourseRejectReason("");
        setShowCourseRejectModal(true);
    };

    const handleRejectCourseConfirmation = async () => { 
        if (!courseToReject || !courseRejectReason.trim()) {
            toast.error("Rejection reason is required.");
            return;
        }
        setProcessingCourseId(courseToReject._id);
        try {
            await rejectCourseService(courseToReject._id, courseRejectReason);
            toast.success("Course rejected successfully!");
            setShowCourseRejectModal(false);
            setCourseToReject(null);
            setCourseRejectReason("");
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to reject course.");
        } finally {
            setProcessingCourseId(null);
        }
    };

    const openDocumentIframe = (course: Course) => {
    try {
        const fileUrl = getCourseFileViewUrl(course);
        
        // Check if we have a token in the URL (basic validation)
        if (!fileUrl.includes('token=')) {
            toast.error('Authentication required. Please log in again.');
            return;
        }
        
        setDocumentToViewUrl(fileUrl);
        setDocumentToViewTitle(course.title);
        setShowDocumentIframeModal(true);
    } catch (error) {
        console.error('Failed to generate file URL:', error);
        toast.error('Failed to load document. Please try again.');
    }
};

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PendingApproval': 
                return (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        <Clock className="mr-1 h-3 w-3"/>
                        Pending Approval
                    </Badge>
                );
            case 'Active': 
                return (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                        <BadgeCheck className="mr-1 h-3 w-3"/>
                        Active
                    </Badge>
                );
            case 'Rejected': 
                return (
                    <Badge variant="destructive">
                        <X className="mr-1 h-3 w-3"/>
                        Rejected
                    </Badge>
                );
            case 'Draft': 
                return (
                    <Badge variant="secondary">
                        <FileText className="mr-1 h-3 w-3"/>
                        Draft
                    </Badge>
                );
            case 'Approved': 
                return (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                        <BadgeCheck className="mr-1 h-3 w-3"/>
                        Approved
                    </Badge>
                );
            default: 
                return <Badge>{status}</Badge>;
        }
    };

    const getInitials = (name: string = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-10 w-10 animate-spin"/>
            </div>
        );
    }
    
    if (!program) {
        return <div>Program not found.</div>;
    }

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
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold">{program.name}</CardTitle>
                            <CardDescription className="mt-1 text-base">{program.description}</CardDescription>
                        </CardHeader>
                    </Card>

                    <Tabs defaultValue="trainees">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="trainees">
                                <Users className="mr-2 h-4 w-4"/>
                                Trainees ({trainees.length})
                            </TabsTrigger>
                            <TabsTrigger value="facilitators">
                                <UserCheck className="mr-2 h-4 w-4"/>
                                Facilitators ({facilitators.length})
                            </TabsTrigger>
                           
                        </TabsList>
                        
                        {/* Trainees Tab */}
                        <TabsContent value="trainees">
                            <Card>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {trainees.length > 0 ? (
                                                trainees.map(t => (
                                                    <TableRow key={t._id}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarFallback>{getInitials(t.name)}</AvatarFallback>
                                                                </Avatar>
                                                                <span>{t.name}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">{t.email}</TableCell>
                                                        <TableCell>
                                                            <Badge 
                                                                variant={t.isActive ? "default" : "secondary"} 
                                                                className={t.isActive ? "bg-green-100 text-green-800" : ""}
                                                            >
                                                                {t.status}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center h-24">
                                                        No trainees enrolled yet.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        
                        {/* Facilitators Tab */}
                        <TabsContent value="facilitators">
                            <Card>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {facilitators.length > 0 ? (
                                                facilitators.map(f => (
                                                    <TableRow key={f._id}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarFallback>{getInitials(f.name)}</AvatarFallback>
                                                                </Avatar>
                                                                <span>{f.name}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">{f.email}</TableCell>
                                                        <TableCell>
                                                            <Badge 
                                                                variant={f.isActive ? "default" : "secondary"} 
                                                                className={f.isActive ? "bg-green-100 text-green-800" : ""}
                                                            >
                                                                {f.status}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center h-24">
                                                        No facilitators assigned yet.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Courses Tab */}
                        <TabsContent value="courses">
                            <Card>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Course Title</TableHead>
                                                <TableHead>Facilitator</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {courses.length > 0 ? (
                                                courses.map(course => (
                                                    <TableRow key={course._id}>
                                                        <TableCell className="font-medium">{course.title}</TableCell>
                                                        <TableCell>{course.facilitator.name}</TableCell>
                                                        <TableCell>{getStatusBadge(course.status)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex gap-1 justify-end">
                                                                {/* Button to view document in an iframe modal */}
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    title="View Document"
                                                                    onClick={() => openDocumentIframe(course)}
                                                                >
                                                                    <ExternalLink className="h-4 w-4"/>
                                                                </Button>
                                                                {/* Approve Course button */}
                                                                {(course.status === 'PendingApproval' || course.status === 'Rejected') && (
                                                                    <Button 
                                                                        size="icon" 
                                                                        variant="ghost" 
                                                                        className="text-green-600 hover:bg-green-100 hover:text-green-700" 
                                                                        title="Approve Course" 
                                                                        onClick={() => handleApproveCourse(course)} 
                                                                        disabled={processingCourseId === course._id}
                                                                    >
                                                                        {processingCourseId === course._id ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin"/>
                                                                        ) : (
                                                                            <Check className="h-4 w-4"/>
                                                                        )}
                                                                    </Button>
                                                                )}
                                                                {/* Reject Course button */}
                                                                {(course.status === 'PendingApproval' || course.status === 'Approved') && (
                                                                    <Button 
                                                                        size="icon" 
                                                                        variant="ghost" 
                                                                        className="text-red-600 hover:bg-red-100 hover:text-red-700" 
                                                                        title="Reject Course" 
                                                                        onClick={() => openCourseRejectModal(course)}
                                                                        disabled={processingCourseId === course._id}
                                                                    >
                                                                        <X className="h-4 w-4"/>
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-24 text-center">
                                                        No courses created for this program yet.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Side Panel for Program Info and Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Program Status
                                {getStatusBadge(program.status)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {program.status === 'PendingApproval' && (
                                <div className="space-y-2">
                                    <Button 
                                        className="w-full" 
                                        onClick={handleApproveProgram}
                                        disabled={isProgramProcessing}
                                    >
                                        {isProgramProcessing ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                        ) : (
                                            <Check className="mr-2 h-4 w-4"/>
                                        )}
                                        Approve Program
                                    </Button>
                                    <Button 
                                        variant="destructive" 
                                        className="w-full"
                                        onClick={openProgramRejectModal}
                                        disabled={isProgramProcessing}
                                    >
                                        <X className="mr-2 h-4 w-4"/>
                                        Reject Program
                                    </Button>
                                </div>
                            )}
                            
                            {stats && (
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold">{stats.totalTrainees}</div>
                                        <div className="text-sm text-muted-foreground">Total Trainees</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold">{stats.totalCourses}</div>
                                        <div className="text-sm text-muted-foreground">Total Courses</div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Program Rejection Modal */}
            <Dialog open={showProgramRejectModal} onOpenChange={setShowProgramRejectModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Program: {program.name}</DialogTitle>
                        <DialogDescription>Provide a clear reason for rejection.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="program-reason">Rejection Reason *</Label>
                        <Textarea 
                            id="program-reason" 
                            value={programRejectReason} 
                            onChange={e => setProgramRejectReason(e.target.value)} 
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowProgramRejectModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleRejectProgram} disabled={isProgramProcessing}>
                            {isProgramProcessing ? <Loader2 className="animate-spin"/> : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Course Rejection Modal */}
            <Dialog open={showCourseRejectModal} onOpenChange={setShowCourseRejectModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Course: {courseToReject?.title}</DialogTitle>
                        <DialogDescription>
                            Provide a clear reason for rejection. This feedback will be sent to the facilitator.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="course-reason">Rejection Reason *</Label>
                        <Textarea 
                            id="course-reason" 
                            value={courseRejectReason} 
                            onChange={e => setCourseRejectReason(e.target.value)} 
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCourseRejectModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleRejectCourseConfirmation} disabled={!!processingCourseId}>
                            {!!processingCourseId ? <Loader2 className="animate-spin"/> : "Confirm Rejection"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Reusable Confirmation Dialog */}
            <AlertDialog open={confirmationDialog.open} onOpenChange={(open) => setConfirmationDialog({ ...confirmationDialog, open })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertCircle className="text-primary"/>
                            {confirmationDialog.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription>{confirmationDialog.description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmationDialog.onConfirm}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Document Iframe Modal */}
            <Dialog open={showDocumentIframeModal} onOpenChange={setShowDocumentIframeModal}>
                <DialogContent className="max-w-4xl max-h-[90vh] w-[90vw] mx-auto">
                    <DialogHeader>
                        <DialogTitle>Document View: {documentToViewTitle}</DialogTitle>
                        <DialogDescription>
                            Viewing the course material in an embedded frame.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="relative flex-grow h-[70vh] w-full">
                        {documentToViewUrl ? (
                            <iframe
                                src={documentToViewUrl}
                                className="w-full h-full border rounded-md"
                                title={documentToViewTitle || "Course Document"}
                                allowFullScreen
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full border rounded-md bg-gray-50">
                                <p className="text-muted-foreground">No document selected or URL is invalid.</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        {documentToViewUrl && (
                            <a href={documentToViewUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline">
                                    <ExternalLink className="mr-2 h-4 w-4"/>
                                    Open in New Tab
                                </Button>
                            </a>
                        )}
                        <Button onClick={() => setShowDocumentIframeModal(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}