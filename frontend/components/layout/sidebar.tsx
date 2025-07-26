"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, Archive, Award, BarChart3, Bell, BookOpen, BookText, Calendar,
  CalendarCheck,
  CheckCircle,
  ChevronLeft, ChevronRight, ClipboardCheck, FileText, FolderOpen,
  GraduationCap, Home, Loader2, LogOut, Mail, Menu, MessageSquare, Moon, NotebookPen, Settings, Sun, Ticket,
  TicketCheck,
  TrendingUp, Upload, User, UserCheck, Users, Wrench
} from "lucide-react";

import { useAuth } from "@/lib/contexts/RoleContext";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import { useCounts } from "@/lib/contexts/CountsContext";
import { useTheme } from "next-themes";
import { title } from "process";

import { useNotifications } from "@/lib/contexts/NotificationContext";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";

const menuItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home, roles: ['super_admin', 'program_manager', 'facilitator', 'trainee', 'it_support'] },
   
    // Super Admin
    { title: "User Management", url: "/dashboard/SuperAdmin/user-management", icon: Users, roles: ['super_admin'] },
    { title: "Program Approval", url: "/dashboard/SuperAdmin/program-approval", icon: TicketCheck, roles: ['super_admin'] },
    { title: "Master Log", url: "/dashboard/SuperAdmin/master-log", icon: Activity, roles: ['super_admin'] },
    { title: "Reports & Export", url: "/dashboard/SuperAdmin/reports-export", icon: BarChart3, roles: ['super_admin'] },
    { title: "System Monitoring", url: "/dashboard/SuperAdmin/system-monitoring", icon: Activity, roles: [ 'it_support'] },
    { title: "System Settings", url: "/dashboard/SuperAdmin/settings", icon: Settings, roles: ['super_admin'] },
   
    // Program Manager
    { title: "Programs", url: "/dashboard/Manager/programs", icon: BookOpen, roles: ['program_manager'], countKey: 'programs' },
    { title: "Facilitators", url: "/dashboard/Manager/facilitators", icon: UserCheck, roles: ['program_manager'], countKey: 'facilitators' },
    { title: "Approvals", url: "/dashboard/Manager/approvals", icon: CheckCircle, roles: ['program_manager'], countKey: 'pendingApprovals' },
    { title: "Trainees", url: "/dashboard/Manager/trainees", icon: Users, roles: ['program_manager'], countKey: 'trainees' },
    { title: "Attendance", url: "/dashboard/Manager/attendance", icon: Calendar, roles: ['program_manager'] },
    { title: "Certificates", url: "/dashboard/Manager/certificates", icon: Award, roles: ['program_manager'], countKey: 'certificates' },
    { title: "Archive", url: "/dashboard/Manager/archive", icon: Archive, roles: ['program_manager'], countKey: 'archived' },
    // Facilitator
    { title: "My Programs", url: "/dashboard/Facilitator/fac-programs", icon: BookOpen, roles: ['facilitator'] },
    { title: "Attendance Tracking", url: "/dashboard/Facilitator/Fac-attendance", icon: Calendar, roles: ['facilitator'] },
    { title: "Course Management", url: "/dashboard/Facilitator/courses", icon: BookText, roles: ['facilitator'] },
    { title: "Assignment Management", url: "/dashboard/Facilitator/assignments", icon: NotebookPen, roles: ['facilitator'] },
    { title: "Project Reviews", url: "/dashboard/Facilitator/fac-reviews", icon: ClipboardCheck, roles: ['facilitator'] },
    { title: "Weekly Roadmap", url: "/dashboard/Facilitator/fac-roadmap", icon: Calendar, roles: ['facilitator'] },
    // Trainee
    { title: "My Learning", url: "/dashboard/Trainee/my-learning", icon: GraduationCap, roles: ['trainee'] },
    { title: "Submit Projects", url: "/dashboard/Trainee/submit-projects", icon: FileText, roles: ['trainee'] },
    { title: "Attendance", url: "/dashboard/Trainee/Trattendance", icon: Calendar, roles: ['trainee'] },
    { title: "My Attendance History", url: "/dashboard/Trainee/my-attendance-history", icon: Calendar, roles: ['trainee'] },
    // { title: "My Progress", url: "/dashboard/Trainee/my-progress", icon: TrendingUp, roles: ['trainee'] },
    // { title: "Learning Resources", url: "/dashboard/Trainee/resources", icon: FolderOpen, roles: ['trainee'] },
    { title: "Program Roadmap", url: "/dashboard/Trainee/roadmap", icon: CalendarCheck, roles: ['trainee'] },
    // IT Support
    { title: "Support Tickets", url: "/dashboard/It-support/support-tickets", icon: MessageSquare, roles: ['it_support'] },
    { title: "Maintenance", url: "/dashboard/It-support/maintenance", icon: Wrench, roles: ['it_support'] },

    //Submit Ticket
     { title: "submit-tickets", url: "/dashboard/submit-tickets", icon: MessageSquare, roles: ['super_admin', 'program_manager', 'facilitator', 'trainee']},

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
  const { unreadCount, notifications, isLoading: isLoadingNotifs } = useNotifications();

  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);

  const filteredMenuItems = menuItems.filter(item =>
    role ? item.roles.includes(role) : false
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {isMobile && isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-[999]" onClick={closeMobileMenu} />
      )}

      <div
        className={`fixed left-0 top-0 h-screen flex flex-col z-[1000] bg-card border-r transition-all duration-300 ease-in-out ${isMobile ? (isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full') : ''}`}
        style={{ width: isMobile ? '280px' : (isCollapsed ? '80px' : '280px') }}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1f497d] text-white rounded-lg flex items-center justify-center flex-shrink-0">
                <GraduationCap size={20} />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-lg font-bold leading-tight text-foreground">kLab PMS</span>
                  <span className="text-xs leading-tight text-muted-foreground">{role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </div>
              )}
            </div>
            {!isMobile && (
              <button onClick={toggleSidebar} className="p-2 rounded-lg text-muted-foreground hover:bg-muted">
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 my-1 rounded-lg transition-colors text-sm font-medium ${isActive ? 'bg-[#1f497d] text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'} ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.title : undefined}
                onClick={() => isMobile && closeMobileMenu()}
              >
                <IconComponent className="flex-shrink-0" size={18} />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 whitespace-nowrap">{item.title}</span>
                    {item.countKey && counts[item.countKey as keyof typeof counts] > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? 'bg-white/20' : 'bg-muted-foreground/20'}`}>
                        {counts[item.countKey as keyof typeof counts]}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t mt-auto">
          {/* --- THIS IS THE FIX for the theme toggle --- */}
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground ${isCollapsed && !isMobile ? 'justify-center' : ''}`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {(!isCollapsed || isMobile) && <span>{theme === 'dark' ? "Light Mode" : "Dark Mode"}</span>}
          </button>
          {/* --- END OF FIX --- */}
        </div>
      </div>

      <div className="fixed bottom-8 right-8 z-[1001] flex flex-col gap-4">
        <div className="relative">
            <button 
                className="w-14 h-14 bg-[#1f497d] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                onClick={() => setShowNotificationsPanel(!showNotificationsPanel)}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-card">
                    {unreadCount}
                </span>
                )}
            </button>
            {showNotificationsPanel && (
                <div className="absolute bottom-16 right-0 w-80 bg-card border rounded-lg shadow-2xl z-20 animate-in fade-in-5 slide-in-from-bottom-2 duration-300">
                    <div className="p-4 border-b"><h3 className="font-semibold">Notifications</h3></div>
                    <div className="max-h-80 overflow-y-auto">
                        {isLoadingNotifs ? <div className="p-4 flex justify-center"><Loader2 className="animate-spin"/></div> 
                        : notifications.length === 0 ? <p className="p-4 text-sm text-center text-muted-foreground">You're all caught up!</p>
                        : notifications.slice(0, 5).map(n => (
                            <div key={n._id} className={`p-3 border-b hover:bg-muted/50 ${!n.isRead ? 'bg-blue-500/10' : ''}`}>
                                <p className="text-sm font-semibold">{n.title}</p>
                                <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                            </div>
                        ))}
                    </div>
                    <div className="p-2 border-t">
                        <Link href="/dashboard/notifications" onClick={() => setShowNotificationsPanel(false)}>
                            <Button variant="ghost" className="w-full">View All Notifications</Button>
                        </Link>
                    </div>
                </div>
            )}
        </div>

        <div className="relative">
            {/* --- THIS IS THE FIX for the profile button icon --- */}
            <button 
                className="w-14 h-14 bg-card border-2 text-primary shadow-lg rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                onClick={() => setShowProfilePanel(!showProfilePanel)}
            >
                <User size={24} />
            </button>
            {/* --- END OF FIX --- */}
            {showProfilePanel && (
                <div className="absolute bottom-16 right-0 w-60 bg-card border rounded-lg shadow-2xl z-20 py-2 animate-in fade-in-5 slide-in-from-bottom-2 duration-300">
                    <div className="px-4 py-3 border-b">
                        <p className="text-sm font-semibold truncate">{user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <Link href="/dashboard/profile" onClick={() => setShowProfilePanel(false)}><Button variant="ghost" className="w-full justify-start"><User className="mr-2 h-4 w-4"/>Profile</Button></Link>
                    <Link href="/dashboard/settings" onClick={() => setShowProfilePanel(false)}><Button variant="ghost" className="w-full justify-start"><Settings className="mr-2 h-4 w-4"/>Settings</Button></Link>
                    <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600" onClick={logout}><LogOut className="mr-2 h-4 w-4"/>Logout</Button>
                </div>
            )}
        </div>
      </div>
    </>
  );
}