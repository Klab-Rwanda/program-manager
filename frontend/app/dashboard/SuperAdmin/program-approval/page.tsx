"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Eye, Clock, CheckCircle, XCircle, FileText, Loader2 } from "lucide-react";

import { useAuth } from "@/lib/contexts/RoleContext";
import { Program } from "@/types";
import { getAllPrograms } from "@/lib/services/program.service";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ProgramApprovalPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("PendingApproval"); // Default to the most actionable status

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllPrograms();
      setPrograms(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load programs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'SuperAdmin') {
      fetchPrograms();
    }
  }, [isAuthenticated, user, fetchPrograms]);

  const filteredPrograms = programs.filter((program) => {
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || program.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'PendingApproval': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="mr-1 h-3 w-3"/>Pending</Badge>;
        case 'Active': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3"/>Active</Badge>;
        case 'Rejected': return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3"/>Rejected</Badge>;
        case 'Draft': return <Badge variant="secondary"><FileText className="mr-1 h-3 w-3"/>Draft</Badge>;
        default: return <Badge>{status}</Badge>;
    }
  };

  const statusCounts = {
    all: programs.length,
    PendingApproval: programs.filter(p => p.status === 'PendingApproval').length,
    Active: programs.filter(p => p.status === 'Active').length,
    Rejected: programs.filter(p => p.status === 'Rejected').length,
  };

  if (loading) return <div className="flex justify-center p-16"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Program Approvals</h1>
        <p className="text-muted-foreground">Review program submissions and manage their lifecycle.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className={`cursor-pointer hover:border-primary ${filterStatus === 'PendingApproval' && 'border-2 border-primary ring-2 ring-primary'}`} onClick={() => setFilterStatus('PendingApproval')}>
              <CardHeader><CardTitle className="text-yellow-500">{statusCounts.PendingApproval}</CardTitle><CardDescription>Pending Approval</CardDescription></CardHeader>
          </Card>
           <Card className={`cursor-pointer hover:border-primary ${filterStatus === 'Active' && 'border-2 border-primary ring-2 ring-primary'}`} onClick={() => setFilterStatus('Active')}>
              <CardHeader><CardTitle className="text-green-500">{statusCounts.Active}</CardTitle><CardDescription>Active Programs</CardDescription></CardHeader>
          </Card>
          <Card className={`cursor-pointer hover:border-primary ${filterStatus === 'Rejected' && 'border-2 border-primary ring-2 ring-primary'}`} onClick={() => setFilterStatus('Rejected')}>
              <CardHeader><CardTitle className="text-red-500">{statusCounts.Rejected}</CardTitle><CardDescription>Rejected Programs</CardDescription></CardHeader>
          </Card>
           <Card className={`cursor-pointer hover:border-primary ${filterStatus === 'all' && 'border-2 border-primary ring-2 ring-primary'}`} onClick={() => setFilterStatus('all')}>
              <CardHeader><CardTitle>{statusCounts.all}</CardTitle><CardDescription>All Programs</CardDescription></CardHeader>
          </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by program name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-sm pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program Name</TableHead>
                  <TableHead>Program Manager</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">View Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrograms.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-24">No programs found.</TableCell></TableRow>
                ) : (
                  filteredPrograms.map((program) => (
                    <TableRow 
                      key={program._id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/dashboard/SuperAdmin/program-approval/${program._id}`)}
                    >
                      <TableCell className="font-medium">{program.name}</TableCell>
                      <TableCell>{program.programManager?.name || 'Unassigned'}</TableCell>
                      <TableCell>{new Date(program.startDate).toLocaleDateString()} - {new Date(program.endDate).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(program.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgramApprovalPage;