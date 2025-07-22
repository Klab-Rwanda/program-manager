// app/dashboard/reviews/page.tsx
"use client"

import { useState, useEffect, useCallback, useMemo } from "react" // Added useMemo
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
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner" // Import toast
import { Alert, AlertDescription } from "@/components/ui/alert" // For error display

import { useAuth } from "@/lib/contexts/RoleContext" // Import useAuth
import api from "@/lib/api" // Import api
import { Program as BackendProgram, Course as BackendCourse, User as BackendUser } from "@/types" // Import backend types

// Frontend-specific Submission interface (combines backend Course and Submission data)
interface Submission {
  _id: string; // Backend _id for the submission
  trainee: { _id: string; name: string; email: string }; // Populated trainee
  program: { _id: string; name: string }; // Populated program
  course: { _id: string; title: string; description: string }; // Populated course
  fileUrl: string; // URL to the submitted file/github
  submittedAt: string; // Submission timestamp
  status: 'Submitted' | 'Reviewed' | 'NeedsRevision'; // Backend status enum
  feedback?: string;
  grade?: string;
  // Frontend specific display fields
  studentName: string; // Derived from trainee.name
  projectTitle: string; // Derived from course.title
  programName: string; // Derived from program.name
  fileType: string; // Derived from fileUrl
  fileSize: string; // Mocked
  description: string; // From course.description
  priority: string; // Mocked
  projectDetails: { // Mocked detailed fields
    technologies: string[];
    features: string[];
    githubUrl?: string;
    liveUrl?: string;
  };
}

export default function ReviewsPage() { // Changed function name to ReviewsPage to match file and avoid conflict
  const { user, role, loading: authLoading } = useAuth(); // Get user and role

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null) // For review/view modals
  const [reviewStatus, setReviewStatus] = useState<string>("") // 'approved' or 'needs-revision'
  const [feedback, setFeedback] = useState("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [viewSubmissionOpen, setViewSubmissionOpen] = useState(false) // Controls view modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false) // Controls review modal

  // Fetch submissions relevant to the facilitator/manager
  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedSubmissions: Submission[] = [];

      if (role === 'facilitator') {
        // 1. Get programs assigned to this facilitator
        const programsRes = await api.get('/programs'); // This endpoint filters by facilitator.id on backend
        const facilitatorPrograms: BackendProgram[] = programsRes.data.data;

        // 2. For each program, get its approved courses and their submissions
        for (const program of facilitatorPrograms) {
          try {
            const coursesRes = await api.get(`/courses/program/${program._id}`);
            const courses: BackendCourse[] = coursesRes.data.data;

            for (const course of courses) {
              // Get submissions for THIS specific course
              const submissionsRes = await api.get(`/submissions/course/${course._id}`);
              const courseSubmissions: any[] = submissionsRes.data.data; // Backend returns raw submission objects

              // Transform backend submission to frontend display format
              courseSubmissions.forEach(sub => {
                const fileExtension = sub.fileUrl ? sub.fileUrl.split('.').pop()?.toLowerCase() : 'unknown';
                const fileType = fileExtension === 'zip' ? 'ZIP' : fileExtension === 'pdf' ? 'PDF' : 'UNKNOWN';
                const isGithubLink = sub.fileUrl.includes('github.com');

                fetchedSubmissions.push({
                  _id: sub._id,
                  trainee: sub.trainee, // Should be populated by backend
                  program: sub.program, // Should be populated by backend
                  course: sub.course,   // Should be populated by backend
                  fileUrl: sub.fileUrl,
                  submittedAt: sub.submittedAt,
                  status: sub.status, // Use backend status directly
                  feedback: sub.feedback,
                  grade: sub.grade,
                  // Frontend specific display fields (derived/mocked)
                  studentName: sub.trainee?.name || 'Unknown Trainee',
                  projectTitle: sub.course?.title || 'Untitled Project',
                  programName: sub.program?.name || 'Unknown Program',
                  fileType: fileType, // Derived
                  fileSize: (Math.random() * 20 + 1).toFixed(1) + ' MB', // Mocked size
                  description: sub.course?.description || 'No description provided.', // From course
                  priority: Math.random() > 0.7 ? 'High' : (Math.random() > 0.4 ? 'Medium' : 'Low'), // Mocked priority
                  projectDetails: { // Mocked or derived from course/submission data
                    technologies: ['React', 'Node.js', 'MongoDB', 'Express'], // Mocked
                    features: ['User Auth', 'Shopping Cart', 'Payment Integration'], // Mocked
                    githubUrl: isGithubLink ? sub.fileUrl : undefined,
                    liveUrl: !isGithubLink && sub.fileUrl ? sub.fileUrl : undefined // Assume non-github url could be live demo
                  }
                });
              });
            }
          } catch (innerErr: any) {
            console.warn(`Failed to fetch courses/submissions for program ${program.name}:`, innerErr.response?.data?.message || innerErr.message);
          }
        }
      } else if (role === 'program_manager' || role === 'super_admin') {
          // For PM/SA, you might want to fetch all submissions, or submissions for programs they manage.
          // Your backend's `getSubmissionsForCourse` is by courseId. There's no `/submissions/all`.
          // For simplicity, we'll return a static mock for PM/SA if not facilitator-specific.
          console.warn("Backend does not have a general 'get all submissions' endpoint for PM/SA. Using mock data.");
          const mockAdminSubmissions: Submission[] = [
            {
              _id: 'mock-sub-pm-1', trainee: { _id: 'tpm1', name: 'PM Alice', email: 'pm.alice@klab.rw' },
              program: { _id: 'pma', name: 'Web Dev Mastery' }, course: { _id: 'cpm1', title: 'PM React Project', description: 'Build a PM Dashboard' },
              fileUrl: 'https://github.com/pmalice/react-project', submittedAt: '2024-03-01T10:00:00Z', status: 'Submitted',
              studentName: 'PM Alice', projectTitle: 'PM React Project', programName: 'Web Dev Mastery', fileType: 'ZIP', fileSize: '10 MB', description: 'PM React Project description', priority: 'High',
              projectDetails: { technologies: ['React'], features: ['Dashboard'] }, githubUrl: 'https://github.com/pmalice/react-project'
            },
            {
              _id: 'mock-sub-pm-2', trainee: { _id: 'tpm2', name: 'PM Bob', email: 'pm.bob@klab.rw' },
              program: { _id: 'pmb', name: 'Data Science Bootcamp' }, course: { _id: 'cpm2', title: 'PM DS Analysis', description: 'Data Analysis Report' },
              fileUrl: 'https://example.com/reports/ds_analysis.pdf', submittedAt: '2024-02-28T14:00:00Z', status: 'Reviewed', feedback: 'Great insights!', grade: 'A',
              studentName: 'PM Bob', projectTitle: 'PM DS Analysis', programName: 'Data Science Bootcamp', fileType: 'PDF', fileSize: '5 MB', description: 'Data Analysis Report description', priority: 'Medium',
              projectDetails: { technologies: ['Python'], features: ['Reporting'] }, liveUrl: 'https://example.com/reports/ds_analysis.pdf'
            },
          ];
          setSubmissions(mockAdminSubmissions);
      } else {
        setSubmissions([]); // Clear submissions if role is not facilitator, PM, or SA
      }

    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load project submissions.");
      toast.error(err.response?.data?.message || "Failed to load project submissions.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [role]); // Depend on role to refetch appropriately

  useEffect(() => {
    if (!authLoading && (role === 'facilitator' || role === 'program_manager' || role === 'super_admin')) {
      fetchSubmissions();
    }
  }, [authLoading, role, fetchSubmissions]);


  // UI Helpers
  const reviewStats = useMemo(() => [
    { title: "Pending Reviews", value: submissions.filter(s => s.status === 'Submitted').length.toString(), description: "Awaiting your review", icon: Clock, color: "text-yellow-500" },
    { title: "Approved", value: submissions.filter(s => s.status === 'Reviewed' && s.grade).length.toString(), description: "Graded & Approved", icon: CheckCircle, color: "text-green-500" },
    { title: "Needs Revision", value: submissions.filter(s => s.status === 'NeedsRevision').length.toString(), description: "Requires changes", icon: XCircle, color: "text-red-500" },
  ], [submissions]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Reviewed": return "bg-green-500"
      case "NeedsRevision": return "bg-red-500"
      case "Submitted": return "bg-yellow-500" // For review status, "Submitted" means "Pending Review"
      default: return "bg-gray-500"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "text-red-500"
      case "Medium": return "text-yellow-500"
      case "Low": return "text-green-500"
      default: return "text-gray-500"
    }
  }

  // Handlers
  const handleReview = (submission: Submission) => {
    setSelectedSubmission(submission)
    // Set initial review status based on current status
    if (submission.status === 'NeedsRevision') {
      setReviewStatus('needs-revision');
    } else if (submission.status === 'Reviewed') {
      setReviewStatus('approved'); // If already reviewed, default to approved
    } else {
      setReviewStatus(''); // Default empty for new submissions
    }
    setFeedback(submission.feedback || "")
    setReviewModalOpen(true);
  }

  const handleViewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission)
    setViewSubmissionOpen(true)
  }

  const submitReview = async () => {
    if (!selectedSubmission) return;
    if (!reviewStatus) {
      toast.error("Please select a review status.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      // Map frontend selection to backend enum values
      const statusToSend = reviewStatus === 'approved' ? 'Reviewed' : 'NeedsRevision';
      const gradeToSend = reviewStatus === 'approved' ? (selectedSubmission.grade || 'A') : undefined; // Keep existing grade if present, or mock if approved

      await api.patch(`/submissions/${selectedSubmission._id}/review`, {
        status: statusToSend,
        feedback: feedback,
        grade: gradeToSend
      });
      toast.success("Review submitted successfully!");
      setReviewModalOpen(false);
      setSelectedSubmission(null);
      setReviewStatus("");
      setFeedback("");
      fetchSubmissions(); // Re-fetch data to update UI

    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit review. Please try again.");
      console.error(err);
    } finally {
      setIsSubmittingReview(false);
    }
  }

  const handleExportReviews = () => {
    // This would ideally call a backend endpoint for report generation (Excel/PDF)
    // For now, it exports the current table view as CSV, similar to other exports.
    const csvContent = [
      ["Student", "Project", "Program", "Status", "Submission Date", "Priority"],
      ...submissions.map((sub) => [
        sub.studentName,
        sub.projectTitle,
        sub.programName, // Use programName
        sub.status,
        new Date(sub.submittedAt).toLocaleDateString(),
        sub.priority,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `project-reviews-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast.success("Reviews exported successfully!")
  }

  // Render nothing or a loading spinner if authentication is still loading
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Access control: Only facilitators, program managers, or super admins should see this page
  if (!user || (role !== 'facilitator' && role !== 'program_manager' && role !== 'super_admin')) {
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
        <h1 className="text-lg font-semibold">Project Reviews</h1>
        <Button variant="outline" onClick={handleExportReviews}>
          <Download className="mr-2 h-4 w-4" />
          Export Reviews
        </Button>
      </div>

      {error && ( // Display general error messages
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
                {error}
                <Button variant="ghost" size="sm" onClick={() => setError(null)}><XCircle className="h-4 w-4" /></Button>
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
          ) : submissions.length === 0 ? (
            <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No project submissions to review</h3>
                <p className="text-muted-foreground text-center">
                    Students will submit projects here for your review.
                </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {/* Use trainee email for avatar for consistent image generation */}
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
                        <p className="font-medium text-foreground">{submission.projectTitle}</p>
                        <p className="text-xs text-muted-foreground">{submission.description}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{submission.programName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(submission.status)} text-white border-0`}>
                        {submission.status === 'Submitted' ? 'Pending Review' : (submission.status === 'Reviewed' ? 'Approved' : 'Needs Revision')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${getPriorityColor(submission.priority)}`}>
                        {submission.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleViewSubmission(submission)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => window.open(submission.fileUrl, '_blank')}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleReview(submission)}>
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
              Provide feedback for {selectedSubmission?.trainee?.name || 'the student'}'s project
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-foreground">{selectedSubmission.projectTitle}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedSubmission.description}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Program: {selectedSubmission.programName}</span>
                  <span>
                    File: {selectedSubmission.fileType} • {selectedSubmission.fileSize}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Submitted: {new Date(selectedSubmission.submittedAt).toLocaleDateString()}</span>
                    <span>Status: <Badge className={`${getStatusColor(selectedSubmission.status)} text-white border-0`}>
                        {selectedSubmission.status === 'Submitted' ? 'Pending Review' : (selectedSubmission.status === 'Reviewed' ? 'Approved' : 'Needs Revision')}
                    </Badge></span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Review Status</Label>
                <Select value={reviewStatus} onValueChange={setReviewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select review status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="needs-revision">Needs Revision</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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

              <div className="flex gap-2">
                <Button onClick={submitReview} disabled={isSubmittingReview || !reviewStatus} className="flex-1">
                  {isSubmittingReview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Review"}
                </Button>
                <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Submission Dialog (remains largely unchanged) */}
      <Dialog open={viewSubmissionOpen} onOpenChange={setViewSubmissionOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
            <DialogDescription>
              Detailed view of {selectedSubmission?.trainee?.name || 'the student'}'s project submission
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Project Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Title:</span>
                      <span className="ml-2 font-medium">{selectedSubmission.projectTitle}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Student:</span>
                      <span className="ml-2 font-medium">{selectedSubmission.trainee?.name || 'Unknown Trainee'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Program:</span>
                      <span className="ml-2 font-medium">{selectedSubmission.programName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Submitted:</span>
                      <span className="ml-2 font-medium">
                        {new Date(selectedSubmission.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">File Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <span className="ml-2 font-medium">{selectedSubmission.fileType}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Size:</span>
                      <span className="ml-2 font-medium">{selectedSubmission.fileSize}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={`ml-2 ${getStatusColor(selectedSubmission.status)} text-white border-0`}>
                        {selectedSubmission.status === 'Submitted' ? 'Pending Review' : (selectedSubmission.status === 'Reviewed' ? 'Approved' : 'Needs Revision')}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Priority:</span>
                      <span className={`ml-2 font-medium ${getPriorityColor(selectedSubmission.priority)}`}>
                        {selectedSubmission.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedSubmission.description}</p>
              </div>

              {selectedSubmission.projectDetails && (
                <>
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Technologies Used</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSubmission.projectDetails.technologies.map((tech: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-2">Features</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {selectedSubmission.projectDetails.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {(selectedSubmission.projectDetails.githubUrl || selectedSubmission.projectDetails.liveUrl) && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Links</h4>
                      <div className="space-y-2">
                        {selectedSubmission.projectDetails.githubUrl && (
                          <div>
                            <span className="text-muted-foreground text-sm">GitHub:</span>
                            <a
                              href={selectedSubmission.projectDetails.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-500 hover:underline text-sm"
                            >
                              {selectedSubmission.projectDetails.githubUrl}
                            </a>
                          </div>
                        )}
                        {selectedSubmission.projectDetails.liveUrl && (
                          <div>
                            <span className="text-muted-foreground text-sm">Live Demo:</span>
                            <a
                              href={selectedSubmission.projectDetails.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-500 hover:underline text-sm"
                            >
                              {selectedSubmission.projectDetails.liveUrl}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {selectedSubmission.feedback && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">Facilitator Feedback</h4>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">{selectedSubmission.feedback}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => handleReview(selectedSubmission)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Review Project
                </Button>
                <Button variant="outline" onClick={() => setViewSubmissionOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}