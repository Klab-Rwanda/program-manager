"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRole } from '@/lib/contexts/RoleContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, AlertTriangle, UserCheck } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Facilitator {
  _id: string;
  name: string;
  email: string;
  status: string;
}

const initialFacilitatorData = { name: '', email: '' };

export default function ManagedFacilitatorsPage() {
    const { user } = useRole();
    const [facilitators, setFacilitators] = useState<Facilitator[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newFacilitatorData, setNewFacilitatorData] = useState(initialFacilitatorData);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchFacilitators = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            // NOTE: Your backend doesn't have a "my-facilitators" endpoint.
            // We use the generic one and assume a PM can see all facilitators.
            // In a real app, you might want a more specific endpoint.
            const response = await api.get('/users/manage?role=Facilitator');
            setFacilitators(response.data.data);
        } catch (err) {
            setError('Failed to fetch facilitators.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchFacilitators();
    }, [fetchFacilitators]);

    const handleCreateFacilitator = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/auth/register', {
                ...newFacilitatorData,
                role: 'Facilitator' // Hardcode the role
            });
            alert(`Facilitator "${newFacilitatorData.name}" created successfully. They will receive an email with login credentials.`);
            setIsModalOpen(false);
            setNewFacilitatorData(initialFacilitatorData);
            fetchFacilitators(); // Refresh the list
        } catch (err: any) {
            alert(`Error: ${err.response?.data?.message || err.message}`);
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
                    <h1 className="text-3xl font-bold tracking-tight">Manage Facilitators</h1>
                    <p className="text-muted-foreground">View and add facilitators to the Klab ecosystem.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}><Plus size={16} className="mr-2" /> Add New Facilitator</Button>
            </div>

            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {facilitators.map((facilitator) => (
                    <Card key={facilitator._id}>
                        <CardHeader>
                             <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback>{facilitator.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-lg">{facilitator.name}</CardTitle>
                                        <CardDescription>{facilitator.email}</CardDescription>
                                    </div>
                                </div>
                                <Badge variant={facilitator.status === 'Active' ? 'default' : 'secondary'}>{facilitator.status}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                           <p className="text-sm text-muted-foreground">Facilitator details and assigned programs would appear here.</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {facilitators.length === 0 && !loading && (
                 <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        <UserCheck className="h-12 w-12 mx-auto mb-4"/>
                        No facilitators have been added yet.
                    </CardContent>
                </Card>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Facilitator</DialogTitle>
                        <DialogDescription>
                            Create a new account for a facilitator. They will receive an email with a temporary password to log in.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateFacilitator} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={newFacilitatorData.name} onChange={e => setNewFacilitatorData({...newFacilitatorData, name: e.target.value})} required/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" value={newFacilitatorData.email} onChange={e => setNewFacilitatorData({...newFacilitatorData, email: e.target.value})} required/>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Create Facilitator Account'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}