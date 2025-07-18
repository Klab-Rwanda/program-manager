"use client";

import React, { useState, useEffect } from "react";
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
  Loader2,
  Archive,
  Download,
  FileText,
} from "lucide-react";
import { Program, getAllPrograms, createProgram, updateProgram, deleteProgram, requestApproval } from "@/lib/services/program.service";
import { archiveProgram } from "@/lib/services/archive.service";
import { exportProgramsPDF, exportProgramsExcel, downloadBlob } from "@/lib/services/export.service";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/RoleContext";
import { useCounts } from "@/lib/contexts/CountsContext";

const ProgramsPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
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
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [newProgram, setNewProgram] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  // Fetch programs from API
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        const data = await getAllPrograms();
        setPrograms(data);
      } catch (err) {
        setError("Failed to load programs");
        toast.error("Failed to load programs");
        console.error("Error fetching programs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  const filteredPrograms = programs.filter((program) => {
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || program.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesManager = filterManager === "all" || 
                          (program.programManager && program.programManager.name.toLowerCase().includes(filterManager.toLowerCase()));
    
    // Date filtering
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

  // Sort programs
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

  // Add loading state
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
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  const handleCreateProgram = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to create programs");
      return;
    }

    if (newProgram.name && newProgram.description && newProgram.startDate && newProgram.endDate) {
      try {
        console.log("Creating program:", newProgram);
        console.log("User:", user);
        console.log("Auth token:", localStorage.getItem('accessToken'));
        
        const createdProgram = await createProgram(newProgram);
        console.log("Program created:", createdProgram);
        setPrograms([...programs, createdProgram]);
        setNewProgram({ name: "", description: "", startDate: "", endDate: "" });
      setShowCreateModal(false);
        toast.success("Program created successfully!");
        await refreshCounts(); // Refresh sidebar counts
      } catch (err: any) {
        console.error("Error creating program:", err);
        console.error("Error details:", err.response?.data);
        toast.error(err.response?.data?.message || "Failed to create program");
      }
    } else {
      toast.error("Please fill in all required fields");
    }
  };

  const handleEditProgram = async () => {
    if (selectedProgram && newProgram.name && newProgram.description && newProgram.startDate && newProgram.endDate) {
      try {
        const updatedProgram = await updateProgram(selectedProgram._id, newProgram);
      const updatedPrograms = programs.map((program) =>
          program._id === selectedProgram._id ? updatedProgram : program
      );
      setPrograms(updatedPrograms);
        setNewProgram({ name: "", description: "", startDate: "", endDate: "" });
      setShowEditModal(false);
      setSelectedProgram(null);
        toast.success("Program updated successfully!");
      } catch (err) {
        toast.error("Failed to update program");
        console.error("Error updating program:", err);
      }
    }
  };

  const handleDeleteProgram = async () => {
    if (selectedProgram) {
      try {
        console.log("=== DELETE PROGRAM DEBUG ===");
        console.log("Program ID:", selectedProgram._id);
        console.log("Program Name:", selectedProgram.name);
        console.log("User:", user);
        console.log("User Role:", user?.role);
        console.log("User ID:", user?._id);
        console.log("Auth token:", localStorage.getItem('accessToken'));
        console.log("Is Authenticated:", isAuthenticated);
        console.log("=============================");
        
        await deleteProgram(selectedProgram._id);
        const updatedPrograms = programs.filter((program) => program._id !== selectedProgram._id);
      setPrograms(updatedPrograms);
      setShowDeleteModal(false);
      setSelectedProgram(null);
        toast.success("Program deleted successfully!");
        await refreshCounts(); // Refresh sidebar counts
      } catch (err: any) {
        console.error("=== DELETE ERROR DEBUG ===");
        console.error("Error:", err);
        console.error("Error message:", err.message);
        console.error("Error response:", err.response);
        console.error("Error status:", err.response?.status);
        console.error("Error data:", err.response?.data);
        console.error("===========================");
        toast.error(err.response?.data?.message || "Failed to delete program");
      }
    }
  };

  const handleRequestApproval = async (program: Program) => {
    try {
      await requestApproval(program._id);
      toast.success("Program submitted for approval!");
      // Refresh the programs list
      const data = await getAllPrograms();
      setPrograms(data);
    } catch (err) {
      toast.error("Failed to submit for approval");
      console.error("Error requesting approval:", err);
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
      toast.success(`Exported all programs as ${format.toUpperCase()}`);
      setShowExportModal(false);
    } catch (err: any) {
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    } finally {
      setExporting(false);
    }
  };

  const handleArchive = async (program: Program) => {
    if (!confirm(`Are you sure you want to archive "${program.name}"?`)) {
      return;
    }

    try {
      await archiveProgram(program._id);
      toast.success(`${program.name} has been archived!`);
      // Remove the program from the current list since it's now archived
      const updatedPrograms = programs.filter((p) => p._id !== program._id);
      setPrograms(updatedPrograms);
      await refreshCounts(); // Refresh sidebar counts
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to archive program");
      console.error("Error archiving program:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "pendingapproval":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "draft":
        return <Clock className="h-4 w-4" />;
      case "pendingapproval":
        return <AlertTriangle className="h-4 w-4" />;
      case "completed":
        return <Award className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6">
        {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
          <p className="text-gray-600">Manage your training programs</p>
        </div>
        {isAuthenticated && (user?.role === 'Program Manager' || user?.role === 'SuperAdmin') ? (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowExportModal(true)}
              disabled={exporting || programs.length === 0}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {exporting ? "Exporting..." : "Export"}
            </button>
            <button
              onClick={() => {
                if (isAuthenticated) {
                  setShowCreateModal(true);
                } else {
                  toast.error("Please log in to create programs");
                }
              }}
              className="bg-[#1f497d] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#1a3f6b] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Program
            </button>
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            {!isAuthenticated ? "Please log in to create programs" : "Only Program Managers and Super Admins can create programs"}
          </div>
        )}
        </div>

      {/* Enhanced Search and Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
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
          
          {/* Status Filter */}
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
          
          {/* Date Filter */}
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
          {/* Manager Filter */}
          <div>
            <input
              type="text"
              placeholder="Filter by manager name..."
              value={filterManager}
              onChange={(e) => setFilterManager(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f497d] focus:border-transparent"
            />
          </div>
          
          {/* Sort By */}
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
          
          {/* Sort Order */}
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
        
        {/* Results Counter and Active Filters */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            Showing {sortedPrograms.length} of {programs.length} programs
          </div>
          <div className="flex items-center gap-2">
            {/* Active Filters Display */}
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
        
        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedPrograms.map((program) => (
          <div key={program._id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{program.name}</h3>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(program.status)}`}>
                {getStatusIcon(program.status)}
                    {program.status}
                    </div>
                  </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{program.description}</p>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>{new Date(program.startDate).toLocaleDateString()} - {new Date(program.endDate).toLocaleDateString()}</span>
                    </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Users className="h-4 w-4" />
                <span>{program.trainees?.length || 0} trainees, {program.facilitators?.length || 0} facilitators</span>
                {program.programManager && (
                  <span className="text-xs text-gray-400">• Managed by {program.programManager.name}</span>
                )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
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
                className="flex-1 min-w-0 bg-gray-100 text-gray-700 px-2 py-2 rounded-lg text-xs hover:bg-gray-200 flex items-center justify-center gap-1"
                  >
                    <Edit className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProgram(program);
                  setShowDeleteModal(true);
                }}
                className="flex-1 min-w-0 bg-red-100 text-red-700 px-2 py-2 rounded-lg text-xs hover:bg-red-200 flex items-center justify-center gap-1"
              >
                <Trash2 className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">Delete</span>
              </button>
                  <button
                    onClick={() => handleArchive(program)}
                    className="flex-1 min-w-0 bg-orange-100 text-orange-700 px-2 py-2 rounded-lg text-xs hover:bg-orange-200 flex items-center justify-center gap-1"
                  >
                    <Archive className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">Archive</span>
                  </button>
                             {program.status === 'Draft' && (
                 <button
                   onClick={() => handleRequestApproval(program)}
                   className="flex-1 min-w-0 bg-[#1f497d] text-white px-2 py-2 rounded-lg text-xs hover:bg-[#1a3f6b] flex items-center justify-center gap-1 transition-colors"
                 >
                   <Send className="h-3 w-3 flex-shrink-0" />
                   <span className="truncate">Submit</span>
                  </button>
               )}
            </div>
            </div>
          ))}
        </div>

      {sortedPrograms.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No programs found</h3>
          <p className="text-gray-600">Create your first program to get started.</p>
        </div>
      )}

        {/* Create Program Modal */}
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

        {/* Edit Program Modal */}
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
                  onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditProgram}
                  className="flex-1 px-4 py-2 bg-[#1f497d] text-white rounded-lg hover:bg-[#1a3f6b] transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProgram && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Delete Program</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{selectedProgram.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-2">
                <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                onClick={handleDeleteProgram}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Export Programs</h2>
              <p className="text-gray-600 mb-6">
                Choose the format to export all programs
              </p>
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => handleExportAll('pdf')}
                  disabled={exporting}
                  className="w-full px-4 py-3 bg-[#1f497d] text-white rounded-lg hover:bg-[#1a3f6b] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Export as PDF
                </button>
                <button
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
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default ProgramsPage;