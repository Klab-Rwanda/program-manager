"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calendar, User, BookOpen, TrendingUp, CheckCircle, Play, Loader2, FolderOpen, AlertCircle, Award, Clock } from "lucide-react"; 

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Import your services and types
import { getAllPrograms } from "@/lib/services/program.service";
import { getMyAttendanceHistory, getTraineeSessions, ClassSession } from "@/lib/services/attendance.service";
import { Program as BackendProgram, AttendanceRecord } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAuth } from "@/lib/contexts/RoleContext";
import Link from "next/link";

// Extended Program interface
interface DashboardProgram extends BackendProgram {
  attendanceRate?: number; // Calculated attendance rate for the program
  nextSession?: string; // The specific next session time/title for this program
}

export default function MyLearningPage() {
    const router = useRouter();
    const { user, role, loading: authLoading } = useAuth();

    const [programs, setPrograms] = useState<DashboardProgram[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("active");

    const fetchMyPrograms = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Fetch all programs the trainee is associated with (active/completed)
            const programsData: BackendProgram[] = await getAllPrograms();

            // 2. Fetch all trainee attendance history (contains programId and sessionId)
            const attendanceHistoryData: AttendanceRecord[] = await getMyAttendanceHistory();

            // 3. Fetch all trainee's sessions (active, scheduled, completed) for attendance rate calculation and next session
            const allTraineeSessions: ClassSession[] = await getTraineeSessions();

            // Prepare a map of sessions by programId for easy lookup
            const sessionsByProgram = new Map<string, ClassSession[]>();
            allTraineeSessions.forEach(session => {
                const pId = typeof session.programId === 'object' ? session.programId._id : session.programId;
                if (pId) {
                    if (!sessionsByProgram.has(pId)) {
                        sessionsByProgram.set(pId, []);
                    }
                    sessionsByProgram.get(pId)?.push(session);
                }
            });

            // Process and enhance programs data
            const enhancedPrograms: DashboardProgram[] = programsData.map(program => {
                const programSessions = sessionsByProgram.get(program._id) || [];
                const programAttendanceRecords = attendanceHistoryData.filter(rec => 
                    (typeof rec.programId === 'object' ? rec.programId._id : rec.programId) === program._id
                );

                // Calculate attendance rate for this program
                const totalPossibleSessions = programSessions.filter(s => s.status === 'active' || s.status === 'completed').length;
                let attendanceRate = 0;
                if (totalPossibleSessions > 0) {
                    const presentOrLateCount = programAttendanceRecords.filter(rec => rec.status === 'Present' || rec.status === 'Late').length;
                    attendanceRate = Math.round((presentOrLateCount / totalPossibleSessions) * 100);
                } else {
                    // If no sessions held yet for this program, or no completed/active sessions exist, consider attendance 100% (or N/A)
                    attendanceRate = 100; 
                }

                // Determine next session for this program
                let nextSessionString = "N/A";
                const now = new Date();
                const upcomingSessionsForProgram = programSessions
                    .filter(s => new Date(s.startTime) > now && s.status === 'scheduled') // Only scheduled sessions in the future
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
                
                if (upcomingSessionsForProgram.length > 0) {
                    const nextSession = upcomingSessionsForProgram[0];
                    nextSessionString = new Date(nextSession.startTime).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' });
                }

                return {
                    ...program,
                    attendanceRate,
                    nextSession: nextSessionString,
                };
            });
            setPrograms(enhancedPrograms);

        } catch (err: any) {
            const message = err.response?.data?.message || "Failed to load your learning programs.";
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    }, [user]); 

    useEffect(() => {
        if (!authLoading && role === 'trainee') {
            fetchMyPrograms();
        }
    }, [authLoading, role, fetchMyPrograms]);

    // Memoized lists for active and completed programs
    const activePrograms = useMemo(() => 
        programs.filter(p => p.status === 'Active'), 
        [programs]
    );
    const completedPrograms = useMemo(() => 
        programs.filter(p => p.status === 'Completed'), 
        [programs]
    );

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
                    <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => router.push('/dashboard/Trainee/my-progress')}>
                        <TrendingUp className="h-6 w-6" />
                        <span>Track My Progress</span>
                    </Button>
                     <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => router.push('/dashboard/Trainee/resources')}>
                        <FolderOpen className="h-6 w-6" />
                        <span>View Resources</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => router.push('/dashboard/Trainee/Trattendance')}>
                        <Calendar className="h-6 w-6" />
                        <span>My Attendance History</span>
                    </Button>
                </CardContent>
            </Card>

            {/* Enrolled Programs Grid */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="active">Active Programs ({activePrograms.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed Programs ({completedPrograms.length})</TabsTrigger>
                </TabsList>

                {/* Active Programs Tab Content */}
                <TabsContent value="active" className="mt-4">
                    {activePrograms.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardContent>
                                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-semibold">No Active Programs</h3>
                                <p className="text-muted-foreground">You are not currently enrolled in any active programs.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {activePrograms.map((program) => (
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
                                    <div className="flex items-center space-x-2 text-sm">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span>Attendance: {program.attendanceRate || 0}%</span>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                                        <Play className="h-4 w-4 text-blue-600" />
                                        <div>
                                            <div className="text-sm font-medium text-blue-900">Next Session</div>
                                            <div className="text-xs text-blue-700">{program.nextSession || "N/A"}</div>
                                        </div>
                                    </div>
                                </CardContent>
                                <div className="p-4 pt-0 mt-auto">
                                   <Link href="/dashboard/Trainee/my-learning"> {/* This link would ideally go to a program-specific learning page */}
                                       <Button variant="outline" size="sm" className="w-full">
                                            <BookOpen className="h-4 w-4 mr-2" />
                                            Continue Learning
                                        </Button>
                                   </Link>
                                </div>
                            </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Completed Programs Tab Content */}
                <TabsContent value="completed" className="mt-4">
                    {completedPrograms.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardContent>
                                <Award className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-semibold">No Completed Programs</h3>
                                <p className="text-muted-foreground">You have not completed any programs yet.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {completedPrograms.map((program) => (
                            <Card key={program._id} className="flex flex-col opacity-70"> {/* Visual cue for disabled */}
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
                                    <div className="flex items-center space-x-2 text-sm">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span>Attendance: {program.attendanceRate || 0}%</span>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                                        <Award className="h-4 w-4 text-green-600" />
                                        <div>
                                            <div className="text-sm font-medium text-green-900">Program Completed</div>
                                            <div className="text-xs text-green-700">On {new Date(program.endDate).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                </CardContent>
                                <div className="p-4 pt-0 mt-auto">
                                   <Link href="/dashboard/Trainee/my-learning"> {/* This link would ideally go to a program-specific learning page */}
                                       <Button variant="outline" size="sm" className="w-full" disabled title="View only">
                                            <BookOpen className="h-4 w-4 mr-2" />
                                            View Program Details
                                        </Button>
                                   </Link>
                                </div>
                            </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}