"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Users, X, UserPlus, UserX } from 'lucide-react';
import api from '@/lib/api';

import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

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

export function ManageUsersModal({ program, onClose, onUpdate }: ManageUsersModalProps) {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [availableTrainees, setAvailableTrainees] = useState<User[]>([]);
    const [availableFacilitators, setAvailableFacilitators] = useState<User[]>([]);

    const [selectedTraineeIds, setSelectedTraineeIds] = useState<Set<string>>(new Set());
    const [selectedFacilitatorIds, setSelectedFacilitatorIds] = useState<Set<string>>(new Set());
    
    // Memoize initial sets for efficient comparison on save
    const initialTraineeIds = useMemo(() => new Set(program.trainees.map(t => t._id)), [program.trainees]);
    const initialFacilitatorIds = useMemo(() => new Set(program.facilitators.map(f => f._id)), [program.facilitators]);

    // Fetch all available users and set initial state
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setError(null);
            try {
                const [traineesRes, facilitatorsRes] = await Promise.all([
                    api.get('/users/manage?role=Trainee'),
                    api.get('/users/manage?role=Facilitator')
                ]);
                setAvailableTrainees(traineesRes.data.data);
                setAvailableFacilitators(facilitatorsRes.data.data);
                setSelectedTraineeIds(initialTraineeIds);
                setSelectedFacilitatorIds(initialFacilitatorIds);
            } catch (err) {
                setError("Failed to load user lists. Please try again.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [program, initialTraineeIds, initialFacilitatorIds]);
    
    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        
        // Determine who to add and who to remove
        const traineesToAdd = [...selectedTraineeIds].filter(id => !initialTraineeIds.has(id));
        const traineesToRemove = [...initialTraineeIds].filter(id => !selectedTraineeIds.has(id));
        const facilitatorsToAdd = [...selectedFacilitatorIds].filter(id => !initialFacilitatorIds.has(id));
        const facilitatorsToRemove = [...initialFacilitatorIds].filter(id => !selectedFacilitatorIds.has(id));

        const apiCalls = [];

        // Create promises for all API calls
        traineesToAdd.forEach(id => apiCalls.push(api.post(`/programs/${program._id}/enroll-trainee`, { traineeId: id })));
        facilitatorsToAdd.forEach(id => apiCalls.push(api.post(`/programs/${program._id}/enroll-facilitator`, { facilitatorId: id })));
        traineesToRemove.forEach(id => apiCalls.push(api.patch(`/program-users/program/${program._id}/remove/${id}`)));
        facilitatorsToRemove.forEach(id => apiCalls.push(api.patch(`/program-users/program/${program._id}/remove/${id}`)));

        try {
            await Promise.all(apiCalls);
            alert("Program users updated successfully!");
            onUpdate(); // This will trigger a refresh on the main page
            onClose();
        } catch (err: any) {
            setError(`An error occurred: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSelection = (id: string, type: 'trainee' | 'facilitator') => {
        if (type === 'trainee') {
            setSelectedTraineeIds(prev => {
                const newSet = new Set(prev);
                if (newSet.has(id)) newSet.delete(id);
                else newSet.add(id);
                return newSet;
            });
        } else {
            setSelectedFacilitatorIds(prev => {
                const newSet = new Set(prev);
                if (newSet.has(id)) newSet.delete(id);
                else newSet.add(id);
                return newSet;
            });
        }
    };

    return (
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
            <DialogHeader>
                <DialogTitle className="flex items-center"><Users className="mr-2" />Manage Participants</DialogTitle>
                <DialogDescription>Add or remove trainees and facilitators for "{program.name}".</DialogDescription>
            </DialogHeader>
            {loading ? (
                <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : error ? (
                <div className="text-red-600 bg-red-50 p-4 rounded-md">{error}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    {/* Trainees Column */}
                    <Card>
                        <CardHeader><CardTitle className="flex items-center"><UserPlus className="mr-2 h-5 w-5" />Manage Trainees</CardTitle></CardHeader>
                        <CardContent>
                            <ScrollArea className="h-72 pr-4">
                                <div className="space-y-3">
                                    {availableTrainees.map(user => (
                                        <div key={user._id} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`trainee-${user._id}`} 
                                                checked={selectedTraineeIds.has(user._id)}
                                                onCheckedChange={() => handleSelection(user._id, 'trainee')}
                                            />
                                            <Label htmlFor={`trainee-${user._id}`} className="font-normal w-full cursor-pointer">{user.name}</Label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                    {/* Facilitators Column */}
                    <Card>
                        <CardHeader><CardTitle className="flex items-center"><UserX className="mr-2 h-5 w-5" />Manage Facilitators</CardTitle></CardHeader>
                        <CardContent>
                             <ScrollArea className="h-72 pr-4">
                                <div className="space-y-3">
                                    {availableFacilitators.map(user => (
                                        <div key={user._id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`facilitator-${user._id}`}
                                                checked={selectedFacilitatorIds.has(user._id)}
                                                onCheckedChange={() => handleSelection(user._id, 'facilitator')}
                                            />
                                            <Label htmlFor={`facilitator-${user._id}`} className="font-normal w-full cursor-pointer">{user.name}</Label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            )}
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving || loading} style={{ backgroundColor: '#1f497d' }} className="hover:bg-[#1a3d6b]">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}