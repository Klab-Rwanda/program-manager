"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Archive, UserCheck, Loader2, Edit, Trash2, Search, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/contexts/RoleContext";
import {
  getUsers,
  createUser,
  updateUserDetails,
  updateUserStatus,
  deleteUser,
} from "@/lib/services/user.service";
import { User } from "@/types";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type UserRole = "SuperAdmin" | "Program Manager" | "Facilitator" | "Trainee" | "IT-Support";
interface UserFormData { name: string; email: string; role: UserRole; }
const initialFormData: UserFormData = { name: "", email: "", role: "Trainee" };

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<'active' | 'archived'>('active');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [dialogState, setDialogState] = useState<{
    open: boolean;
    type: 'delete' | 'status';
    user: User | null;
  }>({ open: false, type: 'delete', user: null });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedUsers = await getUsers(view === 'active');
      setUsers(fetchedUsers);
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to fetch ${view} users.`);
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleOpenModal = (user: User | null = null) => {
    setEditingUser(user);
    if (user) {
      setFormData({ name: user.name, email: user.email, role: user.role });
    } else {
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingUser) {
        await updateUserDetails(editingUser._id, formData);
        toast.success(`User "${formData.name}" updated successfully.`);
      } else {
        await createUser(formData);
        toast.success(`User "${formData.name}" created! Credentials will be sent via email.`);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const openConfirmationDialog = (type: 'delete' | 'status', user: User) => {
    setDialogState({ open: true, type, user });
  };

  const handleConfirmAction = async () => {
    if (!dialogState.user) return;
    setIsSubmitting(true);
    try {
        if (dialogState.type === 'delete') {
            await deleteUser(dialogState.user._id);
            toast.success(`User "${dialogState.user.name}" has been deleted.`);
        } else if (dialogState.type === 'status') {
            const newStatus = !dialogState.user.isActive;
            await updateUserStatus(dialogState.user._id, newStatus);
            toast.success(`User status updated successfully.`);
        }
        fetchUsers();
    } catch (err: any) {
        toast.error(err.response?.data?.message || "Action failed.");
    } finally {
        setDialogState({ open: false, type: 'delete', user: null });
        setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getRoleBadge = (role: string) => {
      const roleColors: { [key: string]: string } = {
        'SuperAdmin': 'bg-red-100 text-red-800', 'Program Manager': 'bg-blue-100 text-blue-800',
        'Facilitator': 'bg-purple-100 text-purple-800', 'Trainee': 'bg-gray-100 text-gray-800',
        'IT-Support': 'bg-orange-100 text-orange-800',
      };
      return <Badge className={roleColors[role] || ''}>{role}</Badge>;
  };
  const getStatusBadge = (status: boolean) => status ? <Badge className="bg-green-100 text-green-800">Active</Badge> : <Badge variant="secondary">Inactive</Badge>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">User Management</h1><p className="text-muted-foreground">Oversee all users in the system.</p></div>
        <Button onClick={() => handleOpenModal()} className="bg-[#1f497d] hover:bg-[#1a3f6b]"><Plus className="mr-2 h-4 w-4" /> Add New User</Button>
      </div>
      <Card>
        <CardHeader><div className="flex justify-between items-center"><div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10"/></div><div className="flex items-center gap-2"><Button variant={view === 'active' ? 'default' : 'outline'} size="sm" onClick={() => setView('active')}><UserCheck className="mr-2 h-4 w-4" />Active</Button><Button variant={view === 'archived' ? 'default' : 'outline'} size="sm" onClick={() => setView('archived')}><Archive className="mr-2 h-4 w-4" />Archived</Button></div></div></CardHeader>
        <CardContent><div className="rounded-md border"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Date Added</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
                {loading ? <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="animate-spin"/></TableCell></TableRow>
                : filteredUsers.length === 0 ? <TableRow><TableCell colSpan={5} className="h-24 text-center">No users found.</TableCell></TableRow>
                : filteredUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell><div className="font-medium">{user.name}</div><div className="text-sm text-muted-foreground">{user.email}</div></TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(user)} title="Edit User"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openConfirmationDialog('status', user)} title={user.isActive ? 'Deactivate' : 'Reactivate'}>{user.isActive ? <Archive className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}</Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openConfirmationDialog('delete', user)} title="Delete User"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody></Table></div></CardContent>
      </Card>
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle><DialogDescription>{editingUser ? `Update details for ${editingUser.name}.` : "Add a new user. Their password will be sent via email."}</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2"><Label htmlFor="name">Full Name</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label htmlFor="email">Email Address</Label><Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required disabled={!!editingUser} /></div>
            <div className="space-y-2"><Label htmlFor="role">Role</Label><Select value={formData.role} onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}><SelectTrigger id="role"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Trainee">Trainee</SelectItem><SelectItem value="Facilitator">Facilitator</SelectItem><SelectItem value="IT-Support">IT Support</SelectItem>{currentUser?.role === 'SuperAdmin' && <><SelectItem value="Program Manager">Program Manager</SelectItem><SelectItem value="SuperAdmin">Super Admin</SelectItem></>}</SelectContent></Select></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : (editingUser ? "Save Changes" : "Create User")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={dialogState.open} onOpenChange={(open) => setDialogState({...dialogState, open})}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/> Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogState.type === 'delete'
                ? `This action cannot be undone. This will permanently delete the user "${dialogState.user?.name}".`
                : `This will ${dialogState.user?.isActive ? 'deactivate' : 'reactivate'} the account for "${dialogState.user?.name}".`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction} className={dialogState.type === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}