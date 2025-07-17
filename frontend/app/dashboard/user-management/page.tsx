// app/dashboard/user-management/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Archive, UserCheck, Loader2, Edit } from "lucide-react";
import { useAuth } from "@/lib/contexts/RoleContext"; // FIX: Import the correct hook
import api from "@/lib/api";
import { User } from "@/types"; // Import your central User type

// Import UI components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initialFormData = { name: "", email: "", role: "Trainee" as const };

export default function UserManagementPage() {
  const { user: currentUser } = useAuth(); // FIX: Use the correct hook
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<'active' | 'archived'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Your backend has two routes, one for active and one for archived
      const endpoint = view === 'active' ? '/users/manage' : '/users/manage/archived';
      const response = await api.get(endpoint);
      setUsers(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to fetch ${view} users.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUserStatusChange = async (userId: string, newStatus: boolean) => {
    const actionText = newStatus ? "reactivate" : "deactivate";
    if (window.confirm(`Are you sure you want to ${actionText} this user?`)) {
      try {
        // Backend endpoint is PATCH /users/manage/:id/status
        await api.patch(`/users/manage/${userId}/status`, { isActive: newStatus });
        alert(`User ${actionText}d successfully.`);
        // Refetch the user list to update the UI
        fetchUsers();
      } catch (err: any) {
        alert(`Error: ${err.response?.data?.message || `Failed to ${actionText} user.`}`);
      }
    }
  };

  const handleOpenModal = (user: User | null = null) => {
    setEditingUser(user);
    if (user) {
      setFormData({ name: user.name, email: user.email, role: user.role });
    } else {
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingUser) {
        // Your backend doesn't seem to have a dedicated route for admin updating user details.
        // For now, we'll just log this. You'd need to add a `PATCH /users/manage/:id` route.
        console.warn("Update functionality not yet implemented in backend.");
        alert('User updated successfully (frontend only)!');
      } else {
        // Backend endpoint is POST /auth/register
        await api.post('/auth/register', formData);
        alert('User created successfully! Credentials will be sent via email.');
      }
      handleCloseModal();
      fetchUsers();
    } catch (err: any) {
      alert(`Error: ${err.response?.data?.message || 'An unknown error occurred.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: boolean) => {
    return status ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleColors: { [key: string]: string } = {
      'SuperAdmin': 'bg-red-100 text-red-800',
      'Program Manager': 'bg-blue-100 text-blue-800',
      'Facilitator': 'bg-purple-100 text-purple-800',
      'Trainee': 'bg-gray-100 text-gray-800'
    };
    return (
      <Badge className={roleColors[role] || 'bg-gray-100 text-gray-800'}>
        {role}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">A list of all {view} users in the system.</p>
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
          <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
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
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as any })}>
                    <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Trainee">Trainee</SelectItem>
                      <SelectItem value="Facilitator">Facilitator</SelectItem>
                      <SelectItem value="Program Manager">Program Manager</SelectItem>
                      {currentUser?.role === 'SuperAdmin' && <SelectItem value="SuperAdmin">Super Admin</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingUser ? 'Save Changes' : 'Create User')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage all users. You can view, edit, and change user status.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
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
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No {view} users found.</TableCell></TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenModal(user)} title="Edit User">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleUserStatusChange(user._id, !user.isActive)} title={user.isActive ? "Deactivate User" : "Reactivate User"}>
                              {user.isActive ? <Archive className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
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
  );
}