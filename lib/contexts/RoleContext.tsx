"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { UserRole, Permission, User, AuthContextType } from '@/types/user'
import { getPermissionsByRole } from '@/lib/roles'

interface RoleContextType extends AuthContextType {
  setUserRole: (role: UserRole) => void
  setUser: (user: User | null) => void
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setUserRole] = useState<UserRole | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Update permissions when role changes
  useEffect(() => {
    if (role) {
      const rolePermissions = getPermissionsByRole(role)
      setPermissions(rolePermissions)
    } else {
      setPermissions([])
    }
  }, [role])

  // Check if user has specific permission
  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission)
  }

  // Check if user has specific role
  const hasRole = (requiredRole: UserRole): boolean => {
    return role === requiredRole
  }

  // Mock login function (replace with actual authentication)
  const login = async (email: string, password: string): Promise<void> => {
    // Mock user data - replace with actual API call
    const mockUsers: Record<string, { user: User; password: string }> = {
      'admin@klab.rw': {
        user: {
          id: '1',
          email: 'admin@klab.rw',
          name: 'Super Admin',
          role: 'super_admin',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        password: 'admin123'
      },
      'manager@klab.rw': {
        user: {
          id: '2',
          email: 'manager@klab.rw',
          name: 'Program Manager',
          role: 'program_manager',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        password: 'manager123'
      },
      'facilitator@klab.rw': {
        user: {
          id: '3',
          email: 'facilitator@klab.rw',
          name: 'John Doe',
          role: 'facilitator',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        password: 'facilitator123'
      },
      'trainee@klab.rw': {
        user: {
          id: '4',
          email: 'trainee@klab.rw',
          name: 'Alice Johnson',
          role: 'trainee',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        password: 'trainee123'
      },
      'support@klab.rw': {
        user: {
          id: '5',
          email: 'support@klab.rw',
          name: 'IT Support',
          role: 'it_support',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        password: 'support123'
      }
    }

    const userData = mockUsers[email]
    
    if (userData && userData.password === password) {
      setUser(userData.user)
      setUserRole(userData.user.role)
      setIsAuthenticated(true)
      
      // Store in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(userData.user))
      localStorage.setItem('isAuthenticated', 'true')
    } else {
      throw new Error('Invalid credentials')
    }
  }

  // Logout function
  const logout = (): void => {
    setUser(null)
    setUserRole(null)
    setPermissions([])
    setIsAuthenticated(false)
    
    // Clear localStorage
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')
  }

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const storedAuth = localStorage.getItem('isAuthenticated')
    
    if (storedUser && storedAuth === 'true') {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
        setUserRole(userData.role)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        logout()
      }
    }
  }, [])

  const value: RoleContextType = {
    user,
    role,
    permissions,
    isAuthenticated,
    login,
    logout,
    hasPermission,
    hasRole,
    setUserRole,
    setUser
  }

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
} 