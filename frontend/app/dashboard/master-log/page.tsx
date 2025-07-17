"use client"

import { useState, useEffect, useCallback } from "react"
import { Download, Loader2, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react"
import { useRole } from "@/lib/contexts/RoleContext"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface LogEntry {
  _id: string;
  createdAt: string;
  user: { _id: string, name: string, role: string };
  action: string;
  details: string;
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
        const actionColors: { [key: string]: string } = {
            'USER_LOGIN': 'bg-blue-100 text-blue-800',
            'USER_CREATED': 'bg-green-100 text-green-800',
            'PROGRAM_CREATED': 'bg-purple-100 text-purple-800',
            'PROGRAM_APPROVED': 'bg-emerald-100 text-emerald-800',
            'PROGRAM_REJECTED': 'bg-red-100 text-red-800',
            'ATTENDANCE_MARKED': 'bg-indigo-100 text-indigo-800',
            'ADMIN_UPDATED_USER_STATUS': 'bg-orange-100 text-orange-800'
        };
        const color = actionColors[action] || 'bg-gray-100 text-gray-800';
        return <Badge className={color}>{action.replace(/_/g, ' ')}</Badge>;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>A comprehensive, filterable log of all key events across the platform.</CardDescription>
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
                                    <TableRow key={log._id}>
                                        <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                                        <TableCell className="font-medium">{log.user?.name || 'System'}</TableCell>
                                        <TableCell>{log.user?.role || 'N/A'}</TableCell>
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
    );
};

export default function MasterLogPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const today = new Date().toISOString().split('T')[0];
    const lastMonth = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];

    const [filters, setFilters] = useState<LogFilters>({
        startDate: lastMonth,
        endDate: today,
        action: "all",
        page: 1
    });

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params: any = {
                page: filters.page,
                limit: 10,
                startDate: filters.startDate,
                endDate: filters.endDate,
            };
            if (filters.action !== 'all') {
                params.action = filters.action;
            }

            const response = await api.get('/reports/master-log', { params });
            const data = response.data.data;

            setLogs(data.docs || []);
            setPagination({
                page: data.page,
                totalPages: data.totalPages,
            });
        } catch (err) {
            setError("Could not load activity log.");
            console.error("Failed to fetch master log", err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleFilterChange = (filterName: string, value: string) => {
        setFilters(prev => ({ ...prev, [filterName]: value, page: 1 }));
    };
    
    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= pagination.totalPages) {
            setFilters(prev => ({ ...prev, page: newPage }));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Master Activity Log</h1>
                    <p className="text-muted-foreground">A comprehensive log of all key events.</p>
                </div>
                <Button>
                    <Download className="mr-2 h-4 w-4" />
                    Export View
                </Button>
            </div>

            <LogFiltersComponent onFilterChange={handleFilterChange} filters={filters} />
            
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <>
                    <LogTable logs={logs} />
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page <= 1}
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
                                disabled={pagination.page >= pagination.totalPages}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}