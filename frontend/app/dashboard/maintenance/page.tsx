"use client"

import { useState } from "react"
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
  Database,
  Monitor,
  Settings,
  Download,
  Upload,
  RefreshCw,
  Power,
  Shield,
  Activity
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

interface MaintenanceTask {
  id: string
  title: string
  description: string
  type: "scheduled" | "emergency" | "routine" | "upgrade"
  status: "pending" | "in_progress" | "completed" | "cancelled"
  priority: "low" | "medium" | "high" | "critical"
  assignedTo: string
  scheduledDate: string
  estimatedDuration: string
  affectedSystems: string[]
  impact: "low" | "medium" | "high"
  notes: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

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
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null)
  const [activeTab, setActiveTab] = useState("scheduled")

  const [maintenanceTasks] = useState<MaintenanceTask[]>([
    {
      id: "1",
      title: "Database Server Backup",
      description: "Perform full backup of all databases and verify backup integrity",
      type: "routine",
      status: "completed",
      priority: "medium",
      assignedTo: "John Smith",
      scheduledDate: "2024-01-20 02:00 AM",
      estimatedDuration: "2 hours",
      affectedSystems: ["DB01", "Backup01"],
      impact: "low",
      notes: "Backup completed successfully. All databases backed up and verified.",
      createdAt: "2024-01-19 10:00 AM",
      updatedAt: "2024-01-20 04:15 AM",
      completedAt: "2024-01-20 04:15 AM"
    },
    {
      id: "2",
      title: "Network Infrastructure Upgrade",
      description: "Upgrade core network switches and update firmware",
      type: "upgrade",
      status: "in_progress",
      priority: "high",
      assignedTo: "Sarah Wilson",
      scheduledDate: "2024-01-21 10:00 PM",
      estimatedDuration: "4 hours",
      affectedSystems: ["Router01", "Switch01", "Firewall01"],
      impact: "high",
      notes: "Starting with Router01. Will proceed with other devices after testing.",
      createdAt: "2024-01-18 02:30 PM",
      updatedAt: "2024-01-21 10:30 PM"
    },
    {
      id: "3",
      title: "Security Patch Installation",
      description: "Install critical security patches on all servers",
      type: "emergency",
      status: "pending",
      priority: "critical",
      assignedTo: "David Brown",
      scheduledDate: "2024-01-22 06:00 AM",
      estimatedDuration: "3 hours",
      affectedSystems: ["Web01", "DB01", "App01", "Backup01"],
      impact: "medium",
      notes: "Critical security vulnerability discovered. Immediate action required.",
      createdAt: "2024-01-21 08:00 PM",
      updatedAt: "2024-01-21 08:00 PM"
    },
    {
      id: "4",
      title: "Storage System Maintenance",
      description: "Clean up old log files and optimize storage performance",
      type: "routine",
      status: "pending",
      priority: "low",
      assignedTo: "Mike Davis",
      scheduledDate: "2024-01-23 01:00 AM",
      estimatedDuration: "1 hour",
      affectedSystems: ["Backup01"],
      impact: "low",
      notes: "Routine maintenance to free up storage space.",
      createdAt: "2024-01-20 11:00 AM",
      updatedAt: "2024-01-20 11:00 AM"
    },
    {
      id: "5",
      title: "Load Balancer Configuration",
      description: "Update load balancer configuration for new application deployment",
      type: "scheduled",
      status: "pending",
      priority: "medium",
      assignedTo: "Lisa Chen",
      scheduledDate: "2024-01-24 09:00 PM",
      estimatedDuration: "2 hours",
      affectedSystems: ["Web01", "App01"],
      impact: "medium",
      notes: "Configuration changes needed for new application deployment.",
      createdAt: "2024-01-21 03:00 PM",
      updatedAt: "2024-01-21 03:00 PM"
    }
  ])

  const [systemUpdates] = useState<SystemUpdate[]>([
    {
      id: "1",
      name: "Security Patch KB2024-001",
      version: "1.2.3",
      type: "security",
      status: "available",
      size: "45 MB",
      releaseDate: "2024-01-20",
      description: "Critical security patch addressing CVE-2024-1234",
      affectedSystems: ["Web01", "DB01", "App01"],
      requiresRestart: true
    },
    {
      id: "2",
      name: "Database Engine Update",
      version: "2.1.0",
      type: "major",
      status: "downloading",
      size: "120 MB",
      releaseDate: "2024-01-19",
      description: "Major database engine update with performance improvements",
      affectedSystems: ["DB01"],
      requiresRestart: true
    },
    {
      id: "3",
      name: "Monitoring Agent Update",
      version: "3.0.1",
      type: "feature",
      status: "completed",
      size: "15 MB",
      releaseDate: "2024-01-18",
      description: "New monitoring features and bug fixes",
      affectedSystems: ["Web01", "DB01", "App01", "Backup01"],
      requiresRestart: false
    },
    {
      id: "4",
      name: "Network Driver Update",
      version: "1.5.2",
      type: "bugfix",
      status: "available",
      size: "8 MB",
      releaseDate: "2024-01-17",
      description: "Bug fix for network connectivity issues",
      affectedSystems: ["Router01", "Switch01"],
      requiresRestart: true
    }
  ])

  const filteredTasks = maintenanceTasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || task.status === filterStatus
    const matchesType = filterType === "all" || task.type === filterType
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Critical</Badge>
      case "high":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">High</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>
      case "low":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Low</Badge>
      default:
        return <Badge variant="secondary">{priority}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "scheduled":
        return <Calendar className="h-4 w-4" />
      case "emergency":
        return <AlertTriangle className="h-4 w-4" />
      case "routine":
        return <Wrench className="h-4 w-4" />
      case "upgrade":
        return <Upload className="h-4 w-4" />
      default:
        return <Settings className="h-4 w-4" />
    }
  }

  const getUpdateStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <Download className="h-4 w-4 text-blue-600" />
      case "downloading":
        return <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />
      case "installing":
        return <Settings className="h-4 w-4 text-orange-600" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getUpdateTypeBadge = (type: string) => {
    switch (type) {
      case "security":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Security</Badge>
      case "feature":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Feature</Badge>
      case "bugfix":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Bug Fix</Badge>
      case "major":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Major</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

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
            {filteredTasks.map((task) => (
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
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTask(task)
                          setShowEditModal(true)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Power className="h-4 w-4 mr-2" />
                        Start
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="updates" className="space-y-4">
          <div className="space-y-4">
            {systemUpdates.map((update) => (
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
                        <Button size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Install Update
                        </Button>
                      )}
                      {update.status === "downloading" && (
                        <Button variant="outline" size="sm" disabled>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Downloading...
                        </Button>
                      )}
                      {update.status === "installing" && (
                        <Button variant="outline" size="sm" disabled>
                          <Settings className="h-4 w-4 mr-2 animate-spin" />
                          Installing...
                        </Button>
                      )}
                      {update.status === "completed" && (
                        <Button variant="outline" size="sm" disabled>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Installed
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
              <Input id="title" placeholder="Maintenance task title" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the maintenance task..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select>
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
                <Select>
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
                <Input id="scheduledDate" type="datetime-local" />
              </div>
              <div>
                <Label htmlFor="duration">Estimated Duration</Label>
                <Input id="duration" placeholder="e.g., 2 hours" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button>Schedule Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Task Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl">
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
            <Button onClick={() => setShowViewModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 