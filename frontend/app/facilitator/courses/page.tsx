"use client"

import React, { useState, useEffect, useCallback } from "react";
import { useRole } from "@/lib/contexts/RoleContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, BookOpen, Send, CheckCircle, Clock } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// --- Type Definitions ---
interface Course {
  _id: string;
  title: string;
  description: string;
  status: 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected';
  program: { _id: string; name: string };
}
interface Program { _id: string; name: string; }

const initialFormData = { title: '', description: '', programId: '', courseDocument: null as File | null };

export default function FacilitatorCoursesPage() {
    const { user } = useRole();
    const [courses, setCourses] = useState<Course[]>([]);
    const [myPrograms, setMyPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Data Fetching ---
    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            // Fetch programs the facilitator is part of to populate the dropdown
            const programsResponse = await api.get('/programs');
            setMyPrograms(programsResponse.data.data);
            
            // A real backend would have an endpoint like /courses/my-courses
            // For now, we simulate by fetching all and filtering
            const allCoursesResponse = await api.get(`/courses/program/${programsResponse.data.data[0]?._id}`); // Example for one program
            // In a real app, you'd fetch courses for ALL programs, or have a dedicated endpoint
            if(allCoursesResponse.data.data) {
                setCourses(allCoursesResponse.data.data);
            }
        } catch (err) {
            setError('Failed to fetch your courses or programs.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, courseDocument: e.target.files![0] }));
        }
    };
    
    // --- Form Submission ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.programId || !formData.courseDocument) {
            alert("Please fill all fields and select a file.");
            return;
        }
        setIsSubmitting(true);
        
        const submissionData = new FormData();
        submissionData.append('title', formData.title);
        submissionData.append('description', formData.description);
        submissionData.append('programId', formData.programId);
        submissionData.append('courseDocument', formData.courseDocument);

        try {
            await api.post('/courses', submissionData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            alert('Course created successfully! It is now in Draft status.');
            setIsCreateModalOpen(false);
            setFormData(initialFormData);
            fetchData();
        } catch (err: any) {
            alert(`Error creating course: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestApproval = async (courseId: string) => {
        try {
            await api.patch(`/courses/${courseId}/request-approval`);
            alert('Approval requested successfully. The Program Manager has been notified.');
            fetchData();
        } catch (err: any) {
            alert(`Error: ${err.response?.data?.message || err.message}`);
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Draft': return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1"/>Draft</Badge>;
            case 'PendingApproval': return <Badge variant="default" className="bg-yellow-500"><Send className="h-3 w-3 mr-1"/>Pending Approval</Badge>;
            case 'Approved': return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1"/>Approved</Badge>;
            default: return <Badge variant="destructive">Rejected</Badge>;
        }
    };

    if (loading) {
      return <div className="flex justify-center items-center h-full p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
                    <p className="text-muted-foreground">Create, manage, and submit your courses for approval.</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}><Plus size={16} className="mr-2" /> Create Course</Button>
            </div>
            
            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

            <Card>
                <CardHeader>
                    <CardTitle>Course List</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {courses.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <BookOpen className="mx-auto h-12 w-12 mb-4"/>
                            You haven't created any courses yet.
                        </div>
                    ) : courses.map(course => (
                        <div key={course._id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <h3 className="font-semibold">{course.title}</h3>
                                <p className="text-sm text-muted-foreground">{course.program.name}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                {getStatusBadge(course.status)}
                                {course.status === 'Draft' && (
                                    <Button size="sm" variant="outline" onClick={() => handleRequestApproval(course._id)}>
                                        <Send className="h-4 w-4 mr-2"/>Request Approval
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create a New Course</DialogTitle>
                        <DialogDescription>Fill in the details and upload the primary course material.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Course Title</Label>
                            <Input id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="programId">Program</Label>
                            <Select value={formData.programId} onValueChange={value => setFormData({...formData, programId: value})} required>
                                <SelectTrigger><SelectValue placeholder="Select a program" /></SelectTrigger>
                                <SelectContent>
                                    {myPrograms.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="courseDocument">Course Document (PDF, ZIP, etc.)</Label>
                            <Input id="courseDocument" type="file" onChange={handleFileChange} required/>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Create Course'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}