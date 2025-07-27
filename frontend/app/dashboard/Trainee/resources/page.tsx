"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { FileText, Download, BookOpen, Loader2 } from "lucide-react";
import { getMyCourses } from "@/lib/services/course.service";
import { getAllPrograms } from "@/lib/services/program.service";
import { Course, Program } from "@/types";
import { useAuth } from "@/lib/contexts/RoleContext";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TraineeResourcesPage() {
    const { user, loading: authLoading } = useAuth();
    const [myPrograms, setMyPrograms] = useState<Program[]>([]);
    const [selectedProgramId, setSelectedProgramId] = useState<string>("");
    const [approvedCourses, setApprovedCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInitialData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            // The backend's getAllPrograms already filters to show only the trainee's enrolled programs
            const programsData = await getAllPrograms();
            setMyPrograms(programsData);
            if (programsData.length > 0 && !selectedProgramId) {
                setSelectedProgramId(programsData[0]._id);
            }
        } catch (err) {
            toast.error("Failed to load your enrolled programs.");
            setError("Could not load programs. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [user, selectedProgramId]);

    const fetchCoursesForProgram = useCallback(async () => {
        if (!selectedProgramId) {
            setApprovedCourses([]); // Clear courses if no program is selected
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // The getMyCourses endpoint for a trainee returns only approved courses for their programs.
            const allMyCourses = await getMyCourses();
            // Filter these courses by the selected program ID on the frontend.
            setApprovedCourses(allMyCourses.filter(course => course.program._id === selectedProgramId));
        } catch (err) {
            toast.error("Failed to load resources for this program.");
            setError("Could not load resources. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [selectedProgramId]);
    
    useEffect(() => {
        if (!authLoading) {
            fetchInitialData();
        }
    }, [authLoading, fetchInitialData]);

    useEffect(() => {
        fetchCoursesForProgram();
    }, [selectedProgramId, fetchCoursesForProgram]);

    if (authLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Learning Resources</h1>
                <p className="text-muted-foreground">Access all approved course materials for your programs.</p>
            </div>

            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

            <Card>
                <CardHeader>
                    <CardTitle>Select Your Program</CardTitle>
                    <CardDescription>Choose one of your enrolled programs to see its resources.</CardDescription>
                </CardHeader>
                <CardContent>
                    {myPrograms.length > 0 ? (
                        <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                            <SelectTrigger className="max-w-md">
                                <SelectValue placeholder="Select one of your programs..." />
                            </SelectTrigger>
                            <SelectContent>
                                {myPrograms.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    ) : (
                        <p className="text-sm text-muted-foreground">You are not currently enrolled in any programs.</p>
                    )}
                </CardContent>
            </Card>

            {loading ? (
                <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin"/></div>
            ) : approvedCourses.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold">No Resources Available</h3>
                        <p className="text-muted-foreground">There are no approved course materials for this program yet.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {approvedCourses.map(course => (
                        <Card key={course._id}>
                            <CardHeader>
                                <div className="flex items-start gap-4">
                                    <FileText className="h-8 w-8 text-primary flex-shrink-0 mt-1"/>
                                    <div>
                                        <CardTitle>{course.title}</CardTitle>
                                        <CardDescription>by {course.facilitator.name}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-3 h-14">{course.description}</p>
                                <Button className="w-full" asChild>
                                    {/* --- THIS IS THE FUNCTIONAL DOWNLOAD LINK --- */}
                                    <a 
                                      href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/${course.contentUrl.replace(/\\/g, '/')}`}
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      download
                                    >
                                        <Download className="mr-2 h-4 w-4"/>
                                        Download Material
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}