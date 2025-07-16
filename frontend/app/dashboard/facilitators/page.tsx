"use client"

import { useState } from "react"
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Github,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  BookOpen,
  Send,
  UserPlus,
  Award,
  TrendingUp,
  Calendar,
  FileText,
  Star,
  Download,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Facilitator {
  id: number
  name: string
  email: string
  phone: string
  specialization: string
  experience: string
  status: string
  programs: string[]
  rating: number
  github: string
  joinDate: string
  studentsCount: number
  contentSubmissions: number
  approvedContent: number
  type: string
  previousProgram?: string
  promotionDate?: string
}

interface ContentSubmission {
  id: number
  facilitatorId: number
  facilitatorName: string
  title: string
  description: string
  program: string
  submissionDate: string
  status: string
  type: string
  duration: string
  content: string
  fileUrl: string
}

export default function FacilitatorsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [activeTab, setActiveTab] = useState("facilitators")
  const [showHireModal, setShowHireModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showContentPreview, setShowContentPreview] = useState(false)
  const [selectedFacilitator, setSelectedFacilitator] = useState<Facilitator | null>(null)
  const [selectedContent, setSelectedContent] = useState<ContentSubmission | null>(null)
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [contentDuration, setContentDuration] = useState("weekly")

  const [facilitators, setFacilitators] = useState<Facilitator[]>([
    {
      id: 1,
      name: "Alice Uwimana",
      email: "alice.uwimana@klab.rw",
      phone: "+250 788 123 456",
      specialization: "Full Stack Development",
      experience: "5 years",
      status: "active",
      programs: ["Tekeher Experts", "Web Development Basics"],
      rating: 4.8,
      github: "alice-uwimana",
      joinDate: "2023-01-15",
      studentsCount: 45,
      contentSubmissions: 12,
      approvedContent: 10,
      type: "hired",
    },
    {
      id: 2,
      name: "Bob Nkurunziza",
      email: "bob.nkurunziza@klab.rw",
      phone: "+250 788 234 567",
      specialization: "Data Science",
      experience: "7 years",
      status: "active",
      programs: ["Data Analytics Bootcamp"],
      rating: 4.9,
      github: "bob-data",
      joinDate: "2022-08-20",
      studentsCount: 32,
      contentSubmissions: 8,
      approvedContent: 8,
      type: "hired",
    },
    {
      id: 3,
      name: "Carol Mukamana",
      email: "carol.mukamana@klab.rw",
      phone: "+250 788 345 678",
      specialization: "UI/UX Design",
      experience: "4 years",
      status: "inactive",
      programs: ["UI/UX Design Mastery"],
      rating: 4.7,
      github: "carol-design",
      joinDate: "2023-03-10",
      studentsCount: 28,
      contentSubmissions: 5,
      approvedContent: 4,
      type: "hired",
    },
    {
      id: 4,
      name: "David Mugisha",
      email: "david.mugisha@student.klab.rw",
      phone: "+250 788 456 789",
      specialization: "Mobile Development",
      experience: "2 years",
      status: "active",
      programs: ["Mobile App Development"],
      rating: 4.5,
      github: "david-mobile",
      joinDate: "2024-01-10",
      studentsCount: 15,
      contentSubmissions: 3,
      approvedContent: 3,
      type: "promoted",
      previousProgram: "Tekeher Experts",
      promotionDate: "2024-01-10",
    },
  ])

  const [contentSubmissions, setContentSubmissions] = useState<ContentSubmission[]>([
    {
      id: 1,
      facilitatorId: 1,
      facilitatorName: "Alice Uwimana",
      title: "Advanced React Hooks",
      description: "Comprehensive guide to useEffect, useContext, and custom hooks",
      program: "Tekeher Experts",
      submissionDate: "2024-01-20",
      status: "pending",
      type: "lesson",
      duration: "weekly",
      content: `
# Advanced React Hooks

## Introduction
React Hooks revolutionized how we write React components by allowing us to use state and other React features in functional components.

## useEffect Hook
The useEffect hook lets you perform side effects in functional components:

\`\`\`javascript
import React, { useState, useEffect } from 'react';

function Example() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = \`You clicked \${count} times\`;
  });

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
\`\`\`

## useContext Hook
The useContext hook allows you to consume context values:

\`\`\`javascript
const ThemeContext = React.createContext();

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}

function Toolbar() {
  const theme = useContext(ThemeContext);
  return <div>Current theme: {theme}</div>;
}
\`\`\`

## Custom Hooks
Custom hooks let you extract component logic into reusable functions:

\`\`\`javascript
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  
  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => setCount(initialValue);
  
  return { count, increment, decrement, reset };
}
\`\`\`

## Assignment
Create a custom hook that manages form state and validation.
      `,
      fileUrl: "#",
    },
    {
      id: 2,
      facilitatorId: 2,
      facilitatorName: "Bob Nkurunziza",
      title: "Data Visualization with Python",
      description: "Creating interactive charts using matplotlib and seaborn",
      program: "Data Analytics Bootcamp",
      submissionDate: "2024-01-18",
      status: "approved",
      type: "assignment",
      duration: "program",
      content: `
# Data Visualization with Python

## Overview
Data visualization is crucial for understanding patterns and insights in data. Python offers powerful libraries for creating compelling visualizations.

## Matplotlib Basics
Matplotlib is the foundation of plotting in Python:

\`\`\`python
import matplotlib.pyplot as plt
import numpy as np

# Basic line plot
x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y, label='sin(x)')
plt.xlabel('X values')
plt.ylabel('Y values')
plt.title('Sine Wave')
plt.legend()
plt.grid(True)
plt.show()
\`\`\`

## Seaborn for Statistical Plots
Seaborn provides high-level statistical visualization:

\`\`\`python
import seaborn as sns
import pandas as pd

# Load sample dataset
tips = sns.load_dataset('tips')

# Create a scatter plot
plt.figure(figsize=(10, 6))
sns.scatterplot(data=tips, x='total_bill', y='tip', hue='day')
plt.title('Tips vs Total Bill by Day')
plt.show()
\`\`\`

## Interactive Visualizations
For interactive plots, we can use libraries like Plotly:

\`\`\`python
import plotly.express as px
import plotly.graph_objects as go

# Create an interactive scatter plot
fig = px.scatter(tips, x='total_bill', y='tip', 
                 color='day', size='size',
                 title='Interactive Tips Visualization')
fig.show()
\`\`\`

## Assignment
Create a comprehensive dashboard using multiple visualization types to analyze a dataset of your choice.
      `,
      fileUrl: "#",
    },
    {
      id: 3,
      facilitatorId: 3,
      facilitatorName: "Carol Mukamana",
      title: "UI/UX Design Principles",
      description: "Fundamental principles of user interface and experience design",
      program: "UI/UX Design Mastery",
      submissionDate: "2024-01-15",
      status: "rejected",
      type: "lesson",
      duration: "weekly",
      content: `
# UI/UX Design Principles

## Introduction
Good design is not just about aesthetics; it's about creating experiences that are intuitive, efficient, and enjoyable for users.

## Key Principles

### 1. User-Centered Design
Always design with the user in mind. Understand their needs, goals, and pain points.

### 2. Consistency
Maintain consistency in design elements, interactions, and terminology throughout the application.

### 3. Accessibility
Design for users with different abilities and needs. Consider color contrast, screen readers, and keyboard navigation.

### 4. Feedback
Provide clear feedback for user actions. Users should always know what's happening.

### 5. Simplicity
Keep interfaces simple and focused. Remove unnecessary elements that don't serve a purpose.

## Design Process

1. **Research**: Understand your users and their needs
2. **Ideate**: Generate multiple design solutions
3. **Prototype**: Create interactive prototypes
4. **Test**: Validate designs with real users
5. **Iterate**: Refine based on feedback

## Tools and Resources
- Figma for design and prototyping
- Adobe XD for advanced prototyping
- Sketch for macOS users
- InVision for collaboration
- UserTesting for user research

## Assignment
Design a mobile app interface for a task management application, focusing on the core principles discussed.
      `,
      fileUrl: "#",
    },
  ])

  const filteredFacilitators = facilitators.filter((facilitator) => {
    const matchesSearch = facilitator.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || facilitator.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const filteredContent = contentSubmissions.filter((content) => {
    const matchesSearch = content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.facilitatorName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || content.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handlePreviewContent = (content: ContentSubmission) => {
    setSelectedContent(content)
    setShowContentPreview(true)
  }

  const handleHireFacilitator = async (e: React.FormEvent) => {
    e.preventDefault()
    // Implementation for hiring facilitator
    setShowHireModal(false)
  }

  const handlePromoteStudent = (student: any) => {
    setSelectedFacilitator(student)
    setShowPromoteModal(true)
  }

  const handleDeleteFacilitator = (id: number) => {
    setFacilitators(facilitators.filter(f => f.id !== id))
  }

  const handleApproveContent = (contentId: number) => {
    setContentSubmissions(contentSubmissions.map(content => 
      content.id === contentId ? { ...content, status: "approved" } : content
    ))
  }

  const handleRejectContent = (contentId: number) => {
    setContentSubmissions(contentSubmissions.map(content => 
      content.id === contentId ? { ...content, status: "rejected" } : content
    ))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "inactive":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case "inactive":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Inactive</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facilitators</h1>
          <p className="text-muted-foreground">
            Manage facilitators and review content submissions
          </p>
        </div>
        <Button onClick={() => setShowHireModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Hire Facilitator
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="facilitators">Facilitators ({facilitators.length})</TabsTrigger>
          <TabsTrigger value="content">Content Submissions ({contentSubmissions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="facilitators" className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search facilitators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredFacilitators.map((facilitator) => (
              <Card key={facilitator.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{facilitator.name}</CardTitle>
                    {getStatusBadge(facilitator.status)}
                  </div>
                  <CardDescription>{facilitator.specialization}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{facilitator.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{facilitator.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Github className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{facilitator.github}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{facilitator.studentsCount} students</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{facilitator.programs.join(", ")}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{facilitator.contentSubmissions} submissions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{facilitator.approvedContent} approved</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">Rating: {facilitator.rating}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Joined: {facilitator.joinDate}</span>
                    </div>
                    {facilitator.type === "promoted" && (
                      <div className="bg-blue-50 p-2 rounded-md">
                        <p className="text-xs text-blue-800">
                          Promoted from {facilitator.previousProgram} on {facilitator.promotionDate}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFacilitator(facilitator)
                        setShowViewModal(true)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFacilitator(facilitator)
                        setShowEditModal(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteFacilitator(facilitator.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredContent.map((content) => (
              <Card key={content.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{content.title}</CardTitle>
                    {getStatusBadge(content.status)}
                  </div>
                  <CardDescription>{content.facilitatorName} • {content.program}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{content.description}</p>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{content.type} • {content.duration}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Submitted: {content.submissionDate}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewContent(content)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {content.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveContent(content.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectContent(content.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Hire Facilitator Modal */}
      <Dialog open={showHireModal} onOpenChange={setShowHireModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Hire New Facilitator</DialogTitle>
            <DialogDescription>
              Add a new facilitator to your team. Fill in all required information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleHireFacilitator} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" required />
              </div>
              <div>
                <Label htmlFor="specialization">Specialization</Label>
                <Input id="specialization" required />
              </div>
              <div>
                <Label htmlFor="experience">Experience</Label>
                <Input id="experience" placeholder="e.g., 5 years" required />
              </div>
              <div>
                <Label htmlFor="github">GitHub Username</Label>
                <Input id="github" />
              </div>
            </div>
            <div>
              <Label htmlFor="programs">Assigned Programs</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tekeher">Tekeher Experts</SelectItem>
                  <SelectItem value="web-dev">Web Development Basics</SelectItem>
                  <SelectItem value="data-science">Data Analytics Bootcamp</SelectItem>
                  <SelectItem value="ui-ux">UI/UX Design Mastery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowHireModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Hire Facilitator</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Facilitator Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Facilitator Details</DialogTitle>
            <DialogDescription>
              Detailed information about {selectedFacilitator?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedFacilitator && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <p className="text-sm font-medium">{selectedFacilitator.name}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm font-medium">{selectedFacilitator.email}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="text-sm font-medium">{selectedFacilitator.phone}</p>
                </div>
                <div>
                  <Label>Specialization</Label>
                  <p className="text-sm font-medium">{selectedFacilitator.specialization}</p>
                </div>
                <div>
                  <Label>Experience</Label>
                  <p className="text-sm font-medium">{selectedFacilitator.experience}</p>
                </div>
                <div>
                  <Label>GitHub</Label>
                  <p className="text-sm font-medium">{selectedFacilitator.github}</p>
                </div>
                <div>
                  <Label>Join Date</Label>
                  <p className="text-sm font-medium">{selectedFacilitator.joinDate}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedFacilitator.status)}
                    <span className="text-sm font-medium capitalize">{selectedFacilitator.status}</span>
                  </div>
                </div>
              </div>
              <div>
                <Label>Assigned Programs</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedFacilitator.programs.map((program, index) => (
                    <Badge key={index} variant="secondary">{program}</Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedFacilitator.studentsCount}</div>
                  <div className="text-sm text-gray-600">Students</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedFacilitator.contentSubmissions}</div>
                  <div className="text-sm text-gray-600">Submissions</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{selectedFacilitator.rating}</div>
                  <div className="text-sm text-gray-600">Rating</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowViewModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content Preview Modal */}
      <Dialog open={showContentPreview} onOpenChange={setShowContentPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedContent?.title}</DialogTitle>
            <DialogDescription>
              By {selectedContent?.facilitatorName} • {selectedContent?.program}
            </DialogDescription>
          </DialogHeader>
          {selectedContent && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary">{selectedContent.type}</Badge>
                  <Badge variant="secondary">{selectedContent.duration}</Badge>
                  {getStatusBadge(selectedContent.status)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Submitted: {selectedContent.submissionDate}
                </div>
              </div>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg overflow-x-auto">
                  {selectedContent.content}
                </pre>
              </div>
              {selectedContent.status === "pending" && (
                <div className="flex space-x-2">
                  <Button
                    onClick={() => {
                      handleApproveContent(selectedContent.id)
                      setShowContentPreview(false)
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => {
                      handleRejectContent(selectedContent.id)
                      setShowContentPreview(false)
                    }}
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowContentPreview(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 