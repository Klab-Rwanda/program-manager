"use client"

import { useState } from "react"
import { Upload, FileText, Download, Trash2, Eye, Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function Curriculum() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterProgram, setFilterProgram] = useState("all")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadData, setUploadData] = useState({
    program: "",
    title: "",
    description: "",
    type: "",
  })

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
  ])

  const programs = [
    { id: "software-engineering", name: "Software Engineering Bootcamp" },
    { id: "data-science", name: "Data Science Fundamentals" },
    { id: "mobile-dev", name: "Mobile App Development" },
    { id: "ui-ux", name: "UI/UX Design Workshop" },
  ]

  const filteredFiles = curriculumFiles.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.program.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || file.type.toLowerCase() === filterType.toLowerCase()
    const matchesProgram = filterProgram === "all" || file.program === filterProgram

    return matchesSearch && matchesType && matchesProgram
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      setSelectedFiles(Array.from(files))
    }
  }

  const handleUploadSubmit = () => {
    if (!uploadData.program || !uploadData.title || selectedFiles.length === 0) {
      alert("Please fill in all required fields and select files")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)

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
          }))

          setCurriculumFiles((prev) => [...prev, ...newFiles])
          setUploadDialogOpen(false)
          setSelectedFiles([])
          setUploadData({ program: "", title: "", description: "", type: "" })
          alert(`Successfully uploaded ${selectedFiles.length} file(s)!`)

          return 100
        }
        return prev + 10
      })
    }, 200)
  }

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

    alert("File list exported successfully!")
  }

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return "📄"
      case "powerpoint":
      case "pptx":
        return "📊"
      case "word":
      case "docx":
        return "📝"
      case "sketch":
        return "🎨"
      default:
        return "📁"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "Draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "Archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Curriculum Management</h2>
          <p className="text-muted-foreground">Upload and manage curriculum materials for your programs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportList}>
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
                <div className="space-y-2">
                  <Label htmlFor="program">Target Program *</Label>
                  <Select
                    value={uploadData.program}
                    onValueChange={(value) => setUploadData({ ...uploadData, program: value })}
                  >
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">File Upload *</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <div>
                      <Button variant="outline" asChild>
                        <label htmlFor="file-upload" className="cursor-pointer">
                          Choose Files
                        </label>
                      </Button>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.gif"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <p className="mt-2 text-sm text-gray-500">or drag and drop your files here</p>
                      <p className="text-xs text-gray-400">PDF, PowerPoint, Word, Images (Max 50MB each)</p>
                    </div>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <Label>Selected Files:</Label>
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{file.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {(file.size / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Uploading files...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-website-primary hover:bg-website-primary/90"
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
      </div>

      {/* Upload Section */}
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
            <SelectItem value="sketch">Sketch</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterProgram} onValueChange={setFilterProgram}>
          <SelectTrigger className="w-48">
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
      </div>

      {/* Files List */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Curriculum Files</CardTitle>
          <CardDescription>Manage your uploaded curriculum materials</CardDescription>
        </CardHeader>
        <CardContent>
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
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredFiles.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-card-foreground">No files found</h3>
              <p className="mt-2 text-muted-foreground">
                {searchTerm || filterType !== "all" || filterProgram !== "all"
                  ? "Try adjusting your search terms or filters"
                  : "Upload your first curriculum file to get started"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-website-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Files</p>
                <p className="text-2xl font-bold text-card-foreground">{curriculumFiles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-website-grey" />
              <div>
                <p className="text-sm text-muted-foreground">Total Downloads</p>
                <p className="text-2xl font-bold text-card-foreground">
                  {curriculumFiles.reduce((sum, file) => sum + file.downloads, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Files</p>
                <p className="text-2xl font-bold text-card-foreground">
                  {curriculumFiles.filter((f) => f.status === "Active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Storage Used</p>
                <p className="text-2xl font-bold text-card-foreground">23.6 MB</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 