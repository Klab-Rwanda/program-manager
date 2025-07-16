"use client";

import React, { useState } from "react";
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
} from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  specialization?: string;
  enrolledDate?: string;
}

interface Program {
  id: number;
  name: string;
  description: string;
  status: string;
  trainees: number;
  facilitators: number;
  startDate: string;
  endDate: string;
  progress: number;
  category: string;
  maxTrainees: number;
  approvalStatus: string;
  enrolledTrainees: User[];
  assignedFacilitators: User[];
}

const initialPrograms: Program[] = [
  {
    id: 1,
    name: "Data Science Bootcamp",
    description:
      "Comprehensive data science training program covering Python, Machine Learning, and Data Visualization",
    status: "active",
    trainees: 45,
    facilitators: 3,
    startDate: "2024-01-15",
    endDate: "2024-06-15",
    progress: 65,
    category: "Data Science",
    maxTrainees: 50,
    approvalStatus: "approved",
    enrolledTrainees: [
      { id: 1, name: "John Doe", email: "john@example.com", enrolledDate: "2024-01-15" },
      { id: 2, name: "Jane Smith", email: "jane@example.com", enrolledDate: "2024-01-16" },
    ],
    assignedFacilitators: [
      { id: 1, name: "Dr. Sarah Wilson", email: "sarah@example.com", specialization: "Machine Learning" },
      { id: 2, name: "Prof. Mike Johnson", email: "mike@example.com", specialization: "Data Visualization" },
    ],
  },
  {
    id: 2,
    name: "Web Development Mastery",
    description: "Full-stack web development course covering React, Node.js, and modern web technologies",
    status: "active",
    trainees: 32,
    facilitators: 2,
    startDate: "2024-02-01",
    endDate: "2024-07-01",
    progress: 40,
    category: "Web Development",
    maxTrainees: 40,
    approvalStatus: "approved",
    enrolledTrainees: [{ id: 3, name: "Alice Brown", email: "alice@example.com", enrolledDate: "2024-02-01" }],
    assignedFacilitators: [
      { id: 3, name: "Tom Anderson", email: "tom@example.com", specialization: "React Development" },
    ],
  },
  {
    id: 3,
    name: "Mobile App Development",
    description: "iOS and Android development using React Native and Flutter frameworks",
    status: "pending",
    startDate: "2024-03-01",
    endDate: "2024-08-01",
    trainees: 0,
    facilitators: 2,
    progress: 0,
    category: "Mobile Development",
    maxTrainees: 30,
    approvalStatus: "pending",
    enrolledTrainees: [],
    assignedFacilitators: [],
  },
  {
    id: 4,
    name: "UI/UX Design Mastery",
    description: "Complete design thinking and user experience program with hands-on projects",
    status: "completed",
    startDate: "2023-09-01",
    endDate: "2024-01-01",
    trainees: 28,
    facilitators: 2,
    progress: 100,
    category: "Design",
    maxTrainees: 35,
    approvalStatus: "approved",
    enrolledTrainees: [{ id: 4, name: "Emma Davis", email: "emma@example.com", enrolledDate: "2023-09-01" }],
    assignedFacilitators: [{ id: 4, name: "Lisa Chen", email: "lisa@example.com", specialization: "UI Design" }],
  },
  {
    id: 5,
    name: "Cloud Computing Fundamentals",
    description: "AWS, Azure, and Google Cloud platform training with certification preparation",
    status: "draft",
    startDate: "2024-04-01",
    endDate: "2024-09-01",
    trainees: 0,
    facilitators: 1,
    progress: 0,
    category: "Cloud Computing",
    maxTrainees: 25,
    approvalStatus: "draft",
    enrolledTrainees: [],
    assignedFacilitators: [],
  },
];

const availableUsers: User[] = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "student" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", role: "student" },
  { id: 3, name: "Alice Brown", email: "alice@example.com", role: "student" },
  { id: 4, name: "Bob Wilson", email: "bob@example.com", role: "student" },
  { id: 5, name: "Dr. Sarah Wilson", email: "sarah@example.com", role: "facilitator" },
  { id: 6, name: "Prof. Mike Johnson", email: "mike@example.com", role: "facilitator" },
  { id: 7, name: "Tom Anderson", email: "tom@example.com", role: "facilitator" },
];

const ProgramsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [activeTab, setActiveTab] = useState("trainees");
  const [userRole] = useState("superadmin"); // superadmin, admin, facilitator
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [participantModalType, setParticipantModalType] = useState<"trainee" | "facilitator">("trainee");
  const [participantSearchTerm, setParticipantSearchTerm] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);

  const [programs, setPrograms] = useState<Program[]>(initialPrograms);
  const [newProgram, setNewProgram] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    category: "",
    maxTrainees: "",
  });
  const [newParticipant, setNewParticipant] = useState({
    userId: "",
    role: "trainee",
  });

  const filteredPrograms = programs.filter((program) => {
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || program.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const handleCreateProgram = () => {
    if (newProgram.name && newProgram.description && newProgram.startDate && newProgram.endDate && newProgram.category && newProgram.maxTrainees) {
      const program: Program = {
        id: programs.length + 1,
        name: newProgram.name,
        description: newProgram.description,
        status: "draft",
        trainees: 0,
        facilitators: 0,
        startDate: newProgram.startDate,
        endDate: newProgram.endDate,
        progress: 0,
        category: newProgram.category,
        maxTrainees: parseInt(newProgram.maxTrainees),
        approvalStatus: "draft",
        enrolledTrainees: [],
        assignedFacilitators: [],
      };
      setPrograms([...programs, program]);
      setNewProgram({ name: "", description: "", startDate: "", endDate: "", category: "", maxTrainees: "" });
      setShowCreateModal(false);
    }
  };

  const handleEditProgram = () => {
    if (selectedProgram && newProgram.name && newProgram.description && newProgram.startDate && newProgram.endDate && newProgram.category && newProgram.maxTrainees) {
      const updatedPrograms = programs.map((program) =>
        program.id === selectedProgram.id
          ? {
              ...program,
              name: newProgram.name,
              description: newProgram.description,
              startDate: newProgram.startDate,
              endDate: newProgram.endDate,
              category: newProgram.category,
              maxTrainees: parseInt(newProgram.maxTrainees),
            }
          : program
      );
      setPrograms(updatedPrograms);
      setNewProgram({ name: "", description: "", startDate: "", endDate: "", category: "", maxTrainees: "" });
      setShowEditModal(false);
      setSelectedProgram(null);
    }
  };

  const handleDeleteProgram = () => {
    if (selectedProgram) {
      const updatedPrograms = programs.filter((program) => program.id !== selectedProgram.id);
      setPrograms(updatedPrograms);
      setShowDeleteModal(false);
      setSelectedProgram(null);
    }
  };

  const handleAddParticipant = () => {
    if (selectedProgram && newParticipant.userId) {
      const user = availableUsers.find((u) => u.id === parseInt(newParticipant.userId));
      if (user) {
        const updatedPrograms = programs.map((program) =>
          program.id === selectedProgram.id
            ? {
                ...program,
                enrolledTrainees:
                  newParticipant.role === "trainee"
                    ? [...program.enrolledTrainees, { ...user, enrolledDate: new Date().toISOString().split("T")[0] }]
                    : program.enrolledTrainees,
                assignedFacilitators:
                  newParticipant.role === "facilitator"
                    ? [...program.assignedFacilitators, { ...user, specialization: "General" }]
                    : program.assignedFacilitators,
                trainees: newParticipant.role === "trainee" ? program.trainees + 1 : program.trainees,
                facilitators: newParticipant.role === "facilitator" ? program.facilitators + 1 : program.facilitators,
              }
            : program
        );
        setPrograms(updatedPrograms);
        setNewParticipant({ userId: "", role: "trainee" });
        setShowParticipantModal(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 60) return "bg-blue-500";
    if (progress >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Program Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and oversee all training programs</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search programs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
              </select>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Program
              </button>
            </div>
          </div>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program) => (
            <div key={program.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{program.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{program.description}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(program.status)}`}>
                    {program.status}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="font-medium text-gray-900 dark:text-white">{program.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(program.progress)}`}
                      style={{ width: `${program.progress}%` }}
                    ></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Trainees</span>
                      <div className="font-medium text-gray-900 dark:text-white">{program.trainees}/{program.maxTrainees}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Facilitators</span>
                      <div className="font-medium text-gray-900 dark:text-white">{program.facilitators}</div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1 mb-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(program.startDate).toLocaleDateString()} - {new Date(program.endDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {program.category}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedProgram(program);
                      setShowViewModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 py-2 px-3 rounded border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProgram(program);
                      setNewProgram({
                        name: program.name,
                        description: program.description,
                        startDate: program.startDate,
                        endDate: program.endDate,
                        category: program.category,
                        maxTrainees: program.maxTrainees.toString(),
                      });
                      setShowEditModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 py-2 px-3 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProgram(program);
                      setShowManageModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 py-2 px-3 rounded border border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  >
                    <Users className="h-3 w-3" />
                    Manage
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Program Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Create New Program</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Program Name"
                  value={newProgram.name}
                  onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <textarea
                  placeholder="Description"
                  value={newProgram.description}
                  onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={newProgram.startDate}
                    onChange={(e) => setNewProgram({ ...newProgram, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="date"
                    value={newProgram.endDate}
                    onChange={(e) => setNewProgram({ ...newProgram, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Category"
                  value={newProgram.category}
                  onChange={(e) => setNewProgram({ ...newProgram, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <input
                  type="number"
                  placeholder="Max Trainees"
                  value={newProgram.maxTrainees}
                  onChange={(e) => setNewProgram({ ...newProgram, maxTrainees: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProgram}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Program Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Edit Program</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Program Name"
                  value={newProgram.name}
                  onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <textarea
                  placeholder="Description"
                  value={newProgram.description}
                  onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={newProgram.startDate}
                    onChange={(e) => setNewProgram({ ...newProgram, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="date"
                    value={newProgram.endDate}
                    onChange={(e) => setNewProgram({ ...newProgram, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Category"
                  value={newProgram.category}
                  onChange={(e) => setNewProgram({ ...newProgram, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <input
                  type="number"
                  placeholder="Max Trainees"
                  value={newProgram.maxTrainees}
                  onChange={(e) => setNewProgram({ ...newProgram, maxTrainees: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditProgram}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manage Participants Modal */}
        {showManageModal && selectedProgram && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Manage {selectedProgram.name}</h2>
                <button
                  onClick={() => setShowManageModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setActiveTab("trainees")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === "trainees"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
                  }`}
                >
                  Trainees ({selectedProgram.enrolledTrainees.length})
                </button>
                <button
                  onClick={() => setActiveTab("facilitators")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === "facilitators"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
                  }`}
                >
                  Facilitators ({selectedProgram.assignedFacilitators.length})
                </button>
              </div>

              <div className="mb-6">
                <button
                  onClick={() => {
                    setParticipantModalType(activeTab === "trainees" ? "trainee" : "facilitator");
                    setShowParticipantModal(true);
                  }}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  Add {activeTab === "trainees" ? "Trainee" : "Facilitator"}
                </button>
              </div>

              {activeTab === "trainees" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Enrolled Trainees</h3>
                  {selectedProgram.enrolledTrainees.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No trainees enrolled yet.</p>
                  ) : (
                    <div className="grid gap-4">
                      {selectedProgram.enrolledTrainees.map((trainee) => (
                        <div key={trainee.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{trainee.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{trainee.email}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">Enrolled: {trainee.enrolledDate}</div>
                          </div>
                          <button className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm">Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "facilitators" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Assigned Facilitators</h3>
                  {selectedProgram.assignedFacilitators.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No facilitators assigned yet.</p>
                  ) : (
                    <div className="grid gap-4">
                      {selectedProgram.assignedFacilitators.map((facilitator) => (
                        <div key={facilitator.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{facilitator.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{facilitator.email}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">Specialization: {facilitator.specialization}</div>
                          </div>
                          <button className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm">Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Participant Modal */}
        {showParticipantModal && selectedProgram && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Add {participantModalType === "trainee" ? "Trainee" : "Facilitator"}
              </h2>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={participantSearchTerm}
                    onChange={(e) => setParticipantSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                <select
                  value={newParticipant.userId}
                  onChange={(e) => setNewParticipant({ ...newParticipant, userId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select User</option>
                  {availableUsers
                    .filter((user) => {
                      const matchesSearch = user.name.toLowerCase().includes(participantSearchTerm.toLowerCase()) ||
                        user.email.toLowerCase().includes(participantSearchTerm.toLowerCase());
                      const matchesRole = participantModalType === "trainee" ? user.role === "student" : user.role === "facilitator";
                      return matchesSearch && matchesRole;
                    })
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowParticipantModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddParticipant}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Program Modal */}
        {showViewModal && selectedProgram && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedProgram.name}</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Description</h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedProgram.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Status</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedProgram.status)}`}>
                      {selectedProgram.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Category</h3>
                    <p className="text-gray-600 dark:text-gray-400">{selectedProgram.category}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Start Date</h3>
                    <p className="text-gray-600 dark:text-gray-400">{new Date(selectedProgram.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2 text-gray-900 dark:text-white">End Date</h3>
                    <p className="text-gray-600 dark:text-gray-400">{new Date(selectedProgram.endDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Progress</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProgressColor(selectedProgram.progress)}`}
                        style={{ width: `${selectedProgram.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedProgram.progress}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Trainees</h3>
                    <p className="text-gray-600 dark:text-gray-400">{selectedProgram.trainees}/{selectedProgram.maxTrainees}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Facilitators</h3>
                    <p className="text-gray-600 dark:text-gray-400">{selectedProgram.facilitators}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Enrolled Trainees</h3>
                  {selectedProgram.enrolledTrainees.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No trainees enrolled yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedProgram.enrolledTrainees.map((trainee) => (
                        <div key={trainee.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{trainee.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{trainee.email}</div>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Enrolled: {trainee.enrolledDate}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Assigned Facilitators</h3>
                  {selectedProgram.assignedFacilitators.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No facilitators assigned yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedProgram.assignedFacilitators.map((facilitator) => (
                        <div key={facilitator.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{facilitator.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{facilitator.email}</div>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Specialization: {facilitator.specialization}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramsPage;