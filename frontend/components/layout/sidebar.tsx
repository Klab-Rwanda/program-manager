"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Home, Users, BookOpen, Upload, Calendar, MapPin, ClipboardCheck,
  Bell, Settings, BarChart3, FileText, Wrench, GraduationCap, FolderOpen,
  MessageSquare, Activity, Award, Archive, LogOut, ChevronDown, QrCode
} from "lucide-react"

import { useRole } from "@/lib/contexts/RoleContext"
import { UserRole } from "@/types/user"
import { getRoleDisplayName } from "@/lib/roles"

import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "../ui/button"

interface MenuItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
}

const menuItems: MenuItem[] = [
  { title: "Dashboard", url: "/dashboard/user-management", icon: Home, roles: ['super_admin', 'program_manager', 'facilitator', 'trainee', 'it_support'] },
  { title: "User Management", url: "/dashboard/user-management", icon: Users, roles: ['super_admin'] },
  { title: "Master Log", url: "/dashboard/master-log", icon: Activity, roles: ['super_admin'] },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3, roles: ['super_admin'] },
  { title: "Programs", url: "/dashboard/programs", icon: BookOpen, roles: ['program_manager'] },
  { title: "Attendance", url: "/dashboard/attendance", icon: Calendar, roles: ['program_manager'] },
  { title: "Certificates", url: "/dashboard/certificates", icon: Award, roles: ['program_manager'] },
  { title: "Archive", url: "/dashboard/archive", icon: Archive, roles: ['program_manager'] },
  { title: "My Courses", url: "/dashboard/facilitator/courses", icon: BookOpen, roles: ['facilitator'] },
  { title: "Attendance Tracking", url: "/dashboard/facilitator/attendance", icon: MapPin, roles: ['facilitator'] },
  { title: "Curriculum Upload", url: "/dashboard/facilitator/curriculum", icon: Upload, roles: ['facilitator'] },
  { title: "Project Reviews", url: "/dashboard/facilitator/reviews", icon: ClipboardCheck, roles: ['facilitator'] },
  { title: "Weekly Roadmap", url: "/dashboard/facilitator/roadmap", icon: Calendar, roles: ['facilitator'] },
  { title: "My Learning", url: "/dashboard/my-learning", icon: GraduationCap, roles: ['trainee'] },
  { title: "Scan Attendance", url: "/dashboard/attendance/scan", icon: QrCode, roles: ['trainee'] },
  { title: "Submit Projects", url: "/dashboard/submit-projects", icon: FileText, roles: ['trainee'] },
  { title: "My Progress", url: "/dashboard/my-progress", icon: Activity, roles: ['trainee'] },
  { title: "Learning Resources", url: "/dashboard/resources", icon: FolderOpen, roles: ['trainee'] },
  { title: "Support Tickets", url: "/dashboard/support-tickets", icon: MessageSquare, roles: ['it_support'] },
  { title: "System Monitoring", url: "/dashboard/system-monitoring", icon: Activity, roles: ['it_support'] },
  { title: "Maintenance", url: "/dashboard/maintenance", icon: Wrench, roles: ['it_support'] },
  { title: "Notifications", url: "/dashboard/notifications", icon: Bell, roles: ['super_admin', 'program_manager', 'facilitator', 'trainee', 'it_support'] },
  { title: "Settings", url: "/dashboard/settings", icon: Settings, roles: ['super_admin', 'program_manager', 'facilitator', 'trainee', 'it_support'] },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, logout } = useRole();

  const filteredMenuItems = menuItems.filter(item => 
    role ? item.roles.includes(role) : false
  );

  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <Sidebar variant="inset" className="flex flex-col h-full bg-card" {...props}>
      <SidebarHeader className="border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold text-foreground">kLab</span>
              <span className="truncate text-xs text-muted-foreground">
                {role ? getRoleDisplayName(role) : 'Dashboard'}
              </span>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === item.url ||
                      (item.url !== '/dashboard/user-management' && pathname.startsWith(item.url))
                    }
                    className="w-full justify-start gap-3 px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
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

      <SidebarFooter className="border-t">
        <div className="flex items-center justify-between p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2">
                <div className="flex items-center gap-3 w-full">
                  <Avatar className="h-8 w-8 border">
                    {/* ✅ Updated fallback to placeholder.svg */}
                    <AvatarImage
                      src={user?.avatar || "/placeholder.svg"}
                      alt={user?.name || "User"}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                      {user ? getUserInitials(user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-foreground">
                      {user?.name || "User"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {role ? getRoleDisplayName(role) : "Guest"}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2 ml-2">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
