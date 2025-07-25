"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Check, X, MessageSquare, FileText, User, BookOpen, Inbox } from "lucide-react";
import { getPendingCourses, approveCourse, rejectCourse } from "@/lib/services/course.service";
import { Course } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/lib/contexts/RoleContext";

export default function ApprovalsPage() {
    const { user, loading: authLoading } = useAuth();
    const [pendingCourses, setPendingCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isRejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

    const fetchPending = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getPendingCourses();
            setPendingCourses(data);
        } catch (err: any) {
            const message = err.response?.data?.message || "Failed to load pending approvals.";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading) {
            fetchPending();
        }
    }, [authLoading, fetchPending]);

    const handleApprove = async (courseId: string) => {
        setIsProcessingId(courseId);
        try {
            await approveCourse(courseId);
            toast.success("Course approved successfully!");
            // Refresh list by removing the approved course from the local state
            setPendingCourses(prev => prev.filter(c => c._id !== courseId));
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to approve course.");
        } finally {
            setIsProcessingId(null);
        }
    };

    const handleOpenRejectModal = (course: Course) => {
        setSelectedCourse(course);
        setRejectionReason("");
        setRejectModalOpen(true);
    };

    const handleReject = async () => {
        if (!selectedCourse || !rejectionReason.trim()) {
            return toast.error("Rejection reason cannot be empty.");
        }
        setIsProcessingId(selectedCourse._id);
        try {
            await rejectCourse(selectedCourse._id, rejectionReason);
            toast.success("Course rejected successfully.");
            setRejectModalOpen(false);
            // Refresh list by removing the rejected course
            setPendingCourses(prev => prev.filter(c => c._id !== selectedCourse._id));
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to reject course.");
        } finally {
            setIsProcessingId(null);
            setSelectedCourse(null);
        }
    };

    if (loading || authLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Pending Approvals</h1>
                <p className="text-muted-foreground">Review and action new course submissions from facilitators.</p>
            </div>

            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

            {!error && pendingCourses.length === 0 ? (
                <Card className="text-center py-16">
                    <CardContent>
                        <Inbox className="mx-auto h-12 w-12 text-green-500 mb-4" />
                        <h3 className="text-xl font-semibold">All Caught Up!</h3>
                        <p className="text-muted-foreground mt-2">There are no pending course submissions to review.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {pendingCourses.map(course => (
                        <Card key={course._id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle>{course.title}</CardTitle>
                                <CardDescription className="line-clamp-2 h-10">{course.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 flex-grow">
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground"/><span>Submitted by: <strong>{course.facilitator.name}</strong></span></div>
                                    <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-muted-foreground"/><span>For Program: <strong>{course.program.name}</strong></span></div>
                                </div>
                                <div className="flex items-center gap-2 pt-2 border-t">
                                    <FileText className="h-4 w-4 text-muted-foreground"/>
                                    <a 
                                      href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/${course.contentUrl.replace(/\\/g, '/')}`}
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-blue-600 hover:underline text-sm font-medium"
                                    >
                                        View Content Document
                                    </a>
                                </div>
                            </CardContent>
                             <div className="p-4 pt-0 mt-auto">
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => handleOpenRejectModal(course)} disabled={isProcessingId === course._id}>
                                        <X className="mr-2 h-4 w-4" /> Reject
                                    </Button>
                                    <Button onClick={() => handleApprove(course._id)} disabled={isProcessingId === course._id} className="bg-green-600 hover:bg-green-700">
                                        {isProcessingId === course._id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />}
                                        Approve
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            
            {/* Rejection Modal */}
            <Dialog open={isRejectModalOpen} onOpenChange={setRejectModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Course: {selectedCourse?.title}</DialogTitle>
                        <DialogDescription>Please provide a clear reason for the rejection. The facilitator will see this feedback.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="reason">Rejection Reason *</Label>
                        <Textarea id="reason" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="e.g., The content is outdated, missing key topics..." />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={!!isProcessingId}>
                            {isProcessingId === selectedCourse?._id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <X className="mr-2 h-4 w-4" />}
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}