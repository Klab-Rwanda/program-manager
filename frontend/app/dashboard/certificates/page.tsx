"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRole } from '@/lib/contexts/RoleContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Award, Download, CheckCircle, GraduationCap } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

// --- Type Definitions ---
interface Certificate {
  _id: string;
  trainee: { _id: string; name: string; };
  program: { _id: string; name: string; };
  issueDate: string;
  certificateId: string;
}
interface User { _id: string; name: string; }
interface Program { _id: string; name: string; trainees: User[] }

export default function CertificatesPage() {
    const { user, role } = useRole();
    const [myCertificates, setMyCertificates] = useState<Certificate[]>([]);
    const [managedPrograms, setManagedPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for the "Issue Certificate" modal
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedProgramId, setSelectedProgramId] = useState('');
    const [selectedTraineeId, setSelectedTraineeId] = useState('');

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            if (role === 'trainee') {
                const response = await api.get('/certificates/my-certificates');
                setMyCertificates(response.data.data);
            } else if (role === 'program_manager' || role === 'super_admin') {
                const response = await api.get('/programs');
                // Fetch programs to populate the "Issue" modal dropdown
                setManagedPrograms(response.data.data);
            }
        } catch (err) {
            setError("Failed to fetch data.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user, role]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleIssueCertificate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProgramId || !selectedTraineeId) {
            alert("Please select a program and a trainee.");
            return;
        }
        setIsSubmitting(true);
        try {
            await api.post('/certificates/issue', {
                programId: selectedProgramId,
                traineeId: selectedTraineeId
            });
            alert('Certificate issued successfully!');
            setIsIssueModalOpen(false);
            setSelectedProgramId('');
            setSelectedTraineeId('');
        } catch (err: any) {
             alert(`Error: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const traineesInSelectedProgram = managedPrograms.find(p => p._id === selectedProgramId)?.trainees || [];
    const canIssue = role === 'program_manager' || role === 'super_admin';

    if (loading) {
        return <div className="flex justify-center items-center h-full p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Certificates</h1>
                    <p className="text-muted-foreground">
                        {role === 'trainee' ? 'View and download your earned certificates.' : 'Issue and manage program certificates.'}
                    </p>
                </div>
                {canIssue && (
                    <Button onClick={() => setIsIssueModalOpen(true)}><Award className="mr-2 h-4 w-4" /> Issue Certificate</Button>
                )}
            </div>
            
            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

            {role === 'trainee' && (
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {myCertificates.length > 0 ? myCertificates.map(cert => (
                        <Card key={cert._id} className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <Award className="h-10 w-10 text-yellow-500"/>
                                    <Badge variant="default" className="bg-green-600">Verified</Badge>
                                </div>
                                <CardTitle className="pt-4 text-xl">{cert.program.name}</CardTitle>
                                <CardDescription>Certificate of Completion</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-sm space-y-2">
                                    <p><span className="font-semibold">Issued to:</span> {user?.name}</p>
                                    <p><span className="font-semibold">Issue Date:</span> {new Date(cert.issueDate).toLocaleDateString()}</p>
                                    <p className="text-xs text-muted-foreground pt-2">ID: {cert.certificateId}</p>
                                </div>
                                <Button className="w-full"><Download className="mr-2 h-4 w-4"/> Download PDF</Button>
                            </CardContent>
                        </Card>
                    )) : (
                         <Card className="md:col-span-2 lg:col-span-3">
                            <CardContent className="p-8 text-center text-muted-foreground">
                                <GraduationCap className="h-12 w-12 mx-auto mb-4"/>
                                You have not earned any certificates yet.
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {canIssue && (
                <Card>
                    <CardHeader>
                        <CardTitle>Certificate Management</CardTitle>
                        <CardDescription>This is a placeholder for where you would view all issued certificates. Click "Issue Certificate" to create a new one.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center py-12 text-muted-foreground">
                        <p>Certificate list and management features would be displayed here.</p>
                    </CardContent>
                </Card>
            )}

            {/* Issue Certificate Modal */}
            <Dialog open={isIssueModalOpen} onOpenChange={setIsIssueModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Issue New Certificate</DialogTitle>
                        <DialogDescription>Select a program and a trainee who has completed it to issue a certificate.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleIssueCertificate} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Program</Label>
                            <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                                <SelectTrigger><SelectValue placeholder="Select a completed program"/></SelectTrigger>
                                <SelectContent>
                                    {managedPrograms.filter(p => p.status === 'Completed').map(p => (
                                        <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label>Trainee</Label>
                            <Select value={selectedTraineeId} onValueChange={setSelectedTraineeId} disabled={!selectedProgramId}>
                                <SelectTrigger><SelectValue placeholder="Select a trainee from the program"/></SelectTrigger>
                                <SelectContent>
                                    {traineesInSelectedProgram.map(t => (
                                        <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setIsIssueModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Issue Certificate'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}