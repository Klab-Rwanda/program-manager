"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Upload, FileText, Send, AlertCircle, CheckCircle, Clock, Plus, Loader2, Eye, Edit, Trash2 } from "lucide-react";
import {
  getMyCourses, // This now fetches courses for Active/Completed programs
  createCourse,
  requestCourseApproval,
  updateCourse,
  deleteCourse
} from "@/lib/services/course.service";
import { Course, Program as BackendProgram } from "@/types"; // Import BackendProgram for status
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // NEW: Import Tabs

// Extend Course type to ensure program is populated with status
interface EnhancedCourse extends Course {
    program: BackendProgram; // Ensure program is populated with status
}

export default function FacilitatorCourseManagementPage() {
    const { user } = useAuth();
    const [myCourses, setMyCourses] = useState<EnhancedCourse[]>([]); // Use EnhancedCourse
    const [programs, setPrograms] = useState<BackendProgram[]>([]); // Use BackendProgram
    const [loading, setLoading] = useState(true);
    
    // Modals state
    const [isUploadOpen, setUploadOpen] = useState(false);
    const [isEditOpen, setEditOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [isViewDocumentOpen, setViewDocumentOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<EnhancedCourse | null>(null); // Use EnhancedCourse

    // Forms state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isProcessingId, setIsProcessingId] = useState<string | null>(null); // For per-button loading state
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadData, setUploadData] = useState({ programId: "", title: "", description: "" });
    const [editData, setEditData] = useState({ title: "", description: "" });

    const [activeTab, setActiveTab] = useState("active"); // NEW: State for active tab

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [coursesData, programsData] = await Promise.all([
                getMyCourses(), // This now fetches courses for Active/Completed programs
                // Fetch ALL programs for the dropdowns (create/edit)
                api.get('/programs').then(res => res.data.data) 
            ]);
            setMyCourses(coursesData as EnhancedCourse[]); // Cast to EnhancedCourse
            setPrograms(programsData);
        } catch (err) {
            toast.error("Failed to load your curriculum data.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // NEW: Memoized lists for active and completed courses
    const activeCourses = useMemo(() => 
        myCourses.filter(course => (course.program as BackendProgram)?.status === 'Active'), 
        [myCourses]
    );
    const completedCourses = useMemo(() => 
        myCourses.filter(course => (course.program as BackendProgram)?.status === 'Completed'), 
        [myCourses]
    );

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
            await createCourse(formData); // Backend enforces Active program status
            toast.success("Course created as a draft successfully!");
            setUploadOpen(false);
            setUploadData({ programId: "", title: "", description: "" });
            setUploadFile(null);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to create course.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleUpdateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourse || !editData.title) {
            return toast.error("Title is a required field.");
        }
        setIsSubmitting(true);
        try {
            await updateCourse(selectedCourse._id, editData); // Backend enforces Active program status
            toast.success("Course updated successfully! Its status has been reset to Draft.");
            setEditOpen(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update course.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteCourse = async () => {
        if (!selectedCourse) return;
        setIsSubmitting(true);
        try {
            await deleteCourse(selectedCourse._id); // Backend enforces Active program status
            toast.success("Course deleted successfully.");
            setDeleteOpen(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to delete course.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestApproval = async (courseId: string) => {
      setIsProcessingId(courseId);
      try {
          await requestCourseApproval(courseId); // Backend enforces Active program status
          toast.success("Course submitted for approval!");
          fetchData();
      } catch (err: any) {
          toast.error(err.response?.data?.message || "Failed to submit course for approval.");
      } finally {
          setIsProcessingId(null);
      }
    };
    
    const openEditModal = (course: EnhancedCourse) => { // Use EnhancedCourse
        setSelectedCourse(course);
        setEditData({ title: course.title, description: course.description });
        setEditOpen(true);
    };

    const openDeleteModal = (course: EnhancedCourse) => { // Use EnhancedCourse
        setSelectedCourse(course);
        setDeleteOpen(true);
    };

    const openViewDocumentModal = (course: EnhancedCourse) => { // Use EnhancedCourse
        setSelectedCourse(course);
        setViewDocumentOpen(true);
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
                    <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
                    <p className="text-muted-foreground">Manage and submit your course materials for approval.</p>
                </div>
                {/* Only allow creating new courses if the 'Active' tab is selected,
                    implying they are creating for active programs. */}
                <Button onClick={() => setUploadOpen(true)} className="bg-[#1f497d] hover:bg-[#1a3f6b]" disabled={activeTab !== 'active'}>
                    <Plus className="mr-2 h-4 w-4" /> Upload New Course
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="active">Active Courses ({activeCourses.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed Programs Courses ({completedCourses.length})</TabsTrigger>
                </TabsList>

                {/* Active Courses Tab Content */}
                <TabsContent value="active" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Active Programs Courses</CardTitle></CardHeader>
                        <CardContent>
                            {loading ? <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div> :
                            activeCourses.length === 0 ? <p className="text-center py-10 text-muted-foreground">No active courses found.</p> :
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {activeCourses.map(course => {
                                    const isEditable = course.status === 'Draft' || course.status === 'Rejected';
                                    return (
                                        <Card key={course._id} className="flex flex-col">
                                            <CardHeader>
                                                <div className="flex justify-between items-start">
                                                    <CardTitle className="pr-2">{course.title}</CardTitle>
                                                    {getStatusBadge(course.status)}
                                                </div>
                                                <CardDescription>{(course.program as BackendProgram).name}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4 flex-grow">
                                                <p className="text-sm text-muted-foreground line-clamp-2 h-10">{course.description}</p>
                                                {course.status === 'Rejected' && course.rejectionReason && (
                                                    <Alert variant="destructive">
                                                        <AlertDescription>
                                                            <strong>Reason:</strong> {course.rejectionReason}
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                            </CardContent>
                                            <div className="p-4 pt-0 mt-auto">
                                                <div className="flex gap-2 border-t pt-4">
                                                    {isEditable && (
                                                        <Button size="sm" className="flex-1" onClick={() => handleRequestApproval(course._id)} disabled={!!isProcessingId}>
                                                            {isProcessingId === course._id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                                                            Submit for Approval
                                                        </Button>
                                                    )}
                                                    <Button 
                                                        size="sm" 
                                                        variant="secondary" 
                                                        className="flex-1" 
                                                        onClick={() => openViewDocumentModal(course)}
                                                    >
                                                        <Eye className="h-4 w-4 text-blue-600"/> View Document
                                                    </Button>
                                                    {isEditable && (
                                                        <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditModal(course)}><Edit className="h-4 w-4"/></Button>
                                                    )}
                                                    <Button size="sm" variant="destructive" className="flex-1" onClick={() => openDeleteModal(course)}><Trash2 className="h-4 w-4"/></Button>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        }
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Completed Programs Courses Tab Content */}
                <TabsContent value="completed" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Courses from Completed Programs</CardTitle></CardHeader>
                        <CardContent>
                            {loading ? <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div> :
                            completedCourses.length === 0 ? <p className="text-center py-10 text-muted-foreground">No courses found for completed programs.</p> :
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {completedCourses.map(course => (
                                    <Card key={course._id} className="flex flex-col opacity-70"> {/* Visual cue for disabled */}
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="pr-2">{course.title}</CardTitle>
                                                {getStatusBadge(course.status)}
                                            </div>
                                            <CardDescription>{(course.program as BackendProgram).name} (Completed)</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4 flex-grow">
                                            <p className="text-sm text-muted-foreground line-clamp-2 h-10">{course.description}</p>
                                            {course.status === 'Rejected' && course.rejectionReason && (
                                                <Alert variant="destructive">
                                                    <AlertDescription>
                                                        <strong>Reason:</strong> {course.rejectionReason}
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </CardContent>
                                        <div className="p-4 pt-0 mt-auto">
                                            <div className="flex gap-2 border-t pt-4">
                                                {/* Action buttons disabled for completed program courses */}
                                                <Button size="sm" className="flex-1" disabled title="Program is completed. Cannot submit.">
                                                    <Send className="h-4 w-4"/> Submit for Approval
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="secondary" 
                                                    className="flex-1" 
                                                    onClick={() => openViewDocumentModal(course)}
                                                >
                                                    <Eye className="h-4 w-4 text-blue-600"/> View Document
                                                </Button>
                                                <Button size="sm" variant="outline" className="flex-1" disabled title="Program is completed. Cannot edit."><Edit className="h-4 w-4"/></Button>
                                                <Button size="sm" variant="destructive" className="flex-1" disabled title="Program is completed. Cannot delete."><Trash2 className="h-4 w-4"/></Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        }
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Upload Modal */}
            <Dialog open={isUploadOpen} onOpenChange={setUploadOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Upload New Course Material</DialogTitle></DialogHeader>
                    <form onSubmit={handleCreateCourse} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Program *</Label>
                            {/* Filter programs in dropdown to only show Active ones for new course creation */}
                            <Select value={uploadData.programId} onValueChange={(v) => setUploadData(d => ({...d, programId: v}))} required>
                                <SelectTrigger><SelectValue placeholder="Select an active program"/></SelectTrigger>
                                <SelectContent>
                                    {programs
                                        .filter(p => p.status === 'Active') // Only show active programs for creation
                                        .map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Course Title *</Label>
                            <Input placeholder="e.g., Introduction to React Hooks" value={uploadData.title} onChange={e => setUploadData(d=>({...d, title: e.target.value}))} required/>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea placeholder="A brief summary of the course content." value={uploadData.description} onChange={e => setUploadData(d=>({...d, description: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Course Document (PDF, etc.) *</Label>
                            <Input type="file" onChange={handleFileChange} required/>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />} Upload as Draft
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Course Details</DialogTitle>
                        <DialogDescription>You can only edit courses in 'Draft' or 'Rejected' status, and only if the program is active.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateCourse} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Program</Label>
                            {/* Display program name, but disable selection as program cannot be changed */}
                            <Input value={selectedCourse?.program?.name || 'N/A'} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Course Title *</Label>
                            <Input value={editData.title} onChange={e => setEditData(d=>({...d, title: e.target.value}))} required/>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={editData.description} onChange={e => setEditData(d=>({...d, description: e.target.value}))} />
                        </div>
                        <p className="text-xs text-muted-foreground">Note: Updating this course will reset its status to 'Draft' for re-approval.</p>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Edit className="mr-2 h-4 w-4" />} Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                           This action cannot be undone. This will permanently delete the course "<strong>{selectedCourse?.title}</strong>".
                           Note: You can only delete courses if their program is active.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteCourse} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />} Delete Course
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Document Modal (remains the same) */}
            <Dialog open={isViewDocumentOpen} onOpenChange={setViewDocumentOpen}>
                <DialogContent className="max-w-2xl max-h-[75vh] w-[85vw] mx-auto">
                    <DialogHeader className="pb-2">
                        <DialogTitle className="text-lg">Course Details: {selectedCourse?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="mt-2 p-4">
                        {selectedCourse ? (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Course Information</h3>
                                    <div className="space-y-2">
                                        <p><strong>Title:</strong> {selectedCourse.title}</p>
                                        <p><strong>Program:</strong> {selectedCourse.program?.name}</p>
                                        <p><strong>Status:</strong> {selectedCourse.status}</p>
                                        {selectedCourse.description && (
                                            <div>
                                                <strong>Description:</strong>
                                                <p className="mt-1 text-gray-700">{selectedCourse.description}</p>
                                            </div>
                                        )}
                                        {selectedCourse.rejectionReason && (
                                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                                                <strong className="text-red-800">Rejection Reason:</strong>
                                                <p className="mt-1 text-red-700">{selectedCourse.rejectionReason}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-[50vh] border rounded-md bg-gray-50">
                                <div className="text-center">
                                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                    <p className="text-gray-500">No course information available</p>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}