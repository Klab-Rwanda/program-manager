"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Upload, FileText, Send, AlertCircle, CheckCircle, Clock, Plus, Loader2, Eye, Edit, Trash2, ExternalLink } from "lucide-react";
import {
  getMyCourses,
  createCourse,
  requestCourseApproval,
  updateCourse,
  deleteCourse
} from "@/lib/services/course.service";
import { Course, Program } from "@/types"; // Import Course and Program
import api from "@/lib/api"; // Ensure api is imported

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added AlertTitle
import { useAuth } from "@/lib/contexts/RoleContext";

export default function FacilitatorCourseManagementPage() {
    const { user, loading: authLoading } = useAuth();
    const [myCourses, setMyCourses] = useState<Course[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); // Added error state
    
    // Modals state
    const [isUploadOpen, setUploadOpen] = useState(false);
    const [isEditOpen, setEditOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [isViewDocumentOpen, setViewDocumentOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    // Forms state
    const [isSubmittingForm, setIsSubmittingForm] = useState(false); // Renamed to avoid clash
    const [isProcessingAction, setIsProcessingAction] = useState<string | null>(null); // For per-button loading state
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadData, setUploadData] = useState({ programId: "", title: "", description: "" });
    const [editData, setEditData] = useState({ title: "", description: "" });

    // Helper to get nested properties safely (e.g., course.program.name)
    const getNestedName = (obj: any, path: string): string => {
        const parts = path.split('.');
        let current = obj;
        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = (current as any)[part];
            } else {
                return 'N/A';
            }
        }
        return (current as string) || 'N/A';
    };

    // Helper to construct the direct URL to the document for viewing
    const getDocumentDirectUrl = (contentUrl: string): string => {
        // Assuming NEXT_PUBLIC_API_URL is something like 'http://localhost:8000/api/v1'
        // We need 'http://localhost:8000/'
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
        // Ensure the contentUrl is correctly formatted (replace backslashes for URLs)
        const cleanContentUrl = contentUrl.replace(/\\/g, '/');
        
        // If contentUrl already includes 'uploads/', avoid duplicating it
        // This check is important as backend might save 'uploads/filename.pdf' or 'filename.pdf'
        if (cleanContentUrl.startsWith('uploads/')) {
            return `${baseUrl}/${cleanContentUrl}`;
        }
        // Fallback, assuming files are directly in public/uploads (though backend should save 'uploads/filename')
        return `${baseUrl}/uploads/${cleanContentUrl}`; 
    };

    const fetchData = useCallback(async () => {
        if (!user) {
            setError("User not authenticated.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const [coursesData, programsData] = await Promise.all([
                getMyCourses(),
                api.get('/programs').then(res => res.data.data) // Fetch all programs for dropdown
            ]);
            setMyCourses(coursesData);
            setPrograms(programsData);
        } catch (err: any) {
            console.error("Facilitator Course Management: Error fetching data:", err);
            setError(err.response?.data?.message || "Failed to load your curriculum data.");
            toast.error(err.response?.data?.message || "Failed to load your curriculum data.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { 
        if (!authLoading) { // Fetch data only after auth status is known
            fetchData(); 
        }
    }, [authLoading, fetchData]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploadFile(e.target.files[0]);
        }
    };

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile || !uploadData.programId || !uploadData.title.trim()) {
            return toast.error("Please fill all required fields and select a file.");
        }
        setIsSubmittingForm(true); // Set submitting for the form

        const formData = new FormData();
        formData.append('title', uploadData.title);
        formData.append('description', uploadData.description);
        formData.append('programId', uploadData.programId);
        formData.append('courseDocument', uploadFile);

        try {
            await createCourse(formData);
            toast.success("Course created as a draft successfully!");
            setUploadOpen(false); // Close modal
            setUploadData({ programId: "", title: "", description: "" }); // Reset form
            setUploadFile(null); // Clear selected file
            fetchData(); // Refresh list
        } catch (err: any) {
            console.error("Facilitator Course Management: Error creating course:", err);
            toast.error(err.response?.data?.message || "Failed to create course.");
        } finally {
            setIsSubmittingForm(false); // Clear submitting state
        }
    };
    
    const handleUpdateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourse || !editData.title.trim()) {
            return toast.error("Title is a required field.");
        }
        setIsSubmittingForm(true); // Set submitting for the form
        try {
            await updateCourse(selectedCourse._id, editData);
            toast.success("Course updated successfully! Its status has been reset to Draft.");
            setEditOpen(false); // Close modal
            fetchData(); // Refresh list
        } catch (err: any) {
            console.error("Facilitator Course Management: Error updating course:", err);
            toast.error(err.response?.data?.message || "Failed to update course.");
        } finally {
            setIsSubmittingForm(false); // Clear submitting state
        }
    };
    
    const handleDeleteCourse = async () => {
        if (!selectedCourse) return;
        setIsProcessingAction(selectedCourse._id); // Set processing for this specific action
        try {
            await deleteCourse(selectedCourse._id);
            toast.success("Course deleted successfully.");
            setDeleteOpen(false); // Close modal
            fetchData(); // Refresh list
        } catch (err: any) {
            console.error("Facilitator Course Management: Error deleting course:", err);
            toast.error(err.response?.data?.message || "Failed to delete course.");
        } finally {
            setIsProcessingAction(null); // Clear processing state
        }
    };

    const handleRequestApproval = async (courseId: string) => {
      setIsProcessingAction(courseId); // Set processing for this specific action
      try {
          await requestCourseApproval(courseId);
          toast.success("Course submitted for approval!");
          fetchData(); // Refresh list
      } catch (err: any) {
          console.error("Facilitator Course Management: Error requesting approval:", err);
          toast.error(err.response?.data?.message || "Failed to submit course for approval.");
      } finally {
          setIsProcessingAction(null); // Clear processing state
      }
    };
    
    const openEditModal = (course: Course) => {
        setSelectedCourse(course);
        setEditData({ title: course.title, description: course.description || "" }); // Ensure description is a string
        setEditOpen(true);
    };

    const openDeleteModal = (course: Course) => {
        setSelectedCourse(course);
        setDeleteOpen(true);
    };

    const openViewDocumentModal = (course: Course) => {
        setSelectedCourse(course);
        setViewDocumentOpen(true);
    };

    const handleIframeError = () => {
        toast.error("Unable to display document. This might be due to browser limitations or an invalid file format. Please try downloading the file instead.");
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Draft': return <Badge variant="secondary" className="px-2 py-1 flex items-center gap-1">
                                    <Clock className="h-3 w-3 mr-1"/> Draft
                                  </Badge>;
            case 'PendingApproval': return <Badge className="bg-yellow-100 text-yellow-800 px-2 py-1 flex items-center gap-1">
                                            <Clock className="h-3 w-3 mr-1"/> Pending Approval
                                          </Badge>;
            case 'Approved': return <Badge className="bg-green-100 text-green-800 px-2 py-1 flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3"/> Approved
                                    </Badge>;
            case 'Rejected': return <Badge variant="destructive" className="px-2 py-1 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3"/> Rejected
                                    </Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    if (loading || authLoading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[60vh] bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading your courses...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-full min-h-[60vh] p-4 bg-background">
                <Alert variant="destructive" className="max-w-md text-center">
                    <AlertTitle>Error Loading Data</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Course Management</h1>
                    <p className="text-muted-foreground">Manage and submit your course materials for approval.</p>
                </div>
                <Button 
                    onClick={() => setUploadOpen(true)} 
                    className="bg-[#1f497d] hover:bg-[#1a3f6b] text-white shadow-md"
                >
                    <Plus className="mr-2 h-4 w-4" /> Upload New Course
                </Button>
            </div>

            {/* Courses List Section */}
            {myCourses.length === 0 ? (
                 <Card className="text-center py-12 bg-card shadow-sm border-dashed border-gray-300">
                    <CardContent>
                        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-foreground">No Courses Created Yet</h3>
                        <p className="text-muted-foreground">Click "Upload New Course" to get started.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {myCourses.map(course => {
                        const isEditable = course.status === 'Draft' || course.status === 'Rejected';
                        return (
                        <Card key={course._id} className="flex flex-col overflow-hidden bg-card shadow-sm hover:shadow-lg transition-shadow duration-200">
                            <CardHeader className="pb-3 border-b border-gray-100">
                                <div className="flex items-center justify-between gap-2">
                                    <CardTitle className="text-lg leading-snug text-foreground">{course.title}</CardTitle>
                                    {getStatusBadge(course.status)}
                                </div>
                                <CardDescription className="text-xs text-muted-foreground">Program: {getNestedName(course, 'program.name')}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-3 py-4 text-sm text-muted-foreground">
                                <p className="line-clamp-3 h-14">{course.description || 'No description provided.'}</p>
                                {course.status === 'Rejected' && course.rejectionReason && (
                                    <Alert variant="destructive" className="py-2 px-3 text-xs">
                                        <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                        <AlertDescription>
                                            <strong className="text-destructive">Reason:</strong> {course.rejectionReason}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                            <div className="p-4 pt-0 mt-auto">
                                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                                    {isEditable && (
                                        <Button 
                                            size="sm" 
                                            className="flex-1 min-w-[100px] bg-[#1f497d] hover:bg-[#1a3f6b] text-white" 
                                            onClick={() => handleRequestApproval(course._id)} 
                                            disabled={isProcessingAction === course._id}
                                        >
                                            {isProcessingAction === course._id ? <Loader2 className="h-4 w-4 mr-1 animate-spin"/> : <Send className="h-4 w-4 mr-1"/>}
                                            Submit
                                        </Button>
                                    )}
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="flex-1 min-w-[100px] border-[#1f497d] text-[#1f497d] hover:bg-[#1f497d]/10 hover:text-[#1f497d]" 
                                        onClick={() => openViewDocumentModal(course)}
                                    >
                                        <Eye className="h-4 w-4 mr-1"/> View
                                    </Button>
                                    {isEditable && (
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="flex-1 min-w-[100px] border-gray-400 text-gray-700 hover:bg-gray-100 hover:text-gray-800" 
                                            onClick={() => openEditModal(course)}
                                        >
                                            <Edit className="h-4 w-4 mr-1"/> Edit
                                        </Button>
                                    )}
                                    <Button 
                                        size="sm" 
                                        variant="destructive" 
                                        className="flex-1 min-w-[100px]" 
                                        onClick={() => openDeleteModal(course)}
                                        disabled={isProcessingAction === course._id}
                                    >
                                        {isProcessingAction === course._id ? <Loader2 className="h-4 w-4 mr-1 animate-spin"/> : <Trash2 className="h-4 w-4 mr-1"/>}
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )})}
                </div>
            )}

            {/* Upload Modal */}
            <Dialog open={isUploadOpen} onOpenChange={setUploadOpen}>
                <DialogContent className="sm:max-w-md bg-card p-6 rounded-lg shadow-xl">
                    <DialogHeader><DialogTitle className="text-xl font-bold text-foreground">Upload New Course Material</DialogTitle></DialogHeader>
                    <form onSubmit={handleCreateCourse} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="uploadProgramId" className="text-sm font-medium text-foreground">Program *</Label>
                            {programs.length > 0 ? (
                                <Select value={uploadData.programId} onValueChange={(v) => setUploadData(d => ({...d, programId: v}))} required>
                                    <SelectTrigger id="uploadProgramId" className="h-10 text-base"><SelectValue placeholder="Select a program"/></SelectTrigger>
                                    <SelectContent>{programs.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}</SelectContent>
                                </Select>
                            ) : (
                                <p className="text-muted-foreground text-sm p-3 border rounded-md bg-muted">No programs available. Please contact your Program Manager or ensure programs are created and active.</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="uploadTitle" className="text-sm font-medium text-foreground">Course Title *</Label>
                            <Input id="uploadTitle" placeholder="e.g., Introduction to React Hooks" value={uploadData.title} onChange={e => setUploadData(d=>({...d, title: e.target.value}))} required className="h-10 text-base"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="uploadDescription" className="text-sm font-medium text-foreground">Description</Label>
                            <Textarea id="uploadDescription" placeholder="A brief summary of the course content." value={uploadData.description} onChange={e => setUploadData(d=>({...d, description: e.target.value}))} rows={4} className="text-base"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="courseDocument" className="text-sm font-medium text-foreground">Course Document (PDF, DOCX, MP4, etc.) *</Label>
                            <Input id="courseDocument" type="file" onChange={handleFileChange} required className="h-10 text-base"/>
                        </div>
                        <DialogFooter className="mt-6 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setUploadOpen(false)} className="px-4 py-2">Cancel</Button>
                            <Button type="submit" disabled={isSubmittingForm} className="bg-[#1f497d] hover:bg-[#1a3f6b] text-white px-4 py-2">
                                {isSubmittingForm ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />} Upload as Draft
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-md bg-card p-6 rounded-lg shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-foreground">Edit Course Details</DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm">You can only edit courses in 'Draft' or 'Rejected' status. Updating will reset its status to 'Draft' for re-approval.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateCourse} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="editTitle" className="text-sm font-medium text-foreground">Course Title *</Label>
                            <Input id="editTitle" value={editData.title} onChange={e => setEditData(d=>({...d, title: e.target.value}))} required className="h-10 text-base"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="editDescription" className="text-sm font-medium text-foreground">Description</Label>
                            <Textarea id="editDescription" value={editData.description} onChange={e => setEditData(d=>({...d, description: e.target.value}))} rows={4} className="text-base"/>
                        </div>
                        <DialogFooter className="mt-6 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="px-4 py-2">Cancel</Button>
                            <Button type="submit" disabled={isSubmittingForm} className="bg-[#1f497d] hover:bg-[#1a3f6b] text-white px-4 py-2">
                                {isSubmittingForm ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Edit className="mr-2 h-4 w-4" />} Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-sm bg-card p-6 rounded-lg shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-foreground">Confirm Delete</DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm">
                           This action cannot be undone. This will permanently delete the course "<strong>{selectedCourse?.title}</strong>".
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setDeleteOpen(false)} className="px-4 py-2">Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteCourse} disabled={isProcessingAction === selectedCourse?._id} className="px-4 py-2">
                            {isProcessingAction === selectedCourse?._id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />} Delete Course
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Document Modal */}
            <Dialog open={isViewDocumentOpen} onOpenChange={setViewDocumentOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] w-[90vw] p-0 flex flex-col bg-card rounded-lg shadow-xl overflow-hidden">
                    <DialogHeader className="p-4 border-b border-gray-100 flex-shrink-0">
                        <DialogTitle className="text-lg font-bold text-foreground">Course Document: {selectedCourse?.title}</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            {selectedCourse?.contentUrl && (
                                <a 
                                    href={getDocumentDirectUrl(selectedCourse.contentUrl)} // Use the direct URL
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-[#1f497d] hover:underline flex items-center gap-1" // Adjusted text color
                                    download // Suggest download for non-viewable types
                                >
                                    Open in new tab / Download <ExternalLink className="h-3 w-3"/>
                                </a>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-grow overflow-hidden flex items-center justify-center bg-gray-50">
                        {selectedCourse?.contentUrl ? (
                            // Directly link to your server's file for display within the iframe
                            <iframe
                                src={getDocumentDirectUrl(selectedCourse.contentUrl)}
                                title={selectedCourse.title}
                                className="w-full h-full border-none"
                                onError={handleIframeError}
                                allowFullScreen
                            />
                        ) : (
                            <div className="text-center text-muted-foreground p-8">
                                <FileText className="mx-auto h-12 w-12 mb-4" />
                                No document to display.
                            </div>
                        )}
                    </div>
                    <DialogFooter className="p-4 border-t border-gray-100 flex-shrink-0 flex justify-end">
                        <Button variant="outline" onClick={() => setViewDocumentOpen(false)} className="px-4 py-2">Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}