// app/dashboard/Facilitator/fac-curriculum/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, FileText, Download, Trash2, Eye, Plus, Search, Loader2, AlertCircle, XCircle, HardDrive } from "lucide-react"; // Added Loader2, AlertCircle, XCircle

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter // Added DialogFooter for submit/cancel buttons
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner"; // Import toast
import { Alert, AlertDescription } from "@/components/ui/alert"; // For error display

import { useAuth } from "@/lib/contexts/RoleContext"; // Import useAuth for role check
import api from "@/lib/api"; // Import api
import { Program as BackendProgram, Course as BackendCourse } from "@/types"; // Import backend types

// Frontend-specific CurriculumFile interface (maps to backend Course, plus display fields)
interface CurriculumFile {
  id: string // Backend _id for Course
  name: string // Backend Course title
  program: string // Program name (for display)
  programId: string // Program _id (for filtering)
  type: string // Derived: "PDF", "PowerPoint", "Word", "Sketch", "Design", "Archive", "Video"
  size: string // Mocked or derived
  uploadDate: string // Backend Course createdAt
  downloads: number // Mocked
  status: 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected'; // Backend Course status
  description?: string; // Backend Course description
  contentUrl?: string; // Backend Course contentUrl for download/preview
}

export default function CurriculumPage() { // Renamed from Curriculum to CurriculumPage
  const { user, role, loading: authLoading } = useAuth(); // Get user and role from context

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterProgram, setFilterProgram] = useState("all") // Use program _id for filter
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false) // For file upload progress
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]) // Files selected for new upload
  const [uploadData, setUploadData] = useState({ // Form data for new upload
    programId: "", // Use programId here
    title: "",
    description: "",
  });

  const [curriculumFiles, setCurriculumFiles] = useState<CurriculumFile[]>([]); // All curriculum files
  const [availablePrograms, setAvailablePrograms] = useState<BackendProgram[]>([]); // Programs for dropdown
  const [isLoading, setIsLoading] = useState(true); // General loading state
  const [error, setError] = useState<string | null>(null); // General error state

  // Fetch all programs and then all courses relevant to the user
  const fetchCurriculumData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch programs (filtered by role on backend)
      const programsRes = await api.get('/programs');
      const fetchedPrograms: BackendProgram[] = programsRes.data.data;
      setAvailablePrograms(fetchedPrograms);

      const allFetchedCourses: CurriculumFile[] = [];

      // 2. For each program, fetch its courses (which are our "resources")
      for (const program of fetchedPrograms) {
        try {
          // Assuming `getCoursesForProgram` exists on backend to get courses by programId
          const coursesRes = await api.get(`/courses/program/${program._id}`);
          const courses: BackendCourse[] = coursesRes.data.data;

          courses.forEach(course => {
            const fileExtension = course.contentUrl ? course.contentUrl.split('.').pop()?.toLowerCase() : 'unknown';
            let resourceType = 'Document';
            if (fileExtension === 'pdf') resourceType = 'PDF';
            else if (fileExtension && ['ppt', 'pptx'].includes(fileExtension)) resourceType = 'PowerPoint';
            else if (fileExtension && ['doc', 'docx'].includes(fileExtension)) resourceType = 'Word';
            else if (fileExtension && ['sketch', 'fig'].includes(fileExtension)) resourceType = 'Design';
            else if (fileExtension && ['zip', 'rar'].includes(fileExtension)) resourceType = 'Archive';
            else if (fileExtension && ['mp4', 'mov', 'webm'].includes(fileExtension)) resourceType = 'Video';


            allFetchedCourses.push({
              id: course._id,
              name: course.title,
              program: program.name, // Display program name
              programId: program._id, // Store program ID for filtering
              uploadDate: new Date(course.createdAt).toLocaleDateString(), // Format date
              size: (Math.random() * 5 + 1).toFixed(1) + ' MB', // Mock size
              downloads: Math.floor(Math.random() * 100), // Mock downloads
              status: course.status, // Backend status
              description: course.description,
              contentUrl: course.contentUrl
            });
          });
        } catch (innerErr: any) {
          console.warn(`Failed to fetch courses for program ${program.name}:`, innerErr.response?.data?.message || innerErr.message);
          // Continue to next program, don't break loop for one failure
        }
      }
      setCurriculumFiles(allFetchedCourses);

      // Set default program in form if available and not already set
      if (fetchedPrograms.length > 0 && !uploadData.programId) {
        setUploadData(prev => ({ ...prev, programId: fetchedPrograms[0]._id }));
      }

    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load curriculum data.");
      toast.error(err.response?.data?.message || "Failed to load curriculum data.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [role, uploadData.programId]); // Re-fetch if role or initial programId changes


  useEffect(() => {
    // Only fetch if authenticated and is a Program Manager or Facilitator or Super Admin
    if (!authLoading && (role === 'program_manager' || role === 'super_admin' || role === 'facilitator')) {
      fetchCurriculumData();
    }
  }, [authLoading, role, fetchCurriculumData]);

  // Filter logic for searching and applying filters
  const filteredFiles = curriculumFiles.filter((file) => {
    const matchesSearch = searchTerm.toLowerCase() === '' || file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.program.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || file.type.toLowerCase() === filterType.toLowerCase();
    const matchesProgram = filterProgram === "all" || file.programId === filterProgram; // Filter by ID now

    return matchesSearch && matchesType && matchesProgram;
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      // Assuming single file upload for the backend endpoint
      setSelectedFiles([files[0]]); // Only take the first file if multiple selected
    } else {
      setSelectedFiles([]);
    }
  }

  const handleUploadSubmit = async () => {
    if (!uploadData.programId || !uploadData.title || selectedFiles.length === 0) {
      toast.error("Please fill in all required fields and select a file.");
      return;
    }

    setIsUploading(true);
    setError(null); // Clear previous errors
    try {
      const formData = new FormData();
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);
      formData.append('programId', uploadData.programId);
      formData.append('courseDocument', selectedFiles[0]); // 'courseDocument' matches multer field name in backend

      // Simulate progress before and during actual upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => (prev < 90 ? prev + 10 : 90)); // Cap at 90% for visual effect before final success
      }, 200);

      const response = await api.post('/courses', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Important for file uploads
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      clearInterval(progressInterval); // Clear the manual progress simulation
      setUploadProgress(100); // Ensure it reaches 100%

      if (response.data.success) {
        toast.success(response.data.message || "Course content uploaded successfully and is pending approval!");
        setUploadDialogOpen(false); // Close modal
        setSelectedFiles([]); // Clear selected files
        setUploadData({ programId: availablePrograms[0]?._id || '', title: "", description: "" }); // Reset form
        fetchCurriculumData(); // Refresh list to show new file (it will be 'Draft' or 'PendingApproval')
      } else {
        toast.error(response.data.message || "Failed to upload course content.");
      }

    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to upload course content.";
      setError(msg); // Set error for general display
      toast.error(msg);
      console.error(err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0); // Reset progress bar
    }
  }

  const handleExportList = () => {
    // This will export the currently filtered list to CSV.
    const csvContent = [
      ["Name", "Program", "Type", "Size", "Upload Date", "Downloads", "Status"],
      ...filteredFiles.map((file) => [
        file.name,
        file.program,
        file.type,
        file.size,
        file.uploadDate,
        file.downloads.toString(),
        file.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `curriculum-files-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast.success("File list exported successfully!");
  }

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"? This cannot be undone.`)) {
        return;
    }
    // Your backend's course controller doesn't have a direct delete route for a course.
    // This would require a new DELETE /courses/:id endpoint.
    // For now, we'll simulate frontend deletion and show a toast.
    toast.info(`Simulating deletion of ${fileName}. (Backend delete endpoint not implemented)`);
    setCurriculumFiles(prev => prev.filter(file => file.id !== fileId));
  }

  const handlePreviewFile = (file: CurriculumFile) => {
    if (file.contentUrl) {
      window.open(file.contentUrl, '_blank');
      toast.info(`Opening preview for ${file.name}.`);
    } else {
      toast.error("No preview URL available for this file.");
    }
  }

  const handleDownloadFile = (file: CurriculumFile) => {
    if (file.contentUrl) {
      // For actual downloads, the server should send a file.
      // For now, opening the URL in a new tab might trigger download depending on browser/server.
      window.open(file.contentUrl, '_blank');
      toast.success(`Downloading ${file.name}.`);
    } else {
      toast.error("No download URL available for this file.");
    }
  }

  // UI Helper functions for icons and colors
  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf": return "📄"
      case "powerpoint": return "📊"
      case "word": return "📝"
      case "sketch": case "design": return "🎨"
      case "archive": return "📁"
      case "video": return "🎥"
      default: return "📄"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "Draft": return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400" // Changed from yellow
      case "PendingApproval": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400" // Using yellow for PendingApproval
      case "Rejected": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default: return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400" // Fallback for unknown
    }
  }

  // Render nothing or a loading spinner if authentication is still loading
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Access control: Only Program Manager, Super Admin, and Facilitator should see this page
  if (!user || (role !== 'program_manager' && role !== 'super_admin' && role !== 'facilitator')) {
    return (
        <Card>
            <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">You do not have permission to view this page.</p></CardContent>
        </Card>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Curriculum Management</h2>
          <p className="text-muted-foreground">Upload and manage curriculum materials for your programs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={handleExportList}>
            <Download className="mr-2 h-4 w-4" />
            Export List
          </Button>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-website-primary hover:bg-website-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Upload New
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Curriculum Materials</DialogTitle>
                <DialogDescription>Add new learning materials to your programs</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {error && ( // Display form-specific error if any
                  <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="flex items-center justify-between">
                          {error}
                          <Button type="button" variant="ghost" size="sm" onClick={() => setError(null)}><XCircle className="h-4 w-4" /></Button>
                      </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="programId">Target Program *</Label>
                  <Select
                    value={uploadData.programId}
                    onValueChange={(value) => setUploadData({ ...uploadData, programId: value })}
                    disabled={availablePrograms.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePrograms.length === 0 ? (
                        <SelectItem value="" disabled>No programs available</SelectItem>
                      ) : (
                        availablePrograms.map((program) => (
                          <SelectItem key={program._id} value={program._id}>
                            {program.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Resource Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter resource title"
                    value={uploadData.title}
                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the resource"
                    value={uploadData.description}
                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">File Upload *</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <div>
                      <Button type="button" variant="outline" asChild>
                        <label htmlFor="file-upload" className="cursor-pointer">
                          Choose File
                        </label>
                      </Button>
                      <input
                        id="file-upload"
                        type="file"
                        // Only allow single file upload because backend createCourse expects single.
                        accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.gif,.zip,.rar"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <p className="mt-2 text-sm text-gray-500">or drag and drop your file here</p>
                      <p className="text-xs text-gray-400">PDF, PowerPoint, Word, Images (Max 50MB)</p>
                    </div>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <Label>Selected File:</Label>
                      {/* Display only the first selected file for now */}
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm">{selectedFiles[0].name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                              {(selectedFiles[0].size / (1024 * 1024)).toFixed(1)} MB
                          </span>
                      </div>
                    </div>
                  )}
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Uploading file...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                <DialogFooter> {/* DialogFooter within DialogContent */}
                  <Button
                    type="button" // Added type="button"
                    variant="outline"
                    onClick={() => setUploadDialogOpen(false)}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit" // Changed to type="submit"
                    className="bg-website-primary hover:bg-website-primary/90"
                    onClick={handleUploadSubmit} // Directly call handler on button click
                    disabled={isUploading || selectedFiles.length === 0 || !uploadData.programId || !uploadData.title}
                  >
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Upload File"}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Upload Section (Visually for drag-and-drop, trigger modal) */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Upload Curriculum Materials</CardTitle>
          <CardDescription>Upload documents, presentations, and other learning materials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-card-foreground">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Supports PDF, PowerPoint, Word, Images, and more. Max file size: 50MB
              </p>
            </div>
            <Button
              type="button" // Added type="button"
              className="mt-4 bg-website-primary hover:bg-website-primary/90"
              onClick={() => setUploadDialogOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search curriculum files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="powerpoint">PowerPoint</SelectItem>
            <SelectItem value="word">Word</SelectItem>
            <SelectItem value="design">Design</SelectItem> {/* Changed to 'Design' */}
            <SelectItem value="archive">Archive</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterProgram} onValueChange={setFilterProgram}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by program" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            {availablePrograms.length === 0 ? (
                <SelectItem value="" disabled>No programs available</SelectItem>
            ) : (
                availablePrograms.map((program) => (
                  <SelectItem key={program._id} value={program._id}>
                    {program.name}
                  </SelectItem>
                ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Files List */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Curriculum Files</CardTitle>
          <CardDescription>Manage your uploaded curriculum materials</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="mt-4 text-lg font-semibold text-card-foreground">No files found</h3>
              <p className="mt-2 text-muted-foreground">
                {searchTerm || filterType !== "all" || filterProgram !== "all"
                  ? "Try adjusting your search terms or filters"
                  : "Upload your first curriculum file to get started"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{getFileIcon(file.type)}</div>
                    <div className="space-y-1">
                      <p className="font-medium text-card-foreground">{file.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{file.program}</span>
                        <span>•</span>
                        <span>{file.size}</span>
                        <span>•</span>
                        <span>{new Date(file.uploadDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{file.downloads} downloads</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(file.status)}>{file.status}</Badge>
                    <Badge variant="outline">{file.type}</Badge>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handlePreviewFile(file)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleDownloadFile(file)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteFile(file.id, file.name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Curriculum Statistics</CardTitle>
          <CardDescription>Overview of your curriculum materials</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                  <FileText className="h-5 w-5 text-website-primary mr-2" />
                  <p className="text-2xl font-bold text-blue-600">{curriculumFiles.length}</p>
              </div>
              <p className="text-sm text-gray-600">Total Files</p>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                    <Download className="h-5 w-5 text-green-600 mr-2" />
                    <p className="text-2xl font-bold text-green-600">
                        {curriculumFiles.reduce((sum, file) => sum + file.downloads, 0)}
                    </p>
                </div>
                <p className="text-sm text-gray-600">Total Downloads</p>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                    <Upload className="h-5 w-5 text-yellow-600 mr-2" />
                    <p className="text-2xl font-bold text-yellow-600">
                        {curriculumFiles.filter((f) => f.status === "Approved").length}
                    </p>
                </div>
                <p className="text-sm text-gray-600">Approved Files</p>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                    <HardDrive className="h-5 w-5 text-purple-600 mr-2" />
                    <p className="text-2xl font-bold text-purple-600">23.6 MB</p> {/* This remains mocked */}
                </div>
                <p className="text-sm text-gray-600">Storage Used</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}