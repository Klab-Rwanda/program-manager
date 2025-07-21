"use client"

import { useState } from "react"
import { Calendar, Clock, User, BookOpen, TrendingUp, CheckCircle, Play } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

interface Program {
  id: number
  title: string
  facilitator: string
  startDate: string
  endDate: string
  status: string
  progress: number
  description: string
  nextSession?: string
  totalSessions?: number
  completedSessions?: number
}

export default function MyLearningPage() {
  const [programs] = useState<Program[]>([
    {
      id: 1,
      title: "Full Stack Web Development",
      facilitator: "Diane Erica",
      startDate: "2024-01-15",
      endDate: "2024-06-15",
      status: "Ongoing",
      progress: 65,
      description: "Comprehensive web development program covering frontend and backend technologies",
      nextSession: "Today, 2:00 PM",
      totalSessions: 24,
      completedSessions: 16,
    },
    {
      id: 2,
      title: "Mobile App Development",
      facilitator: "Mike Danny",
      startDate: "2024-02-01",
      endDate: "2024-07-01",
      status: "Ongoing",
      progress: 45,
      description: "Learn to build mobile applications using React Native and Flutter",
      nextSession: "Tomorrow, 10:00 AM",
      totalSessions: 20,
      completedSessions: 9,
    },
    {
      id: 3,
      title: "Data Science Fundamentals",
      facilitator: "Sarah Prima",
      startDate: "2023-10-01",
      endDate: "2024-01-01",
      status: "Completed",
      progress: 100,
      description: "Introduction to data science, analytics, and machine learning",
      totalSessions: 16,
      completedSessions: 16,
    },
  ])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Ongoing":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Ongoing</Badge>
      case "Completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
      case "Upcoming":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Upcoming</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500"
    if (progress >= 60) return "bg-blue-500"
    if (progress >= 40) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Learning</h1>
          <p className="text-muted-foreground">
            Track your progress across all enrolled programs
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">{programs.length} Programs</Badge>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {programs.filter(p => p.status === "Ongoing").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently enrolled
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(programs.reduce((sum, p) => sum + p.progress, 0) / programs.length)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all programs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {programs.reduce((sum, p) => sum + (p.completedSessions || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total sessions attended
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Session</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Today</div>
            <p className="text-xs text-muted-foreground">
              2:00 PM - Web Development
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Programs Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => (
          <Card key={program.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{program.title}</CardTitle>
                {getStatusBadge(program.status)}
              </div>
              <CardDescription>{program.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Facilitator Info */}
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{program.facilitator}</span>
              </div>

              {/* Date Range */}
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {new Date(program.startDate).toLocaleDateString()} - {new Date(program.endDate).toLocaleDateString()}
                </span>
              </div>

              {/* Progress Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm font-bold">{program.progress}%</span>
                </div>
                <Progress value={program.progress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{program.completedSessions} of {program.totalSessions} sessions</span>
                  <span>{Math.round((program.completedSessions || 0) / (program.totalSessions || 1) * 100)}% complete</span>
                </div>
              </div>

              {/* Next Session */}
              {program.status === "Ongoing" && program.nextSession && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <Play className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-blue-900">Next Session</div>
                    <div className="text-xs text-blue-700">{program.nextSession}</div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Continue
                </Button>
                <Button variant="outline" size="sm">
                  <TrendingUp className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Access your learning resources and tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <BookOpen className="h-6 w-6" />
              <span className="text-sm">Continue Learning</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Calendar className="h-6 w-6" />
              <span className="text-sm">View Schedule</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">Track Progress</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <User className="h-6 w-6" />
              <span className="text-sm">Contact Facilitator</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 