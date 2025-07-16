"use client"

import { useState } from "react"
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Award,
  Send,
  XCircle,
  Calendar,
  BookOpen,
  UserPlus,
  Settings,
  MessageSquare,
  Tag,
  User,
  Server,
  Monitor,
  Wrench,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Ticket {
  id: number
  title: string
  description: string
  category: string
  priority: string
  status: string
  assignedTo: string
  createdBy: string
  createdAt: string
  updatedAt: string
  dueDate?: string
  resolution?: string
  comments: Array<{
    id: number
    author: string
    message: string
    timestamp: string
  }>
}

export default function SupportTicketsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [activeTab, setActiveTab] = useState("open")

  const [tickets] = useState<Ticket[]>([
    {
      id: 1,
      title: "Printer not working in Lab 3",
      description: "The HP LaserJet printer in Lab 3 is showing an error message and not printing any documents. Students are unable to print their assignments.",
      category: "Hardware",
      priority: "high",
      status: "open",
      assignedTo: "John Smith",
      createdBy: "Alice Johnson",
      createdAt: "2024-01-20 10:30 AM",
      updatedAt: "2024-01-20 11:45 AM",
      dueDate: "2024-01-21",
      comments: [
        {
          id: 1,
          author: "Alice Johnson",
          message: "The printer was working fine yesterday. This morning it started showing 'Paper Jam' error.",
          timestamp: "2024-01-20 10:30 AM",
        },
        {
          id: 2,
          author: "John Smith",
          message: "I'll check the printer this afternoon. Please try using Lab 2 printer in the meantime.",
          timestamp: "2024-01-20 11:45 AM",
        },
      ],
    },
    {
      id: 2,
      title: "Wi-Fi connection issues in Building A",
      description: "Students and staff are experiencing intermittent Wi-Fi connectivity issues in Building A. Connection drops frequently and speeds are very slow.",
      category: "Network",
      priority: "high",
      status: "in_progress",
      assignedTo: "Sarah Wilson",
      createdBy: "Mike Davis",
      createdAt: "2024-01-19 09:15 AM",
      updatedAt: "2024-01-20 02:30 PM",
      dueDate: "2024-01-22",
      comments: [
        {
          id: 1,
          author: "Mike Davis",
          message: "The Wi-Fi has been unstable since yesterday morning. Multiple users reporting the same issue.",
          timestamp: "2024-01-19 09:15 AM",
        },
        {
          id: 2,
          author: "Sarah Wilson",
          message: "Investigating the issue. It appears to be related to the access point configuration.",
          timestamp: "2024-01-20 02:30 PM",
        },
      ],
    },
    {
      id: 3,
      title: "Email login problems",
      description: "Several users are unable to log into their email accounts. Getting 'Invalid credentials' error even with correct passwords.",
      category: "Software",
      priority: "medium",
      status: "resolved",
      assignedTo: "David Brown",
      createdBy: "Emma Thompson",
      createdAt: "2024-01-18 11:20 AM",
      updatedAt: "2024-01-19 03:45 PM",
      resolution: "Password policy was updated. Users needed to reset their passwords.",
      comments: [
        {
          id: 1,
          author: "Emma Thompson",
          message: "I can't access my email account. The password I'm using is definitely correct.",
          timestamp: "2024-01-18 11:20 AM",
        },
        {
          id: 2,
          author: "David Brown",
          message: "This is affecting multiple users. Investigating the authentication system.",
          timestamp: "2024-01-18 02:15 PM",
        },
        {
          id: 3,
          author: "David Brown",
          message: "Issue resolved. Password policy was updated yesterday. Please reset your password.",
          timestamp: "2024-01-19 03:45 PM",
        },
      ],
    },
    {
      id: 4,
      title: "Projector bulb replacement needed",
      description: "The projector in Conference Room 2 has a dim display and needs bulb replacement.",
      category: "Hardware",
      priority: "low",
      status: "open",
      assignedTo: "Unassigned",
      createdBy: "Lisa Chen",
      createdAt: "2024-01-20 08:45 AM",
      updatedAt: "2024-01-20 08:45 AM",
      dueDate: "2024-01-25",
      comments: [
        {
          id: 1,
          author: "Lisa Chen",
          message: "The projector display is very dim and hard to see. Probably needs a new bulb.",
          timestamp: "2024-01-20 08:45 AM",
        },
      ],
    },
    {
      id: 5,
      title: "Software installation request",
      description: "Need Adobe Creative Suite installed on 5 computers in the Design Lab.",
      category: "Software",
      priority: "medium",
      status: "in_progress",
      assignedTo: "John Smith",
      createdBy: "Professor Rodriguez",
      createdAt: "2024-01-17 03:30 PM",
      updatedAt: "2024-01-20 10:15 AM",
      dueDate: "2024-01-24",
      comments: [
        {
          id: 1,
          author: "Professor Rodriguez",
          message: "The design students need Adobe Creative Suite for their projects. Can this be installed by next week?",
          timestamp: "2024-01-17 03:30 PM",
        },
        {
          id: 2,
          author: "John Smith",
          message: "I'll start the installation process tomorrow. Should be completed by Friday.",
          timestamp: "2024-01-20 10:15 AM",
        },
      ],
    },
  ])

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus
    const matchesPriority = filterPriority === "all" || ticket.priority === filterPriority
    const matchesCategory = filterCategory === "all" || ticket.category === filterCategory
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Open</Badge>
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">In Progress</Badge>
      case "resolved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Resolved</Badge>
      case "closed":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Closed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>
      case "low":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Low</Badge>
      default:
        return <Badge variant="secondary">{priority}</Badge>
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Hardware":
        return <Server className="h-4 w-4" />
      case "Software":
        return <Monitor className="h-4 w-4" />
      case "Network":
        return <Wrench className="h-4 w-4" />
      default:
        return <Tag className="h-4 w-4" />
    }
  }

  const handleCreateTicket = () => {
    // Implementation for creating ticket
    setShowCreateModal(false)
  }

  const handleUpdateTicket = () => {
    // Implementation for updating ticket
    setShowEditModal(false)
  }

  const ticketStats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    inProgress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground">
            Manage and track support tickets and technical issues
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Ticket
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketStats.total}</div>
            <p className="text-xs text-muted-foreground">
              All tickets
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{ticketStats.open}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{ticketStats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Being worked on
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{ticketStats.resolved}</div>
            <p className="text-xs text-muted-foreground">
              Completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter tickets by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Search tickets..."
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
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Hardware">Hardware</SelectItem>
                <SelectItem value="Software">Software</SelectItem>
                <SelectItem value="Network">Network</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="open">Open ({ticketStats.open})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({ticketStats.inProgress})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({ticketStats.resolved})</TabsTrigger>
          <TabsTrigger value="all">All ({ticketStats.total})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="grid gap-4">
            {filteredTickets
              .filter(ticket => activeTab === "all" || ticket.status === activeTab)
              .map((ticket) => (
                <Card key={ticket.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getCategoryIcon(ticket.category)}
                        <div>
                          <CardTitle className="text-lg">{ticket.title}</CardTitle>
                          <CardDescription>#{ticket.id} • {ticket.category}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">{ticket.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>Created by: {ticket.createdBy}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>Assigned to: {ticket.assignedTo}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Created: {ticket.createdAt}</span>
                        </div>
                        {ticket.dueDate && (
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>Due: {ticket.dueDate}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTicket(ticket)
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
                            setSelectedTicket(ticket)
                            setShowEditModal(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Send className="h-4 w-4 mr-2" />
                          Reply
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Ticket Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Ticket</DialogTitle>
            <DialogDescription>
              Create a new support ticket for technical issues
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Brief description of the issue" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the problem..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="network">Network</SelectItem>
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
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTicket}>
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Ticket Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.title}</DialogTitle>
            <DialogDescription>
              Ticket #{selectedTicket?.id} • {selectedTicket?.category}
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                </div>
                <div>
                  <Label>Priority</Label>
                  <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
                </div>
                <div>
                  <Label>Created By</Label>
                  <p className="text-sm mt-1">{selectedTicket.createdBy}</p>
                </div>
                <div>
                  <Label>Assigned To</Label>
                  <p className="text-sm mt-1">{selectedTicket.assignedTo}</p>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-sm mt-1">{selectedTicket.createdAt}</p>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <p className="text-sm mt-1">{selectedTicket.updatedAt}</p>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <p className="text-sm mt-1 bg-gray-50 p-3 rounded-lg">
                  {selectedTicket.description}
                </p>
              </div>

              {selectedTicket.resolution && (
                <div>
                  <Label>Resolution</Label>
                  <p className="text-sm mt-1 bg-green-50 p-3 rounded-lg">
                    {selectedTicket.resolution}
                  </p>
                </div>
              )}

              <div>
                <Label>Comments ({selectedTicket.comments.length})</Label>
                <div className="space-y-3 mt-2">
                  {selectedTicket.comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                      </div>
                      <p className="text-sm">{comment.message}</p>
                    </div>
                  ))}
                </div>
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