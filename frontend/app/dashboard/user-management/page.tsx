"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Plus, Archive, UserCheck, Loader2, Edit, Trash2 } from "lucide-react"
import { useRole } from "@/lib/contexts/RoleContext"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  dateAdded: string
}

const initialFormData = { name: "", email: "", role: "Trainee" }

export default function UserManagementPage() {
  const { user } = useRole()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // State to track which view is active: 'active' or 'archived'
  const [view, setView] = useState<'active' | 'archived'>('active')

  // State for the create/edit user modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mock data for demonstration
  const mockUsers: User[] = [
    {
      id: "1",
      name: "John Doe",
      email: "john@klab.rw",
      role: "Trainee",
      status: "Active",
      dateAdded: "2024-01-15"
    },
    {
      id: "2", 
      name: "Jane Smith",
      email: "jane@klab.rw",
      role: "Facilitator",
      status: "Active",
      dateAdded: "2024-01-10"
    },
    {
      id: "3",
      name: "Bob Johnson",
      email: "bob@klab.rw", 
      role: "Program Manager",
      status: "Inactive",
      dateAdded: "2024-01-05"
    }
  ]

  // A flexible fetch function that gets data based on the current view
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Filter mock data based on view
      const filteredUsers = mockUsers.filter(user => 
        view === 'active' ? user.status === 'Active' : user.status === 'Inactive'
      )
      
      setUsers(filteredUsers)
    } catch (err) {
      setError(`Failed to fetch ${view} users.`)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [view])

  // useEffect to fetch data when the component mounts or the view changes
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // A single function to handle both deactivating and reactivating a user
  const handleUserStatusChange = async (userId: string, newStatus: boolean) => {
    const actionText = newStatus ? "reactivate" : "deactivate"
    if (window.confirm(`Are you sure you want to ${actionText} this user?`)) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Update local state
        setUsers(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, status: newStatus ? 'Active' : 'Inactive' }
            : user
        ))
        
        alert(`User ${actionText}d successfully.`)
      } catch (err) {
        alert(`Error: Failed to ${actionText} user.`)
      }
    }
  }

  // --- Modal and Form Handlers ---
  const handleOpenModal = (user: User | null = null) => {
    setEditingUser(user)
    if (user) {
      setFormData({ name: user.name, email: user.email, role: user.role })
    } else {
      setFormData(initialFormData)
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingUser(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (editingUser) {
        // Update existing user
        setUsers(prev => prev.map(user => 
          user.id === editingUser.id 
            ? { ...user, name: formData.name, email: formData.email, role: formData.role }
            : user
        ))
        alert('User updated successfully!')
      } else {
        // Create new user
        const newUser: User = {
          id: Date.now().toString(),
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: 'Active',
          dateAdded: new Date().toISOString().split('T')[0]
        }
        setUsers(prev => [...prev, newUser])
        alert('User created successfully! Credentials sent via email.')
      }
      
      handleCloseModal()
      // If we just created a user, switch to the active view to see them
      if (view !== 'active') setView('active')
      else fetchUsers()
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    return status === 'Active' ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    const roleColors = {
      'Super Admin': 'bg-red-100 text-red-800',
      'Program Manager': 'bg-blue-100 text-blue-800', 
      'Facilitator': 'bg-purple-100 text-purple-800',
      'Trainee': 'bg-gray-100 text-gray-800'
    }
    
    return (
      <Badge className={roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}>
        {role}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            A list of all {view} users in the system.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('active')}
          >
            <UserCheck className="mr-2 h-4 w-4" />
            Active Users
          </Button>
          <Button
            variant={view === 'archived' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('archived')}
          >
            <Archive className="mr-2 h-4 w-4" />
            Archived Users
          </Button>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenModal()}>
                <Plus className="mr-2 h-4 w-4" />
                Add New User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
                <DialogDescription>
                  {editingUser ? 'Update user information below.' : 'Add a new user to the system.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Trainee">Trainee</SelectItem>
                      <SelectItem value="Facilitator">Facilitator</SelectItem>
                      <SelectItem value="Program Manager">Program Manager</SelectItem>
                      <SelectItem value="Super Admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingUser ? 'Saving...' : 'Creating...'}
                      </>
                    ) : (
                      editingUser ? 'Save Changes' : 'Create User'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage all users in the system. You can view, edit, and change user status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!loading && !error && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No {view} users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>{user.dateAdded}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenModal(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUserStatusChange(user.id, user.status !== 'Active')}
                            >
                              {user.status === 'Active' ? (
                                <Archive className="h-4 w-4" />
                              ) : (
                                <UserCheck className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 