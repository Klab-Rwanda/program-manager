"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { 
  GraduationCap, 
  BookOpen, 
  TrendingUp, 
  Calendar, 
  FileText,
  FolderOpen,
  Clock,
  CheckCircle,
  Loader2,
  ExternalLink,
  CheckSquare,
  User, // Added User icon for facilitator
  Award // Added Award icon for attendance/progress if needed
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress" // Keep Progress for other dashboard stats, remove from Learning Path card

// Import your services
import { getAllPrograms } from "@/lib/services/program.service"
import { getMyAttendanceHistory } from "@/lib/services/attendance.service"
import api from "@/lib/api" // For assignments call
import { Program, AttendanceRecord, Submission, Assignment } from "@/types"

// Extended Program interface - Removed 'progress'
interface DashboardProgram extends Program {
  nextSession?: string
  attendanceRate?: number
}

interface DashboardStats {
  enrolledPrograms: number
  overallProgress: number // This will still exist in overall stats, but not per program card
  nextSession: string
  pendingTasks: number
}

interface UpcomingTask {
  id: string
  title: string
  dueDate: string
  program: string
  status: 'Pending' | 'In Progress' | 'Completed'
  type: 'assignment' | 'session'
}

export function TraineeDashboard() {
  const [myPrograms, setMyPrograms] = useState<DashboardProgram[]>([])
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    enrolledPrograms: 0,
    overallProgress: 0, 
    nextSession: "No upcoming sessions",
    pendingTasks: 0
  })
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([])

  // Calculate attendance rate for a program
  const calculateAttendanceRate = (programId: string, attendanceRecords: AttendanceRecord[]): number => {
    // Filter records for the specific program.
    // Note: The `AttendanceRecord` from `getMyAttendanceHistory` now has `programId` populated, 
    // so `record.programId._id` is safe if it's an object.
    const programAttendance = attendanceRecords.filter(record => {
      // Ensure record.programId is an object before accessing _id
      const recordProgramId = typeof record.programId === 'object' && record.programId !== null 
        ? record.programId._id.toString() 
        : record.programId?.toString(); // Fallback for string ID or undefined
      return recordProgramId === programId;
    });
    
    // Count 'Present' or 'Late' records.
    const presentOrLateCount = programAttendance.filter(record => 
      record.status === 'Present' || record.status === 'Late'
    ).length;

    // The total sessions in the `programAttendance` array represent only the sessions the student has a record for.
    // To get a truly accurate attendance rate (present/total_expected_sessions), you'd need the total number of sessions
    // held for that program. This would require fetching all `ClassSession`s for the program, which is more complex
    // to integrate into this specific `calculateAttendanceRate` function without a performance hit or a dedicated backend endpoint.
    // For now, this `attendanceRate` reflects `(attended_sessions / sessions_with_a_record) * 100`.
    
    if (programAttendance.length === 0) {
        // If there are no attendance records for this program, assume 100% (no sessions yet, or student just enrolled)
        return 100;
    }
    
    return Math.round((presentOrLateCount / programAttendance.length) * 100);
  }

  // calculateProgress function is now not used for per-program progress.
  // It only exists for the overall dashboard stats 'overallProgress'.
  const calculateOverallProgress = (avgAttendanceRate: number): number => {
      // This is still a proxy calculation.
      return Math.min(avgAttendanceRate, 100);
  }


  // Generate upcoming tasks from assignments and sessions
  const generateUpcomingTasks = (programs: Program[], assignments: Assignment[]): UpcomingTask[] => {
    const tasks: UpcomingTask[] = []

    // Add assignment-based tasks
    assignments.forEach(assignment => {
      // Check if assignment is still pending (due date hasn't passed)
      const dueDate = new Date(assignment.dueDate)
      const today = new Date()
      const isPending = dueDate >= today
      
      if (isPending) {
        // Find the program for this assignment
        const programId = typeof assignment.program === 'object' ? assignment.program._id : assignment.program
        const program = programs.find(p => p._id === programId)
        
        tasks.push({
          id: assignment._id,
          title: assignment.title,
          dueDate: dueDate.toLocaleDateString(),
          program: program?.name || 'Unknown Program',
          status: 'Pending',
          type: 'assignment'
        })
      }
    })

    // Add session tasks for active programs
    programs.filter(p => p.status === 'Active').forEach(program => {
      tasks.push({
        id: `session-${program._id}`,
        title: 'Attend Next Session',
        dueDate: 'Today', // This is still a generic placeholder for "next session"
        program: program.name,
        status: 'Pending',
        type: 'session'
      })
    })

    return tasks.slice(0, 5) // Limit to 5 most recent tasks
  }

  // Find next session for overall dashboard stat
  const findNextSession = (programs: DashboardProgram[]): string => {
    const activePrograms = programs.filter(p => p.status === 'Active')
    if (activePrograms.length === 0) return "No upcoming sessions"
    
    // This is still a generic placeholder. To get a real "next session", 
    // you'd need to fetch upcoming ClassSessions sorted by date.
    return "Today, 2:00 PM"
  }

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch programs and attendance in parallel
        const [programsData, attendanceData] = await Promise.all([
          getAllPrograms(), // Fetches programs where trainee is enrolled
          getMyAttendanceHistory().catch(() => []), // Fetches trainee's attendance records
        ])

        // Fetch assignments for active programs
        let assignmentsData: Assignment[] = []
        try {
          const assignmentPromises = programsData
            .filter(p => p.status === 'Active')
            .map(program => 
              api.get(`/assignments/program/${program._id}`)
                .then(res => res.data.data)
                .catch(() => [])
            )
          
          const assignmentArrays = await Promise.all(assignmentPromises)
          assignmentsData = assignmentArrays.flat()
        } catch (error) {
          console.error("Failed to fetch assignments:", error)
        }

        // Filter active programs and calculate attendanceRate for each
        const activePrograms = programsData.filter(p => p.status === 'Active')
        const enhancedPrograms: DashboardProgram[] = activePrograms.map(program => {
          const attendanceRate = calculateAttendanceRate(program._id, attendanceData)
          return {
            ...program,
            // progress is REMOVED from this per-program card
            attendanceRate,
            nextSession: "Next session info" // This is still a mock for now
          }
        })

        // Calculate overall dashboard stats
        const totalProgramAttendanceRates = enhancedPrograms.reduce((sum, p) => sum + (p.attendanceRate || 0), 0);
        const averageAttendanceRateAcrossPrograms = enhancedPrograms.length > 0 
            ? Math.round(totalProgramAttendanceRates / enhancedPrograms.length) 
            : 0;

        const tasks = generateUpcomingTasks(programsData, assignmentsData)
        const pendingTasksCount = tasks.filter(t => t.status === 'Pending').length

        setMyPrograms(enhancedPrograms)
        setAttendanceHistory(attendanceData)
        setAssignments(assignmentsData)
        setUpcomingTasks(tasks)
        setStats({
          enrolledPrograms: enhancedPrograms.length,
          overallProgress: calculateOverallProgress(averageAttendanceRateAcrossPrograms), // Overall progress based on overall attendance
          nextSession: findNextSession(enhancedPrograms),
          pendingTasks: pendingTasksCount
        })

      } catch (error) {
        console.error("Failed to fetch dashboard data", error)
        setError("Could not load dashboard data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center p-16">
        <Loader2 size={32} className="animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-red-600 bg-red-50 rounded-lg">
        {error}
      </div>
    )
  }

  const dashboardStats = [
    {
      title: "Enrolled Programs",
      value: stats.enrolledPrograms.toString(),
      change: "Active courses",
      icon: BookOpen,
      color: "text-custom-blue",
      bgColor: "bg-custom-blue/10",
    },
    {
      title: "Overall Progress",
      value: `${stats.overallProgress}%`, // This is the overall progress based on average attendance
      change: "Based on attendance",
      icon: TrendingUp,
      color: "text-custom-blue",
      bgColor: "bg-custom-blue/10",
    },
    {
      title: "Next Session",
      value: stats.nextSession.includes("Today") ? "Today" : "Upcoming",
      change: stats.nextSession,
      icon: Calendar,
      color: "text-custom-blue",
      bgColor: "bg-custom-blue/10",
    },
    {
      title: "Pending Tasks",
      value: stats.pendingTasks.toString(),
      change: "Due this week",
      icon: FileText,
      color: "text-custom-blue",
      bgColor: "bg-custom-blue/10",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-lg bg-gradient-to-r from-[#1f497d] to-[#1f497d]/80 p-6 text-white"> {/* Changed from gray-900/800 to custom-blue/80 */}
        <h2 className="text-2xl font-bold mb-2">Welcome back!</h2>
        <p className="text-gray-300 mb-4">
          Continue your learning journey. You have {stats.enrolledPrograms} active program{stats.enrolledPrograms !== 1 ? 's' : ''}.
        </p>
        <div className="flex gap-3">
          <Button size="lg" className="bg-white text-[#1f497d] hover:bg-gray-100"> {/* Changed text-black to text-[#1f497d] */}
            <BookOpen className="mr-2 h-4 w-4" />
            Continue Learning
          </Button>
          <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[#1f497d] bg-transparent"> {/* Changed hover:text-black to hover:text-[#1f497d] */}
            <FileText className="mr-2 h-4 w-4" />
            Submit Assignment
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat, index) => (
          <Card key={index} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* My Learning Path */}
        <Card className="col-span-4 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">My Learning Path</CardTitle>
            <CardDescription>Your enrolled courses and progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {myPrograms.length > 0 ? (
              myPrograms.map((program) => (
                <div key={program._id} className="p-4 rounded-lg border border-border bg-background shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <Link 
                        href={`/program-management/${program._id}`} 
                        className="font-semibold text-lg text-foreground hover:text-[#1f497d] transition-colors flex items-center gap-2" 
                      >
                        {program.name}
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-2">{program.description}</p>
                    </div>
                    <Badge 
                      variant={program.status === "Active" ? "default" : "secondary"}
                      className={program.status === "Active" ? "bg-[#1f497d] text-white" : ""} 
                    >
                      {program.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Facilitator: {program.facilitators?.[0]?.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Attendance: {program.attendanceRate || 0}%</span>
                    </div>
                  </div>

                  {/* Removed Progress bar and its associated data points */}
                  {/*
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Overall Progress</span>
                      <span className="font-bold text-foreground">{program.progress}%</span>
                    </div>
                    <Progress 
                      value={program.progress} 
                      className="h-2 [&>*]:bg-[#1f497d] dark:[&>*]:bg-[#1f497d]" 
                    />
                  </div>
                  */}
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <BookOpen className="h-4 w-4 mr-1" />
                      Continue Learning
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <FileText className="h-4 w-4 mr-1" />
                      Submit Assignment
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Welcome!</h3>
                <p className="text-muted-foreground">
                  You are not currently enrolled in any active programs. Please contact your Program Manager if you believe this is an error.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="col-span-3 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Upcoming Tasks</CardTitle>
            <CardDescription>Assignments and deadlines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task) => (
                <div key={task.id} className="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-foreground">{task.title}</p>
                    <Badge 
                      variant={
                        task.status === "Completed" ? "default" : 
                        task.status === "In Progress" ? "secondary" : "outline"
                      }
                      className={
                        task.status === "Completed" ? "bg-[#1f497d] text-white" : 
                        task.status === "In Progress" ? "bg-muted/30 text-muted-foreground" : "text-xs"
                      }
                    >
                      {task.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#1f497d] font-medium">{task.program}</p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    Due: {task.dueDate}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming tasks</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Quick Actions</CardTitle>
          <CardDescription>Access your learning resources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <BookOpen className="h-6 w-6" />
              Continue Learning
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <FileText className="h-6 w-6" />
              Submit Assignment
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <FolderOpen className="h-6 w-6" />
              View Resources
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <CheckCircle className="h-6 w-6" />
              Track Progress
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}