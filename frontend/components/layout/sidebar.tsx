import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, 
  Users, 
  BookOpen, 
  Upload, 
  Calendar, 
  MapPin, 
  ClipboardCheck, 
  BarChart3,
  UserCheck,
  FileText,
  Wrench,
  GraduationCap,
  FolderOpen,
  MessageSquare,
  Activity,
  Award,
  Archive,
  Rocket,
  Sun,
  Moon,
  Ticket,
  Bell,
  Settings,
  User,
  LogOut,
  ChevronDown,
  HelpCircle,
  Mail,
  Search,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react"

// Import the actual useRole hook from your auth context
import { useRole } from "@/lib/contexts/RoleContext"

// Import the UserRole type and getRoleDisplayName function
import { UserRole } from "@/types/user"
import { getRoleDisplayName } from "@/lib/roles"

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIsMobile()
    window.addEventListener("resize", checkIsMobile)
    return () => window.removeEventListener("resize", checkIsMobile)
  }, [])
  
  return isMobile
}

interface MenuItem {
  title: string
  url: string
  icon: React.ComponentType<any>
  roles: UserRole[]
  count?: number
}

interface Notification {
  id: number
  type: "application" | "assignment" | "approval" | "deadline"
  message: string
  time: string
  unread: boolean
}

interface AppSidebarProps {
  isDark?: boolean
  onToggleTheme?: () => void
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    roles: ['super_admin', 'program_manager', 'facilitator', 'trainee', 'it_support']
  },
  {
    title: "User Management",
    url: "/dashboard/user-management",
    icon: Users,
    roles: ['super_admin']
  },
  {
    title: "Master Log",
    url: "/dashboard/master-log",
    icon: Activity,
    roles: ['super_admin']
  },
  {
    title: "Reports & Export",
    url: "/dashboard/reports-export",
    icon: BarChart3,
    roles: ['super_admin']
  },
  {
    title: "Programs",
    url: "/dashboard/programs",
    icon: BookOpen,
    roles: ['program_manager'],
    count: 12
  },
  {
    title: "Facilitators",
    url: "/dashboard/facilitators",
    icon: UserCheck,
    roles: ['program_manager'],
    count: 45
  },
  {
    title: "Trainees",
    url: "/dashboard/trainees",
    icon: Users,
    roles: ['program_manager'],
    count: 234
  },
  {
    title: "Attendance",
    url: "/dashboard/attendance",
    icon: Calendar,
    roles: ['program_manager']
  },
  {
    title: "Certificates",
    url: "/dashboard/certificates",
    icon: Award,
    roles: ['program_manager'],
    count: 89
  },
  {
    title: "Archive",
    url: "/dashboard/archive",
    icon: Archive,
    roles: ['program_manager']
  },
  {
    title: "My Programs",
    url: "/facilitator/programs",
    icon: BookOpen,
    roles: ['facilitator']
  },
  {
    title: "Attendance Tracking",
    url: "/facilitator/attendance",
    icon: MapPin,
    roles: ['facilitator']
  },
  {
    title: "Curriculum Upload",
    url: "/facilitator/curriculum",
    icon: Upload,
    roles: ['facilitator']
  },
  {
    title: "Project Reviews",
    url: "/facilitator/reviews",
    icon: ClipboardCheck,
    roles: ['facilitator']
  },
  {
    title: "Weekly Roadmap",
    url: "/facilitator/roadmap",
    icon: Calendar,
    roles: ['facilitator']
  },
  {
    title: "My Learning",
    url: "/dashboard/my-learning",
    icon: GraduationCap,
    roles: ['trainee']
  },
  {
    title: "Submit Projects",
    url: "/dashboard/submit-projects",
    icon: FileText,
    roles: ['trainee']
  },
   {
    title: "Attendance",
    url: "/dashboard/attendance",
    icon:  MapPin,
    roles: ['trainee']
  },
  {
    title: "My Progress",
    url: "/dashboard/my-progress",
    icon: Activity,
    roles: ['trainee']
  },
  {
    title: "Learning Resources",
    url: "/dashboard/resources",
    icon: FolderOpen,
    roles: ['trainee']
  },
  
  {
    title: "Support Tickets",
    url: "/dashboard/support-tickets",
    icon: MessageSquare,
    roles: ['it_support']
  },
  {
    title: "System Monitoring",
    url: "/dashboard/system-monitoring",
    icon: Activity,
    roles: ['it_support']
  },
  {
    title: "Maintenance",
    url: "/dashboard/maintenance",
    icon: Wrench,
    roles: ['it_support']
  },
  {
    title: "Issue Ticket",
    url: "/dashboard/issue-ticket",
    icon: Ticket,
    roles: ['super_admin', 'program_manager', 'facilitator', 'trainee', 'it_support']
  }
]

export function AppSidebar({ isDark = false, onToggleTheme }: AppSidebarProps) {
  const pathname = usePathname()
  // Use the actual useRole hook instead of mock data
  const { user, role, logout } = useRole()
  const isMobile = useIsMobile()
  
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(isDark)

  const notifications: Notification[] = [
    {
      id: 1,
      type: "application",
      message: "New trainee application for Tekeher Experts",
      time: "2 mins ago",
      unread: true,
    },
    { 
      id: 2, 
      type: "assignment", 
      message: "Assignment submitted by John Doe", 
      time: "15 mins ago", 
      unread: true 
    },
    { 
      id: 3, 
      type: "approval", 
      message: "Program 'Data Analytics' approved", 
      time: "1 hour ago", 
      unread: false 
    },
    {
      id: 4,
      type: "deadline",
      message: "Certificate generation deadline approaching",
      time: "3 hours ago",
      unread: false,
    },
  ]

  const unreadCount = notifications.filter((n) => n.unread).length

  // Filter menu items based on user role - this is the key fix!
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(role as UserRole)
  )

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.floating-dropdown') && !target.closest('.floating-btn')) {
        setShowNotifications(false)
        setShowProfile(false)
        setShowSettings(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = (notificationId: number) => {
    console.log("Notification clicked:", notificationId)
  }

  const handleProfileSettings = () => {
    console.log("Profile settings clicked")
    setShowProfile(false)
  }

  const handleLogout = () => {
    logout()
    setShowProfile(false)
  }

  const handleToggleTheme = () => {
    setDarkMode(!darkMode)
    if (onToggleTheme) {
      onToggleTheme()
    }
  }

  const sidebarWidth = isCollapsed ? '80px' : '280px'

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          className="fixed top-4 left-4 z-[1002] p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
      )}

      {/* Overlay for mobile */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[999] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <div 
        className={`
          fixed left-0 top-0 h-screen flex flex-col z-[1000] transition-all duration-300 ease-in-out
          ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}
          border-r
          ${isMobile ? 
            (isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full') : 
            'translate-x-0'
          }
        `}
        style={{ width: isMobile ? '280px' : sidebarWidth }}
      >
        {/* Header */}
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-custom-blue text-white rounded-[10px] flex items-center justify-center flex-shrink-0">
                <Rocket size={20} />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className={`text-lg font-bold leading-tight ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    KLab
                  </span>
                  <span className={`text-xs leading-tight ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {role ? getRoleDisplayName(role) : 'Guest'}
                  </span>
                </div>
              )}
            </div>
            
            {/* Collapse Button - Only show on desktop */}
            {!isMobile && (
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        {!isCollapsed && (
          <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`
                  w-full h-9 pl-10 pr-4 border rounded-lg text-sm transition-all duration-200 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${darkMode 
                    ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400' 
                    : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'
                  }
                `}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const IconComponent = item.icon
            const isActive = pathname === item.url
            return (
              <Link
                key={item.title}
                href={item.url}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 mb-1 rounded-lg transition-all duration-200 text-sm font-medium no-underline
                  ${isActive 
                    ? '#1f497d text-white shadow-lg' 
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-800 hover:text-gray-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                style={isActive ? { backgroundColor: '#1f497d' } : {}}
                title={isCollapsed ? item.title : undefined}
              >
                <IconComponent className="flex-shrink-0" size={20} />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 whitespace-nowrap overflow-hidden font-medium">
                      {item.title}
                    </span>
                    {item.count && (
                      <span className={`px-2 py-0.5 rounded-xl text-xs font-semibold min-w-[20px] text-center ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Theme Toggle */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <button 
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium
              ${darkMode 
                ? 'text-gray-300 hover:bg-gray-800 hover:text-gray-100' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }
              ${isCollapsed ? 'justify-center' : ''}
            `}
            onClick={handleToggleTheme}
            title={isCollapsed ? (darkMode ? "Light Mode" : "Dark Mode") : undefined}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            {!isCollapsed && <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>}
          </button>
        </div>
      </div>

      {/* Floating Action Bubbles */}
      <div className="fixed bottom-8 right-8 z-[1001] flex flex-col gap-4">
        {/* Notifications Bubble */}
        <div className="relative">
          <button 
            className="floating-btn group w-14 h-14 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95"
            style={{ backgroundColor: '#1f497d' }}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} className="group-hover:animate-pulse" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className={`
              floating-dropdown absolute bottom-16 right-0 border rounded-2xl shadow-2xl z-[1000] min-w-[350px] overflow-hidden backdrop-blur-lg
              ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
            `}>
              <div className={`px-6 py-5 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
                <h3 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  <Bell size={18} />
                  Notifications
                </h3>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`
                      px-6 py-4 border-b flex items-center gap-3 cursor-pointer transition-all duration-200
                      ${darkMode 
                        ? 'border-gray-700 hover:bg-gray-700' + (notification.unread ? ' bg-gray-750' : '')
                        : 'border-gray-50 hover:bg-blue-50' + (notification.unread ? ' bg-blue-25' : '')
                      }
                    `}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="flex-1">
                      <p className={`text-sm mb-1 font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                        {notification.message}
                      </p>
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {notification.time}
                      </span>
                    </div>
                    {notification.unread && (
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                ))}
              </div>
              <div className={`p-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <Link 
                  href="/dashboard/notifications"
                  className={`
                    w-full text-sm font-medium flex items-center justify-center gap-2 py-2 rounded-lg transition-colors
                    ${darkMode 
                      ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-700' 
                      : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                    }
                  `}
                >
                  View All Notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Settings Bubble */}
        <div className="relative">
          <button 
            className="floating-btn group w-14 h-14 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95"
            style={{ backgroundColor: '#1f497d' }}
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
          
          {showSettings && (
            <div className={`
              floating-dropdown absolute bottom-16 right-0 border rounded-2xl shadow-2xl z-[1000] min-w-[280px] overflow-hidden backdrop-blur-lg
              ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
            `}>
              <div className={`px-6 py-5 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50'}`}>
                <h3 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  <Settings size={18} />
                  Settings
                </h3>
              </div>
              <div className="py-4">
                <Link 
                  href="/dashboard/settings"
                  className={`
                    w-full flex items-center gap-3 px-6 py-3 transition-colors text-sm font-medium
                    ${darkMode 
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-gray-100' 
                      : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                    }
                  `}
                >
                  <Settings size={16} />
                  <span>Account Settings</span>
                </Link>
                <Link 
                  href="/dashboard/preferences"
                  className={`
                    w-full flex items-center gap-3 px-6 py-3 transition-colors text-sm font-medium
                    ${darkMode 
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-gray-100' 
                      : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                    }
                  `}
                >
                  <User size={16} />
                  <span>Preferences</span>
                </Link>
                <Link 
                  href="/dashboard/help"
                  className={`
                    w-full flex items-center gap-3 px-6 py-3 transition-colors text-sm font-medium
                    ${darkMode 
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-gray-100' 
                      : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                    }
                  `}
                >
                  <HelpCircle size={16} />
                  <span>Help & Support</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Bubble */}
        <div className="relative">
          <button 
            className="floating-btn group w-14 h-14 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95"
            style={{ backgroundColor: '#1f497d' }}
            onClick={() => setShowProfile(!showProfile)}
          >
            <User size={20} className="group-hover:scale-110 transition-transform duration-300" />
          </button>
          
          {showProfile && (
            <div className={`
              floating-dropdown absolute bottom-16 right-0 border rounded-2xl shadow-2xl z-[1000] min-w-[320px] overflow-hidden backdrop-blur-lg
              ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
            `}>
              <div className={`px-6 py-6 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full flex items-center justify-center">
                    <User size={24} />
                  </div>
                  <div>
                    <h4 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                      {user?.name || "User"}
                    </h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {user?.email || "user@klab.rw"}
                    </p>
                    <p className="text-xs text-green-600 font-medium">
                      {role ? getRoleDisplayName(role) : "Guest"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="py-4">
                <Link 
                  href="/dashboard/profile"
                  className={`
                    w-full flex items-center gap-3 px-6 py-3 transition-colors text-sm font-medium
                    ${darkMode 
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-gray-100' 
                      : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                    }
                  `}
                >
                  <User size={16} />
                  <span>View Profile</span>
                </Link>
                <Link 
                  href="/dashboard/messages"
                  className={`
                    w-full flex items-center gap-3 px-6 py-3 transition-colors text-sm font-medium
                    ${darkMode 
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-gray-100' 
                      : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                    }
                  `}
                >
                  <Mail size={16} />
                  <span>Messages</span>
                </Link>
                <hr className={`my-2 mx-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`} />
                <button 
                  className={`
                    w-full flex items-center gap-3 px-6 py-3 transition-colors text-sm font-medium
                    ${darkMode 
                      ? 'text-red-400 hover:bg-gray-700' 
                      : 'text-red-600 hover:bg-red-50'
                    }
                  `}
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Spacer - This pushes content to the right of the sidebar */}
      <div 
        className={`transition-all duration-300 ${isMobile ? 'ml-0' : ''}`}
        style={{ 
          marginLeft: isMobile ? '0' : sidebarWidth,
          minHeight: '100vh' 
        }}
      />
    </>
  )
}