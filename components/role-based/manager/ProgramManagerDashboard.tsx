"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Calendar, 
  Plus,
  Eye,
  Edit,
  Loader2,
  ExternalLink
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

// Types based on the original JavaScript structure
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

export function ProgramManagerDashboard() {
  const [myPrograms, setMyPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Mock data based on the original structure
  const mockPrograms: Program[] = [
    {
      _id: "1",
      name: "Web Development Bootcamp",
      status: "Active",
      description: "Comprehensive full-stack web development program",
      startDate: "2024-01-15",
      endDate: "2024-06-15",
      trainees: 32,
      progress: 75
    },
    {
      _id: "2",
      name: "Data Science Fundamentals",
      status: "Active",
      description: "Introduction to data analysis and machine learning",
      startDate: "2024-02-01",
      endDate: "2024-05-01",
      trainees: 28,
      progress: 60
    },
    {
      _id: "3",
      name: "Mobile App Development",
      status: "Ending Soon",
      description: "iOS and Android app development",
      startDate: "2024-01-01",
      endDate: "2024-04-01",
      trainees: 24,
      progress: 90
    },
    {
      _id: "4",
      name: "UI/UX Design Workshop",
      status: "Active",
      description: "User interface and experience design principles",
      startDate: "2024-03-01",
      endDate: "2024-05-15",
      trainees: 18,
      progress: 45
    }
  ]

  // Simulate the original fetchMyPrograms function
  useEffect(() => {
    const fetchMyPrograms = async () => {
      try {
        setLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setMyPrograms(mockPrograms)
      } catch (error) {
        setError("Could not load your programs.")
        console.error("Failed to fetch programs", error)
      } finally {
        setLoading(false)
      }
    }
    fetchMyPrograms()
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

  const stats = [
    {
      title: "Active Programs",
      value: myPrograms.filter(p => p.status === "Active").length.toString(),
      change: "+2 from last month",
      icon: BookOpen,
      color: "text-website-primary",
      bgColor: "bg-website-primary/10",
    },
    {
      title: "Total Trainees",
      value: myPrograms.reduce((sum, p) => sum + (p.trainees || 0), 0).toString(),
      change: "+18 from last month",
      icon: Users,
      color: "text-website-grey",
      bgColor: "bg-website-grey/10",
    },
    {
      title: "Average Progress",
      value: `${Math.round(myPrograms.reduce((sum, p) => sum + (p.progress || 0), 0) / myPrograms.length)}%`,
      change: "+5% from last month",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Upcoming Sessions",
      value: "24",
      change: "Next 7 days",
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase().replace(/ /g, '')) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'endingsoon':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-lg bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, Program Manager!</h2>
        <p className="text-gray-300 mb-4">Manage your programs and track their performance.</p>
        <div className="flex gap-3">
          <Button size="lg" className="bg-white text-black hover:bg-gray-100">
            <Plus className="mr-2 h-4 w-4" />
            Create New Program
          </Button>
          <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black">
            <Users className="mr-2 h-4 w-4" />
            Assign Trainees
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border border-border bg-card hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* My Managed Programs */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">My Managed Programs</CardTitle>
          <CardDescription>
            This is a list of programs you are currently managing. Click on a program to view its details, manage courses, and see statistics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {myPrograms.length > 0 ? (
            myPrograms.map((program) => (
              <div
                key={program._id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/50"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <Link 
                      href={`/program-management/${program._id}`} 
                      className="font-medium text-card-foreground hover:text-website-primary transition-colors flex items-center gap-2"
                    >
                      {program.name}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <Badge
                      variant={program.status === "Active" ? "default" : "secondary"}
                      className={`${getStatusColor(program.status)} ${program.status === "Active" ? "bg-website-primary text-white" : ""}`}
                    >
                      {program.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{program.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
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
                      <Progress value={program.progress} className="w-32" />
                      <span className="text-sm text-muted-foreground">{program.progress}%</span>
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
            ))
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

      {/* Quick Actions */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Quick Actions</CardTitle>
          <CardDescription>Common program management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col space-y-2 hover:bg-website-primary/10 hover:border-website-primary bg-transparent">
              <BookOpen className="h-6 w-6 text-website-primary" />
              <span className="text-sm">Create Program</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2 hover:bg-website-grey/10 hover:border-website-grey bg-transparent">
              <Users className="h-6 w-6 text-website-grey" />
              <span className="text-sm">Assign Trainees</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2 hover:bg-green-100 hover:border-green-500 dark:hover:bg-green-900/20 bg-transparent">
              <TrendingUp className="h-6 w-6 text-green-600" />
              <span className="text-sm">View Analytics</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2 hover:bg-orange-100 hover:border-orange-500 dark:hover:bg-orange-900/20 bg-transparent">
              <Calendar className="h-6 w-6 text-orange-600" />
              <span className="text-sm">Schedule Sessions</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 