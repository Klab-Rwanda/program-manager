"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Camera, Clock, Users, FileCheck, TrendingUp, Calendar, Upload, Award, FileText, BarChart3, MessageSquare } from "lucide-react" // Added MessageSquare for submissions
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  getFacilitatorDashboardStats, 
  getFacilitatorSessions, 
  getRecentActivity, // Import getRecentActivity
  FacilitatorSession,
  FacilitatorStats, // Import FacilitatorStats interface
  RecentActivity // Import RecentActivity interface
} from "@/lib/services/dashboard.service"
import Link from "next/link"

function isToday(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function formatTimeRange(start: string, end?: string) {
  const startDate = new Date(start)
  const endDate = end ? new Date(end) : null
  const startStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const endStr = endDate ? endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null
  return endStr ? `${startStr} - ${endStr}` : startStr
}

export function FacilitatorDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<FacilitatorStats | null>(null) // Use FacilitatorStats interface
  const [sessions, setSessions] = useState<FacilitatorSession[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]) // Use RecentActivity interface
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getFacilitatorDashboardStats(),
      getFacilitatorSessions(),
      getRecentActivity() // Fetch recent activities for facilitator
    ])
      .then(([statsData, sessionsData, recentActivityData]) => {
        setStats(statsData)
        setSessions(sessionsData)
        setRecentActivities(recentActivityData) // Set recent activities
        setError(null)
      })
      .catch((err) => {
        setError("Failed to load dashboard data")
        console.error("Facilitator Dashboard fetch error:", err);
      })
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    {
      title: "Assigned Programs",
      value: stats ? stats.assignedPrograms : "-",
      description: "Active programs",
      icon: BookOpen,
      trend: "", 
    },
    {
      title: "Total Students",
      value: stats ? stats.totalStudents : "-",
      description: "Across assigned programs",
      icon: Users,
      trend: "",
    },
    {
      title: "Total Courses",
      value: stats ? stats.totalCourses : "-",
      description: `${stats?.approvedCourses} approved`,
      icon: FileText, // Changed icon
      trend: "",
    },
    {
      title: "Pending Reviews",
      value: stats ? stats.pendingReviews : "-",
      description: "Assignment submissions",
      icon: MessageSquare, // Changed icon
      trend: "", 
    },
  ];

  // Filter sessions for today
  const todaysSessions = sessions.filter(s => isToday(s.startTime));
  // Sort by start time ascending
  todaysSessions.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Helper for recent activity icons
  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'roadmap_submitted': return <Calendar className="h-4 w-4" />;
      case 'assignment_completed': return <Award className="h-4 w-4" />;
      case 'assignment_created': return <FileText className="h-4 w-4" />;
      case 'session_activity': return <Clock className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'roadmap_submitted': return 'bg-yellow-500';
      case 'assignment_completed': return 'bg-green-500';
      case 'assignment_created': return 'bg-blue-500';
      case 'session_activity': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-muted-foreground">Loading dashboard...</span>
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-red-500">{error}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-lg bg-gradient-to-r from-[#1f497d] to-[#30588f] p-6 text-white shadow-lg"> {/* Changed from gray-900/800 to custom-blue/80 */}
        <h2 className="text-2xl font-bold mb-2">Welcome back!</h2>
        <p className="text-gray-100 mb-4">Ready to start today's classes? You have {stats ? stats.todaysSessions : "-"} sessions scheduled.</p>
        <Button size="lg" className="bg-white text-[#1f497d] hover:bg-gray-100" onClick={() => router.push("/dashboard/Facilitator/Fac-attendance") }>
          <Camera className="mr-2 h-4 w-4" />
          Start Class & Mark Attendance
        </Button>
      </div>
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              <p
                className={`text-xs mt-1 ${stat.trend.startsWith("+") ? "text-custom-blue" : "text-muted-foreground"}`}
              >
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Today's Schedule */}
        <Card className="col-span-4 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Today's Schedule</CardTitle>
            <CardDescription>Your upcoming classes and activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {todaysSessions.length === 0 && (
              <div className="text-muted-foreground">No sessions scheduled for today.</div>
            )}
            {todaysSessions.map((session) => (
              <div key={session._id} className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#1f497d]"></div> {/* Changed from website-primary to custom-blue */}
                  <div>
                    <p className="font-medium text-foreground">{session.title}</p>
                    <p className="text-sm text-muted-foreground">{session.programId?.name || "Unknown Program"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">{new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p> {/* Display only start time here */}
                  <Badge variant={session.status === "active" ? "default" : "secondary"}
                    className={session.status === "active" ? "bg-[#1f497d] text-white" : ""}> {/* Changed bg/text for active badge */}
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        {/* Recent Activity */}
        <Card className="col-span-3 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
            <CardDescription>Latest updates from your programs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.length === 0 && (
              <div className="text-muted-foreground">No recent activity.</div>
            )}
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div
                  className={`h-2 w-2 rounded-full mt-2 ${getActivityColor(activity.type)}`} // Use activity type for dot color
                ></div>
                <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                        {getActivityIcon(activity.type)} {activity.title}
                    </p>
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleString()}</p> {/* Format timestamp */}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      {/* Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Quick Actions</CardTitle>
          <CardDescription>Frequently used features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/Facilitator/courses" className="flex-1"> {/* Corrected link */}
              <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent w-full">
                <Upload className="h-6 w-6" />
                Upload Resources
              </Button>
            </Link>
            <Link href="/dashboard/Facilitator/fac-reviews" className="flex-1">
              <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent w-full">
                <FileCheck className="h-6 w-6" />
                Review Projects
              </Button>
            </Link>
            <Link href="/dashboard/Facilitator/fac-programs" className="flex-1"> {/* Corrected link */}
              <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent w-full">
                <Users className="h-6 w-6" />
                View Trainees
              </Button>
            </Link>
            <Link href="/dashboard/Facilitator/Fac-attendance" className="flex-1">
              <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent w-full">
                <Clock className="h-6 w-6" />
                Attendance Logs
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}