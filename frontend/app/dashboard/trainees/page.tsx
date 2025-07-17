"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRole } from '@/lib/contexts/RoleContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, AlertTriangle, GraduationCap, TrendingUp, CheckCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

// Interface matching the backend response from /my-trainees
interface Trainee {
  _id: string;
  name: string;
  email: string;
  status: string;
  program: {
    name: string;
    description: string;
  };
  stats: {
    attendance: number;
    assignments: number;
    submissionCount: string;
  };
}

const initialTraineeData = { name: '', email: '' };

export default function ManagedTraineesPage() {
    const { user } = useRole();
    const [trainees, setTrainees] = useState<Trainee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTraineeData, setNewTraineeData] = useState(initialTraineeData);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchTrainees = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            // This endpoint is specifically for Program Managers
            const response = await api.get('/program-users/my-trainees');
            setTrainees(response.data.data);
        } catch (err) {
            setError('Failed to fetch your trainees. You may not be assigned to any programs.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchTrainees();
    }, [fetchTrainees]);

    const handleCreateTrainee = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/auth/register', {
                ...newTraineeData,
                role: 'Trainee'
            });
            alert(`Trainee "${newTraineeData.name}" created successfully. They will receive an email with their credentials. Please enroll them into a program from the Programs page.`);
            setIsModalOpen(false);
            setNewTraineeData(initialTraineeData);
            // We don't refetch here because the new user isn't in a program yet.
        } catch (err: any) {
            alert(`Error: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const getProgressColor = (value: number) => {
      if (value >= 85) return "bg-green-500";
      if (value >= 60) return "bg-yellow-500";
      return "bg-red-500";
    }

    if (loading) {
        return <div className="flex justify-center items-center h-full p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manage Trainees</h1>
                    <p className="text-muted-foreground">View performance and add new trainees to the system.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}><Plus size={16} className="mr-2" /> Add New Trainee</Button>
            </div>

            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {trainees.length > 0 ? trainees.map((trainee) => (
                    <Card key={trainee._id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex items-center space-x-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback>{trainee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle>{trainee.name}</CardTitle>
                                    <CardDescription>{trainee.email}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-grow">
                             <div className="text-sm">
                                <span className="font-semibold">Program:</span> {trainee.program.name}
                            </div>
                            <div className="space-y-3">
                                <div className='space-y-1'>
                                    <div className='flex justify-between items-center text-xs'>
                                        <Label>Attendance</Label>
                                        <span className="font-semibold">{trainee.stats.attendance}%</span>
                                    </div>
                                    <Progress value={trainee.stats.attendance} indicatorClassName={getProgressColor(trainee.stats.attendance)} />
                                </div>
                                <div className='space-y-1'>
                                     <div className='flex justify-between items-center text-xs'>
                                        <Label>Assignments</Label>
                                        <span className="font-semibold">{trainee.stats.submissionCount}</span>
                                    </div>
                                    <Progress value={trainee.stats.assignments} indicatorClassName={getProgressColor(trainee.stats.assignments)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )) : (
                    <Card className="md:col-span-2 lg:col-span-3">
                        <CardContent className="p-8 text-center text-muted-foreground">
                            <GraduationCap className="h-12 w-12 mx-auto mb-4"/>
                            <p>No trainees are currently enrolled in the programs you manage.</p>
                            <p className="text-xs mt-1">Create a new trainee or enroll existing ones from the 'Programs' page.</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Trainee</DialogTitle>
                        <DialogDescription>
                            Create a new account for a trainee. They will receive an email with a temporary password to log in.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateTrainee} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={newTraineeData.name} onChange={e => setNewTraineeData({...newTraineeData, name: e.target.value})} required/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" value={newTraineeData.email} onChange={e => setNewTraineeData({...newTraineeData, email: e.target.value})} required/>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Create Trainee Account'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}