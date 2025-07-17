"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Loader2, Calendar, Search, CheckCircle, XCircle, Clock, UserCheck, Download } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Type definitions
interface AttendanceRecord {
  _id: string;
  user: { name: string; email: string; role: string; };
  status: "Present" | "Absent" | "Late" | "Excused";
  checkInTime: string | null;
  checkOutTime: string | null;
  method: string;
}

interface Program {
  _id: string;
  name: string;
}

export default function AttendancePage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const [filters, setFilters] = useState({
    programId: '',
    startDate: today,
    endDate: today,
    searchTerm: ''
  });

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await api.get('/programs');
        setPrograms(response.data.data);
        if (response.data.data.length > 0) {
          setFilters(prev => ({ ...prev, programId: response.data.data[0]._id }));
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError("Could not load programs list.");
        setLoading(false);
      }
    };
    fetchPrograms();
  }, []);

  const fetchAttendance = useCallback(async () => {
    if (!filters.programId) {
      setAttendanceData([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/attendance/report/program/${filters.programId}`, {
        params: {
          startDate: filters.startDate,
          endDate: filters.endDate,
          limit: 200
        }
      });
      
      // --- THE FIX IS HERE ---
      // The paginated data is in the `docs` property, not `records`.
      // We also add a fallback to an empty array in case `docs` is missing.
      setAttendanceData(response.data.data.docs || []);
      // --- END OF FIX ---

    } catch (err) {
      setAttendanceData([]);
      setError("Could not load attendance data.");
    } finally {
      setLoading(false);
    }
  }, [filters.programId, filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFilters(prev => ({ ...prev, [id]: value }));
  };

  const filteredAttendance = attendanceData.filter(record => {
    if (!filters.searchTerm) return true;
    if (record && record.user && typeof record.user.name === 'string') {
        return record.user.name.toLowerCase().includes(filters.searchTerm.toLowerCase());
    }
    return false;
  });

  const getStatusIcon = (status: string) => { /* ... same as before ... */ };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground">Monitor and manage attendance across all programs</p>
        </div>
        <Button variant="outline"><Download className="mr-2 h-4 w-4"/>Export CSV</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input id="searchTerm" placeholder="Search by name..." value={filters.searchTerm} onChange={handleFilterChange} className="w-full pl-10"/>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={filters.programId} onValueChange={(value) => setFilters(prev => ({...prev, programId: value}))}>
              <SelectTrigger className="w-full sm:w-[220px]"><SelectValue placeholder="Select Program" /></SelectTrigger>
              <SelectContent>
                {programs.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" id="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full sm:w-auto" />
            <Input type="date" id="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full sm:w-auto" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Attendance Log</CardTitle>
          <CardDescription>Displaying {filteredAttendance.length} records for the selected filters.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={6} className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></TableCell></TableRow>}
                {error && <TableRow><TableCell colSpan={6} className="text-center p-8 text-red-500">{error}</TableCell></TableRow>}
                {!loading && filteredAttendance.length > 0 ? (
                  filteredAttendance.map((record) => (
                    <TableRow key={record._id}>
                      <TableCell className="font-medium">{record.user?.name || 'N/A'}</TableCell>
                      <TableCell><Badge variant="outline">{record.user?.role || 'N/A'}</Badge></TableCell>
                      <TableCell><div className="flex items-center gap-2">{getStatusIcon(record.status)} {record.status}</div></TableCell>
                      <TableCell>{record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}</TableCell>
                      <TableCell>{record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}</TableCell>
                      <TableCell>{record.method}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  !loading && <TableRow><TableCell colSpan={6} className="text-center p-8 text-muted-foreground">No records found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}