"use client"

import { useRole } from "@/lib/contexts/RoleContext"

// Role-specific dashboard components
import { SuperAdminDashboard } from "@/components/role-based/admin/SuperAdminDashboard"
import { ProgramManagerDashboard } from "@/components/role-based/manager/ProgramManagerDashboard"
import { FacilitatorDashboard } from "@/components/role-based/facilitator/FacilitatorDashboard"
import { TraineeDashboard } from "@/components/role-based/trainee/TraineeDashboard"
import { ITSupportDashboard } from "@/components/role-based/support/ITSupportDashboard"

export default function Dashboard() {
  const { role } = useRole()

  const renderDashboardByRole = () => {
    switch (role) {
      case 'super_admin':
        return <SuperAdminDashboard />
      case 'program_manager':
        return <ProgramManagerDashboard />
      case 'facilitator':
        return <FacilitatorDashboard />
      case 'trainee':
        return <TraineeDashboard />
      case 'it_support':
        return <ITSupportDashboard />
      default:
        return <div>Unknown role</div>
    }
  }

  return renderDashboardByRole()
} 