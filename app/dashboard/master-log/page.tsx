"use client"

import { useState, useEffect, useCallback } from "react"
import { Download, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { useRole } from "@/lib/contexts/RoleContext"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LogEntry {
  id: string
  timestamp: string
  user: string
  role: string
  action: string
  details: string
}

const ALL_LOG_ACTIONS = [
  'USER_LOGIN', 'USER_CREATED', 'USER_UPDATED_SELF', 'USER_CHANGED_PASSWORD',
  'ADMIN_UPDATED_USER_STATUS', 'ADMIN_ASSIGNED_MANAGER_TO_USER',
  'PROGRAM_CREATED', 'PROGRAM_SUBMITTED_FOR_APPROVAL', 'PROGRAM_APPROVED',
  'PROGRAM_REJECTED', 'PROGRAM_DEACTIVATED', 'COURSE_CREATED', 'COURSE_APPROVED',
  'ATTENDANCE_MARKED', 'ATTENDANCE_EXCUSED'
]

interface LogFilters {
  startDate: string
  endDate: string
  action: string | "all"
  page: number
}

// Mock data for demonstration
const mockLogs: LogEntry[] = [
  {
    id: "1",
    timestamp: "2024-01-15T10:30:00",
    user: "John Doe",
    role: "Super Admin",
    action: "USER_CREATED",
    details: "Created new user: jane@klab.rw"
  },
  {
    id: "2",
    timestamp: "2024-01-15T09:15:00",
    user: "Jane Smith",
    role: "Program Manager",
    action: "PROGRAM_CREATED",
    details: "Created program: Web Development Bootcamp"
  },
  {
    id: "3",
    timestamp: "2024-01-15T08:45:00",
    user: "Bob Johnson",
    role: "Facilitator",
    action: "ATTENDANCE_MARKED",
    details: "Marked attendance for 25 trainees"
  },
  {
    id: "4",
    timestamp: "2024-01-14T16:20:00",
    user: "Alice Brown",
    role: "Trainee",
    action: "USER_LOGIN",
    details: "User logged in successfully"
  },
  {
    id: "5",
    timestamp: "2024-01-14T14:30:00",
    user: "Charlie Wilson",
    role: "Super Admin",
    action: "ADMIN_UPDATED_USER_STATUS",
    details: "Updated user status: bob@klab.rw to Active"
  }
]

const LogFiltersComponent = ({ onFilterChange, filters }: { onFilterChange: (filterName: string, value: string) => void, filters: LogFilters }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
        <CardDescription>
          Filter the activity log by date range and action type.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              type="date"
              id="startDate"
              value={filters.startDate}
              onChange={(e) => onFilterChange("startDate", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              type="date"
              id="endDate"
              value={filters.endDate}
              onChange={(e) => onFilterChange("endDate", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="action">Action Type</Label>
            <Select value={filters.action} onValueChange={(value) => onFilterChange("action", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {ALL_LOG_ACTIONS.map(action => (
                  <SelectItem key={action} value={action}>
                    {action.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const LogTable = ({ logs }: { logs: LogEntry[] }) => {
  const getActionBadge = (action: string) => {
    const actionColors = {
      'USER_LOGIN': 'bg-blue-100 text-blue-800',
      'USER_CREATED': 'bg-green-100 text-green-800',
      'USER_UPDATED_SELF': 'bg-yellow-100 text-yellow-800',
      'PROGRAM_CREATED': 'bg-purple-100 text-purple-800',
      'ATTENDANCE_MARKED': 'bg-indigo-100 text-indigo-800',
      'ADMIN_UPDATED_USER_STATUS': 'bg-orange-100 text-orange-800'
    }
    
    const color = actionColors[action as keyof typeof actionColors] || 'bg-gray-100 text-gray-800'
    
    return (
      <Badge className={color}>
        {action.replace(/_/g, ' ')}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>
          A comprehensive, filterable log of all key events across the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No logs found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell className="font-medium">{log.user}</TableCell>
                    <TableCell>{log.role}</TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell className="max-w-md truncate">{log.details}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MasterLogPage() {
  const { user } = useRole()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false
  })
  const [loading, setLoading] = useState(true)
  
  const today = new Date().toISOString().split('T')[0]
  const lastMonth = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]

  const [filters, setFilters] = useState<LogFilters>({
    startDate: lastMonth,
    endDate: today,
    action: "all",
    page: 1
  })

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Filter mock data based on filters
      let filteredLogs = mockLogs.filter(log => {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0]
        const dateMatch = logDate >= filters.startDate && logDate <= filters.endDate
        const actionMatch = filters.action === "all" || !filters.action || log.action === filters.action
        return dateMatch && actionMatch
      })
      
      // Simulate pagination
      const itemsPerPage = 10
      const startIndex = (filters.page - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      const paginatedLogs = filteredLogs.slice(startIndex, endIndex)
      
      setLogs(paginatedLogs)
      setPagination({
        page: filters.page,
        totalPages: Math.ceil(filteredLogs.length / itemsPerPage),
        hasPrevPage: filters.page > 1,
        hasNextPage: filters.page < Math.ceil(filteredLogs.length / itemsPerPage)
      })
    } catch (err) {
      console.error("Failed to fetch master log", err)
      alert("Could not load activity log.")
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value, page: 1 }))
  }
  
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master Activity Log</h1>
          <p className="text-muted-foreground">
            A comprehensive, filterable log of all key events across the platform.
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export View
        </Button>
      </div>

      {/* Filters */}
      <LogFiltersComponent onFilterChange={handleFilterChange} filters={filters} />

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <LogTable logs={logs} />
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
} 