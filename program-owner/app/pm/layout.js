"use client"

import { useState } from "react"
import PMSidebar from "../../components/pmsidebar"
import PMNavbar from "../../components/pmnavabar"
import "../../styles/pmlayout.css"

export default function PMLayout({ children }) {
  const [isDark, setIsDark] = useState(false)

  const toggleDarkMode = () => {
    setIsDark(!isDark)
    document.documentElement.setAttribute("data-theme", isDark ? "light" : "dark")
  }

  return (
    <div className="pm-layout">
      <PMSidebar isDark={isDark} onToggleTheme={toggleDarkMode} />
      <div className="pm-main-content">
        <PMNavbar />
        <main className="pm-dashboard-content">
          <div className="pm-container">{children}</div>
        </main>
      </div>
    </div>
  )
}
