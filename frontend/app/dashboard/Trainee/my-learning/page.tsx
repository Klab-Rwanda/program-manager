"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, User, BookOpen, TrendingUp, CheckCircle, Play, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useAuth } from "@/lib/contexts/RoleContext";
import { getAllPrograms } from "@/lib/services/program.service";
import { Program as BackendProgram } from "@/types";

interface Program extends BackendProgram {
  progress: number;
  completedSessions: number;
  totalSessions: number;
  nextSession: string;
}

export default function MyLearningPage() {
  const { user, role, loading: authLoading } = useAuth();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyPrograms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // The backend's getAllPrograms automatically filters for the logged-in trainee
      const backendPrograms: BackendProgram[] = await getAllPrograms();

      // Transform backend data and add mock data for fields not yet in backend
      const transformedPrograms: Program[] = backendPrograms.map(p => ({
        ...p,
        status: new Date(p.endDate) < new Date() ? 'Completed' : 'Active',
        progress: new Date(p.endDate) < new Date() ? 100 : Math.floor(50 + Math.random() * 40), // Mock progress
        completedSessions: Math.floor(Math.random() * 20), // Mock data
        totalSessions: 25, // Mock data
        nextSession: `Tomorrow, ${Math.floor(9 + Math.random() * 5)}:00 AM`, // Mock data
      }));
      setPrograms(transformedPrograms);

    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to load your enrolled programs.";
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
      case "Active":
        return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
      case "Completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
          <p className="text-muted-foreground">Track your progress across all enrolled programs</p>
        </div>
        <Badge variant="secondary">{programs.length} Active Programs</Badge>
      </div>

      {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

      {!error && programs.length === 0 && (
          <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Programs Assigned</h3>
                  <p className="text-muted-foreground text-center">You are not currently enrolled in any programs.</p>
              </CardContent>
          </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => (
          <Card key={program._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{program.name}</CardTitle>
                {getStatusBadge(program.status)}
              </div>
              <CardDescription>{program.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{program.programManager?.name || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {new Date(program.startDate).toLocaleDateString()} - {new Date(program.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm font-bold">{program.progress}%</span>
                </div>
                <Progress value={program.progress} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {program.completedSessions} of {program.totalSessions} sessions completed
                </div>
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
              <div className="flex space-x-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Continue
                </Button>
                <Button variant="outline" size="sm">
                  <TrendingUp className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}