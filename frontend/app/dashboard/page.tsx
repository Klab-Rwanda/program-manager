"use client"

// Import the hook with its correct name
import { useAuth } from "@/lib/contexts/RoleContext" 

// Role-specific dashboard components
import { SuperAdminDashboard } from "@/components/role-based/admin/SuperAdminDashboard"
import { ProgramManagerDashboard } from "@/components/role-based/manager/ProgramManagerDashboard"
import { FacilitatorDashboard } from "@/components/role-based/facilitator/FacilitatorDashboard"
import { TraineeDashboard } from "@/components/role-based/trainee/TraineeDashboard"
import { ITSupportDashboard } from "@/components/role-based/support/ITSupportDashboard"
import { Loader2 } from "lucide-react"

export default function Dashboard() {
  // Call the hook with its correct name
  const { role, loading } = useAuth()

  // Display a loader while auth status is being determined
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const renderDashboardByRole = () => {
    // The roles are normalized to snake_case in the context
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
        // This will show if the user is authenticated but has no role, or an unknown role
        return <div>Welcome! Your dashboard is being set up.</div>
    }
  }

  return renderDashboardByRole()
}