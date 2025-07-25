"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Loader2, BookOpen, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCourse, getMyCourses, updateCourse, deleteCourse } from "@/lib/services/course.service";
import { getAllPrograms } from "@/lib/services/program.service";
import { Course, Program } from "@/types";

const initialFormData = { title: "", description: "", programId: "" };

export default function CourseManagementPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [myPrograms, setMyPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [formData, setFormData] = useState<any>(initialFormData);
    const [file, setFile] = useState<File | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [coursesData, programsData] = await Promise.all([getMyCourses(), getAllPrograms()]);
            setCourses(coursesData);
            setMyPrograms(programsData);
        } catch (err) {
            toast.error("Failed to load your courses and programs.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleOpenModal = (course: Course | null = null) => {
        setEditingCourse(course);
        setFile(null);
        if (course) {
            setFormData({
                title: course.title,
                description: course.description,
                programId: typeof course.program === 'string' ? course.program : course.program._id,
            });
        } else {
            setFormData(initialFormData);
        }
        setIsModalOpen(true);
    };

    const handleDelete = (course: Course) => {
        toast("Are you sure you want to delete this course?", {
            description: "This action cannot be undone.",
            action: { label: "Delete", onClick: async () => {
                try {
                    await deleteCourse(course._id);
                    toast.success("Course deleted successfully.");
                    fetchData();
                } catch (err) { toast.error("Failed to delete the course."); }
            }},
            cancel: { label: "Cancel" }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingCourse) {
                await updateCourse(editingCourse._id, { title: formData.title, description: formData.description });
                toast.success("Course updated successfully.");
            } else {
                if (!file) {
                    toast.error("A course document is required to create a new course.");
                    setIsSubmitting(false);
                    return;
                }
                await createCourse({ ...formData, courseDocument: file });
                toast.success("Course created successfully. It is now pending approval.");
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "An error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
                    <p className="text-muted-foreground">Create, update, and manage the courses you teach.</p>
                </div>
                <Button onClick={() => handleOpenModal()}><Plus className="mr-2 h-4 w-4"/>Create New Course</Button>
            </div>

            <Card>
                <CardHeader><CardTitle>My Courses</CardTitle><CardDescription>A list of all courses you have created.</CardDescription></CardHeader>
                <CardContent>
                    {loading ? <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div> :
                    courses.length === 0 ? <p className="text-center py-10 text-muted-foreground">You haven't created any courses yet.</p> :
                    <div className="space-y-3">
                        {courses.map(course => (
                            <div key={course._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50/50">
                                <div className="flex items-center gap-4">
                                    <BookOpen className="h-6 w-6 text-primary"/>
                                    <div>
                                        <h4 className="font-semibold">{course.title}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Program: {(course.program as any)?.name || 'N/A'} | Status: <span className="font-medium">{course.status}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <a href={course.contentUrl} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon" title="Download Material"><Download className="h-4 w-4"/></Button></a>
                                    <Button variant="ghost" size="icon" title="Edit Course" onClick={() => handleOpenModal(course)}><Edit className="h-4 w-4"/></Button>
                                    <Button variant="ghost" size="icon" title="Delete Course" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(course)}><Trash2 className="h-4 w-4"/></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    }
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editingCourse ? 'Edit' : 'Create'} Course</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Program</Label>
                            <Select value={formData.programId} onValueChange={(v) => setFormData(f => ({...f, programId: v}))} required>
                                <SelectTrigger><SelectValue placeholder="Select a program for this course"/></SelectTrigger>
                                <SelectContent>{myPrograms.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2"><Label>Course Title</Label><Input value={formData.title} onChange={(e) => setFormData(f => ({...f, title: e.target.value}))} required/></div>
                         <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData(f => ({...f, description: e.target.value}))} required/></div>
                         {!editingCourse && (
                             <div className="space-y-2">
                                <Label>Course Document (PDF, etc.)</Label>
                                <Input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} required/>
                             </div>
                         )}
                         <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}{editingCourse ? 'Save Changes' : 'Create Course'}</Button>
                         </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}