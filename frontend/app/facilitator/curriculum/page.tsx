"use client";

import React from "react";

import { useState } from "react";
import { Upload, FileText, Download, Trash2, Eye, Plus, Search, Pencil, X } from "lucide-react";

import { AppSidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { useRef } from "react";
import { useSidebar } from "@/lib/contexts/SidebarContext";

export default function Curriculum() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterProgram, setFilterProgram] = useState("all");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadData, setUploadData] = useState({
    program: "",
    title: "",
    description: "",
    type: "",
  });

  // Fetch curriculum files from backend
  const [curriculumFiles, setCurriculumFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Video preview dialog state
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);

  // Remove the hardcoded programs array
  const [programs, setPrograms] = useState<any[]>([]);

  // Fetch real programs from backend
  React.useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await api.get("/programs");
        setPrograms(response.data.data || []);
      } catch (err) {
        setPrograms([]);
      }
    };
    fetchPrograms();
  }, []);

  const { isCollapsed, isMobile } = useSidebar();
  const sidebarMargin = isMobile ? '0' : (isCollapsed ? '80px' : '280px');

  // Fetch courses on mount
  React.useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get("/courses");
        setCurriculumFiles(response.data.data || []);
      } catch (err: any) {
        setError("Failed to load curriculum files");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const filteredFiles = curriculumFiles.filter((file) => {
    const name = file.name || "";
    // file.program can be an object (from backend) or string (from fallback/mock)
    const programName = (file.program && file.program.name) ? file.program.name : (file.program || "");
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      programName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || (file.type || "").toLowerCase() === filterType.toLowerCase();
    // For filterProgram, match _id if program is object, or string fallback
    const matchesProgram = filterProgram === "all" || (file.program?._id || file.program) === filterProgram;

    return matchesSearch && matchesType && matchesProgram;
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(Array.from(files));
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadData.program || !uploadData.title || selectedFiles.length === 0) {
      alert("Please fill in all required fields and select files");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("title", uploadData.title);
      formData.append("description", uploadData.description);
      formData.append("programId", uploadData.program);
      // Only allow one file per course (as per backend model)
      formData.append("courseDocument", selectedFiles[0]);

      await api.post("/courses", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        },
      });

          setUploadDialogOpen(false);
          setSelectedFiles([]);
          setUploadData({ program: "", title: "", description: "", type: "" });
      setUploadProgress(0);
      // Refresh curriculum list
      setLoading(true);
      try {
        const response = await api.get("/courses");
        setCurriculumFiles(response.data.data || []);
      } catch {}
      setLoading(false);
      alert("Successfully uploaded curriculum file!");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleExportList = () => {
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
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `curriculum-files-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    alert("File list exported successfully!");
  };

  const getFileIcon = (type: string) => {
    if (!type) return "📁"; // Default icon for undefined type
    switch (type.toLowerCase()) {
      case "pdf":
        return "📄";
      case "powerpoint":
      case "pptx":
        return "📊";
      case "word":
      case "docx":
        return "📝";
      case "sketch":
        return "🎨";
      default:
        return "📁";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "Archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    }
  };

  const openEditDialog = (file: any) => {
    setEditData({ ...file });
    setEditFile(null);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editData) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      if (editData.title) formData.append("title", editData.title);
      if (editData.description) formData.append("description", editData.description);
      if (editData.type) formData.append("type", editData.type); // Add type to formData
      if (editFile) formData.append("courseDocument", editFile);
      await api.put(`/courses/${editData._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        },
      });
      setEditDialogOpen(false);
      setEditData(null);
      setEditFile(null);
      setUploadProgress(0);
      // Refresh curriculum list
      setLoading(true);
      try {
        const response = await api.get("/courses");
        setCurriculumFiles(response.data.data || []);
      } catch {}
      setLoading(false);
      alert("Curriculum updated successfully!");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update curriculum");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (file: any) => {
    if (!window.confirm(`Are you sure you want to delete '${file.title || file.name}'? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await api.delete(`/courses/${file._id}`);
      // Refresh curriculum list
      const response = await api.get("/courses");
      setCurriculumFiles(response.data.data || []);
      alert("Curriculum deleted successfully!");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete curriculum");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestApproval = async (file: any) => {
    setLoading(true);
    try {
      await api.patch(`/courses/${file._id}/request-approval`);
      // Refresh curriculum list
      const response = await api.get("/courses");
      setCurriculumFiles(response.data.data || []);
      alert("Course submitted for approval!");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to request approval");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: any) => {
    try {
      const response = await api.get(`/courses/${file._id}/download`, { responseType: 'blob' });
      
      // Get the correct file extension and MIME type
      const fileName = file.name || file.title || 'curriculum-file';
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      const detectedType = file.type || fileExtension;
      
      // Define MIME types
      const mimeTypes: { [key: string]: string } = {
        'pdf': 'application/pdf',
        'mp4': 'video/mp4',
        'avi': 'video/x-msvideo',
        'mov': 'video/quicktime',
        'wmv': 'video/x-ms-wmv',
        'flv': 'video/x-flv',
        'webm': 'video/webm',
        'mkv': 'video/x-matroska',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'txt': 'text/plain',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav'
      };
      
      const mimeType = mimeTypes[detectedType?.toLowerCase()] || 'application/octet-stream';
      
      // Create blob with correct MIME type
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link with proper filename
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Download error:', err);
      alert('Failed to download file');
    }
  };

  const handlePreview = async (file: any) => {
    try {
      console.log('Preview file:', file);
      console.log('File type:', file.type);
      console.log('File name:', file.name || file.title);
      
      const response = await api.get(`/courses/${file._id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Get file type from file.type or detect from filename
      const fileName = file.name || file.title || '';
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      const detectedType = file.type || fileExtension;
      
      // Check if it's a video file
      const isVideo = detectedType && ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(detectedType.toLowerCase());
      console.log('Detected type:', detectedType);
      console.log('Is video:', isVideo);
      
      if (isVideo) {
        // For videos, create a video player dialog
        console.log('Opening video dialog');
        setCurrentVideoUrl(url);
        setVideoDialogOpen(true);
      } else {
        // For other files (PDF, images, etc.), open in new tab
        console.log('Opening in new tab');
        window.open(url, '_blank');
        // Optionally revokeObjectURL after some time
        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
      }
    } catch (err: any) {
      console.error('Preview error:', err);
      alert('Failed to preview file');
    }
  };

  // Function to get file type for preview button text
  const getPreviewButtonText = (file: any) => {
    // Get file type from file.type or detect from filename
    const fileName = file.name || file.title || '';
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    const detectedType = file.type || fileExtension;
    
    if (!detectedType) return 'Preview';
    
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(detectedType.toLowerCase())) {
      return 'Play Video';
    }
    return 'Preview';
  };

  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col h-screen min-h-0" style={{ marginLeft: sidebarMargin }}>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              {/* <SidebarTrigger className="-ml-1" /> */}
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Curriculum Upload</h1>
        </header>

            <div className="flex-1 min-h-0 flex flex-col gap-4 p-4 overflow-y-auto">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Curriculum Management</h2>
              <p className="text-muted-foreground">Upload and manage curriculum materials for your programs</p>
            </div>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#1f497d] hover:bg-[#1a3d6b]">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Files
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Curriculum Files</DialogTitle>
                  <DialogDescription>
                    Upload new curriculum materials for your programs. Supported formats: PDF, PowerPoint, Word, and more.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="program">Program</Label>
                      <Select value={programs.length === 0 ? "no-programs" : uploadData.program} onValueChange={(value) => setUploadData({ ...uploadData, program: value })} disabled={programs.length === 0}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a program" />
                      </SelectTrigger>
                      <SelectContent>
                          {programs.length === 0 ? (
                            <SelectItem value="no-programs" disabled>No programs available</SelectItem>
                          ) : (
                            programs.map((program) => (
                              <SelectItem key={program._id} value={program._id}>
                            {program.name}
                          </SelectItem>
                            ))
                          )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., JavaScript Fundamentals"
                      value={uploadData.title}
                      onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of the curriculum material"
                      value={uploadData.description}
                      onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                      <div className="space-y-2">
                        <Label htmlFor="fileType">File Type</Label>
                        <Select value={uploadData.type as string} onValueChange={(value) => setUploadData({ ...uploadData, type: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select file type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="mp4">Video (MP4)</SelectItem>
                            <SelectItem value="avi">Video (AVI)</SelectItem>
                            <SelectItem value="mov">Video (MOV)</SelectItem>
                            <SelectItem value="pptx">PowerPoint</SelectItem>
                            <SelectItem value="docx">Word Document</SelectItem>
                            <SelectItem value="jpg">Image (JPG)</SelectItem>
                            <SelectItem value="png">Image (PNG)</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                  <div className="space-y-2">
                    <Label htmlFor="files">Files</Label>
                    <Input
                      id="files"
                      type="file"
                      multiple
                          accept="*"
                      onChange={handleFileUpload}
                    />
                    {selectedFiles.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Selected {selectedFiles.length} file(s)
                      </div>
                    )}
                  </div>
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-[#1f497d] hover:bg-[#1a3d6b]"
                      onClick={handleUploadSubmit}
                      disabled={isUploading}
                    >
                      {isUploading ? "Uploading..." : "Upload Files"}
                    </Button>
                    <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search files..."
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
                <SelectItem value="sketch">Sketch</SelectItem>
              </SelectContent>
            </Select>
              {/* Filter by program dropdown */}
              {programs.length === 0 ? (
                <div className="w-40 text-muted-foreground text-sm px-2 py-2">No programs available</div>
              ) : (
            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {programs.map((program) => (
                      <SelectItem key={program._id} value={program._id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
              )}
            <Button variant="outline" onClick={handleExportList}>
              <Download className="mr-2 h-4 w-4" />
              Export List
            </Button>
          </div>

          {/* Files Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFiles.map((file) => (
              <Card key={file._id || file.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                          <CardTitle className="text-lg">{file.title || file.name || 'Untitled'}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {file.program && typeof file.program === 'object' && file.program.name 
                              ? file.program.name 
                              : (file.program || 'Unknown Program')}
                          </CardDescription>
                    </div>
                    <div className="text-2xl">{getFileIcon(file.type)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(file.status)}>{file.status}</Badge>
                    <Badge variant="outline">{file.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Size</span>
                      <div className="font-medium">{file.size}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Downloads</span>
                      <div className="font-medium">{file.downloads}</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                        Uploaded: {file.createdAt ? (
                          <span suppressHydrationWarning>{new Date(file.createdAt).toLocaleDateString()}</span>
                        ) : 'Date not available'}
                      </div>
                      <div className="space-y-2">
                        {/* Primary Actions Row */}
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="flex-1 text-xs px-2" onClick={() => handlePreview(file)}>
                            <Eye className="mr-1 h-3 w-3" />
                            {getPreviewButtonText(file)}
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 text-xs px-2" onClick={() => handleDownload(file)}>
                            <Download className="mr-1 h-3 w-3" />
                            Get
                          </Button>
                  </div>
                        
                        {/* Secondary Actions Row */}
                        {file.status !== 'Approved' && (
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="flex-1 text-xs px-2" onClick={() => openEditDialog(file)}>
                              <Pencil className="mr-1 h-3 w-3" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 text-xs px-2" onClick={() => handleRequestApproval(file)}>
                              <Upload className="mr-1 h-3 w-3" />
                              Submit
                    </Button>
                          </div>
                        )}
                        
                        {/* Delete Action Row */}
                        {file.status !== 'Approved' && (
                          <div className="flex gap-1">
                            <Button variant="destructive" size="sm" className="flex-1 text-xs px-2" onClick={() => handleDelete(file)}>
                              <Trash2 className="mr-1 h-3 w-3" />
                              Delete
                    </Button>
                          </div>
                        )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredFiles.length === 0 && (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No curriculum files found</p>
            </div>
          )}
            </div>
        </div>
      </SidebarInset>

      {/* Edit Curriculum Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Curriculum</DialogTitle>
            <DialogDescription>Update the title, description, or replace the file.</DialogDescription>
          </DialogHeader>
          {editData && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editData.title}
                  onChange={e => setEditData({ ...editData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editData.description}
                  onChange={e => setEditData({ ...editData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fileType">File Type</Label>
                <Select value={editData.type || undefined} onValueChange={(value) => setEditData({ ...editData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select file type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="mp4">Video (MP4)</SelectItem>
                    <SelectItem value="avi">Video (AVI)</SelectItem>
                    <SelectItem value="mov">Video (MOV)</SelectItem>
                    <SelectItem value="pptx">PowerPoint</SelectItem>
                    <SelectItem value="docx">Word Document</SelectItem>
                    <SelectItem value="jpg">Image (JPG)</SelectItem>
                    <SelectItem value="png">Image (PNG)</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-file">Replace File (optional)</Label>
                <Input
                  id="edit-file"
                  type="file"
                  accept="*"
                  ref={editFileInputRef}
                  onChange={e => setEditFile(e.target.files?.[0] || null)}
                />
              </div>
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
              <div className="flex gap-2">
                <Button className="flex-1 bg-[#1f497d] hover:bg-[#1a3d6b]" onClick={handleEditSubmit} disabled={isUploading}>
                  {isUploading ? "Updating..." : "Update"}
                </Button>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Video Preview Dialog */}
      {videoDialogOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            style={{ marginLeft: sidebarMargin, marginRight: '1rem' }}
          >
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Video Preview</h2>
                  <p className="text-sm text-muted-foreground">Watch the uploaded video</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setVideoDialogOpen(false);
                    setCurrentVideoUrl(null);
                    if (currentVideoUrl) {
                      window.URL.revokeObjectURL(currentVideoUrl);
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {currentVideoUrl && (
              <div className="p-6">
                <div className="relative w-full h-full max-h-[70vh] flex items-center justify-center">
                  <video 
                    controls 
                    className="w-full h-full max-h-[70vh] object-contain rounded-lg"
                    src={currentVideoUrl || undefined}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
