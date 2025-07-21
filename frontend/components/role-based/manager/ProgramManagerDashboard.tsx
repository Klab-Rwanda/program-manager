"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BookOpen, Users, TrendingUp, Calendar, Plus, Eye, Edit, Loader2, ExternalLink } from "lucide-react"
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
}

interface DashboardStats {
  totalPrograms: number
  activeTrainees: number
  totalUsers: number
  pendingApprovals: number
}

export function ProgramManagerDashboard() {
  const [myPrograms, setMyPrograms] = useState<Program[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
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

        const [programsRes, statsRes] = await Promise.all([
          fetch("http://localhost:8000/api/v1/programs", {
            headers
          }),
          fetch("http://localhost:8000/api/v1/dashboard/stats", {
            headers
          })
        ])

        if (!programsRes.ok || !statsRes.ok) {
          throw new Error("Failed to fetch dashboard data")
        }

        const programsData = await programsRes.json()
        const statsData = await statsRes.json()

        setMyPrograms(programsData.data || [])
        setStats(statsData.data)
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
      value: stats?.totalPrograms.toString(),
      change: "+2 from last month",
      icon: BookOpen,
      color: "text-website-primary",
      bgColor: "bg-website-primary/10",
    },
    {
      title: "Total Trainees",
      value: stats?.activeTrainees.toString(),
      change: "+18 from last month",
      icon: Users,
      color: "text-website-secondary",
      bgColor: "bg-muted/30",
    },
    {
      title: "Total Users",
      value: stats?.totalUsers.toString(),
      change: "+5 from last month",
      icon: TrendingUp,
      color: "text-custom-blue",
      bgColor: "bg-muted/30",
    },
    {
      title: "Pending Approvals",
      value: stats?.pendingApprovals.toString(),
      change: "This month",
      icon: Calendar,
      color: "text-muted-foreground",
      bgColor: "bg-muted/30",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase().replace(/ /g, "")) {
      case "active":
        return "bg-custom-blue text-white"
      case "endingsoon":
        return "bg-website-secondary text-muted-foreground"
      case "completed":
        return "bg-muted/30 text-muted-foreground"
      default:
        return "bg-muted/30 text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, Program Manager!</h2>
        <p className="text-muted-foreground mb-4 dark:text-gray-300">
          Manage your programs and track their performance.
        </p>
        <div className="flex gap-3">
          <Link href="dashboard/Manager/programs">
            <Button size="lg" className="bg-white text-black hover:bg-gray-100">
              <Plus className="mr-2 h-4 w-4" />
              Create New Program
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-black bg-transparent dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
          >
            <Users className="mr-2 h-4 w-4" />
            Assign Trainees
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="border border-border bg-card hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground dark:text-gray-400">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor} dark:bg-gray-700`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground dark:text-white">{stat.value}</div>
              <p className="text-xs text-muted-foreground dark:text-gray-400">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-border bg-card dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-card-foreground dark:text-white">My Managed Programs</CardTitle>
          <CardDescription className="dark:text-gray-400">
            This is a list of programs you are currently managing. Click on a program to view its details, manage
            courses, and see statistics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myPrograms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myPrograms.map((program) => (
                <div
                  key={program._id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/50 dark:bg-gray-700 dark:border-gray-600"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/program-management/${program._id}`}
                        className="font-medium text-card-foreground hover:text-website-primary transition-colors flex items-center gap-2 dark:text-white dark:hover:text-custom-blue"
                      >
                        {program.name}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <Badge className={cn("text-xs", getStatusColor(program.status))}>{program.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">{program.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground dark:text-gray-400">
                      <span className="flex items-center">
                        <Users className="mr-1 h-3 w-3" />
                        {program.trainees} trainees
                      </span>
                      <span className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        {program.startDate} - {program.endDate}
                      </span>
                    </div>
                    {program.progress && (
                      <div className="flex items-center space-x-2">
                        <Progress
                          value={program.progress}
                          className="w-32 [&>*]:bg-custom-blue dark:[&>*]:bg-custom-blue"
                        />
                        <span className="text-sm text-muted-foreground dark:text-gray-400">{program.progress}%</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                You are not managing any programs yet. Go to "Program Management" to create one.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}