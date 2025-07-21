"use client";

import type React from "react";

import { useState } from "react";
import { Upload, FileText, Download, Trash2, Eye, Plus, Search } from "lucide-react";

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

  // Mock curriculum data
  const [curriculumFiles, setCurriculumFiles] = useState([
    {
      id: 1,
      name: "Web Development Fundamentals.pdf",
      program: "Software Engineering Bootcamp",
      type: "PDF",
      size: "2.4 MB",
      uploadDate: "2024-01-15",
      downloads: 45,
      status: "Active",
    },
    {
      id: 2,
      name: "JavaScript Advanced Concepts.pptx",
      program: "Software Engineering Bootcamp",
      type: "PowerPoint",
      size: "5.1 MB",
      uploadDate: "2024-01-14",
      downloads: 32,
      status: "Active",
    },
    {
      id: 3,
      name: "Data Analysis with Python.pdf",
      program: "Data Science Fundamentals",
      type: "PDF",
      size: "3.8 MB",
      uploadDate: "2024-01-12",
      downloads: 28,
      status: "Active",
    },
    {
      id: 4,
      name: "Mobile UI Design Guidelines.sketch",
      program: "Mobile App Development",
      type: "Sketch",
      size: "12.3 MB",
      uploadDate: "2024-01-10",
      downloads: 15,
      status: "Draft",
    },
  ]);

  
  const programs = [
    { id: "software-engineering", name: "Software Engineering Bootcamp" },
    { id: "data-science", name: "Data Science Fundamentals" },
    { id: "mobile-dev", name: "Mobile App Development" },
    { id: "ui-ux", name: "UI/UX Design Workshop" },
  ];

  const filteredFiles = curriculumFiles.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.program.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || file.type.toLowerCase() === filterType.toLowerCase();
    const matchesProgram = filterProgram === "all" || file.program === filterProgram;

    return matchesSearch && matchesType && matchesProgram;
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(Array.from(files));
    }
  };

  const handleUploadSubmit = () => {
    if (!uploadData.program || !uploadData.title || selectedFiles.length === 0) {
      alert("Please fill in all required fields and select files");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);

          // Add new files to the list
          const newFiles = selectedFiles.map((file, index) => ({
            id: curriculumFiles.length + index + 1,
            name: file.name,
            program: programs.find((p) => p.id === uploadData.program)?.name || "",
            type: file.type.includes("pdf")
              ? "PDF"
              : file.type.includes("powerpoint") || file.type.includes("presentation")
                ? "PowerPoint"
                : file.type.includes("word") || file.type.includes("document")
                  ? "Word"
                  : "Document",
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            uploadDate: new Date().toISOString().split("T")[0],
            downloads: 0,
            status: "Active",
          }));

          setCurriculumFiles((prev) => [...prev, ...newFiles]);
          setUploadDialogOpen(false);
          setSelectedFiles([]);
          setUploadData({ program: "", title: "", description: "", type: "" });
          alert(`Successfully uploaded ${selectedFiles.length} file(s)!`);

          return 100;
        }
        return prev + 10;
      });
    }, 200);
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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Curriculum Upload</h1>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
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
                    <Select value={uploadData.program} onValueChange={(value) => setUploadData({ ...uploadData, program: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a program" />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name}
                          </SelectItem>
                        ))}
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
                    <Label htmlFor="files">Files</Label>
                    <Input
                      id="files"
                      type="file"
                      multiple
                      accept=".pdf,.pptx,.docx,.sketch,.zip"
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
            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.name}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExportList}>
              <Download className="mr-2 h-4 w-4" />
              Export List
            </Button>
          </div>

          {/* Files Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFiles.map((file) => (
              <Card key={file.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{file.name}</CardTitle>
                      <CardDescription className="line-clamp-2">{file.program}</CardDescription>
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
                    Uploaded: {new Date(file.uploadDate).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="mr-2 h-3 w-3" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="mr-2 h-3 w-3" />
                      Download
                    </Button>
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
      </SidebarInset>
    </SidebarProvider>
  );
}
