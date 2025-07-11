"use client"

import { useState } from "react"
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
} from "lucide-react"
import "../../../styles/programs.css"

export default function ProgramsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [activeTab, setActiveTab] = useState("trainees")
  const [userRole, setUserRole] = useState("superadmin") // superadmin, admin, facilitator
  const [showParticipantModal, setShowParticipantModal] = useState(false)
  const [participantModalType, setParticipantModalType] = useState("trainee") // "trainee" or "facilitator"
  const [participantSearchTerm, setParticipantSearchTerm] = useState("")
  const [showViewModal, setShowViewModal] = useState(false)

  const [programs, setPrograms] = useState([
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
  ])

  const [newProgram, setNewProgram] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    category: "",
    maxTrainees: "",
  })

  const [availableUsers] = useState([
    { id: 1, name: "John Doe", email: "john@example.com", role: "student" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "student" },
    { id: 3, name: "Alice Brown", email: "alice@example.com", role: "student" },
    { id: 4, name: "Bob Wilson", email: "bob@example.com", role: "student" },
    { id: 5, name: "Dr. Sarah Wilson", email: "sarah@example.com", role: "facilitator" },
    { id: 6, name: "Prof. Mike Johnson", email: "mike@example.com", role: "facilitator" },
    { id: 7, name: "Tom Anderson", email: "tom@example.com", role: "facilitator" },
  ])

  const [newParticipant, setNewParticipant] = useState({
    userId: "",
    role: "trainee",
  })

  const filteredPrograms = programs.filter((program) => {
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || program.status.toLowerCase() === filterStatus.toLowerCase()
    return matchesSearch && matchesFilter
  })

  const handleCreateProgram = () => {
    if (
      !newProgram.name ||
      !newProgram.description ||
      !newProgram.startDate ||
      !newProgram.endDate ||
      !newProgram.category ||
      !newProgram.maxTrainees
    ) {
      alert("Please fill in all required fields")
      return
    }

    const program = {
      id: programs.length + 1,
      ...newProgram,
      maxTrainees: Number.parseInt(newProgram.maxTrainees),
      status: "draft",
      trainees: 0,
      facilitators: 0,
      progress: 0,
      approvalStatus: "draft",
      enrolledTrainees: [],
      assignedFacilitators: [],
    }
    setPrograms([...programs, program])
    setNewProgram({ name: "", description: "", startDate: "", endDate: "", category: "", maxTrainees: "" })
    setShowCreateModal(false)
  }

  const handleEditProgram = () => {
    if (!selectedProgram) return

    setPrograms(
      programs.map((program) =>
        program.id === selectedProgram.id
          ? { ...program, ...newProgram, maxTrainees: Number.parseInt(newProgram.maxTrainees) }
          : program,
      ),
    )
    setShowEditModal(false)
    setSelectedProgram(null)
    setNewProgram({ name: "", description: "", startDate: "", endDate: "", category: "", maxTrainees: "" })
  }

  const handleDeleteProgram = () => {
    if (!selectedProgram) return

    setPrograms(programs.filter((program) => program.id !== selectedProgram.id))
    setShowDeleteModal(false)
    setSelectedProgram(null)
  }

  const handleSubmitForReview = (id) => {
    setPrograms(
      programs.map((program) =>
        program.id === id ? { ...program, approvalStatus: "pending", status: "pending" } : program,
      ),
    )
  }

  const handleApprove = (id) => {
    if (userRole !== "superadmin") {
      alert("Only superadmins can approve programs")
      return
    }

    setPrograms(
      programs.map((program) =>
        program.id === id ? { ...program, approvalStatus: "approved", status: "active" } : program,
      ),
    )
  }

  const handleReject = (id) => {
    if (userRole !== "superadmin") {
      alert("Only superadmins can reject programs")
      return
    }

    setPrograms(
      programs.map((program) =>
        program.id === id ? { ...program, approvalStatus: "rejected", status: "draft" } : program,
      ),
    )
  }

  const openEditModal = (program) => {
    setSelectedProgram(program)
    setNewProgram({
      name: program.name,
      description: program.description,
      startDate: program.startDate,
      endDate: program.endDate,
      category: program.category,
      maxTrainees: program.maxTrainees.toString(),
    })
    setShowEditModal(true)
  }

  const openDeleteModal = (program) => {
    setSelectedProgram(program)
    setShowDeleteModal(true)
  }

  const openManageModal = (program) => {
    setSelectedProgram(program)
    setShowManageModal(true)
    setActiveTab("trainees")
  }

  const openParticipantModal = (type) => {
    setParticipantModalType(type)
    setShowParticipantModal(true)
    setParticipantSearchTerm("")
  }

  const handleSelectParticipant = (userId) => {
    setNewParticipant({ userId: userId.toString(), role: participantModalType })
    setShowParticipantModal(false)
    handleAddParticipant()
  }

  const openViewModal = (program) => {
    setSelectedProgram(program)
    setShowViewModal(true)
  }

  const handleAddParticipant = () => {
    if (!newParticipant.userId || !selectedProgram) return

    const user = availableUsers.find((u) => u.id === Number.parseInt(newParticipant.userId))
    if (!user) return

    const updatedPrograms = programs.map((program) => {
      if (program.id === selectedProgram.id) {
        if (newParticipant.role === "trainee") {
          const isAlreadyEnrolled = program.enrolledTrainees.some((t) => t.id === user.id)
          if (isAlreadyEnrolled) {
            alert("This user is already enrolled as a trainee")
            return program
          }

          if (program.enrolledTrainees.length >= program.maxTrainees) {
            alert("Maximum number of trainees reached")
            return program
          }

          return {
            ...program,
            enrolledTrainees: [
              ...program.enrolledTrainees,
              {
                id: user.id,
                name: user.name,
                email: user.email,
                enrolledDate: new Date().toISOString().split("T")[0],
              },
            ],
            trainees: program.trainees + 1,
          }
        } else {
          const isAlreadyAssigned = program.assignedFacilitators.some((f) => f.id === user.id)
          if (isAlreadyAssigned) {
            alert("This user is already assigned as a facilitator")
            return program
          }

          return {
            ...program,
            assignedFacilitators: [
              ...program.assignedFacilitators,
              {
                id: user.id,
                name: user.name,
                email: user.email,
                specialization: "General",
              },
            ],
            facilitators: program.facilitators + 1,
          }
        }
      }
      return program
    })

    setPrograms(updatedPrograms)
    setSelectedProgram(updatedPrograms.find((p) => p.id === selectedProgram.id))
    setNewParticipant({ userId: "", role: "trainee" })
  }

  const handleRemoveParticipant = (participantId, type) => {
    if (!selectedProgram) return

    const updatedPrograms = programs.map((program) => {
      if (program.id === selectedProgram.id) {
        if (type === "trainee") {
          return {
            ...program,
            enrolledTrainees: program.enrolledTrainees.filter((t) => t.id !== participantId),
            trainees: program.trainees - 1,
          }
        } else {
          return {
            ...program,
            assignedFacilitators: program.assignedFacilitators.filter((f) => f.id !== participantId),
            facilitators: program.facilitators - 1,
          }
        }
      }
      return program
    })

    setPrograms(updatedPrograms)
    setSelectedProgram(updatedPrograms.find((p) => p.id === selectedProgram.id))
  }

  const getStatusConfig = (status, approvalStatus) => {
    if (approvalStatus === "pending") {
      return { icon: Clock, className: "pending", label: "Pending Review" }
    }
    if (approvalStatus === "rejected") {
      return { icon: XCircle, className: "rejected", label: "Rejected" }
    }
    if (approvalStatus === "draft") {
      return { icon: Edit, className: "draft", label: "Draft" }
    }

    switch (status.toLowerCase()) {
      case "active":
        return { icon: CheckCircle, className: "active", label: "Active" }
      case "completed":
        return { icon: Award, className: "completed", label: "Completed" }
      default:
        return { icon: AlertTriangle, className: "default", label: status }
    }
  }

  const availableUsersForRole = (role) => {
    return availableUsers.filter((user) => {
      if (role === "trainee") {
        return user.role === "student"
      } else {
        return user.role === "facilitator"
      }
    })
  }

  const filteredAvailableUsers = (participantModalType) => {
    return availableUsersForRole(participantModalType).filter(
      (user) =>
        user.name.toLowerCase().includes(participantSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(participantSearchTerm.toLowerCase()),
    )
  }

  return (
    <div className="programs-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <BookOpen className="title-icon" />
            Programs Management
          </h1>
          <p className="page-subtitle">Create, manage, and track all training programs</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} />
          Create Program
        </button>
      </div>

      <div className="programs-controls">
        <div className="search-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search programs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-container">
          <Filter className="filter-icon" size={18} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending Review</option>
            <option value="draft">Draft</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="programs-grid">
        {filteredPrograms.map((program) => {
          const statusConfig = getStatusConfig(program.status, program.approvalStatus)
          const StatusIcon = statusConfig.icon

          return (
            <div key={program.id} className="program-card">
              <div className="program-header">
                <div className="program-title-section">
                  <h3 className="program-title">{program.name}</h3>
                  <div className={`status-badge ${statusConfig.className}`}>
                    <StatusIcon size={14} />
                    <span>{statusConfig.label}</span>
                  </div>
                </div>
                <div className="program-category">
                  <span className="category-tag">{program.category}</span>
                </div>
              </div>

              <p className="program-description">{program.description}</p>

              <div className="program-stats">
                <div className="stat-item">
                  <Users size={16} />
                  <span>
                    {program.trainees}/{program.maxTrainees} Trainees
                  </span>
                </div>
                <div className="stat-item">
                  <Award size={16} />
                  <span>{program.facilitators} Facilitators</span>
                </div>
                <div className="stat-item">
                  <Calendar size={16} />
                  <span>{new Date(program.startDate).toLocaleDateString()}</span>
                </div>
              </div>

              {program.approvalStatus === "approved" && (
                <div className="progress-section">
                  <div className="progress-header">
                    <span>Progress</span>
                    <span>{program.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${program.progress}%` }} />
                  </div>
                </div>
              )}

              <div className="card-actions">
                <button className="action-btn view" onClick={() => openViewModal(program)}>
                  <Eye size={16} />
                  View
                </button>

                {program.approvalStatus === "draft" && (
                  <>
                    <button className="action-btn edit" onClick={() => openEditModal(program)}>
                      <Edit size={16} />
                      Edit
                    </button>
                    <button className="action-btn submit" onClick={() => handleSubmitForReview(program.id)}>
                      <Send size={16} />
                      Submit
                    </button>
                  </>
                )}

                {program.approvalStatus === "pending" && userRole === "superadmin" && (
                  <>
                    <button className="action-btn approve" onClick={() => handleApprove(program.id)}>
                      <CheckCircle size={16} />
                      Approve
                    </button>
                    <button className="action-btn reject" onClick={() => handleReject(program.id)}>
                      <XCircle size={16} />
                      Reject
                    </button>
                  </>
                )}

                {program.approvalStatus === "approved" && (
                  <button className="action-btn edit" onClick={() => openManageModal(program)}>
                    <Settings size={16} />
                    Manage
                  </button>
                )}

                <button className="action-btn delete" onClick={() => openDeleteModal(program)}>
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Program Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create New Program</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label>Program Name</label>
                <input
                  type="text"
                  value={newProgram.name}
                  onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                  placeholder="Enter program name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newProgram.description}
                  onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                  placeholder="Describe the program objectives and content"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={newProgram.startDate}
                    onChange={(e) => setNewProgram({ ...newProgram, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={newProgram.endDate}
                    onChange={(e) => setNewProgram({ ...newProgram, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={newProgram.category}
                    onChange={(e) => setNewProgram({ ...newProgram, category: e.target.value })}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Mobile Development">Mobile Development</option>
                    <option value="Design">Design</option>
                    <option value="Cloud Computing">Cloud Computing</option>
                    <option value="AI/ML">AI/Machine Learning</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Max Trainees</label>
                  <input
                    type="number"
                    value={newProgram.maxTrainees}
                    onChange={(e) => setNewProgram({ ...newProgram, maxTrainees: e.target.value })}
                    placeholder="Maximum number of trainees"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleCreateProgram}>
                  Create Program
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Program Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Program</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label>Program Name</label>
                <input
                  type="text"
                  value={newProgram.name}
                  onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                  placeholder="Enter program name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newProgram.description}
                  onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                  placeholder="Describe the program objectives and content"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={newProgram.startDate}
                    onChange={(e) => setNewProgram({ ...newProgram, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={newProgram.endDate}
                    onChange={(e) => setNewProgram({ ...newProgram, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={newProgram.category}
                    onChange={(e) => setNewProgram({ ...newProgram, category: e.target.value })}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Mobile Development">Mobile Development</option>
                    <option value="Design">Design</option>
                    <option value="Cloud Computing">Cloud Computing</option>
                    <option value="AI/ML">AI/Machine Learning</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Max Trainees</label>
                  <input
                    type="number"
                    value={newProgram.maxTrainees}
                    onChange={(e) => setNewProgram({ ...newProgram, maxTrainees: e.target.value })}
                    placeholder="Maximum number of trainees"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleEditProgram}>
                  Update Program
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal confirmation-modal">
            <div className="confirmation-content">
              <div className="confirmation-icon">
                <AlertTriangle size={24} />
              </div>
              <h3 className="confirmation-title">Delete Program</h3>
              <p className="confirmation-message">
                Are you sure you want to delete "{selectedProgram?.name}"? This action cannot be undone.
              </p>
              <div className="confirmation-actions">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDeleteProgram}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Program Modal */}
      {showManageModal && selectedProgram && (
        <div className="modal-overlay">
          <div className="modal management-modal">
            <div className="modal-header">
              <h2>Manage Program: {selectedProgram.name}</h2>
              <button className="close-btn" onClick={() => setShowManageModal(false)}>
                ×
              </button>
            </div>

            <div className="management-tabs">
              <button
                className={`tab-button ${activeTab === "trainees" ? "active" : ""}`}
                onClick={() => setActiveTab("trainees")}
              >
                <Users size={16} />
                Trainees ({selectedProgram.enrolledTrainees.length})
              </button>
              <button
                className={`tab-button ${activeTab === "facilitators" ? "active" : ""}`}
                onClick={() => setActiveTab("facilitators")}
              >
                <Award size={16} />
                Facilitators ({selectedProgram.assignedFacilitators.length})
              </button>
            </div>

            <div className="tab-content">
              {activeTab === "trainees" && (
                <div>
                  <div className="add-participant-form">
                    <button className="btn btn-primary btn-small" onClick={() => openParticipantModal("trainee")}>
                      <UserPlus size={16} />
                      Add Trainee
                    </button>
                  </div>

                  <div className="participants-list">
                    {selectedProgram.enrolledTrainees.length > 0 ? (
                      selectedProgram.enrolledTrainees.map((trainee) => (
                        <div key={trainee.id} className="participant-item">
                          <div className="participant-info">
                            <div className="participant-name">{trainee.name}</div>
                            <div className="participant-email">{trainee.email}</div>
                            <div className="participant-email">
                              Enrolled: {new Date(trainee.enrolledDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="participant-actions">
                            <button
                              className="btn btn-danger btn-small"
                              onClick={() => handleRemoveParticipant(trainee.id, "trainee")}
                            >
                              <Trash2 size={14} />
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <Users className="empty-state-icon" />
                        <p>No trainees enrolled yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "facilitators" && (
                <div>
                  <div className="add-participant-form">
                    <button className="btn btn-primary btn-small" onClick={() => openParticipantModal("facilitator")}>
                      <UserPlus size={16} />
                      Add Facilitator
                    </button>
                  </div>

                  <div className="participants-list">
                    {selectedProgram.assignedFacilitators.length > 0 ? (
                      selectedProgram.assignedFacilitators.map((facilitator) => (
                        <div key={facilitator.id} className="participant-item">
                          <div className="participant-info">
                            <div className="participant-name">{facilitator.name}</div>
                            <div className="participant-email">{facilitator.email}</div>
                            <div className="participant-email">Specialization: {facilitator.specialization}</div>
                          </div>
                          <div className="participant-actions">
                            <button
                              className="btn btn-danger btn-small"
                              onClick={() => handleRemoveParticipant(facilitator.id, "facilitator")}
                            >
                              <Trash2 size={14} />
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <Award className="empty-state-icon" />
                        <p>No facilitators assigned yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Participant Selection Modal */}
      {showParticipantModal && (
        <div className="modal-overlay">
          <div className="modal participant-modal">
            <div className="modal-header">
              <h2>Select {participantModalType === "trainee" ? "Student" : "Facilitator"}</h2>
              <button className="close-btn" onClick={() => setShowParticipantModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label>Search {participantModalType === "trainee" ? "Students" : "Facilitators"}</label>
                <div className="search-container">
                  <Search className="search-icon" size={18} />
                  <input
                    type="text"
                    placeholder={`Search ${participantModalType === "trainee" ? "students" : "facilitators"}...`}
                    value={participantSearchTerm}
                    onChange={(e) => setParticipantSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>
              <div className="participants-selection-list">
                {filteredAvailableUsers(participantModalType).length > 0 ? (
                  filteredAvailableUsers(participantModalType).map((user) => (
                    <div key={user.id} className="participant-selection-item">
                      <div className="participant-info">
                        <div className="participant-name">{user.name}</div>
                        <div className="participant-email">{user.email}</div>
                      </div>
                      <button className="btn btn-primary btn-small" onClick={() => handleSelectParticipant(user.id)}>
                        Select
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <Users className="empty-state-icon" />
                    <p>No {participantModalType === "trainee" ? "students" : "facilitators"} found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Program Modal */}
      {showViewModal && selectedProgram && (
        <div className="modal-overlay">
          <div className="modal view-modal">
            <div className="modal-header">
              <h2>{selectedProgram.name}</h2>
              <button className="close-btn" onClick={() => setShowViewModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-form">
              <div className="program-details">
                <div className="detail-section">
                  <h3>Program Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Category:</label>
                      <span>{selectedProgram.category}</span>
                    </div>
                    <div className="detail-item">
                      <label>Status:</label>
                      <span
                        className={`status-badge ${getStatusConfig(selectedProgram.status, selectedProgram.approvalStatus).className}`}
                      >
                        {getStatusConfig(selectedProgram.status, selectedProgram.approvalStatus).label}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Start Date:</label>
                      <span>{new Date(selectedProgram.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <label>End Date:</label>
                      <span>{new Date(selectedProgram.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <label>Max Trainees:</label>
                      <span>{selectedProgram.maxTrainees}</span>
                    </div>
                    <div className="detail-item">
                      <label>Current Trainees:</label>
                      <span>{selectedProgram.trainees}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Description</h3>
                  <p>{selectedProgram.description}</p>
                </div>

                {selectedProgram.approvalStatus === "approved" && (
                  <div className="detail-section">
                    <h3>Progress</h3>
                    <div className="progress-section">
                      <div className="progress-header">
                        <span>Overall Progress</span>
                        <span>{selectedProgram.progress}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${selectedProgram.progress}%` }} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="detail-section">
                  <h3>Enrolled Trainees ({selectedProgram.enrolledTrainees.length})</h3>
                  {selectedProgram.enrolledTrainees.length > 0 ? (
                    <div className="participants-list">
                      {selectedProgram.enrolledTrainees.map((trainee) => (
                        <div key={trainee.id} className="participant-item">
                          <div className="participant-info">
                            <div className="participant-name">{trainee.name}</div>
                            <div className="participant-email">{trainee.email}</div>
                            <div className="participant-email">
                              Enrolled: {new Date(trainee.enrolledDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-message">No trainees enrolled yet</p>
                  )}
                </div>

                <div className="detail-section">
                  <h3>Assigned Facilitators ({selectedProgram.assignedFacilitators.length})</h3>
                  {selectedProgram.assignedFacilitators.length > 0 ? (
                    <div className="participants-list">
                      {selectedProgram.assignedFacilitators.map((facilitator) => (
                        <div key={facilitator.id} className="participant-item">
                          <div className="participant-info">
                            <div className="participant-name">{facilitator.name}</div>
                            <div className="participant-email">{facilitator.email}</div>
                            <div className="participant-email">Specialization: {facilitator.specialization}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-message">No facilitators assigned yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
