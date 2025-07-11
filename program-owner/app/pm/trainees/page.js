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
  UserPlus,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  CheckCircle,
  XCircle,
  Github,
  Linkedin,
  FileText,
  Star,
} from "lucide-react"
import "../../../styles/trainees.css"
export default function TraineesPage() {
  const [activeTab, setActiveTab] = useState("active")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedTrainee, setSelectedTrainee] = useState(null)

  const [trainees, setTrainees] = useState([
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1234567890",
      location: "Kigali, Rwanda",
      domain: "Web Development",
      program: "Full Stack Development Bootcamp",
      status: "active",
      joinDate: "2024-01-15",
      avatar: "JD",
      performance: {
        attendance: 95,
        assignments: 88,
        projects: 92,
        overall: 91,
      },
      github: "johndoe",
      linkedin: "john-doe",
      completedAssignments: 15,
      totalAssignments: 18,
      certificates: 3,
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@example.com",
      phone: "+1234567891",
      location: "Kigali, Rwanda",
      domain: "Data Science",
      program: "Data Science Bootcamp",
      status: "active",
      joinDate: "2024-01-20",
      avatar: "JS",
      performance: {
        attendance: 98,
        assignments: 94,
        projects: 96,
        overall: 96,
      },
      github: "janesmith",
      linkedin: "jane-smith",
      completedAssignments: 16,
      totalAssignments: 18,
      certificates: 4,
    },
    {
      id: 3,
      name: "Alice Brown",
      email: "alice.brown@example.com",
      phone: "+1234567892",
      location: "Kigali, Rwanda",
      domain: "UI/UX Design",
      program: "Design Thinking Program",
      status: "graduated",
      joinDate: "2023-09-01",
      graduationDate: "2024-01-01",
      avatar: "AB",
      performance: {
        attendance: 100,
        assignments: 98,
        projects: 95,
        overall: 97,
      },
      github: "alicebrown",
      linkedin: "alice-brown",
      completedAssignments: 20,
      totalAssignments: 20,
      certificates: 5,
    },
  ])

  const [applications, setApplications] = useState([
    {
      id: 1,
      name: "Bob Wilson",
      email: "bob.wilson@example.com",
      phone: "+1234567893",
      location: "Kigali, Rwanda",
      domain: "Mobile Development",
      program: "Mobile App Development",
      appliedDate: "2024-01-10",
      status: "pending",
      avatar: "BW",
      motivation: "I am passionate about mobile development and want to create apps that solve real-world problems...",
      experience: "2 years of self-taught programming",
      education: "Bachelor's in Computer Science",
      github: "bobwilson",
      linkedin: "bob-wilson",
      portfolio: "https://bobwilson.dev",
    },
    {
      id: 2,
      name: "Emma Davis",
      email: "emma.davis@example.com",
      phone: "+1234567894",
      location: "Kigali, Rwanda",
      domain: "Data Science",
      program: "Data Science Bootcamp",
      appliedDate: "2024-01-12",
      status: "pending",
      avatar: "ED",
      motivation:
        "Data science fascinates me because it combines my love for mathematics with practical problem-solving...",
      experience: "Fresh graduate with internship experience",
      education: "Bachelor's in Mathematics",
      github: "emmadavis",
      linkedin: "emma-davis",
      portfolio: "https://emmadavis.portfolio.com",
    },
  ])

  const [newTrainee, setNewTrainee] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    domain: "",
    program: "",
    github: "",
    linkedin: "",
  })

  const programs = [
    "Full Stack Development Bootcamp",
    "Data Science Bootcamp",
    "Mobile App Development",
    "UI/UX Design Mastery",
    "Cloud Computing Fundamentals",
  ]

  const filteredTrainees = trainees.filter((trainee) => {
    const matchesSearch =
      trainee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainee.domain.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || trainee.status === filterStatus
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && trainee.status === "active") ||
      (activeTab === "graduated" && trainee.status === "graduated") ||
      (activeTab === "inactive" && trainee.status === "inactive")
    return matchesSearch && matchesFilter && matchesTab
  })

  const filteredApplications = applications.filter((application) => {
    const matchesSearch =
      application.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.domain.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const handleCreateTrainee = () => {
    if (!newTrainee.name || !newTrainee.email || !newTrainee.domain || !newTrainee.program) {
      alert("Please fill in all required fields")
      return
    }

    const trainee = {
      id: trainees.length + 1,
      ...newTrainee,
      status: "active",
      joinDate: new Date().toISOString().split("T")[0],
      avatar: newTrainee.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase(),
      performance: {
        attendance: 0,
        assignments: 0,
        projects: 0,
        overall: 0,
      },
      completedAssignments: 0,
      totalAssignments: 0,
      certificates: 0,
    }

    setTrainees([...trainees, trainee])
    setNewTrainee({
      name: "",
      email: "",
      phone: "",
      location: "",
      domain: "",
      program: "",
      github: "",
      linkedin: "",
    })
    setShowCreateModal(false)
  }

  const handleEditTrainee = () => {
    if (!selectedTrainee) return

    setTrainees(
      trainees.map((trainee) => (trainee.id === selectedTrainee.id ? { ...trainee, ...newTrainee } : trainee)),
    )
    setShowEditModal(false)
    setSelectedTrainee(null)
    setNewTrainee({
      name: "",
      email: "",
      phone: "",
      location: "",
      domain: "",
      program: "",
      github: "",
      linkedin: "",
    })
  }

  const handleDeleteTrainee = () => {
    if (!selectedTrainee) return

    setTrainees(trainees.filter((trainee) => trainee.id !== selectedTrainee.id))
    setShowDeleteModal(false)
    setSelectedTrainee(null)
  }

  const handleApplicationAction = (applicationId, action) => {
    const application = applications.find((app) => app.id === applicationId)
    if (!application) return

    if (action === "accept") {
      // Move application to trainees
      const newTrainee = {
        id: trainees.length + 1,
        name: application.name,
        email: application.email,
        phone: application.phone,
        location: application.location,
        domain: application.domain,
        program: application.program,
        status: "active",
        joinDate: new Date().toISOString().split("T")[0],
        avatar: application.avatar,
        performance: {
          attendance: 0,
          assignments: 0,
          projects: 0,
          overall: 0,
        },
        github: application.github,
        linkedin: application.linkedin,
        completedAssignments: 0,
        totalAssignments: 0,
        certificates: 0,
      }
      setTrainees([...trainees, newTrainee])
      setApplications(applications.filter((app) => app.id !== applicationId))
    } else if (action === "reject") {
      setApplications(applications.filter((app) => app.id !== applicationId))
    }
  }

  const openEditModal = (trainee) => {
    setSelectedTrainee(trainee)
    setNewTrainee({
      name: trainee.name,
      email: trainee.email,
      phone: trainee.phone || "",
      location: trainee.location || "",
      domain: trainee.domain,
      program: trainee.program,
      github: trainee.github || "",
      linkedin: trainee.linkedin || "",
    })
    setShowEditModal(true)
  }

  const openDeleteModal = (trainee) => {
    setSelectedTrainee(trainee)
    setShowDeleteModal(true)
  }

  const openViewModal = (trainee) => {
    setSelectedTrainee(trainee)
    setShowViewModal(true)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "graduated":
        return "bg-blue-100 text-blue-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="trainees-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <Users className="title-icon" />
            Trainees Management
          </h1>
          <p className="page-subtitle">Manage trainees, applications, and track their progress</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Add Trainee
          </button>
        </div>
      </div>

      <div className="trainees-tabs">
        <button className={`tab-btn ${activeTab === "active" ? "active" : ""}`} onClick={() => setActiveTab("active")}>
          <Users size={16} />
          Active Trainees ({trainees.filter((t) => t.status === "active").length})
        </button>
        <button
          className={`tab-btn ${activeTab === "applications" ? "active" : ""}`}
          onClick={() => setActiveTab("applications")}
        >
          <UserPlus size={16} />
          Applications ({applications.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "graduated" ? "active" : ""}`}
          onClick={() => setActiveTab("graduated")}
        >
          <GraduationCap size={16} />
          Graduated ({trainees.filter((t) => t.status === "graduated").length || 0})
        </button>
      </div>

      <div className="trainees-controls">
        <div className="search-filter-container">
          <div className="search-container">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search trainees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          {activeTab !== "applications" && (
            <div className="filter-container">
              <Filter className="filter-icon" size={18} />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="graduated">Graduated</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {activeTab === "applications" ? (
        <div className="applications-list">
          {filteredApplications.map((application) => (
            <div key={application.id} className="application-card">
              <div className="application-header">
                <div className="applicant-info">
                  <div className="applicant-avatar">{application.avatar}</div>
                  <div>
                    <div className="applicant-name">{application.name}</div>
                    <div className="applicant-domain">{application.domain}</div>
                  </div>
                </div>
                <div className="application-date">
                  <Calendar size={14} />
                  Applied: {new Date(application.appliedDate).toLocaleDateString()}
                </div>
              </div>

              <div className="application-content">
                <div className="application-details">
                  <div className="detail-item">
                    <Mail size={14} />
                    {application.email}
                  </div>
                  <div className="detail-item">
                    <Phone size={14} />
                    {application.phone}
                  </div>
                  <div className="detail-item">
                    <MapPin size={14} />
                    {application.location}
                  </div>
                </div>
                <div className="motivation-preview">
                  <p>{application.motivation}</p>
                </div>
              </div>

              <div className="application-actions">
                <button className="action-btn view">
                  <Eye size={14} />
                  View Details
                </button>
                <button className="action-btn accept" onClick={() => handleApplicationAction(application.id, "accept")}>
                  <CheckCircle size={14} />
                  Accept
                </button>
                <button className="action-btn reject" onClick={() => handleApplicationAction(application.id, "reject")}>
                  <XCircle size={14} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="trainees-grid">
          {filteredTrainees.map((trainee) => (
            <div key={trainee.id} className="trainee-card">
              <div className="card-header">
                <div className="trainee-avatar">{trainee.avatar}</div>
                <div className="trainee-badges">
                  <div className={`status-badge ${getStatusColor(trainee.status)}`}>{trainee.status}</div>
                </div>
              </div>

              <div className="card-content">
                <div className="trainee-name">{trainee.name}</div>
                <div className="trainee-domain">{trainee.domain}</div>
                <div className="trainee-program">{trainee.program}</div>

                <div className="trainee-info">
                  <div className="info-item">
                    <Mail size={14} />
                    {trainee.email}
                  </div>
                  <div className="info-item">
                    <Calendar size={14} />
                    Joined: {new Date(trainee.joinDate).toLocaleDateString()}
                  </div>
                </div>

                {trainee.status === "active" && (
                  <div className="performance-stats">
                    <div className="stat-row">
                      <div className="stat-item">
                        <div className="stat-label">Attendance</div>
                        <div className="stat-bar">
                          <div className="stat-fill" style={{ width: `${trainee.performance.attendance}%` }} />
                        </div>
                        <div className="stat-value">{trainee.performance.attendance}%</div>
                      </div>
                    </div>
                    <div className="stat-row">
                      <div className="stat-item">
                        <div className="stat-label">Assignments</div>
                        <div className="stat-bar">
                          <div className="stat-fill" style={{ width: `${trainee.performance.assignments}%` }} />
                        </div>
                        <div className="stat-value">{trainee.performance.assignments}%</div>
                      </div>
                    </div>
                    <div className="assignments-progress">
                      <FileText size={14} />
                      {trainee.completedAssignments}/{trainee.totalAssignments} Assignments
                    </div>
                  </div>
                )}

                {trainee.status === "graduated" && (
                  <div className="graduation-info">
                    <div className="info-item">
                      <Award size={14} />
                      Graduated: {new Date(trainee.graduationDate).toLocaleDateString()}
                    </div>
                    <div className="info-item">
                      <Star size={14} />
                      {trainee.certificates} Certificates Earned
                    </div>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <button className="footer-btn" onClick={() => openViewModal(trainee)}>
                  <Eye size={14} />
                  View
                </button>
                <button className="footer-btn" onClick={() => openEditModal(trainee)}>
                  <Edit size={14} />
                  Edit
                </button>
                <button className="footer-btn" onClick={() => openDeleteModal(trainee)}>
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Trainee Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Trainee</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={newTrainee.name}
                    onChange={(e) => setNewTrainee({ ...newTrainee, name: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={newTrainee.email}
                    onChange={(e) => setNewTrainee({ ...newTrainee, email: e.target.value })}
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={newTrainee.phone}
                    onChange={(e) => setNewTrainee({ ...newTrainee, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={newTrainee.location}
                    onChange={(e) => setNewTrainee({ ...newTrainee, location: e.target.value })}
                    placeholder="Enter location"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Domain *</label>
                  <select
                    value={newTrainee.domain}
                    onChange={(e) => setNewTrainee({ ...newTrainee, domain: e.target.value })}
                    required
                  >
                    <option value="">Select Domain</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Mobile Development">Mobile Development</option>
                    <option value="UI/UX Design">UI/UX Design</option>
                    <option value="Cloud Computing">Cloud Computing</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Program *</label>
                  <select
                    value={newTrainee.program}
                    onChange={(e) => setNewTrainee({ ...newTrainee, program: e.target.value })}
                    required
                  >
                    <option value="">Select Program</option>
                    {programs.map((program) => (
                      <option key={program} value={program}>
                        {program}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>GitHub Username</label>
                  <input
                    type="text"
                    value={newTrainee.github}
                    onChange={(e) => setNewTrainee({ ...newTrainee, github: e.target.value })}
                    placeholder="GitHub username"
                  />
                </div>
                <div className="form-group">
                  <label>LinkedIn Profile</label>
                  <input
                    type="text"
                    value={newTrainee.linkedin}
                    onChange={(e) => setNewTrainee({ ...newTrainee, linkedin: e.target.value })}
                    placeholder="LinkedIn profile"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleCreateTrainee}>
                  Add Trainee
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Trainee Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Trainee</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={newTrainee.name}
                    onChange={(e) => setNewTrainee({ ...newTrainee, name: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={newTrainee.email}
                    onChange={(e) => setNewTrainee({ ...newTrainee, email: e.target.value })}
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={newTrainee.phone}
                    onChange={(e) => setNewTrainee({ ...newTrainee, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={newTrainee.location}
                    onChange={(e) => setNewTrainee({ ...newTrainee, location: e.target.value })}
                    placeholder="Enter location"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Domain *</label>
                  <select
                    value={newTrainee.domain}
                    onChange={(e) => setNewTrainee({ ...newTrainee, domain: e.target.value })}
                    required
                  >
                    <option value="">Select Domain</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Mobile Development">Mobile Development</option>
                    <option value="UI/UX Design">UI/UX Design</option>
                    <option value="Cloud Computing">Cloud Computing</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Program *</label>
                  <select
                    value={newTrainee.program}
                    onChange={(e) => setNewTrainee({ ...newTrainee, program: e.target.value })}
                    required
                  >
                    <option value="">Select Program</option>
                    {programs.map((program) => (
                      <option key={program} value={program}>
                        {program}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>GitHub Username</label>
                  <input
                    type="text"
                    value={newTrainee.github}
                    onChange={(e) => setNewTrainee({ ...newTrainee, github: e.target.value })}
                    placeholder="GitHub username"
                  />
                </div>
                <div className="form-group">
                  <label>LinkedIn Profile</label>
                  <input
                    type="text"
                    value={newTrainee.linkedin}
                    onChange={(e) => setNewTrainee({ ...newTrainee, linkedin: e.target.value })}
                    placeholder="LinkedIn profile"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleEditTrainee}>
                  Update Trainee
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
                <Trash2 size={24} />
              </div>
              <h3 className="confirmation-title">Delete Trainee</h3>
              <p className="confirmation-message">
                Are you sure you want to delete "{selectedTrainee?.name}"? This action cannot be undone.
              </p>
              <div className="confirmation-actions">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDeleteTrainee}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Trainee Modal */}
      {showViewModal && selectedTrainee && (
        <div className="modal-overlay">
          <div className="modal view-modal">
            <div className="modal-header">
              <h2>{selectedTrainee.name}</h2>
              <button className="close-btn" onClick={() => setShowViewModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-form">
              <div className="trainee-profile">
                <div className="profile-avatar2">{selectedTrainee.avatar}</div>
                <div className="profile-info2">
                  <h3>{selectedTrainee.name}</h3>
                  <p>{selectedTrainee.domain}</p>
                  <div className="contact-info">
                    <div className="contact-item">
                      <Mail size={16} />
                      <a href={`mailto:${selectedTrainee.email}`}>{selectedTrainee.email}</a>
                    </div>
                    {selectedTrainee.phone && (
                      <div className="contact-item">
                        <Phone size={16} />
                        <a href={`tel:${selectedTrainee.phone}`}>{selectedTrainee.phone}</a>
                      </div>
                    )}
                    {selectedTrainee.location && (
                      <div className="contact-item">
                        <MapPin size={16} />
                        {selectedTrainee.location}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="trainee-details">
                <div className="detail-section">
                  <h4>Program Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Program:</label>
                      <span>{selectedTrainee.program}</span>
                    </div>
                    <div className="detail-item">
                      <label>Status:</label>
                      <span className={`status-badge ${getStatusColor(selectedTrainee.status)}`}>
                        {selectedTrainee.status}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Join Date:</label>
                      <span>{new Date(selectedTrainee.joinDate).toLocaleDateString()}</span>
                    </div>
                    {selectedTrainee.graduationDate && (
                      <div className="detail-item">
                        <label>Graduation Date:</label>
                        <span>{new Date(selectedTrainee.graduationDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedTrainee.status === "active" && (
                  <div className="detail-section">
                    <h4>Performance Metrics</h4>
                    <div className="performance-grid">
                      <div className="performance-item">
                        <div className="performance-label">Attendance</div>
                        <div className="performance-bar">
                          <div
                            className="performance-fill"
                            style={{ width: `${selectedTrainee.performance.attendance}%` }}
                          />
                        </div>
                        <div className="performance-value">{selectedTrainee.performance.attendance}%</div>
                      </div>
                      <div className="performance-item">
                        <div className="performance-label">Assignments</div>
                        <div className="performance-bar">
                          <div
                            className="performance-fill"
                            style={{ width: `${selectedTrainee.performance.assignments}%` }}
                          />
                        </div>
                        <div className="performance-value">{selectedTrainee.performance.assignments}%</div>
                      </div>
                      <div className="performance-item">
                        <div className="performance-label">Projects</div>
                        <div className="performance-bar">
                          <div
                            className="performance-fill"
                            style={{ width: `${selectedTrainee.performance.projects}%` }}
                          />
                        </div>
                        <div className="performance-value">{selectedTrainee.performance.projects}%</div>
                      </div>
                      <div className="performance-item">
                        <div className="performance-label">Overall</div>
                        <div className="performance-bar">
                          <div
                            className="performance-fill"
                            style={{ width: `${selectedTrainee.performance.overall}%` }}
                          />
                        </div>
                        <div className="performance-value">{selectedTrainee.performance.overall}%</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="detail-section">
                  <h4>Social Links</h4>
                  <div className="social-links">
                    {selectedTrainee.github && (
                      <a
                        href={`https://github.com/${selectedTrainee.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-link"
                      >
                        <Github size={16} />
                        GitHub Profile
                      </a>
                    )}
                    {selectedTrainee.linkedin && (
                      <a
                        href={`https://linkedin.com/in/${selectedTrainee.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-link"
                      >
                        <Linkedin size={16} />
                        LinkedIn Profile
                      </a>
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Progress Summary</h4>
                  <div className="progress-summary">
                    <div className="summary-item">
                      <FileText size={16} />
                      <span>
                        Assignments: {selectedTrainee.completedAssignments}/{selectedTrainee.totalAssignments}
                      </span>
                    </div>
                    <div className="summary-item">
                      <Award size={16} />
                      <span>Certificates: {selectedTrainee.certificates}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
