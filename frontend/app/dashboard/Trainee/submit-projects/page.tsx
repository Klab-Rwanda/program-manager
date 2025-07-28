"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { FileText, Upload, Clock, CheckCircle, Loader2, BookOpen, User, Send, Download, X, Eye } from "lucide-react";
import { useAuth } from "@/lib/contexts/RoleContext";
import { Program, Assignment, Submission } from "@/types"; // Import Submission type
import api from "@/lib/api"; // For general API calls

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"; // Import Dialog


// Service functions (adjusted for new backend endpoints)
const getMyAvailableAssignments = async (): Promise<Assignment[]> => {
    const response = await api.get('/assignments/my-available');
    return response.data.data;
};

const getMySubmissions = async (): Promise<Submission[]> => {
    const response = await api.get('/submissions/my-submissions');
    return response.data.data;
};

const submitProjectFile = async (assignmentId: string, file: File): Promise<Submission> => {
    const formData = new FormData();
    formData.append('assignmentId', assignmentId);
    formData.append('projectFile', file);

    const response = await api.post('/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
};

// Helper function moved to top-level scope
const getOverallProjectStatus = (assignment: Assignment, mySubmissions: Submission[]): 'Not Started' | 'Pending Submission' | 'Submitted' | 'Reviewed' | 'Needs Revision' | 'Graded' => {
    const submission = mySubmissions.find(sub => 
        sub.assignment && typeof sub.assignment === 'object' && sub.assignment._id === assignment._id
    );
    if (!submission) {
        // Check if due date has passed
        if (new Date(assignment.dueDate) < new Date()) {
            return 'Not Started'; // Or 'Overdue'
        }
        return 'Pending Submission';
    }
    return submission.status as any; // Cast as it matches enum
};


export default function SubmitProjectsPage() {
    const { user, loading: authLoading } = useAuth();
    const [availableAssignments, setAvailableAssignments] = useState<Assignment[]>([]);
    const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter states for "My Past Submissions"
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    // State for Document Preview Modal
    const [isPreviewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewFileUrl, setPreviewFileUrl] = useState<string>("");
    const [previewFileName, setPreviewFileName] = useState<string>("");

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [assignmentsData, submissionsData] = await Promise.all([
                getMyAvailableAssignments(),
                getMySubmissions()
            ]);
            setAvailableAssignments(assignmentsData);
            setMySubmissions(submissionsData);
            
            // Auto-select the first assignment if available and no previous selection
            if (assignmentsData.length > 0 && !selectedAssignmentId) {
                setSelectedAssignmentId(assignmentsData[0]._id);
            }
        } catch (err) {
            toast.error("Failed to load data for project submission.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user, selectedAssignmentId]); // Include selectedAssignmentId as a dependency

    useEffect(() => { fetchData(); }, [fetchData]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSubmitProject = async () => {
        if (!selectedAssignmentId) {
            toast.error("Please select an assignment to submit for.");
            return;
        }
        if (!selectedFile) {
            toast.error("Please select a file to upload.");
            return;
        }
        
        setIsSubmitting(true);
        try {
            const result = await submitProjectFile(selectedAssignmentId, selectedFile);
            toast.success(`Project for "${(result.assignment as any)?.title || 'selected assignment'}" submitted successfully!`);
            setSelectedFile(null); // Clear file input
            // Clear the actual file input element
            const fileInput = document.getElementById('project-file') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

            fetchData(); // Refresh data to show new submission or updated status
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to submit project.");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'Submitted': return "bg-blue-100 text-blue-800";
            case 'Reviewed': return "bg-green-100 text-green-800";
            case 'NeedsRevision': return "bg-red-100 text-red-800";
            case 'Graded': return "bg-green-100 text-green-800"; // Or different color if 'Graded' is a separate visual status
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusBadge = (status: string) => {
        const Icon = status === 'Reviewed' || status === 'Graded' ? CheckCircle : status === 'NeedsRevision' ? X : Clock;
        return (
            <Badge className={`${getStatusBadgeColor(status)}`}>
                <Icon className="mr-1 h-3 w-3" />
                {status}
            </Badge>
        );
    };


    const filteredSubmissions = useMemo(() => {
        return mySubmissions.filter(submission => {
            const assignment = submission.assignment as Assignment; // Assuming assignment is populated
            const matchesSearch = searchTerm === '' ||
                                  (assignment?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (submission.program as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = filterStatus === 'all' || submission.status === filterStatus;

            return matchesSearch && matchesStatus;
        });
    }, [mySubmissions, searchTerm, filterStatus]);

    const openPreviewModal = (fileUrl: string, fileName: string) => {
        // Construct the full URL for the file to be previewed
        const fullPreviewUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/${fileUrl.replace(/\\/g, '/')}`;
        setPreviewFileUrl(fullPreviewUrl);
        setPreviewFileName(fileName);
        setPreviewModalOpen(true);
    };


    if (authLoading || loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Project Submissions</h1>
                <p className="text-muted-foreground">Submit your assignments for approved courses.</p>
            </div>

            <Tabs defaultValue="available-assignments" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="available-assignments">Available Assignments</TabsTrigger>
                    <TabsTrigger value="my-submissions">My Past Submissions</TabsTrigger>
                </TabsList>

                <TabsContent value="available-assignments" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Assignments to Submit</CardTitle>
                            <CardDescription>Select an assignment and upload your project file. You can re-submit for assignments marked "Submitted" or "Needs Revision".</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {availableAssignments.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No assignments currently available for submission.</p>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="assignment-select">Select Assignment</Label>
                                        <Select 
                                            value={selectedAssignmentId} 
                                            onValueChange={setSelectedAssignmentId}
                                        >
                                            <SelectTrigger id="assignment-select" className="max-w-xl">
                                                <SelectValue placeholder="Select an assignment to submit for..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableAssignments.map(asg => (
                                                    <SelectItem key={asg._id} value={asg._id}>
                                                        {asg.title} (Due: {new Date(asg.dueDate).toLocaleDateString()}) - {(asg.program as any)?.name || 'N/A'}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {selectedAssignmentId && (
                                            <p className="text-sm text-muted-foreground">
                                                Assignment Status: <Badge variant="outline">{getOverallProjectStatus(availableAssignments.find(a => a._id === selectedAssignmentId) as Assignment, mySubmissions)}</Badge>
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="project-file">Project File</Label>
                                        <Input 
                                            id="project-file" 
                                            type="file" 
                                            onChange={handleFileChange} 
                                            disabled={isSubmitting} 
                                            accept=".zip,.rar,.7z,.pdf,.docx,.txt" // Common project file types
                                        />
                                        {selectedFile && (
                                            <p className="text-sm text-muted-foreground">Selected: {selectedFile.name} ({ (selectedFile.size / 1024 / 1024).toFixed(2) } MB)</p>
                                        )}
                                    </div>

                                    <Button 
                                        onClick={handleSubmitProject} 
                                        disabled={isSubmitting || !selectedAssignmentId || !selectedFile}
                                        className="w-full"
                                    >
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4"/>}
                                        Submit Project
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="my-submissions" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>My Past Submissions</CardTitle>
                                <div className="flex space-x-2">
                                    <Input 
                                        placeholder="Search submissions..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="max-w-xs"
                                    />
                                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Filter by Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="Submitted">Submitted</SelectItem>
                                            <SelectItem value="Reviewed">Reviewed</SelectItem>
                                            <SelectItem value="NeedsRevision">Needs Revision</SelectItem>
                                            <SelectItem value="Graded">Graded</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <CardDescription>Review the status and feedback for your submitted projects.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {filteredSubmissions.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    {searchTerm || filterStatus !== "all" 
                                        ? "No submissions match your current filters."
                                        : "You haven't submitted any projects yet."}
                                </p>
                            ) : (
                                filteredSubmissions.map(sub => (
                                    <div key={sub._id} className="p-4 border rounded-lg bg-gray-50 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold">{(sub.assignment as any)?.title || 'Unknown Assignment'}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Program: {(sub.program as any)?.name || 'N/A'} | Course: {(sub.course as any)?.title || 'N/A'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</p>
                                            {sub.feedback && <p className="text-sm italic mt-2">Feedback: {sub.feedback}</p>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(sub.status)}
                                            {sub.grade !== undefined && sub.grade !== null && sub.grade !== '' && (
                                                <Badge variant="outline" className="text-lg font-bold text-green-600">{sub.grade}</Badge>
                                            )}
                                            {sub.fileUrl && (
                                                <>
                                                    <Button size="icon" variant="ghost" onClick={() => openPreviewModal(sub.fileUrl, `Submission for ${(sub.assignment as any)?.title || 'Unknown Assignment'}`)}>
                                                        <Eye className="h-4 w-4"/>
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Document Preview Modal */}
            <Dialog open={isPreviewModalOpen} onOpenChange={setPreviewModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw]">
                    <DialogHeader>
                        <DialogTitle>Preview: {previewFileName}</DialogTitle>
                        <DialogDescription>
                            Viewing the submitted document. If the file cannot be rendered, you may need to download it.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-grow w-full h-[calc(80vh-120px)] overflow-hidden rounded-md border bg-muted">
                        {/* Use iframe to embed the file. Adjust based on common file types. */}
                        {previewFileUrl.includes('.pdf') || previewFileUrl.includes('.txt') ? (
                            <iframe src={previewFileUrl} className="w-full h-full border-none"></iframe>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full">
                                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">Cannot preview this file type directly.</p>
                                <Button asChild className="mt-4">
                                    <a href={previewFileUrl} target="_blank" rel="noopener noreferrer" download={previewFileName}>
                                        <Download className="mr-2 h-4 w-4" /> Download Anyway
                                    </a>
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}