"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    Loader2, Users, UserCheck, TrendingUp, Calendar, ArrowLeft, Edit, UserPlus, 
    Send, Info, CheckSquare 
} from 'lucide-react';
import api from '@/lib/api';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Reusable Modal for User Management
import { ManageUsersModal } from '@/components/programs/ManageUsersModal';

// --- Type Definitions ---
interface User { _id: string; name: string; email: string; }
interface ProgramDetails {
    _id: string;
    name: string;
    description: string;
    status: 'Draft' | 'PendingApproval' | 'Active' | 'Completed' | 'Rejected';
    startDate: string;
    endDate: string;
    category: string;
    trainees: User[];
    facilitators: User[];
    programManager: User[];
}
interface ProgramStats {
    totalEnrolled: number;
    totalFacilitators: number;
    overallAttendancePercentage: number;
}

const initialStats: ProgramStats = { totalEnrolled: 0, totalFacilitators: 0, overallAttendancePercentage: 0 };
const initialFormData = { name: '', description: '', startDate: '', endDate: '', category: '' };

export default function ProgramDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { id: programId } = params as { id: string };

    // --- State Management ---
    const [program, setProgram] = useState<ProgramDetails | null>(null);
    const [stats, setStats] = useState<ProgramStats>(initialStats);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Modal States ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isManageUsersModalOpen, setIsManageUsersModalOpen] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchProgramData = useCallback(async () => {
        if (!programId) return;
        setLoading(true);
        setError(null);
        try {
            const detailsRes = await api.get(`/programs/${programId}`);
            const programData: ProgramDetails = detailsRes.data.data;
            setProgram(programData);

            if (programData.status !== 'Draft' && programData.status !== 'PendingApproval') {
                const statsRes = await api.get(`/programs/${programId}/stats`);
                setStats(statsRes.data.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Could not load program details.");
        } finally {
            setLoading(false);
        }
    }, [programId]);

    useEffect(() => {
        fetchProgramData();
    }, [fetchProgramData]);
    
    // --- Action Handlers ---
    const handleOpenEditModal = () => {
        if (!program) return;
        setFormData({
            name: program.name,
            description: program.description,
            startDate: new Date(program.startDate).toISOString().split('T')[0],
            endDate: new Date(program.endDate).toISOString().split('T')[0],
            category: program.category || '',
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateProgram = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.put(`/programs/${programId}`, formData);
            alert("Program details updated successfully!");
            setIsEditModalOpen(false);
            fetchProgramData(); // Refresh data
        } catch(err: any) {
            alert(`Error: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestApproval = async () => {
        if (!program) return;
        if (!window.confirm("Are you sure you want to submit this program for approval?")) return;
        setIsSubmitting(true);
        try {
            await api.patch(`/programs/${programId}/request-approval`);
            alert("Program submitted for approval successfully!");
            fetchProgramData();
        } catch (err: any) {
             alert(`Error: ${err.response?.data?.message || "Failed to submit for approval."}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusClass = (status: string) => {
        const statusMap: { [key: string]: string } = { 'Active': 'bg-green-100 text-green-800', 'Completed': 'bg-blue-100 text-blue-800', 'PendingApproval': 'bg-yellow-100 text-yellow-800', 'Draft': 'bg-gray-100 text-gray-800', 'Rejected': 'bg-red-100 text-red-800' };
        return statusMap[status] || 'bg-gray-200';
    };

    // --- Render Logic ---
    if (loading) return <div className="flex h-full w-full items-center justify-center p-16"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    if (error || !program) return <div className="space-y-4"><Button variant="outline" onClick={() => router.push('/dashboard/programs')} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" />Back to Programs</Button><Alert variant="destructive"><AlertDescription>{error || "Program not found."}</AlertDescription></Alert></div>;

    const setupChecklist = [
        { label: "Add Trainees", completed: program.trainees.length > 0 },
        { label: "Assign Facilitators", completed: program.facilitators.length > 0 },
    ];
    
    const canEdit = program.status === 'Draft' || program.status === 'Active';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/programs')} className="mb-2"><ArrowLeft className="mr-2 h-4 w-4" />Back to All Programs</Button>
                    <h1 className="text-3xl font-bold tracking-tight">{program.name}</h1>
                    <p className="text-muted-foreground">{program.description}</p>
                </div>
                {canEdit && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleOpenEditModal}><Edit className="mr-2 h-4 w-4" /> Edit Program</Button>
                        <Button style={{ backgroundColor: '#1f497d' }} className="hover:bg-[#1a3d6b]" onClick={() => setIsManageUsersModalOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> Manage Users</Button>
                    </div>
                )}
            </div>

            {program.status === 'Draft' && (
                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader><CardTitle>Program Setup Checklist</CardTitle><CardDescription>Complete these steps before submitting for approval.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {setupChecklist.map(item => (
                                <div key={item.label} className={`flex items-center p-3 rounded-md border ${item.completed ? 'bg-green-50 border-green-200' : ''}`}>
                                    <CheckSquare className={`h-5 w-5 mr-3 ${item.completed ? 'text-green-600' : 'text-gray-400'}`} />
                                    <span className={`font-medium ${item.completed ? 'text-green-800' : 'text-gray-600'}`}>{item.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t">
                            <p className="text-sm text-muted-foreground">Submit for approval once setup is complete.</p>
                            <Button onClick={handleRequestApproval} disabled={isSubmitting} style={{ backgroundColor: '#1f497d' }} className="hover:bg-[#1a3d6b]">{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}Request Approval</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {program.status === 'PendingApproval' && (
                <Alert className="bg-yellow-50 border-yellow-200"><Info className="h-4 w-4" /><AlertTitle>Pending Approval</AlertTitle><AlertDescription>This program is awaiting review from a Super Admin.</AlertDescription></Alert>
            )}
            
            {program.status === 'Active' && (
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{[{ title: "Total Enrolled", value: stats.totalEnrolled, icon: Users },{ title: "Facilitators", value: stats.totalFacilitators, icon: UserCheck },{ title: "Attendance Rate", value: `${stats.overallAttendancePercentage}%`, icon: TrendingUp },{ title: "Status", value: <Badge className={getStatusClass(program.status)}>{program.status}</Badge>, icon: Calendar }].map(stat => (<Card key={stat.title}><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{stat.title}</CardTitle><stat.icon className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stat.value}</div></CardContent></Card>))}</div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2"><CardHeader><CardTitle>Enrolled Trainees ({program.trainees.length})</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead></TableRow></TableHeader><TableBody>{program.trainees.length > 0 ? program.trainees.map(t => (<TableRow key={t._id}><TableCell><div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarFallback>{t.name.split(" ").map(n=>n[0]).join("")}</AvatarFallback></Avatar><span className="font-medium">{t.name}</span></div></TableCell><TableCell>{t.email}</TableCell></TableRow>)) : (<TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No trainees enrolled yet.</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
                <Card><CardHeader><CardTitle>Assigned Facilitators ({program.facilitators.length})</CardTitle></CardHeader><CardContent className="space-y-3">{program.facilitators.length > 0 ? program.facilitators.map(f => (<div key={f._id} className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarFallback>{f.name.split(" ").map(n=>n[0]).join("")}</AvatarFallback></Avatar><div><p className="font-medium">{f.name}</p><p className="text-xs text-muted-foreground">{f.email}</p></div></div>)) : (<p className="text-sm text-muted-foreground">No facilitators assigned.</p>)}</CardContent></Card>
            </div>

            {/* Edit Program Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader><DialogTitle>Edit Program Details</DialogTitle></DialogHeader>
                    <form onSubmit={handleUpdateProgram} className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="name" className="text-right">Title</Label><Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="col-span-3" required /></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="description" className="text-right">Description</Label><Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="col-span-3" required /></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="category" className="text-right">Category</Label><Input id="category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="col-span-3" required /></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="startDate" className="text-right">Start Date</Label><Input id="startDate" type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="col-span-3" required /></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="endDate" className="text-right">End Date</Label><Input id="endDate" type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="col-span-3" required /></div>
                        <DialogFooter><Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button><Button type="submit" disabled={isSubmitting} style={{ backgroundColor: '#1f497d' }} className="hover:bg-[#1a3d6b]">{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Manage Users Modal */}
            <Dialog open={isManageUsersModalOpen} onOpenChange={setIsManageUsersModalOpen}>
                <ManageUsersModal
                    program={program}
                    onClose={() => setIsManageUsersModalOpen(false)}
                    onUpdate={() => {
                        setIsManageUsersModalOpen(false);
                        fetchProgramData(); // Refresh data on this page after modal closes
                    }}
                />
            </Dialog>
        </div>
    );
}