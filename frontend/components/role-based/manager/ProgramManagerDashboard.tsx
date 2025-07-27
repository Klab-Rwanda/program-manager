"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BookOpen, Users, TrendingUp, Calendar, Plus, Eye, Edit, Loader2, ExternalLink, Bell, UserPlus, Clock, Award, FileText, GraduationCap } from "lucide-react"
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

interface DashboardStats {
  totalPrograms: number
  activeTrainees: number
  totalUsers: number
  pendingApprovals: number
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
        
        // Get token from localStorage
        const token = localStorage.getItem('accessToken')
        
        if (!token) {
          throw new Error("No access token found")
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }

        const [programsRes, statsRes, activityRes] = await Promise.all([
          fetch("http://localhost:8000/api/v1/programs", {
            headers
          }),
          fetch("http://localhost:8000/api/v1/dashboard/stats", {
            headers
          }),
          fetch("http://localhost:8000/api/v1/dashboard/recent-activity", {
            headers
          })
        ])

        if (!programsRes.ok || !statsRes.ok) {
          throw new Error("Failed to fetch dashboard data")
        }

        const programsData = await programsRes.json()
        const statsData = await statsRes.json()
        const activityData = activityRes.ok ? await activityRes.json() : { data: [] }

        setMyPrograms(programsData.data || [])
        setStats(statsData.data)
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
      value: stats?.totalPrograms.toString() || "0",
      change: "+2 from last month",
      icon: BookOpen,
      color: "text-custom-blue",
      bgColor: "bg-custom-blue/10",
    },
    {
      title: "Total Trainees",
      value: stats?.activeTrainees.toString() || "0",
      change: "+18 from last month",
      icon: Users,
      color: "text-website-secondary",
      bgColor: "bg-website-secondary/10",
    },
    {
      title: "Total Users",
      value: stats?.totalUsers.toString() || "0",
      change: "+5 from last month",
      icon: TrendingUp,
      color: "text-custom-blue",
      bgColor: "bg-custom-blue/10",
    },
    {
      title: "Pending Approvals",
      value: stats?.pendingApprovals.toString() || "0",
      change: "This month",
      icon: Calendar,
      color: "text-website-accent",
      bgColor: "bg-website-accent/10",
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
        return 'bg-blue-500'
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
      <div className="rounded-xl bg-gradient-to-r from-custom-blue to-custom-blue/80 p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-3">Welcome back, Program Manager!</h1>
        <p className="text-gray-100 mb-6 text-lg">
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

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="border-0 shadow-md bg-card lg:col-span-1">
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
        <Card className="border-0 shadow-md bg-card lg:col-span-2">
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