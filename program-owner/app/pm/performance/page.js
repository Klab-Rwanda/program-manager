"use client"
import { useState } from "react"
import {
  TrendingUp,
  Search,
  Filter,
  Award,
  Target,
  BarChart3,
  Users,
  Calendar,
  Eye,
  MessageCircle,
  X,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import "../../../styles/perfomance.css"

export default function PerformancePage() {
  const [selectedProgram, setSelectedProgram] = useState("all")
  const [selectedTimeframe, setSelectedTimeframe] = useState("month")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const programs = ["Tekeher Experts", "Data Analytics Bootcamp", "Mobile App Development", "UI/UX Design Mastery"]

  const [performanceData, setPerformanceData] = useState([
    {
      id: 1,
      name: "John Doe",
      program: "Tekeher Experts",
      overallScore: 85,
      assignments: { completed: 12, total: 16, avgScore: 88 },
      attendance: 92,
      participation: 78,
      projects: { completed: 3, total: 4, avgScore: 85 },
      improvement: 12,
      rank: 3,
      coachFeedback:
        "John shows consistent improvement in problem-solving skills. His participation in group discussions has increased significantly this week.",
      progressData: [
        { week: "Week 1", score: 75, attendance: 85 },
        { week: "Week 2", score: 78, attendance: 88 },
        { week: "Week 3", score: 82, attendance: 90 },
        { week: "Week 4", score: 85, attendance: 92 },
      ],
    },
    {
      id: 2,
      name: "Jane Smith",
      program: "Data Analytics Bootcamp",
      overallScore: 92,
      assignments: { completed: 10, total: 12, avgScore: 94 },
      attendance: 95,
      participation: 89,
      projects: { completed: 2, total: 3, avgScore: 91 },
      improvement: 8,
      rank: 1,
      coachFeedback:
        "Jane is an exceptional student with strong analytical skills. She consistently helps other students and demonstrates leadership qualities.",
      progressData: [
        { week: "Week 1", score: 88, attendance: 92 },
        { week: "Week 2", score: 90, attendance: 94 },
        { week: "Week 3", score: 91, attendance: 95 },
        { week: "Week 4", score: 92, attendance: 95 },
      ],
    },
    {
      id: 3,
      name: "Mike Johnson",
      program: "UI/UX Design Mastery",
      overallScore: 78,
      assignments: { completed: 18, total: 20, avgScore: 82 },
      attendance: 88,
      participation: 72,
      projects: { completed: 5, total: 5, avgScore: 79 },
      improvement: -3,
      rank: 8,
      coachFeedback:
        "Mike has good technical skills but needs to improve his presentation and communication abilities. Encourage more active participation.",
      progressData: [
        { week: "Week 1", score: 82, attendance: 90 },
        { week: "Week 2", score: 80, attendance: 88 },
        { week: "Week 3", score: 79, attendance: 87 },
        { week: "Week 4", score: 78, attendance: 88 },
      ],
    },
    {
      id: 4,
      name: "Sarah Wilson",
      program: "Tekeher Experts",
      overallScore: 67,
      assignments: { completed: 8, total: 16, avgScore: 71 },
      attendance: 65,
      participation: 58,
      projects: { completed: 1, total: 4, avgScore: 68 },
      improvement: -8,
      rank: 15,
      coachFeedback:
        "Sarah is struggling with attendance and assignment completion. Recommend additional support and one-on-one mentoring sessions.",
      progressData: [
        { week: "Week 1", score: 72, attendance: 70 },
        { week: "Week 2", score: 70, attendance: 68 },
        { week: "Week 3", score: 68, attendance: 65 },
        { week: "Week 4", score: 67, attendance: 65 },
      ],
    },
    {
      id: 5,
      name: "Alex Chen",
      program: "Data Analytics Bootcamp",
      overallScore: 89,
      assignments: { completed: 11, total: 12, avgScore: 91 },
      attendance: 94,
      participation: 85,
      projects: { completed: 3, total: 3, avgScore: 88 },
      improvement: 15,
      rank: 2,
      coachFeedback:
        "Alex demonstrates excellent progress and shows great potential in data visualization. His recent project work has been outstanding.",
      progressData: [
        { week: "Week 1", score: 78, attendance: 88 },
        { week: "Week 2", score: 82, attendance: 91 },
        { week: "Week 3", score: 86, attendance: 93 },
        { week: "Week 4", score: 89, attendance: 94 },
      ],
    },
    {
      id: 6,
      name: "Emma Davis",
      program: "Mobile App Development",
      overallScore: 81,
      assignments: { completed: 14, total: 18, avgScore: 84 },
      attendance: 87,
      participation: 76,
      projects: { completed: 2, total: 3, avgScore: 82 },
      improvement: 6,
      rank: 5,
      coachFeedback:
        "Emma shows solid understanding of mobile development concepts. Her code quality has improved significantly over the past weeks.",
      progressData: [
        { week: "Week 1", score: 76, attendance: 82 },
        { week: "Week 2", score: 78, attendance: 85 },
        { week: "Week 3", score: 80, attendance: 86 },
        { week: "Week 4", score: 81, attendance: 87 },
      ],
    },
  ])

  const programPerformanceData = [
    { program: "Tekeher Experts", avgScore: 76, students: 8 },
    { program: "Data Analytics", avgScore: 90, students: 6 },
    { program: "Mobile Dev", avgScore: 81, students: 5 },
    { program: "UI/UX Design", avgScore: 78, students: 4 },
  ]

  const performanceDistribution = [
    { name: "Excellent (90+)", value: 2, color: "#6b7292" },
    { name: "Good (80-89)", value: 2, color: "#6b7280" },
    { name: "Average (70-79)", value: 1, color: "#9ca3af" },
    { name: "Needs Improvement (<70)", value: 1, color: "#d1d5db" },
  ]

  const filteredPerformance = performanceData.filter((record) => {
    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProgram = selectedProgram === "all" || record.program === selectedProgram
    return matchesSearch && matchesProgram
  })

  const getPerformanceLevel = (score) => {
    if (score >= 90) return { level: "Excellent", color: "#1f2937", bgColor: "#f3f4f6" }
    if (score >= 80) return { level: "Good", color: "#374151", bgColor: "#f9fafb" }
    if (score >= 70) return { level: "Average", color: "#6b7280", bgColor: "#f3f4f6" }
    return { level: "Needs Improvement", color: "#9ca3af", bgColor: "#f9fafb" }
  }

  const getImprovementIcon = (improvement) => {
    if (improvement > 0) return <TrendingUp className="improvement-icon positive" size={16} />
    if (improvement < 0) return <TrendingUp className="improvement-icon negative" size={16} />
    return <TrendingUp className="improvement-icon neutral" size={16} />
  }

  const overallStats = {
    avgScore: filteredPerformance.reduce((sum, p) => sum + p.overallScore, 0) / filteredPerformance.length || 0,
    avgAttendance: filteredPerformance.reduce((sum, p) => sum + p.attendance, 0) / filteredPerformance.length || 0,
    totalAssignments: filteredPerformance.reduce((sum, p) => sum + p.assignments.completed, 0),
    totalProjects: filteredPerformance.reduce((sum, p) => sum + p.projects.completed, 0),
  }

  const openStudentDetail = (student) => {
    setSelectedStudent(student)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedStudent(null)
  }

  return (
    <div className="performance-page">
      <div className="page-header">
       <div className="header-content">
  <h1 className="page-title">
    <TrendingUp className="icon"   color="#1f497d" size={32}/> Performance Analytics
  </h1>
  <p className="page-subtitle">
    Track student progress with comprehensive metrics and coach feedback
  </p>
</div>

<div className="timeframe-selector">
  <Calendar className="calendar-icon" size={20} />
  <select
    value={selectedTimeframe}
    onChange={(e) => setSelectedTimeframe(e.target.value)}
    className="timeframe-select"
  >
   

            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      <div className="performance-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{overallStats.avgScore.toFixed(1)}</div>
            <div className="stat-label">Average Score</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{overallStats.avgAttendance.toFixed(1)}%</div>
            <div className="stat-label">Average Attendance</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Target size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{overallStats.totalAssignments}</div>
            <div className="stat-label">Assignments Completed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Award size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{overallStats.totalProjects}</div>
            <div className="stat-label">Projects Completed</div>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-container">
          <h3>Program Performance Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={programPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="program" tick={{ fill: "#6b7280", fontSize: 12 }} />
              <YAxis tick={{ fill: "#6b728", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Bar dataKey="avgScore" fill="#1f497d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-container">
          <h3>Performance Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={performanceDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${value}`}
              >
                {performanceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="performance-controls">
        <div className="search-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search students by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-container">
          <Filter className="filter-icon" size={18} />
          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
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
      </div>

      <div className="performance-grid">
        {filteredPerformance.map((student) => {
          const performance = getPerformanceLevel(student.overallScore)
          return (
            <div key={student.id} className="performance-card">
              <div className="card-header">
                <div className="student-info">
                  <div className="student-avatar">
                    {student.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="student-details">
                    <h3 className="student-name">{student.name}</h3>
                    <p className="student-program">{student.program}</p>
                  </div>
                </div>
                <div
                  className="performance-badge"
                  style={{ backgroundColor: performance.bgColor, color: performance.color }}
                >
                  <span className="performance-level">{performance.level}</span>
                  <span className="performance-score">{student.overallScore}</span>
                </div>
              </div>

              <div className="performance-metrics">
                <div className="metric-row">
                  <div className="metric-item">
                    <span className="metric-label">Assignments</span>
                    <div className="metric-value">
                      <span>
                        {student.assignments.completed}/{student.assignments.total}
                      </span>
                      <span className="metric-score">({student.assignments.avgScore}%)</span>
                    </div>
                  </div>
                  <div className="metric-progress">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(student.assignments.completed / student.assignments.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="metric-row">
                  <div className="metric-item">
                    <span className="metric-label">Projects</span>
                    <div className="metric-value">
                      <span>
                        {student.projects.completed}/{student.projects.total}
                      </span>
                      <span className="metric-score">({student.projects.avgScore}%)</span>
                    </div>
                  </div>
                  <div className="metric-progress">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(student.projects.completed / student.projects.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="metric-row">
                  <div className="metric-item">
                    <span className="metric-label">Attendance</span>
                    <div className="metric-value">
                      <span>{student.attendance}%</span>
                    </div>
                  </div>
                  <div className="metric-progress">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${student.attendance}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="metric-row">
                  <div className="metric-item">
                    <span className="metric-label">Participation</span>
                    <div className="metric-value">
                      <span>{student.participation}%</span>
                    </div>
                  </div>
                  <div className="metric-progress">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${student.participation}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="coach-feedback">
                <div className="feedback-header">
                  <MessageCircle size={16} />
                  <span>Coach Feedback</span>
                </div>
                <p className="feedback-text">{student.coachFeedback}</p>
              </div>

              <div className="performance-footer">
                <div className="rank-info">
                  <Award size={16} />
                  <span>Rank #{student.rank}</span>
                </div>
                <div className="improvement-info">
                  {getImprovementIcon(student.improvement)}
                  <span
                    className={`improvement-text ${
                      student.improvement > 0 ? "positive" : student.improvement < 0 ? "negative" : "neutral"
                    }`}
                  >
                    {student.improvement > 0 ? "+" : ""}
                    {student.improvement}%
                  </span>
                </div>
                <button className="detail-btn" onClick={() => openStudentDetail(student)}>
                  <Eye size={14} />
                  View Details
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filteredPerformance.length === 0 && (
        <div className="empty-state">
          <BarChart3 size={48} />
          <h3>No students found</h3>
          <p>No students match your current search and filters</p>
        </div>
      )}

      {showModal && selectedStudent && (
        <div className="performance-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedStudent.name} - Detailed Performance</h2>
              <button className="modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Progress Over Time</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={selectedStudent.progressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="week" tick={{ fill: "#6b7280", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ fill: "#3b82f6" }} />
                    <Line
                      type="monotone"
                      dataKey="attendance"
                      stroke="#6b7280"
                      strokeWidth={2}
                      dot={{ fill: "#6b7280" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="detail-section">
                <h3>Performance Breakdown</h3>
                <div className="breakdown-grid">
                  <div className="breakdown-item">
                    <span className="breakdown-label">Overall Score</span>
                    <span className="breakdown-value">{selectedStudent.overallScore}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Attendance Rate</span>
                    <span className="breakdown-value">{selectedStudent.attendance}%</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Assignment Average</span>
                    <span className="breakdown-value">{selectedStudent.assignments.avgScore}%</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Project Average</span>
                    <span className="breakdown-value">{selectedStudent.projects.avgScore}%</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Coach Assessment</h3>
                <div className="feedback-card">
                  <div className="feedback-item">
                    <strong>Weekly Feedback:</strong>
                    <p>{selectedStudent.coachFeedback}</p>
                  </div>
                  <div className="feedback-item">
                    <strong>Overall Assessment:</strong>
                    <p>
                      {selectedStudent.overallScore >= 90
                        ? "Exceptional performance with consistent high-quality work and excellent engagement."
                        : selectedStudent.overallScore >= 80
                          ? "Strong performance with good understanding of concepts and regular participation."
                          : selectedStudent.overallScore >= 70
                            ? "Satisfactory performance with room for improvement in key areas."
                            : "Needs significant improvement and additional support to meet program standards."}
                    </p>
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
