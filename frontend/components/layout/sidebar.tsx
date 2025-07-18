"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, Users, BookOpen, Upload, Calendar, MapPin, ClipboardCheck, BarChart3,
  UserCheck, FileText, Wrench, GraduationCap, FolderOpen, MessageSquare, Activity,
  Award, Archive, Rocket, Sun, Moon, Ticket, Bell, Settings, User, LogOut,
  ChevronLeft, ChevronRight, Search, Menu, HelpCircle
} from "lucide-react";

// Context and Hook Imports
import { useAuth } from "@/lib/contexts/RoleContext";
import { useSidebar } from "@/components/ui/sidebar"; 

// UI Component Imports
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Type and Helper Imports
import { UserRole } from "@/types/user";
import { getRoleDisplayName } from "@/lib/roles";

// --- Interfaces ---
interface MenuItem { title: string; url: string; icon: React.ComponentType<any>; roles: UserRole[]; count?: number; }
interface Notification { id: number; type: string; message: string; time: string; unread: boolean; }

// --- Menu Items Array (Cleaned up) ---
const menuItems: MenuItem[] = [
    { title: "Dashboard", url: "/dashboard", icon: Home, roles: ['SuperAdmin', 'Program Manager', 'Facilitator', 'Trainee', 'it_support'] },
    { title: "User Management", url: "/dashboard/user-management", icon: Users, roles: ['SuperAdmin'] },
    { title: "Master Log", url: "/dashboard/master-log", icon: Activity, roles: ['SuperAdmin'] },
    { title: "Reports & Export", url: "/dashboard/reports-export", icon: BarChart3, roles: ['SuperAdmin'] },
    { title: "Programs", url: "/dashboard/programs", icon: BookOpen, roles: ['Program Manager'], count: 12 },
    { title: "Facilitators", url: "/dashboard/facilitators", icon: UserCheck, roles: ['Program Manager'], count: 45 },
    { title: "Trainees", url: "/dashboard/trainees", icon: Users, roles: ['Program Manager'], count: 234 },
    { title: "Attendance", url: "/dashboard/attendance", icon: Calendar, roles: ['Program Manager'] },
    { title: "Certificates", url: "/dashboard/certificates", icon: Award, roles: ['Program Manager'], count: 89 },
    { title: "Archive", url: "/dashboard/archive", icon: Archive, roles: ['Program Manager'] },
    { title: "My Programs", url: "/facilitator/programs", icon: BookOpen, roles: ['Facilitator'] },
    { title: "Attendance Tracking", url: "/facilitator/attendance", icon: MapPin, roles: ['Facilitator'] },
    { title: "Curriculum Upload", url: "/facilitator/curriculum", icon: Upload, roles: ['Facilitator'] },
    { title: "Project Reviews", url: "/facilitator/reviews", icon: ClipboardCheck, roles: ['Facilitator'] },
    { title: "Weekly Roadmap", url: "/facilitator/roadmap", icon: Calendar, roles: ['Facilitator'] },
    { title: "My Learning", url: "/dashboard/my-learning", icon: GraduationCap, roles: ['Trainee'] },
    { title: "Submit Projects", url: "/dashboard/submit-projects", icon: FileText, roles: ['Trainee'] },
    { title: "Attendance", url: "/dashboard/attendance", icon: MapPin, roles: ['Trainee'] },
    { title: "My Progress", url: "/dashboard/my-progress", icon: Activity, roles: ['Trainee'] },
    { title: "Learning Resources", url: "/dashboard/resources", icon: FolderOpen, roles: ['Trainee'] },
    { title: "Support Tickets", url: "/dashboard/support-tickets", icon: MessageSquare, roles: ['it_support'] },
    { title: "System Monitoring", url: "/dashboard/system-monitoring", icon: Activity, roles: ['it_support'] },
    { title: "Maintenance", url: "/dashboard/maintenance", icon: Wrench, roles: ['it_support'] },
    { title: "Issue Ticket", url: "/dashboard/issue-ticket", icon: Ticket, roles: ['SuperAdmin', 'Program Manager', 'Facilitator', 'Trainee', 'it_support']},
    // NOTE: "My Profile" and "Settings" have been removed from this primary list
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();
  const { state, isMobile, isMobileMenuOpen, toggleSidebar, toggleMobileMenu, closeMobileMenu } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const notifications: Notification[] = [
    { id: 1, type: "application", message: "New trainee application", time: "2 mins ago", unread: true },
  ];
  const unreadCount = notifications.filter((n) => n.unread).length;

  const filteredMenuItems = menuItems.filter(item => 
    role && item.roles.includes(role as UserRole)
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.floating-dropdown') && !target.closest('.floating-btn')) {
        setShowNotifications(false);
        setShowProfile(false);
        setShowSettings(false); // Also close settings dropdown
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const roleName = role ? getRoleDisplayName(role) : 'Guest';
  const sidebarWidth = isCollapsed ? '80px' : '280px';

  return (
    <>
      {isMobile && (
        <button
          className="fixed top-4 left-4 z-[1002] p-2 bg-background rounded-lg shadow-md border"
          onClick={toggleMobileMenu}
        >
          <Menu size={20} />
        </button>
      )}

      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[999] md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      <div 
        className={`fixed left-0 top-0 h-screen flex flex-col z-[1000] bg-background border-r transition-transform duration-300 ease-in-out md:transition-all ${
          isMobile ? (isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full') : ''
        }`}
        style={{ width: isMobile ? '280px' : sidebarWidth }}
      >
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1f4d7d] text-white rounded-[10px] flex items-center justify-center flex-shrink-0">
                <Rocket size={20} />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className={`text-lg font-bold leading-tight ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>KLab</span>
                  <span className={`text-xs leading-tight ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{roleName}</span>
                </div>
              )}
            </div>
            {!isMobile && (
              <button onClick={toggleSidebar} className="p-2 rounded-lg text-muted-foreground hover:bg-accent">
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            )}
          </div>
        </div>

        {(!isCollapsed || isMobile) && (
          <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-10"
              />
            </div>
          </div>
        )}

        <nav className="flex-1 p-4 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = pathname === item.url;
            return (
              <Link
                key={item.title}
                href={item.url}
                onClick={isMobile ? closeMobileMenu : undefined}
                className={`w-full flex items-center gap-3 px-4 py-3 mb-1 rounded-lg transition-all duration-200 text-sm font-medium no-underline ${
                  isActive ? 'bg-[#1f4d7d] text-white shadow-lg' : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'}`
                } ${isCollapsed && !isMobile ? 'justify-center' : ''}`}
                title={isCollapsed && !isMobile ? item.title : undefined}
              >
                <IconComponent className="flex-shrink-0" size={20} />
                {(!isCollapsed || isMobile) && (
                  <span className="flex-1 whitespace-nowrap overflow-hidden font-medium">{item.title}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <button onClick={handleToggleTheme} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-accent ${isCollapsed && !isMobile ? 'justify-center' : ''}`}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            {(!isCollapsed || isMobile) && <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>}
          </button>
        </div>
      </div>

      {/* --- RESTORED: Your original floating action bubbles structure --- */}
      <div className="fixed bottom-8 right-8 z-[1001] flex flex-col gap-4">
        <div className="relative">
          <button className="floating-btn group w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center" style={{ backgroundColor: '#1f4d7d' }} onClick={() => setShowNotifications(!showNotifications)}>
            <Bell size={20} />
            {unreadCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{unreadCount}</span>}
          </button>
          {showNotifications && ( <div className={`floating-dropdown absolute bottom-16 right-0 border rounded-2xl shadow-2xl z-[1000] w-[350px] bg-background`}> {/* Your notification dropdown JSX */} </div> )}
        </div>
        
        <div className="relative">
          <button className="floating-btn group w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center" style={{ backgroundColor: '#1f4d7d' }} onClick={() => setShowSettings(!showSettings)}>
            <Settings size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
          {showSettings && ( 
            <div className={`floating-dropdown absolute bottom-16 right-0 border rounded-2xl shadow-2xl z-[1000] min-w-[280px] bg-background overflow-hidden`}>
              <div className={`px-6 py-5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <h3 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  <Settings size={18} /> Settings
                </h3>
              </div>
              <div className="py-2">
                <Link href="/dashboard/settings" className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent" onClick={() => setShowSettings(false)}>
                  <Settings size={16} /><span>Account Settings</span>
                </Link>
                <Link href="/dashboard/help" className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent" onClick={() => setShowSettings(false)}>
                  <HelpCircle size={16} /><span>Help & Support</span>
                </Link>
              </div>
            </div> 
          )}
        </div>

        <div className="relative">
          <button className="floating-btn group w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center" style={{ backgroundColor: '#1f4d7d' }} onClick={() => setShowProfile(!showProfile)}>
            <User size={20} />
          </button>
          {showProfile && ( 
            <div className={`floating-dropdown absolute bottom-16 right-0 border rounded-2xl shadow-2xl z-[1000] w-[320px] bg-background overflow-hidden`}>
              <div className="p-4 bg-muted/50">
                  <h4 className="font-semibold">{user?.name}</h4>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <div className="py-2">
                  <Link href="/dashboard/profile" className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent" onClick={() => setShowProfile(false)}>
                      <User size={16} /><span>My Profile</span>
                  </Link>
                  <Separator className="my-1" />
                  <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10">
                      <LogOut size={16} /><span>Logout</span>
                  </button>
              </div>
            </div> 
          )}
        </div>
      </div>
    </>
  );
}