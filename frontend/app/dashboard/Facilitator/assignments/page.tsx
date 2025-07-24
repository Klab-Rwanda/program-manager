"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Loader2, Calendar, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMyCreatedAssignments, createAssignment, updateAssignment, deleteAssignment } from "@/lib/services/assignment.service";
import { getMyCourses } from "@/lib/services/course.service"; // To get courses for the dropdown
import { Assignment, Course } from "@/types";

const initialFormData = { title: "", description: "", courseId: "", dueDate: "", maxGrade: 100 };

export default function AssignmentManagementPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [myCourses, setMyCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
    const [formData, setFormData] = useState<any>(initialFormData);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [assignmentsData, coursesData] = await Promise.all([getMyCreatedAssignments(), getMyCourses()]);
            setAssignments(assignmentsData);
            setMyCourses(coursesData);
        } catch (err) {
            toast.error("Failed to load data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleOpenModal = (assignment: Assignment | null = null) => {
        setEditingAssignment(assignment);
        if (assignment) {
            setFormData({
                title: assignment.title,
                description: assignment.description,
                courseId: typeof assignment.course === 'string' ? assignment.course : assignment.course._id,
                dueDate: new Date(assignment.dueDate).toISOString().split('T')[0],
                maxGrade: assignment.maxGrade,
            });
        } else {
            setFormData(initialFormData);
        }
        setIsModalOpen(true);
    };

    const handleDelete = (assignment: Assignment) => {
        toast("Are you sure you want to delete this assignment?", {
            action: { label: "Delete", onClick: async () => {
                try {
                    await deleteAssignment(assignment._id);
                    toast.success("Assignment deleted.");
                    fetchData();
                } catch (err) { toast.error("Failed to delete assignment."); }
            }},
            cancel: { label: "Cancel" }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingAssignment) {
                await updateAssignment(editingAssignment._id, formData);
                toast.success("Assignment updated.");
            } else {
                await createAssignment(formData);
                toast.success("Assignment created.");
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Operation failed.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Assignment Management</h1>
                    <p className="text-muted-foreground">Create and manage assignments for your courses.</p>
                </div>
                <Button onClick={() => handleOpenModal()}><Plus className="mr-2 h-4 w-4"/>Create Assignment</Button>
            </div>

            <Card>
                <CardHeader><CardTitle>My Assignments</CardTitle></CardHeader>
                <CardContent>
                    {loading ? <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div> :
                    assignments.length === 0 ? <p className="text-center py-10 text-muted-foreground">You haven't created any assignments yet.</p> :
                    <div className="space-y-3">
                        {assignments.map(assignment => (
                            <div key={assignment._id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <h4 className="font-semibold">{assignment.title}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        <BookOpen className="inline h-4 w-4 mr-1"/>
                                        {(assignment.course as any)?.title} - {(assignment.program as any)?.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        <Calendar className="inline h-4 w-4 mr-1"/>
                                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(assignment)}><Edit className="h-4 w-4"/></Button>
                                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(assignment)}><Trash2 className="h-4 w-4"/></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    }
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editingAssignment ? 'Edit' : 'Create'} Assignment</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Course</Label>
                            <Select value={formData.courseId} onValueChange={(v) => setFormData(f => ({...f, courseId: v}))} required>
                                <SelectTrigger><SelectValue placeholder="Select a course"/></SelectTrigger>
                                <SelectContent>{myCourses.map(c => <SelectItem key={c._id} value={c._id}>{c.title}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2"><Label>Title</Label><Input value={formData.title} onChange={(e) => setFormData(f => ({...f, title: e.target.value}))} required/></div>
                         <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData(f => ({...f, description: e.target.value}))} required/></div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={formData.dueDate} onChange={(e) => setFormData(f => ({...f, dueDate: e.target.value}))} required/></div>
                            <div className="space-y-2"><Label>Max Grade</Label><Input type="number" value={formData.maxGrade} onChange={(e) => setFormData(f => ({...f, maxGrade: parseInt(e.target.value)}))} required/></div>
                         </div>
                         <DialogFooter><Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}{editingAssignment ? 'Save Changes' : 'Create'}</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}