"use client"

import React from "react"
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
  Bell, 
  Settings, 
  BarChart3,
  UserCheck,
  FileText,
  Shield,
  Wrench,
  GraduationCap,
  FolderOpen,
  MessageSquare,
  Activity,
  Award,
  Archive
} from "lucide-react"

import { useRole } from "@/lib/contexts/RoleContext"
import { UserRole } from "@/types/user"
import { getRoleDisplayName } from "@/lib/roles"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"

interface MenuItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
}

const menuItems: MenuItem[] = [
  // Dashboard - All roles
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    roles: ['super_admin', 'program_manager', 'facilitator', 'trainee', 'it_support']
  },
  
  // Super Admin specific
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
  
  // Program Manager specific - Uses main dashboard structure
  {
    title: "Programs",
    url: "/dashboard/programs",
    icon: BookOpen,
    roles: ['program_manager']
  },
  {
    title: "Facilitators",
    url: "/dashboard/facilitators",
    icon: UserCheck,
    roles: ['program_manager']
  },
  {
    title: "Trainees",
    url: "/dashboard/trainees",
    icon: Users,
    roles: ['program_manager']
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
    roles: ['program_manager']
  },
  {
    title: "Archive",
    url: "/dashboard/archive",
    icon: Archive,
    roles: ['program_manager']
  },
  
  // Facilitator specific - Uses separate Facilitator dashboard structure
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
  
  // Trainee specific
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
  
  // IT Support specific
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
  
  // Shared items
  {
    title: "Notifications",
    url: "/dashboard/notifications",
    icon: Bell,
    roles: ['super_admin', 'program_manager', 'facilitator', 'trainee', 'it_support']
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
    roles: ['super_admin', 'program_manager', 'facilitator', 'trainee', 'it_support']
  }
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { user, role, logout } = useRole()

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(role as UserRole)
  )

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Sidebar variant="inset" className="flex flex-col h-full" {...props}>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-website-primary text-white shadow-sm">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold text-sidebar-foreground">kLab</span>
              <span className="truncate text-xs text-sidebar-foreground/70">
                {role ? getRoleDisplayName(role) : 'Program Manager'}
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <ThemeToggle />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-medium text-sidebar-foreground/70">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="w-full justify-start gap-3 px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="w-full justify-start p-2">
              <div className="flex items-center gap-3 w-full">
                <Avatar className="h-8 w-8 border border-sidebar-border">
                  <AvatarImage src="/placeholder.svg" alt={user?.name || "User"} />
                  <AvatarFallback className="bg-website-primary text-white text-xs font-medium">
                    {user ? getUserInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-sidebar-foreground">
                    {user?.name || "User"}
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    {role ? getRoleDisplayName(role) : "Guest"}
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              size="sm" 
              className="w-full justify-start px-3 py-2 text-sm"
              onClick={logout}
            >
              <span className="truncate">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
} 