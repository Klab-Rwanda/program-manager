"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Upload, FileText, Download, Eye, Plus, Loader2 } from "lucide-react";
import api from "@/lib/api";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

// --- Type Definitions ---
interface Program {
    _id: string;
    name: string;
}

interface Course {
    _id: string;
    title: string;
    description: string;
    program: string;
    contentUrl: string;
    status: 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected';
    createdAt: string;
}

const initialFormData = { programId: "", title: "", description: "" };

export default function CurriculumPage() {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedProgramId, setSelectedProgramId] = useState("");
    const [loading, setLoading] = useState({ programs: true, courses: false });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [formData, setFormData] = useState(initialFormData);
    
    const fetchMyPrograms = useCallback(async () => {
        setLoading(p => ({ ...p, programs: true }));
        try {
            const res = await api.get('/programs');
            const userPrograms: Program[] = res.data.data;
            setPrograms(userPrograms);
            if (userPrograms.length > 0 && !selectedProgramId) {
                setSelectedProgramId(userPrograms[0]._id);
            }
        } catch (error) {
            console.error("Failed to fetch programs", error);
        } finally {
            setLoading(p => ({ ...p, programs: false }));
        }
    }, [selectedProgramId]);

    const fetchCourses = useCallback(async () => {
        if (!selectedProgramId) return;
        setLoading(p => ({ ...p, courses: true }));
        try {
            const res = await api.get(`/courses/program/${selectedProgramId}`);
            setCourses(res.data.data);
        } catch (error) {
            console.error("Failed to fetch courses", error);
            setCourses([]);
        } finally {
            setLoading(p => ({ ...p, courses: false }));
        }
    }, [selectedProgramId]);

    useEffect(() => { fetchMyPrograms(); }, [fetchMyPrograms]);
    useEffect(() => { fetchCourses(); }, [fetchCourses]);

    const handleSubmitCourse = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!formData.programId || !formData.title || !selectedFile) {
            return alert("Please select a program, provide a title, and choose a file.");
        }
        setIsSubmitting(true);
        
        const uploadFormData = new FormData();
        uploadFormData.append('title', formData.title);
        uploadFormData.append('description', formData.description);
        uploadFormData.append('programId', formData.programId);
        uploadFormData.append('courseDocument', selectedFile);

        try {
            await api.post('/courses', uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Course created successfully and is now pending approval.');
            setUploadDialogOpen(false);
            setFormData(initialFormData);
            setSelectedFile(null);
            fetchCourses();
        } catch (err: any) {
            alert(`Error: ${err.response?.data?.message || "Failed to create course."}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap: { [key: string]: string } = {
            'Approved': 'bg-green-100 text-green-800', 
            'PendingApproval': 'bg-yellow-100 text-yellow-800', 
            'Rejected': 'bg-red-100 text-red-800', 
            'Draft': 'bg-gray-100 text-gray-800',
        };
        return <Badge className={statusMap[status]}>{status.replace('Approval', ' Approval')}</Badge>;
    };

    return (
        <div className="flex flex-1 flex-col gap-6 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Curriculum Management</h1>
                    <p className="text-muted-foreground">Upload and manage course materials for your programs.</p>
                </div>
                <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild>
                        <Button style={{ backgroundColor: '#1f497d' }} className="hover:bg-[#1a3d6b]">
                            <Plus className="mr-2 h-4 w-4" />Create Course
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader><DialogTitle>Create New Course</DialogTitle><DialogDescription>Upload a document and provide details for a new course.</DialogDescription></DialogHeader>
                        <form onSubmit={handleSubmitCourse} className="space-y-4 py-4">
                            <div className="space-y-2"><Label>Program *</Label><Select value={formData.programId} onValueChange={v => setFormData(f => ({ ...f, programId: v }))} required><SelectTrigger><SelectValue placeholder="Select a program" /></SelectTrigger><SelectContent>{programs.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                            <div className="space-y-2"><Label>Course Title *</Label><Input placeholder="e.g., Introduction to React" value={formData.title} onChange={e => setFormData(f => ({ ...f, title: e.target.value }))} required /></div>
                            <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Brief description of the course content..." value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} /></div>
                            <div className="space-y-2"><Label>Course Document *</Label><Input type="file" onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)} required /></div>
                            <DialogFooter>
                                <Button variant="outline" type="button" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={isSubmitting} style={{ backgroundColor: '#1f497d' }} className="hover:bg-[#1a3d6b]">{isSubmitting ? <Loader2 className="animate-spin" /> : "Create & Submit"}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            
            <Card>
                <CardHeader><CardTitle>Filter Courses</CardTitle></CardHeader>
                <CardContent>
                    <div className="max-w-sm">
                        <Label>Select Program to View Courses</Label>
                        <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                            <SelectTrigger><SelectValue placeholder="Filter by program" /></SelectTrigger>
                            <SelectContent>{programs.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>My Uploaded Courses</CardTitle>
                    <CardDescription>Courses you have created for the selected program.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading.courses ? (
                        <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : courses.length > 0 ? (
                        <div className="space-y-4">
                            {courses.map((course) => (
                                <div key={course._id} className="flex items-center justify-between p-4 rounded-lg border">
                                    <div className="flex items-center gap-4">
                                        <FileText className="h-6 w-6 text-[#1f497d]" />
                                        <div>
                                            <p className="font-medium">{course.title}</p>
                                            <p className="text-sm text-muted-foreground">Uploaded: {new Date(course.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(course.status)}
                                        <Button asChild variant="ghost" size="sm"><a href={course.contentUrl} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12"><p className="text-muted-foreground">No courses found for this program. Click "Create Course" to add one.</p></div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}