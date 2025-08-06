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

// Import relevant services
import { getAllPrograms } from "@/lib/services/program.service"; // Used to get programs for dropdown
import { getAssignmentsForProgram } from "@/lib/services/assignment.service"; 
import { createSubmission } from "@/lib/services/submission.service"; 
import { Input } from "@/components/ui/input";

export default function SubmitProjectsPage() {
    const { user } = useAuth();
    const [myPrograms, setMyPrograms] = useState<BackendProgram[]>([]); // Programs trainee is in
    const [selectedProgramId, setSelectedProgramId] = useState<string>("");
    const [assignments, setAssignments] = useState<Assignment[]>([]); // Assignments for selected program
    const [loading, setLoading] = useState(true);
    const [submissionFile, setSubmissionFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false); // For upload process

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Fetch all programs the trainee is associated with (active/completed)
            const programsData = await getAllPrograms(); 
            setMyPrograms(programsData);

            // Automatically select the first active program if available
            // IMPORTANT: Submissions are only allowed for active programs.
            // So filter `programsData` to find only `Active` ones for this dropdown.
            const activeProgramsOnly = programsData.filter(p => p.status === 'Active');

            if (activeProgramsOnly.length > 0) {
                // If selectedProgramId is not set, or the current selected one is no longer active, default to first active
                if (!selectedProgramId || !activeProgramsOnly.some(p => p._id === selectedProgramId)) {
                    setSelectedProgramId(activeProgramsOnly[0]._id);
                }
            } else {
                setSelectedProgramId(""); // No active programs available
            }
        } catch (err) {
            toast.error("Failed to load your programs.");
            console.error("Fetch Programs Error:", err);
        } finally {
            setLoading(false);
        }
    }, [user, selectedProgramId]); // Re-run if user or selectedProgramId changes

    const fetchAssignmentsForSelectedProgram = useCallback(async () => {
        if (!selectedProgramId) {
            setAssignments([]);
            setLoading(false); // Make sure loading state is updated even if no program
            return;
        }
        setLoading(true);
        try {
            // getAssignmentsForProgram from backend automatically filters for Active programs
            // and throws an error if the program is not active.
            const assignmentData = await getAssignmentsForProgram(selectedProgramId); 
            setAssignments(assignmentData);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to load assignments for this program. Ensure program is active.");
            console.error("Fetch Assignments Error:", err);
            setAssignments([]); // Clear assignments on error
        } finally {
            setLoading(false);
        }
    }, [selectedProgramId]); // Re-run when selected program changes

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { fetchAssignmentsForSelectedProgram(); }, [fetchAssignmentsForSelectedProgram]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSubmissionFile(event.target.files[0]);
        } else {
            setSubmissionFile(null);
        }
    };

    const handleSubmission = async (assignmentId: string, programId: string) => {
        if (!submissionFile) {
            toast.error("Please select a file to submit.");
            return;
        }

        setIsSubmitting(true);
        try {
            await createSubmission(programId, assignmentId, submissionFile); // Backend enforces Active program status
            toast.success("Project submitted successfully!");
            setSubmissionFile(null); // Clear file input
            // Re-fetch assignments to show updated status after submission
            fetchAssignmentsForSelectedProgram(); 
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to submit project.");
            console.error("Submission Error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Helper to check if the selected program is active. 
    // This is primarily for UI hints, as the backend enforces this strictly.
    const isSelectedProgramActive = useMemo(() => {
        const program = myPrograms.find(p => p._id === selectedProgramId);
        return program?.status === 'Active';
    }, [myPrograms, selectedProgramId]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pending': return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3"/>Pending</Badge>;
            case 'Submitted': return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="mr-1 h-3 w-3"/>Submitted</Badge>;
            case 'Reviewed': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3"/>Reviewed</Badge>; 
            case 'NeedsRevision': return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3"/>Needs Revision</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

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
                        // Disable dropdown if no active programs are available
                        disabled={myPrograms.filter(p => p.status === 'Active').length === 0 && !loading}
                    >
                        <SelectTrigger className="max-w-md">
                            <SelectValue placeholder="Select one of your active programs..." />
                        </SelectTrigger>
                        <SelectContent>
                            {myPrograms
                                .filter(p => p.status === 'Active') // Only show active programs for submission
                                .map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                            {myPrograms.filter(p => p.status === 'Active').length === 0 && (
                                <p className="text-sm text-muted-foreground p-2">No active programs available.</p>
                            )}
                        </SelectContent>
                    </Select>
                    {/* Provide a clear message if no active programs are found after loading */}
                    {!loading && myPrograms.filter(p => p.status === 'Active').length === 0 && (
                        <p className="text-sm text-red-500 mt-2">
                            You are not currently enrolled in any active programs. You cannot submit projects.
                        </p>
                    )}
                </CardContent>
            </Card>

            {loading ? (
                <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin"/></div>
            ) : (
                <div className="space-y-4">
                    {assignments.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardContent>
                                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-semibold">No Assignments Found</h3>
                                <p className="text-muted-foreground">
                                    No assignments available for the selected program, or the program is not active.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        assignments.map(asg => (
                            <Card key={asg._id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle>{asg.title}</CardTitle>
                                        {getStatusBadge(asg.status)}
                                    </div>
                                    <CardDescription>Due: {new Date(asg.dueDate).toLocaleDateString()}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        {asg.status === 'Reviewed' && asg.grade && <p className="font-bold text-lg text-green-600">Grade: {asg.grade}%</p>}
                                        {asg.status === 'Reviewed' && asg.feedback && <p className="text-sm text-muted-foreground">Feedback: {asg.feedback}</p>}
                                        {(asg.status === 'Pending' || asg.status === 'Submitted' || asg.status === 'NeedsRevision') && ( 
                                            <Input type="file" onChange={handleFileChange} className="max-w-[250px]"/>
                                        )}
                                    </div>
                                    {/* Enable submission button only if program is active AND assignment is in a submit-ready status */}
                                    {isSelectedProgramActive && (asg.status === 'Pending' || asg.status === 'Submitted' || asg.status === 'NeedsRevision') ? (
                                        <Button onClick={() => handleSubmission(asg._id, selectedProgramId)} disabled={isSubmitting || !submissionFile}>
                                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4"/>} 
                                            {asg.status === 'Submitted' || asg.status === 'NeedsRevision' ? 'Resubmit' : 'Submit Now'}
                                        </Button>
                                    ) : (
                                        <Button disabled={true} title={!isSelectedProgramActive ? "Program not active" : "Assignment already reviewed or submitted"}>
                                            <Upload className="mr-2 h-4 w-4"/> 
                                            Submit
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}