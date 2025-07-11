"use client"

import { useState } from "react"
import { Archive, Search, Filter, Eye, Download, Calendar, Users, Award, TrendingUp, X } from "lucide-react"
import "../../../styles/archieve.css"

export default function ArchivePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterYear, setFilterYear] = useState("all")
  const [archivedData, setArchivedData] = useState([
    {
      id: 1,
      type: "program",
      name: "Data Analysis Bootcamp for Women",
      description:
        "Comprehensive 6-month data analysis program focusing on Excel, Power BI, Python, and SQL for female graduates",
      completionDate: "2023-12-15",
      participants: 28,
      successRate: 89,
      duration: "6 months",
      facilitator: "Alice Uwimana",
      curriculum: [
        "Excel Advanced Functions",
        "Power BI Dashboard Creation",
        "Python for Data Analysis",
        "SQL Database Management",
        "Statistical Analysis",
        "Data Visualization",
      ],
      demographics: {
        ageRange: "22-28 years",
        gender: "100% Female",
        education: "University Graduates",
        background: "STEM and Business backgrounds",
      },
      funding: {
        sponsor: "Mastercard Foundation",
        budget: "$45,000",
        scholarships: 28,
      },
      outcomes: {
        employed: 25,
        avgSalary: "$800/month",
        certifications: ["Microsoft Excel Expert", "Power BI Certified", "Python Data Analysis Certificate"],
        projects: 4,
      },
      keyMetrics: {
        attendanceRate: 94,
        projectCompletionRate: 89,
        employmentRate: 89,
        satisfactionScore: 4.6,
      },
      tools: ["Microsoft Excel", "Power BI", "Python", "Jupyter Notebook", "SQL Server", "Tableau"],
      location: "Kigali, Rwanda",
      cohort: "Cohort 2023-B",
    },
    {
      id: 2,
      type: "program",
      name: "Web Development Fundamentals",
      description:
        "Full-stack web development program covering HTML, CSS, JavaScript, React, and Node.js for young entrepreneurs",
      completionDate: "2023-11-30",
      participants: 35,
      successRate: 92,
      duration: "4 months",
      facilitator: "Bob Nkurunziza",
      curriculum: [
        "HTML5 & CSS3",
        "JavaScript ES6+",
        "React.js",
        "Node.js & Express",
        "MongoDB",
        "Git & GitHub",
        "Responsive Design",
        "API Development",
      ],
      demographics: {
        ageRange: "18-25 years",
        gender: "60% Male, 40% Female",
        education: "High School to University",
        background: "Mixed backgrounds, entrepreneurship focus",
      },
      funding: {
        sponsor: "Government of Rwanda - ICT Ministry",
        budget: "$32,000",
        scholarships: 35,
      },
      outcomes: {
        employed: 32,
        avgSalary: "$600/month",
        certifications: ["freeCodeCamp Full Stack", "React Developer Certificate"],
        projects: 6,
      },
      keyMetrics: {
        attendanceRate: 96,
        projectCompletionRate: 92,
        employmentRate: 91,
        satisfactionScore: 4.8,
      },
      tools: ["VS Code", "React", "Node.js", "MongoDB", "Git", "Figma", "Postman"],
      location: "Kigali, Rwanda",
      cohort: "Cohort 2023-A",
    },
    {
      id: 3,
      type: "certificate",
      name: "Advanced React Development Certificates",
      description: "Certificates issued for completing advanced React.js specialization program",
      completionDate: "2023-10-20",
      participants: 15,
      successRate: 87,
      duration: "3 months",
      facilitator: "Carol Mukamana",
      curriculum: [
        "React Hooks",
        "Context API",
        "Redux Toolkit",
        "Next.js",
        "TypeScript",
        "Testing with Jest",
        "Performance Optimization",
      ],
      demographics: {
        ageRange: "23-30 years",
        gender: "53% Male, 47% Female",
        education: "University Graduates with coding experience",
        background: "Previous web development experience required",
      },
      funding: {
        sponsor: "Private Partnership - Tech Companies",
        budget: "$18,000",
        scholarships: 15,
      },
      outcomes: {
        employed: 13,
        avgSalary: "$1,200/month",
        certifications: ["React Advanced Certificate", "Next.js Developer Certificate"],
        projects: 3,
      },
      keyMetrics: {
        attendanceRate: 91,
        projectCompletionRate: 87,
        employmentRate: 87,
        satisfactionScore: 4.7,
      },
      tools: ["React", "Next.js", "TypeScript", "Redux", "Jest", "Cypress", "Vercel"],
      location: "Kigali, Rwanda",
      cohort: "Advanced Cohort 2023",
    },
    {
      id: 4,
      type: "report",
      name: "Q3 2023 Performance Report",
      description: "Quarterly performance analysis covering all programs, employment outcomes, and financial metrics",
      completionDate: "2023-09-30",
      participants: 156,
      successRate: 85,
      duration: "3 months",
      facilitator: "System Generated",
      curriculum: ["Performance Analytics", "Employment Tracking", "Financial Analysis", "Stakeholder Reporting"],
      demographics: {
        ageRange: "18-35 years",
        gender: "55% Female, 45% Male",
        education: "Mixed education levels",
        background: "Various technical backgrounds",
      },
      funding: {
        sponsor: "Multiple Sponsors",
        budget: "$125,000",
        scholarships: 156,
      },
      outcomes: {
        employed: 133,
        avgSalary: "$750/month",
        certifications: ["Various Technical Certificates"],
        projects: 15,
      },
      keyMetrics: {
        attendanceRate: 89,
        projectCompletionRate: 85,
        employmentRate: 85,
        satisfactionScore: 4.5,
      },
      tools: ["Excel", "Power BI", "SQL", "Python", "Various Development Tools"],
      location: "Multiple Locations",
      cohort: "Q3 2023 Combined",
    },
    {
      id: 5,
      type: "program",
      name: "Mobile App Development with Flutter",
      description:
        "Cross-platform mobile development program using Flutter and Dart for building iOS and Android applications",
      completionDate: "2023-08-15",
      participants: 22,
      successRate: 91,
      duration: "5 months",
      facilitator: "David Habimana",
      curriculum: [
        "Dart Programming",
        "Flutter Framework",
        "State Management",
        "Firebase Integration",
        "API Integration",
        "App Store Deployment",
        "UI/UX for Mobile",
      ],
      demographics: {
        ageRange: "20-28 years",
        gender: "45% Female, 55% Male",
        education: "University Graduates in Computer Science",
        background: "Some programming experience preferred",
      },
      funding: {
        sponsor: "Google Developer Program",
        budget: "$38,000",
        scholarships: 22,
      },
      outcomes: {
        employed: 20,
        avgSalary: "$900/month",
        certifications: ["Flutter Developer Certificate", "Google Mobile Developer"],
        projects: 5,
      },
      keyMetrics: {
        attendanceRate: 93,
        projectCompletionRate: 91,
        employmentRate: 91,
        satisfactionScore: 4.9,
      },
      tools: ["Flutter", "Dart", "Android Studio", "VS Code", "Firebase", "Git", "Figma"],
      location: "Kigali, Rwanda",
      cohort: "Mobile Dev 2023",
    },
  ])

  const years = ["2023", "2022", "2021"]
  const types = ["program", "certificate", "report"]

  const [selectedItem, setSelectedItem] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const filteredArchive = archivedData.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || item.type === filterType
    const matchesYear = filterYear === "all" || new Date(item.completionDate).getFullYear().toString() === filterYear
    return matchesSearch && matchesType && matchesYear
  })

  const getTypeIcon = (type) => {
    switch (type) {
      case "program":
        return <Users className="type-icon program" size={20} />
      case "certificate":
        return <Award className="type-icon certificate" size={20} />
      case "report":
        return <TrendingUp className="type-icon report" size={20} />
      default:
        return <Archive className="type-icon" size={20} />
    }
  }

  const archiveStats = {
    total: archivedData.length,
    programs: archivedData.filter((item) => item.type === "program").length,
    certificates: archivedData.filter((item) => item.type === "certificate").length,
    reports: archivedData.filter((item) => item.type === "report").length,
  }

  const handleViewDetails = (item) => {
    setSelectedItem(item)
    setShowModal(true)
  }

  const handleExportData = (item) => {
    // Create a simple PDF-like content
    const content = `
Program Archive Export
=====================

Name: ${item.name}
Type: ${item.type}
Description: ${item.description}
Completion Date: ${new Date(item.completionDate).toLocaleDateString()}
Participants: ${item.participants}
Success Rate: ${item.successRate}%
Duration: ${item.duration}
Facilitator: ${item.facilitator}

Generated on: ${new Date().toLocaleDateString()}
  `

    // Create and download the file
    const blob = new Blob([content], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${item.name.replace(/\s+/g, "_")}_archive_export.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="archive-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <Archive className="title-icon" color="#1f497d" size={32} />
            Program Archive
          </h1>
          <p className="page-subtitle">Access historical data and completed programs</p>
        </div>
        <div className="archive-stats-summary">
          <div className="stat-item">
            <Archive size={16} />
            <span>{archiveStats.total} Total Items</span>
          </div>
        </div>
      </div>

      <div className="archive-stats">
        <div className="stat-card total">
          <div className="stat-content">
            <div className="stat-value">{archiveStats.total}</div>
            <div className="stat-label">Total Archived</div>
          </div>
          <div className="stat-icon">
            <Archive size={24} />
          </div>
        </div>
        <div className="stat-card programs">
          <div className="stat-content">
            <div className="stat-value">{archiveStats.programs}</div>
            <div className="stat-label">Programs</div>
          </div>
          <div className="stat-icon">
            <Users size={24} />
          </div>
        </div>
        <div className="stat-card certificates">
          <div className="stat-content">
            <div className="stat-value">{archiveStats.certificates}</div>
            <div className="stat-label">Certificates</div>
          </div>
          <div className="stat-icon">
            <Award size={24} />
          </div>
        </div>
        <div className="stat-card reports">
          <div className="stat-content">
            <div className="stat-value">{archiveStats.reports}</div>
            <div className="stat-label">Reports</div>
          </div>
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      <div className="archive-controls">
        <div className="search-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search archive..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filters-container">
          <div className="filter-container">
            <Filter className="filter-icon" size={18} />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
              <option value="all">All Types</option>
              <option value="program">Programs</option>
              <option value="certificate">Certificates</option>
              <option value="report">Reports</option>
            </select>
          </div>
          <div className="filter-container">
            <Calendar className="filter-icon" size={18} />
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="filter-select">
              <option value="all">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="archive-grid">
        {filteredArchive.map((item) => (
          <div key={item.id} className="archive-card">
            <div className="card-header">
              <div className={`item-type ${item.type}`}>
                {getTypeIcon(item.type)}
                <span className="type-text">{item.type}</span>
              </div>
              <div className="completion-date">
                <Calendar size={14} />
                <span>{new Date(item.completionDate).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="card-content">
              <h3 className="item-name">{item.name}</h3>
              <p className="item-description">{item.description}</p>
              <div className="item-stats">
                <div className="stat-row">
                  <div className="stat-item">
                    <Users size={16} />
                    <span>{item.participants} Participants</span>
                  </div>
                  <div className="stat-item">
                    <TrendingUp size={16} />
                    <span>{item.successRate}% Success Rate</span>
                  </div>
                </div>
                <div className="stat-row">
                  <div className="stat-item">
                    <Calendar size={16} />
                    <span>{item.duration}</span>
                  </div>
                  <div className="stat-item">
                    <span className="facilitator-name">{item.facilitator}</span>
                  </div>
                </div>
              </div>
              <div className="success-rate-bar">
                <div className="rate-fill" style={{ width: `${item.successRate}%` }}></div>
              </div>
            </div>
            <div className="card-actions">
              <button className="action-btn view" onClick={() => handleViewDetails(item)}>
                <Eye size={16} />
                View Details
              </button>
              <button className="action-btn download" onClick={() => handleExportData(item)}>
                <Download size={16} />
                Export Data
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredArchive.length === 0 && (
        <div className="empty-state">
          <Archive size={48} />
          <h3>No archived items found</h3>
          <p>No items match your current search and filter criteria</p>
        </div>
      )}

      {showModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Archive Details</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-header">
                  <div className={`item-type ${selectedItem.type}`}>
                    {getTypeIcon(selectedItem.type)}
                    <span className="type-text">{selectedItem.type}</span>
                  </div>
                  <div className="completion-date">
                    <Calendar size={16} />
                    <span>Completed: {new Date(selectedItem.completionDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <h3 className="detail-title">{selectedItem.name}</h3>
                <p className="detail-description">{selectedItem.description}</p>

                <div className="program-info">
                  <div className="info-row">
                    <span className="info-label">Cohort:</span>
                    <span className="info-value">{selectedItem.cohort}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Location:</span>
                    <span className="info-value">{selectedItem.location}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Facilitator:</span>
                    <span className="info-value">{selectedItem.facilitator}</span>
                  </div>
                </div>
              </div>

              <div className="curriculum-section">
                <h4>Curriculum & Skills Covered</h4>
                <div className="curriculum-tags">
                  {selectedItem.curriculum?.map((skill, index) => (
                    <span key={index} className="curriculum-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="demographics-section">
                <h4>Program Demographics</h4>
                <div className="demo-grid">
                  <div className="demo-item">
                    <span className="demo-label">Age Range:</span>
                    <span className="demo-value">{selectedItem.demographics?.ageRange}</span>
                  </div>
                  <div className="demo-item">
                    <span className="demo-label">Gender:</span>
                    <span className="demo-value">{selectedItem.demographics?.gender}</span>
                  </div>
                  <div className="demo-item">
                    <span className="demo-label">Education:</span>
                    <span className="demo-value">{selectedItem.demographics?.education}</span>
                  </div>
                  <div className="demo-item">
                    <span className="demo-label">Background:</span>
                    <span className="demo-value">{selectedItem.demographics?.background}</span>
                  </div>
                </div>
              </div>

              <div className="funding-section">
                <h4>Funding & Sponsorship</h4>
                <div className="funding-info">
                  <div className="funding-item">
                    <span className="funding-label">Sponsor:</span>
                    <span className="funding-value">{selectedItem.funding?.sponsor}</span>
                  </div>
                  <div className="funding-item">
                    <span className="funding-label">Total Budget:</span>
                    <span className="funding-value">{selectedItem.funding?.budget}</span>
                  </div>
                  <div className="funding-item">
                    <span className="funding-label">Scholarships:</span>
                    <span className="funding-value">{selectedItem.funding?.scholarships} Full Scholarships</span>
                  </div>
                </div>
              </div>

              <div className="outcomes-section">
                <h4>Program Outcomes</h4>
                <div className="outcomes-grid">
                  <div className="outcome-stat">
                    <span className="outcome-number">{selectedItem.outcomes?.employed}</span>
                    <span className="outcome-label">Employed</span>
                  </div>
                  <div className="outcome-stat">
                    <span className="outcome-number">{selectedItem.outcomes?.avgSalary}</span>
                    <span className="outcome-label">Avg Salary</span>
                  </div>
                  <div className="outcome-stat">
                    <span className="outcome-number">{selectedItem.outcomes?.projects}</span>
                    <span className="outcome-label">Projects</span>
                  </div>
                  <div className="outcome-stat">
                    <span className="outcome-number">{selectedItem.keyMetrics?.satisfactionScore}/5</span>
                    <span className="outcome-label">Satisfaction</span>
                  </div>
                </div>
              </div>

              <div className="tools-section">
                <h4>Tools & Technologies Used</h4>
                <div className="tools-tags">
                  {selectedItem.tools?.map((tool, index) => (
                    <span key={index} className="tool-tag">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              <div className="progress-section">
                <h4>Key Performance Metrics</h4>
                <div className="metrics-grid">
                  <div className="metric-item">
                    <span className="metric-label">Attendance Rate</span>
                    <div className="metric-bar">
                      <div
                        className="metric-fill"
                        style={{ width: `${selectedItem.keyMetrics?.attendanceRate}%` }}
                      ></div>
                    </div>
                    <span className="metric-value">{selectedItem.keyMetrics?.attendanceRate}%</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Project Completion</span>
                    <div className="metric-bar">
                      <div
                        className="metric-fill"
                        style={{ width: `${selectedItem.keyMetrics?.projectCompletionRate}%` }}
                      ></div>
                    </div>
                    <span className="metric-value">{selectedItem.keyMetrics?.projectCompletionRate}%</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Employment Rate</span>
                    <div className="metric-bar">
                      <div
                        className="metric-fill"
                        style={{ width: `${selectedItem.keyMetrics?.employmentRate}%` }}
                      ></div>
                    </div>
                    <span className="metric-value">{selectedItem.keyMetrics?.employmentRate}%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-btn export" onClick={() => handleExportData(selectedItem)}>
                <Download size={16} />
                Export Data
              </button>
              <button className="modal-btn close" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
