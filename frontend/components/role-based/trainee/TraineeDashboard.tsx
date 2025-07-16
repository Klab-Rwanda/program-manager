"use client"

import { useState, useEffect } from "react"
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
  CheckSquare
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
  facilitator?: string
  progress?: number
  nextSession?: string
}

export function TraineeDashboard() {
  const [myPrograms, setMyPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Mock data based on the original structure
  const mockPrograms: Program[] = [
    {
      _id: "1",
      name: "Web Development Bootcamp",
      status: "Active",
      description: "Learn full-stack web development",
      startDate: "2024-01-15",
      endDate: "2024-06-15",
      facilitator: "John Doe",
      progress: 75,
      nextSession: "Today, 2:00 PM"
    },
    {
      _id: "2",
      name: "Data Science Fundamentals",
      status: "Active",
      description: "Introduction to data analysis",
      startDate: "2024-02-01",
      endDate: "2024-05-01",
      facilitator: "Sarah Wilson",
      progress: 45,
      nextSession: "Tomorrow, 10:00 AM"
    },
    {
      _id: "3",
      name: "UI/UX Design Workshop",
      status: "Active",
      description: "Design principles and tools",
      startDate: "2024-03-01",
      endDate: "2024-05-15",
      facilitator: "Mike Johnson",
      progress: 90,
      nextSession: "Friday, 3:00 PM"
    }
  ]

  // Simulate the original fetchMyPrograms function
  useEffect(() => {
    const fetchMyPrograms = async () => {
      try {
        setLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        // Filter to only show active programs (as in original code)
        setMyPrograms(mockPrograms.filter(p => p.status === 'Active'))
      } catch (error) {
        setError("Could not load your enrolled programs.")
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
      title: "Enrolled Programs",
      value: myPrograms.length.toString(),
      change: "Active courses",
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Overall Progress",
      value: `${Math.round(myPrograms.reduce((sum, p) => sum + (p.progress || 0), 0) / myPrograms.length)}%`,
      change: "+12% this week",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Next Session",
      value: "Today",
      change: "2:00 PM - React Basics",
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      title: "Pending Tasks",
      value: "5",
      change: "Due this week",
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
  ]

  const upcomingTasks = [
    {
      id: 1,
      title: "React Components Assignment",
      dueDate: "Today",
      program: "Web Development",
      status: "Pending"
    },
    {
      id: 2,
      title: "Data Visualization Project",
      dueDate: "Tomorrow",
      program: "Data Science",
      status: "In Progress"
    },
    {
      id: 3,
      title: "Design Portfolio Review",
      dueDate: "Friday",
      program: "UI/UX Design",
      status: "Completed"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-lg bg-gradient-to-r from-blue-900 to-blue-800 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, Alice!</h2>
        <p className="text-blue-200 mb-4">Continue your learning journey. You have {myPrograms.length} active programs.</p>
        <div className="flex gap-3">
          <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50">
            <BookOpen className="mr-2 h-4 w-4" />
            Continue Learning
          </Button>
          <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-900">
            <FileText className="mr-2 h-4 w-4" />
            Submit Assignment
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
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
                <div key={program._id} className="flex items-center justify-between p-4 rounded-lg bg-muted">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <Link 
                        href={`/program-management/${program._id}`} 
                        className="font-medium text-foreground hover:text-blue-600 transition-colors flex items-center gap-2"
                      >
                        {program.name}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <Badge 
                        variant={program.status === "Active" ? "default" : "secondary"}
                        className={program.status === "Active" ? "bg-blue-600" : ""}
                      >
                        {program.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{program.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Facilitator: {program.facilitator}</span>
                      <span>Next: {program.nextSession}</span>
                    </div>
                    {program.progress && (
                      <div className="flex items-center space-x-2">
                        <Progress value={program.progress} className="w-32" />
                        <span className="text-sm text-muted-foreground">{program.progress}%</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full">
                        <CheckSquare className="h-3 w-3 mr-1" />
                        Mark Attendance
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        <FileText className="h-3 w-3 mr-1" />
                        Submit Assignment
                      </Button>
                    </div>
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
            {upcomingTasks.map((task, index) => (
              <div key={index} className="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm text-foreground">{task.title}</p>
                  <Badge 
                    variant={
                      task.status === "Completed" ? "default" : 
                      task.status === "In Progress" ? "secondary" : "outline"
                    }
                    className="text-xs"
                  >
                    {task.status}
                  </Badge>
                </div>
                <p className="text-sm text-blue-600 font-medium">{task.program}</p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3" />
                  Due: {task.dueDate}
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