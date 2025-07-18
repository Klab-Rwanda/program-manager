"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { BookOpen, Users, TrendingUp, Calendar, Plus, Eye, Edit, Loader2, ExternalLink } from "lucide-react";
import api from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// --- Type Definitions ---
interface Program {
  _id: string;
  name: string;
  status: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  trainees: any[]; // Use any[] for length check
  progress?: number;
}

interface PmStats {
    activePrograms: number;
    totalTrainees: number;
    avgProgress: number;
    pendingCourses: number;
}

export function ProgramManagerDashboard() {
    const [stats, setStats] = useState<PmStats | null>(null);
    const [myPrograms, setMyPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsRes, programsRes] = await Promise.all([
                api.get('/dashboard/pm/stats'),
                api.get('/programs')
            ]);
            setStats(statsRes.data.data);
            setMyPrograms(programsRes.data.data);
        } catch (err) {
            setError("Failed to load dashboard data. Please refresh the page.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return <div className="flex justify-center items-center p-16"><Loader2 size={32} className="animate-spin" /></div>;
    }

    if (error) {
        return <div className="p-8 text-destructive bg-destructive/10 rounded-lg">{error}</div>;
    }

    const statCards = [
        { title: "Active Programs", value: stats?.activePrograms, icon: BookOpen, change: "+2 from last month" },
        { title: "Total Trainees", value: stats?.totalTrainees, icon: Users, change: "+18 this quarter" },
        { title: "Average Progress", value: `${stats?.avgProgress || 0}%`, icon: TrendingUp, change: "+5% from last week" },
        { title: "Pending Courses", value: stats?.pendingCourses, icon: Calendar, change: "Require approval" },
    ];
    
    const getStatusColor = (status: string) => {
        switch (status) {
            case "Active": return "bg-[#1f497d] text-white";
            case "PendingApproval": return "bg-yellow-500 text-white";
            case "Draft": return "bg-gray-500 text-white";
            case "Completed": return "bg-green-500 text-white";
            default: return "bg-muted text-muted-foreground";
        }
    };

    return (
        <div className="space-y-6">
            <div className="rounded-lg bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">Welcome back, Program Manager!</h2>
                <p className="text-gray-300 mb-4">Manage your programs and track their performance.</p>
                <div className="flex gap-3">
                    <Button asChild size="lg" className="bg-white text-black hover:bg-gray-100"><Link href="/dashboard/programs"><Plus className="mr-2 h-4 w-4" />Create New Program</Link></Button>
                    <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black bg-transparent"><Link href="/dashboard/trainees"><Users className="mr-2 h-4 w-4" />Assign Trainees</Link></Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, index) => (
                    <Card key={index} className="border border-border bg-card hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-card-foreground">{stat.title}</CardTitle><div className="p-2 rounded-lg bg-muted/30"><stat.icon className="h-4 w-4 text-[#1f497d]" /></div></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-card-foreground">{stat.value}</div><p className="text-xs text-muted-foreground">{stat.change}</p></CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border border-border bg-card">
                <CardHeader>
                    <CardTitle className="text-card-foreground">My Managed Programs</CardTitle>
                    <CardDescription>This is a list of programs you are currently managing.</CardDescription>
                </CardHeader>
                <CardContent>
                    {myPrograms.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {myPrograms.map((program) => (
                                <div key={program._id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/50">
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center justify-between">
                                            <Link href={`/dashboard/programs/${program._id}`} className="font-medium text-card-foreground hover:text-[#1f497d] transition-colors flex items-center gap-2">{program.name}<ExternalLink className="h-3 w-3" /></Link>
                                            <Badge className={cn("text-xs", getStatusColor(program.status))}>{program.status}</Badge>
                                        </div>
                                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                            <span className="flex items-center"><Users className="mr-1 h-3 w-3" />{program.trainees.length} trainees</span>
                                            {program.startDate && <span className="flex items-center"><Calendar className="mr-1 h-3 w-3" />{new Date(program.startDate).toLocaleDateString()}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 ml-4">
                                        <Button asChild variant="ghost" size="sm"><Link href={`/dashboard/programs/${program._id}`}><Eye className="h-4 w-4" /></Link></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8"><BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">You are not managing any programs yet. <Link href="/dashboard/programs" className="text-[#1f497d] hover:underline">Create one now</Link>.</p></div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}