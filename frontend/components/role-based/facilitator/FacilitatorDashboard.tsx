"use client"

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
    BookOpen, 
    Calendar, 
    FileCheck, 
    TrendingUp, 
    Upload, 
    Users,
    Loader2,
    AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { useAuth } from "@/lib/contexts/RoleContext";

// --- Type Definitions ---
interface FacilitatorDashboardStats {
    assignedProgramsCount: number;
    todaysSessionsCount: number;
    pendingReviewsCount: number;
    weeklyAttendanceRate: number;
}

interface UpcomingSession {
    _id: string;
    programName: string;
    sessionTitle: string;
    startTime: string;
    endTime: string;
    location: string;
    status: 'Upcoming' | 'In Progress';
}

interface RecentActivity {
    _id: string;
    action: string;
    details: string;
    timestamp: string;
}

interface FacilitatorDashboardData {
    stats: FacilitatorDashboardStats;
    upcomingSessions: UpcomingSession[];
    recentActivities: RecentActivity[];
}

// --- Helper Functions ---
const formatTime = (isoDate: string) => new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 3600;
    if (interval > 24) return `${Math.floor(interval/24)} days ago`;
    if (interval > 1) return `${Math.floor(interval)} hours ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} minutes ago`;
    return `${Math.floor(seconds)} seconds ago`;
};

// --- Main Dashboard Component ---
export function FacilitatorDashboard() {
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState<FacilitatorDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/dashboard/facilitator');
            setDashboardData(response.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to load dashboard data. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center p-16">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    if (error || !dashboardData) {
        return (
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle /> Error
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{error || "No dashboard data could be loaded."}</p>
                    <Button onClick={fetchDashboardData} variant="outline" className="mt-4">Try Again</Button>
                </CardContent>
            </Card>
        );
    }
    
    const { stats, upcomingSessions, recentActivities } = dashboardData;

    const statsCards = [
        { title: "Assigned Programs", value: stats.assignedProgramsCount, icon: BookOpen, trend: "+2 this month" },
        { title: "Today's Sessions", value: stats.todaysSessionsCount, icon: Calendar, trend: `Next at ${upcomingSessions.length > 0 ? formatTime(upcomingSessions[0].startTime) : 'N/A'}` },
        { title: "Pending Reviews", value: stats.pendingReviewsCount, icon: FileCheck, trend: "3 urgent" },
        { title: "Attendance Rate", value: `${stats.weeklyAttendanceRate}%`, icon: TrendingUp, trend: "+5% from last week" },
    ];

    return (
        <div className="space-y-6">
            <div className="rounded-lg bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name || 'Facilitator'}!</h2>
                <p className="text-gray-300 mb-4">You have {stats.todaysSessionsCount} sessions scheduled for today. Ready to start?</p>
                <Button asChild size="lg" className="bg-white text-black hover:bg-gray-100">
                    <Link href="/facilitator/attendance"><Calendar className="mr-2 h-4 w-4" /> Start Today's Session</Link>
                </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsCards.map((stat, index) => (
                    <Card key={index} className="bg-card border-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                            <div className="p-2 rounded-lg bg-muted/30">
                                <stat.icon className="h-4 w-4 text-custom-blue" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">Today's Schedule</CardTitle>
                        <CardDescription>Your upcoming classes and activities.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {upcomingSessions.length > 0 ? upcomingSessions.map(session => (
                             <div key={session._id} className="flex items-center justify-between p-4 rounded-lg bg-muted">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-website-primary"></div>
                                    <div>
                                        <p className="font-medium text-foreground">{session.sessionTitle}</p>
                                        <p className="text-sm text-muted-foreground">{session.programName} • {session.location}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-foreground">{formatTime(session.startTime)} - {formatTime(session.endTime)}</p>
                                    <Badge variant="secondary">{session.status}</Badge>
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center py-8">No sessions scheduled for today.</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-3 bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">Recent Activity</CardTitle>
                        <CardDescription>Latest updates from your programs.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {recentActivities.map((activity) => (
                            <div key={activity._id} className="flex items-start gap-3">
                                <div className={`h-2 w-2 rounded-full mt-2 ${activity.action === 'SUBMISSION_RECEIVED' ? 'bg-website-secondary' : 'bg-website-primary'}`}></div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium text-foreground">{activity.details}</p>
                                    <p className="text-xs text-muted-foreground">{timeAgo(activity.timestamp)}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
            
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Quick Actions</CardTitle>
                    <CardDescription>Frequently used features.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Button asChild variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                            <Link href="/facilitator/curriculum"><Upload className="h-6 w-6" /> Upload Resources</Link>
                        </Button>
                        <Button asChild variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                            <Link href="/facilitator/reviews"><FileCheck className="h-6 w-6" /> Review Projects</Link>
                        </Button>
                        <Button asChild variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                            <Link href="/dashboard/trainees"><Users className="h-6 w-6" /> View Trainees</Link>
                        </Button>
                        <Button asChild variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                            <Link href="/facilitator/attendance"><Calendar className="h-6 w-6" /> Attendance</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}