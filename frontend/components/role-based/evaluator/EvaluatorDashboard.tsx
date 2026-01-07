"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BookOpen, Users, Calendar, Clock, Award, FileText, Loader2, UserPlus, ClipboardList, BarChart3, AlertCircle, Plus, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface Program {
  _id: string
  name: string
  status: string
  description?: string
  startDate?: string
  endDate?: string
  trainees?: number
  progress?: number
  courses?: number
  facilitators?: number
  totalAssignments?: number
  completedAssignments?: number
  averageScore?: number
  lastActivity?: string
}

interface DashboardStats {
  totalPrograms: number
  activePrograms: number
  pendingPrograms: number
  totalTrainees: number
  totalFacilitators: number
  pendingCourses: number
  recentLogs: any[]
  programsEndingSoon: any[]
}

interface RecentActivity {
  id: string
  type: 'roadmap_submitted' | 'assignment_completed' | 'milestone_reached' | 'trainee_enrolled'
  title: string
  description: string
  timestamp: string
  programName?: string
  traineeName?: string
}

export function EvaluatorDashboard() {
  const [myPrograms, setMyPrograms] = useState<Program[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)

        const token = localStorage.getItem('accessToken')
        if (!token) {
          throw new Error("No access token found")
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }

        const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/+$/, '');

        // Fetch from same endpoints as Program Manager
        const [programsRes, overviewStatsRes, activityRes] = await Promise.all([
           fetch(`${BASE_URL}/programs`, { headers }),
           fetch(`${BASE_URL}/dashboard/admin-overview`, { headers }),
           fetch(`${BASE_URL}/dashboard/recent-activity`, { headers })
        ]);

        if (!programsRes.ok || !overviewStatsRes.ok) {
          throw new Error("Failed to fetch dashboard data")
        }

        const programsData = await programsRes.json()
        const overviewStatsData = await overviewStatsRes.json()
        const activityData = activityRes.ok ? await activityRes.json() : { data: [] }

        setMyPrograms(programsData.data || [])
        setStats(overviewStatsData.data)
        setRecentActivity(activityData.data || [])
      } catch (error) {
        setError("Could not load your dashboard data.")
        console.error("Failed to fetch dashboard", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center p-16">
        <Loader2 size={32} className="animate-spin" />
      </div>
    )
  }

  if (error) {
    return <div className="p-8 text-destructive bg-destructive/10 rounded-lg">{error}</div>
  }

  const statCards = [
    {
      title: "Active Programs",
      value: stats?.activePrograms?.toString() || "0",
      change: `Total: ${stats?.totalPrograms || 0}`,
      icon: BookOpen,
      color: "text-custom-blue",
      bgColor: "bg-custom-blue/10",
    },
    {
      title: "Total Trainees",
      value: stats?.totalTrainees?.toString() || "0",
      icon: Users,
      color: "text-custom-blue",
      bgColor: "bg-custom-blue/10",
    },
    {
      title: "Total Facilitators",
      value: stats?.totalFacilitators?.toString() || "0",
      icon: TrendingUp,
      color: "text-custom-blue",
      bgColor: "bg-custom-blue/10",
    },
    {
      title: "Pending Items",
      value: ((stats?.pendingPrograms || 0) + (stats?.pendingCourses || 0)).toString(),
      change: "Programs & Courses",
      icon: Clock,
      color: "text-custom-blue",
      bgColor: "bg-custom-blue/10",
    },
  ]

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { variant: "default" | "secondary" | "destructive" | "outline", label: string } } = {
      'active': { variant: 'default', label: 'Active' },
      'pending': { variant: 'secondary', label: 'Pending' },
      'draft': { variant: 'outline', label: 'Draft' },
      'completed': { variant: 'secondary', label: 'Completed' },
      'rejected': { variant: 'destructive', label: 'Rejected' },
      'pending_approval': { variant: 'secondary', label: 'Pending Approval' },
    }

    const normalizedStatus = status.toLowerCase().replace(/ /g, '_')
    const statusInfo = statusMap[normalizedStatus] || { variant: 'outline', label: status }

    return <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Invalid date'
    }
  }

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return 'No description'
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'roadmap_submitted':
        return <FileText className="h-4 w-4" />
      case 'assignment_completed':
        return <Award className="h-4 w-4" />
      case 'milestone_reached':
        return <TrendingUp className="h-4 w-4" />
      case 'trainee_enrolled':
        return <UserPlus className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'roadmap_submitted':
        return 'bg-green-500'
      case 'assignment_completed':
        return 'bg-custom-blue'
      case 'milestone_reached':
        return 'bg-yellow-500'
      case 'trainee_enrolled':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Welcome, Evaluator!</h2>
        <p className="text-gray-100 mb-4">
          Manage trainees, track attendance, and generate comprehensive reports.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/dashboard/Evaluator/trainees">
            <Button size="lg" className="bg-white text-teal-700 hover:bg-gray-100 shadow-md font-semibold">
              <UserPlus className="mr-2 h-5 w-5" />
              Manage Trainees
            </Button>
          </Link>
          <Link href="/dashboard/Evaluator/attendance">
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-teal-700 bg-transparent font-semibold"
            >
              <ClipboardList className="mr-2 h-5 w-5" />
              Track Attendance
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-all duration-200 bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-card-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-card-foreground mb-1">{stat.value}</div>
              <p className="text-sm text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="bg-card shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
            <CardDescription>Common tasks for evaluators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/Evaluator/trainees">
              <Button variant="outline" className="w-full justify-start">
                <UserPlus className="mr-2 h-4 w-4" />
                Add New Trainee
              </Button>
            </Link>
            <Link href="/dashboard/Evaluator/attendance">
              <Button variant="outline" className="w-full justify-start">
                <ClipboardList className="mr-2 h-4 w-4" />
                Mark Attendance
              </Button>
            </Link>
            <Link href="/dashboard/Evaluator/reports">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="mr-2 h-4 w-4" />
                Generate Reports
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Action Required Card */}
        <Card className="bg-[#f9fafb] border border-teal-200 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-teal-700 text-xl font-bold">
              <AlertCircle className="h-6 w-6 text-teal-700" />
              Action Required
            </CardTitle>
            <CardDescription className="text-gray-600">
              Items awaiting your review or approval.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats && ((stats.pendingPrograms > 0 || stats.pendingCourses > 0) ? (
              <>
                {stats.pendingPrograms > 0 && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">Pending Programs</p>
                        <p className="text-xs text-gray-500">{stats.pendingPrograms} awaiting review</p>
                      </div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      {stats.pendingPrograms}
                    </Badge>
                  </div>
                )}
                {stats.pendingCourses > 0 && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">Pending Courses</p>
                        <p className="text-xs text-gray-500">{stats.pendingCourses} pending approval</p>
                      </div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      {stats.pendingCourses}
                    </Badge>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-2">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 font-medium">All caught up!</p>
                <p className="text-xs text-gray-500 mt-1">No pending items</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
            <CardDescription>Latest updates from programs</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.slice(0, 4).map((activity, index) => (
                  <div key={activity.id || index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className={`p-2 rounded-full ${getActivityColor(activity.type)} text-white`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : 'Recently'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Programs Section */}
      {myPrograms && myPrograms.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">Programs Overview</CardTitle>
                <CardDescription>All programs you have access to</CardDescription>
              </div>
              <Badge variant="outline" className="text-sm px-3 py-1">
                {myPrograms.length} Total
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myPrograms.slice(0, 6).map((program) => (
                <Card key={program._id} className="border hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-semibold truncate">{program.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {formatDate(program.startDate)} - {formatDate(program.endDate)}
                        </CardDescription>
                      </div>
                      {getStatusBadge(program.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {truncateText(program.description || '', 80)}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Trainees</p>
                        <p className="text-sm font-semibold">{program.trainees || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Courses</p>
                        <p className="text-sm font-semibold">{program.courses || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Progress</p>
                        <p className="text-sm font-semibold">{program.progress || 0}%</p>
                      </div>
                    </div>
                    {typeof program.progress === 'number' && (
                      <Progress value={program.progress} className="h-2" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            {myPrograms.length > 6 && (
              <div className="mt-4 text-center">
                <Link href="/dashboard/Manager/programs">
                  <Button variant="outline">
                    View All Programs
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
