"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, CheckCircle, XCircle, MessageSquare, Download, Eye, Loader2 } from "lucide-react";
import api from "@/lib/api";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

// --- Type Definitions ---
interface Submission {
    _id: string;
    trainee: { _id: string; name: string; email: string; };
    program: { name: string; };
    course: { title: string; };
    fileUrl: string;
    submittedAt: string;
    status: 'Submitted' | 'Reviewed' | 'NeedsRevision';
    feedback?: string;
    grade?: string;
}

interface ReviewFormData {
    status: 'Reviewed' | 'NeedsRevision';
    feedback: string;
    grade: string;
}

export default function ReviewsPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reviewFormData, setReviewFormData] = useState<ReviewFormData>({ status: 'Reviewed', feedback: '', grade: '' });

    const fetchSubmissions = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/submissions/my-reviews');
            setSubmissions(response.data.data);
        } catch (error) {
            console.error("Failed to fetch submissions:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    const handleOpenReviewModal = (submission: Submission) => {
        setSelectedSubmission(submission);
        setReviewFormData({ status: 'Reviewed', feedback: '', grade: '' });
        setIsReviewModalOpen(true);
    };

    const handleSubmitReview = async () => {
        if (!selectedSubmission) return;
        setIsSubmitting(true);
        try {
            await api.patch(`/submissions/${selectedSubmission._id}/review`, reviewFormData);
            alert("Review submitted successfully!");
            setIsReviewModalOpen(false);
            fetchSubmissions(); // Refresh the list
        } catch (err: any) {
            alert(`Error: ${err.response?.data?.message || "Failed to submit review."}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap: { [key: string]: string } = {
            'Reviewed': 'bg-green-100 text-green-800',
            'Submitted': 'bg-yellow-100 text-yellow-800',
            'NeedsRevision': 'bg-red-100 text-red-800',
        };
        return <Badge className={statusMap[status]}>{status.replace('Revision', ' Revision')}</Badge>;
    };

    const stats = {
        pending: submissions.filter(s => s.status === 'Submitted').length,
        approved: submissions.filter(s => s.status === 'Reviewed').length,
        needsRevision: submissions.filter(s => s.status === 'NeedsRevision').length,
    };

    return (
        <div className="flex flex-1 flex-col gap-4 p-4">
            <h1 className="text-3xl font-bold tracking-tight">Project Reviews</h1>

            <div className="grid gap-4 md:grid-cols-3">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pending Reviews</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{stats.pending}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Approved</CardTitle><CheckCircle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{stats.approved}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Needs Revision</CardTitle><XCircle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{stats.needsRevision}</div></CardContent></Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Submissions Queue</CardTitle><CardDescription>Review and provide feedback on trainee projects.</CardDescription></CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Project</TableHead><TableHead>Program</TableHead><TableHead>Submitted</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {submissions.map((sub) => (
                                    <TableRow key={sub._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8"><AvatarFallback>{sub.trainee.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                                                <div><p className="font-medium">{sub.trainee.name}</p><p className="text-xs text-muted-foreground">{sub.trainee.email}</p></div>
                                            </div>
                                        </TableCell>
                                        <TableCell><p className="font-medium">{sub.course.title}</p></TableCell>
                                        <TableCell className="text-muted-foreground">{sub.program.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{new Date(sub.submittedAt).toLocaleDateString()}</TableCell>
                                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button asChild variant="ghost" size="sm"><a href={sub.fileUrl} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a></Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleOpenReviewModal(sub)}><MessageSquare className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>Review Project</DialogTitle><DialogDescription>Provide feedback for {selectedSubmission?.trainee.name}'s project: {selectedSubmission?.course.title}</DialogDescription></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2"><Label>Review Status</Label><Select value={reviewFormData.status} onValueChange={v => setReviewFormData(f => ({ ...f, status: v as any }))}><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectItem value="Reviewed">Approved</SelectItem><SelectItem value="NeedsRevision">Needs Revision</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label>Grade (e.g., A+, B, 85%)</Label><Input value={reviewFormData.grade} onChange={e => setReviewFormData(f => ({ ...f, grade: e.target.value }))} placeholder="Enter a grade or score" /></div>
                        <div className="space-y-2"><Label>Feedback</Label><Textarea placeholder="Provide detailed feedback..." value={reviewFormData.feedback} onChange={e => setReviewFormData(f => ({ ...f, feedback: e.target.value }))} rows={4} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsReviewModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmitReview} disabled={isSubmitting} style={{ backgroundColor: '#1f497d' }} className="hover:bg-[#1a3d6b]">{isSubmitting ? <Loader2 className="animate-spin" /> : "Submit Review"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}