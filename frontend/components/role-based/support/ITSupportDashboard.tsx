"use client"
import { useState, useEffect } from "react"
import { Server, Ticket, Network, Users, FileText, Activity, Plus, Download, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
// Types based on the original JavaScript structure
interface SystemMetric {
  label: string
  value: string
  status: "online" | "offline" | "warning"
  icon: any
}
interface ActivityItem {
  id: string
  message: string
  timestamp: string
  type: "server" | "ticket" | "user" | "backup"
  status?: string
}
export function ITSupportDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Mock data based on the original structure
  const systemMetrics: SystemMetric[] = [
    {
      label: "Servers",
      value: "12 Online",
      status: "online",
      icon: Server,
    },
    {
      label: "Tickets",
      value: "46 Open",
      status: "warning",
      icon: Ticket,
    },
    {
      label: "Network",
      value: "Stable",
      status: "online",
      icon: Network,
    },
    {
      label: "Users",
      value: "128 Active",
      status: "online",
      icon: Users,
    },
    {
      label: "Reports",
      value: "89 Total",
      status: "online",
      icon: FileText,
    },
    {
      label: "System Load",
      value: "78%",
      status: "warning",
      icon: Activity,
    },
  ]
  const recentActivity: ActivityItem[] = [
    {
      id: "1",
      message: "Server Web01 restarted by Admin",
      timestamp: "2 minutes ago",
      type: "server",
    },
    {
      id: "2",
      message: "Ticket #1042: Printer not working",
      timestamp: "15 minutes ago",
      type: "ticket",
      status: "Open",
    },
    {
      id: "3",
      message: "New user John Doe added",
      timestamp: "1 hour ago",
      type: "user",
    },
    {
      id: "4",
      message: "Backup completed for DB01",
      timestamp: "2 hours ago",
      type: "backup",
    },
    {
      id: "5",
      message: "Network maintenance scheduled",
      timestamp: "3 hours ago",
      type: "server",
    },
    {
      id: "6",
      message: "Ticket #1041: Email access issue",
      timestamp: "4 hours ago",
      type: "ticket",
      status: "Resolved",
    },
  ]
  // Simulate loading
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        setError("Could not load dashboard data.")
        console.error("Failed to load dashboard", error)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])
  if (loading) {
    return (
      <div className="flex justify-center items-center p-16">
        <Loader2 size={32} className="animate-spin" />
      </div>
    )
  }
  if (error) {
    return <div className="p-8 text-red-600 bg-red-50 rounded-lg">{error}</div>
  }
  const getStatusColor = (status: string) => {
    // All status icons/text will now be custom-blue
    return "text-custom-blue"
  }
  const getStatusBgColor = (status: string) => {
    // All status backgrounds will now be custom-blue/10
    return "bg-custom-blue/10"
  }
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "server":
        return <Server className="h-4 w-4" />
      case "ticket":
        return <Ticket className="h-4 w-4" />
      case "user":
        return <Users className="h-4 w-4" />
      case "backup":
        return <FileText className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-lg bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, Prima!</h2>
        <p className="text-gray-300 mb-4">Here's what's happening in your system today.</p>
        <div className="flex gap-3">
          <Button size="lg" className="bg-white text-black hover:bg-gray-100">
            <Plus className="mr-2 h-4 w-4" />
            Add Ticket
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-black bg-transparent"
          >
            <Search className="mr-2 h-4 w-4" />
            System Scan
          </Button>
        </div>
      </div>
      {/* System Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {systemMetrics.map((metric, index) => (
          <Card key={index} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className={`p-2 rounded-lg ${getStatusBgColor(metric.status)}`}>
                <metric.icon className={`h-4 w-4 ${getStatusColor(metric.status)}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Server Load Chart */}
        <Card className="col-span-4 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Server Load (This Week)</CardTitle>
            <CardDescription>System performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Web01</span>
                <div className="flex items-center space-x-2">
                  <Progress value={78} className="w-32 [&>*]:bg-custom-blue dark:[&>*]:bg-custom-blue" />
                  <span className="text-sm text-muted-foreground">78%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">DB01</span>
                <div className="flex items-center space-x-2">
                  <Progress value={45} className="w-32 [&>*]:bg-custom-blue dark:[&>*]:bg-custom-blue" />
                  <span className="text-sm text-muted-foreground">45%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">App01</span>
                <div className="flex items-center space-x-2">
                  <Progress value={92} className="w-32 [&>*]:bg-custom-blue dark:[&>*]:bg-custom-blue" />
                  <span className="text-sm text-muted-foreground">92%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Ticket Statistics */}
        <Card className="col-span-3 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Ticket Statistics</CardTitle>
            <CardDescription>Support ticket overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Open Tickets</span>
                <Badge className="bg-custom-blue text-white">46</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">In Progress</span>
                <Badge className="bg-muted/30 text-muted-foreground">12</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Resolved Today</span>
                <Badge className="bg-custom-blue text-white">8</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Average Response</span>
                <Badge variant="outline" className="bg-muted/30 text-muted-foreground">
                  2.3h
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Recent Activity */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Activity</CardTitle>
          <CardDescription>Latest system events and actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-muted/30"
              >
                <div className={`p-2 rounded-lg bg-custom-blue/10`}>
                  {/* Icon color is handled by the parent div's text color */}
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                </div>
                {activity.status && (
                  <Badge
                    variant={activity.status === "Open" ? "default" : "default"} // Use default for both, then apply custom classes
                    className={
                      activity.status === "Open" ? "bg-custom-blue text-white" : "bg-muted/30 text-muted-foreground"
                    }
                  >
                    {activity.status}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Quick Actions</CardTitle>
          <CardDescription>Common IT support tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <Plus className="h-6 w-6" />
              Add Ticket
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <Server className="h-6 w-6" />
              Add Server
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <Search className="h-6 w-6" />
              Run Scan
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <Download className="h-6 w-6" />
              Download Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
