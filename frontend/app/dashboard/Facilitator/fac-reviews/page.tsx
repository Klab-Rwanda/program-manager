"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Clock, CheckCircle, XCircle, MessageSquare, Download, Eye, Loader2, AlertCircle, Trash2, Edit } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner" 
import { Input } from "@/components/ui/input" // Added Input for search

import { useAuth } from "@/lib/contexts/RoleContext" 
import { getSubmissionsForFacilitator, reviewSubmission } from "@/lib/services/submission.service"
import { Submission as BackendSubmission } from "@/types"


// Frontend-specific Submission interface (enhanced to map backend data for display)
interface SubmissionDisplay {
  _id: string; // Backend _id for the submission
  trainee: { _id: string; name: string; email: string }; // Populated trainee
  program: { _id: string; name: string }; // Populated program
  course: { _id: string; title: string }; // Populated course
  assignment: { _id: string; title: string; description?: string; maxGrade?: number; dueDate?: string; }; // Populated assignment
  fileUrl: string; // URL to the submitted file/github
  submittedAt: string; // Submission timestamp
  status: 'Submitted' | 'Reviewed' | 'NeedsRevision' | 'Graded'; // Backend status enum
  feedback?: string;
  grade?: string | number; // Can be string or number from backend
  
  // Derived fields for display convenience
  studentName: string; 
  assignmentTitle: string; 
  programName: string;
  courseTitle: string;
  fileExtension: string; // Derived from fileUrl for display
  maxGrade: number; // Derived from assignment.maxGrade
}

export default function ReviewsPage() { 
  const { user, role, loading: authLoading } = useAuth(); 

  const [submissions, setSubmissions] = useState<SubmissionDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDisplay | null>(null) // For review/view modals
  const [reviewStatus, setReviewStatus] = useState<string>("") // 'Reviewed' or 'NeedsRevision'
  const [feedback, setFeedback] = useState("")
  const [grade, setGrade] = useState<string>(""); // Store as string for input
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [viewSubmissionOpen, setViewSubmissionOpen] = useState(false) 
  const [reviewModalOpen, setReviewModalOpen] = useState(false) 

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch submissions relevant to the facilitator
  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedSubmissions: BackendSubmission[] = await getSubmissionsForFacilitator();

      // Transform backend submission to frontend display format
      const transformedSubmissions: SubmissionDisplay[] = fetchedSubmissions.map(sub => {
        const fileExtension = sub.fileUrl ? sub.fileUrl.split('.').pop()?.toLowerCase() : 'N/A';
        
        return {
          _id: sub._id,
          trainee: sub.trainee as any, // Cast assuming it's populated
          program: sub.program as any, // Cast assuming it's populated
          course: sub.course as any,   // Cast assuming it's populated
          assignment: sub.assignment as any, // Cast assuming it's populated
          fileUrl: sub.fileUrl,
          submittedAt: sub.submittedAt,
          status: sub.status,
          feedback: sub.feedback,
          grade: sub.grade,
          
          // Derived fields
          studentName: (sub.trainee as any)?.name || 'Unknown Trainee',
          assignmentTitle: (sub.assignment as any)?.title || 'Untitled Assignment',
          programName: (sub.program as any)?.name || 'Unknown Program',
          courseTitle: (sub.course as any)?.title || 'Unknown Course',
          fileExtension: fileExtension,
          maxGrade: (sub.assignment as any)?.maxGrade || 100, // Default max grade
        };
      });
      setSubmissions(transformedSubmissions);

    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load project submissions.");
      toast.error(err.response?.data?.message || "Failed to load project submissions.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []); 

  useEffect(() => {
    if (!authLoading && role === 'facilitator') {
      fetchSubmissions();
    }
  }, [authLoading, role, fetchSubmissions]);


  // UI Helpers
  const reviewStats = useMemo(() => [
    { title: "Pending Reviews", value: submissions.filter(s => s.status === 'Submitted').length.toString(), description: "Awaiting your review", icon: Clock, color: "text-yellow-500" },
    { title: "Approved", value: submissions.filter(s => s.status === 'Reviewed').length.toString(), description: "Graded & Approved", icon: CheckCircle, color: "text-green-500" },
    { title: "Needs Revision", value: submissions.filter(s => s.status === 'NeedsRevision').length.toString(), description: "Requires changes", icon: XCircle, color: "text-red-500" },
  ], [submissions]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Reviewed": return "bg-green-500"
      case "NeedsRevision": return "bg-red-500"
      case "Submitted": return "bg-yellow-500" // For review status, "Submitted" means "Pending Review"
      case "Graded": return "bg-blue-500" // Should be same as Reviewed typically
      default: return "bg-gray-500"
    }
  }

  // Filtered submissions for display
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(submission => {
      const matchesSearch = searchTerm === '' || 
                            submission.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            submission.trainee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            submission.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === "all" || 
                            submission.status === filterStatus ||
                            (filterStatus === 'Pending Review' && submission.status === 'Submitted'); // Map 'Pending Review' filter to 'Submitted' status

      return matchesSearch && matchesStatus;
    });
  }, [submissions, searchTerm, filterStatus]);


  // Handlers
  const handleReview = (submission: SubmissionDisplay) => {
    setSelectedSubmission(submission)
    // Set initial review status based on current status
    if (submission.status === 'NeedsRevision') {
      setReviewStatus('NeedsRevision');
    } else if (submission.status === 'Reviewed' || submission.status === 'Graded') { // Consider 'Graded' same as 'Reviewed' for review purposes
      setReviewStatus('Reviewed'); 
    } else {
      setReviewStatus(''); // Clear for new submissions
    }
    setFeedback(submission.feedback || "")
    setGrade(submission.grade?.toString() || ""); // Convert to string for input
    setReviewModalOpen(true);
  }

  const handleViewSubmission = (submission: SubmissionDisplay) => {
    setSelectedSubmission(submission)
    setViewSubmissionOpen(true)
  }

  const submitReview = async () => {
    if (!selectedSubmission) return;
    if (!reviewStatus) {
      toast.error("Please select a review status.");
      return;
    }
    // Validate grade only if status is 'Reviewed'
    let gradeToSend: string | number | undefined = undefined;
    if (reviewStatus === 'Reviewed') {
        const numericGrade = parseFloat(grade);
        if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > (selectedSubmission.maxGrade || 100)) {
            toast.error(`Please enter a valid grade between 0 and ${selectedSubmission.maxGrade || 100}.`);
            return;
        }
        gradeToSend = numericGrade;
    } else {
        gradeToSend = null; // Set grade to null if requesting revision
    }

    setIsSubmittingReview(true);
    try {
      await reviewSubmission(selectedSubmission._id, {
        status: reviewStatus as 'Reviewed' | 'NeedsRevision',
        feedback: feedback,
        grade: gradeToSend // Pass the prepared grade
      });
      toast.success("Review submitted successfully!");
      setReviewModalOpen(false);
      setSelectedSubmission(null);
      setReviewStatus("");
      setFeedback("");
      setGrade("");
      fetchSubmissions(); // Re-fetch data to update UI

    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit review. Please try again.");
      console.error(err);
    } finally {
      setIsSubmittingReview(false);
    }
  }

  const handleDownloadFile = (fileUrl: string) => {
    // Construct the full URL for download
    const fullDownloadUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/${fileUrl.replace(/\\/g, '/')}`;
    window.open(fullDownloadUrl, '_blank');
  };


  // Render nothing or a loading spinner if authentication is still loading
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Access control: Only facilitators should see this page
  if (!user || role !== 'facilitator') {
    return (
        <Card>
            <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">You do not have permission to view this page.</p></CardContent>
        </Card>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-3xl font-bold tracking-tight">Project Reviews</h1>
        <Button type="button" variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Reviews
        </Button>
      </div>

      {error && ( 
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
                {error}
                <Button type="button" variant="ghost" size="sm" onClick={() => setError(null)}><XCircle className="h-4 w-4" /></Button>
            </AlertDescription>
        </Alert>
      )}

      {/* Review Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {reviewStats.map((stat, index) => (
          <Card key={index} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
            <CardTitle>Filter Submissions</CardTitle>
            <CardDescription>Search by student or assignment, or filter by status.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
                <Input 
                    placeholder="Search students, assignments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Submitted">Pending Review</SelectItem>
                        <SelectItem value="Reviewed">Reviewed</SelectItem>
                        <SelectItem value="NeedsRevision">Needs Revision</SelectItem>
                        {/* Optionally add "Graded" if you want a separate filter for it */}
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Project Submissions</CardTitle>
          <CardDescription>Review and provide feedback on trainee projects</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredSubmissions.length === 0 ? ( // Use filteredSubmissions here
            <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No project submissions found</h3>
                <p className="text-muted-foreground text-center">
                    {searchTerm || filterStatus !== "all" 
                        ? "No submissions match your current filters."
                        : "Students will submit projects here for your review."}
                </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Program/Course</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission) => ( // Iterate over filteredSubmissions
                  <TableRow key={submission._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={submission.trainee?.email ? `https://api.dicebear.com/7.x/initials/svg?seed=${submission.trainee.email}` : "/placeholder.svg"}
                            alt={submission.trainee?.name || 'N/A'}
                          />
                          <AvatarFallback className="text-xs">
                            {submission.trainee?.name
                              ? submission.trainee.name.split(" ").map((n) => n[0]).join("")
                              : 'NA'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{submission.trainee?.name || 'Unknown Trainee'}</p>
                          <p className="text-xs text-muted-foreground">{submission.trainee?.email || 'N/A'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{submission.assignmentTitle}</p>
                        <p className="text-xs text-muted-foreground">Due: {new Date(submission.assignment?.dueDate || '').toLocaleDateString()}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                        {submission.programName}<br/>
                        <span className="text-xs">{submission.courseTitle}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusBadgeColor(submission.status)} text-white border-0`}>
                        {submission.status === 'Submitted' ? 'Pending Review' : (submission.status === 'Reviewed' ? 'Approved' : 'Needs Revision')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                        {submission.grade !== undefined && submission.grade !== null && submission.grade !== '' ? (
                            <Badge variant="outline" className="text-sm font-semibold text-green-600">
                                {submission.grade}{submission.maxGrade ? `/${submission.maxGrade}` : ''}
                            </Badge>
                        ) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleViewSubmission(submission)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleDownloadFile(submission.fileUrl)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleReview(submission)}>
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Project Dialog */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Project</DialogTitle>
            <DialogDescription>
              Provide feedback for {selectedSubmission?.studentName || 'the student'}'s project
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-foreground">{selectedSubmission.assignmentTitle}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedSubmission.assignment?.description || 'No description provided.'}
                </p>
                <div className="grid grid-cols-2 gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Program: {selectedSubmission.programName}</span>
                  <span>Course: {selectedSubmission.courseTitle}</span>
                  <span>Submitted: {new Date(selectedSubmission.submittedAt).toLocaleDateString()}</span>
                  <span>File: {selectedSubmission.fileExtension}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewStatus">Review Status</Label>
                <Select value={reviewStatus} onValueChange={setReviewStatus}>
                  <SelectTrigger id="reviewStatus">
                    <SelectValue placeholder="Select review status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Reviewed">Approve / Grade</SelectItem>
                    <SelectItem value="NeedsRevision">Request Revision</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {reviewStatus === 'Reviewed' && (
                <div className="space-y-2">
                    <Label htmlFor="grade">Grade (0-{selectedSubmission.maxGrade})</Label>
                    <Input 
                        id="grade"
                        type="number" 
                        value={grade} 
                        onChange={(e) => setGrade(e.target.value)} 
                        placeholder={`Enter grade (e.g., 90)`}
                        min={0}
                        max={selectedSubmission.maxGrade}
                    />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback (Optional)</Label>
                <Textarea
                  id="feedback"
                  placeholder="Provide detailed feedback for the student..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setReviewModalOpen(false)} disabled={isSubmittingReview}>
                  Cancel
                </Button>
                <Button type="submit" onClick={submitReview} disabled={isSubmittingReview || !reviewStatus}>
                  {isSubmittingReview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Review"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Submission Dialog */}
      <Dialog open={viewSubmissionOpen} onOpenChange={setViewSubmissionOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Project Details: {selectedSubmission?.assignmentTitle}</DialogTitle>
            <DialogDescription>
              Detailed view of {selectedSubmission?.studentName || 'the student'}'s project submission
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Submission Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Student:</span>
                      <span className="ml-2 font-medium">{selectedSubmission.studentName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Program:</span>
                      <span className="ml-2 font-medium">{selectedSubmission.programName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Course:</span>
                      <span className="ml-2 font-medium">{selectedSubmission.courseTitle}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Submitted:</span>
                      <span className="ml-2 font-medium">
                        {new Date(selectedSubmission.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Assignment Due:</span>
                        <span className="ml-2 font-medium">
                            {new Date(selectedSubmission.assignment?.dueDate || '').toLocaleDateString()}
                        </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Review Status</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Current Status:</span>
                      <Badge className={`ml-2 ${getStatusBadgeColor(selectedSubmission.status)} text-white border-0`}>
                        {selectedSubmission.status === 'Submitted' ? 'Pending Review' : (selectedSubmission.status === 'Reviewed' ? 'Approved' : 'Needs Revision')}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Grade:</span>
                      <span className="ml-2 font-medium">
                        {selectedSubmission.grade !== undefined && selectedSubmission.grade !== null && selectedSubmission.grade !== '' 
                         ? `${selectedSubmission.grade}${selectedSubmission.maxGrade ? `/${selectedSubmission.maxGrade}` : ''}` 
                         : 'Not Graded'}
                      </span>
                    </div>
                    {selectedSubmission.assignment?.description && (
                         <div>
                             <span className="text-muted-foreground">Assignment Description:</span>
                             <p className="mt-1 text-xs text-muted-foreground italic line-clamp-3">
                                 {selectedSubmission.assignment.description}
                             </p>
                         </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedSubmission.feedback && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">Facilitator Feedback</h4>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">{selectedSubmission.feedback}</p>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button type="button" onClick={() => handleReview(selectedSubmission)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Review Project
                </Button>
                <Button type="button" variant="outline" onClick={() => setViewSubmissionOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}