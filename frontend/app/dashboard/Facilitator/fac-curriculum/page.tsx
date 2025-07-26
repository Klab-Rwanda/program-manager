"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Upload, FileText, Send, AlertCircle, CheckCircle, Clock, Plus, Loader2, Eye } from "lucide-react";
import { createCourse, requestCourseApproval } from "@/lib/services/course.service";
import { Course, Program } from "@/types";
import api from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/contexts/RoleContext";

// Helper for backend `getMyCourses` which doesn't exist yet
const getMyCoursesSimulated = async (facilitatorId: string): Promise<Course[]> => {
    const response = await api.get('/courses/program/all'); // Temp: fetches all
    // Frontend filtering to simulate the correct backend behavior
    return response.data.data.filter((c: Course) => c.facilitator._id === facilitatorId);
};

export default function FacilitatorCurriculumPage() {
    const { user } = useAuth();
    const [myCourses, setMyCourses] = useState<Course[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [isUploadOpen, setUploadOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadData, setUploadData] = useState({ programId: "", title: "", description: "" });

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [coursesData, programsData] = await Promise.all([
                getMyCoursesSimulated(user._id),
                api.get('/programs').then(res => res.data.data)
            ]);
            setMyCourses(coursesData);
            setPrograms(programsData);
        } catch (err) {
            toast.error("Failed to load your curriculum data.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploadFile(e.target.files[0]);
        }
    };

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile || !uploadData.programId || !uploadData.title) {
            return toast.error("Please fill all required fields and select a file.");
        }
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('title', uploadData.title);
        formData.append('description', uploadData.description);
        formData.append('programId', uploadData.programId);
        formData.append('courseDocument', uploadFile);

        try {
            await createCourse(formData);
            toast.success("Course created as a draft successfully!");
            setUploadOpen(false);
            setUploadData({ programId: "", title: "", description: "" });
            setUploadFile(null);
            fetchData();
        } catch (err) {
            toast.error("Failed to create course.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestApproval = async (courseId: string) => {
      setIsSubmitting(true);
      try {
          await requestCourseApproval(courseId);
          toast.success("Course submitted for approval!");
          fetchData();
      } catch (err) {
          toast.error("Failed to submit course for approval.");
      } finally {
          setIsSubmitting(false);
      }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Draft': return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1"/>Draft</Badge>;
            case 'PendingApproval': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1"/>Pending</Badge>;
            case 'Approved': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1"/>Approved</Badge>;
            case 'Rejected': return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1"/>Rejected</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Curriculum</h1>
                    <p className="text-muted-foreground">Manage and submit your course materials for approval.</p>
                </div>
                <Button onClick={() => setUploadOpen(true)} className="bg-[#1f497d] hover:bg-[#1a3f6b]">
                    <Plus className="mr-2 h-4 w-4" /> Upload New Course
                </Button>
            </div>

            {myCourses.length === 0 ? (
                 <Card className="text-center py-12">
                    <CardContent>
                        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold">No Courses Created Yet</h3>
                        <p className="text-muted-foreground">Click "Upload New Course" to get started.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {myCourses.map(course => (
                    <Card key={course._id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="pr-2">{course.title}</CardTitle>
                                {getStatusBadge(course.status)}
                            </div>
                            <CardDescription>{course.program.name}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground line-clamp-2 h-10">{course.description}</p>
                            {course.status === 'Rejected' && course.rejectionReason && (
                                <Alert variant="destructive">
                                    <AlertDescription><strong>Reason:</strong> {course.rejectionReason}</AlertDescription>
                                </Alert>
                            )}
                            <div className="flex gap-2 border-t pt-4">
                                {course.status === 'Draft' || course.status === 'Rejected' ? (
                                    <Button size="sm" className="flex-1" onClick={() => handleRequestApproval(course._id)} disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                                        Submit for Approval
                                    </Button>
                                ) : null}
                                <Button size="sm" variant="secondary" className="flex-1" asChild>
                                    <a href={course.contentUrl} target="_blank" rel="noopener noreferrer"><Eye className="mr-2 h-4 w-4"/> View Document</a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    ))}
                </div>
            )}

            <Dialog open={isUploadOpen} onOpenChange={setUploadOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Upload New Course Material</DialogTitle></DialogHeader>
                    <form onSubmit={handleCreateCourse} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Program *</Label>
                            <Select value={uploadData.programId} onValueChange={(v) => setUploadData(d => ({...d, programId: v}))} required>
                                <SelectTrigger><SelectValue placeholder="Select program"/></SelectTrigger>
                                <SelectContent>{programs.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Course Title *</Label>
                            <Input value={uploadData.title} onChange={e => setUploadData(d=>({...d, title: e.target.value}))} required/>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={uploadData.description} onChange={e => setUploadData(d=>({...d, description: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Course Document (PDF, etc.) *</Label>
                            <Input type="file" onChange={handleFileChange} required/>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Upload as Draft
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}