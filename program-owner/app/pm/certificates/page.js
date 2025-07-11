"use client"
import { useState } from "react"
import {
  Award,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  Wand2,
  Send,
  Edit3,
  Users,
  FileText,
  Star,
  Calendar,
  Loader2,
} from "lucide-react"
import "../../../styles/certificates.css"

export default function CertificatesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterProgram, setFilterProgram] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(1)
  const [activeTab, setActiveTab] = useState("certificates")
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [selectedStudents, setSelectedStudents] = useState([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)

  const programs = ["Tekeher Experts", "Data Analytics Bootcamp", "Mobile App Development", "UI/UX Design Mastery"]

  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: "Professional Certificate",
      description: "Clean, professional design with company branding",
      isDefault: true,
      style: "professional",
      colorScheme: "blue",
    },
    {
      id: 2,
      name: "Modern Achievement",
      description: "Contemporary design with geometric elements",
      isDefault: false,
      style: "modern",
      colorScheme: "gray",
    },
  ])

  const [certificates, setCertificates] = useState([
    {
      id: 1,
      traineeName: "John Doe",
      traineeEmail: "john.doe@student.klab.rw",
      program: "Tekeher Experts",
      completionDate: "2024-01-15",
      issueDate: "2024-01-20",
      certificateId: "KLAB-TE-2024-001",
      status: "issued",
      grade: "A",
      finalScore: 92,
      attendanceRate: 95,
      templateId: 1,
    },
    {
      id: 2,
      traineeName: "Jane Smith",
      traineeEmail: "jane.smith@student.klab.rw",
      program: "Data Analytics Bootcamp",
      completionDate: "2024-02-10",
      issueDate: "2024-02-15",
      certificateId: "KLAB-DA-2024-002",
      status: "issued",
      grade: "A+",
      finalScore: 96,
      attendanceRate: 98,
      templateId: 1,
    },
    {
      id: 3,
      traineeName: "Mike Johnson",
      traineeEmail: "mike.johnson@student.klab.rw",
      program: "UI/UX Design Mastery",
      completionDate: "2024-01-01",
      issueDate: null,
      certificateId: "KLAB-UX-2024-003",
      status: "ready",
      grade: "B+",
      finalScore: 87,
      attendanceRate: 85,
      templateId: 2,
    },
    {
      id: 4,
      traineeName: "Sarah Wilson",
      traineeEmail: "sarah.wilson@student.klab.rw",
      program: "Tekeher Experts",
      completionDate: "2024-01-25",
      issueDate: null,
      certificateId: "KLAB-TE-2024-004",
      status: "pending",
      grade: "B",
      finalScore: 82,
      attendanceRate: 78,
      templateId: 1,
    },
  ])

  // Simulate database students with grades and attendance
  const [allStudents] = useState([
    {
      id: 1,
      name: "Alice Johnson",
      email: "alice.johnson@student.klab.rw",
      program: "Tekeher Experts",
      finalScore: 88,
      attendanceRate: 92,
      completionDate: "2024-01-30",
      isEligible: true,
    },
    {
      id: 2,
      name: "Bob Wilson",
      email: "bob.wilson@student.klab.rw",
      program: "Data Analytics Bootcamp",
      finalScore: 91,
      attendanceRate: 89,
      completionDate: "2024-02-05",
      isEligible: true,
    },
    {
      id: 3,
      name: "Carol Davis",
      email: "carol.davis@student.klab.rw",
      program: "Mobile App Development",
      finalScore: 65,
      attendanceRate: 60,
      completionDate: "2024-01-20",
      isEligible: false, // Low scores
    },
    {
      id: 4,
      name: "David Brown",
      email: "david.brown@student.klab.rw",
      program: "UI/UX Design Mastery",
      finalScore: 85,
      attendanceRate: 95,
      completionDate: "2024-02-01",
      isEligible: true,
    },
  ])

  // Filter eligible students (score >= 80 AND attendance >= 85)
  const eligibleStudents = allStudents.filter(
    (student) => student.finalScore >= 80 && student.attendanceRate >= 85 && student.isEligible,
  )

  const filteredCertificates = certificates.filter((cert) => {
    const matchesSearch = cert.traineeName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProgram = filterProgram === "all" || cert.program === filterProgram
    const matchesStatus = filterStatus === "all" || cert.status === filterStatus
    return matchesSearch && matchesProgram && matchesStatus
  })

  const getStatusIcon = (status) => {
    switch (status) {
      case "issued":
        return <CheckCircle className="status-icon" size={16} />
      case "ready":
        return <Award className="status-icon" size={16} />
      case "pending":
        return <Clock className="status-icon" size={16} />
      default:
        return <Clock className="status-icon" size={16} />
    }
  }

  const getGradeColor = (grade) => {
    switch (grade) {
      case "A+":
      case "A":
        return "#059669"
      case "A-":
      case "B+":
        return "#1f497d"
      case "B":
      case "B-":
        return "#d97706"
      default:
        return "#6b7280"
    }
  }

  const handleGenerateWithAI = async (formData) => {
    setIsGeneratingAI(true)

    // Simulate AI generation delay
    await new Promise((resolve) => setTimeout(resolve, 3000))

    const newTemplate = {
      id: templates.length + 1,
      name: `AI ${formData.style} Certificate`,
      description: `AI-generated ${formData.style.toLowerCase()} certificate with ${formData.colorScheme} color scheme`,
      isDefault: false,
      style: formData.style,
      colorScheme: formData.colorScheme,
    }

    setTemplates([...templates, newTemplate])
    setIsGeneratingAI(false)
    setShowTemplateModal(false)

    // Show success message
    alert("AI template generated successfully!")
  }

  const handlePreviewTemplate = (template) => {
    setPreviewTemplate(template)
    setShowPreviewModal(true)
  }

  const handleEditTemplate = (template) => {
    setEditingTemplate(template)
    setShowEditModal(true)
  }

  const handleSaveTemplate = (updatedTemplate) => {
    setTemplates(templates.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)))
    setShowEditModal(false)
    setEditingTemplate(null)
    alert("Template updated successfully!")
  }

  const handleIssueCertificates = async () => {
    if (selectedStudents.length === 0) {
      alert("Please select at least one student")
      return
    }

    const studentsToIssue = eligibleStudents.filter((student) => selectedStudents.includes(student.id))

    const newCertificates = studentsToIssue.map((student) => ({
      id: certificates.length + student.id,
      traineeName: student.name,
      traineeEmail: student.email,
      program: student.program,
      completionDate: student.completionDate,
      issueDate: new Date().toISOString().split("T")[0],
      certificateId: `KLAB-${student.program.split(" ")[0].toUpperCase()}-2024-${String(certificates.length + student.id).padStart(3, "0")}`,
      status: "issued",
      grade: student.finalScore >= 90 ? "A" : student.finalScore >= 80 ? "B" : "C",
      finalScore: student.finalScore,
      attendanceRate: student.attendanceRate,
      templateId: selectedTemplate,
    }))

    setCertificates([...certificates, ...newCertificates])
    setSelectedStudents([])
    setShowGenerateModal(false)

    // Simulate sending to dashboard and email
    newCertificates.forEach((cert) => {
      console.log(`✅ Certificate sent to ${cert.traineeEmail}`)
      console.log(`📧 Email notification sent to ${cert.traineeName}`)
      console.log(`📱 Certificate added to ${cert.traineeName}'s dashboard`)
    })

    alert(
      `Successfully issued ${newCertificates.length} certificates! Students have been notified via email and certificates are available in their dashboards.`,
    )
  }

  const handleStudentSelection = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    )
  }

  const certificateStats = {
    total: certificates.length,
    issued: certificates.filter((c) => c.status === "issued").length,
    ready: certificates.filter((c) => c.status === "ready").length,
    eligible: eligibleStudents.length,
  }

  return (
    <div className="certificates-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <Award className="title-icon"  color="#1f497d" size={32} />
            Certificate Management
          </h1>
          <p className="page-subtitle">Generate, customize and distribute certificates</p>
        </div>
        <div className="header-actions">
          <button className="action-btn secondary" onClick={() => setShowTemplateModal(true)}>
            <Wand2 size={18} />
            AI Templates
          </button>
          <button className="action-btn primary" onClick={() => setShowGenerateModal(true)}>
            <Award size={18} />
            Issue Certificates
          </button>
        </div>
      </div>

      <div className="certificate-stats">
        <div className="stat-card">
          <div className="stat-icon bg-gray">
            <Award size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{certificateStats.total}</div>
            <div className="stat-label">Total Certificates</div>
            <div className="stat-breakdown">All programs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-blue">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{certificateStats.issued}</div>
            <div className="stat-label">Issued</div>
            <div className="stat-breakdown">Sent to students</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-blue">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{certificateStats.ready}</div>
            <div className="stat-label">Ready</div>
            <div className="stat-breakdown">Awaiting approval</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-blue">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{certificateStats.eligible}</div>
            <div className="stat-label">Eligible</div>
            <div className="stat-breakdown">Ready to graduate</div>
          </div>
        </div>
      </div>

      <div className="certificates-tabs">
        <button
          className={`tab-btn ${activeTab === "certificates" ? "active" : ""}`}
          onClick={() => setActiveTab("certificates")}
        >
          <FileText size={18} />
          Certificates
        </button>
        <button
          className={`tab-btn ${activeTab === "templates" ? "active" : ""}`}
          onClick={() => setActiveTab("templates")}
        >
          <Edit3 size={18} />
          Templates
        </button>
        <button
          className={`tab-btn ${activeTab === "eligible" ? "active" : ""}`}
          onClick={() => setActiveTab("eligible")}
        >
          <Users size={18} />
          Eligible Students
        </button>
      </div>

      {activeTab === "certificates" && (
        <>
          <div className="certificates-controls">
            <div className="controls-left">
              <div className="search-container">
                <Search className="search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Search certificates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            <div className="controls-center">
              <div className="filter-group">
                <div className="filter-container">
                  <Filter className="filter-icon" size={18} />
                  <select
                    value={filterProgram}
                    onChange={(e) => setFilterProgram(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Programs</option>
                    {programs.map((program) => (
                      <option key={program} value={program}>
                        {program}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-container">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Status</option>
                    <option value="issued">Issued</option>
                    <option value="ready">Ready</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="certificates-table">
            <div className="table-header">
              <div className="header-cell">Student</div>
              <div className="header-cell">Program</div>
              <div className="header-cell">Certificate ID</div>
              <div className="header-cell">Grade</div>
              <div className="header-cell">Score</div>
              <div className="header-cell">Status</div>
              <div className="header-cell">Issue Date</div>
              <div className="header-cell">Actions</div>
            </div>
            <div className="table-body">
              {filteredCertificates.map((certificate) => (
                <div key={certificate.id} className="table-row">
                  <div className="table-cell">
                    <div className="student-info">
                      <div className="student-avatar">
                        {certificate.traineeName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className="student-details">
                        <span className="student-name">{certificate.traineeName}</span>
                        <span className="student-email">{certificate.traineeEmail}</span>
                      </div>
                    </div>
                  </div>
                  <div className="table-cell">
                    <span className="program-tag">{certificate.program}</span>
                  </div>
                  <div className="table-cell">
                    <span className="certificate-id">{certificate.certificateId}</span>
                  </div>
                  <div className="table-cell">
                    <span className="grade-badge" style={{ backgroundColor: getGradeColor(certificate.grade) }}>
                      {certificate.grade}
                    </span>
                  </div>
                  <div className="table-cell">
                    <span className="score-text">{certificate.finalScore}%</span>
                  </div>
                  <div className="table-cell">
                    <div className={`status-badge ${certificate.status}`}>
                      {getStatusIcon(certificate.status)}
                      <span className="status-text">{certificate.status}</span>
                    </div>
                  </div>
                  <div className="table-cell">
                    <span className="date-text">
                      {certificate.issueDate ? new Date(certificate.issueDate).toLocaleDateString() : "-"}
                    </span>
                  </div>
                  <div className="table-cell">
                    <div className="action-buttons">
                      <button
                        className="action-btn view"
                        title="Preview certificate"
                        onClick={() => handlePreviewTemplate(templates.find((t) => t.id === certificate.templateId))}
                      >
                        <Eye size={16} />
                      </button>
                      <button className="action-btn download" title="Download certificate">
                        <Download size={16} />
                      </button>
                      {certificate.status === "issued" && (
                        <button className="action-btn send" title="Resend to student">
                          <Send size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === "templates" && (
        <div className="templates-grid">
          {templates.map((template) => (
            <div key={template.id} className="template-card">
              <div className="template-preview">
                <div className={`certificate-preview ${template.style || "professional"}`}>
                  <div className="certificate-decorative">★</div>
                  <div className="certificate-header">KLAB</div>
                  <div className="certificate-title">Certificate of Achievement</div>
                  <div className="certificate-name">[Student Name]</div>
                  <div className="certificate-footer">
                    {template.style} • {template.colorScheme}
                  </div>
                </div>
                {template.isDefault && (
                  <div className="default-badge">
                    <Star size={14} />
                    Default
                  </div>
                )}
              </div>
              <div className="template-content">
                <h3 className="template-name">{template.name}</h3>
                <p className="template-description">{template.description}</p>
                <div className="template-actions">
                  <button className="template-btn edit" onClick={() => handleEditTemplate(template)}>
                    <Edit3 size={16} />
                    Edit
                  </button>
                  <button className="template-btn preview" onClick={() => handlePreviewTemplate(template)}>
                    <Eye size={16} />
                    Preview
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="template-card add-template" onClick={() => setShowTemplateModal(true)}>
            <div className="add-template-content">
              <Wand2 size={48} />
              <h3>Generate with AI</h3>
              <p>Create custom certificate templates using AI</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "eligible" && (
        <div className="eligible-students-grid">
          {eligibleStudents.map((student) => (
            <div key={student.id} className="eligible-student-card">
              <div className="student-header">
                <div className="student-info">
                  <div className="student-avatar">
                    {student.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="student-details">
                    <h4 className="student-name">{student.name}</h4>
                    <p className="student-program">{student.program}</p>
                  </div>
                </div>
                <div className="student-score">
                  <span className="score-value">{student.finalScore}%</span>
                  <span className="score-label">Final Score</span>
                </div>
              </div>
              <div className="student-metrics">
                <div className="metric-item">
                  <Calendar size={16} />
                  <span>Completed: {new Date(student.completionDate).toLocaleDateString()}</span>
                </div>
                <div className="metric-item">
                  <Users size={16} />
                  <span>Attendance: {student.attendanceRate}%</span>
                </div>
              </div>
              <div className="student-actions">
                <button
                  className="action-btn generate"
                  onClick={() => {
                    setSelectedStudents([student.id])
                    setShowGenerateModal(true)
                  }}
                >
                  <Award size={16} />
                  Generate Certificate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Template Generation Modal */}
      {showTemplateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Generate Certificate Template with AI</h2>
              <button className="close-btn" onClick={() => setShowTemplateModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-content">
              {isGeneratingAI ? (
                <div className="ai-generating">
                  <Loader2 size={48} />
                  <h3>AI is generating your template...</h3>
                  <p>This may take a few moments</p>
                </div>
              ) : (
                <AITemplateForm onGenerate={handleGenerateWithAI} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Certificate Generation Modal */}
      {showGenerateModal && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h2>Issue Certificates</h2>
              <button className="close-btn" onClick={() => setShowGenerateModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="generation-steps">
                <div className="step active">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h3>Select Template</h3>
                    <div className="template-selection">
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          className={`template-option ${selectedTemplate === template.id ? "selected" : ""}`}
                          onClick={() => setSelectedTemplate(template.id)}
                        >
                          <div className="template-option-preview">CERTIFICATE</div>
                          <span>{template.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="step active">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h3>Select Students ({selectedStudents.length} selected)</h3>
                    <div className="students-selection">
                      {eligibleStudents.map((student) => (
                        <div key={student.id} className="student-selection-item">
                          <input
                            type="checkbox"
                            id={`student-${student.id}`}
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => handleStudentSelection(student.id)}
                          />
                          <label htmlFor={`student-${student.id}`} className="student-selection-label">
                            <div className="student-info">
                              <span className="student-name">{student.name}</span>
                              <span className="student-program">{student.program}</span>
                            </div>
                            <span className="student-score">
                              {student.finalScore}% | {student.attendanceRate}% attendance
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowGenerateModal(false)}>
                Cancel
              </button>
              <button
                className="modal-btn generate"
                onClick={handleIssueCertificates}
                disabled={!selectedTemplate || selectedStudents.length === 0}
              >
                <Send size={16} />
                Issue & Send {selectedStudents.length} Certificate{selectedStudents.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewTemplate && (
        <div className="modal-overlay">
          <div className="modal preview-modal">
            <div className="modal-header">
              <h2>Certificate Preview - {previewTemplate.name}</h2>
              <button className="close-btn" onClick={() => setShowPreviewModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="certificate-full-preview">
                <div className="certificate-logo">KLAB</div>
                <div className="certificate-main-title">Certificate of Achievement</div>
                <div className="certificate-subtitle">This is to certify that</div>
                <div className="certificate-recipient">[Student Name]</div>
                <div className="certificate-program">has successfully completed the [Program Name] program</div>
                <div className="certificate-signatures">
                  <div className="signature-block">
                    <div className="signature-line"></div>
                    <div className="signature-title">Program Manager</div>
                  </div>
                  <div className="signature-block">
                    <div className="signature-line"></div>
                    <div className="signature-title">Director</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowPreviewModal(false)}>
                Close
              </button>
              <button className="modal-btn generate" onClick={() => handleEditTemplate(previewTemplate)}>
                <Edit3 size={16} />
                Edit Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {showEditModal && editingTemplate && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Template - {editingTemplate.name}</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-content">
              <EditTemplateForm
                template={editingTemplate}
                onSave={handleSaveTemplate}
                onCancel={() => setShowEditModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {filteredCertificates.length === 0 && activeTab === "certificates" && (
        <div className="empty-state">
          <Award size={48} />
          <h3>No certificates found</h3>
          <p>No certificates match your current filters</p>
        </div>
      )}
    </div>
  )
}

// AI Template Form Component
function AITemplateForm({ onGenerate }) {
  const [formData, setFormData] = useState({
    style: "professional",
    colorScheme: "blue",
    elements: {
      logo: true,
      signature: true,
      partners: false,
      qrCode: false,
    },
  })

  const handleSubmit = () => {
    onGenerate(formData)
  }

  return (
    <div className="ai-template-form">
      <div className="form-group">
        <label>Template Style</label>
        <select
          className="form-select"
          value={formData.style}
          onChange={(e) => setFormData({ ...formData, style: e.target.value })}
        >
          <option value="professional">Professional & Clean</option>
          <option value="modern">Modern & Creative</option>
          <option value="classic">Classic & Traditional</option>
          <option value="minimalist">Minimalist</option>
        </select>
      </div>
      <div className="form-group">
        <label>Color Scheme</label>
        <div className="color-options">
          <div
            className={`color-option blue ${formData.colorScheme === "blue" ? "active" : ""}`}
            onClick={() => setFormData({ ...formData, colorScheme: "blue" })}
          ></div>
          <div
            className={`color-option gray ${formData.colorScheme === "gray" ? "active" : ""}`}
            onClick={() => setFormData({ ...formData, colorScheme: "gray" })}
          ></div>
          <div
            className={`color-option black ${formData.colorScheme === "black" ? "active" : ""}`}
            onClick={() => setFormData({ ...formData, colorScheme: "black" })}
          ></div>
        </div>
      </div>
      <div className="form-group">
        <label>Include Elements</label>
        <div className="checkbox-group">
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={formData.elements.logo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  elements: { ...formData.elements, logo: e.target.checked },
                })
              }
            />
            Company Logo
          </label>
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={formData.elements.signature}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  elements: { ...formData.elements, signature: e.target.checked },
                })
              }
            />
            Digital Signature
          </label>
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={formData.elements.partners}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  elements: { ...formData.elements, partners: e.target.checked },
                })
              }
            />
            Partner Logos
          </label>
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={formData.elements.qrCode}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  elements: { ...formData.elements, qrCode: e.target.checked },
                })
              }
            />
            QR Code Verification
          </label>
        </div>
      </div>
      <div className="modal-actions">
        <button className="modal-btn generate" onClick={handleSubmit}>
          <Wand2 size={16} />
          Generate Template
        </button>
      </div>
    </div>
  )
}

// Edit Template Form Component
function EditTemplateForm({ template, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: template.name,
    description: template.description,
    style: template.style || "professional",
    colorScheme: template.colorScheme || "blue",
    elements: {
      logo: true,
      signature: true,
      partners: false,
      qrCode: false,
    },
  })

  const handleSubmit = () => {
    const updatedTemplate = {
      ...template,
      ...formData,
    }
    onSave(updatedTemplate)
  }

  return (
    <div className="ai-template-form">
      <div className="form-group">
        <label>Template Name</label>
        <input
          type="text"
          className="form-select"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          className="form-select"
          rows="3"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Template Style</label>
        <select
          className="form-select"
          value={formData.style}
          onChange={(e) => setFormData({ ...formData, style: e.target.value })}
        >
          <option value="professional">Professional & Clean</option>
          <option value="modern">Modern & Creative</option>
          <option value="classic">Classic & Traditional</option>
          <option value="minimalist">Minimalist</option>
        </select>
      </div>

      <div className="form-group">
        <label>Color Scheme</label>
        <div className="color-options">
          <div
            className={`color-option blue ${formData.colorScheme === "blue" ? "active" : ""}`}
            onClick={() => setFormData({ ...formData, colorScheme: "blue" })}
          ></div>
          <div
            className={`color-option gray ${formData.colorScheme === "gray" ? "active" : ""}`}
            onClick={() => setFormData({ ...formData, colorScheme: "gray" })}
          ></div>
          <div
            className={`color-option black ${formData.colorScheme === "black" ? "active" : ""}`}
            onClick={() => setFormData({ ...formData, colorScheme: "black" })}
          ></div>
        </div>
      </div>

      <div className="form-group">
        <label>Partner Logos</label>
        <div className="partner-logos">
          <div className="partner-item">
            <input type="checkbox" id="partner-klab" defaultChecked />
            <label htmlFor="partner-klab">KLAB Logo</label>
          </div>
          <div className="partner-item">
            <input type="checkbox" id="partner-gov" />
            <label htmlFor="partner-gov">Government Partner</label>
          </div>
          <div className="partner-item">
            <input type="checkbox" id="partner-tech" />
            <label htmlFor="partner-tech">Tech Partners</label>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label>Include Elements</label>
        <div className="checkbox-group">
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={formData.elements.logo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  elements: { ...formData.elements, logo: e.target.checked },
                })
              }
            />
            Company Logo
          </label>
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={formData.elements.signature}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  elements: { ...formData.elements, signature: e.target.checked },
                })
              }
            />
            Digital Signature
          </label>
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={formData.elements.partners}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  elements: { ...formData.elements, partners: e.target.checked },
                })
              }
            />
            Partner Logos
          </label>
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={formData.elements.qrCode}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  elements: { ...formData.elements, qrCode: e.target.checked },
                })
              }
            />
            QR Code Verification
          </label>
        </div>
      </div>

      <div className="modal-actions">
        <button className="modal-btn cancel" onClick={onCancel}>
          Cancel
        </button>
        <button className="modal-btn generate" onClick={handleSubmit}>
          <Edit3 size={16} />
          Save Changes
        </button>
      </div>
    </div>
  )
}
