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
import { Progress } from "@/components/ui/progress"

// Import your services
import { getAllPrograms } from "@/lib/services/program.service"
import { getMyAttendanceHistory, getTraineeSessions, ClassSession } from "@/lib/services/attendance.service" // Import getTraineeSessions and ClassSession
import { getAssignmentsForCourse } from "@/lib/services/assignment.service" // Import function to get assignments for a course
import api from "@/lib/api" // For generic API calls
import { Program, AttendanceRecord, Assignment } from "@/types" // Ensure Assignment is imported

// Extended Program interface - Removed 'progress'
interface DashboardProgram extends Program {
  nextSession?: string; // Next session string
  attendanceRate?: number; // Calculated attendance rate for the program
}

interface DashboardStats {
  enrolledPrograms: number;
  overallProgress: number; // Based on average attendance rate
  nextSession: string; // The specific next session time/title
  pendingTasks: number; // Count of pending assignments + upcoming sessions
}

interface UpcomingTask {
  id: string;
  title: string;
  dueDate: string; // Will be a string for display
  program: string; // Program name
  status: 'Pending' | 'In Progress' | 'Completed'; // Simplified status for tasks
  type: 'assignment' | 'session'; // Task type
}

export function TraineeDashboard() {
  const [myPrograms, setMyPrograms] = useState<DashboardProgram[]>([])
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [upcomingClassSessions, setUpcomingClassSessions] = useState<ClassSession[]>([]); // To store actual upcoming sessions

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    enrolledPrograms: 0,
    overallProgress: 0, 
    nextSession: "No upcoming sessions",
    pendingTasks: 0
  })
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([])

  // Helper: Calculate attendance rate for a program
  const calculateAttendanceRate = (programId: string, attendanceRecords: AttendanceRecord[]): number => {
    const programAttendance = attendanceRecords.filter(record => {
      const recordProgramId = typeof record.programId === 'object' && record.programId !== null 
        ? record.programId._id.toString() 
        : record.programId?.toString(); 
      return recordProgramId === programId;
    });
    
    const presentOrLateCount = programAttendance.filter(record => 
      record.status === 'Present' || record.status === 'Late'
    ).length;

    // This rate is based on sessions with a record. For 'total expected sessions', 
    // you'd need to count ClassSessions for that program.
    // For simplicity here, if no records, assume 100% (no sessions yet for this student)
    if (programAttendance.length === 0) {
        return 100; // Or a more appropriate default if no data, e.g., N/A
    }
    
    return Math.round((presentOrLateCount / programAttendance.length) * 100);
  }

  // Helper: Calculate overall progress (simple average of program attendance rates)
  const calculateOverallProgress = (programs: DashboardProgram[]): number => {
      if (programs.length === 0) return 0;
      const totalAttendanceRates = programs.reduce((sum, p) => sum + (p.attendanceRate || 0), 0);
      return Math.round(totalAttendanceRates / programs.length);
  }

  // Helper: Generate Upcoming Tasks from Assignments and Sessions
  const generateUpcomingTasksList = (
    allPrograms: Program[], 
    allAssignments: Assignment[], 
    upcomingSessions: ClassSession[]
  ): UpcomingTask[] => {
    const tasks: UpcomingTask[] = [];

    // Add assignment tasks
    allAssignments.forEach(assignment => {
      const dueDate = new Date(assignment.dueDate);
      const now = new Date();
      // Only include pending assignments not yet due
      if (assignment.status === 'Pending' && dueDate >= now) { 
        const program = allPrograms.find(p => p._id === (typeof assignment.program === 'object' ? assignment.program._id : assignment.program));
        tasks.push({
          id: assignment._id,
          title: assignment.title,
          dueDate: dueDate.toLocaleDateString(),
          program: program?.name || 'Unknown Program',
          status: 'Pending',
          type: 'assignment'
        });
      }
    });

    // Add upcoming session tasks (only 'scheduled' or 'active' for now)
    upcomingSessions.forEach(session => {
        const sessionDate = new Date(session.startTime);
        const now = new Date();
        // Only include sessions starting in the future or currently active
        if (sessionDate >= now && session.status !== 'completed' && session.status !== 'cancelled') {
            const program = allPrograms.find(p => p._id === (typeof session.programId === 'object' ? session.programId._id : session.programId));
            tasks.push({
                id: session._id,
                title: session.title,
                dueDate: sessionDate.toLocaleDateString() + ' ' + sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                program: program?.name || 'Unknown Program',
                status: session.status === 'active' ? 'In Progress' : 'Pending', // Mark active as In Progress
                type: 'session'
            });
        }
    });

    // Sort tasks by due date (earliest first)
    tasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return tasks.slice(0, 5); // Limit to top 5
  }

  // Helper: Find the very next upcoming session
  const findNextUpcomingSession = (sessions: ClassSession[]): string => {
    const now = new Date();
    const sortedUpcoming = sessions.filter(s => new Date(s.startTime) > now && s.status === 'scheduled')
                                   .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    if (sortedUpcoming.length > 0) {
      const nextSession = sortedUpcoming[0];
      const sessionDate = new Date(nextSession.startTime);
      // Format as "Day, Month Date at Time AM/PM"
      return sessionDate.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    return "No upcoming sessions";
  }


  // Main data fetching effect
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all necessary data in parallel
        const [programsData, attendanceData, traineeSessionsData] = await Promise.all([
          getAllPrograms(), 
          getMyAttendanceHistory(), 
          getTraineeSessions() // Fetch all trainee sessions (upcoming, active, completed)
        ]);

        // Process Programs Data
        const activePrograms = programsData.filter(p => p.status === 'Active');
        const enhancedPrograms: DashboardProgram[] = activePrograms.map(program => {
          const attendanceRate = calculateAttendanceRate(program._id, attendanceData);
          return {
            ...program,
            attendanceRate,
            // Note: 'nextSession' for individual programs is harder without more specific backend support.
            // Keeping it simple for now, can be improved.
            nextSession: 'TBD' 
          };
        });
        setMyPrograms(enhancedPrograms);
        setAttendanceHistory(attendanceData); // Store full history
        setUpcomingClassSessions(traineeSessionsData); // Store all trainee sessions

        // Fetch Assignments for all active programs
        let allAssignments: Assignment[] = [];
        for (const program of activePrograms) {
            // Your getAssignmentsForCourse requires a courseId. 
            // A simpler approach for trainee dashboard is if backend has /assignments/my-available
            // Or if assignments are linked directly to programs.
            // For now, let's assume we can fetch all assignments available to the trainee.
            // NOTE: The provided getAssignmentsForCourse needs courseId, not programId.
            // If you don't have `/assignments/my-available` for trainee, this needs adjustment.
            // For this example, let's mock it for now if no direct endpoint.
            try {
                // If you have `getMyAvailableAssignments` for trainee:
                // const availableAssignments = await getMyAvailableAssignments(); 
                // allAssignments = [...allAssignments, ...availableAssignments];
                
                // Temporary: fetch from first course in each program (if available)
                // This is a workaround; ideally a single endpoint would give all.
                // Or you could iterate through courses in each program to fetch.
                // For simplicity, I'll use a dummy call or mock if needed.
                // (Assuming `assignments/program/:programId` gives all for a program)
                const programAssignments = await api.get(`/assignments/program/${program._id}`);
                allAssignments = [...allAssignments, ...programAssignments.data.data];

            } catch (assignError) {
                console.warn(`Failed to fetch assignments for program ${program.name}. Using empty array.`, assignError);
            }
        }
        setAssignments(allAssignments);

        // Calculate Dashboard Stats
        const overallProgressValue = calculateOverallProgress(enhancedPrograms);
        const nextSessionValue = findNextUpcomingSession(traineeSessionsData);
        const tasksList = generateUpcomingTasksList(programsData, allAssignments, traineeSessionsData);
        const pendingTasksCount = tasksList.filter(t => t.status === 'Pending').length;

        setUpcomingTasks(tasksList);
        setStats({
          enrolledPrograms: enhancedPrograms.length,
          overallProgress: overallProgressValue,
          nextSession: nextSessionValue,
          pendingTasks: pendingTasksCount
        });

      } catch (err: any) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err.response?.data?.message || "Could not load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []); // Empty dependency array as effects handle their own data.

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
      value: stats.nextSession.includes("No upcoming sessions") ? "N/A" : stats.nextSession.split(' ')[0] + ' ' + stats.nextSession.split(' ')[1] + ' ' + stats.nextSession.split(' ')[2], // Extract date part if available
      change: stats.nextSession.includes("No upcoming sessions") ? "" : stats.nextSession.split(' ')[3] + ' ' + stats.nextSession.split(' ')[4] , // Extract time part if available
      icon: Calendar,
      color: "text-custom-blue",
      bgColor: "bg-custom-blue/10",
    },
    {
      title: "Pending Tasks",
      value: stats.pendingTasks.toString(),
      change: "Assignments & Sessions",
      icon: FileText,
      color: "text-custom-blue",
      bgColor: "bg-custom-blue/10",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-lg bg-gradient-to-r from-[#1f497d] to-[#30588f] p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Welcome back!</h2>
        <p className="text-gray-300 mb-4">
          Continue your learning journey. You have {stats.enrolledPrograms} active program{stats.enrolledPrograms !== 1 ? 's' : ''}.
        </p>
        <div className="flex gap-3">
          <Link href="/dashboard/Trainee/my-learning"> {/* Link to My Learning page */}
            <Button size="lg" className="bg-white text-[#1f497d] hover:bg-gray-100">
              <BookOpen className="mr-2 h-4 w-4" />
              Continue Learning
            </Button>
          </Link>
          <Link href="/dashboard/Trainee/submit-project"> {/* Link to Submit Project page */}
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[#1f497d] bg-transparent">
              <FileText className="mr-2 h-4 w-4" />
              Submit Assignment
            </Button>
          </Link>
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
            <CardDescription>Your enrolled programs and their current status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {myPrograms.length > 0 ? (
              myPrograms.map((program) => (
                <div key={program._id} className="p-4 rounded-lg border border-border bg-background shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <Link 
                        href={`/dashboard/Trainee/my-learning`} // Link to a program details page or general learning path
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
                  
                  <div className="flex gap-2">
                    <Link href="/dashboard/Trainee/my-learning" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <BookOpen className="h-4 w-4 mr-1" />
                        Go to Program
                      </Button>
                    </Link>
                    <Link href="/dashboard/Trainee/submit-project" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <FileText className="h-4 w-4 mr-1" />
                        Submit Project
                      </Button>
                    </Link>
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
            <Link href="/dashboard/Trainee/my-learning" className="flex-1">
              <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent w-full">
                <BookOpen className="h-6 w-6" />
                Continue Learning
              </Button>
            </Link>
            <Link href="/dashboard/Trainee/submit-project" className="flex-1">
              <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent w-full">
                <FileText className="h-6 w-6" />
                Submit Assignment
              </Button>
            </Link>
            <Link href="/dashboard/Trainee/resources" className="flex-1">
              <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent w-full">
                <FolderOpen className="h-6 w-6" />
                View Resources
              </Button>
            </Link>
            <Link href="/dashboard/Trainee/my-progress" className="flex-1">
              <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent w-full">
                <CheckCircle className="h-6 w-6" />
                Track Progress
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}