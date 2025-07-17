"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { UserRole, Permission, User, AuthContextType } from '@/types/user'
import { getPermissionsByRole } from '@/lib/roles'
import api from '@/lib/api' // Import the API client

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

  useEffect(() => {
    if (role) {
      const rolePermissions = getPermissionsByRole(role)
      setPermissions(rolePermissions)
    } else {
      setPermissions([])
    }
  }, [role])

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission)
  }

  const hasRole = (requiredRole: UserRole): boolean => {
    return role === requiredRole
  }

  // UPDATED LOGIN FUNCTION
  const login = async (email: string, password: string): Promise<void> => {
    const response = await api.post('/auth/login', { email, password });
    
    if (response.data && response.data.success) {
      const { user: loggedInUser, accessToken } = response.data.data;
      
      setUser(loggedInUser);
      // Backend roles have spaces, frontend uses snake_case. Let's normalize.
      const normalizedRole = loggedInUser.role.toLowerCase().replace(/ /g, '_') as UserRole;
      setUserRole(normalizedRole);
      setIsAuthenticated(true);
      
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      localStorage.setItem('accessToken', accessToken); // Store the token
      localStorage.setItem('isAuthenticated', 'true');
    } else {
      throw new Error(response.data.message || 'Login failed');
    }
  }

  // UPDATED LOGOUT FUNCTION
  const logout = (): void => {
    setUser(null)
    setUserRole(null)
    setPermissions([])
    setIsAuthenticated(false)
    
    localStorage.removeItem('user')
    localStorage.removeItem('accessToken'); // Remove the token
    localStorage.removeItem('isAuthenticated')
  }

  // UPDATED SESSION CHECK
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('accessToken')
    const storedAuth = localStorage.getItem('isAuthenticated')
    
    if (storedUser && storedToken && storedAuth === 'true') {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
        const normalizedRole = userData.role.toLowerCase().replace(/ /g, '_') as UserRole;
        setUserRole(normalizedRole)
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