"use client"

import { useRouter, usePathname } from "next/navigation"
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  Award,
  Archive,
  Rocket,
  Sun,
  Moon,
} from "lucide-react"
import "../styles/pmsidebar.css"

export default function PMSidebar({ isDark, onToggleTheme }) {
  const router = useRouter()
  const pathname = usePathname()

  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", route: "/pm" },
    { id: "programs", icon: GraduationCap, label: "Programs", route: "/pm/programs", count: 12 },
    { id: "facilitators", icon: UserCheck, label: "Facilitators", route: "/pm/facilitator", count: 45 },
    { id: "trainees", icon: Users, label: "Trainees", route: "/pm/trainees", count: 234 },
    { id: "attendance", icon: Calendar, label: "Attendance", route: "/pm/attendance" },
    { id: "performance", icon: TrendingUp, label: "Performance", route: "/pm/performance" },
    { id: "certificates", icon: Award, label: "Certificates", route: "/pm/certificates", count: 89 },
    { id: "archive", icon: Archive, label: "Archive", route: "/pm/archieves" },
  ]

  const handleNavigation = (route) => {
    router.push(route)
  }

  return (
    <div className="pm-sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <Rocket size={20} />
          </div>
          <div className="logo-content">
            <span className="logo-text">KLab PM</span>
            <span className="logo-subtitle">Program Manager</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const IconComponent = item.icon
          const isActive = pathname === item.route
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => handleNavigation(item.route)}
            >
              <IconComponent className="nav-icon" size={20} />
              <span className="nav-label">{item.label}</span>
              {item.count && <span className="nav-count">{item.count}</span>}
            </button>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="theme-toggle" onClick={onToggleTheme}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
        </button>
      </div>
    </div>
  )
}
