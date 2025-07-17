"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserPlus } from "lucide-react";
import api from "@/lib/api";

// --- Type Definitions ---
interface User { _id: string; name: string; email: string; }
interface Program {
  _id: string;
  name: string;
  trainees: User[];
  facilitators: User[];
}

interface ManageUsersModalProps {
  program: Program;
  onClose: () => void;
  onUpdate: () => void;
}

// --- FIX: Ensure `export` keyword is present ---
export function ManageUsersModal({ program, onClose, onUpdate }: ManageUsersModalProps) {
  const [availableTrainees, setAvailableTrainees] = useState<User[]>([]);
  const [availableFacilitators, setAvailableFacilitators] = useState<User[]>([]);
  const [selectedTraineeId, setSelectedTraineeId] = useState("");
  const [selectedFacilitatorId, setSelectedFacilitatorId] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Fetch all potential trainees and facilitators
        const [traineesRes, facilitatorsRes] = await Promise.all([
          api.get('/users/manage?role=Trainee'),
          api.get('/users/manage?role=Facilitator')
        ]);
        
        // Create sets of already enrolled user IDs for efficient lookup
        const enrolledTraineeIds = new Set(program.trainees.map(t => t._id));
        const enrolledFacilitatorIds = new Set(program.facilitators.map(f => f._id));

        // Filter out users who are already enrolled
        setAvailableTrainees(traineesRes.data.data.filter((u: User) => !enrolledTraineeIds.has(u._id)));
        setAvailableFacilitators(facilitatorsRes.data.data.filter((u: User) => !enrolledFacilitatorIds.has(u._id)));
      } catch (error) {
        console.error("Failed to fetch users for modal", error);
        alert("Could not load users to enroll. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [program]);

  const handleEnroll = async (type: 'trainee' | 'facilitator') => {
    const userId = type === 'trainee' ? selectedTraineeId : selectedFacilitatorId;
    if (!userId) {
        alert('Please select a user to enroll.');
        return;
    }

    setIsSubmitting(true);
    const endpoint = `/programs/${program._id}/enroll-${type}`;
    const body = type === 'trainee' ? { traineeId: userId } : { facilitatorId: userId };
    
    try {
      await api.post(endpoint, body);
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} enrolled successfully!`);
      // Reset selections after successful enrollment
      if(type === 'trainee') setSelectedTraineeId('');
      if(type === 'facilitator') setSelectedFacilitatorId('');
      onUpdate(); // This will close the modal and refresh the parent list
    } catch (err: any) {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Manage Users for {program.name}</DialogTitle>
        <DialogDescription>Add or remove trainees and facilitators from this program.</DialogDescription>
      </DialogHeader>
      
      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label>Enroll New Trainee</Label>
            <div className="flex gap-2">
              <Select value={selectedTraineeId} onValueChange={setSelectedTraineeId}>
                <SelectTrigger><SelectValue placeholder="Select a trainee" /></SelectTrigger>
                <SelectContent>
                  {availableTrainees.length > 0 ? (
                    availableTrainees.map(user => <SelectItem key={user._id} value={user._id}>{user.name} ({user.email})</SelectItem>)
                  ) : (
                    <SelectItem value="none" disabled>No available trainees</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button onClick={() => handleEnroll('trainee')} disabled={!selectedTraineeId || isSubmitting}>
                <UserPlus className="h-4 w-4 mr-2" /> Enroll
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Enroll New Facilitator</Label>
            <div className="flex gap-2">
              <Select value={selectedFacilitatorId} onValueChange={setSelectedFacilitatorId}>
                <SelectTrigger><SelectValue placeholder="Select a facilitator" /></SelectTrigger>
                <SelectContent>
                  {availableFacilitators.length > 0 ? (
                    availableFacilitators.map(user => <SelectItem key={user._id} value={user._id}>{user.name} ({user.email})</SelectItem>)
                  ) : (
                    <SelectItem value="none" disabled>No available facilitators</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button onClick={() => handleEnroll('facilitator')} disabled={!selectedFacilitatorId || isSubmitting}>
                <UserPlus className="h-4 w-4 mr-2" /> Enroll
              </Button>
            </div>
          </div>
        </div>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </DialogFooter>
    </DialogContent>
  );
}