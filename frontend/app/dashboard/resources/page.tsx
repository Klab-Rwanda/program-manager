"use client"

import { useState } from "react"
import { Download, Eye, FileText, Play, Search, Filter, Calendar, HardDrive } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Resource {
  id: number
  title: string
  type: string
  program: string
  uploadDate: string
  size: string
  viewed: boolean
  url: string
  description?: string
}

export default function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProgram, setSelectedProgram] = useState("all")
  const [selectedType, setSelectedType] = useState("all")

  const [resources] = useState<Resource[]>([
    {
      id: 1,
      title: "JavaScript Fundamentals Guide",
      type: "PDF",
      program: "Full Stack Web Development",
      uploadDate: "2024-01-20",
      size: "2.5 MB",
      viewed: true,
      url: "#",
      description: "Comprehensive guide covering JavaScript basics, ES6+ features, and best practices",
    },
    {
      id: 2,
      title: "React Components Tutorial",
      type: "Video",
      program: "Full Stack Web Development",
      uploadDate: "2024-01-22",
      size: "45 min",
      viewed: false,
      url: "#",
      description: "Step-by-step tutorial on building React components and managing state",
    },
    {
      id: 3,
      title: "Database Design Principles",
      type: "Document",
      program: "Full Stack Web Development",
      uploadDate: "2024-01-25",
      size: "1.8 MB",
      viewed: true,
      url: "#",
      description: "Learn database normalization, relationships, and optimization techniques",
    },
    {
      id: 4,
      title: "Flutter Setup Guide",
      type: "PDF",
      program: "Mobile App Development",
      uploadDate: "2024-02-05",
      size: "3.2 MB",
      viewed: false,
      url: "#",
      description: "Complete setup guide for Flutter development environment",
    },
    {
      id: 5,
      title: "API Integration Workshop",
      type: "Video",
      program: "Mobile App Development",
      uploadDate: "2024-02-08",
      size: "1.2 hours",
      viewed: false,
      url: "#",
      description: "Hands-on workshop on integrating REST APIs in mobile applications",
    },
    {
      id: 6,
      title: "Data Visualization with Python",
      type: "Document",
      program: "Data Science Fundamentals",
      uploadDate: "2024-01-30",
      size: "2.1 MB",
      viewed: true,
      url: "#",
      description: "Creating charts and visualizations using matplotlib and seaborn",
    },
    {
      id: 7,
      title: "Machine Learning Basics",
      type: "Video",
      program: "Data Science Fundamentals",
      uploadDate: "2024-02-01",
      size: "2.5 hours",
      viewed: false,
      url: "#",
      description: "Introduction to machine learning algorithms and concepts",
    },
    {
      id: 8,
      title: "Git Version Control",
      type: "PDF",
      program: "Full Stack Web Development",
      uploadDate: "2024-01-28",
      size: "1.5 MB",
      viewed: true,
      url: "#",
      description: "Essential Git commands and workflow for collaborative development",
    },
  ])

  const filteredResources = resources.filter((resource) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (resource.description && resource.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesProgram = selectedProgram === "all" || resource.program === selectedProgram
    const matchesType = selectedType === "all" || resource.type === selectedType
    return matchesSearch && matchesProgram && matchesType
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Video":
        return <Play className="h-4 w-4" />
      case "PDF":
      case "Document":
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "Video":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Video</Badge>
      case "PDF":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">PDF</Badge>
      case "Document":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Document</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  const handleDownload = (resource: Resource) => {
    // Implementation for downloading resource
    console.log("Downloading:", resource.title)
  }

  const handleView = (resource: Resource) => {
    // Implementation for viewing resource
    console.log("Viewing:", resource.title)
  }

  const programs = Array.from(new Set(resources.map(r => r.program)))
  const types = Array.from(new Set(resources.map(r => r.type)))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Resources</h1>
          <p className="text-muted-foreground">
            Access all learning materials for your enrolled programs
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">{filteredResources.length} Resources</Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter resources by program and type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Programs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program} value={program}>
                    {program}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resources Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredResources.map((resource) => (
          <Card key={resource.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(resource.type)}
                  {getTypeBadge(resource.type)}
                </div>
                <div className="flex items-center space-x-1">
                  {resource.viewed ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      Viewed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Not viewed
                    </Badge>
                  )}
                </div>
              </div>
              <CardTitle className="text-lg">{resource.title}</CardTitle>
              <CardDescription>{resource.program}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {resource.description && (
                <p className="text-sm text-muted-foreground">{resource.description}</p>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span>{resource.size}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(resource.uploadDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(resource)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(resource)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredResources.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No resources found</h3>
            <p className="text-muted-foreground text-center">
              Try adjusting your search or filter criteria.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Resource Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Statistics</CardTitle>
          <CardDescription>Overview of your learning materials</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{resources.length}</div>
              <div className="text-sm text-gray-600">Total Resources</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {resources.filter(r => r.viewed).length}
              </div>
              <div className="text-sm text-gray-600">Viewed</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {resources.filter(r => !r.viewed).length}
              </div>
              <div className="text-sm text-gray-600">Not Viewed</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{programs.length}</div>
              <div className="text-sm text-gray-600">Programs</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 