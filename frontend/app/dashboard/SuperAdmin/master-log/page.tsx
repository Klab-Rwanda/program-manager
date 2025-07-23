"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/contexts/RoleContext"; // FIX: Import the correct hook
import api from "@/lib/api";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

// --- Type Definitions based on your backend Log model ---
interface LoggedUser {
  _id: string;
  name: string;
  role: string;
}

interface LogEntry {
  _id: string;
  createdAt: string;
  user: LoggedUser;
  action: string;
  details: string;
}

interface PaginationInfo {
  page: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  totalDocs: number;
}

interface LogFilters {
  startDate: string;
  endDate: string;
  action: string; // 'all' will be represented by an empty string for the API
  page: number;
  limit: number;
}

// All possible log actions from your backend log.model.js
const ALL_LOG_ACTIONS = [
  'USER_LOGIN', 'USER_CREATED', 'USER_UPDATED_SELF', 'USER_CHANGED_PASSWORD',
  'ADMIN_UPDATED_USER_STATUS', 'ADMIN_ASSIGNED_MANAGER_TO_USER',
  'PROGRAM_CREATED', 'PROGRAM_SUBMITTED_FOR_APPROVAL', 'PROGRAM_APPROVED',
  'PROGRAM_REJECTED', 'PROGRAM_DEACTIVATED', 'COURSE_CREATED', 'COURSE_APPROVED',
  'ATTENDANCE_MARKED', 'ATTENDANCE_EXCUSED'
];


const LogFiltersComponent = ({ onFilterChange, filters }: { onFilterChange: (filterName: string, value: any) => void, filters: LogFilters }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
        <CardDescription>Filter the activity log by date range and action type.</CardDescription>
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
  );
};

const LogTable = ({ logs }: { logs: LogEntry[] }) => {
  const getActionBadge = (action: string) => {
    const actionColors: { [key: string]: string } = {
      'USER_LOGIN': 'bg-blue-100 text-blue-800',
      'USER_CREATED': 'bg-green-100 text-green-800',
      'USER_UPDATED_SELF': 'bg-yellow-100 text-yellow-800',
      'PROGRAM_CREATED': 'bg-purple-100 text-purple-800',
      'ATTENDANCE_MARKED': 'bg-indigo-100 text-indigo-800',
      'ADMIN_UPDATED_USER_STATUS': 'bg-orange-100 text-orange-800',
      'PROGRAM_REJECTED': 'bg-red-100 text-red-800'
    };
    const color = actionColors[action] || 'bg-gray-100 text-gray-800';
    return (
      <Badge className={color}>
        {action.replace(/_/g, ' ')}
      </Badge>
    );
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
                    <TableCell className="font-medium">{log.user?.name || 'Unknown User'}</TableCell>
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
  const { user } = useAuth(); // FIX: Use the correct hook
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const today = new Date().toISOString().split('T')[0];
  const lastMonth = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];

  const [filters, setFilters] = useState<LogFilters>({
    startDate: lastMonth,
    endDate: today,
    action: "",
    page: 1,
    limit: 10,
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
      if (filters.action) {
        params.append('action', filters.action);
      }
      
      const response = await api.get(`/reports/master-log?${params.toString()}`);
      const responseData = response.data.data;
      
      setLogs(responseData.docs);
      setPagination({
          page: responseData.page,
          totalPages: responseData.totalPages,
          hasPrevPage: responseData.hasPrevPage,
          hasNextPage: responseData.hasNextPage,
          totalDocs: responseData.totalDocs,
      });

    } catch (err: any) {
      setError(err.response?.data?.message || "Could not load activity log.");
      console.error(err);
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
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master Activity Log</h1>
          <p className="text-muted-foreground">A comprehensive log of all key system events.</p>
        </div>
        <Button disabled>
          <Download className="mr-2 h-4 w-4" />
          Export View (PDF)
        </Button>
      </div>

      <LogFiltersComponent onFilterChange={handleFilterChange} filters={filters} />

      {loading && <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      
      {!loading && !error && (
        <>
          <LogTable logs={logs} />
          
          {pagination && pagination.totalPages > 1 && (
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
  );
}