"use client"

import { useState } from "react"
import {
  Users,
  GraduationCap,
  UserCheck,
  Award,
  TrendingUp,
  Calendar,
  Clock,
  Target,
  BarChart3,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowRight,
} from "lucide-react"
import "../../styles/pmdashboard.css"

export default function PMDashboard() {
  const [stats] = useState({
    totalPrograms: 12,
    activePrograms: 8,
    totalTrainees: 234,
    totalFacilitators: 45,
    completionRate: 87,
    attendanceRate: 92,
  })

  const [recentActivities] = useState([
    { id: 1, type: "enrollment", message: "25 new trainees enrolled in Data Science Program", time: "2 hours ago" },
    { id: 2, type: "completion", message: "Web Development cohort completed successfully", time: "5 hours ago" },
    { id: 3, type: "assignment", message: "New facilitator assigned to AI/ML Program", time: "1 day ago" },
    { id: 4, type: "certificate", message: "89 certificates generated for graduates", time: "2 days ago" },
  ])

  const [upcomingEvents] = useState([
    { id: 1, title: "Data Science Program Kickoff", date: "2024-01-15", time: "09:00 AM" },
    { id: 2, title: "Facilitator Training Workshop", date: "2024-01-18", time: "02:00 PM" },
    { id: 3, title: "Mid-term Evaluations", date: "2024-01-22", time: "10:00 AM" },
    { id: 4, title: "Certificate Ceremony", date: "2024-01-25", time: "03:00 PM" },
  ])

  const statCards = [
    {
      title: "Total Programs",
      value: stats.totalPrograms,
      change: "+2 this month",
      icon: GraduationCap,
      bgColor: "bg-gray-50",
      iconColor: "text-gray-700",
    },
    {
      title: "Active Trainees",
      value: stats.totalTrainees,
      change: "+15 this week",
      icon: Users,
      bgColor: "bg-gray-50",
      iconColor: "text-gray-700",
    },
    {
      title: "Facilitators",
      value: stats.totalFacilitators,
      change: "+3 new",
      icon: UserCheck,
      bgColor: "bg-gray-50",
      iconColor: "text-gray-700",
    },
    {
      title: "Completion Rate",
      value: `${stats.completionRate}%`,
      change: "+5% improvement",
      icon: Award,
      bgColor: "bg-[#1f497d]/5",
      iconColor: "text-[#1f497d]",
    },
  ]

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            <Activity className="title-icon" />
            Program Management Dashboard
          </h1>
          <p className="dashboard-subtitle">Monitor and manage all educational programs</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary">
            <Zap size={16} />
            Quick Actions
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <div key={stat.title} className="stat-card">
              <div className="stat-content">
                <p className="stat-label">{stat.title}</p>
                <p className="stat-number">{stat.value}</p>
                <p className="stat-change positive">
                  <ArrowUpRight size={12} />
                  {stat.change}
                </p>
              </div>
              <div className={`stat-icon ${stat.bgColor} ${stat.iconColor}`}>
                <IconComponent size={24} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card chart-card">
          <div className="card-header">
            <h3 className="card-title">
              <BarChart3 size={20} />
              Performance Overview
            </h3>
          </div>
          <div className="chart-container">
            <div className="chart-placeholder">
              <TrendingUp size={48} />
              <p>Performance metrics visualization</p>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">
              <Clock size={20} />
              Recent Activities
            </h3>
          </div>
          <div className="activity-list">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-dot"></div>
                <div className="activity-content">
                  <p className="activity-message">{activity.message}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">
              <Calendar size={20} />
              Upcoming Events
            </h3>
          </div>
          <div className="events-list">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="event-item">
                <div className="event-date">
                  <span className="event-day">{new Date(event.date).getDate()}</span>
                  <span className="event-month">
                    {new Date(event.date).toLocaleDateString("en", { month: "short" })}
                  </span>
                </div>
                <div className="event-details">
                  <h4 className="event-title">{event.title}</h4>
                  <p className="event-time">{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">
              <Target size={20} />
              Quick Stats
            </h3>
          </div>
          <div className="quick-stats">
            <div className="quick-stat">
              <span className="quick-stat-label">Attendance Rate</span>
              <span className="quick-stat-value">{stats.attendanceRate}%</span>
            </div>
            <div className="quick-stat">
              <span className="quick-stat-label">Active Programs</span>
              <span className="quick-stat-value">{stats.activePrograms}</span>
            </div>
            <div className="quick-stat">
              <span className="quick-stat-label">Pending Reviews</span>
              <span className="quick-stat-value">23</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">
              <Zap size={20} />
              Quick Actions
            </h3>
            <p className="card-description">Common tasks and shortcuts</p>
          </div>
          <div className="quick-actions">
            {["Add New Program", "Enroll Trainee", "Generate Report"].map((action) => (
              <button key={action} className="quick-action-btn">
                <span className="action-text">{action}</span>
                <ArrowRight className="action-arrow" size={16} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
