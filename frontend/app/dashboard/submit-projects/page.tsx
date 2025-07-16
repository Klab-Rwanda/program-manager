"use client";

import { useState, useRef } from "react";
import { Calendar, CheckCircle, Clock, Github, Upload, AlertCircle, FileText, Star, MessageSquare, Eye, X, Download, Plus, Search, Filter } from "lucide-react";
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

interface Project {
  id: number;
  title: string;
  program: string;
  dueDate: string;
  status: string;
  submissionDate?: string;
  feedback?: string;
  grade?: string;
  milestone: string;
  description?: string;
  githubUrl?: string;
  files?: Array<{
    id: number;
    name: string;
    size: string;
    type: string;
    uploadedAt: string;
  }>;
  requirements?: string[];
  maxGrade?: number;
  instructor?: string;
}

interface UploadedFile {
  id: string;
  file: File;
  size: string;
  type: string;
  progress: number;
}

export default function SubmitProjectsPage() {
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [submissionType, setSubmissionType] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [description, setDescription] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProgram, setFilterProgram] = useState("all");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewProject, setViewProject] = useState<Project | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [projects] = useState<Project[]>([
    {
      id: 1,
      title: "E-commerce Website",
      program: "Full Stack Web Development",
      dueDate: "2024-02-15",
      status: "Submitted",
      submissionDate: "2024-02-10",
      feedback: "Great work! The implementation is solid and follows best practices. Your React components are well-structured and the backend API is properly designed. Consider adding more error handling for edge cases.",
      grade: "A",
      milestone: "Final Project",
      description: "Build a complete e-commerce website with React frontend and Node.js backend",
      githubUrl: "https://github.com/student/ecommerce-website",
      requirements: [
        "Responsive design implementation",
        "User authentication system",
        "Product catalog with search",
        "Shopping cart functionality",
        "Payment integration",
        "Admin dashboard"
      ],
      maxGrade: 100,
      instructor: "John Smith",
      files: [
        { id: 1, name: "ecommerce-frontend.zip", size: "2.5 MB", type: "zip", uploadedAt: "2024-02-10" },
        { id: 2, name: "ecommerce-backend.zip", size: "1.8 MB", type: "zip", uploadedAt: "2024-02-10" },
        { id: 3, name: "documentation.pdf", size: "500 KB", type: "pdf", uploadedAt: "2024-02-10" }
      ]
    },
    {
      id: 2,
      title: "Task Management App",
      program: "Mobile App Development",
      dueDate: "2024-02-20",
      status: "In Review",
      submissionDate: "2024-02-18",
      feedback: null,
      grade: null,
      milestone: "Mid-term Project",
      description: "Create a mobile app for task management using React Native",
      requirements: [
        "User authentication",
        "Task creation and management",
        "Due date tracking",
        "Push notifications",
        "Offline functionality"
      ],
      maxGrade: 100,
      instructor: "Sarah Wilson"
    },
    {
      id: 3,
      title: "Portfolio Website",
      program: "Full Stack Web Development",
      dueDate: "2024-02-25",
      status: "Pending",
      submissionDate: null,
      feedback: null,
      grade: null,
      milestone: "Assignment 3",
      description: "Design and develop a personal portfolio website",
      requirements: [
        "Responsive design",
        "About me section",
        "Project showcase",
        "Contact form",
        "Professional styling"
      ],
      maxGrade: 100,
      instructor: "Mike Davis"
    },
    {
      id: 4,
      title: "Weather App",
      program: "Mobile App Development",
      dueDate: "2024-03-01",
      status: "Pending",
      submissionDate: null,
      feedback: null,
      grade: null,
      milestone: "Assignment 4",
      description: "Build a weather application with real-time data",
      requirements: [
        "Weather API integration",
        "Location-based weather",
        "5-day forecast",
        "Weather alerts",
        "Clean UI design"
      ],
      maxGrade: 100,
      instructor: "Lisa Chen"
    },
    {
      id: 5,
      title: "Data Visualization Dashboard",
      program: "Data Science Fundamentals",
      dueDate: "2024-02-28",
      status: "Submitted",
      submissionDate: "2024-02-25",
      feedback: "Excellent data visualization! Your charts are clear and informative. The dashboard layout is intuitive and user-friendly. Well done on the interactive features.",
      grade: "A+",
      milestone: "Final Project",
      description: "Create an interactive dashboard for data visualization",
      githubUrl: "https://github.com/student/data-dashboard",
      requirements: [
        "Data preprocessing",
        "Multiple chart types",
        "Interactive filters",
        "Responsive design",
        "Data export functionality"
      ],
      maxGrade: 100,
      instructor: "Dr. Emily Brown",
      files: [
        { id: 4, name: "dashboard-app.zip", size: "3.2 MB", type: "zip", uploadedAt: "2024-02-25" },
        { id: 5, name: "data-analysis-report.pdf", size: "1.5 MB", type: "pdf", uploadedAt: "2024-02-25" }
      ]
    },
  ]);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || project.status === filterStatus;
    const matchesProgram = filterProgram === "all" || project.program === filterProgram;
    return matchesSearch && matchesStatus && matchesProgram;
  });

  const pendingProjects = projects.filter(p => p.status === "Pending");
  const submittedProjects = projects.filter(p => p.status === "Submitted");

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
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles: UploadedFile[] = Array.from(files).map((file, index) => ({
        id: `file-${Date.now()}-${index}`,
        file,
        size: formatFileSize(file.size),
        type: file.type || "unknown",
        progress: 0
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
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

  const simulateFileUpload = async () => {
    setIsUploading(true);
    for (let i = 0; i <= 100; i += 10) {
      setUploadedFiles(prev => prev.map(file => ({ ...file, progress: i })));
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    setIsUploading(false);
  };

  const handleSubmission = async () => {
    if (!selectedProject) {
      alert("Please select a project");
      return;
    }

    if (submissionType === "github" && !githubUrl) {
      alert("Please provide a GitHub URL");
      return;
    }

    if (submissionType === "file" && uploadedFiles.length === 0) {
      alert("Please upload at least one file");
      return;
    }

    if (!description.trim()) {
      alert("Please provide a project description");
      return;
    }

    // Simulate file upload if files are selected
    if (uploadedFiles.length > 0) {
      await simulateFileUpload();
    }

    // Update project status
    const updatedProjects = projects.map(p => 
      p.id === selectedProject.id 
        ? { 
            ...p, 
            status: "Submitted", 
            submissionDate: new Date().toISOString().split('T')[0],
            description: description,
            githubUrl: submissionType === "github" ? githubUrl : p.githubUrl,
            files: submissionType === "file" ? uploadedFiles.map((f, index) => ({
              id: index + 1,
              name: f.file.name,
              size: f.size,
              type: f.file.type || "unknown",
              uploadedAt: new Date().toISOString().split('T')[0]
            })) : p.files
          }
        : p
    );

    // In a real app, you would send this to your backend
    console.log("Project submitted:", {
      project: selectedProject,
      submissionType,
      githubUrl,
      description,
      files: uploadedFiles
    });

    // Reset form
    setSelectedProject(null);
    setSubmissionType("");
    setGithubUrl("");
    setDescription("");
    setUploadedFiles([]);
    setIsSubmissionOpen(false);

    alert("Project submitted successfully!");
  };

  const openSubmissionModal = (project: Project) => {
    setSelectedProject(project);
    setIsSubmissionOpen(true);
  };

  const openViewModal = (project: Project) => {
    setViewProject(project);
    setShowViewModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Submissions</h1>
          <p className="text-muted-foreground">
            Submit your projects and track their review status
          </p>
        </div>
        <Button onClick={() => setIsSubmissionOpen(true)} disabled={pendingProjects.length === 0}>
          <Upload className="mr-2 h-4 w-4" />
          Submit Project
        </Button>
      </div>

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
              </SelectContent>
            </Select>
            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                <SelectItem value="Full Stack Web Development">Web Development</SelectItem>
                <SelectItem value="Mobile App Development">Mobile Development</SelectItem>
                <SelectItem value="Data Science Fundamentals">Data Science</SelectItem>
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
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all programs
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
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">A-</div>
            <p className="text-xs text-muted-foreground">
              Based on graded projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
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
                  <Badge variant="outline" className="text-xs">{project.milestone}</Badge>
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

                {project.submissionDate && (
                  <div className="text-sm text-muted-foreground">
                    Submitted: {new Date(project.submissionDate).toLocaleDateString()}
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
                      variant="outline"
                      size="sm"
                      onClick={() => openSubmissionModal(project)}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Submit
                    </Button>
                  )}
                  {(project.status === "Submitted" || project.status === "In Review") && (
                    <Button 
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

      {/* Submission Modal */}
      <Dialog open={isSubmissionOpen} onOpenChange={setIsSubmissionOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Project</DialogTitle>
            <DialogDescription>
              Upload your project files or provide a GitHub repository link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="project">Select Project</Label>
              <Select value={selectedProject?.id.toString() || ""} onValueChange={(value) => {
                const project = projects.find(p => p.id.toString() === value);
                setSelectedProject(project || null);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a project to submit" />
                </SelectTrigger>
                <SelectContent>
                  {pendingProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProject && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Project Requirements</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  {selectedProject.requirements?.map((req, index) => (
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
                    multiple
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
                    <Label>Selected Files</Label>
                    <div className="space-y-2">
                      {uploadedFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{file.file.name}</p>
                              <p className="text-xs text-muted-foreground">{file.size}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {file.progress > 0 && file.progress < 100 && (
                              <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-600 transition-all duration-300"
                                  style={{ width: `${file.progress}%` }}
                                />
                              </div>
                            )}
                            {file.progress === 100 && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(file.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubmissionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmission} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Submit Project"}
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
          {viewProject && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Project Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Title:</span>
                      <span className="ml-2 font-medium">{viewProject.title}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Program:</span>
                      <span className="ml-2">{viewProject.program}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Milestone:</span>
                      <span className="ml-2">{viewProject.milestone}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Due Date:</span>
                      <span className="ml-2">{new Date(viewProject.dueDate).toLocaleDateString()}</span>
                    </div>
                    {viewProject.submissionDate && (
                      <div>
                        <span className="text-muted-foreground">Submitted:</span>
                        <span className="ml-2">{new Date(viewProject.submissionDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {viewProject.instructor && (
                      <div>
                        <span className="text-muted-foreground">Instructor:</span>
                        <span className="ml-2">{viewProject.instructor}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Status & Grade</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      {getStatusBadge(viewProject.status)}
                    </div>
                    {viewProject.grade && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">Grade:</span>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400">
                          {viewProject.grade}
                        </Badge>
                      </div>
                    )}
                    {viewProject.maxGrade && (
                      <div className="text-sm text-muted-foreground">
                        Max Grade: {viewProject.maxGrade} points
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {viewProject.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{viewProject.description}</p>
                </div>
              )}

              {viewProject.requirements && (
                <div>
                  <h4 className="font-medium mb-2">Requirements</h4>
                  <ul className="space-y-1">
                    {viewProject.requirements.map((req, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {viewProject.files && viewProject.files.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Uploaded Files</h4>
                  <div className="space-y-2">
                    {viewProject.files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{file.size} • {file.type}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewProject.githubUrl && (
                <div>
                  <h4 className="font-medium mb-2">GitHub Repository</h4>
                  <a 
                    href={viewProject.githubUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {viewProject.githubUrl}
                  </a>
                </div>
              )}

              {viewProject.feedback && (
                <div>
                  <h4 className="font-medium mb-2">Facilitator Feedback</h4>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">{viewProject.feedback}</p>
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