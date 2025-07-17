"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Clock, 
  Plus,
  Eye,
  Loader2,
  AlertTriangle
} from "lucide-react"

import api from "@/lib/api"
import { useRole } from "@/lib/contexts/RoleContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Type for the stats fetched from the PM-specific endpoint
interface ProgramManagerStats {
  activePrograms: number;
  totalTrainees: number;
  avgProgress: number;
  pendingCourses: number;
}

// Type for the programs list
interface Program {
  _id: string;
  name: string;
  status: string;
  trainees: any[]; // We only need the length for this view
  progress?: number;
}

export function ProgramManagerDashboard() {
  const { user } = useRole();
  const router = useRouter();
  const [stats, setStats] = useState<ProgramManagerStats | null>(null);
  const [recentPrograms, setRecentPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch both stats and programs in parallel for better performance
      const [statsRes, programsRes] = await Promise.all([
        api.get('/dashboard/pm/stats'),
        api.get('/programs')
      ]);
      setStats(statsRes.data.data);
      // Let's add mock progress to programs for UI visuals as backend doesn't provide it
      const programsWithProgress = programsRes.data.data.map((p: Program) => ({
          ...p,
          progress: Math.floor(Math.random() * (90 - 40 + 1)) + 40
      }));
      setRecentPrograms(programsWithProgress.slice(0, 4)); // Show the 4 most recent
    } catch (err) {
      setError("Could not load your dashboard data. Please ensure you are assigned to a program.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-16">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase().replace(/ /g, '')) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'endingsoon': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };
  
  const statCards = [
    {
      title: "Active Programs",
      value: stats?.activePrograms.toString() || "0",
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Total Trainees",
      value: stats?.totalTrainees.toString() || "0",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Average Progress",
      value: `${stats?.avgProgress || 0}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "Pending Courses",
      value: stats?.pendingCourses.toString() || "0",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white border-0">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome back, {user?.name}!</CardTitle>
          <CardDescription className="text-gray-300">Here's a snapshot of the programs you manage.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button size="lg" className="bg-white text-black hover:bg-gray-200" asChild>
                <Link href="/dashboard/programs">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Manage All Programs
                </Link>
            </Button>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>My Programs Overview</CardTitle>
          <CardDescription>A summary of your most active programs. Click on a program to see full details.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trainees</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPrograms.length > 0 ? recentPrograms.map(program => (
                <TableRow key={program._id}>
                  <TableCell className="font-medium">{program.name}</TableCell>
                  <TableCell><Badge className={getStatusClass(program.status)}>{program.status}</Badge></TableCell>
                  <TableCell>{program.trainees.length}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={program.progress} className="w-24" />
                      <span className="text-sm text-muted-foreground">{program.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/programs/${program._id}`)}>
                        <Eye className="h-4 w-4 mr-2"/> View
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                 <TableRow>
                    <TableCell colSpan={5} className="text-center p-8 text-muted-foreground">
                        You are not currently managing any programs.
                    </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}