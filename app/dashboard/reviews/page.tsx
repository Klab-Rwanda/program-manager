"use client"

import { useState } from "react"
import { Clock, CheckCircle, XCircle, MessageSquare, Download, Eye } from "lucide-react"

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

export default function Reviews() {
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [reviewStatus, setReviewStatus] = useState("")
  const [feedback, setFeedback] = useState("")
  const [viewSubmissionOpen, setViewSubmissionOpen] = useState(false)

  const reviewStats = [
    {
      title: "Pending Reviews",
      value: "12",
      description: "Awaiting your review",
      icon: Clock,
      color: "text-yellow-500",
    },
    {
      title: "Approved",
      value: "28",
      description: "This month",
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      title: "Needs Revision",
      value: "8",
      description: "Requires changes",
      icon: XCircle,
      color: "text-red-500",
    },
  ]

  const submissions = [
    {
      id: 1,
      studentName: "Alice Johnson",
      studentAvatar: "/placeholder.svg",
      projectTitle: "E-commerce Website",
      program: "Software Engineering Bootcamp",
      submissionDate: "2024-01-08",
      status: "Pending",
      fileType: "ZIP",
      fileSize: "15.2 MB",
      description: "Full-stack e-commerce application with React and Node.js",
      priority: "High",
      projectDetails: {
        technologies: ["React", "Node.js", "MongoDB", "Express"],
        features: ["User Authentication", "Shopping Cart", "Payment Integration", "Admin Dashboard"],
        githubUrl: "https://github.com/alice/ecommerce-project",
        liveUrl: "https://alice-ecommerce.vercel.app",
      },
    },
    {
      id: 2,
      studentName: "Bob Smith",
      studentAvatar: "/placeholder.svg",
      projectTitle: "Mobile Game App",
      program: "Software Engineering Bootcamp",
      submissionDate: "2024-01-07",
      status: "Approved",
      fileType: "APK",
      fileSize: "8.7 MB",
      description: "Simple puzzle game built with React Native",
      priority: "Medium",
      projectDetails: {
        technologies: ["React Native", "Expo", "AsyncStorage"],
        features: ["Game Logic", "Score Tracking", "Local Storage", "Sound Effects"],
        githubUrl: "https://github.com/bob/puzzle-game",
        liveUrl: null,
      },
    },
    {
      id: 3,
      studentName: "Carol Davis",
      studentAvatar: "/placeholder.svg",
      projectTitle: "Scratch Animation",
      program: "Tech for Kids",
      submissionDate: "2024-01-06",
      status: "Needs Revision",
      fileType: "SB3",
      fileSize: "2.1 MB",
      description: "Interactive story with animated characters",
      priority: "Low",
      projectDetails: {
        technologies: ["Scratch"],
        features: ["Character Animation", "Interactive Story", "Sound Effects", "User Input"],
        githubUrl: null,
        liveUrl: "https://scratch.mit.edu/projects/carol-story",
      },
    },
    {
      id: 4,
      studentName: "David Wilson",
      studentAvatar: "/placeholder.svg",
      projectTitle: "Sales Dashboard",
      program: "Sales Training Program",
      submissionDate: "2024-01-05",
      status: "Pending",
      fileType: "PDF",
      fileSize: "5.4 MB",
      description: "Analytics dashboard mockup with sales metrics",
      priority: "High",
      projectDetails: {
        technologies: ["Figma", "Adobe XD"],
        features: ["Sales Charts", "KPI Metrics", "Filter Options", "Export Functionality"],
        githubUrl: null,
        liveUrl: null,
      },
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-500"
      case "Needs Revision":
        return "bg-red-500"
      case "Pending":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "text-red-500"
      case "Medium":
        return "text-yellow-500"
      case "Low":
        return "text-green-500"
      default:
        return "text-gray-500"
    }
  }

  const handleReview = (submission: any) => {
    setSelectedSubmission(submission)
    setReviewStatus("")
    setFeedback("")
  }

  const handleViewSubmission = (submission: any) => {
    setSelectedSubmission(submission)
    setViewSubmissionOpen(true)
  }

  const submitReview = () => {
    if (!reviewStatus) {
      alert("Please select a review status")
      return
    }

    console.log("Review submitted:", { reviewStatus, feedback })
    alert(`Review submitted successfully! Status: ${reviewStatus}`)
    setSelectedSubmission(null)
    setReviewStatus("")
    setFeedback("")
  }

  const handleExportReviews = () => {
    const csvContent = [
      ["Student", "Project", "Program", "Status", "Submission Date", "Priority"],
      ...submissions.map((sub) => [
        sub.studentName,
        sub.projectTitle,
        sub.program,
        sub.status,
        sub.submissionDate,
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

    alert("Reviews exported successfully!")
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Project Submissions</CardTitle>
              <CardDescription>Review and provide feedback on trainee projects</CardDescription>
            </div>
            <Button variant="outline" onClick={handleExportReviews}>
              <Download className="mr-2 h-4 w-4" />
              Export Reviews
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
                <TableRow key={submission.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={submission.studentAvatar || "/placeholder.svg"}
                          alt={submission.studentName}
                        />
                        <AvatarFallback>
                          {submission.studentName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{submission.studentName}</p>
                        <p className="text-xs text-muted-foreground">
                          {submission.fileType} • {submission.fileSize}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{submission.projectTitle}</p>
                      <p className="text-xs text-muted-foreground">{submission.description}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{submission.program}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(submission.submissionDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(submission.status)} text-white border-0`}>
                      {submission.status}
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
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => handleReview(submission)}>
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Review Project</DialogTitle>
                            <DialogDescription>
                              Provide feedback for {selectedSubmission?.studentName}'s project
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
                                  <span>Program: {selectedSubmission.program}</span>
                                  <span>
                                    File: {selectedSubmission.fileType} ({selectedSubmission.fileSize})
                                  </span>
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
                                <Button onClick={submitReview} disabled={!reviewStatus} className="flex-1">
                                  Submit Review
                                </Button>
                                <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Submission Dialog */}
      <Dialog open={viewSubmissionOpen} onOpenChange={setViewSubmissionOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
            <DialogDescription>
              Detailed view of {selectedSubmission?.studentName}'s project submission
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
                      <span className="ml-2 font-medium">{selectedSubmission.studentName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Program:</span>
                      <span className="ml-2 font-medium">{selectedSubmission.program}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Submitted:</span>
                      <span className="ml-2 font-medium">
                        {new Date(selectedSubmission.submissionDate).toLocaleDateString()}
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
                        {selectedSubmission.status}
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