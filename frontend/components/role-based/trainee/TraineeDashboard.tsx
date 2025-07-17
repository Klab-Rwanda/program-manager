"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  BookOpen,
  Calendar,
  Clock,
  FileText,
  GraduationCap,
  TrendingUp,
  Award,
  Loader2,
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useRole } from "@/lib/contexts/RoleContext"
import api from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Program {
  _id: string
  name: string
  description: string
  status: string
  progress: number // This will be calculated or fetched
  startDate: string
  endDate: string
}

export function TraineeDashboard() {
  const { user } = useRole()
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyPrograms = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/programs'); // Backend filters this by user role
        // We'll add a mock progress to each program for UI purposes
        const programsWithProgress = response.data.data.map((p: Program) => ({
          ...p,
          progress: Math.floor(Math.random() * (90 - 40 + 1)) + 40, // Random progress between 40-90
        }));
        setPrograms(programsWithProgress);
      } catch (err) {
        setError("Failed to load your learning programs.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyPrograms();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-16">
        <Loader2 size={32} className="animate-spin" />
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

  const activePrograms = programs.filter(p => p.status === 'Active');
  const avgProgress = programs.length > 0
    ? Math.round(programs.reduce((sum, p) => sum + p.progress, 0) / programs.length)
    : 0;
  
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome, {user?.name}!</h2>
        <p className="text-blue-200 mb-4">
          Ready for today's learning? Let's continue making progress.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePrograms.length}</div>
            <p className="text-xs text-muted-foreground">Currently enrolled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgProgress}%</div>
            <p className="text-xs text-muted-foreground">Across all programs</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-2xl font-bold tracking-tight mb-4">My Learning Journey</h3>
        <div className="space-y-4">
          {programs.map(program => (
            <Card key={program._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{program.name}</CardTitle>
                  <Badge>{program.status}</Badge>
                </div>
                <CardDescription>{program.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{program.progress}%</span>
                    </div>
                    <Progress value={program.progress} />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4"/>
                        <span>{new Date(program.startDate).toLocaleDateString()} - {new Date(program.endDate).toLocaleDateString()}</span>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/dashboard/my-learning">Continue Learning</Link>
                    </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}