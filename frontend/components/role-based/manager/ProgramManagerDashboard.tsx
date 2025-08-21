"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BookOpen, Users, TrendingUp, Calendar, Plus, Eye, Edit, Loader2, ExternalLink, Bell, UserPlus, Clock, Award, FileText, GraduationCap, AlertCircle, ArrowRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

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

// Update DashboardStats to match the `admin-overview` endpoint's response
interface DashboardStats {
  totalPrograms: number
  activePrograms: number 
  pendingPrograms: number // specific count for pending programs
  totalTrainees: number
  totalFacilitators: number
  pendingCourses: number // specific count for pending courses
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

export function ProgramManagerDashboard() {
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

        const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

        // Fetch from `admin-overview` which provides more granular stats for PM/SA
        const [programsRes, overviewStatsRes, activityRes] = await Promise.all([
           fetch(`${BASE_URL}/programs`, { headers }),
           fetch(`${BASE_URL}/dashboard/admin-overview`, { headers }), // Changed endpoint
           fetch(`${BASE_URL}/dashboard/recent-activity`, { headers })
        ]);

        if (!programsRes.ok || !overviewStatsRes.ok) {
          throw new Error("Failed to fetch dashboard data")
        }

        const programsData = await programsRes.json()
        const overviewStatsData = await overviewStatsRes.json()
        const activityData = activityRes.ok ? await activityRes.json() : { data: [] }

        setMyPrograms(programsData.data || [])
        setStats(overviewStatsData.data) // Set the full overview stats
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
      // change: "+18 from last month", 
      icon: Users,
      color: "text-custom-blue",
      bgColor: "bg-custom-blue/10",
    },
    {
      title: "Total Facilitators",
      value: stats?.totalFacilitators?.toString() || "0",
      // change: "+5 from last month", 
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

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Never'
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
      
      if (diffInHours < 1) return 'Just now'
      if (diffInHours < 24) return `${diffInHours}h ago`
      if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
      return `${Math.floor(diffInHours / 168)}w ago`
    } catch {
      return 'Unknown'
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600'
    if (progress >= 60) return 'text-yellow-600'
    if (progress >= 40) return 'text-orange-600'
    return 'text-red-600'
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
    <div className="space-y-8"> {/* Increased spacing */}
      {/* Header Section */}
      <div className="rounded-lg bg-gradient-to-r from-[#1f497d] to-[#30588f] p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Welcome, Program Manager!</h2>
        <p className="text-gray-200 mb-4 ">
          Manage your programs and track their performance.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="dashboard/Manager/programs">
            <Button size="lg" className="bg-white text-custom-blue hover:bg-gray-100 shadow-md font-semibold">
              <Plus className="mr-2 h-5 w-5" />
              Create New Program
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-custom-blue bg-transparent font-semibold"
          >
            <UserPlus className="mr-2 h-5 w-5" />
            Assign Trainees
          </Button>
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

      {/* Quick Actions, Action Required, & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Action Required Card (New) */}
        <Card className="bg-[#f9fafb] border border-website-secondary/30 shadow-md">
  <CardHeader>
    <CardTitle className="flex items-center gap-2 text-website-accent text-xl font-bold">
      <AlertCircle className="h-6 w-6 text-website-accent" />
      Action Required
    </CardTitle>
    <CardDescription className="text-website-secondary">
      Items awaiting your review or approval.
    </CardDescription>
  </CardHeader>

  <CardContent className="space-y-3">
    {stats && ((stats.pendingPrograms > 0 || stats.pendingCourses > 0) ? (
      <>
        {stats.pendingPrograms > 0 && (
          <Link
            href="/dashboard/Manager/programs"
            className="block p-3 rounded-md hover:bg-website-secondary/10 transition-colors"
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold text-website-accent">{stats.pendingPrograms} Programs</span>
              <ArrowRight className="h-5 w-5 text-website-secondary" />
            </div>
            <p className="text-sm text-website-secondary">Need your approval</p>
          </Link>
        )}

        {stats.pendingCourses > 0 && (
          <Link
            href="/dashboard/Manager/course-management"
            className="block p-3 rounded-md hover:bg-website-secondary/10 transition-colors"
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold text-website-accent">{stats.pendingCourses} Courses</span>
              <ArrowRight className="h-5 w-5 text-website-secondary" />
            </div>
            <p className="text-sm text-website-secondary">Need your approval</p>
          </Link>
        )}
      </>
    ) : (
      <div className="text-center p-4 text-muted-foreground">
        <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-600" />
        <p className="font-medium text-green-700">All clear! No actions currently required.</p>
      </div>
    ))}
  </CardContent>
</Card>


        {/* Quick Actions */}
        <Card className="border-0 shadow-md bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-card-foreground">Quick Actions</CardTitle>
            <CardDescription className="text-muted-foreground">
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="dashboard/Manager/course-management">
                <Eye className="mr-2 h-4 w-4" />
                Review Roadmaps
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="dashboard/Manager/programs">
                <Plus className="mr-2 h-4 w-4" />
                Add New Course
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="dashboard/Manager/course-management">
                <FileText className="mr-2 h-4 w-4" />
                View Assignments
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="dashboard/Manager/programs">
                <Users className="mr-2 h-4 w-4" />
                Manage Trainees
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-md bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-card-foreground">Recent Activity</CardTitle>
            <CardDescription className="text-muted-foreground">
              Latest updates and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
                    <div className={`w-2 h-2 ${getActivityColor(activity.type)} rounded-full mt-2`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{getTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
                <p className="text-xs text-muted-foreground">Activity will appear here as it happens</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

             
    </div>
  )
}