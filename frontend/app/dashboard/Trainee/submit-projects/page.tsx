"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Upload, FileText, CheckCircle, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createSubmission, getMySubmissions } from "@/lib/services/submission.service";
import { getMyAvailableAssignments } from "@/lib/services/assignment.service"; // The new service
import { Assignment, Submission } from "@/types";
import { Badge } from "@/components/ui/badge";

export default function SubmitProjectsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | undefined>();
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchTraineeData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch both assignments and past submissions in parallel
            const [assignmentsData, submissionsData] = await Promise.all([
                getMyAvailableAssignments(),
                getMySubmissions()
            ]);
            
            setAssignments(assignmentsData);
            setMySubmissions(submissionsData);

        } catch (err) {
            toast.error("Failed to load project assignments.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTraineeData() }, [fetchTraineeData]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setFile(e.target.files[0]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const selectedAssignment = assignments.find(a => a._id === selectedAssignmentId);

        if (!selectedAssignment || !file) {
            return toast.error("Please select an assignment and a file to submit.");
        }
        setIsSubmitting(true);
        try {
            const programId = typeof selectedAssignment.program === 'string' ? selectedAssignment.program : selectedAssignment.program._id;
            const courseId = typeof selectedAssignment.course === 'string' ? selectedAssignment.course : selectedAssignment.course._id;

            await createSubmission(courseId, programId, file);
            toast.success("Project submitted successfully!");
            fetchTraineeData(); // Refresh list to update status
            setSelectedAssignmentId(undefined);
            setFile(null);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Submission failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const submittedAssignmentIds = useMemo(() => new Set(mySubmissions.map(s => s.assignment)), [mySubmissions]);
    const pendingAssignments = useMemo(() => assignments.filter(a => !submittedAssignmentIds.has(a._id)), [assignments, submittedAssignmentIds]);

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin"/></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Project Submissions</h1>
                <p className="text-muted-foreground">Upload your project files for review.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>New Submission</CardTitle>
                    <CardDescription>Select a pending project and upload your file.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Project Assignment</Label>
                            <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId} disabled={isSubmitting}>
                                <SelectTrigger><SelectValue placeholder="Select a pending assignment..." /></SelectTrigger>
                                <SelectContent>
                                    {pendingAssignments.length > 0 ? (
                                        pendingAssignments.map(a => (
                                            <SelectItem key={a._id} value={a._id}>{a.title}</SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-sm text-muted-foreground">No pending assignments.</div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2"><Label>Project File</Label><Input type="file" onChange={handleFileChange} disabled={isSubmitting} /></div>
                        <Button type="submit" disabled={isSubmitting || !selectedAssignmentId || !file}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                            Submit Project
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Submission History</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {assignments.map(assignment => {
                            const isSubmitted = submittedAssignmentIds.has(assignment._id);
                            const status = isSubmitted ? "Submitted" : "Pending";
                            return (
                                <div key={assignment._id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <h4 className="font-semibold">{assignment.title}</h4>
                                        <p className="text-sm text-muted-foreground">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                                    </div>
                                    <Badge variant={isSubmitted ? 'default' : 'secondary'} className={isSubmitted ? 'bg-green-100 text-green-800' : ''}>
                                        {isSubmitted ? <CheckCircle className="mr-2 h-4 w-4"/> : <Clock className="mr-2 h-4 w-4" />}
                                        {status}
                                    </Badge>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}