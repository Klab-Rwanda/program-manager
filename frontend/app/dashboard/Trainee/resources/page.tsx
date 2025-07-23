// app/dashboard/Trainee/submit-projects/page.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Calendar, CheckCircle, Clock, Github, Upload, AlertCircle, FileText, Star, MessageSquare, Eye, X, Download, Plus, Search, Filter, Send, Loader2 } from "lucide-react"; // Added Loader2
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner"; // Import toast

import { useAuth } from "@/lib/contexts/RoleContext"; // Import useAuth
import api from "@/lib/api"; // Import api

// Frontend-specific Project interface (combines backend Course and Submission data)
interface Project {
  id: string; // Course _id
  title: string; // Course title
  description: string; // Course description
  program: string; // Program name (derived from populated program.name)
  programId: string; // Program _id (for backend API calls)
  dueDate: string; // Derived due date for assignment (mocked for now, usually on Course model)
  submittedDate?: string; // Submission submittedAt
  status: 'Pending' | 'Submitted' | 'In Review' | 'Graded'; // Derived status
  grade?: string; // Submission grade
  feedback?: string; // Submission feedback
  files?: Array<{ // Mocked files as backend Submission only has fileUrl
    id: number;
    name: string;
    size: string;
    type: string;
    uploadedAt: string;
  }>;
  instructor: string; // Facilitator name (derived from populated facilitator.name)
  requirements: string[]; // Mocked (usually on Course model)
  maxGrade: number; // Mocked (usually on Course model)
  githubUrl?: string; // If submission is a GitHub URL
}

// Frontend-specific UploadedFile (for UI state during upload)
interface UploadedFile {
  id: string;
  file: File;
  size: string;
  type: string;
  progress: number;
}

export default function SubmitProjectsPage() {
  const { user, role, loading: authLoading } = useAuth(); // Get user and role

  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
  const [selectedProjectForSubmission, setSelectedProjectForSubmission] = useState<Project | null>(null); // For the submission modal
  const [submissionType, setSubmissionType] = useState("file"); // Default submission type
  const [githubUrl, setGithubUrl] = useState("");
  const [submissionDescription, setSubmissionDescription] = useState(""); // Description specific to this submission
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false); // For file upload progress

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProgram, setFilterProgram] = useState("all");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingProject, setViewingProject] = useState<Project | null>(null); // For the detailed view modal

  const [allProjects, setAllProjects] = useState<Project[]>([]); // All projects assigned to trainee
  const [isLoadingProjects, setIsLoadingProjects] = useState(true); // Loading state for projects data
  const [error, setError] = useState<string | null>(null); // Error state for API calls

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all projects assigned to the current trainee
  const fetchTraineeProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    setError(null);
    try {
      if (role !== 'trainee') { // Ensure only trainee can fetch
        setAllProjects([]);
        return;
      }
      const response = await api.get('/submissions/my-assignments'); // Calls the new backend endpoint
      setAllProjects(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load your projects and assignments.");
      toast.error(err.response?.data?.message || "Failed to load your projects.");
      console.error(err);
    } finally {
      setIsLoadingProjects(false);
    }
  }, [role]); // Depends on role to re-fetch if role changes

  useEffect(() => {
    if (!authLoading && role === 'trainee') {
      fetchTraineeProjects();
    }
  }, [authLoading, role, fetchTraineeProjects]);

  // Filtered projects for display
  const filteredProjects = allProjects.filter((project) => {
    const matchesSearch = searchTerm.toLowerCase() === '' || project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || project.status === filterStatus;
    const matchesProgram = filterProgram === "all" || project.program === filterProgram;
    return matchesSearch && matchesStatus && matchesProgram;
  });

  const pendingProjects = filteredProjects.filter(p => p.status === "Pending");
  const submittedProjects = filteredProjects.filter(p => p.status === "Submitted" || p.status === "In Review");
  const gradedProjects = filteredProjects.filter(p => p.status === "Graded");

  // UI Helpers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Submitted":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle className="h-3 w-3 mr-1" />
          Submitted
        </Badge>;
      case "In Review":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400">
          <Clock className="h-3 w-3 mr-1" />
          In Review
        </Badge>;
      case "Pending":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400">
          <AlertCircle className="h-3 w-3 mr-1" />
          Pending
        </Badge>;
      case "Graded":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            Graded
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    // Set both to start of day for accurate day diff
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // For simplicity, handle only one file at a time or the first selected file.
      // Your backend's `createSubmission` currently takes a single `projectFile`
      const file = files[0];
      if (file) {
        setUploadedFiles([{
          id: `file-${Date.now()}`,
          file: file,
          size: formatFileSize(file.size),
          type: file.type || "unknown",
          progress: 0
        }]);
      }
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleSubmitSubmission = async () => {
    if (!selectedProjectForSubmission) {
      toast.error("Please select a project to submit.");
      return;
    }

    if (submissionType === "github" && !githubUrl.trim()) {
      toast.error("Please provide a GitHub URL.");
      return;
    }

    if (submissionType === "file" && uploadedFiles.length === 0) {
      toast.error("Please upload at least one file.");
      return;
    }

    if (!submissionDescription.trim()) {
      toast.error("Please provide a project description.");
      return;
    }

    setIsUploading(true); // Start loading for submission
    try {
      const formData = new FormData();
      formData.append('courseId', selectedProjectForSubmission.id); // Backend expects courseId
      formData.append('programId', selectedProjectForSubmission.programId); // Backend expects programId

      // Note: Your backend's `createSubmission` only takes `courseId`, `programId`, `fileUrl`.
      // It does NOT have a field for `description` or `comments` on the `Submission` model itself.
      // If `description` is meant to be stored per submission, your backend `Submission` model needs
      // to be extended, and the `createSubmission` controller needs to handle it.
      // For now, `submissionDescription` is passed but might be ignored by the backend unless adjusted.
      // For GitHub submissions, `fileUrl` will contain the URL.
      if (submissionType === "file") {
        // As per backend `upload.single('projectFile')`, we send one file.
        formData.append('projectFile', uploadedFiles[0].file); // 'projectFile' matches multer field name
      } else if (submissionType === "github") {
        formData.append('fileUrl', githubUrl); // 'fileUrl' for GitHub link (which will be saved to fileUrl field)
      }

      const response = await api.post('/submissions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Important for file uploads
        },
        // Progress for frontend UI
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadedFiles(prev => prev.map(file => ({ ...file, progress: percentCompleted })));
          }
        },
      });

      if (response.data.success) {
        toast.success(response.data.message || "Project submitted successfully!");
        fetchTraineeProjects(); // Refresh the list of projects to show updated status
        setIsSubmissionOpen(false); // Close the modal
        // Reset form states
        setSelectedProjectForSubmission(null);
        setSubmissionType("file");
        setGithubUrl("");
        setSubmissionDescription("");
        setUploadedFiles([]);
      } else {
        toast.error(response.data.message || "Failed to submit project.");
      }

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "An error occurred during submission.";
      toast.error(errorMessage);
      console.error("Submission error:", err);
    } finally {
      setIsUploading(false); // End loading
    }
  };

  const openSubmissionModal = (project: Project) => {
    setSelectedProjectForSubmission(project);
    setIsSubmissionOpen(true);
    // Pre-fill with project description from assignment or previous submission if available
    setSubmissionDescription(project.description || "");
    setGithubUrl(project.githubUrl || ""); // Pre-fill with existing GitHub URL
    setUploadedFiles([]); // Clear previous files
  };

  const openViewModal = (project: Project) => {
    setViewingProject(project);
    setShowViewModal(true);
  };

  const getGradeColor = (grade: string | undefined) => {
    if (!grade) return "text-gray-600";
    if (grade.includes("A")) return "text-green-600";
    if (grade.includes("B")) return "text-blue-600";
    if (grade.includes("C")) return "text-yellow-600";
    return "text-red-600";
  };

  // Render nothing or a loading spinner if authentication is still loading
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Access control: Only trainees should see this page
  if (!user || role !== 'trainee') {
    return (
        <Card>
            <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">You do not have permission to view this page.</p></CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Submissions</h1>
          <p className="text-muted-foreground">
            Submit your projects and track their review status
          </p>
        </div>
        <Button onClick={() => openSubmissionModal(pendingProjects.length > 0 ? pendingProjects[0] : allProjects[0])} // Pre-select first pending or first overall
                disabled={pendingProjects.length === 0 || isUploading} // Disable if no pending projects or currently uploading
        >
          <Upload className="mr-2 h-4 w-4" />
          Submit Project
        </Button>
      </div>

      {error && ( // Display general error messages
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
                {error}
                <Button type="button" variant="ghost" size="sm" onClick={() => setError(null)}><XCircle className="h-4 w-4" /></Button>
            </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter projects by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="In Review">In Review</SelectItem>
                <SelectItem value="Graded">Graded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {/* Dynamically list programs available to the trainee from fetched projects */}
                {Array.from(new Set(allProjects.map(p => p.program))).map(programName => (
                    <SelectItem key={programName} value={programName}>{programName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Project Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allProjects.length}</div>
            <p className="text-xs text-muted-foreground">
              Total assigned
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submittedProjects.length}</div>
            <p className="text-xs text-muted-foreground">
              Projects submitted
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingProjects.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting submission
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Graded</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradedProjects.length}</div>
            <p className="text-xs text-muted-foreground">
              Projects with feedback
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      {isLoadingProjects ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground text-center">
              Try adjusting your search or filter criteria, or check your assigned programs.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const daysUntilDue = getDaysUntilDue(project.dueDate);
            const isOverdue = daysUntilDue < 0 && project.status === "Pending";

            return (
              <Card key={project.id} className={`relative ${isOverdue ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20" : ""}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    {getStatusBadge(project.status)}
                  </div>
                  <CardDescription>{project.program}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.description && (
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Due: {new Date(project.dueDate).toLocaleDateString()}</span>
                    </div>
                    {/* Mock milestone for now */}
                    <Badge variant="outline" className="text-xs">Milestone</Badge>
                  </div>

                  {daysUntilDue >= 0 && project.status === "Pending" && (
                    <Alert className={`text-sm ${
                      daysUntilDue <= 2 ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20" : "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20"
                    }`}>
                      <AlertDescription>
                        {daysUntilDue === 0
                          ? "Due today!"
                          : daysUntilDue === 1
                            ? "Due tomorrow"
                            : `${daysUntilDue} days remaining`}
                      </AlertDescription>
                    </Alert>
                  )}

                  {isOverdue && (
                    <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
                      <AlertDescription>
                        Overdue by {Math.abs(daysUntilDue)} days
                      </AlertDescription>
                    </Alert>
                  )}

                  {project.submittedDate && (
                    <div className="text-sm text-muted-foreground">
                      Submitted: {new Date(project.submittedDate).toLocaleDateString()}
                    </div>
                  )}

                  {project.files && project.files.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Uploaded Files</span>
                      </div>
                      <div className="space-y-1">
                        {project.files.slice(0, 2).map((file) => (
                          <div key={file.id} className="flex items-center justify-between text-xs bg-muted p-2 rounded">
                            <span className="truncate">{file.name}</span>
                            <span className="text-muted-foreground">{file.size}</span>
                          </div>
                        ))}
                        {project.files.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{project.files.length - 2} more files
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {project.githubUrl && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Github className="h-4 w-4 text-muted-foreground" />
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">
                        View Repository
                      </a>
                    </div>
                  )}

                  {project.feedback && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Facilitator Feedback</span>
                        </div>
                        {project.grade && (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400">
                            Grade: {project.grade}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                        {project.feedback}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    {project.status === "Pending" && (
                      <Button
                        type="button" // Added type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openSubmissionModal(project)}
                        className="flex-1"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Submit
                      </Button>
                    )}
                    {(project.status === "Submitted" || project.status === "In Review" || project.status === "Graded") && (
                      <Button
                        type="button" // Added type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openViewModal(project)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Submission Modal */}
      <Dialog open={isSubmissionOpen} onOpenChange={setIsSubmissionOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Project: {selectedProjectForSubmission?.title}</DialogTitle>
            <DialogDescription>
              Upload your project files or provide a GitHub repository link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="project">Selected Project</Label>
              <Input id="project" value={selectedProjectForSubmission?.title || ''} disabled />
            </div>

            {selectedProjectForSubmission && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Project Requirements</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  {selectedProjectForSubmission.requirements?.map((req, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <Label htmlFor="type">Submission Type</Label>
              <Select value={submissionType} onValueChange={setSubmissionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose submission method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="file">File Upload</SelectItem>
                  <SelectItem value="github">GitHub Repository</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {submissionType === "file" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="files">Upload Files</Label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    // Only allow single file upload because backend createSubmission expects single.
                    // For multiple, backend needs multer.array or multiple API calls.
                    accept=".pdf,.docx,.zip,.rar,.jpg,.png,.mp4,.mov,.fig,.sketch"
                    onChange={handleFileUpload}
                    className="mt-1 cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Supported formats: PDF, DOCX, ZIP, RAR, Images, Videos, Design files (Max 50MB per file)
                  </p>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected File:</Label> {/* Changed to singular */}
                    {/* Display only the first selected file for simplicity based on `handleFileUpload` */}
                    <div key={uploadedFiles[0].id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">{uploadedFiles[0].file.name}</p>
                                <p className="text-xs text-muted-foreground">{uploadedFiles[0].size}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {uploadedFiles[0].progress > 0 && uploadedFiles[0].progress < 100 && (
                                <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 transition-all duration-300"
                                        style={{ width: `${uploadedFiles[0].progress}%` }}
                                    />
                                </div>
                            )}
                            {uploadedFiles[0].progress === 100 && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                            <Button
                                type="button" // Added type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(uploadedFiles[0].id)}
                                className="text-red-600 hover:text-red-700"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {submissionType === "github" && (
              <div>
                <Label htmlFor="github-url">GitHub Repository URL</Label>
                <Input
                  id="github-url"
                  type="url"
                  placeholder="https://github.com/username/repository"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
              </div>
            )}

            <div>
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your project, implementation details, and any additional notes..."
                value={submissionDescription}
                onChange={(e) => setSubmissionDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsSubmissionOpen(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSubmitSubmission} disabled={isUploading}>
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Project Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
            <DialogDescription>
              View detailed information about your project submission
            </DialogDescription>
          </DialogHeader>
          {viewingProject && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Project Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Title:</span>
                      <span className="ml-2 font-medium">{viewingProject.title}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Program:</span>
                      <span className="ml-2">{viewingProject.program}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Milestone:</span>
                      <span className="ml-2">{viewingProject.milestone}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Due Date:</span>
                      <span className="ml-2">{new Date(viewingProject.dueDate).toLocaleDateString()}</span>
                    </div>
                    {viewingProject.submittedDate && (
                      <div>
                        <span className="text-muted-foreground">Submitted:</span>
                        <span className="ml-2">{new Date(viewingProject.submittedDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {viewingProject.instructor && (
                      <div>
                        <span className="text-muted-foreground">Instructor:</span>
                        <span className="ml-2">{viewingProject.instructor}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Status & Grade</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      {getStatusBadge(viewingProject.status)}
                    </div>
                    {viewingProject.grade && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">Grade:</span>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400">
                          {viewingProject.grade}
                        </Badge>
                      </div>
                    )}
                    {viewingProject.maxGrade && (
                      <div className="text-sm text-muted-foreground">
                        Max Grade: {viewingProject.maxGrade} points
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {viewingProject.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{viewingProject.description}</p>
                </div>
              )}

              {viewingProject.requirements && (
                <div>
                  <h4 className="font-medium mb-2">Requirements</h4>
                  <ul className="space-y-1">
                    {viewingProject.requirements.map((req, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {viewingProject.files && viewingProject.files.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Uploaded Files</h4>
                  <div className="space-y-2">
                    {viewingProject.files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{file.size} • {file.type}</p>
                          </div>
                        </div>
                        <Button type="button" variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingProject.githubUrl && (
                <div>
                  <h4 className="font-medium mb-2">GitHub Repository</h4>
                  <a
                    href={viewingProject.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {viewingProject.githubUrl}
                  </a>
                </div>
              )}

              {viewingProject.feedback && (
                <div>
                  <h4 className="font-medium mb-2">Facilitator Feedback</h4>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">{viewingProject.feedback}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}