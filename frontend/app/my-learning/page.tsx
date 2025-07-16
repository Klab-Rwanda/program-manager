"use client"

import { useState } from "react"
import {
  BookOpen,
  Calendar,
  Clock,
  FileText,
  GraduationCap,
  Upload,
  User,
  Bell,
  CheckCircle,
  Play,
  Pause,
  Target,
  Award,
  TrendingUp,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Program {
  id: number
  name: string
  description: string
  category: string
  progress: number
  totalModules: number
  completedModules: number
  startDate: string
  endDate: string
  status: string
  instructor: string
  nextSession: string
  materials: Array<{
    id: number
    title: string
    type: string
    duration: string
    completed: boolean
  }>
}

interface LearningStats {
  totalHours: number
  completedProjects: number
  totalProjects: number
  averageScore: number
  streakDays: number
  certificates: number
}

export default function MyLearningPage() {
  const [activeTab, setActiveTab] = useState("current")

  const [learningStats] = useState<LearningStats>({
    totalHours: 120,
    completedProjects: 8,
    totalProjects: 12,
    averageScore: 87,
    streakDays: 15,
    certificates: 2,
  })

  const [programs] = useState<Program[]>([
    {
      id: 1,
      name: "Data Science Bootcamp",
      description: "Comprehensive data science training program covering Python, Machine Learning, and Data Visualization",
      category: "Data Science",
      progress: 75,
      totalModules: 12,
      completedModules: 9,
      startDate: "2024-01-15",
      endDate: "2024-06-15",
      status: "active",
      instructor: "Dr. Sarah Wilson",
      nextSession: "2024-01-22 09:00 AM",
      materials: [
        { id: 1, title: "Introduction to Python", type: "video", duration: "45 min", completed: true },
        { id: 2, title: "Data Structures", type: "video", duration: "60 min", completed: true },
        { id: 3, title: "Pandas Basics", type: "video", duration: "90 min", completed: true },
        { id: 4, title: "Machine Learning Fundamentals", type: "video", duration: "120 min", completed: false },
        { id: 5, title: "Data Visualization with Matplotlib", type: "video", duration: "75 min", completed: false },
        { id: 6, title: "Final Project Guidelines", type: "document", duration: "30 min", completed: false },
      ],
    },
    {
      id: 2,
      name: "Web Development Mastery",
      description: "Full-stack web development course covering React, Node.js, and modern web technologies",
      category: "Web Development",
      progress: 60,
      totalModules: 10,
      completedModules: 6,
      startDate: "2024-02-01",
      endDate: "2024-07-01",
      status: "active",
      instructor: "Tom Anderson",
      nextSession: "2024-01-23 02:00 PM",
      materials: [
        { id: 7, title: "HTML & CSS Fundamentals", type: "video", duration: "90 min", completed: true },
        { id: 8, title: "JavaScript Basics", type: "video", duration: "120 min", completed: true },
        { id: 9, title: "React Introduction", type: "video", duration: "150 min", completed: true },
        { id: 10, title: "State Management", type: "video", duration: "100 min", completed: false },
        { id: 11, title: "Backend with Node.js", type: "video", duration: "180 min", completed: false },
      ],
    },
    {
      id: 3,
      name: "UI/UX Design Mastery",
      description: "Complete design thinking and user experience program with hands-on projects",
      category: "Design",
      progress: 100,
      totalModules: 8,
      completedModules: 8,
      startDate: "2023-09-01",
      endDate: "2024-01-01",
      status: "completed",
      instructor: "Lisa Chen",
      nextSession: "Completed",
      materials: [
        { id: 12, title: "Design Principles", type: "video", duration: "60 min", completed: true },
        { id: 13, title: "User Research Methods", type: "video", duration: "90 min", completed: true },
        { id: 14, title: "Wireframing & Prototyping", type: "video", duration: "120 min", completed: true },
        { id: 15, title: "Final Portfolio Project", type: "project", duration: "240 min", completed: true },
      ],
    },
  ])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return { label: "Active", variant: "default" as const, color: "text-green-600" }
      case "completed":
        return { label: "Completed", variant: "default" as const, color: "text-blue-600" }
      case "paused":
        return { label: "Paused", variant: "secondary" as const, color: "text-yellow-600" }
      default:
        return { label: status, variant: "outline" as const, color: "text-gray-600" }
    }
  }

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play className="h-4 w-4" />
      case "document":
        return <FileText className="h-4 w-4" />
      case "project":
        return <Target className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const currentPrograms = programs.filter(p => p.status === "active")
  const completedPrograms = programs.filter(p => p.status === "completed")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Learning</h1>
        <p className="text-muted-foreground">
          Track your progress and continue your learning journey
        </p>
      </div>

      {/* Learning Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learningStats.totalHours}h</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12h</span> this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learningStats.completedProjects}/{learningStats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2</span> this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learningStats.averageScore}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5%</span> improvement
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learningStats.streakDays} days</div>
            <p className="text-xs text-muted-foreground">
              Keep it up!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Programs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">Current Programs ({currentPrograms.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedPrograms.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {currentPrograms.map((program) => {
            const statusConfig = getStatusConfig(program.status)
            return (
              <Card key={program.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <span>{program.name}</span>
                      </CardTitle>
                      <CardDescription>{program.description}</CardDescription>
                    </div>
                    <Badge variant={statusConfig.variant} className={statusConfig.color}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Progress</p>
                        <p className="font-medium">{program.progress}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Modules</p>
                        <p className="font-medium">{program.completedModules}/{program.totalModules}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Instructor</p>
                        <p className="font-medium">{program.instructor}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Next Session</p>
                        <p className="font-medium">{program.nextSession}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Overall Progress</span>
                        <span className="text-sm text-muted-foreground">{program.progress}%</span>
                      </div>
                      <Progress value={program.progress} className="h-2" />
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Learning Materials</h4>
                      <div className="space-y-2">
                        {program.materials.map((material) => (
                          <div
                            key={material.id}
                            className={`flex items-center justify-between p-3 border rounded-lg ${
                              material.completed ? "bg-green-50 border-green-200" : "bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              {material.completed ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                getMaterialIcon(material.type)
                              )}
                              <div>
                                <p className={`text-sm font-medium ${material.completed ? "text-green-800" : ""}`}>
                                  {material.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {material.type} • {material.duration}
                                </p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              {material.completed ? "Review" : "Start"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button>
                        <Play className="mr-2 h-4 w-4" />
                        Continue Learning
                      </Button>
                      <Button variant="outline">
                        <Calendar className="mr-2 h-4 w-4" />
                        View Schedule
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedPrograms.map((program) => {
            const statusConfig = getStatusConfig(program.status)
            return (
              <Card key={program.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Award className="h-5 w-5 text-yellow-600" />
                        <span>{program.name}</span>
                      </CardTitle>
                      <CardDescription>{program.description}</CardDescription>
                    </div>
                    <Badge variant={statusConfig.variant} className={statusConfig.color}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Final Score</p>
                        <p className="font-medium text-green-600">95%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Completion Date</p>
                        <p className="font-medium">{program.endDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Instructor</p>
                        <p className="font-medium">{program.instructor}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Certificate</p>
                        <p className="font-medium text-green-600">Available</p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline">
                        <Award className="mr-2 h-4 w-4" />
                        Download Certificate
                      </Button>
                      <Button variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        View Portfolio
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>
      </Tabs>

      {/* Learning Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Next Steps</CardTitle>
          <CardDescription>
            Based on your learning history and interests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">Advanced Machine Learning</CardTitle>
                <CardDescription>
                  Build on your data science foundation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duration: 8 weeks</span>
                  <Button size="sm">Learn More</Button>
                </div>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">Cloud Computing</CardTitle>
                <CardDescription>
                  Deploy and scale your applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duration: 6 weeks</span>
                  <Button size="sm">Learn More</Button>
                </div>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">DevOps Practices</CardTitle>
                <CardDescription>
                  Learn CI/CD and deployment strategies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duration: 4 weeks</span>
                  <Button size="sm">Learn More</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 