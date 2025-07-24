// app/dashboard/It-support/maintenance/page.tsx
"use client"

import { useState, useEffect } from "react"
import {
  Wrench,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Server,
  Network,
  Database, // Not directly used in current mock data, but good icon
  Monitor, // Not directly used in current mock data, but good icon
  Settings,
  Download,
  Upload,
  RefreshCw,
  Power, // For "Start" task button
  Shield, // For firewall icon
  Activity,
  Loader2 // Added Loader2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner" // Import toast

import { useAuth } from "@/lib/contexts/RoleContext" // Import useAuth for role check

// Interface for mock MaintenanceTask data
interface MaintenanceTask {
  id: string
  title: string
  description: string
  type: "scheduled" | "emergency" | "routine" | "upgrade"
  status: "pending" | "in_progress" | "completed" | "cancelled"
  priority: "low" | "medium" | "high" | "critical"
  assignedTo: string
  scheduledDate: string // Will be YYYY-MM-DDTHH:MM format for datetime-local input
  estimatedDuration: string
  affectedSystems: string[]
  impact: "low" | "medium" | "high"
  notes: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

// Interface for mock SystemUpdate data
interface SystemUpdate {
  id: string
  name: string
  version: string
  type: "security" | "feature" | "bugfix" | "major"
  status: "available" | "downloading" | "installing" | "completed" | "failed"
  size: string
  releaseDate: string
  description: string
  affectedSystems: string[]
  requiresRestart: boolean
}

export default function MaintenancePage() {
  const { user, role, loading: authLoading } = useAuth(); // Get user and role from context

  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false) // For editing mock tasks
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null)
  const [activeTab, setActiveTab] = useState("tasks") // Default to 'tasks'

  // Mock data (managed locally)
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([
    {
      id: "1", title: "Database Server Backup", description: "Perform full backup of all databases and verify backup integrity", type: "routine", status: "completed", priority: "medium", assignedTo: "John Smith", scheduledDate: "2024-01-20T02:00", estimatedDuration: "2 hours", affectedSystems: ["DB01", "Backup01"], impact: "low", notes: "Backup completed successfully. All databases backed up and verified.", createdAt: "2024-01-19 10:00 AM", updatedAt: "2024-01-20 04:15 AM", completedAt: "2024-01-20 04:15 AM"
    },
    {
      id: "2", title: "Network Infrastructure Upgrade", description: "Upgrade core network switches and update firmware", type: "upgrade", status: "in_progress", priority: "high", assignedTo: "Sarah Wilson", scheduledDate: "2024-01-21T22:00", estimatedDuration: "4 hours", affectedSystems: ["Router01", "Switch01", "Firewall01"], impact: "high", notes: "Starting with Router01. Will proceed with other devices after testing.", createdAt: "2024-01-18 02:30 PM", updatedAt: "2024-01-21 10:30 PM"
    },
    {
      id: "3", title: "Security Patch Installation", description: "Install critical security patches on all servers", type: "emergency", status: "pending", priority: "critical", assignedTo: "David Brown", scheduledDate: "2024-01-22T06:00", estimatedDuration: "3 hours", affectedSystems: ["Web01", "DB01", "App01", "Backup01"], impact: "medium", notes: "Critical security vulnerability discovered. Immediate action required.", createdAt: "2024-01-21 08:00 PM", updatedAt: "2024-01-21 08:00 PM"
    },
    {
      id: "4", title: "Storage System Maintenance", description: "Clean up old log files and optimize storage performance", type: "routine", status: "pending", priority: "low", assignedTo: "Mike Davis", scheduledDate: "2024-01-23T01:00", estimatedDuration: "1 hour", affectedSystems: ["Backup01"], impact: "low", notes: "Routine maintenance to free up storage space.", createdAt: "2024-01-20 11:00 AM", updatedAt: "2024-01-20 11:00 AM"
    },
    {
      id: "5", title: "Load Balancer Configuration", description: "Update load balancer configuration for new application deployment", type: "scheduled", status: "pending", priority: "medium", assignedTo: "Lisa Chen", scheduledDate: "2024-01-24T21:00", estimatedDuration: "2 hours", affectedSystems: ["Web01", "App01"], impact: "medium", notes: "Configuration changes needed for new application deployment.", createdAt: "2024-01-21 03:00 PM", updatedAt: "2024-01-21 03:00 PM"
    }
  ]);

  const [systemUpdates, setSystemUpdates] = useState<SystemUpdate[]>([
    {
      id: "1", name: "Security Patch KB2024-001", version: "1.2.3", type: "security", status: "available", size: "45 MB", releaseDate: "2024-01-20", description: "Critical security patch addressing CVE-2024-1234", affectedSystems: ["Web01", "DB01", "App01"], requiresRestart: true
    },
    {
      id: "2", name: "Database Engine Update", version: "2.1.0", type: "major", status: "downloading", size: "120 MB", releaseDate: "2024-01-19", description: "Major database engine update with performance improvements", affectedSystems: ["DB01"], requiresRestart: true
    },
    {
      id: "3", name: "Monitoring Agent Update", version: "3.0.1", type: "feature", status: "completed", size: "15 MB", releaseDate: "2024-01-18", description: "New monitoring features and bug fixes", affectedSystems: ["Web01", "DB01", "App01", "Backup01"], requiresRestart: false
    },
    {
      id: "4", name: "Network Driver Update", version: "1.5.2", type: "bugfix", status: "available", size: "8 MB", releaseDate: "2024-01-17", description: "Bug fix for network connectivity issues", affectedSystems: ["Router01", "Switch01"], requiresRestart: true
    }
  ]);

  // Form state for creating/editing tasks
  const [newTaskData, setNewTaskData] = useState<Omit<MaintenanceTask, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>>({
    title: "", description: "", type: "scheduled", status: "pending", priority: "medium", assignedTo: "", scheduledDate: "", estimatedDuration: "", affectedSystems: [], impact: "low", notes: ""
  });
  const [editTaskData, setEditTaskData] = useState<MaintenanceTask | null>(null);

  const [isProcessing, setIsProcessing] = useState(false); // For mock loading state of actions

  // Filter logic for tasks
  const filteredTasks = maintenanceTasks.filter((task) => {
    const matchesSearch = searchTerm === '' || task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
    const matchesType = filterType === "all" || task.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  // UI Helpers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      case "in_progress": return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>
      case "completed": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
      case "cancelled": return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>
      default: return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical": return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Critical</Badge>
      case "high": return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">High</Badge>
      case "medium": return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>
      case "low": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Low</Badge>
      default: return <Badge variant="secondary">{priority}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "scheduled": return <Calendar className="h-4 w-4" />
      case "emergency": return <AlertTriangle className="h-4 w-4" />
      case "routine": return <Wrench className="h-4 w-4" />
      case "upgrade": return <Upload className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const getUpdateStatusIcon = (status: string) => {
    switch (status) {
      case "available": return <Download className="h-4 w-4 text-blue-600" />
      case "downloading": return <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />
      case "installing": return <Settings className="h-4 w-4 text-orange-600" />
      case "completed": return <CheckCircle className="h-4 w-4 text-green-600" />
      case "failed": return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getUpdateTypeBadge = (type: string) => {
    switch (type) {
      case "security": return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Security</Badge>
      case "feature": return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Feature</Badge>
      case "bugfix": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Bug Fix</Badge>
      case "major": return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Major</Badge>
      default: return <Badge variant="secondary">{type}</Badge>
    }
  }

  // Calculate stats from mock data
  const taskStats = {
    total: maintenanceTasks.length,
    pending: maintenanceTasks.filter(t => t.status === "pending").length,
    inProgress: maintenanceTasks.filter(t => t.status === "in_progress").length,
    completed: maintenanceTasks.filter(t => t.status === "completed").length,
  }

  const updateStats = {
    total: systemUpdates.length,
    available: systemUpdates.filter(u => u.status === "available").length,
    inProgress: systemUpdates.filter(u => u.status === "downloading" || u.status === "installing").length,
    completed: systemUpdates.filter(u => u.status === "completed").length,
  }

  // Render nothing or a loading spinner if authentication is still loading
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Access control: Only IT Support or Super Admin should see this page
  if (!user || (role !== 'it_support' && role !== 'super_admin')) {
    return (
        <Card>
            <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">You do not have permission to view this page.</p></CardContent>
        </Card>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-muted-foreground">
            Manage scheduled maintenance tasks and system updates
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Maintenance
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.total}</div>
            <p className="text-xs text-muted-foreground">
              Maintenance tasks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{taskStats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting execution
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Successfully finished
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Maintenance Tasks ({taskStats.total})</TabsTrigger>
          <TabsTrigger value="updates">System Updates ({updateStats.total})</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Filter maintenance tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="upgrade">Upgrade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tasks List */}
          <div className="space-y-4">
            {filteredTasks.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        <Wrench className="mx-auto h-12 w-12 mb-4" />
                        No maintenance tasks found.
                    </CardContent>
                </Card>
            ) : (
                filteredTasks.map((task) => (
                  <Card key={task.id} className="relative">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getTypeIcon(task.type)}
                          <div>
                            <CardTitle className="text-lg">{task.title}</CardTitle>
                            <CardDescription>#{task.id} • {task.type}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(task.status)}
                          {getPriorityBadge(task.priority)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">{task.description}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Scheduled: {task.scheduledDate}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>Duration: {task.estimatedDuration}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Server className="h-4 w-4 text-muted-foreground" />
                            <span>Assigned: {task.assignedTo}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            <span>Impact: {task.impact}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-sm font-medium">Affected Systems:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {task.affectedSystems.map((system) => (
                              <Badge key={system} variant="outline">
                                {system}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            type="button" // Added type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTask(task)
                              setShowViewModal(true)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button
                            type="button" // Added type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTask(task)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button type="button" variant="outline" size="sm">
                            <Power className="h-4 w-4 mr-2" />
                            Start
                          </Button>
                          <Button
                              type="button" // Added type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTask(task.id)}
                              disabled={isProcessing}
                          >
                              {isProcessing && selectedTask?.id === task.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="updates" className="space-y-4">
          <div className="space-y-4">
            {systemUpdates.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        <Upload className="mx-auto h-12 w-12 mb-4" />
                        No system updates available.
                    </CardContent>
                </Card>
            ) : (
                systemUpdates.map((update) => (
                  <Card key={update.id} className="relative">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getUpdateStatusIcon(update.status)}
                          <div>
                            <CardTitle className="text-lg">{update.name}</CardTitle>
                            <CardDescription>Version {update.version} • {update.size}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getUpdateTypeBadge(update.type)}
                          {update.requiresRestart && (
                            <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                              Restart Required
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">{update.description}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Released: {update.releaseDate}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Server className="h-4 w-4 text-muted-foreground" />
                            <span>Systems: {update.affectedSystems.length}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Download className="h-4 w-4 text-muted-foreground" />
                            <span>Size: {update.size}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span>Status: {update.status}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-sm font-medium">Affected Systems:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {update.affectedSystems.map((system) => (
                              <Badge key={system} variant="outline">
                                {system}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          {update.status === "available" && (
                            <Button type="button" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Install Update
                            </Button>
                          )}
                          {update.status === "downloading" && (
                            <Button type="button" variant="outline" size="sm" disabled>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Downloading...
                            </Button>
                          )}
                          {update.status === "installing" && (
                            <Button type="button" variant="outline" size="sm" disabled>
                              <Settings className="h-4 w-4 mr-2 animate-spin" />
                              Installing...
                            </Button>
                          )}
                          {update.status === "completed" && (
                            <Button type="button" variant="outline" size="sm" disabled>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Installed
                            </Button>
                          )}
                          <Button type="button" variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Task Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Maintenance Task</DialogTitle>
            <DialogDescription>
              Create a new maintenance task
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Maintenance task title"
                     value={newTaskData.title}
                     onChange={(e) => setNewTaskData(p => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the maintenance task..."
                rows={4}
                value={newTaskData.description}
                onChange={(e) => setNewTaskData(p => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={newTaskData.type} onValueChange={(val) => setNewTaskData(p => ({ ...p, type: val as "scheduled" | "emergency" | "routine" | "upgrade" }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="upgrade">Upgrade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={newTaskData.priority} onValueChange={(val) => setNewTaskData(p => ({ ...p, priority: val as "low" | "medium" | "high" | "critical" }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <Input id="scheduledDate" type="datetime-local"
                       value={newTaskData.scheduledDate}
                       onChange={(e) => setNewTaskData(p => ({ ...p, scheduledDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="duration">Estimated Duration</Label>
                <Input id="duration" placeholder="e.g., 2 hours"
                       value={newTaskData.estimatedDuration}
                       onChange={(e) => setNewTaskData(p => ({ ...p, estimatedDuration: e.target.value }))}
                />
              </div>
            </div>
            <div>
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input id="assignedTo" placeholder="e.g., John Doe"
                       value={newTaskData.assignedTo}
                       onChange={(e) => setNewTaskData(p => ({ ...p, assignedTo: e.target.value }))}
                />
            </div>
            <div>
                <Label htmlFor="affectedSystems">Affected Systems (comma-separated)</Label>
                <Input id="affectedSystems" placeholder="e.g., Web01, DB01"
                       value={newTaskData.affectedSystems.join(', ')}
                       onChange={(e) => setNewTaskData(p => ({ ...p, affectedSystems: e.target.value.split(',').map(s => s.trim()) }))}
                />
            </div>
            <div>
                <Label htmlFor="impact">Impact</Label>
                <Select value={newTaskData.impact} onValueChange={(val) => setNewTaskData(p => ({ ...p, impact: val as "low" | "medium" | "high" }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select impact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="Any additional notes..." rows={2}
                          value={newTaskData.notes}
                          onChange={(e) => setNewTaskData(p => ({ ...p, notes: e.target.value }))}
                />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
                          <Button onClick={handleCreateTask} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Schedule Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Maintenance Task</DialogTitle>
            <DialogDescription>
              Update the details of the maintenance task.
            </DialogDescription>
          </DialogHeader>
          {editTaskData && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" placeholder="Maintenance task title"
                       value={editTaskData.title}
                       onChange={(e) => setEditTaskData(p => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Detailed description of the maintenance task..."
                  rows={4}
                  value={editTaskData.description}
                  onChange={(e) => setEditTaskData(p => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-type">Type</Label>
                  <Select value={editTaskData.type} onValueChange={(val) => setEditTaskData(p => ({ ...p, type: val as "scheduled" | "emergency" | "routine" | "upgrade" }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="upgrade">Upgrade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select value={editTaskData.priority} onValueChange={(val) => setEditTaskData(p => ({ ...p, priority: val as "low" | "medium" | "high" | "critical" }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-scheduledDate">Scheduled Date</Label>
                  <Input id="edit-scheduledDate" type="datetime-local"
                         value={editTaskData.scheduledDate}
                         onChange={(e) => setEditTaskData(p => ({ ...p, scheduledDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-estimatedDuration">Estimated Duration</Label>
                  <Input id="edit-estimatedDuration" placeholder="e.g., 2 hours"
                         value={editTaskData.estimatedDuration}
                         onChange={(e) => setEditTaskData(p => ({ ...p, estimatedDuration: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-assignedTo">Assigned To</Label>
                <Input id="edit-assignedTo" placeholder="e.g., John Doe"
                       value={editTaskData.assignedTo}
                       onChange={(e) => setEditTaskData(p => ({ ...p, assignedTo: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-affectedSystems">Affected Systems (comma-separated)</Label>
                <Input id="edit-affectedSystems" placeholder="e.g., Web01, DB01"
                       value={editTaskData.affectedSystems.join(', ')}
                       onChange={(e) => setEditTaskData(p => ({ ...p, affectedSystems: e.target.value.split(',').map(s => s.trim()) }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-impact">Impact</Label>
                <Select value={editTaskData.impact} onValueChange={(val) => setEditTaskData(p => ({ ...p, impact: val as "low" | "medium" | "high" }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select impact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea id="edit-notes" placeholder="Any additional notes..." rows={2}
                          value={editTaskData.notes}
                          onChange={(e) => setEditTaskData(p => ({ ...p, notes: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editTaskData.status} onValueChange={(val) => setEditTaskData(p => ({ ...p, status: val as "pending" | "in_progress" | "completed" | "cancelled" }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTask} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update Task"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>


      {/* View Task Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
            <DialogDescription>
              Task #{selectedTask?.id} • {selectedTask?.type}
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedTask.status)}</div>
                </div>
                <div>
                  <Label>Priority</Label>
                  <div className="mt-1">{getPriorityBadge(selectedTask.priority)}</div>
                </div>
                <div>
                  <Label>Assigned To</Label>
                  <p className="text-sm mt-1">{selectedTask.assignedTo}</p>
                </div>
                <div>
                  <Label>Impact</Label>
                  <p className="text-sm mt-1">{selectedTask.impact}</p>
                </div>
                <div>
                  <Label>Scheduled Date</Label>
                  <p className="text-sm mt-1">{selectedTask.scheduledDate}</p>
                </div>
                <div>
                  <Label>Estimated Duration</Label>
                  <p className="text-sm mt-1">{selectedTask.estimatedDuration}</p>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <p className="text-sm mt-1 bg-gray-50 p-3 rounded-lg">
                  {selectedTask.description}
                </p>
              </div>

              <div>
                <Label>Affected Systems</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedTask.affectedSystems.map((system) => (
                    <Badge key={system} variant="outline">
                      {system}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedTask.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm mt-1 bg-blue-50 p-3 rounded-lg">
                    {selectedTask.notes}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Created</Label>
                  <p className="mt-1">{selectedTask.createdAt}</p>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <p className="mt-1">{selectedTask.updatedAt}</p>
                </div>
                {selectedTask.completedAt && (
                  <div>
                    <Label>Completed</Label>
                    <p className="mt-1">{selectedTask.completedAt}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>

            <Button onClick={() => setShowViewModal(true)}>Close</Button>

            <Button type="button" onClick={() => setShowViewModal(false)}>Close</Button>

          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}