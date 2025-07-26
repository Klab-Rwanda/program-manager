"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Loader2, Calendar, BookOpen, CheckCircle, Clock, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMyCreatedAssignments, createAssignment, updateAssignment, deleteAssignment, resendAssignmentToTrainees } from "@/lib/services/assignment.service";
import { getMyCourses } from "@/lib/services/course.service"; // To get courses for the dropdown
import { getApprovedRoadmaps } from "@/lib/services/roadmap.service"; // To get approved roadmaps for the dropdown
import { Assignment, Course, Roadmap } from "@/types";

const initialFormData = { title: "", description: "", courseId: "", roadmapId: "", dueDate: "", maxGrade: 100 };

export default function AssignmentManagementPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [myCourses, setMyCourses] = useState<Course[]>([]);
    const [approvedRoadmaps, setApprovedRoadmaps] = useState<Roadmap[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
    const [formData, setFormData] = useState<any>(initialFormData);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [assignmentsData, coursesData, roadmapsData] = await Promise.all([
                getMyCreatedAssignments(), 
                getMyCourses(),
                getApprovedRoadmaps()
            ]);
            setAssignments(assignmentsData);
            setMyCourses(coursesData);
            setApprovedRoadmaps(roadmapsData);
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
                roadmapId: typeof assignment.roadmap === 'string' ? assignment.roadmap : assignment.roadmap._id,
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

    const handleResendNotifications = async (assignment: Assignment) => {
        try {
            const result = await resendAssignmentToTrainees(assignment._id);
            if (result.success) {
                toast.success(`Notifications resent to ${result.sentCount} trainees!`);
                fetchData(); // Refresh to update the sent status
            } else {
                toast.error("Failed to resend notifications.");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to resend notifications.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate all required fields
        if (!formData.title?.trim()) {
            toast.error("Please enter a title for the assignment.");
            return;
        }
        
        if (!formData.courseId) {
            toast.error("Please select a course.");
            return;
        }
        
        if (!formData.roadmapId) {
            toast.error("Please select a weekly roadmap.");
            return;
        }
        
        if (!formData.dueDate) {
            toast.error("Please select a due date.");
            return;
        }
        
        // Validate description is not empty (check for actual content, not just HTML tags)
        const descriptionText = formData.description.replace(/<[^>]*>/g, '').trim();
        if (!descriptionText) {
            toast.error("Please enter a description for the assignment.");
            return;
        }
        
        setIsSubmitting(true);
        try {
            console.log('=== FRONTEND DEBUG ===');
            console.log('Form data being sent:', formData);
            
            if (editingAssignment) {
                await updateAssignment(editingAssignment._id, formData);
                toast.success("Assignment updated.");
            } else {
                const result = await createAssignment(formData);
                toast.success("Assignment created and sent to trainees!");
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err: any) {
            console.error('Assignment creation error:', err);
            console.error('Error response:', err.response?.data);
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
                                        Week {(assignment.roadmap as any)?.weekNumber}: {(assignment.roadmap as any)?.title}
                                    </p>
                                                                         <p className="text-xs text-muted-foreground mt-1">
                                         <Calendar className="inline h-4 w-4 mr-1"/>
                                         Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                     </p>
                                     <div className="mt-2 flex items-center gap-2">
                                         {assignment.sentToTrainees ? (
                                             <div className="flex items-center gap-1 text-xs text-green-600">
                                                 <CheckCircle className="h-3 w-3" />
                                                 <span>Sent to trainees</span>
                                                 {assignment.sentToTraineesAt && (
                                                     <span className="text-gray-500">
                                                         ({new Date(assignment.sentToTraineesAt).toLocaleDateString()})
                                                     </span>
                                                 )}
                                             </div>
                                         ) : (
                                             <div className="flex items-center gap-1 text-xs text-orange-600">
                                                 <Clock className="h-3 w-3" />
                                                 <span>Not sent to trainees</span>
                                             </div>
                                         )}
                                     </div>
                                     <div className="mt-2 text-sm text-gray-600 prose prose-sm max-w-none">
                                         <div dangerouslySetInnerHTML={{ __html: assignment.description }} />
                                     </div>
                                </div>
                                                                 <div className="flex gap-2">
                                     <Button variant="ghost" size="icon" onClick={() => handleOpenModal(assignment)}><Edit className="h-4 w-4"/></Button>
                                     <Button 
                                         variant="ghost" 
                                         size="icon" 
                                         className="text-blue-500" 
                                         onClick={() => handleResendNotifications(assignment)}
                                         title="Resend to trainees"
                                     >
                                         <Send className="h-4 w-4"/>
                                     </Button>
                                     <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(assignment)}><Trash2 className="h-4 w-4"/></Button>
                                 </div>
                            </div>
                        ))}
                    </div>
                    }
                </CardContent>
            </Card>

                         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                 <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                     <DialogHeader><DialogTitle>{editingAssignment ? 'Edit' : 'Create'} Assignment</DialogTitle></DialogHeader>
                                          <form onSubmit={handleSubmit} className="space-y-3 py-2">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             <div className="space-y-1">
                                 <Label className="text-sm">Course</Label>
                                 <Select value={formData.courseId} onValueChange={(v) => setFormData(f => ({...f, courseId: v, roadmapId: ""}))} required>
                                     <SelectTrigger className="h-9"><SelectValue placeholder="Select a course"/></SelectTrigger>
                                     <SelectContent>{myCourses.map(c => <SelectItem key={c._id} value={c._id}>{c.title}</SelectItem>)}</SelectContent>
                                 </Select>
                             </div>
                             <div className="space-y-1">
                                 <Label className="text-sm">Weekly Roadmap</Label>
                                 <Select value={formData.roadmapId} onValueChange={(v) => setFormData(f => ({...f, roadmapId: v}))} required>
                                     <SelectTrigger className="h-9"><SelectValue placeholder="Select a weekly roadmap"/></SelectTrigger>
                                     <SelectContent>
                                         {approvedRoadmaps
                                             .filter(roadmap => !formData.courseId || 
                                                 (typeof roadmap.course === 'object' && roadmap.course._id === formData.courseId) ||
                                                 (typeof roadmap.course === 'string' && roadmap.course === formData.courseId))
                                             .map(roadmap => (
                                                 <SelectItem key={roadmap._id} value={roadmap._id}>
                                                     Week {roadmap.weekNumber}: {roadmap.title} 
                                                     {typeof roadmap.program === 'object' && ` (${roadmap.program.name})`}
                                                     {typeof roadmap.course === 'object' && ` - ${roadmap.course.title}`}
                                                 </SelectItem>
                                             ))}
                                     </SelectContent>
                                 </Select>
                             </div>
                         </div>
                         <div className="space-y-1">
                             <Label className="text-sm">Title</Label>
                             <Input value={formData.title} onChange={(e) => setFormData(f => ({...f, title: e.target.value}))} required className="h-9"/>
                         </div>
                         <div className="space-y-1">
                             <Label className="text-sm">Description</Label>
                             <RichTextEditor 
                                 value={formData.description} 
                                 onChange={(value) => setFormData(f => ({...f, description: value}))}
                                 placeholder="Enter assignment description with rich formatting..."
                             />
                         </div>
                         <div className="grid grid-cols-2 gap-3">
                             <div className="space-y-1">
                                 <Label className="text-sm">Due Date</Label>
                                 <Input type="date" value={formData.dueDate} onChange={(e) => setFormData(f => ({...f, dueDate: e.target.value}))} required className="h-9"/>
                             </div>
                             <div className="space-y-1">
                                 <Label className="text-sm">Max Grade</Label>
                                 <Input type="number" value={formData.maxGrade} onChange={(e) => setFormData(f => ({...f, maxGrade: parseInt(e.target.value)}))} required className="h-9"/>
                             </div>
                         </div>
                         <DialogFooter><Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}{editingAssignment ? 'Save Changes' : 'Create'}</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}