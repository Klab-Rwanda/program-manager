"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calendar, User, BookOpen, TrendingUp, CheckCircle, Play, Loader2, FolderOpen, AlertCircle } from "lucide-react";

import { useAuth } from "@/lib/contexts/RoleContext";
import { getAllPrograms } from "@/lib/services/program.service";
import { Program as BackendProgram } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// This interface combines backend data with frontend-specific mock data
interface Program extends BackendProgram {
  progress: number;
  completedSessions: number;
  totalSessions: number;
  nextSession: string;
}

export default function MyLearningPage() {
    const router = useRouter();
    const { user, role, loading: authLoading } = useAuth();

    const [programs, setPrograms] = useState<Program[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMyPrograms = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const backendPrograms: BackendProgram[] = await getAllPrograms();

            const transformedPrograms: Program[] = backendPrograms.map(p => ({
                ...p,
                status: new Date(p.endDate) < new Date() ? 'Completed' : 'Active',
                progress: new Date(p.endDate) < new Date() ? 100 : Math.floor(40 + Math.random() * 60),
                completedSessions: Math.floor(Math.random() * 20),
                totalSessions: 25,
                nextSession: `Tomorrow, ${Math.floor(9 + Math.random() * 5)}:00 AM`,
            }));
            setPrograms(transformedPrograms);

        } catch (err: any) {
            const message = err.response?.data?.message || "Failed to load your learning programs.";
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading && role === 'trainee') {
            fetchMyPrograms();
        }
    }, [authLoading, role, fetchMyPrograms]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Active": return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
            case "Completed": return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    if (authLoading || isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Learning</h1>
                    <p className="text-muted-foreground">Your central hub for all enrolled programs.</p>
                </div>
                <Badge variant="secondary">{programs.length} Enrolled Programs</Badge>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            
            {/* Quick Navigation Section */}
            <Card>
                <CardHeader>
                    <CardTitle>My Dashboard</CardTitle>
                    <CardDescription>Quick links to your learning tools and progress.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                    <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => router.push('/dashboard/my-progress')}>
                        <TrendingUp className="h-6 w-6" />
                        <span>Track My Progress</span>
                    </Button>
                     <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => router.push('/dashboard/resources')}>
                        <FolderOpen className="h-6 w-6" />
                        <span>View Resources</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => router.push('/dashboard/Trainee/trattendance')}>
                        <Calendar className="h-6 w-6" />
                        <span>My Attendance History</span>
                    </Button>
                </CardContent>
            </Card>

            {/* Enrolled Programs Grid */}
            {programs.length === 0 && !isLoading ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold">No Programs Assigned</h3>
                        <p className="text-muted-foreground">You are not currently enrolled in any programs.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {programs.map((program) => (
                    <Card key={program._id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{program.name}</CardTitle>
                                {getStatusBadge(program.status)}
                            </div>
                            <CardDescription className="line-clamp-2 h-10">{program.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-grow">
                            <div className="flex items-center space-x-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>Facilitator: {program.facilitators?.[0]?.name || 'N/A'}</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span>Progress</span>
                                    <span className="font-bold">{program.progress}%</span>
                                </div>
                                <Progress value={program.progress} className="h-2" />
                            </div>
                            {program.status === "Active" && (
                                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                                <Play className="h-4 w-4 text-blue-600" />
                                <div>
                                    <div className="text-sm font-medium text-blue-900">Next Session</div>
                                    <div className="text-xs text-blue-700">{program.nextSession}</div>
                                </div>
                                </div>
                            )}
                        </CardContent>
                        <div className="p-4 pt-0 mt-auto">
                           <Button variant="outline" size="sm" className="w-full">
                                <BookOpen className="h-4 w-4 mr-2" />
                                Continue Learning
                            </Button>
                        </div>
                    </Card>
                    ))}
                </div>
            )}
        </div>
    );
}