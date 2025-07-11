"use client"
import { useState } from "react"
import { Calendar, Search, Filter, CheckCircle, XCircle,Clock, Users, TrendingUp,AlertTriangle, Mail, UserCheck, GraduationCap, Download, CalendarRange,BarChart3} from "lucide-react"
import "../../../styles/attendance.css"

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 7 days ago
    to: new Date().toISOString().split("T")[0], // today
  })
  const [viewMode, setViewMode] = useState("daily") // daily or range
  const [selectedProgram, setSelectedProgram] = useState("all")
  const [selectedSubGroup, setSelectedSubGroup] = useState("all")
  const [selectedType, setSelectedType] = useState("students")
  const [searchTerm, setSearchTerm] = useState("")

  const programs = {
    "Tekeher Experts": {
      "Data Analytics": [],
      Software: ["Mobile", "Web"],
    },
    "Digital Marketing Bootcamp": {
      "Social Media": [],
      "Content Creation": [],
      "SEO & Analytics": [],
    },
    "Cybersecurity Program": {
      "Ethical Hacking": [],
      "Network Security": [],
    },
  }

  const [attendanceData, setAttendanceData] = useState([
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@student.klab.rw",
      type: "student",
      program: "Tekeher Experts",
      subGroup: "Software - Web",
      status: "present",
      checkInTime: "09:00",
      checkOutTime: "17:00",
      totalHours: 8,
      attendanceRate: 85,
      totalDays: 20,
      presentDays: 17,
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@student.klab.rw",
      type: "student",
      program: "Tekeher Experts",
      subGroup: "Data Analytics",
      status: "present",
      checkInTime: "08:45",
      checkOutTime: "16:30",
      totalHours: 7.75,
      attendanceRate: 92,
      totalDays: 18,
      presentDays: 16,
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike.johnson@student.klab.rw",
      type: "student",
      program: "Tekeher Experts",
      subGroup: "Software - Mobile",
      status: "absent",
      checkInTime: null,
      checkOutTime: null,
      totalHours: 0,
      attendanceRate: 65,
      totalDays: 15,
      presentDays: 10,
    },
    {
      id: 4,
      name: "Sarah Wilson",
      email: "sarah.wilson@facilitator.klab.rw",
      type: "facilitator",
      program: "Tekeher Experts",
      subGroup: "Software - Web",
      status: "present",
      checkInTime: "08:30",
      checkOutTime: "17:00",
      totalHours: 8.5,
      attendanceRate: 96,
      totalDays: 25,
      presentDays: 24,
    },
    {
      id: 5,
      name: "David Brown",
      email: "david.brown@student.klab.rw",
      type: "student",
      program: "Tekeher Experts",
      subGroup: "Data Analytics",
      status: "late",
      checkInTime: "10:30",
      checkOutTime: "17:15",
      totalHours: 6.75,
      attendanceRate: 78,
      totalDays: 22,
      presentDays: 17,
    },
    {
      id: 6,
      name: "Emily Davis",
      email: "emily.davis@facilitator.klab.rw",
      type: "facilitator",
      program: "Tekeher Experts",
      subGroup: "Software - Mobile",
      status: "present",
      checkInTime: "09:00",
      checkOutTime: "17:30",
      totalHours: 8.5,
      attendanceRate: 98,
      totalDays: 20,
      presentDays: 20,
    },
  ])

  const filteredAttendance = attendanceData.filter((record) => {
    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProgram = selectedProgram === "all" || record.program === selectedProgram
    const matchesSubGroup = selectedSubGroup === "all" || record.subGroup === selectedSubGroup
    const matchesType = record.type === selectedType
    return matchesSearch && matchesProgram && matchesSubGroup && matchesType
  })

  const getStatusIcon = (status) => {
    switch (status) {
      case "present":
        return <CheckCircle className="status-icon" size={16} />
      case "absent":
        return <XCircle className="status-icon" size={16} />
      case "late":
        return <Clock className="status-icon" size={16} />
      default:
        return <Clock className="status-icon" size={16} />
    }
  }

  const getAttendanceStatus = (rate) => {
    if (rate >= 90) return "excellent"
    if (rate >= 80) return "good"
    if (rate >= 70) return "warning"
    return "critical"
  }

  const attendanceStats = {
    total: filteredAttendance.length,
    present: filteredAttendance.filter((r) => r.status === "present").length,
    absent: filteredAttendance.filter((r) => r.status === "absent").length,
    late: filteredAttendance.filter((r) => r.status === "late").length,
    students: attendanceData.filter((r) => r.type === "student").length,
    facilitators: attendanceData.filter((r) => r.type === "facilitator").length,
    criticalStudents: attendanceData.filter((r) => r.type === "student" && r.attendanceRate < 70).length,
  }

  const attendanceRate =
    attendanceStats.total > 0 ? ((attendanceStats.present / attendanceStats.total) * 100).toFixed(1) : 0

  const handleEmailClick = (email) => {
    window.location.href = `mailto:${email}`
  }

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Type",
      "Program",
      "Sub Group",
      "Status",
      "Check In",
      "Check Out",
      "Hours",
      "Attendance Rate",
      "Present Days",
      "Total Days",
    ]

    const csvData = filteredAttendance.map((record) => [
      record.name,
      record.email,
      record.type,
      record.program,
      record.subGroup,
      record.status,
      record.checkInTime || "-",
      record.checkOutTime || "-",
      record.totalHours,
      `${record.attendanceRate}%`,
      record.presentDays,
      record.totalDays,
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `attendance-report-${viewMode === "daily" ? selectedDate : `${dateRange.from}-to-${dateRange.to}`}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const generateWeeklyReport = () => {
    const weeklyData = {
      totalStudents: attendanceData.filter((r) => r.type === "student").length,
      averageAttendance: (attendanceData.reduce((sum, r) => sum + r.attendanceRate, 0) / attendanceData.length).toFixed(
        1,
      ),
      atRiskStudents: attendanceData.filter((r) => r.type === "student" && r.attendanceRate < 70).length,
      programBreakdown: Object.keys(programs).map((program) => ({
        program,
        students: attendanceData.filter((r) => r.program === program && r.type === "student").length,
        avgAttendance: (
          attendanceData.filter((r) => r.program === program).reduce((sum, r) => sum + r.attendanceRate, 0) /
            attendanceData.filter((r) => r.program === program).length || 0
        ).toFixed(1),
      })),
    }
    return weeklyData
  }

  return (
    <div className="attendance-page">
      <div className="attendance-layout">
        <div className="attendance-main">
          <div className="page-header">
            <div className="header-content">
              <h1 className="page-title">
            <Calendar className="icon"   color="#1f497d" size={32}/> Performance Analytics
              </h1>
              <p className="page-subtitle">Track attendance and monitor progress</p>
            </div>
            <div className="date-controls">
              <div className="view-mode-toggle">
                <button
                  className={`mode-btn ${viewMode === "daily" ? "active" : ""}`}
                  onClick={() => setViewMode("daily")}
                >
                  <Calendar size={16} />
                  Daily
                </button>
                <button
                  className={`mode-btn ${viewMode === "range" ? "active" : ""}`}
                  onClick={() => setViewMode("range")}
                >
                  <CalendarRange size={16} />
                  Range
                </button>
              </div>

              {viewMode === "daily" ? (
                <div className="date-selector">
                  <Calendar className="calendar-icon" size={20} />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="date-input"
                  />
                </div>
              ) : (
                <div className="date-range-selector">
                  <div className="date-input-group">
                    <label>From:</label>
                    <input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                      className="date-input"
                    />
                  </div>
                  <div className="date-input-group">
                    <label>To:</label>
                    <input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                      className="date-input"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="attendance-navigation">
            <div className="nav-tabs">
              <button
                className={`nav-tab ${selectedType === "students" ? "active" : ""}`}
                onClick={() => setSelectedType("students")}
              >
                <Users size={18} />
                Students
                <span className="tab-count">{attendanceStats.students}</span>
              </button>
              <button
                className={`nav-tab ${selectedType === "facilitator" ? "active" : ""}`}
                onClick={() => setSelectedType("facilitator")}
              >
                <UserCheck size={18} />
                Facilitators
                <span className="tab-count">{attendanceStats.facilitators}</span>
              </button>
            </div>
          </div>

          <div className="attendance-controls">
            <div className="controls-left">
              <div className="search-container">
                <Search className="search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Search by name..."
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
                    value={selectedProgram}
                    onChange={(e) => {
                      setSelectedProgram(e.target.value)
                      setSelectedSubGroup("all")
                    }}
                    className="filter-select"
                  >
                    <option value="all">All Programs</option>
                    {Object.keys(programs).map((program) => (
                      <option key={program} value={program}>
                        {program}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedProgram !== "all" && programs[selectedProgram] && (
                  <div className="filter-container">
                    <select
                      value={selectedSubGroup}
                      onChange={(e) => setSelectedSubGroup(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">All Groups</option>
                      {Object.keys(programs[selectedProgram]).map((subGroup) => (
                        <option key={subGroup} value={subGroup}>
                          {subGroup}
                        </option>
                      ))}
                      {Object.values(programs[selectedProgram])
                        .flat()
                        .map((track) => (
                          <option
                            key={track}
                            value={`${Object.keys(programs[selectedProgram]).find((key) => programs[selectedProgram][key].includes(track))} - ${track}`}
                          >
                            {Object.keys(programs[selectedProgram]).find((key) =>
                              programs[selectedProgram][key].includes(track),
                            )}{" "}
                            - {track}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="controls-right">
              <button className="export-btn" onClick={exportToCSV}>
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </div>

          <div className="attendance-table">
            <div className="table-header">
              <div className="header-cell">Person</div>
              <div className="header-cell">Program/Group</div>
              <div className="header-cell">Status</div>
              <div className="header-cell">Check In</div>
              <div className="header-cell">Check Out</div>
              <div className="header-cell">Hours</div>
              <div className="header-cell">Attendance Rate</div>
              <div className="header-cell">Action</div>
            </div>
            <div className="table-body">
              {filteredAttendance.map((record) => (
                <div key={record.id} className="table-row">
                  <div className="table-cell">
                    <div className="person-info">
                      <div className="person-avatar">
                        {record.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className="person-details">
                        <span className="person-name">{record.name}</span>
                        <button
                          className="person-email"
                          onClick={() => handleEmailClick(record.email)}
                          title="Send email"
                        >
                          {record.email}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="table-cell">
                    <div className="program-info">
                      <span className="program-name">{record.program}</span>
                      <span className="subgroup-name">{record.subGroup}</span>
                    </div>
                  </div>
                  <div className="table-cell">
                    <div className={`status-badge ${record.status}`}>
                      {getStatusIcon(record.status)}
                      <span className="status-text">{record.status}</span>
                    </div>
                  </div>
                  <div className="table-cell">
                    <span className="time-text">{record.checkInTime || "-"}</span>
                  </div>
                  <div className="table-cell">
                    <span className="time-text">{record.checkOutTime || "-"}</span>
                  </div>
                  <div className="table-cell">
                    <span className="hours-text">{record.totalHours}h</span>
                  </div>
                  <div className="table-cell">
                    <div className="attendance-rate">
                      <span className={`rate-text ${getAttendanceStatus(record.attendanceRate)}`}>
                        {record.attendanceRate}%
                      </span>
                      <div className="rate-details">
                        {record.presentDays}/{record.totalDays} days
                      </div>
                    </div>
                  </div>
                  <div className="table-cell">
                    <div className="action-buttons">
                      <button
                        className="action-btn message"
                        title="Send message"
                        onClick={() => handleEmailClick(record.email)}
                      >
                        <Mail size={16} />
                      </button>
                      {record.type === "student" && record.attendanceRate < 70 && (
                        <button
                          className="action-btn warning"
                          title="Send warning"
                          onClick={() => handleEmailClick(record.email)}
                        >
                          <AlertTriangle size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {filteredAttendance.length === 0 && (
            <div className="empty-state">
              <Calendar size={48} />
              <h3>No attendance records found</h3>
              <p>No records match your current filters for {new Date(selectedDate).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        <div className="attendance-sidebar">
          <div className="stats-section">
            <h3 className="stats-title">
              <TrendingUp size={20} />
              Today's Overview
            </h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon bg-gray">
                  <Users size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{attendanceStats.total}</div>
                  <div className="stat-label">Total Present</div>
                  <div className="stat-breakdown">{selectedType === "students" ? "Students" : "Facilitators"}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon bg-green">
                  <CheckCircle size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{attendanceStats.present}</div>
                  <div className="stat-label">Present</div>
                  <div className="stat-breakdown">{attendanceRate}% Rate</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon bg-orange">
                  <Clock size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{attendanceStats.late}</div>
                  <div className="stat-label">Late</div>
                  <div className="stat-breakdown">{attendanceStats.absent} Absent</div>
                </div>
              </div>

              {selectedType === "students" && (
                <div className="stat-card critical">
                  <div className="stat-icon bg-red">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-number">{attendanceStats.criticalStudents}</div>
                    <div className="stat-label">At Risk</div>
                    <div className="stat-breakdown">Below 70%</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="program-breakdown">
            <h3 className="stats-title">
              <GraduationCap size={20} />
              Program Breakdown
            </h3>
            <div className="program-stats">
              <div className="program-stat">
                <span className="program-label">Data Analytics</span>
                <span className="program-count">
                  {attendanceData.filter((r) => r.subGroup === "Data Analytics" && r.type === selectedType).length}
                </span>
              </div>
              <div className="program-stat">
                <span className="program-label">Software - Web</span>
                <span className="program-count">
                  {attendanceData.filter((r) => r.subGroup === "Software - Web" && r.type === selectedType).length}
                </span>
              </div>
              <div className="program-stat">
                <span className="program-label">Software - Mobile</span>
                <span className="program-count">
                  {attendanceData.filter((r) => r.subGroup === "Software - Mobile" && r.type === selectedType).length}
                </span>
              </div>
            </div>
          </div>
          {viewMode === "range" && (
            <div className="weekly-report">
              <h3 className="stats-title">
                <BarChart3 size={20} />
                Period Summary
              </h3>
              <div className="report-stats">
                <div className="report-item">
                  <span className="report-label">Date Range</span>
                  <span className="report-value">
                    {new Date(dateRange.from).toLocaleDateString()} - {new Date(dateRange.to).toLocaleDateString()}
                  </span>
                </div>
                <div className="report-item">
                  <span className="report-label">Average Attendance</span>
                  <span className="report-value">{generateWeeklyReport().averageAttendance}%</span>
                </div>
                <div className="report-item">
                  <span className="report-label">At Risk Students</span>
                  <span className="report-value critical">{generateWeeklyReport().atRiskStudents}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
