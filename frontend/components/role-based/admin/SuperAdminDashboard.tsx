"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  BookOpen,
  Users,
  UserCheck,
  Clock,
  Loader2,
  AlertCircle,
  BarChart3,
  FileText,
  ArrowRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import api from "@/lib/api";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface AdminOverviewStats {
    totalPrograms: number;
    activePrograms: number;
    pendingPrograms: number;
    totalTrainees: number;
    totalFacilitators: number;
    pendingCourses: number;
    recentLogs: any[];
    programsEndingSoon: any[];
}

// A new, more visually appealing stat card component
const StatCard = ({ title, value, icon: Icon, description }: { title: string; value: string | number; icon: React.ElementType; description: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

export function SuperAdminDashboard() {
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard/admin-overview');
      setStats(response.data.data);
    } catch (err: any) {
      const message = err.response?.data?.message || "Could not load dashboard data.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  if (loading) return <div className="flex justify-center items-center h-full p-16"><Loader2 size={32} className="animate-spin text-primary" /></div>;
  if (error) return <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
  if (!stats) return <div className="text-center p-8">No statistics available.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
          <Link href="/dashboard/SuperAdmin/user-management">
             <Button className="bg-[#1f497d] hover:bg-[#1a3f6b]">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
            </Button>
          </Link>
      </div>
      
      {/* Key Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Programs" value={stats.totalPrograms} description={`${stats.activePrograms} are active`} icon={BookOpen} />
          <StatCard title="Active Trainees" value={stats.totalTrainees} description="Across all programs" icon={Users} />
          <StatCard title="Active Facilitators" value={stats.totalFacilitators} description="Across all programs" icon={UserCheck} />
          <StatCard title="Pending Approvals" value={stats.pendingPrograms + stats.pendingCourses} description={`${stats.pendingPrograms} Programs, ${stats.pendingCourses} Courses`} icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Column: Recent Activity & Programs */}
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Recent System Activity</CardTitle>
                    <CardDescription>A log of the last 5 significant events in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead className="text-right">Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.recentLogs.map((log: any) => (
                                <TableRow key={log._id}>
                                    <TableCell>
                                        <div className="font-medium">{log.user?.name || 'System'}</div>
                                        <div className="text-xs text-muted-foreground">{log.user?.role}</div>
                                    </TableCell>
                                    <TableCell className="text-sm">{log.details}</TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">
                                        {new Date(log.createdAt).toLocaleTimeString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

        {/* Sidebar Column: Action Items & Links */}
        <div className="lg:col-span-1 space-y-6">
            <Card className="bg-yellow-50 border-yellow-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-800">
                        <AlertCircle />
                        Action Required
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Link href="/dashboard/SuperAdmin/program-approval" className="block p-3 rounded-md hover:bg-yellow-100">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold">{stats.pendingPrograms} Programs</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground"/>
                        </div>
                        <p className="text-xs text-muted-foreground">Need your approval</p>
                    </Link>
                     <Link href="/dashboard/Manager/approvals" className="block p-3 rounded-md hover:bg-yellow-100">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold">{stats.pendingCourses} Courses</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground"/>
                        </div>
                        <p className="text-xs text-muted-foreground">Need your approval</p>
                    </Link>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Quick Links</CardTitle></CardHeader>
                <CardContent className="flex flex-col gap-2">
                    <Link href="/dashboard/SuperAdmin/program-approval"><Button variant="ghost" className="w-full justify-start"><BookOpen className="mr-2 h-4 w-4"/> All Programs</Button></Link>
                    <Link href="/dashboard/SuperAdmin/reports-export"><Button variant="ghost" className="w-full justify-start"><BarChart3 className="mr-2 h-4 w-4"/> Generate Reports</Button></Link>
                    <Link href="/dashboard/SuperAdmin/master-log"><Button variant="ghost" className="w-full justify-start"><FileText className="mr-2 h-4 w-4"/> View Master Log</Button></Link>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}