// app/dashboard/Trainee/my-progress/page.tsx
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { TrendingUp, Calendar, Target, Award, Clock, CheckCircle, AlertCircle, BarChart3, BookOpen, Users, Loader2, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { toast } from "sonner" // Import toast
import { Alert, AlertDescription } from "@/components/ui/alert" // For error display

import { useAuth } from "@/lib/contexts/RoleContext" // Import useAuth
import { getAllPrograms } from "@/lib/services/program.service" // Import service to fetch programs
import { Program as BackendProgram } from "@/types" // Import Program type from backend

// Frontend-specific ProgramProgress data (mostly mocked as backend doesn't provide granular trainee progress per program)
interface ProgramProgress {
  _id: string; // Backend _id
  name: string; // Backend name
  overallProgress: number; // Mocked
  attendanceRate: number; // Mocked
  assignmentsCompleted: number; // Mocked
  totalAssignments: number; // Mocked
  averageGrade: string; // Mocked
  timeSpent: number; // Mocked
  lastActivity: string; // Mocked
  nextMilestone: string; // Mocked
  daysToComplete: number; // Mocked or calculated
  status: 'Active' | 'Completed'; // Derived from backend program status
}

interface WeeklyActivity { // Mocked weekly activity data
  week: string
  hoursSpent: number
  assignmentsCompleted: number
  attendance: number
  grade?: string
}

export default function MyProgressPage() {
  const { user, role, loading: authLoading } = useAuth(); // Get user and role from context

  const [programsProgress, setProgramsProgress] = useState<ProgramProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mocked weekly activity data as backend doesn't provide this granularity
  const [weeklyActivity] = useState<WeeklyActivity[]>([
    { week: "Week 1", hoursSpent: 15, assignmentsCompleted: 2, attendance: 100, grade: "A" },
    { week: "Week 2", hoursSpent: 18, assignmentsCompleted: 3, attendance: 100, grade: "A-" },
    { week: "Week 3", hoursSpent: 12, assignmentsCompleted: 1, attendance: 80, grade: "B+" },
    { week: "Week 4", hoursSpent: 20, assignmentsCompleted: 2, attendance: 100, grade: "A" },
    { week: "Week 5", hoursSpent: 16, assignmentsCompleted: 2, attendance: 90, grade: "A-" },
    { week: "Week 6", hoursSpent: 14, assignmentsCompleted: 1, attendance: 85, grade: "B+" },
    { week: "Week 7", hoursSpent: 22, assignmentsCompleted: 3, attendance: 100, grade: "A" },
  ]);

  // Fetch programs for the current user (trainee) and mock progress data
  const fetchMyProgramsProgress = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const backendPrograms: BackendProgram[] = await getAllPrograms();

      const transformedPrograms: ProgramProgress[] = backendPrograms.map(p => {
        const today = new Date();
        const endDate = new Date(p.endDate);
        const startDate = new Date(p.startDate);
        const daysToComplete = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        return {
          _id: p._id,
          name: p.name,
          overallProgress: p.status === 'Completed' ? 100 : (40 + Math.floor(Math.random() * 60)), // Mock progress
          attendanceRate: p.status === 'Completed' ? 95 : (80 + Math.floor(Math.random() * 15)), // Mock attendance
          assignmentsCompleted: p.status === 'Completed' ? 12 : (Math.floor(Math.random() * 8) + 2), // Mock
          totalAssignments: 12, // Mock
          averageGrade: p.status === 'Completed' ? "A" : (Math.random() > 0.7 ? "A-" : "B+"), // Mock
          timeSpent: p.status === 'Completed' ? 90 : (Math.floor(Math.random() * 50) + 70), // Mock hours
          lastActivity: p.status === 'Completed' ? p.endDate.split('T')[0] : new Date().toISOString().split('T')[0], // Mock
          nextMilestone: p.status === 'Completed' ? "Completed" : "Final Project Submission", // Mock
          daysToComplete: daysToComplete > 0 ? daysToComplete : 0, // Calculate remaining days
          status: p.status as 'Active' | 'Completed' // Directly use backend status
        };
      });
      setProgramsProgress(transformedPrograms);

    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load your progress data.");
      toast.error(err.response?.data?.message || "Failed to load your progress data.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [role]); // Depend on role to trigger re-fetch if role changes

  useEffect(() => {
    if (!authLoading && role === 'trainee') {
      fetchMyProgramsProgress();
    }
  }, [authLoading, role, fetchMyProgramsProgress]);


  // UI Helpers
  const getGradeColor = (grade: string) => {
    if (grade.includes("A")) return "text-green-600"
    if (grade.includes("B")) return "text-blue-600"
    if (grade.includes("C")) return "text-yellow-600"
    return "text-red-600"
  }

  const getProgressColorClass = (progress: number) => {
    if (progress >= 80) return "bg-green-500"
    if (progress >= 60) return "bg-blue-500"
    if (progress >= 40) return "bg-yellow-500"
    return "bg-red-500"
  }

  // Calculate aggregate stats from the mocked progress data
  const totalHours = programsProgress.reduce((sum, p) => sum + p.timeSpent, 0)
  const averageProgress = programsProgress.length > 0 ? Math.round(programsProgress.reduce((sum, p) => sum + p.overallProgress, 0) / programsProgress.length) : 0;
  const averageAttendance = programsProgress.length > 0 ? Math.round(programsProgress.reduce((sum, p) => sum + p.attendanceRate, 0) / programsProgress.length) : 0;
  const totalAssignmentsCompleted = programsProgress.reduce((sum, p) => sum + p.assignmentsCompleted, 0)


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


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Progress</h1>
          <p className="text-muted-foreground">
            Track your learning progress and performance across all programs
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">{programsProgress.length} Programs</Badge>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
                {error}
                <Button type="button" variant="ghost" size="sm" onClick={() => setError(null)}><XCircle className="h-4 w-4" /></Button>
            </AlertDescription>
        </Alert>
      )}

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageProgress}%</div>
            <p className="text-xs text-muted-foreground">
              Across all programs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours}h</div>
            <p className="text-xs text-muted-foreground">
              Time spent learning
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageAttendance}%</div>
            <p className="text-xs text-muted-foreground">
              Average attendance
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignmentsCompleted}</div>
            <p className="text-xs text-muted-foreground">
              Completed assignments
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : programsProgress.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No progress data available</h3>
                <p className="text-muted-foreground text-center">
                  You are not currently enrolled in any programs or data is not yet available.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {programsProgress.map((program) => (
                <Card key={program._id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{program.name}</CardTitle>
                      <Badge variant={program.status === "Active" ? "default" : "secondary"}>
                        {program.status === "Active" ? "In Progress" : "Completed"}
                      </Badge>
                    </div>
                    <CardDescription>
                      {program.daysToComplete > 0 ? `${program.daysToComplete} days remaining` : "Program completed"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Overall Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Overall Progress</span>
                        <span className="text-sm font-bold">{program.overallProgress}%</span>
                      </div>
                      <Progress value={program.overallProgress} className={`h-2 ${getProgressColorClass(program.overallProgress)}`} />
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{program.attendanceRate}% attendance</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span>{program.assignmentsCompleted}/{program.totalAssignments} assignments</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <span className={getGradeColor(program.averageGrade)}>{program.averageGrade} average</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{program.timeSpent}h spent</span>
                      </div>
                    </div>

                    {/* Next Milestone */}
                    {program.daysToComplete > 0 && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm font-medium text-blue-900">Next Milestone</div>
                        <div className="text-xs text-blue-700">{program.nextMilestone}</div>
                        <div className="text-xs text-blue-600 mt-1">
                          Last activity: {new Date(program.lastActivity).toLocaleDateString()}
                        </div>
                      </div>
                    )}

                    {program.overallProgress === 100 && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-900">Program Completed!</span>
                        </div>
                        <div className="text-xs text-green-700 mt-1">
                          Congratulations on completing this program
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          {/* Weekly Activity Chart (Mocked) */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
              <CardDescription>Your learning activity over the past 7 weeks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyActivity.map((week, index) => (
                  <div key={week.week} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-medium">{week.week}</div>
                      <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{week.hoursSpent}h</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="h-4 w-4" />
                          <span>{week.assignmentsCompleted} assignments</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{week.attendance}% attendance</span>
                        </div>
                      </div>
                    </div>
                    {week.grade && (
                      <Badge className={getGradeColor(week.grade)}>
                        {week.grade}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Performance Analytics (Mocked) */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Your progress over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Best Week</span>
                    <span className="text-sm font-medium">Week 7 - 22 hours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Weekly Hours</span>
                    <span className="text-sm font-medium">16.7 hours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Consistency Score</span>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Insights</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Study Efficiency</span>
                    <span className="text-sm font-medium text-green-600">High</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Assignment Completion</span>
                    <span className="text-sm font-medium text-blue-600">On Track</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Attendance Consistency</span>
                    <span className="text-sm font-medium text-green-600">Excellent</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations (Mocked) */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Suggestions to improve your learning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-blue-900">Focus on Mobile Development</div>
                    <div className="text-xs text-blue-700">
                      Your Mobile App Development progress is at 45%. Consider spending more time on this program to catch up.
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-green-900">Excellent Attendance</div>
                    <div className="text-xs text-green-700">
                      Your 92% average attendance rate is outstanding. Keep up the great work!
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-yellow-900">Upcoming Deadlines</div>
                    <div className="text-xs text-yellow-700">
                      You have 2 projects due in the next 10 days. Plan your time accordingly.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}