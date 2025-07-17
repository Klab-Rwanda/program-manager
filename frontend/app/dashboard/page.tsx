"use client"

import { useRole } from "@/lib/contexts/RoleContext"
import { Loader2 } from "lucide-react"

// Correctly import all the role-specific dashboards
import { SuperAdminDashboard } from "@/components/role-based/admin/SuperAdminDashboard"
import { ProgramManagerDashboard } from "@/components/role-based/manager/ProgramManagerDashboard" // Correct import
import { FacilitatorDashboard } from "@/components/role-based/facilitator/FacilitatorDashboard"
import { TraineeDashboard } from "@/components/role-based/trainee/TraineeDashboard"
import { ITSupportDashboard } from "@/components/role-based/support/ITSupportDashboard"

export default function Dashboard() {
  const { role, isAuthenticated } = useRole()

  // Display a loader while the role is being determined
  if (!isAuthenticated || !role) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Render the correct dashboard based on the user's role
  const renderDashboardByRole = () => {
    switch (role) {
      case 'super_admin':
        return <SuperAdminDashboard />
      case 'program_manager':
        return <ProgramManagerDashboard /> // Use the new component
      case 'facilitator':
        return <FacilitatorDashboard />
      case 'trainee':
        return <TraineeDashboard />
      case 'it_support':
        return <ITSupportDashboard />
      default:
        // This case handles any unexpected roles
        return <div>Your dashboard is not available. Please contact support.</div>
    }
  }

  return renderDashboardByRole()
}