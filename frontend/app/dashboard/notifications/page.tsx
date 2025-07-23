// app/dashboard/notifications/page.tsx
"use client"

import { useState } from "react"
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  Filter,
  Search,
  Trash2,
  Archive,
  Loader2 // Added Loader2 for auth loading
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner" // Import toast

import { useAuth } from "@/lib/contexts/RoleContext" // Import useAuth for role check

// Interface for mock Notification data
interface Notification {
  id: number
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  timestamp: string
  read: boolean
  category: string
  priority: "low" | "medium" | "high"
}

export default function NotificationsPage() {
  const { user, role, loading: authLoading } = useAuth(); // Get user and role from context

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")

  // Mock notifications data (managed locally as no backend integration for tickets)
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1, title: "New Program Enrollment", message: "25 new trainees have enrolled in the Data Science Bootcamp program.", type: "success", timestamp: "2024-01-20 10:30 AM", read: false, category: "Enrollment", priority: "medium",
    },
    {
      id: 2, title: "System Maintenance", message: "Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM. Some services may be temporarily unavailable.", type: "warning", timestamp: "2024-01-20 09:15 AM", read: false, category: "System", priority: "high",
    },
    {
      id: 3, title: "Project Submission Deadline", message: "Reminder: Web Development project submissions are due tomorrow at 5:00 PM.", type: "info", timestamp: "2024-01-20 08:45 AM", read: true, category: "Academic", priority: "high",
    },
    {
      id: 4, title: "Certificate Generated", message: "Your UI/UX Design Mastery certificate has been generated and is ready for download.", type: "success", timestamp: "2024-01-19 03:20 PM", read: true, category: "Certificate", priority: "medium",
    },
    {
      id: 5, title: "Network Issue Resolved", message: "The WiFi connectivity issues in Building A have been resolved. All services are now functioning normally.", type: "success", timestamp: "2024-01-19 02:45 PM", read: true, category: "System", priority: "medium",
    },
    {
      id: 6, title: "New Resource Available", message: "New learning materials have been uploaded for the Machine Learning module.", type: "info", timestamp: "2024-01-19 11:30 AM", read: false, category: "Resources", priority: "low",
    },
    {
      id: 7, title: "Attendance Alert", message: "You have missed 3 consecutive sessions. Please contact your facilitator if you need assistance.", type: "warning", timestamp: "2024-01-18 04:15 PM", read: false, category: "Academic", priority: "high",
    },
    {
      id: 8, title: "System Update Complete", message: "The latest system update has been successfully installed. New features are now available.", type: "success", timestamp: "2024-01-18 10:00 AM", read: true, category: "System", priority: "low",
    },
  ]);

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || notification.type === filterType
    const matchesCategory = filterCategory === "all" || notification.category === filterCategory
    return matchesSearch && matchesType && matchesCategory
  });

  const unreadNotifications = filteredNotifications.filter(n => !n.read);
  const readNotifications = filteredNotifications.filter(n => n.read);

  // UI Helpers
  const getTypeConfig = (type: string) => {
    switch (type) {
      case "success": return { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-50" }
      case "warning": return { icon: AlertTriangle, color: "text-yellow-600", bgColor: "bg-yellow-50" }
      case "error": return { icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-50" }
      case "info": return { icon: Info, color: "text-blue-600", bgColor: "bg-blue-50" }
      default: return { icon: Info, color: "text-gray-600", bgColor: "bg-gray-50" }
    }
  }

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "high": return { label: "High", variant: "destructive" as const }
      case "medium": return { label: "Medium", variant: "default" as const }
      case "low": return { label: "Low", variant: "secondary" as const }
      default: return { label: priority, variant: "outline" as const }
    }
  }

  // Mock Handlers for notifications (as backend doesn't support them yet)
  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    toast.success("Notification marked as read!");
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("All notifications marked as read!");
  }

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success("Notification deleted.");
  }

  // Render nothing or a loading spinner if authentication is still loading
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Access control: Notifications are generally for all authenticated users
  // No specific role check applied here, as it's a general feature.
  if (!user && !authLoading) {
    return (
        <Card>
            <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">You must be logged in to view notifications.</p></CardContent>
        </Card>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with system alerts and important messages
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="System">System</SelectItem>
            <SelectItem value="Academic">Academic</SelectItem>
            <SelectItem value="Enrollment">Enrollment</SelectItem>
            <SelectItem value="Certificate">Certificate</SelectItem>
            <SelectItem value="Resources">Resources</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="unread" className="space-y-4">
        <TabsList>
          <TabsTrigger value="unread">
            Unread ({unreadNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="read">
            Read ({readNotifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="space-y-4">
          {unreadNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">All caught up!</h3>
                  <p className="text-muted-foreground">No unread notifications</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            unreadNotifications.map((notification) => {
              const typeConfig = getTypeConfig(notification.type)
              const priorityConfig = getPriorityConfig(notification.priority)
              const IconComponent = typeConfig.icon

              return (
                <Card key={notification.id} className={`border-l-4 border-l-${notification.type === 'success' ? 'green' : notification.type === 'warning' ? 'yellow' : notification.type === 'error' ? 'red' : 'blue'}-500`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`p-2 rounded-full ${typeConfig.bgColor}`}>
                          <IconComponent className={`h-4 w-4 ${typeConfig.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">{notification.title}</h4>
                            <Badge variant={priorityConfig.variant} className="text-xs">
                              {priorityConfig.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {notification.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>{notification.timestamp}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="read" className="space-y-4">
          {readNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No read notifications</h3>
                  <p className="text-muted-foreground">Notifications you've read will appear here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            readNotifications.map((notification) => {
              const typeConfig = getTypeConfig(notification.type)
              const priorityConfig = getPriorityConfig(notification.priority)
              const IconComponent = typeConfig.icon

              return (
                <Card key={notification.id} className="opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`p-2 rounded-full ${typeConfig.bgColor}`}>
                          <IconComponent className={`h-4 w-4 ${typeConfig.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">{notification.title}</h4>
                            <Badge variant={priorityConfig.variant} className="text-xs">
                              {priorityConfig.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {notification.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>{notification.timestamp}</span>
                            <span className="flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Read
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}