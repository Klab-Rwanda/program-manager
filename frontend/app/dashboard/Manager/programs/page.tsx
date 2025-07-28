"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Loader2,
  Archive,
  Download,
  FileText,
} from "lucide-react";
import { Program, getAllPrograms, createProgram, updateProgram, deleteProgram, requestApproval, enrollFacilitator, enrollTrainee } from "@/lib/services/program.service";
import { archiveProgram } from "@/lib/services/archive.service";
import { exportProgramsPDF, exportProgramsExcel, downloadBlob } from "@/lib/services/export.service";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/RoleContext";
import { useCounts } from "@/lib/contexts/CountsContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUsersByRole } from '@/lib/services/user.service';
import { User } from "@/lib/services/user.service";
import api from '@/lib/api'; // Make sure you have your axios instance

const ProgramsPage: React.FC = () => {
  const { isAuthenticated, user, role } = useAuth();
  const { refreshCounts } = useCounts();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [filterManager, setFilterManager] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [assigningProgram, setAssigningProgram] = useState<Program | null>(null);
  const [previewingProgram, setPreviewingProgram] = useState<Program | null>(null);
  const [facilitators, setFacilitators] = useState<User[]>([]);
  const [trainees, setTrainees] = useState<User[]>([]);
  const [selectedFacilitator, setSelectedFacilitator] = useState<string>("");
  const [selectedTrainee, setSelectedTrainee] = useState<string>("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [selectedFacilitators, setSelectedFacilitators] = useState<string[]>([]);
  const [selectedTrainees, setSelectedTrainees] = useState<string[]>([]);

  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [newProgram, setNewProgram] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const fetchPrograms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllPrograms();
      setPrograms(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load programs.");
      toast.error(err.response?.data?.message || "Failed to load programs.");
      console.error("Error fetching programs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || (role !== 'program_manager' && role !== 'super_admin')) {
      setLoading(false);
      return;
    }
    fetchPrograms();
  }, [isAuthenticated, role, fetchPrograms]);

  const filteredPrograms = programs.filter((program) => {
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || program.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesManager = filterManager === "all" || 
                          (program.programManager && program.programManager.name.toLowerCase().includes(filterManager.toLowerCase()));
    
    let matchesDate = true;
    if (filterDate !== "all") {
      const today = new Date();
      const startDate = new Date(program.startDate);
      const endDate = new Date(program.endDate);
      
      switch (filterDate) {
        case "upcoming":
          matchesDate = startDate > today;
          break;
        case "ongoing":
          matchesDate = startDate <= today && endDate >= today;
          break;
        case "completed":
          matchesDate = endDate < today;
          break;
        case "this-month":
          const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          matchesDate = startDate >= thisMonth && startDate < nextMonth;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesManager && matchesDate;
  });

  const sortedPrograms = [...filteredPrograms].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "status":
        aValue = a.status.toLowerCase();
        bValue = b.status.toLowerCase();
        break;
      case "startDate":
        aValue = new Date(a.startDate);
        bValue = new Date(b.startDate);
        break;
      case "endDate":
        aValue = new Date(a.endDate);
        bValue = new Date(b.endDate);
        break;
      case "trainees":
        aValue = a.trainees?.length || 0;
        bValue = b.trainees?.length || 0;
        break;
      case "facilitators":
        aValue = a.facilitators?.length || 0;
        bValue = b.facilitators?.length || 0;
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }
    
    if (sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleCreateProgram = async () => {
    if (!newProgram.name || !newProgram.description || !newProgram.startDate || !newProgram.endDate) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (new Date(newProgram.startDate) > new Date(newProgram.endDate)) {
        toast.error("Start date cannot be after end date.");
        return;
    }

    setLoading(true);
    try {
      const createdProgram = await createProgram(newProgram);
      setPrograms((prev) => [...prev, createdProgram]);
      setNewProgram({ name: "", description: "", startDate: "", endDate: "" });
      setShowCreateModal(false);
      toast.success("Program created successfully!");
      await refreshCounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create program.");
      console.error("Error creating program:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProgram = async () => {
    if (!selectedProgram || !newProgram.name || !newProgram.description || !newProgram.startDate || !newProgram.endDate) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (new Date(newProgram.startDate) > new Date(newProgram.endDate)) {
        toast.error("Start date cannot be after end date.");
        return;
    }

    setLoading(true);
    try {
      const updatedProgram = await updateProgram(selectedProgram._id, newProgram);
      setPrograms((prev) =>
          prev.map((program) => (program._id === updatedProgram._id ? updatedProgram : program))
      );
      setNewProgram({ name: "", description: "", startDate: "", endDate: "" });
      setShowEditModal(false);
      setSelectedProgram(null);
      toast.success("Program updated successfully!");
      await refreshCounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update program.");
      console.error("Error updating program:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProgram = async () => {
    if (!selectedProgram) return;

    if (!confirm(`Are you sure you want to delete "${selectedProgram.name}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteProgram(selectedProgram._id);
      setPrograms((prev) => prev.filter((program) => program._id !== selectedProgram._id));
      setShowDeleteModal(false);
      setSelectedProgram(null);
      toast.success("Program deleted successfully!");
      await refreshCounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete program.");
      console.error("Error deleting program:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestApproval = async (program: Program) => {
    setLoading(true);
    try {
      await requestApproval(program._id);
      toast.success("Program submitted for approval!");
      fetchPrograms();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit for approval.");
      console.error("Error requesting approval:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (program: Program) => {
    if (!confirm(`Are you sure you want to archive "${program.name}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await archiveProgram(program._id);
      toast.success(`${program.name} has been archived!`);
      setPrograms((prev) => prev.filter((p) => p._id !== program._id));
      await refreshCounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to archive program.");
      console.error("Error archiving program:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAll = async (format: 'pdf' | 'excel') => {
    setExporting(true);
    try {
      let blob: Blob;
      if (format === 'pdf') {
        blob = await exportProgramsPDF();
      } else {
        blob = await exportProgramsExcel();
      }
      
      const filename = `programs-report-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      downloadBlob(blob, filename);
      toast.success(`Exported all programs as ${format.toUpperCase()}.`);
      setShowExportModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to export as ${format.toUpperCase()}.`);
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  };

  const openAssignModal = async (program: Program) => {
    setAssigningProgram(program);
    setShowAssignModal(true);
    setAssignLoading(true);
    try {
      const [facilitatorList, traineeList] = await Promise.all([
        getUsersByRole('Facilitator'),
        getUsersByRole('Trainee'),
      ]);
      setFacilitators(facilitatorList);
      setTrainees(traineeList);
      setSelectedFacilitators([]);
      setSelectedTrainees([]);
    } catch (err) {
      toast.error('Failed to load users for assignment.');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAssignFacilitators = async () => {
    if (!assigningProgram || selectedFacilitators.length === 0) return;
    setAssignLoading(true);
    try {
      await Promise.all(selectedFacilitators.map(fid => enrollFacilitator(assigningProgram._id, fid)));
      toast.success('Facilitators assigned!');
      fetchPrograms();
    } catch (err) {
      toast.error('Failed to assign facilitators.');
    } finally {
      setAssignLoading(false);
      setSelectedFacilitators([]);
    }
  };
  const handleAssignTrainees = async () => {
    if (!assigningProgram || selectedTrainees.length === 0) return;
    setAssignLoading(true);
    try {
      await Promise.all(selectedTrainees.map(tid => enrollTrainee(assigningProgram._id, tid)));
      toast.success('Trainees assigned!');
      fetchPrograms();
    } catch (err) {
      toast.error('Failed to assign trainees.');
    } finally {
      setAssignLoading(false);
      setSelectedTrainees([]);
    }
  };

  const openPreviewModal = async (program: Program) => {
    try {
      const response = await api.get(`/programs/${program._id}`);
      setPreviewingProgram(response.data.data); // Use the fully populated program
      setShowPreviewModal(true);
    } catch (err) {
      toast.error('Failed to load program details.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "bg-green-100 text-green-800";
      case "draft": return "bg-gray-100 text-gray-800";
      case "pendingapproval": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return <CheckCircle className="h-4 w-4" />;
      case "draft": return <Clock className="h-4 w-4" />;
      case "pendingapproval": return <AlertTriangle className="h-4 w-4" />;
      case "completed": return <Award className="h-4 w-4" />;
      case "rejected": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (isAuthenticated && (role !== 'program_manager' && role !== 'super_admin') && !loading) {
    return (
        <Card>
            <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">You do not have permission to view this page.</p></CardContent>
        </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading programs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
              {error}
              <Button variant="ghost" size="sm" onClick={() => setError(null)}><XCircle className="h-4 w-4" /></Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
          <p className="text-gray-600">Manage your training programs</p>
        </div>
        {(role === 'program_manager' || role === 'super_admin') && (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowExportModal(true)}
              disabled={exporting || programs.length === 0}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <Download className="mr-2 h-4 w-4" />
              {exporting ? "Exporting..." : "Export"}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#1f497d] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#1a3f6b] transition-colors"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Program
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search programs by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f497d] focus:border-transparent"
                />
              </div>
            </div>
          
          <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f497d] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="pendingapproval">Pending Approval</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
          </div>
          
          <div>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f497d] focus:border-transparent"
            >
              <option value="all">All Dates</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="this-month">This Month</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="Filter by manager name..."
              value={filterManager}
              onChange={(e) => setFilterManager(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f497d] focus:border-transparent"
            />
          </div>
          
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f497d] focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="status">Sort by Status</option>
              <option value="startDate">Sort by Start Date</option>
              <option value="endDate">Sort by End Date</option>
              <option value="trainees">Sort by Trainees</option>
              <option value="facilitators">Sort by Facilitators</option>
            </select>
          </div>
          
          <div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f497d] focus:border-transparent"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>
        
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          Showing {sortedPrograms.length} of {programs.length} programs
        </div>
        <div className="flex items-center gap-2">
          {(searchTerm || filterStatus !== "all" || filterDate !== "all" || filterManager !== "all") && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Active filters:</span>
              {searchTerm && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Search: "{searchTerm}"
                </span>
              )}
              {filterStatus !== "all" && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Status: {filterStatus}
                </span>
              )}
              {filterDate !== "all" && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                  Date: {filterDate}
                </span>
              )}
              {filterManager !== "all" && (
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                  Manager: {filterManager}
                </span>
              )}
            </div>
          )}
          {sortedPrograms.length !== programs.length && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
                setFilterDate("all");
                setFilterManager("all");
                setSortBy("name");
                setSortOrder("asc");
              }}
              className="text-sm text-[#1f497d] hover:text-[#1a3f6b] underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedPrograms.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No programs found</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== "all" || filterDate !== "all" || filterManager !== "all"
                ? "No programs match your current filters."
                : "Create your first program to get started."}
            </p>
          </div>
        ) : (
          sortedPrograms.map((program, idx) => (
            <div key={program._id || idx} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 hover:border-gray-300">
              {/* Header Section */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">{program.name}</h3>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(program.status)}`}>
                    {getStatusIcon(program.status)}
                    <span className="capitalize">{program.status}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-6 leading-relaxed line-clamp-3">{program.description}</p>
              
              {/* Program Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-700">Duration:</span>
                    <span suppressHydrationWarning>{new Date(program.startDate).toLocaleDateString()}</span>
                    <span className="text-gray-400">-</span>
                    <span suppressHydrationWarning>{new Date(program.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-700">Participants:</span>
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                      {program.trainees?.length || 0} trainees
                    </span>
                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                      {program.facilitators?.length || 0} facilitators
                    </span>
                  </div>
                </div>

                {program.programManager && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Award className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-700">Manager:</span>
                      <span className="text-gray-600">{program.programManager.name}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Primary Actions Row */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSelectedProgram(program);
                      setNewProgram({
                        name: program.name,
                        description: program.description,
                        startDate: program.startDate.split('T')[0],
                        endDate: program.endDate.split('T')[0],
                      });
                      setShowEditModal(true);
                    }}
                    className="bg-gray-50 text-gray-700 px-3 py-2.5 rounded-lg text-xs font-medium hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors border border-gray-200"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProgram(program);
                      setShowDeleteModal(true);
                    }}
                    className="bg-red-50 text-red-700 px-3 py-2.5 rounded-lg text-xs font-medium hover:bg-red-100 flex items-center justify-center gap-2 transition-colors border border-red-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

                {/* Secondary Actions Row */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleArchive(program)}
                    className="bg-orange-50 text-orange-700 px-3 py-2.5 rounded-lg text-xs font-medium hover:bg-orange-100 flex items-center justify-center gap-2 transition-colors border border-orange-200"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    <span>Archive</span>
                  </button>
                  {(program.status === 'Draft' || program.status === 'Rejected') ? (
                    <button
                      onClick={() => handleRequestApproval(program)}
                      className="bg-[#1f497d] text-white px-3 py-2.5 rounded-lg text-xs font-medium hover:bg-[#1a3f6b] flex items-center justify-center gap-2 transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Submit</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => openPreviewModal(program)}
                      className="bg-gray-50 text-gray-700 px-3 py-2.5 rounded-lg text-xs font-medium hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors border border-gray-200"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Details</span>
                    </button>
                  )}
                </div>

                {/* Full Width Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => openAssignModal(program)}
                    className="w-full bg-emerald-50 text-emerald-700 px-3 py-2.5 rounded-lg text-xs font-medium hover:bg-emerald-100 flex items-center justify-center gap-2 transition-colors border border-emerald-200"
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Assign Facilitators & Trainees</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Create New Program</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleCreateProgram();
            }}>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Program Name"
                  value={newProgram.name}
                  onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f497d] focus:border-transparent"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={newProgram.description}
                  onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f497d] focus:border-transparent"
                  rows={3}
                  required
                />
                <input
                  type="date"
                  value={newProgram.startDate}
                  onChange={(e) => setNewProgram({ ...newProgram, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f497d] focus:border-transparent"
                  required
                />
                <input
                  type="date"
                  value={newProgram.endDate}
                  onChange={(e) => setNewProgram({ ...newProgram, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f497d] focus:border-transparent"
                  required
                />
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#1f497d] text-white rounded-lg hover:bg-[#1a3f6b] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1f497d] focus:ring-opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Program</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Program Name"
                value={newProgram.name}
                onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <textarea
                placeholder="Description"
                value={newProgram.description}
                onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
              />
              <input
                type="date"
                value={newProgram.startDate}
                onChange={(e) => setNewProgram({ ...newProgram, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="date"
                value={newProgram.endDate}
                onChange={(e) => setNewProgram({ ...newProgram, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => { setShowEditModal(false); setSelectedProgram(null); }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleEditProgram}
                className="flex-1 px-4 py-2 bg-[#1f497d] text-white rounded-lg hover:bg-[#1a3f6b] transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Delete Program</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{selectedProgram.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setSelectedProgram(null); }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProgram}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Export Programs</h2>
            <p className="text-gray-600 mb-6">
              Choose the format to export all programs
            </p>
            <div className="flex flex-col space-y-3">
              <button
                type="button"
                onClick={() => handleExportAll('pdf')}
                disabled={exporting}
                className="w-full px-4 py-3 bg-[#1f497d] text-white rounded-lg hover:bg-[#1a3f6b] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Export as PDF
              </button>
              <button
                type="button"
                onClick={() => handleExportAll('excel')}
                disabled={exporting}
                className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export as Excel
              </button>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && assigningProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Assign Users to {assigningProgram?.name}</h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Facilitators Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Facilitators</h3>
                
                {/* Available Facilitators */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Available Facilitators:</h4>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white shadow-sm">
                    {facilitators.map((f, idx) => (
                      <label key={f._id || f.email || idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedFacilitators.includes(f._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFacilitators([...selectedFacilitators, f._id]);
                            } else {
                              setSelectedFacilitators(selectedFacilitators.filter(id => id !== f._id));
                            }
                          }}
                          className="accent-[#1f497d] w-4 h-4 rounded border-gray-300"
                        />
                        <div>
                          <div className="font-medium text-sm">{f.name}</div>
                          <div className="text-xs text-gray-500">{f.email}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Currently Assigned Facilitators */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Currently Assigned:</h4>
                  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
                    {assigningProgram?.facilitators?.length > 0 ? (
                      assigningProgram.facilitators.map((f, idx) => (
                        <div key={f._id || f.email || idx} className="flex flex-col p-1">
                          <span className="font-medium text-sm">{f.name}</span>
                          <span className="text-xs text-gray-500">{f.email}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 p-2">No facilitators assigned</div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleAssignFacilitators}
                  disabled={selectedFacilitators.length === 0 || assignLoading}
                  className="w-full bg-[#1f497d] text-white px-4 py-2 rounded-lg hover:bg-[#1a3f6b] transition-colors disabled:opacity-50"
                >
                  {assignLoading ? 'Assigning...' : `Assign ${selectedFacilitators.length} Facilitator${selectedFacilitators.length !== 1 ? 's' : ''}`}
                </button>
              </div>

              {/* Trainees Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Trainees</h3>
                
                {/* Available Trainees */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Available Trainees:</h4>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white shadow-sm">
                    {trainees.map((t, idx) => (
                      <label key={t._id || t.email || idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedTrainees.includes(t._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTrainees([...selectedTrainees, t._id]);
                            } else {
                              setSelectedTrainees(selectedTrainees.filter(id => id !== t._id));
                            }
                          }}
                          className="accent-[#1f497d] w-4 h-4 rounded border-gray-300"
                        />
                        <div>
                          <div className="font-medium text-sm">{t.name}</div>
                          <div className="text-xs text-gray-500">{t.email}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Currently Assigned Trainees */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Currently Assigned:</h4>
                  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
                    {assigningProgram?.trainees?.length > 0 ? (
                      assigningProgram.trainees.map((t, idx) => (
                        <div key={t._id || t.email || idx} className="flex flex-col p-1">
                          <span className="font-medium text-sm">{t.name}</span>
                          <span className="text-xs text-gray-500">{t.email}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 p-2">No trainees assigned</div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleAssignTrainees}
                  disabled={selectedTrainees.length === 0 || assignLoading}
                  className="w-full bg-[#1f497d] text-white px-4 py-2 rounded-lg hover:bg-[#1a3f6b] transition-colors disabled:opacity-50"
                >
                  {assignLoading ? 'Assigning...' : `Assign ${selectedTrainees.length} Trainee${selectedTrainees.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Program Preview Modal */}
      {showPreviewModal && previewingProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl flex flex-col justify-center items-center relative">
            {/* Close Button */}
            <button
              onClick={() => setShowPreviewModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
            
            <div className="w-full flex flex-col md:flex-row gap-8">
              {/* Program Details */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-4 text-[#1f497d]">Program Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs ${previewingProgram.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{previewingProgram.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Start Date:</span>
                    <span><span suppressHydrationWarning>{new Date(previewingProgram.startDate).toLocaleDateString()}</span></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">End Date:</span>
                    <span><span suppressHydrationWarning>{new Date(previewingProgram.endDate).toLocaleDateString()}</span></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Duration:</span>
                    <span>{previewingProgram.duration} weeks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Capacity:</span>
                    <span>{previewingProgram.capacity} trainees</span>
                  </div>
                  {previewingProgram.description && (
                    <div>
                      <span className="font-medium">Description:</span>
                      <p className="text-sm text-gray-600 mt-1">{previewingProgram.description}</p>
                    </div>
                  )}
                </div>
              </div>
              {/* Assigned Users */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-4 text-[#1f497d]">Assigned Users</h3>
                {/* Facilitators */}
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Facilitators ({previewingProgram.facilitators?.length || 0})</h4>
                  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
                    {previewingProgram.facilitators?.length > 0 ? (
                      previewingProgram.facilitators.map((f, idx) => (
                        <div key={f._id || f.email || idx} className="flex flex-col p-1">
                          <span className="font-medium text-sm">{f.name}</span>
                          <span className="text-xs text-gray-500">{f.email}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 p-2">No facilitators assigned</div>
                    )}
                  </div>
                </div>
                {/* Trainees */}
                <div>
                  <h4 className="font-medium mb-2">Trainees ({previewingProgram.trainees?.length || 0})</h4>
                  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
                    {previewingProgram.trainees?.length > 0 ? (
                      previewingProgram.trainees.map((t, idx) => (
                        <div key={t._id || t.email || idx} className="flex flex-col p-1">
                          <span className="font-medium text-sm">{t.name}</span>
                          <span className="text-xs text-gray-500">{t.email}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 p-2">No trainees assigned</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end w-full">
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  openAssignModal(previewingProgram);
                }}
                className="bg-[#1f497d] text-white px-6 py-2 rounded-lg hover:bg-[#1a3f6b] transition-colors"
              >
                Assign Users
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramsPage;