"use client"

import { useState } from "react"
import { Bell, Search, Settings, User, LogOut, ChevronDown, MessageSquare, HelpCircle } from "lucide-react"
import "../styles/pmnavbar.css"

export default function PMNavbar() {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const notifications = [
    {
      id: 1,
      type: "application",
      message: "New trainee application for Tekeher Experts",
      time: "2 mins ago",
      unread: true,
    },
    { id: 2, type: "assignment", message: "Assignment submitted by John Doe", time: "15 mins ago", unread: true },
    { id: 3, type: "approval", message: "Program 'Data Analytics' approved", time: "1 hour ago", unread: false },
    {
      id: 4,
      type: "deadline",
      message: "Certificate generation deadline approaching",
      time: "3 hours ago",
      unread: false,
    },
  ]

  const unreadCount = notifications.filter((n) => n.unread).length

  return (
    <nav className="pm-navbar">
      <div className="navbar-left">
        <div className="search-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search programs, trainees, facilitators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="navbar-right">
        <div className="navbar-item">
          <button className="notification-btn" onClick={() => setShowNotifications(!showNotifications)}>
            <Bell size={20} />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>
          {showNotifications && (
            <div className="notification-dropdown">
              <div className="dropdown-header">
                <h3>Notifications</h3>
                <button className="mark-all-read">Mark all as read</button>
              </div>
              <div className="notification-list">
                {notifications.map((notification) => (
                  <div key={notification.id} className={`notification-item ${notification.unread ? "unread" : ""}`}>
                    <div className="notification-content">
                      <p className="notification-message">{notification.message}</p>
                      <span className="notification-time">{notification.time}</span>
                    </div>
                    {notification.unread && <div className="unread-dot"></div>}
                  </div>
                ))}
              </div>
              <div className="dropdown-footer">
                <button className="view-all-btn">View All Notifications</button>
              </div>
            </div>
          )}
        </div>

        <div className="navbar-item">
          <button className="icon-btn">
            <MessageSquare size={20} />
          </button>
        </div>

        <div className="navbar-item">
          <button className="icon-btn">
            <HelpCircle size={20} />
          </button>
        </div>

        <div className="navbar-item profile-container">
          <button className="profile-btn" onClick={() => setShowProfile(!showProfile)}>
            <div className="profile-avatar">
              <User size={18} />
            </div>
            <div className="profile-info">
              <span className="profile-name">John Manager</span>
              <span className="profile-role">Program Manager</span>
            </div>
            <ChevronDown size={16} />
          </button>
          {showProfile && (
            <div className="profile-dropdown">
              <div className="profile-header">
                <div className="profile-avatar large">
                  <User size={24} />
                </div>
                <div>
                  <h4>John Manager</h4>
                  <p>john.manager@klab.rw</p>
                </div>
              </div>
              <div className="profile-menu">
                <button className="profile-menu-item">
                  <User size={16} />
                  <span>Profile Settings</span>
                </button>
                <button className="profile-menu-item">
                  <Settings size={16} />
                  <span>Account Settings</span>
                </button>
                <hr className="menu-divider" />
                <button className="profile-menu-item logout">
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
