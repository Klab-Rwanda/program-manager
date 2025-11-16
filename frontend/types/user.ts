export type UserRole = 'super_admin' | 'program_manager' | 'facilitator' | 'trainee' | 'it_support' | 'evaluator'

export type Permission =
  | 'manage_users'
  | 'manage_programs'
  | 'view_reports'
  | 'manage_attendance'
  | 'upload_curriculum'
  | 'review_projects'
  | 'submit_projects'
  | 'view_own_programs'
  | 'manage_system'
  | 'provide_support'
  | 'export_reports'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  // New trainee-specific fields
  firstName?: string
  lastName?: string
  phone?: string
  gender?: 'Male' | 'Female'
  nationality?: string
}

export interface UserProfile {
  id: string
  userId: string
  phone?: string
  department?: string
  position?: string
  bio?: string
  skills?: string[]
  experience?: number
}

export interface RolePermissions {
  role: UserRole
  permissions: Permission[]
  description: string
}

export interface AuthContextType {
  user: User | null
  role: UserRole | null
  permissions: Permission[]
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasPermission: (permission: Permission) => boolean
  hasRole: (role: UserRole) => boolean
} 