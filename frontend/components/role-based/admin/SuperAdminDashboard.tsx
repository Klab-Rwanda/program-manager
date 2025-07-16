"use client"
import { useState, useEffect, useCallback } from "react"
import {
  BookOpen,
  Users,
  UserCheck,
  Clock,
  Loader2,
  Eye,
  Plus,
  Mail,
  Briefcase,
  Calendar,
  Activity,
  FileText,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Types based on the original JavaScript structure
interface DashboardStats {
  totalPrograms: number
  activeTrainees: number
  totalUsers: number
  pendingApprovals: number
}

interface User {
  id: string
  name: string
  role: string
  dateAdded: string
  email?: string
  status?: string
  avatar?: string
  assignedManager?: { _id: string; name: string }
  programs?: Array<{ name: string }>
  createdAt?: string
  activityFeed?: Array<{
    id: string
    type: string
    text: string
    timestamp: string
  }>
}

interface ProgramManager {
  id: string
  name: string
  email: string
}

export function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [availableManagers, setAvailableManagers] = useState<ProgramManager[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // User detail panel state
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [selectedManagerId, setSelectedManagerId] = useState("")
  const [isAssigning, setIsAssigning] = useState(false)

  // Mock data based on the original structure
  const mockStats: DashboardStats = {
    totalPrograms: 24,
    activeTrainees: 248,
    totalUsers: 1247,
    pendingApprovals: 8,
  }

  const mockRecentUsers: User[] = [
    {
      id: "1",
      name: "John Doe",
      role: "Facilitator",
      dateAdded: "2024-01-15",
      email: "john@klab.rw",
      status: "Active",
      assignedManager: { _id: "1", name: "Manager One" },
      programs: [{ name: "Web Development" }],
      createdAt: "2024-01-15T10:00:00Z",
      activityFeed: [
        { id: "1", type: "Attendance", text: "Marked attendance for React session", timestamp: "2024-01-20T14:30:00Z" },
        { id: "2", type: "Submission", text: "Submitted course materials", timestamp: "2024-01-19T16:00:00Z" },
      ],
    },
    {
      id: "2",
      name: "Alice Johnson",
      role: "Trainee",
      dateAdded: "2024-01-14",
      email: "alice@klab.rw",
      status: "Active",
      programs: [{ name: "Data Science" }],
      createdAt: "2024-01-14T09:00:00Z",
      activityFeed: [
        { id: "3", type: "Attendance", text: "Attended Python workshop", timestamp: "2024-01-20T10:00:00Z" },
      ],
    },
    {
      id: "3",
      name: "Bob Smith",
      role: "Program Manager",
      dateAdded: "2024-01-13",
      email: "bob@klab.rw",
      status: "Inactive",
      createdAt: "2024-01-13T11:00:00Z",
    },
    {
      id: "4",
      name: "Sarah Wilson",
      role: "Facilitator",
      dateAdded: "2024-01-12",
      email: "sarah@klab.rw",
      status: "Active",
      assignedManager: { _id: "2", name: "Manager Two" },
      programs: [{ name: "UI/UX Design" }],
      createdAt: "2024-01-12T13:00:00Z",
      activityFeed: [
        { id: "4", type: "Submission", text: "Updated design portfolio", timestamp: "2024-01-20T15:00:00Z" },
      ],
    },
    {
      id: "5",
      name: "Mike Brown",
      role: "Trainee",
      dateAdded: "2024-01-11",
      email: "mike@klab.rw",
      status: "Active",
      programs: [{ name: "Mobile Development" }],
      createdAt: "2024-01-11T08:00:00Z",
    },
  ]

  const mockManagers: ProgramManager[] = [
    { id: "1", name: "Manager One", email: "manager1@klab.rw" },
    { id: "2", name: "Manager Two", email: "manager2@klab.rw" },
    { id: "3", name: "Manager Three", email: "manager3@klab.rw" },
  ]

  // Simulate the original fetchDashboardData function
  const fetchDashboardData = useCallback(async () => {
    try {
      // Simulate API calls
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setStats(mockStats)
      setRecentUsers(mockRecentUsers)
      setAvailableManagers(mockManagers)
    } catch (err) {
      setError("Could not load dashboard data. Please try again later.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleUserClick = async (user: User) => {
    setIsDetailOpen(true)
    setIsDetailLoading(true)
    try {
      // Simulate API call to get detailed user data
      await new Promise((resolve) => setTimeout(resolve, 500))
      setSelectedUser(user)
      setSelectedManagerId(user.assignedManager?._id || "none")
    } catch (err) {
      alert("Could not load user details.")
      setIsDetailOpen(false)
    } finally {
      setIsDetailLoading(false)
    }
  }

  const handleCloseDetail = () => {
    setIsDetailOpen(false)
    setTimeout(() => {
      setSelectedUser(null)
      setSelectedManagerId("")
    }, 300)
  }

  const handleAssignManager = async () => {
    if (!selectedUser) return

    setIsAssigning(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      alert("Manager assignment updated successfully!")
      fetchDashboardData() // Refresh data
    } catch (err) {
      alert("Failed to assign manager.")
    } finally {
      setIsAssigning(false)
    }
  }

  const timeAgo = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + " years ago"
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + " months ago"
    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + " days ago"
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + " hours ago"
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + " minutes ago"
    return Math.floor(seconds) + " seconds ago"
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "Attendance":
        return Calendar
      case "Submission":
        return FileText
      default:
        return Activity
    }
  }

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

  const systemStats = [
    {
      title: "Total Programs",
      value: stats?.totalPrograms.toString() || "0",
      change: "+3 this month",
      icon: BookOpen,
      color: "text-custom-blue",
      bgColor: "bg-muted/30", // Changed to grey background
    },
    {
      title: "Active Trainees",
      value: stats?.activeTrainees.toString() || "0",
      change: "+18 from last month",
      icon: Users,
      color: "text-custom-blue", // Changed to custom-blue
      bgColor: "bg-muted/30", // Changed to grey background
    },
    {
      title: "Total Users",
      value: stats?.totalUsers.toString() || "0",
      change: "+12 this month",
      icon: UserCheck,
      color: "text-custom-blue", // Changed to custom-blue
      bgColor: "bg-muted/30", // Changed to grey background
    },
    {
      title: "Pending Approvals",
      value: stats?.pendingApprovals.toString() || "0",
      change: "Require attention",
      icon: Clock,
      color: "text-custom-blue", // Changed to custom-blue
      bgColor: "bg-muted/30", // Changed to grey background
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-lg bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, Super Admin!</h2>
        <p className="text-gray-300 mb-4">
          Comprehensive system overview and management dashboard. Monitor all activities across kLab.
        </p>
        <div className="flex gap-3">
          <Button size="lg" className="bg-white text-black hover:bg-gray-100">
            <Plus className="mr-2 h-4 w-4" />
            Add New User
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-black bg-transparent"
          >
            <Users className="mr-2 h-4 w-4" />
            Manage Users
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {systemStats.map((stat, index) => (
          <Card key={index} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p
                className={`text-xs mt-1 ${stat.title === "Pending Approvals" ? "text-muted-foreground" : stat.change.startsWith("+") ? "text-custom-blue" : "text-muted-foreground"}`}
              >
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Users Table */}
        <Card className="col-span-4 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Users</CardTitle>
            <CardDescription>Latest user registrations and activities</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned Program</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback className="text-xs">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.programs?.map((p) => p.name).join(", ") || "None"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "text-xs",
                          user.status === "Active"
                            ? "bg-custom-blue text-white"
                            : "bg-secondary text-secondary-foreground",
                        )}
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.dateAdded}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleUserClick(user)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Available Managers */}
        <Card className="col-span-3 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Available Managers</CardTitle>
            <CardDescription>Program managers ready for assignment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {availableManagers.map((manager) => (
                <div
                  key={manager.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm text-foreground">{manager.name}</p>
                    <p className="text-xs text-muted-foreground">{manager.email}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Available
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <Users className="h-6 w-6" />
              Manage Users
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <BookOpen className="h-6 w-6" />
              View Programs
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <Clock className="h-6 w-6" />
              Pending Approvals
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <UserCheck className="h-6 w-6" />
              System Reports
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              User Details
              <Button variant="ghost" size="sm" onClick={handleCloseDetail}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {isDetailLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 size={32} className="animate-spin" />
            </div>
          ) : selectedUser ? (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={`https://i.pravatar.cc/80?u=${selectedUser.email}`} alt={selectedUser.name} />
                  <AvatarFallback className="text-lg">
                    {selectedUser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">
                    {selectedUser.role} - <span className="capitalize">{selectedUser.status}</span>
                  </p>
                </div>
              </div>

              {/* User Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedUser.email}</span>
                </div>
                {selectedUser.programs && selectedUser.programs.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Enrolled in: {selectedUser.programs.map((p) => p.name).join(", ")}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Member since:{" "}
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>

              {/* Manager Assignment */}
              {(selectedUser.role === "Trainee" || selectedUser.role === "Facilitator") && (
                <div className="space-y-3 p-4 rounded-lg border border-border">
                  <h4 className="font-medium text-foreground">Assigned Program Manager</h4>
                  <div className="flex gap-2">
                    <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Manager Assigned</SelectItem>
                        {availableManagers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleAssignManager}
                      disabled={isAssigning || selectedManagerId === (selectedUser.assignedManager?._id || "none")}
                    >
                      {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Recent Activity</h4>
                <div className="space-y-2">
                  {selectedUser.activityFeed && selectedUser.activityFeed.length > 0 ? (
                    selectedUser.activityFeed.map((activity) => {
                      const IconComponent = getActivityIcon(activity.type)
                      return (
                        <div
                          key={activity.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
                        >
                          <div className="p-2 rounded-lg bg-custom-blue/10">
                            <IconComponent className="h-4 w-4 text-custom-blue" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-foreground">{activity.text}</p>
                            <p className="text-xs text-muted-foreground">{timeAgo(activity.timestamp)}</p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent activity found for this user.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Select a user to see their details.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
