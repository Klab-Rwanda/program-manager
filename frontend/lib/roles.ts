import { UserRole, Permission, RolePermissions } from '@/types/user'

export const ROLES: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  program_manager: 'Program Manager',
  facilitator: 'Facilitator',
  trainee: 'Trainee',
  it_support: 'IT-Support'
}

export const PERMISSIONS: Record<Permission, string> = {
  manage_users: 'Manage Users',
  manage_programs: 'Manage Programs',
  view_reports: 'View Reports',
  manage_attendance: 'Manage Attendance',
  upload_curriculum: 'Upload Curriculum',
  review_projects: 'Review Projects',
  submit_projects: 'Submit Projects',
  view_own_programs: 'View Own Programs',
  manage_system: 'Manage System',
  provide_support: 'Provide Support'
}

export const ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'super_admin',
    permissions: [
      'manage_users',
      'manage_programs',
      'view_reports',
      'manage_attendance',
      'upload_curriculum',
      'review_projects',
      'manage_system',
      'provide_support'
    ],
    description: 'Full system access with all permissions'
  },
  {
    role: 'program_manager',
    permissions: [
      'manage_programs',
      'view_reports',
      'manage_attendance',
      'upload_curriculum',
      'review_projects'
    ],
    description: 'Program management and oversight'
  },
  {
    role: 'facilitator',
    permissions: [
      'view_own_programs',
      'manage_attendance',
      'upload_curriculum',
      'review_projects'
    ],
    description: 'Class management and teaching'
  },
  {
    role: 'trainee',
    permissions: [
      'view_own_programs',
      'submit_projects'
    ],
    description: 'Learning and participation'
  },
  {
    role: 'it_support',
    permissions: [
      'view_reports',
      'provide_support',
      'manage_system'
    ],
    description: 'Technical support and system maintenance'
  }
]

export function getPermissionsByRole(role: UserRole): Permission[] {
  const roleConfig = ROLE_PERMISSIONS.find(r => r.role === role)
  return roleConfig?.permissions || []
}

export function hasPermission(userPermissions: Permission[], requiredPermission: Permission): boolean {
  return userPermissions.includes(requiredPermission)
}

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return userRole === requiredRole
}

export function getRoleDisplayName(role: UserRole): string {
  return ROLES[role] || role
}

export function getPermissionDisplayName(permission: Permission): string {
  return PERMISSIONS[permission] || permission
} 