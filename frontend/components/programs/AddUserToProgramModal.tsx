"use client";

import React, { useState } from 'react';
import api from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

interface AddUserToProgramModalProps {
  programId: string;
  programName: string;
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

const initialUserData = { name: '', email: '', role: 'Trainee' };

export function AddUserToProgramModal({ programId, programName, isOpen, onClose, onUserAdded }: AddUserToProgramModalProps) {
  const [newUserData, setNewUserData] = useState(initialUserData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Use the new backend endpoint
      await api.post(`/programs/${programId}/add-user`, newUserData);
      alert(`User "${newUserData.name}" created and enrolled in ${programName}. They will receive an email with login credentials.`);
      setNewUserData(initialUserData);
      onUserAdded(); // This will trigger a data refresh and close the modal
    } catch (err: any) {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add User to {programName}</DialogTitle>
          <DialogDescription>
            Create a new user and automatically enroll them in this program. An email with login details will be sent.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={newUserData.name} onChange={e => setNewUserData({...newUserData, name: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={newUserData.email} onChange={e => setNewUserData({...newUserData, email: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={newUserData.role} onValueChange={(value: 'Trainee' | 'Facilitator') => setNewUserData(prev => ({ ...prev, role: value }))}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="Trainee">Trainee</SelectItem>
                <SelectItem value="Facilitator">Facilitator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Create and Enroll User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}