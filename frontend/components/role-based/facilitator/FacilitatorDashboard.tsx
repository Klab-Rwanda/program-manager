"use client"
import { BookOpen, Camera, Clock, Users, FileCheck, TrendingUp, Calendar, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function FacilitatorDashboard() {
  const stats = [
    {
      title: "Assigned Programs",
      value: "4",
      description: "Active programs",
      icon: BookOpen,
      trend: "+2 this month",
    },
    {
      title: "Today's Sessions",
      value: "2",
      description: "Scheduled classes",
      icon: Calendar,
      trend: "Next at 2:00 PM",
    },
    {
      title: "Pending Reviews",
      value: "12",
      description: "Project submissions",
      icon: FileCheck,
      trend: "3 urgent",
    },
    {
      title: "Attendance Rate",
      value: "87%",
      description: "This week",
      icon: TrendingUp,
      trend: "+5% from last week",
    },
  ]
  const recentActivities = [
    {
      title: "Software Engineering Bootcamp",
      description: "Class completed - 18/20 students attended",
      time: "2 hours ago",
      status: "completed",
    },
    {
      title: "Tech for Kids Program",
      description: "New project submission from Sarah M.",
      time: "4 hours ago",
      status: "pending",
    },
    {
      title: "Sales Training Program",
      description: "Resource uploaded: Sales Techniques PDF",
      time: "1 day ago",
      status: "info",
    },
  ]
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-lg bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, John!</h2>
        <p className="text-gray-300 mb-4">Ready to start today's classes? You have 2 sessions scheduled.</p>
        <Button size="lg" className="bg-white text-black hover:bg-gray-100">
          <Camera className="mr-2 h-4 w-4" />
          Start Class & Mark Attendance
        </Button>
      </div>
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className="p-2 rounded-lg bg-muted/30">
                {" "}
                {/* Changed to bg-muted/30 */}
                <stat.icon className="h-4 w-4 text-custom-blue" /> {/* Changed all icons to text-custom-blue */}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              <p
                className={`text-xs mt-1 ${stat.trend.startsWith("+") ? "text-custom-blue" : "text-muted-foreground"}`}
              >
                {stat.trend}
              </p>{" "}
              {/* Adjusted trend colors */}
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
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-website-primary"></div> {/* Changed to bg-website-primary */}
                <div>
                  <p className="font-medium text-foreground">Software Engineering Bootcamp</p>
                  <p className="text-sm text-muted-foreground">Room A1 • 20 students</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-foreground">2:00 PM - 4:00 PM</p>
                <Badge variant="outline">In Progress</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-website-primary"></div> {/* Changed to bg-website-primary */}
                <div>
                  <p className="font-medium text-foreground">Tech for Kids</p>
                  <p className="text-sm text-muted-foreground">Room B2 • 15 students</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-foreground">4:30 PM - 6:00 PM</p>
                <Badge variant="secondary">Upcoming</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Recent Activity */}
        <Card className="col-span-3 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
            <CardDescription>Latest updates from your programs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div
                  className={`h-2 w-2 rounded-full mt-2 ${
                    activity.status === "completed"
                      ? "bg-website-primary" // Changed to bg-website-primary
                      : activity.status === "pending"
                        ? "bg-website-secondary" // Changed to bg-website-secondary
                        : "bg-website-primary" // Changed to bg-website-primary
                  }`}
                ></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
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
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <Upload className="h-6 w-6" />
              Upload Resources
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <FileCheck className="h-6 w-6" />
              Review Projects
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <Users className="h-6 w-6" />
              View Trainees
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <Clock className="h-6 w-6" />
              Attendance Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
