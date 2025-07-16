"use client"

import { useState } from "react"
import {
  Upload,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Download,
  Plus,
  Search,
  Filter,
  Send,
  Edit,
  Trash2,
  Star,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Project {
  id: number
  title: string
  description: string
  program: string
  dueDate: string
  submittedDate?: string
  status: string
  grade?: number
  feedback?: string
  files: Array<{
    id: number
    name: string
    size: string
    type: string
  }>
  instructor: string
  requirements: string[]
  maxGrade: number
}

export default function SubmitProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterProgram, setFilterProgram] = useState("all")
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState("pending")

  const [projects] = useState<Project[]>([
    {
      id: 1,
      title: "Data Analysis Dashboard",
      description: "Create a comprehensive dashboard using Python and visualization libraries to analyze a real-world dataset",
      program: "Data Science Bootcamp",
      dueDate: "2024-01-25",
      status: "pending",
      instructor: "Dr. Sarah Wilson",
      requirements: [
        "Use pandas for data manipulation",
        "Create at least 5 different visualizations",
        "Include interactive elements",
        "Write a detailed analysis report",
      ],
      maxGrade: 100,
      files: [],
    },
    {
      id: 2,
      title: "E-commerce Website",
      description: "Build a full-stack e-commerce website using React and Node.js with payment integration",
      program: "Web Development Mastery",
      dueDate: "2024-01-30",
      submittedDate: "2024-01-28",
      status: "submitted",
      grade: 85,
      feedback: "Excellent work on the frontend! Consider improving the backend error handling and adding more comprehensive testing.",
      instructor: "Tom Anderson",
      requirements: [
        "Responsive design",
        "User authentication",
        "Product catalog",
        "Shopping cart functionality",
        "Payment integration",
        "Admin panel",
      ],
      maxGrade: 100,
      files: [
        { id: 1, name: "ecommerce-frontend.zip", size: "2.5 MB", type: "zip" },
        { id: 2, name: "ecommerce-backend.zip", size: "1.8 MB", type: "zip" },
        { id: 3, name: "documentation.pdf", size: "500 KB", type: "pdf" },
      ],
    },
    {
      id: 3,
      title: "Mobile App Prototype",
      description: "Design and prototype a mobile application using Figma with user research and testing",
      program: "UI/UX Design Mastery",
      dueDate: "2024-01-20",
      submittedDate: "2024-01-18",
      status: "graded",
      grade: 92,
      feedback: "Outstanding design work! Your user research was thorough and the prototype demonstrates excellent UX principles.",
      instructor: "Lisa Chen",
      requirements: [
        "User research report",
        "Wireframes and mockups",
        "Interactive prototype",
        "Usability testing results",
        "Design system documentation",
      ],
      maxGrade: 100,
      files: [
        { id: 4, name: "mobile-app-prototype.fig", size: "3.2 MB", type: "fig" },
        { id: 5, name: "user-research-report.pdf", size: "1.2 MB", type: "pdf" },
        { id: 6, name: "design-system.pdf", size: "800 KB", type: "pdf" },
      ],
    },
    {
      id: 4,
      title: "Machine Learning Model",
      description: "Develop a machine learning model to predict customer churn using scikit-learn",
      program: "Data Science Bootcamp",
      dueDate: "2024-02-05",
      status: "pending",
      instructor: "Dr. Sarah Wilson",
      requirements: [
        "Data preprocessing and exploration",
        "Feature engineering",
        "Model training and validation",
        "Performance evaluation",
        "Model deployment strategy",
      ],
      maxGrade: 100,
      files: [],
    },
    {
      id: 5,
      title: "API Development",
      description: "Create a RESTful API with authentication, documentation, and testing",
      program: "Web Development Mastery",
      dueDate: "2024-02-10",
      status: "pending",
      instructor: "Tom Anderson",
      requirements: [
        "RESTful endpoints",
        "JWT authentication",
        "Input validation",
        "Error handling",
        "API documentation",
        "Unit tests",
      ],
      maxGrade: 100,
      files: [],
    },
  ])

  const [newSubmission, setNewSubmission] = useState({
    title: "",
    description: "",
    files: [] as File[],
    comments: "",
  })

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || project.status === filterStatus
    const matchesProgram = filterProgram === "all" || project.program === filterProgram
    return matchesSearch && matchesStatus && matchesProgram
  })

  const pendingProjects = filteredProjects.filter(p => p.status === "pending")
  const submittedProjects = filteredProjects.filter(p => p.status === "submitted")
  const gradedProjects = filteredProjects.filter(p => p.status === "graded")

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "Pending", variant: "secondary" as const, icon: Clock, color: "text-yellow-600" }
      case "submitted":
        return { label: "Submitted", variant: "default" as const, icon: Send, color: "text-blue-600" }
      case "graded":
        return { label: "Graded", variant: "default" as const, icon: CheckCircle, color: "text-green-600" }
      default:
        return { label: status, variant: "outline" as const, icon: AlertTriangle, color: "text-gray-600" }
    }
  }

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "text-green-600"
    if (grade >= 80) return "text-blue-600"
    if (grade >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setNewSubmission({ ...newSubmission, files: [...newSubmission.files, ...files] })
  }

  const handleSubmitProject = () => {
    if (!selectedProject || !newSubmission.title || newSubmission.files.length === 0) {
      alert("Please fill in all required fields and upload at least one file")
      return
    }

    // In a real app, this would submit to the backend
    console.log("Submitting project:", { project: selectedProject, submission: newSubmission })
    
    setNewSubmission({ title: "", description: "", files: [], comments: "" })
    setShowSubmitModal(false)
  }

  const openSubmitModal = (project: Project) => {
    setSelectedProject(project)
    setNewSubmission({ title: project.title, description: project.description, files: [], comments: "" })
    setShowSubmitModal(true)
  }

  const openViewModal = (project: Project) => {
    setSelectedProject(project)
    setShowViewModal(true)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Submit Projects</h1>
        <p className="text-muted-foreground">
          Submit your assignments and track their progress
        </p>
      </div>

      <div className="flex items-center space-x-2">
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
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="graded">Graded</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterProgram} onValueChange={setFilterProgram}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by program" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            <SelectItem value="Data Science Bootcamp">Data Science Bootcamp</SelectItem>
            <SelectItem value="Web Development Mastery">Web Development Mastery</SelectItem>
            <SelectItem value="UI/UX Design Mastery">UI/UX Design Mastery</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingProjects.length})</TabsTrigger>
          <TabsTrigger value="submitted">Submitted ({submittedProjects.length})</TabsTrigger>
          <TabsTrigger value="graded">Graded ({gradedProjects.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingProjects.map((project) => {
            const statusConfig = getStatusConfig(project.status)
            const daysLeft = Math.ceil((new Date(project.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            return (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span>{project.title}</span>
                      </CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </div>
                    <Badge variant={statusConfig.variant} className={statusConfig.color}>
                      <statusConfig.icon className="mr-1 h-3 w-3" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Program</p>
                        <p className="font-medium">{project.program}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Due Date</p>
                        <p className="font-medium">{project.dueDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Instructor</p>
                        <p className="font-medium">{project.instructor}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Max Grade</p>
                        <p className="font-medium">{project.maxGrade} points</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Requirements</h4>
                      <ul className="space-y-1">
                        {project.requirements.map((requirement, index) => (
                          <li key={index} className="flex items-center space-x-2 text-sm">
                            <div className="h-1.5 w-1.5 rounded-full bg-gray-400"></div>
                            <span>{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className={`font-medium ${daysLeft < 3 ? "text-red-600" : daysLeft < 7 ? "text-yellow-600" : "text-green-600"}`}>
                          {daysLeft > 0 ? `${daysLeft} days left` : "Overdue"}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" onClick={() => openViewModal(project)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                        <Button onClick={() => openSubmitModal(project)}>
                          <Upload className="mr-2 h-4 w-4" />
                          Submit Project
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="submitted" className="space-y-4">
          {submittedProjects.map((project) => {
            const statusConfig = getStatusConfig(project.status)
            return (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Send className="h-5 w-5 text-blue-600" />
                        <span>{project.title}</span>
                      </CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </div>
                    <Badge variant={statusConfig.variant} className={statusConfig.color}>
                      <statusConfig.icon className="mr-1 h-3 w-3" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Program</p>
                        <p className="font-medium">{project.program}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Submitted</p>
                        <p className="font-medium">{project.submittedDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Instructor</p>
                        <p className="font-medium">{project.instructor}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-medium text-blue-600">Under Review</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Submitted Files</h4>
                      <div className="space-y-2">
                        {project.files.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{file.name}</span>
                              <span className="text-xs text-muted-foreground">({file.size})</span>
                            </div>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={() => openViewModal(project)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                      <Button variant="outline">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Contact Instructor
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="graded" className="space-y-4">
          {gradedProjects.map((project) => {
            const statusConfig = getStatusConfig(project.status)
            return (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span>{project.title}</span>
                      </CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge variant={statusConfig.variant} className={statusConfig.color}>
                        <statusConfig.icon className="mr-1 h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                      <div className={`text-2xl font-bold mt-1 ${getGradeColor(project.grade || 0)}`}>
                        {project.grade}/{project.maxGrade}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Program</p>
                        <p className="font-medium">{project.program}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Submitted</p>
                        <p className="font-medium">{project.submittedDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Instructor</p>
                        <p className="font-medium">{project.instructor}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Grade</p>
                        <p className={`font-medium ${getGradeColor(project.grade || 0)}`}>
                          {project.grade}%
                        </p>
                      </div>
                    </div>

                    {project.feedback && (
                      <div>
                        <h4 className="font-medium mb-2">Instructor Feedback</h4>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm">{project.feedback}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={() => openViewModal(project)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                      <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Download Files
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>
      </Tabs>

      {/* Submit Project Modal */}
      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Submit Project: {selectedProject?.title}</DialogTitle>
            <DialogDescription>
              Upload your project files and provide any additional comments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                value={newSubmission.title}
                onChange={(e) => setNewSubmission({ ...newSubmission, title: e.target.value })}
                placeholder="Enter project title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newSubmission.description}
                onChange={(e) => setNewSubmission({ ...newSubmission, description: e.target.value })}
                placeholder="Describe your project and approach"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="files">Upload Files</Label>
              <Input
                id="files"
                type="file"
                multiple
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supported formats: PDF, ZIP, RAR, DOC, DOCX, PPT, PPTX, JPG, PNG
              </p>
            </div>
            {newSubmission.files.length > 0 && (
              <div>
                <Label>Selected Files</Label>
                <div className="space-y-2 mt-2">
                  {newSubmission.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="comments">Additional Comments</Label>
              <Textarea
                id="comments"
                value={newSubmission.comments}
                onChange={(e) => setNewSubmission({ ...newSubmission, comments: e.target.value })}
                placeholder="Any additional comments or notes for your instructor"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitProject}>
              <Send className="mr-2 h-4 w-4" />
              Submit Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Project Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedProject?.title}</DialogTitle>
            <DialogDescription>
              Detailed view of the project requirements and submission status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Description</h4>
              <p className="text-sm text-muted-foreground">{selectedProject?.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">Program</h4>
                <p className="text-sm text-muted-foreground">{selectedProject?.program}</p>
              </div>
              <div>
                <h4 className="font-medium">Due Date</h4>
                <p className="text-sm text-muted-foreground">{selectedProject?.dueDate}</p>
              </div>
              <div>
                <h4 className="font-medium">Instructor</h4>
                <p className="text-sm text-muted-foreground">{selectedProject?.instructor}</p>
              </div>
              <div>
                <h4 className="font-medium">Max Grade</h4>
                <p className="text-sm text-muted-foreground">{selectedProject?.maxGrade} points</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium">Requirements</h4>
              <ul className="space-y-1 mt-2">
                {selectedProject?.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-center space-x-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-gray-400"></div>
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
            {selectedProject?.grade && (
              <div>
                <h4 className="font-medium">Grade & Feedback</h4>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Grade:</span>
                    <span className={`font-bold ${getGradeColor(selectedProject.grade)}`}>
                      {selectedProject.grade}/{selectedProject.maxGrade}
                    </span>
                  </div>
                  {selectedProject.feedback && (
                    <p className="text-sm">{selectedProject.feedback}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 