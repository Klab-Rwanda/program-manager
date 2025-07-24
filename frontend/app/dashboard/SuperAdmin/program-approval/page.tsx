"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Users,
  FileText,
  Loader2,
  User
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/RoleContext";
import { Program } from "@/types";
import { getAllPrograms, approveProgram, rejectProgram } from "@/lib/services/program.service";

const ProgramApprovalPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch all programs
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        const data = await getAllPrograms();
        setPrograms(data);
      } catch (err: any) {
        setError(err.message || "Failed to load programs");
        toast.error("Failed to load programs");
        console.error("Error fetching programs:", err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.role === 'SuperAdmin') {
      fetchPrograms();
    }
  }, [isAuthenticated, user]);

  // Filter programs based on search and status
  const filteredPrograms = Array.isArray(programs)
    ? programs.filter((program) => {
        const matchesSearch = 
          (program.programManager?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          program.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === "all" || program.status.toLowerCase() === filterStatus.toLowerCase();

        return matchesSearch && matchesStatus;
      })
    : [];

  // Approve program
  const handleApprove = async (programId: string) => {
    if (!confirm("Are you sure you want to approve this program?")) return;

    try {
      setProcessingId(programId);
      const updatedProgram = await approveProgram(programId);
      setPrograms(programs.map(p => p._id === programId ? updatedProgram : p));
      toast.success("Program approved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to approve program");
      console.error("Error approving program:", err);
    } finally {
      setProcessingId(null);
    }
  };

  // Reject program
  const handleReject = async () => {
    if (!selectedProgram || !rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      setProcessingId(selectedProgram._id);
      const updatedProgram = await rejectProgram(selectedProgram._id, rejectReason);
      setPrograms(programs.map(p => p._id === selectedProgram._id ? updatedProgram : p));
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedProgram(null);
      toast.success("Program rejected successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to reject program");
      console.error("Error rejecting program:", err);
    } finally {
      setProcessingId(null);
    }
  };

  // Get status styling
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "pendingapproval":
        return "bg-yellow-100 text-yellow-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "draft":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pendingapproval":
        return <Clock className="h-4 w-4" />;
      case "active":
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "draft":
        return <FileText className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Get counts for each status
  const statusCounts = Array.isArray(programs) ? {
    all: programs.length,
    pendingapproval: programs.filter(p => p.status?.toLowerCase() === 'pendingapproval').length,
    active: programs.filter(p => p.status?.toLowerCase() === 'active').length,
    completed: programs.filter(p => p.status?.toLowerCase() === 'completed').length,
    rejected: programs.filter(p => p.status?.toLowerCase() === 'rejected').length,
    draft: programs.filter(p => p.status?.toLowerCase() === 'draft').length,
  } : {
    all: 0,
    pendingapproval: 0,
    active: 0,
    completed: 0,
    rejected: 0,
    draft: 0,
  };

  if (!isAuthenticated || user?.role !== 'SuperAdmin') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-500">Access denied. SuperAdmin role required.</p>
        </div>
      </div>
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
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Program Approval</h1>
        <p className="text-gray-600">Review and manage program approval requests</p>
      </div>

      {/* Status Filter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <button
          onClick={() => setFilterStatus("all")}
          className={`p-4 rounded-lg border text-center transition-colors ${
            filterStatus === "all" 
              ? "bg-[#1f497d] text-white border-[#1f497d]" 
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          }`}
        >
          <div className="text-2xl font-bold">{statusCounts.all}</div>
          <div className="text-sm">All Programs</div>
        </button>
        
        <button
          onClick={() => setFilterStatus("pendingapproval")}
          className={`p-4 rounded-lg border text-center transition-colors ${
            filterStatus === "pendingapproval" 
              ? "bg-gray-400 text-white border-gray-400" 
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          }`}
        >
          <div className="text-2xl font-bold">{statusCounts.pendingapproval}</div>
          <div className="text-sm">Pending</div>
        </button>

        <button
          onClick={() => setFilterStatus("active")}
          className={`p-4 rounded-lg border text-center transition-colors ${
            filterStatus === "active" 
              ? "bg-[#1f497d] text-white border-[#1f497d]" 
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          }`}
        >
          <div className="text-2xl font-bold">{statusCounts.active}</div>
          <div className="text-sm">Active</div>
        </button>

        <button
          onClick={() => setFilterStatus("completed")}
          className={`p-4 rounded-lg border text-center transition-colors ${
            filterStatus === "completed" 
              ? "bg-gray-400 text-white border-gray-400" 
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          }`}
        >
          <div className="text-2xl font-bold">{statusCounts.completed}</div>
          <div className="text-sm">Completed</div>
        </button>

        <button
          onClick={() => setFilterStatus("rejected")}
          className={`p-4 rounded-lg border text-center transition-colors ${
            filterStatus === "rejected" 
              ? "bg-[#1f497d] text-white border-[#1f497d]" 
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          }`}
        >
          <div className="text-2xl font-bold">{statusCounts.rejected}</div>
          <div className="text-sm">Rejected</div>
        </button>

        <button
          onClick={() => setFilterStatus("draft")}
          className={`p-4 rounded-lg border text-center transition-colors ${
            filterStatus === "draft" 
              ? "bg-gray-400 text-white border-gray-400" 
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          }`}
        >
          <div className="text-2xl font-bold">{statusCounts.draft}</div>
          <div className="text-sm">Draft</div>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by program name, description, or manager..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f497d] focus:border-transparent"
              />
            </div>
          </div>
          <div className="text-sm text-gray-600 flex items-center">
            Showing {filteredPrograms.length} of {programs.length} programs
          </div>
        </div>
      </div>

      {/* Programs Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {filteredPrograms.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No programs found</h3>
            <p className="text-gray-600">
              {filterStatus === "all" 
                ? "No programs available." 
                : `No programs with ${filterStatus} status.`
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Program
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPrograms.map((program) => (
                  <tr key={program._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{program.name}</div>
                        <div className="text-sm text-gray-500 line-clamp-2">{program.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {program.programManager?.name || 'Unassigned'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {program.programManager?.email || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-2" />
                        <div>
                          <div>{new Date(program.startDate).toLocaleDateString()}</div>
                          <div>to {new Date(program.endDate).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(program.status)}`}>
                        {getStatusIcon(program.status)}
                        {program.status}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{(program.trainees?.length || 0) + (program.facilitators?.length || 0)} total</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedProgram(program);
                            setShowDetailsModal(true);
                          }}
                          className="text-[#1f497d] hover:text-[#1a3f6b] p-1 rounded"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {program.status.toLowerCase() === 'pendingapproval' && (
                          <>
                            <button
                              onClick={() => handleApprove(program._id)}
                              disabled={processingId === program._id}
                              className="bg-[#1f497d] text-white px-3 py-1 rounded text-xs hover:bg-[#1a3f6b] transition-colors disabled:opacity-50"
                              title="Approve Program"
                            >
                              {processingId === program._id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Approve"
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProgram(program);
                                setShowRejectModal(true);
                              }}
                              className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition-colors"
                              title="Reject Program"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Program Details Modal */}
      {showDetailsModal && selectedProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">Program Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program Name</label>
                <p className="text-gray-900">{selectedProgram.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-900">{selectedProgram.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <p className="text-gray-900">{new Date(selectedProgram.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <p className="text-gray-900">{new Date(selectedProgram.endDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(selectedProgram.status)}`}>
                  {getStatusIcon(selectedProgram.status)}
                  {selectedProgram.status}
                </div>
              </div>

              {selectedProgram.rejectionReason && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
                  <p className="text-red-600 bg-red-50 p-2 rounded">{selectedProgram.rejectionReason}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program Manager</label>
                <p className="text-gray-900">
                  {selectedProgram.programManager?.name || 'Unassigned'}
                  {selectedProgram.programManager?.email && (
                    <span className="text-gray-500 ml-2">({selectedProgram.programManager.email})</span>
                  )}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trainees</label>
                  <p className="text-gray-900">{selectedProgram.trainees?.length || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facilitators</label>
                  <p className="text-gray-900">{selectedProgram.facilitators?.length || 0}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <p className="text-gray-900 text-sm">{new Date(selectedProgram.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                  <p className="text-gray-900 text-sm">{new Date(selectedProgram.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Program Modal */}
      {showRejectModal && selectedProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Reject Program</h2>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting "{selectedProgram.name}":
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f497d] focus:border-transparent"
              rows={4}
              required
            />
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                  setSelectedProgram(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || processingId === selectedProgram._id}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {processingId === selectedProgram._id ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  "Reject Program"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramApprovalPage;