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
    // FIX: The roles from your backend are "SuperAdmin", "Program Manager", etc.
    // The context normalizes them, but it's safer to compare with the exact strings.
    // Let's adjust the context to normalize to lowercase_with_underscores for easier switching.
    switch (role) {
      case 'SuperAdmin':
        return <SuperAdminDashboard />
      case 'Program Manager':
        return <ProgramManagerDashboard />
      case 'Facilitator':
        return <FacilitatorDashboard />
      case 'Trainee':
        return <TraineeDashboard />
      case 'it_support': // Assuming you have a role 'IT Support' in backend
        return <ITSupportDashboard />
      default:
        // This will show if the user is authenticated but has no role, or an unknown role
        return <div>Welcome! Your dashboard is being set up.</div>
    }
  }

  return renderDashboardByRole()
}