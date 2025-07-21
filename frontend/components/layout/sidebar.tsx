"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, Archive, Award, BarChart3, Bell, BookOpen, Calendar,
  Calendar1,
  ChevronLeft, ChevronRight, ClipboardCheck, FileText, FolderOpen,
  GraduationCap, Home, LogOut, Mail, Menu, MessageSquare, Moon, Settings, Sun, Ticket,
  TrendingUp, Upload, User, UserCheck, Users, Wrench
} from "lucide-react";

import { useAuth } from "@/lib/contexts/RoleContext";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import { useCounts } from "@/lib/contexts/CountsContext";
import { useTheme } from "next-themes";

const menuItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home, roles: ['super_admin', 'program_manager', 'facilitator', 'trainee', 'it_support'] },
    // Super Admin
    { title: "User Management", url: "/dashboard/SuperAdmin/user-management", icon: Users, roles: ['super_admin'] },
    { title: "Master Log", url: "/dashboard/SuperAdmin/master-log", icon: Activity, roles: ['super_admin'] },
    { title: "Reports & Export", url: "/dashboard/SuperAdmin/reports-export", icon: BarChart3, roles: ['super_admin'] },
    { title: "System Monitoring", url: "/dashboard/SuperAdmin/system-monitoring", icon: Activity, roles: ['super_admin', 'it_support'] },
    // Program Manager
    { title: "Programs", url: "/dashboard/Manager/programs", icon: BookOpen, roles: ['program_manager'], countKey: 'programs' },
    { title: "Facilitators", url: "/dashboard/Manager/facilitators", icon: UserCheck, roles: ['program_manager'], countKey: 'facilitators' },
    { title: "Trainees", url: "/dashboard/Manager/trainees", icon: Users, roles: ['program_manager'], countKey: 'trainees' },
    { title: "Attendance", url: "/dashboard/Manager/attendance", icon: Calendar, roles: ['program_manager'] },
    { title: "Certificates", url: "/dashboard/Manager/certificates", icon: Award, roles: ['program_manager'], countKey: 'certificates' },
    { title: "Archive", url: "/dashboard/Manager/archive", icon: Archive, roles: ['program_manager'], countKey: 'archived' },
    // Facilitator
    { title: "My Programs", url: "/dashboard/Facilitator/fac-programs", icon: BookOpen, roles: ['facilitator'] },
    { title: "Attendance Tracking", url: "/dashboard/Facilitator/Fac-attendance", icon: Calendar, roles: ['facilitator'] },
    { title: "Curriculum Upload", url: "/dashboard/Facilitator/fac-curriculum", icon: Upload, roles: ['facilitator'] },
    { title: "Project Reviews", url: "/dashboard/Facilitator/fac-reviews", icon: ClipboardCheck, roles: ['facilitator'] },
    { title: "Weekly Roadmap", url: "/dashboard/Facilitator/fac-roadmap", icon: Calendar, roles: ['facilitator'] },
    // Trainee
    { title: "My Learning", url: "/dashboard/Trainee/my-learning", icon: GraduationCap, roles: ['trainee'] },
    { title: "Submit Projects", url: "/dashboard/Trainee/submit-projects", icon: FileText, roles: ['trainee'] },
    { title: "Attendance", url: "/dashboard/Trainee/Trattendance", icon: Calendar1, roles: ['trainee'] },
    { title: "My Progress", url: "/dashboard/Trainee/my-progress", icon: TrendingUp, roles: ['trainee'] },
    { title: "Learning Resources", url: "/dashboard/Trainee/resources", icon: FolderOpen, roles: ['trainee'] },
    // IT Support
    { title: "Support Tickets", url: "/dashboard/it-support/support-tickets", icon: MessageSquare, roles: ['it_support'] },
    { title: "Maintenance", url: "/dashboard/it-support/maintenance", icon: Wrench, roles: ['it_support'] },
    // Shared
   
];

interface Notification {
  id: number;
  message: string;
  time: string;
  unread: boolean;
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user, role, logout, isAuthenticated } = useAuth();
  const { isCollapsed, toggleSidebar, isMobile, isMobileMenuOpen, closeMobileMenu } = useSidebar();
  const { counts } = useCounts();
  const { theme, setTheme } = useTheme();

  // Debug logging
  console.log('Sidebar: Current counts:', counts);
  console.log('Sidebar: User:', user);
  console.log('Sidebar: Role:', role);
  console.log('Sidebar: IsAuthenticated:', isAuthenticated);

  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const notifications: Notification[] = [
    { id: 1, message: "New trainee application received.", time: "2 mins ago", unread: true },
    { id: 2, message: "Project submitted by John Doe.", time: "15 mins ago", unread: true },
    { id: 3, message: "Program 'Data Analytics' approved.", time: "1 hour ago", unread: false },
  ];
  const unreadCount = notifications.filter(n => n.unread).length;

  const filteredMenuItems = menuItems.filter(item =>
    role ? item.roles.includes(role) : false
  );

  const sidebarWidth = isCollapsed ? '80px' : '280px';

  // Don't render sidebar if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[999]"
          onClick={closeMobileMenu}
        />
      )}

      <div
        className={`
          fixed left-0 top-0 h-screen flex flex-col z-[1000] bg-card border-r transition-all duration-300 ease-in-out
          ${isMobile ? (isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full') : ''}
        `}
        style={{ width: isMobile ? '280px' : sidebarWidth }}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1f497d] text-white rounded-lg flex items-center justify-center flex-shrink-0">
                <GraduationCap size={20} />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-lg font-bold leading-tight text-foreground">
                    kLab PMS
                  </span>
                  <span className="text-xs leading-tight text-muted-foreground">
                    {role ? role : 'Guest'}
                  </span>
                </div>
              )}
            </div>
            {!isMobile && (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg text-muted-foreground hover:bg-muted"
              >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            )}
          </div>
        </div>

        <nav className="flex-1 p-2 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = pathname === item.url;
            return (
              <Link
                key={item.title}
                href={item.url}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 my-1 rounded-lg transition-colors text-sm font-medium
                  ${isActive
                    ? 'bg-[#1f497d] text-white'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.title : undefined}
                onClick={() => isMobile && closeMobileMenu()}
              >
                <IconComponent className="flex-shrink-0" size={18} />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 whitespace-nowrap">{item.title}</span>
                    {item.countKey && counts[item.countKey as keyof typeof counts] > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                        ${isActive ? 'bg-white/20' : 'bg-muted-foreground/20'}`
                      }>
                        {counts[item.countKey as keyof typeof counts]}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle Section */}
        <div className="p-4 border-t">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted ${isCollapsed && !isMobile ? 'justify-center' : ''}`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {(!isCollapsed || isMobile) && <span>{theme === 'dark' ? "Light Mode" : "Dark Mode"}</span>}
          </button>
        </div>
      </div>

      <div className="fixed bottom-8 right-8 z-[1001] flex flex-col gap-4">
        <div className="relative">
          <button 
            className="w-14 h-14 bg-[#1f497d] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute bottom-16 right-0 w-80 bg-card border rounded-lg shadow-2xl z-20">
              <div className="p-4 border-b"><h3 className="font-semibold text-foreground">Notifications</h3></div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className={`p-4 border-b ${n.unread ? 'bg-blue-50' : ''}`}>
                    <p className="text-sm font-medium">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button 
            className="w-14 h-14 bg-[#1f497d] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={20} />
          </button>
          {showSettings && (
            <div className="absolute bottom-16 right-0 w-60 bg-card border rounded-lg shadow-2xl z-20 py-2">
              <Link href="/dashboard/settings" className="block px-4 py-2 text-sm text-foreground hover:bg-muted">Account Settings</Link>
            </div>
          )}
        </div>

        <div className="relative">
          <button 
            className="w-14 h-14 bg-[#1f497d] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
            onClick={() => setShowProfile(!showProfile)}
          >
            <User size={20} />
          </button>
          {showProfile && (
            <div className="absolute bottom-16 right-0 w-60 bg-card border rounded-lg shadow-2xl z-20 py-2">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <Link href="/dashboard/profile" className="block px-4 py-2 text-sm text-foreground hover:bg-muted">
                Profile
              </Link>
              <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}