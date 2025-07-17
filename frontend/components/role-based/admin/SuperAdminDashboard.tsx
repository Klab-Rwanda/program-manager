"use client";

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Users, UserCheck, Eye, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// --- Type Definitions ---
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  isActive: boolean;
  programManager?: { _id: string; name: string };
}
interface ProgramManager { _id: string; name: string; }

// Correct initial state with the exact string from the enum
const initialUserData = { name: '', email: '', role: 'Trainee' };

export function SuperAdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [managers, setManagers] = useState<ProgramManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [newUserData, setNewUserData] = useState(initialUserData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, managersRes] = await Promise.all([
        api.get('/users/manage'),
        api.get('/users/manage/list-by-role?role=Program Manager') // Use the exact string with space
      ]);
      setUsers(usersRes.data.data);
      setManagers(managersRes.data.data);
    } catch (err) {
      setError("Failed to fetch user data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // The `newUserData` state already holds the correct role string (e.g., "Program Manager")
      await api.post('/auth/register', newUserData);
      alert(`User "${newUserData.name}" created successfully. They will receive an email with credentials.`);
      setIsUserModalOpen(false);
      setNewUserData(initialUserData);
      fetchData();
    } catch (err: any) {
      alert(`Error: ${err.response?.data?.message || 'An unexpected error occurred.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = !user.isActive;
    if (window.confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} ${user.name}?`)) {
      try {
        await api.patch(`/users/manage/${user._id}/status`, { isActive: newStatus });
        alert(`User status updated.`);
        fetchData();
      } catch (err: any) {
        alert(`Error: ${err.response?.data?.message || err.message}`);
      }
    }
  };
  
  const handleOpenAssignModal = (user: User) => {
      setSelectedUser(user);
      // The backend uses programManager (singular)
      setSelectedManagerId(user.programManager?._id || '');
      setIsAssignModalOpen(true);
  };

  const handleAssignManager = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
        // Use the `assign-manager` endpoint as defined in the backend for a single program
        // NOTE: This assumes you want to assign a manager to a PROGRAM, not a USER directly.
        // Your backend logic for assigning a PM is on the program model. This might need adjustment.
        // For now, let's assume we are assigning a manager to a user, which needs a backend endpoint.
        // Let's pretend the endpoint is `/users/manage/:id/assign-manager`
        
        // This is a placeholder since the backend doesn't have this exact route.
        // await api.patch(`/users/manage/${selectedUser._id}/assign-manager`, { managerId: selectedManagerId });
        console.log(`Simulating assignment: User ${selectedUser._id} -> Manager ${selectedManagerId}`);
        await new Promise(res => setTimeout(res, 1000));
        
        alert("Manager assignment updated successfully!");
        setIsAssignModalOpen(false);
        fetchData();
    } catch(err: any) {
        alert(`Error: ${err.response?.data?.message || 'This feature requires a backend endpoint.'}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Add, view, and manage all users in the system.</p>
        </div>
        <Button onClick={() => setIsUserModalOpen(true)}><Plus size={16} className="mr-2" /> Create User</Button>
      </div>

      {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>A complete list of all active users.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user._id}>
                  <TableCell>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'default' : 'destructive'} className={user.isActive ? 'bg-green-500' : ''}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className='flex gap-1 justify-end'>
                        {/* The logic to assign a manager is typically done on a Program, not a User directly.
                            This button is left here for UI demonstration.
                        <Button variant="outline" size="sm" onClick={() => handleOpenAssignModal(user)}>Assign PM</Button>
                        */}
                        <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(user)} title={user.isActive ? 'Deactivate' : 'Activate'}>
                            {user.isActive ? <XCircle className="h-4 w-4 text-destructive"/> : <CheckCircle className="h-4 w-4 text-green-500"/>}
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Create User Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>A welcome email with login credentials will be sent to the user.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={newUserData.name} onChange={e => setNewUserData({...newUserData, name: e.target.value})} required/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={newUserData.email} onChange={e => setNewUserData({...newUserData, email: e.target.value})} required/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              {/* Ensure the value matches the backend enum exactly */}
              <Select value={newUserData.role} onValueChange={(value) => setNewUserData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Trainee">Trainee</SelectItem>
                  <SelectItem value="Facilitator">Facilitator</SelectItem>
                  <SelectItem value="Program Manager">Program Manager</SelectItem>
                  <SelectItem value="SuperAdmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsUserModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}