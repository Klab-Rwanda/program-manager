"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { FileText, Upload, Clock, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/contexts/RoleContext";
import api from "@/lib/api"; 
import { Program as BackendProgram, Assignment } from "@/types"; 

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// Import relevant services
import { getAllPrograms } from "@/lib/services/program.service";
import { getAssignmentsForProgram } from "@/lib/services/assignment.service"; 
import { createSubmission } from "@/lib/services/submission.service";

export default function SubmitProjectsPage() {
    const { user } = useAuth();
    const [myPrograms, setMyPrograms] = useState<BackendProgram[]>([]);
    const [selectedProgramId, setSelectedProgramId] = useState<string>("");
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [submissionFiles, setSubmissionFiles] = useState<Record<string, File | null>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const programsData = await getAllPrograms(); 
            setMyPrograms(programsData);

            const activeProgramsOnly = programsData.filter(p => p.status === 'Active');

            if (activeProgramsOnly.length > 0) {
                if (!selectedProgramId || !activeProgramsOnly.some(p => p._id === selectedProgramId)) {
                    setSelectedProgramId(activeProgramsOnly[0]._id);
                }
            } else {
                setSelectedProgramId("");
            }
        } catch (err) {
            toast.error("Failed to load your programs.");
            console.error("Fetch Programs Error:", err);
        } finally {
            setLoading(false);
        }
    }, [user, selectedProgramId]);

    const fetchAssignmentsForSelectedProgram = useCallback(async () => {
        if (!selectedProgramId) {
            setAssignments([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const assignmentData = await getAssignmentsForProgram(selectedProgramId); 
            setAssignments(assignmentData);
            // Clear file selections when changing programs
            setSubmissionFiles({});
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to load assignments for this program. Ensure program is active.");
            console.error("Fetch Assignments Error:", err);
            setAssignments([]);
        } finally {
            setLoading(false);
        }
    }, [selectedProgramId]);

    useEffect(() => { 
        fetchData(); 
    }, [fetchData]);
    
    useEffect(() => { 
        fetchAssignmentsForSelectedProgram(); 
    }, [fetchAssignmentsForSelectedProgram]);

    const handleFileChange = useCallback((assignmentId: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setSubmissionFiles(prev => ({
            ...prev,
            [assignmentId]: file
        }));
    }, []);

    const handleSubmission = async (assignmentId: string, programId: string) => {
        const submissionFile = submissionFiles[assignmentId];
        
        if (!submissionFile) {
            toast.error("Please select a file to submit.");
            return;
        }

        
        const maxFileSize = 10 * 1024 * 1024; // 10MB
        if (submissionFile.size > maxFileSize) {
            toast.error("File size must be less than 10MB.");
            return;
        }

        setIsSubmitting(true);
        try {
            await createSubmission(programId, assignmentId, submissionFile); 
            toast.success("Project submitted successfully!");
            
            // Clear the specific file for this assignment
            setSubmissionFiles(prev => ({
                ...prev,
                [assignmentId]: null
            }));
            
            
            const fileInput = document.querySelector(`input[data-assignment-id="${assignmentId}"]`) as HTMLInputElement;
            if (fileInput) {
                fileInput.value = '';
            }
            
            await fetchAssignmentsForSelectedProgram(); 
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to submit project.");
            console.error("Submission Error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const isSelectedProgramActive = useMemo(() => {
        const program = myPrograms.find(p => p._id === selectedProgramId);
        return program?.status === 'Active';
    }, [myPrograms, selectedProgramId]);

    const activePrograms = useMemo(() => 
        myPrograms.filter(p => p.status === 'Active'), 
        [myPrograms]
    );

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'Pending': { variant: "secondary", icon: Clock, text: "Pending" },
            'Submitted': { variant: "default", icon: CheckCircle, text: "Submitted", className: "bg-blue-100 text-blue-800" },
            'Reviewed': { variant: "default", icon: CheckCircle, text: "Reviewed", className: "bg-green-100 text-green-800" },
            'NeedsRevision': { variant: "destructive", icon: AlertCircle, text: "Needs Revision" }
        } as const;

        const config = statusConfig[status as keyof typeof statusConfig] || { variant: "default", icon: Clock, text: status };
        const Icon = config.icon;

        return (
            <Badge variant={config.variant as any} className={config.className}>
                <Icon className="mr-1 h-3 w-3" />
                {config.text}
            </Badge>
        );
    };

    const canSubmit = (assignment: Assignment) => {
        return isSelectedProgramActive && 
               ['Pending', 'Submitted', 'NeedsRevision'].includes(assignment.status);
    };

    const getSubmitButtonText = (status: string) => {
        if (status === 'Submitted' || status === 'NeedsRevision') {
            return 'Resubmit';
        }
        return 'Submit Now';
    };

    const formatDueDate = (dueDate: string) => {
        const date = new Date(dueDate);
        const now = new Date();
        const isOverdue = date < now;
        
        return (
            <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                Due: {date.toLocaleDateString()}
                {isOverdue && " (Overdue)"}
            </span>
        );
    };

    if (!user) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground">Please log in to view your assignments.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Project Submissions</h1>
                <p className="text-muted-foreground">Submit your assignments for approved courses.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Select Program</CardTitle>
                    <CardDescription>Choose an active program to view and submit assignments.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select 
                        value={selectedProgramId} 
                        onValueChange={setSelectedProgramId}
                        disabled={activePrograms.length === 0 && !loading}
                    >
                        <SelectTrigger className="max-w-md">
                            <SelectValue placeholder="Select one of your active programs..." />
                        </SelectTrigger>
                        <SelectContent>
                            {activePrograms.map(p => (
                                <SelectItem key={p._id} value={p._id}>
                                    {p.name}
                                </SelectItem>
                            ))}
                            {activePrograms.length === 0 && !loading && (
                                <div className="text-sm text-muted-foreground p-2">
                                    No active programs available.
                                </div>
                            )}
                        </SelectContent>
                    </Select>
                    
                    {!loading && activePrograms.length === 0 && (
                        <p className="text-sm text-red-500 mt-2">
                            You are not currently enrolled in any active programs. You cannot submit projects.
                        </p>
                    )}
                </CardContent>
            </Card>

            {loading ? (
                <div className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p className="text-muted-foreground mt-2">Loading assignments...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {assignments.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardContent>
                                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-semibold">No Assignments Found</h3>
                                <p className="text-muted-foreground">
                                    {selectedProgramId 
                                        ? "No assignments available for the selected program."
                                        : "Please select an active program to view assignments."
                                    }
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        assignments.map(asg => (
                            <Card key={asg._id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle>{asg.title}</CardTitle>
                                            <CardDescription>
                                                {formatDueDate(asg.dueDate)}
                                            </CardDescription>
                                        </div>
                                        {getStatusBadge(asg.status)}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {/* Grade and Feedback Display */}
                                        {asg.status === 'Reviewed' && (
                                            <div className="bg-green-50 p-4 rounded-lg border">
                                                {asg.grade && (
                                                    <p className="font-bold text-lg text-green-600 mb-2">
                                                        Grade: {asg.grade}%
                                                    </p>
                                                )}
                                                {asg.feedback && (
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-700 mb-1">Feedback:</p>
                                                        <p className="text-sm text-gray-600">{asg.feedback}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* File Upload Section */}
                                        {canSubmit(asg) && (
                                            <div className="flex items-center gap-4">
                                                <Input 
                                                    type="file" 
                                                    onChange={handleFileChange(asg._id)}
                                                    className="max-w-[300px]"
                                                    data-assignment-id={asg._id}
                                                    accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                                                />
                                                <Button 
                                                    onClick={() => handleSubmission(asg._id, selectedProgramId)} 
                                                    disabled={isSubmitting || !submissionFiles[asg._id]}
                                                    className="min-w-[120px]"
                                                >
                                                    {isSubmitting ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                                    ) : (
                                                        <Upload className="mr-2 h-4 w-4"/>
                                                    )} 
                                                    {getSubmitButtonText(asg.status)}
                                                </Button>
                                            </div>
                                        )}

                                        {/* Disabled Submit Button */}
                                        {!canSubmit(asg) && (
                                            <Button 
                                                disabled={true} 
                                                title={!isSelectedProgramActive ? "Program not active" : "Assignment already reviewed"}
                                                className="min-w-[120px]"
                                            >
                                                <Upload className="mr-2 h-4 w-4"/> 
                                                Submit
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}