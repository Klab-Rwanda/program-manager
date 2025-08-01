"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Eye, Clock, CheckCircle, XCircle, FileText, Loader2, UserPlus, Check, X, AlertTriangle, BookOpen, ServerCrash } from "lucide-react";

import { useAuth } from "@/lib/contexts/RoleContext";
import { Program, User, Course } from "@/types";
import { getAllPrograms, assignManagerToProgram } from "@/lib/services/program.service";
// Removed getAllCoursesForAdmin, approveCourse, rejectCourseService as they are no longer needed on this page
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Keep Tabs, TabsContent, TabsList
import { Textarea } from "@/components/ui/textarea";

const ProgramApprovalPage: React.FC = () => {
    const router = useRouter();
    const { user } = useAuth();
    
    const [programs, setPrograms] = useState<Program[]>([]);
    const [managers, setManagers] = useState<User[]>([]);
    // Removed `courses` state as it's no longer displayed on this page
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null); // Still used for program actions

    const [assignModal, setAssignModal] = useState<{ open: boolean; program: Program | null }>({ open: false, program: null });
    // Fixed: Added selectedManagerId state that was referenced but not declared
    const [selectedManagerId, setSelectedManagerId] = useState<string>("");
    // Removed `rejectCourseModal`, etc. related to courses
    const [rejectionReason, setRejectionReason] = useState(""); // Still used for program rejection
    const [confirmationDialog, setConfirmationDialog] = useState<{
        open: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
    }>({ open: false, title: '', description: '', onConfirm: () => {} });
    
    const [programSearch, setProgramSearch] = useState("");
    const [programFilter, setProgramFilter] = useState("all");
    // Removed `courseSearch`, `courseFilter`

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch only programs and managers, no courses needed
            const [programsData, managersData] = await Promise.all([
                getAllPrograms(), 
                getAllManagers()
            ]);
            setPrograms(programsData);
            setManagers(managersData);
            // setCourses(coursesData); // Removed
        } catch (err: any) {
            const message = err.message || "Failed to load management data";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { 
        if (user?.role === 'SuperAdmin') {
            fetchData(); 
        }
    }, [user, fetchData]);

    const handleAssignManager = async () => {
        if (!assignModal.program) return;
        setIsProcessing(true);
        try {
            // Fixed: Use selectedManagerId instead of rejectionReason
            await assignManagerToProgram(assignModal.program._id, selectedManagerId);
            toast.success("Program Manager updated successfully!");
            setAssignModal({ open: false, program: null });
            setSelectedManagerId("");
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to assign manager.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Removed handleForceApproveCourse, openRejectCourseModal, handleForceRejectCourse

    const filteredPrograms = programs.filter(p => 
        (p.name.toLowerCase().includes(programSearch.toLowerCase())) && 
        (programFilter === "all" || p.status === programFilter)
    );
    // Removed filteredCourses as it's no longer used

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PendingApproval': 
                return (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        <Clock className="mr-1 h-3 w-3"/>
                        Pending
                    </Badge>
                );
            case 'Active': 
                return (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="mr-1 h-3 w-3"/>
                        Active
                    </Badge>
                );
            case 'Rejected': 
                return (
                    <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3"/>
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
            default: 
                return <Badge>{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading Management Data...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] bg-muted/50 rounded-lg border border-dashed">
                <ServerCrash className="h-12 w-12 text-destructive mb-4" />
                <h3 className="text-xl font-semibold text-destructive">Failed to Load Data</h3>
                <p className="text-muted-foreground mt-2 mb-4">{error}</p>
                <Button onClick={fetchData}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Content & Program Management</h1>
                <p className="text-muted-foreground">Oversee all programs and course materials from one central hub.</p>
            </div>

            <Tabs defaultValue="programs" className="w-full">
                {/* Only one tab list now */}
                <TabsList className="grid w-full grid-cols-1">
                    <TabsTrigger value="programs">Program Management ({programs.length})</TabsTrigger>
                    {/* Removed Course Oversight tab */}
                </TabsList>
                
                <TabsContent value="programs" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row gap-4">
                                <Input 
                                    placeholder="Search programs..." 
                                    value={programSearch} 
                                    onChange={(e) => setProgramSearch(e.target.value)} 
                                    className="max-w-sm"
                                />
                                <Select value={programFilter} onValueChange={setProgramFilter}>
                                    <SelectTrigger className="w-full md:w-[200px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="PendingApproval">Pending Approval</SelectItem>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Rejected">Rejected</SelectItem>
                                        <SelectItem value="Draft">Draft</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Program</TableHead>
                                            <TableHead>Manager</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredPrograms.length > 0 ? (
                                            filteredPrograms.map((program) => (
                                                <TableRow key={program._id}>
                                                    <TableCell className="font-medium">{program.name}</TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {program.programManager?.name || 'Unassigned'}
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(program.status)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="mr-2" 
                                                            onClick={() => {
                                                                setAssignModal({ open: true, program });
                                                                setSelectedManagerId(program.programManager?._id || "unassign");
                                                            }}
                                                        >
                                                            <UserPlus className="mr-2 h-4 w-4" />
                                                            Assign
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => router.push(`/dashboard/SuperAdmin/program-approval/${program._id}`)}
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center">
                                                    No programs match your filters.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Removed TabsContent for "courses" */}
            </Tabs>

            {/* Manager Assignment Dialog */}
            <Dialog open={assignModal.open} onOpenChange={(open) => setAssignModal({ ...assignModal, open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Manager for "{assignModal.program?.name}"</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label>Program Manager</Label>
                        <Select value={selectedManagerId} onValueChange={(val) => setSelectedManagerId(val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a manager" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unassign">-- Unassign --</SelectItem>
                                {managers.map(m => (
                                    <SelectItem key={m._id} value={m._id}>
                                        {m.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setAssignModal({ open: false, program: null })}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleAssignManager} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="animate-spin"/> : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Reusable Confirmation Dialog for any action */}
            <AlertDialog open={confirmationDialog.open} onOpenChange={(open) => setConfirmationDialog({ ...confirmationDialog, open })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="text-primary"/>
                            {confirmationDialog.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmationDialog.description}
                        </AlertDialogDescription>
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