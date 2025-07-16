"use client"

import { useState } from "react"
import {
  TrendingUp,
  TrendingDown,
  Users,
  GraduationCap,
  Award,
  Calendar,
  Clock,
  Target,
  BarChart3,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Download,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AnalyticsData {
  totalPrograms: number
  activePrograms: number
  totalTrainees: number
  totalFacilitators: number
  completionRate: number
  attendanceRate: number
  averageProgress: number
  totalRevenue: number
  monthlyGrowth: number
  programPerformance: Array<{
    name: string
    enrollment: number
    completion: number
    satisfaction: number
    revenue: number
  }>
  recentActivities: Array<{
    id: number
    type: string
    message: string
    time: string
    impact: string
  }>
  topPerformers: Array<{
    name: string
    program: string
    progress: number
    attendance: number
    projects: number
  }>
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d")
  const [selectedProgram, setSelectedProgram] = useState("all")

  const [analyticsData] = useState<AnalyticsData>({
    totalPrograms: 12,
    activePrograms: 8,
    totalTrainees: 234,
    totalFacilitators: 45,
    completionRate: 87,
    attendanceRate: 92,
    averageProgress: 73,
    totalRevenue: 125000,
    monthlyGrowth: 15,
    programPerformance: [
      {
        name: "Data Science Bootcamp",
        enrollment: 45,
        completion: 38,
        satisfaction: 4.8,
        revenue: 45000,
      },
      {
        name: "Web Development Mastery",
        enrollment: 32,
        completion: 28,
        satisfaction: 4.6,
        revenue: 32000,
      },
      {
        name: "UI/UX Design Mastery",
        enrollment: 28,
        completion: 25,
        satisfaction: 4.9,
        revenue: 28000,
      },
      {
        name: "Mobile App Development",
        enrollment: 22,
        completion: 18,
        satisfaction: 4.4,
        revenue: 22000,
      },
    ],
    recentActivities: [
      {
        id: 1,
        type: "enrollment",
        message: "25 new trainees enrolled in Data Science Program",
        time: "2 hours ago",
        impact: "+15%",
      },
      {
        id: 2,
        type: "completion",
        message: "Web Development cohort completed successfully",
        time: "5 hours ago",
        impact: "+8%",
      },
      {
        id: 3,
        type: "assignment",
        message: "New facilitator assigned to AI/ML Program",
        time: "1 day ago",
        impact: "+5%",
      },
      {
        id: 4,
        type: "certificate",
        message: "89 certificates generated for graduates",
        time: "2 days ago",
        impact: "+12%",
      },
    ],
    topPerformers: [
      {
        name: "John Doe",
        program: "Data Science Bootcamp",
        progress: 95,
        attendance: 98,
        projects: 10,
      },
      {
        name: "Jane Smith",
        program: "Web Development Mastery",
        progress: 88,
        attendance: 95,
        projects: 8,
      },
      {
        name: "Alice Brown",
        program: "UI/UX Design Mastery",
        progress: 92,
        attendance: 97,
        projects: 9,
      },
      {
        name: "Bob Wilson",
        program: "Data Science Bootcamp",
        progress: 90,
        attendance: 94,
        projects: 9,
      },
    ],
  })

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "enrollment":
        return <Users className="h-4 w-4 text-blue-600" />
      case "completion":
        return <Award className="h-4 w-4 text-green-600" />
      case "assignment":
        return <GraduationCap className="h-4 w-4 text-purple-600" />
      case "certificate":
        return <Award className="h-4 w-4 text-yellow-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getImpactColor = (impact: string) => {
    return impact.startsWith("+") ? "text-green-600" : "text-red-600"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Program Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into program performance and trainee progress
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              <SelectItem value="data-science">Data Science Bootcamp</SelectItem>
              <SelectItem value="web-dev">Web Development Mastery</SelectItem>
              <SelectItem value="ui-ux">UI/UX Design Mastery</SelectItem>
              <SelectItem value="mobile">Mobile App Development</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalPrograms}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{analyticsData.monthlyGrowth}%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trainees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalTrainees}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+18%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Program Performance</TabsTrigger>
          <TabsTrigger value="activities">Recent Activities</TabsTrigger>
          <TabsTrigger value="performers">Top Performers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span>Attendance Rate</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{analyticsData.attendanceRate}%</div>
                <p className="text-sm text-muted-foreground">Average across all programs</p>
                <div className="mt-4 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-green-600 rounded-full" 
                    style={{ width: `${analyticsData.attendanceRate}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span>Average Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{analyticsData.averageProgress}%</div>
                <p className="text-sm text-muted-foreground">Overall trainee progress</p>
                <div className="mt-4 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-blue-600 rounded-full" 
                    style={{ width: `${analyticsData.averageProgress}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span>Facilitators</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{analyticsData.totalFacilitators}</div>
                <p className="text-sm text-muted-foreground">Active facilitators</p>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  +3 new this month
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Program Performance Overview</CardTitle>
              <CardDescription>
                Detailed performance metrics for each program
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.programPerformance.map((program, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{program.name}</h4>
                      <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Enrollment:</span>
                          <span className="ml-2 font-medium">{program.enrollment}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Completion:</span>
                          <span className="ml-2 font-medium">{program.completion}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Satisfaction:</span>
                          <span className="ml-2 font-medium">{program.satisfaction}/5</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{formatCurrency(program.revenue)}</div>
                      <div className="text-sm text-muted-foreground">Revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>
                Latest activities and their impact on program metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={getImpactColor(activity.impact)}>
                        {activity.impact}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Trainees</CardTitle>
              <CardDescription>
                Trainees with the highest progress and attendance rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topPerformers.map((performer, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {performer.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium">{performer.name}</h4>
                        <p className="text-sm text-muted-foreground">{performer.program}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-green-600">{performer.progress}%</div>
                        <div className="text-xs text-muted-foreground">Progress</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-blue-600">{performer.attendance}%</div>
                        <div className="text-xs text-muted-foreground">Attendance</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-purple-600">{performer.projects}</div>
                        <div className="text-xs text-muted-foreground">Projects</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common analytics tasks and reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
              <BarChart3 className="h-6 w-6" />
              <span>Generate Report</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
              <Download className="h-6 w-6" />
              <span>Export Data</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
              <Eye className="h-6 w-6" />
              <span>View Details</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
              <Filter className="h-6 w-6" />
              <span>Advanced Filter</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 