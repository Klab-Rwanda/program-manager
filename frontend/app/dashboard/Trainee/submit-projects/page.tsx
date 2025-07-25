"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { FileText, Upload, Clock, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/contexts/RoleContext";
import api from "@/lib/api"; // For direct calls
import { Program, Course } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Simplified Assignment type for this page
interface Assignment {
    _id: string;
    title: string;
    dueDate: string;
    status: 'Pending' | 'Submitted' | 'Graded';
    grade?: number;
}

// Service function for assignments
const getAssignments = async (programId: string): Promise<Assignment[]> => {
    const response = await api.get(`/assignments/program/${programId}`);
    return response.data.data;
};

export default function SubmitProjectsPage() {
    const { user } = useAuth();
    const [myPrograms, setMyPrograms] = useState<Program[]>([]);
    const [selectedProgramId, setSelectedProgramId] = useState<string>("");
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const programsData = await api.get('/programs').then(res => res.data.data);
            setMyPrograms(programsData);
            if (programsData.length > 0 && !selectedProgramId) {
                setSelectedProgramId(programsData[0]._id);
            }
        } catch (err) {
            toast.error("Failed to load your programs.");
        } finally {
            setLoading(false);
        }
    }, [user, selectedProgramId]);

    const fetchAssignments = useCallback(async () => {
        if (!selectedProgramId) return;
        setLoading(true);
        try {
            const assignmentData = await getAssignments(selectedProgramId);
            setAssignments(assignmentData);
        } catch (err) {
            toast.error("Failed to load assignments for this program.");
        } finally {
            setLoading(false);
        }
    }, [selectedProgramId]);
    
    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { fetchAssignments(); }, [fetchAssignments]);
    
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pending': return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3"/>Pending</Badge>;
            case 'Submitted': return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="mr-1 h-3 w-3"/>Submitted</Badge>;
            case 'Graded': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3"/>Graded</Badge>;
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
                </CardHeader>
                <CardContent>
                    <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                        <SelectTrigger className="max-w-md">
                            <SelectValue placeholder="Select a program to view assignments..." />
                        </SelectTrigger>
                        <SelectContent>
                            {myPrograms.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {loading ? (
                <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin"/></div>
            ) : assignments.length === 0 ? (
                 <Card className="text-center py-12"><CardContent><p>No assignments found for this program.</p></CardContent></Card>
            ) : (
                <div className="space-y-4">
                    {assignments.map(asg => (
                        <Card key={asg._id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle>{asg.title}</CardTitle>
                                    {getStatusBadge(asg.status)}
                                </div>
                                <CardDescription>Due: {new Date(asg.dueDate).toLocaleDateString()}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-between items-center">
                                {asg.grade && <p className="font-bold text-lg text-green-600">Grade: {asg.grade}%</p>}
                                {asg.status === 'Pending' && <Button><Upload className="mr-2 h-4 w-4"/>Submit Now</Button>}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}