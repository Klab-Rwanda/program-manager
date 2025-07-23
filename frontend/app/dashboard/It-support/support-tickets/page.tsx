// app/dashboard/It-support/support-tickets/page.tsx
"use client"

import { useState } from "react"
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Users, // Used for 'Assigned To'
  CheckCircle,
  Clock,
  AlertTriangle,
  Award, // Not used here, but in original context
  Send, // For 'Reply'
  XCircle,
  Calendar, // For 'Created' date
  BookOpen, // Not used here
  UserPlus, // Not used here
  Settings, // Not used here
  MessageSquare, // For ticket icon
  Tag, // For category filter
  User, // For 'Created By'
  Server, // For Hardware category
  Monitor, // For Software category
  Wrench, // For Network category
  Loader2 // Added Loader2
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
import { toast } from "sonner" // Import toast

import { useAuth } from "@/lib/contexts/RoleContext" // Import useAuth for role check

// Interface for mock Ticket data
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
  const { user, role, loading: authLoading } = useAuth(); // Get user and role from context

  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false) // For editing mock tickets
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [activeTab, setActiveTab] = useState("open")

  // Mock tickets data (managed locally as no backend integration for tickets)
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 1, title: "Printer not working in Lab 3", description: "The HP LaserJet printer in Lab 3 is showing an error message and not printing any documents. Students are unable to print their assignments.", category: "Hardware", priority: "high", status: "open", assignedTo: "John Smith", createdBy: "Alice Johnson", createdAt: "2024-01-20 10:30 AM", updatedAt: "2024-01-20 11:45 AM", dueDate: "2024-01-21", comments: [{ id: 1, author: "Alice Johnson", message: "The printer was working fine yesterday. This morning it started showing 'Paper Jam' error.", timestamp: "2024-01-20 10:30 AM", }, { id: 2, author: "John Smith", message: "I'll check the printer this afternoon. Please try using Lab 2 printer in the meantime.", timestamp: "2024-01-20 11:45 AM", }, ],
    },
    {
      id: 2, title: "Wi-Fi connection issues in Building A", description: "Students and staff are experiencing intermittent Wi-Fi connectivity issues in Building A. Connection drops frequently and speeds are very slow.", category: "Network", priority: "high", status: "in_progress", assignedTo: "Sarah Wilson", createdBy: "Mike Davis", createdAt: "2024-01-19 09:15 AM", updatedAt: "2024-01-20 02:30 PM", dueDate: "2024-01-22", comments: [{ id: 1, author: "Mike Davis", message: "The Wi-Fi has been unstable since yesterday morning. Multiple users reporting the same issue.", timestamp: "2024-01-19 09:15 AM", }, { id: 2, author: "Sarah Wilson", message: "Investigating the issue. It appears to be related to the access point configuration.", timestamp: "2024-01-20 02:30 PM", }, ],
    },
    {
      id: 3, title: "Email login problems", description: "Several users are unable to log into their email accounts. Getting 'Invalid credentials' error even with correct passwords.", category: "Software", priority: "medium", status: "resolved", assignedTo: "David Brown", createdBy: "Emma Thompson", createdAt: "2024-01-18 11:20 AM", updatedAt: "2024-01-19 03:45 PM", resolution: "Password policy was updated. Users needed to reset their passwords.", comments: [{ id: 1, author: "Emma Thompson", message: "I can't access my email account. The password I'm using is definitely correct.", timestamp: "2024-01-18 11:20 AM", }, { id: 2, author: "David Brown", message: "This is affecting multiple users. Investigating the authentication system.", timestamp: "2024-01-18 02:15 PM", }, { id: 3, author: "David Brown", message: "Issue resolved. Password policy was updated yesterday. Please reset your password.", timestamp: "2024-01-19 03:45 PM", }, ],
    },
    {
      id: 4, title: "Projector bulb replacement needed", description: "The projector in Conference Room 2 has a dim display and needs bulb replacement.", category: "Hardware", priority: "low", status: "open", assignedTo: "Unassigned", createdBy: "Lisa Chen", createdAt: "2024-01-20 08:45 AM", updatedAt: "2024-01-20 08:45 AM", dueDate: "2024-01-25", comments: [{ id: 1, author: "Lisa Chen", message: "The projector display is very dim and hard to see. Probably needs a new bulb.", timestamp: "2024-01-20 08:45 AM", }, ],
    },
    {
      id: 5, title: "Software installation request", description: "Need Adobe Creative Suite installed on 5 computers in the Design Lab.", category: "Software", priority: "medium", status: "in_progress", assignedTo: "John Smith", createdBy: "Professor Rodriguez", createdAt: "2024-01-17 03:30 PM", updatedAt: "2024-01-20 10:15 AM", dueDate: "2024-01-24", comments: [{ id: 1, author: "Professor Rodriguez", message: "The design students need Adobe Creative Suite for their projects. Can this be installed by next week?", timestamp: "2024-01-17 03:30 PM", }, { id: 2, author: "John Smith", message: "I'll start the installation process tomorrow. Should be completed by Friday.", timestamp: "2024-01-20 10:15 AM", }, ],
    },
  ]);

  // Form state for creating/editing tickets
  const [newTicketData, setNewTicketData] = useState({
    title: "", description: "", category: "", priority: "", dueDate: "",
  });
  const [editTicketData, setEditTicketData] = useState<Ticket | null>(null);

  const [isProcessing, setIsProcessing] = useState(false); // For mock loading state of actions

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = searchTerm === '' || ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus
    const matchesPriority = filterPriority === "all" || ticket.priority === filterPriority
    const matchesCategory = filterCategory === "all" || ticket.category === filterCategory
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory
  });

  // UI Helpers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open": return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Open</Badge>
      case "in_progress": return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">In Progress</Badge>
      case "resolved": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Resolved</Badge>
      case "closed": return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Closed</Badge>
      default: return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High</Badge>
      case "medium": return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>
      case "low": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Low</Badge>
      default: return <Badge variant="secondary">{priority}</Badge>
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Hardware": return <Server className="h-4 w-4" />
      case "Software": return <Monitor className="h-4 w-4" />
      case "Network": return <Wrench className="h-4 w-4" />
      default: return <Tag className="h-4 w-4" />
    }
  }

  // --- Mock Handlers ---
  const handleCreateTicket = () => {
    if (!newTicketData.title || !newTicketData.description || !newTicketData.category || !newTicketData.priority) {
      toast.error("Please fill all required fields to create a ticket.");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      const newTicket: Ticket = {
        id: tickets.length + 1,
        title: newTicketData.title,
        description: newTicketData.description,
        category: newTicketData.category,
        priority: newTicketData.priority,
        status: "open",
        assignedTo: "Unassigned", // Mock assignment
        createdBy: user?.name || "Guest User", // Use current user's name
        createdAt: new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString(),
        dueDate: newTicketData.dueDate,
        comments: [],
      };
      setTickets(prev => [...prev, newTicket]);
      setNewTicketData({ title: "", description: "", category: "", priority: "", dueDate: "" }); // Reset form
      setShowCreateModal(false);
      setIsProcessing(false);
      toast.success("Ticket created successfully!");
    }, 1000); // Simulate API call
  };

  const handleEditTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setEditTicketData({ ...ticket }); // Clone for editing
    setShowEditModal(true);
  };

  const handleUpdateTicket = () => {
    if (!editTicketData || !editTicketData.title || !editTicketData.description || !editTicketData.category || !editTicketData.priority) {
        toast.error("Please fill all required fields to update the ticket.");
        return;
    }
    setIsProcessing(true);
    setTimeout(() => {
        setTickets(prev => prev.map(t => t.id === editTicketData.id ? { ...editTicketData, updatedAt: new Date().toLocaleString() } : t));
        setShowEditModal(false);
        setIsProcessing(false);
        toast.success("Ticket updated successfully!");
    }, 1000);
  };

  const handleDeleteTicket = (id: number) => {
    if (confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) {
      setIsProcessing(true);
      setTimeout(() => {
        setTickets(prev => prev.filter(t => t.id !== id));
        setIsProcessing(false);
        toast.success("Ticket deleted successfully.");
      }, 500); // Simulate API call
    }
  };


  const ticketStats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    inProgress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
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
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="open">Open ({ticketStats.open})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({ticketStats.inProgress})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({ticketStats.resolved})</TabsTrigger>
          <TabsTrigger value="all">All ({ticketStats.total})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="grid gap-4">
            {filteredTickets.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        <MessageSquare className="mx-auto h-12 w-12 mb-4" />
                        No support tickets found.
                    </CardContent>
                </Card>
            ) : (
                filteredTickets
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
                                            <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {ticket.dueDate && (
                                            <div className="flex items-center space-x-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span>Due: {new Date(ticket.dueDate).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex space-x-2">
                                        <Button
                                            type="button"
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
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEditTicket(ticket)}
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                        </Button>
                                        <Button type="button" variant="outline" size="sm">
                                            <Send className="h-4 w-4 mr-2" />
                                            Reply
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteTicket(ticket.id)}
                                            disabled={isProcessing}
                                        >
                                            {isProcessing && selectedTicket?.id === ticket.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
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
              <Input id="title" placeholder="Brief description of the issue"
                     value={newTicketData.title}
                     onChange={(e) => setNewTicketData(p => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the problem..."
                rows={4}
                value={newTicketData.description}
                onChange={(e) => setNewTicketData(p => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newTicketData.category} onValueChange={(val) => setNewTicketData(p => ({ ...p, category: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hardware">Hardware</SelectItem>
                    <SelectItem value="Software">Software</SelectItem>
                    <SelectItem value="Network">Network</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={newTicketData.priority} onValueChange={(val) => setNewTicketData(p => ({ ...p, priority: val }))}>
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
            <div>
              <Label htmlFor="dueDate">Due Date (Optional)</Label>
              <Input id="dueDate" type="date"
                     value={newTicketData.dueDate}
                     onChange={(e) => setNewTicketData(p => ({ ...p, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTicket} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Ticket Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Ticket</DialogTitle>
            <DialogDescription>
              Update ticket details here.
            </DialogDescription>
          </DialogHeader>
          {editTicketData && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" placeholder="Brief description of the issue"
                       value={editTicketData.title}
                       onChange={(e) => setEditTicketData(p => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Detailed description of the problem..."
                  rows={4}
                  value={editTicketData.description}
                  onChange={(e) => setEditTicketData(p => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Select value={editTicketData.category} onValueChange={(val) => setEditTicketData(p => ({ ...p, category: val }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hardware">Hardware</SelectItem>
                      <SelectItem value="Software">Software</SelectItem>
                      <SelectItem value="Network">Network</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select value={editTicketData.priority} onValueChange={(val) => setEditTicketData(p => ({ ...p, priority: val }))}>
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
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editTicketData.status} onValueChange={(val) => setEditTicketData(p => ({ ...p, status: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                <div>
                    <Label htmlFor="edit-dueDate">Due Date (Optional)</Label>
                    <Input id="edit-dueDate" type="date"
                           value={editTicketData.dueDate || ""}
                           onChange={(e) => setEditTicketData(p => ({ ...p, dueDate: e.target.value }))}
                    />
                </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTicket} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update Ticket"}
              </Button>
            </DialogFooter>
          )}
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
            <Button type="button" onClick={() => setShowViewModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}