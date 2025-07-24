"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Camera, Clock, Users, FileCheck, TrendingUp, Calendar, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getFacilitatorDashboardStats, getFacilitatorSessions, FacilitatorSession } from "@/lib/services/dashboard.service"

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
  const [stats, setStats] = useState<any>(null)
  const [sessions, setSessions] = useState<FacilitatorSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getFacilitatorDashboardStats(),
      getFacilitatorSessions()
    ])
      .then(([statsData, sessionsData]) => {
        setStats(statsData)
        setSessions(sessionsData)
        setError(null)
      })
      .catch((err) => {
        setError("Failed to load dashboard data")
      })
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    {
      title: "Assigned Programs",
      value: stats ? stats.assignedPrograms : "-",
      description: "Active programs",
      icon: BookOpen,
      trend: "+2 this month", // TODO: make dynamic if needed
    },
    {
      title: "Today's Sessions",
      value: stats ? stats.todaysSessions : "-",
      description: "Scheduled classes",
      icon: Calendar,
      trend: "Next at 2:00 PM", // TODO: make dynamic if needed
    },
    {
      title: "Pending Reviews",
      value: stats ? stats.pendingReviews : "-",
      description: "Project submissions",
      icon: FileCheck,
      trend: "3 urgent", // TODO: make dynamic if needed
    },
    {
      title: "Attendance Rate",
      value: stats ? `${stats.attendanceRate}%` : "-",
      description: "This week",
      icon: TrendingUp,
      trend: "+5% from last week", // TODO: make dynamic if needed
    },
  ]

  // Filter sessions for today
  const todaysSessions = sessions.filter(s => isToday(s.startTime))
  // Sort by start time ascending
  todaysSessions.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  // Recent activity: show 5 most recent sessions (any status)
  const recentActivities = [...sessions]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 5)

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
      <div className="rounded-lg bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back!</h2>
        <p className="text-gray-300 mb-4">Ready to start today's classes? You have {stats ? stats.todaysSessions : "-"} sessions scheduled.</p>
        <Button size="lg" className="bg-white text-black hover:bg-gray-100" onClick={() => router.push("/dashboard/Facilitator/Fac-attendance") }>
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
              <div className="p-2 rounded-lg bg-muted/30">
                <stat.icon className="h-4 w-4 text-custom-blue" />
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
                  <div className="h-2 w-2 rounded-full bg-website-primary"></div>
                  <div>
                    <p className="font-medium text-foreground">{session.title}</p>
                    <p className="text-sm text-muted-foreground">{session.programId?.name || "Unknown Program"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">{formatTimeRange(session.startTime, session.endTime)}</p>
                  <Badge variant={session.status === "active" ? "outline" : "secondary"}>
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
              <div key={activity._id} className="flex items-start gap-3">
                <div
                  className={`h-2 w-2 rounded-full mt-2 ${
                    activity.status === "completed"
                      ? "bg-website-primary"
                      : activity.status === "active"
                        ? "bg-website-secondary"
                        : "bg-website-primary"
                  }`}
                ></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.programId?.name || "Unknown Program"}</p>
                  <p className="text-xs text-muted-foreground">{formatTimeRange(activity.startTime, activity.endTime)} ({activity.status.charAt(0).toUpperCase() + activity.status.slice(1)})</p>
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
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent" onClick={() => router.push("/facilitator/curriculum") }>
              <Upload className="h-6 w-6" />
              Upload Resources
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent" onClick={() => router.push("/dashboard/Facilitator/fac-reviews") }>
              <FileCheck className="h-6 w-6" />
              Review Projects
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent" onClick={() => router.push("/dashboard/Facilitator/fac-programs") }>
              <Users className="h-6 w-6" />
              View Trainees
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent" onClick={() => router.push("/dashboard/Facilitator/Fac-attendance") }>
              <Clock className="h-6 w-6" />
              Attendance Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
