"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Download, Loader2, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useAuth } from "@/lib/contexts/RoleContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { exportMasterLog, downloadBlob } from "@/lib/services/export.service";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// --- Type Definitions ---
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
  action: string;
  page: number;
  limit: number;
}

const ALL_LOG_ACTIONS = [
  'USER_LOGIN', 'USER_CREATED', 'USER_UPDATED_SELF', 'USER_CHANGED_PASSWORD',
  'ADMIN_UPDATED_USER_STATUS', 'ADMIN_ASSIGNED_MANAGER_TO_USER',
  'PROGRAM_CREATED', 'PROGRAM_SUBMITTED_FOR_APPROVAL', 'PROGRAM_APPROVED',
  'PROGRAM_REJECTED', 'PROGRAM_DEACTIVATED', 'COURSE_CREATED', 'COURSE_APPROVED',
  'ATTENDANCE_MARKED', 'ATTENDANCE_EXCUSED'
];

// --- Sub-components for Clarity ---

const LogFiltersComponent = ({ onFilterChange, filters }: { onFilterChange: (filterName: string, value: any) => void, filters: LogFilters }) => (
    <Card>
      <CardHeader>
        <CardTitle>Filter Logs</CardTitle>
        <CardDescription>Refine the activity log by date range and action type.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input type="date" id="startDate" value={filters.startDate} onChange={(e) => onFilterChange("startDate", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input type="date" id="endDate" value={filters.endDate} onChange={(e) => onFilterChange("endDate", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="action">Action Type</Label>
            <Select value={filters.action} onValueChange={(value) => onFilterChange("action", value === 'all' ? '' : value)}>
              <SelectTrigger><SelectValue placeholder="All Actions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {ALL_LOG_ACTIONS.map(action => (
                  <SelectItem key={action} value={action}>{action.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
);

const LogTable = ({ logs }: { logs: LogEntry[] }) => {
  const getActionBadge = (action: string) => {
    const actionColors: { [key: string]: string } = {
      'USER_LOGIN': 'bg-blue-100 text-blue-800',
      'USER_CREATED': 'bg-green-100 text-green-800',
      'PROGRAM_REJECTED': 'bg-red-100 text-red-800',
      'ADMIN_UPDATED_USER_STATUS': 'bg-orange-100 text-orange-800',
      'PROGRAM_CREATED': 'bg-purple-100 text-purple-800',
    };
    return <Badge className={actionColors[action] || 'bg-gray-100 text-gray-800'}>{action.replace(/_/g, ' ')}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>A comprehensive log of all key events across the platform.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>User</TableHead><TableHead>Action</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">No logs found for the selected filters.</TableCell></TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell className="text-sm text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                        <div className="font-medium">{log.user?.name || 'System'}</div>
                        <div className="text-xs text-muted-foreground">{log.user?.role}</div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.details}</TableCell>
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


// --- Main Page Component ---
export default function MasterLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];
  const lastMonth = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];

  const [filters, setFilters] = useState<LogFilters>({
    startDate: lastMonth,
    endDate: today,
    action: "",
    page: 1,
    limit: 15, // Show more per page
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
        page: responseData.page, totalPages: responseData.totalPages,
        hasPrevPage: responseData.hasPrevPage, hasNextPage: responseData.hasNextPage,
        totalDocs: responseData.totalDocs,
      });

    } catch (err: any) {
      setError(err.response?.data?.message || "Could not load activity log.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value, page: 1 }));
  };
  
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
      setIsExporting(true);
      try {
          const { page, limit, ...exportFilters } = filters;
          const blob = await exportMasterLog(format, exportFilters);
          const filename = `master-log-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
          downloadBlob(blob, filename);
          toast.success("Log report exported successfully!");
          setExportModalOpen(false);
      } catch (err) {
          toast.error("Failed to export logs.");
      } finally {
          setIsExporting(false);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master Activity Log</h1>
          <p className="text-muted-foreground">A comprehensive, filterable log of all key events across the platform.</p>
        </div>
        <Dialog open={isExportModalOpen} onOpenChange={setExportModalOpen}>
            <DialogTrigger asChild>
                <Button><Download className="mr-2 h-4 w-4" />Export View</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Export Activity Log</DialogTitle>
                    <DialogDescription>
                        This will export the currently filtered view ({pagination?.totalDocs || 0} records).
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col space-y-3 pt-4">
                    <Button onClick={() => handleExport('pdf')} disabled={isExporting} className="bg-[#1f497d] hover:bg-[#1a3f6b]">
                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileText className="mr-2 h-4 w-4" />}
                        Export as PDF
                    </Button>
                    <Button onClick={() => handleExport('excel')} disabled={isExporting} className="bg-green-600 hover:bg-green-700">
                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                        Export as Excel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
      </div>

      <LogFiltersComponent onFilterChange={handleFilterChange} filters={filters} />

      {loading && <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      
      {!loading && !error && (
        <>
          <LogTable logs={logs} />
          
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                    Showing {logs.length} of {pagination.totalDocs} logs
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrevPage}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <span className="text-sm font-medium">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}