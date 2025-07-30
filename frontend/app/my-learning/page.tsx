// app/dashboard/my-learning/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Calendar, Clock, User, BookOpen, TrendingUp, CheckCircle, Play, Loader2, AlertCircle, XCircle, BarChart3, Target, FileText } from "lucide-react" // Added Loader2, AlertCircle, XCircle
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { toast } from "sonner" // Import toast
import { Alert, AlertDescription } from "@/components/ui/alert" // For error display

import { useAuth } from "@/lib/contexts/RoleContext" // Import useAuth
import { getAllPrograms } from "@/lib/services/program.service" // Import service to fetch programs
import { Program as BackendProgram } from "@/types" // Import Program type from backend

// Frontend-specific Program interface for display (includes mocked fields)
interface Program {
  _id: string; // Backend _id
  name: string; // Backend name
  description: string; // Backend description
  startDate: string; // Backend startDate
  endDate: string; // Backend endDate
  status: 'active' | 'completed' | 'upcoming' | 'paused'; // Derived or mocked
  progress: number; // Mocked
  totalModules: number; // Mocked
  completedModules: number; // Mocked
  instructor: string; // Mocked, as backend Program doesn't directly link to a single instructor
  nextSession: string; // Mocked
  materials: Array<{ // Mocked
    id: number;
    title: string;
    type: string;
    duration: string;
    completed: boolean;
  }>;
}

interface LearningStats { // Mocked statistics
  totalHours: number
  completedProjects: number
  totalProjects: number
  averageScore: number
  streakDays: number
  certificates: number
}

export default function MyLearningPage() {
  const { user, role, loading: authLoading } = useAuth(); // Get user and role from context

  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Loading state for API calls
  const [error, setError] = useState<string | null>(null); // Error state for API calls

  // Mocked learning stats as backend doesn't provide these aggregates yet
  const [learningStats] = useState<LearningStats>({
    totalHours: 120, completedProjects: 8, totalProjects: 12, averageScore: 87, streakDays: 15, certificates: 2,
  })

  // Fetch programs for the current user (trainee)
  const fetchMyPrograms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // getAllPrograms already filters by role on the backend if the user is a Trainee
      const backendPrograms: BackendProgram[] = await getAllPrograms();

      // Transform backend programs into frontend display format, adding mock data
      const transformedPrograms: Program[] = backendPrograms.map(p => ({
        _id: p._id,
        name: p.name,
        description: p.description,
        startDate: p.startDate.split('T')[0], // Format date
        endDate: p.endDate.split('T')[0],     // Format date
        // Determine status based on dates for a more dynamic feel
        status: new Date(p.endDate) < new Date() ? 'completed' : 'active',
        // Mocked data for display purposes
        progress: p.status === 'Completed' ? 100 : (40 + Math.floor(Math.random() * 60)), // Random progress if active
        totalModules: 10,
        completedModules: Math.floor(Math.random() * 8) + 2, // At least 2 completed
        instructor: 'Mock Facilitator', // Replace with actual facilitator if populated in Program model
        nextSession: p.status === 'Completed' ? 'N/A' : (Math.random() > 0.5 ? 'Today, 2:00 PM' : 'Tomorrow, 10:00 AM'),
        materials: [ // Example mock materials
          { id: 1, title: 'Introduction to Topics', type: 'video', duration: '45 min', completed: true },
          { id: 2, title: 'Core Concepts Lecture', type: 'document', duration: '60 min', completed: true },
          { id: 3, title: 'Advanced Module', type: 'video', duration: '90 min', completed: Math.random() > 0.5 },
        ],
      }));
      setPrograms(transformedPrograms);

    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load your learning programs.");
      toast.error(err.response?.data?.message || "Failed to load your learning programs.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [role]); // Depend on role to refetch if role changes

  useEffect(() => {
    if (!authLoading && role === 'trainee') { 
      fetchMyPrograms();
    }
  }, [authLoading, role, fetchMyPrograms]);

  // UI Helpers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Active</Badge>
      case "completed": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
      case "upcoming": return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Upcoming</Badge>
      case "paused": return <Badge variant="secondary">Paused</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const getProgressColorClass = (progress: number) => {
    if (progress >= 80) return "bg-green-500"
    if (progress >= 60) return "bg-blue-500"
    if (progress >= 40) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case "video": return <Play className="h-4 w-4" />
      case "document": return <FileText className="h-4 w-4" />
      case "project": return <Target className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  // Render nothing or a loading spinner if authentication is still loading
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Access control: Only trainees should see this page
  if (!user || role !== 'trainee') {
    return (
        <Card>
            <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">You do not have permission to view this page.</p></CardContent>
        </Card>
    );
  }

  // Display content after loading and if role is correct
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Learning</h1>
          <p className="text-muted-foreground">
            Track your progress across all enrolled programs
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">{programs.length} Programs</Badge>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
                {error}
                <Button variant="ghost" size="sm" onClick={() => setError(null)}><XCircle className="h-4 w-4" /></Button>
            </AlertDescription>
        </Alert>
      )}

      {/* Learning Stats (Mocked) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learningStats.totalHours}h</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12h</span> this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learningStats.completedProjects}/{learningStats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2</span> this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learningStats.averageScore}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5%</span> improvement
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learningStats.streakDays} days</div>
            <p className="text-xs text-muted-foreground">
              Keep it up!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Programs Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : programs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No programs assigned</h3>
            <p className="text-muted-foreground text-center">
              You are not currently enrolled in any programs.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <Card key={program._id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{program.name}</CardTitle>
                  {getStatusBadge(program.status)}
                </div>
                <CardDescription>{program.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Instructor Info (Mocked) */}
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{program.instructor}</span>
                </div>

                {/* Date Range */}
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(program.startDate).toLocaleDateString()} - {new Date(program.endDate).toLocaleDateString()}
                  </span>
                </div>

                {/* Progress Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm font-bold">{program.progress}%</span>
                  </div>
                  <Progress value={program.progress} className={`h-2 ${getProgressColorClass(program.progress)}`} />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{program.completedModules} of {program.totalModules} modules</span>
                    <span>{Math.round((program.completedModules || 0) / (program.totalModules || 1) * 100)}% complete</span>
                  </div>
                </div>

                {/* Next Session (Mocked) */}
                {program.status === "active" && program.nextSession && (
                  <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                    <Play className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="text-sm font-medium text-blue-900">Next Session</div>
                      <div className="text-xs text-blue-700">{program.nextSession}</div>
                    </div>
                  </div>
                )}

                {/* Learning Materials (Mocked) */}
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground mb-3">Learning Materials</h4>
                  <div className="space-y-2">
                    {program.materials.map((material) => (
                      <div
                        key={material.id}
                        className={`flex items-center justify-between p-3 border rounded-lg ${
                          material.completed ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {material.completed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            getMaterialIcon(material.type)
                          )}
                          <div>
                            <p className={`text-sm font-medium ${material.completed ? "text-green-800" : ""}`}>
                              {material.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {material.type} • {material.duration}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          {material.completed ? "Review" : "Start"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
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
      )}

      {/* Quick Actions (Mocked) */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Access your learning resources and tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <BookOpen className="h-6 w-6" />
              <span className="text-sm">Continue Learning</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Calendar className="h-6 w-6" />
              <span className="text-sm">View Schedule</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">Track Progress</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <User className="h-6 w-6" />
              <span className="text-sm">Contact Facilitator</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}