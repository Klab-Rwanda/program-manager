"use client"

import { useState } from "react"
import { Archive, Search, Filter, Eye, Download, Calendar, Users, Award, TrendingUp, X, FileText, MapPin, Clock, DollarSign, Target, BarChart3 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ArchiveItem {
  id: number
  type: string
  name: string
  description: string
  completionDate: string
  participants: number
  successRate: number
  duration: string
  facilitator: string
  curriculum: string[]
  demographics: {
    ageRange: string
    gender: string
    education: string
    background: string
  }
  funding: {
    sponsor: string
    budget: string
    scholarships: number
  }
  outcomes: {
    employed: number
    avgSalary: string
    certifications: string[]
    projects: number
  }
  keyMetrics: {
    attendanceRate: number
    projectCompletionRate: number
    employmentRate: number
    satisfactionScore: number
  }
  tools: string[]
  location: string
  cohort: string
}

export default function ArchivePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterYear, setFilterYear] = useState("all")
  const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null)
  const [showModal, setShowModal] = useState(false)

  const years = ["2023", "2022", "2021"]
  const types = ["program", "certificate", "report"]

  const [archivedData] = useState<ArchiveItem[]>([
    {
      id: 1,
      type: "program",
      name: "Data Analysis Bootcamp for Women",
      description: "Comprehensive 6-month data analysis program focusing on Excel, Power BI, Python, and SQL for female graduates",
      completionDate: "2023-12-15",
      participants: 28,
      successRate: 89,
      duration: "6 months",
      facilitator: "Alice Uwimana",
      curriculum: [
        "Excel Advanced Functions",
        "Power BI Dashboard Creation",
        "Python for Data Analysis",
        "SQL Database Management",
        "Statistical Analysis",
        "Data Visualization",
      ],
      demographics: {
        ageRange: "22-28 years",
        gender: "100% Female",
        education: "University Graduates",
        background: "STEM and Business backgrounds",
      },
      funding: {
        sponsor: "Mastercard Foundation",
        budget: "$45,000",
        scholarships: 28,
      },
      outcomes: {
        employed: 25,
        avgSalary: "$800/month",
        certifications: ["Microsoft Excel Expert", "Power BI Certified", "Python Data Analysis Certificate"],
        projects: 4,
      },
      keyMetrics: {
        attendanceRate: 94,
        projectCompletionRate: 89,
        employmentRate: 89,
        satisfactionScore: 4.6,
      },
      tools: ["Microsoft Excel", "Power BI", "Python", "Jupyter Notebook", "SQL Server", "Tableau"],
      location: "Kigali, Rwanda",
      cohort: "Cohort 2023-B",
    },
    {
      id: 2,
      type: "program",
      name: "Web Development Fundamentals",
      description: "Full-stack web development program covering HTML, CSS, JavaScript, React, and Node.js for young entrepreneurs",
      completionDate: "2023-11-30",
      participants: 35,
      successRate: 92,
      duration: "4 months",
      facilitator: "Bob Nkurunziza",
      curriculum: [
        "HTML5 & CSS3",
        "JavaScript ES6+",
        "React.js",
        "Node.js & Express",
        "MongoDB",
        "Git & GitHub",
        "Responsive Design",
        "API Development",
      ],
      demographics: {
        ageRange: "18-25 years",
        gender: "60% Male, 40% Female",
        education: "High School to University",
        background: "Mixed backgrounds, entrepreneurship focus",
      },
      funding: {
        sponsor: "Government of Rwanda - ICT Ministry",
        budget: "$32,000",
        scholarships: 35,
      },
      outcomes: {
        employed: 32,
        avgSalary: "$600/month",
        certifications: ["freeCodeCamp Full Stack", "React Developer Certificate"],
        projects: 6,
      },
      keyMetrics: {
        attendanceRate: 96,
        projectCompletionRate: 92,
        employmentRate: 91,
        satisfactionScore: 4.8,
      },
      tools: ["VS Code", "React", "Node.js", "MongoDB", "Git", "Figma", "Postman"],
      location: "Kigali, Rwanda",
      cohort: "Cohort 2023-A",
    },
    {
      id: 3,
      type: "certificate",
      name: "Advanced React Development Certificates",
      description: "Certificates issued for completing advanced React.js specialization program",
      completionDate: "2023-10-20",
      participants: 15,
      successRate: 87,
      duration: "3 months",
      facilitator: "Carol Mukamana",
      curriculum: [
        "React Hooks",
        "Context API",
        "Redux Toolkit",
        "Next.js",
        "TypeScript",
        "Testing with Jest",
        "Performance Optimization",
      ],
      demographics: {
        ageRange: "23-30 years",
        gender: "53% Male, 47% Female",
        education: "University Graduates with coding experience",
        background: "Previous web development experience required",
      },
      funding: {
        sponsor: "Private Partnership - Tech Companies",
        budget: "$18,000",
        scholarships: 15,
      },
      outcomes: {
        employed: 13,
        avgSalary: "$1,200/month",
        certifications: ["React Advanced Certificate", "Next.js Developer Certificate"],
        projects: 3,
      },
      keyMetrics: {
        attendanceRate: 91,
        projectCompletionRate: 87,
        employmentRate: 87,
        satisfactionScore: 4.7,
      },
      tools: ["React", "Next.js", "TypeScript", "Redux", "Jest", "Cypress", "Vercel"],
      location: "Kigali, Rwanda",
      cohort: "Advanced Cohort 2023",
    },
    {
      id: 4,
      type: "report",
      name: "Q3 2023 Performance Report",
      description: "Quarterly performance analysis covering all programs, employment outcomes, and financial metrics",
      completionDate: "2023-09-30",
      participants: 156,
      successRate: 85,
      duration: "3 months",
      facilitator: "System Generated",
      curriculum: ["Performance Analytics", "Employment Tracking", "Financial Analysis", "Stakeholder Reporting"],
      demographics: {
        ageRange: "18-35 years",
        gender: "55% Female, 45% Male",
        education: "Mixed education levels",
        background: "Various technical backgrounds",
      },
      funding: {
        sponsor: "Multiple Sponsors",
        budget: "$125,000",
        scholarships: 156,
      },
      outcomes: {
        employed: 133,
        avgSalary: "$750/month",
        certifications: ["Various Technical Certificates"],
        projects: 15,
      },
      keyMetrics: {
        attendanceRate: 89,
        projectCompletionRate: 85,
        employmentRate: 85,
        satisfactionScore: 4.5,
      },
      tools: ["Excel", "Power BI", "SQL", "Python", "Various Development Tools"],
      location: "Multiple Locations",
      cohort: "Q3 2023 Combined",
    },
    {
      id: 5,
      type: "program",
      name: "Mobile App Development with Flutter",
      description: "Cross-platform mobile development program using Flutter and Dart for building iOS and Android applications",
      completionDate: "2023-08-15",
      participants: 22,
      successRate: 91,
      duration: "5 months",
      facilitator: "David Habimana",
      curriculum: [
        "Dart Programming",
        "Flutter Framework",
        "State Management",
        "Firebase Integration",
        "API Integration",
        "App Store Deployment",
        "UI/UX for Mobile",
      ],
      demographics: {
        ageRange: "20-28 years",
        gender: "45% Female, 55% Male",
        education: "University Graduates in Computer Science",
        background: "Some programming experience preferred",
      },
      funding: {
        sponsor: "Google Developer Program",
        budget: "$38,000",
        scholarships: 22,
      },
      outcomes: {
        employed: 20,
        avgSalary: "$900/month",
        certifications: ["Flutter Developer Certificate", "Google Mobile Developer"],
        projects: 5,
      },
      keyMetrics: {
        attendanceRate: 93,
        projectCompletionRate: 91,
        employmentRate: 91,
        satisfactionScore: 4.9,
      },
      tools: ["Flutter", "Dart", "Android Studio", "VS Code", "Firebase", "Git", "Figma"],
      location: "Kigali, Rwanda",
      cohort: "Mobile Dev 2023",
    },
  ])

  const filteredArchive = archivedData.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || item.type === filterType
    const matchesYear = filterYear === "all" || new Date(item.completionDate).getFullYear().toString() === filterYear
    return matchesSearch && matchesType && matchesYear
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "program":
        return <Archive className="h-4 w-4" />
      case "certificate":
        return <Award className="h-4 w-4" />
      case "report":
        return <FileText className="h-4 w-4" />
      default:
        return <Archive className="h-4 w-4" />
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "program":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Program</Badge>
      case "certificate":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Certificate</Badge>
      case "report":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Report</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  const handleViewDetails = (item: ArchiveItem) => {
    setSelectedItem(item)
    setShowModal(true)
  }

  const handleExportData = (item: ArchiveItem) => {
    // Implementation for exporting data
    console.log("Exporting data for:", item.name)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Archive</h1>
          <p className="text-muted-foreground">View archived programs, certificates, and reports</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter archived items by type and year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Search archive..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Archive Items */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredArchive.map((item) => (
          <Card key={item.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(item.type)}
                  {getTypeBadge(item.type)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(item)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
              <CardTitle className="text-lg">{item.name}</CardTitle>
              <CardDescription>{item.cohort}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Completed: {item.completionDate}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{item.participants} participants</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{item.successRate}% success rate</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{item.duration}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{item.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Budget: {item.funding.budget}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{item.outcomes.employed} employed</span>
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(item)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportData(item)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed View Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
            <DialogDescription>
              {selectedItem?.type} • {selectedItem?.cohort} • {selectedItem?.location}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-6">
              {/* Overview */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Overview</h3>
                <p className="text-muted-foreground">{selectedItem.description}</p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedItem.participants}</div>
                  <div className="text-sm text-gray-600">Participants</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedItem.successRate}%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{selectedItem.outcomes.employed}</div>
                  <div className="text-sm text-gray-600">Employed</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{selectedItem.keyMetrics.satisfactionScore}</div>
                  <div className="text-sm text-gray-600">Satisfaction</div>
                </div>
              </div>

              {/* Program Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Program Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Duration:</span>
                      <span className="text-sm">{selectedItem.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Facilitator:</span>
                      <span className="text-sm">{selectedItem.facilitator}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Completion Date:</span>
                      <span className="text-sm">{selectedItem.completionDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Location:</span>
                      <span className="text-sm">{selectedItem.location}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Demographics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Age Range:</span>
                      <span className="text-sm">{selectedItem.demographics.ageRange}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Gender:</span>
                      <span className="text-sm">{selectedItem.demographics.gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Education:</span>
                      <span className="text-sm">{selectedItem.demographics.education}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Background:</span>
                      <span className="text-sm">{selectedItem.demographics.background}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Curriculum */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Curriculum</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedItem.curriculum.map((item, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Tools Used */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Tools & Technologies</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {selectedItem.tools.map((tool, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Funding & Outcomes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Funding</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Sponsor:</span>
                      <span className="text-sm">{selectedItem.funding.sponsor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Budget:</span>
                      <span className="text-sm">{selectedItem.funding.budget}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Scholarships:</span>
                      <span className="text-sm">{selectedItem.funding.scholarships}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Outcomes</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Employed:</span>
                      <span className="text-sm">{selectedItem.outcomes.employed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Avg Salary:</span>
                      <span className="text-sm">{selectedItem.outcomes.avgSalary}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Projects:</span>
                      <span className="text-sm">{selectedItem.outcomes.projects}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Certifications:</span>
                      <span className="text-sm">{selectedItem.outcomes.certifications.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Key Performance Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{selectedItem.keyMetrics.attendanceRate}%</div>
                    <div className="text-xs text-gray-600">Attendance Rate</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{selectedItem.keyMetrics.projectCompletionRate}%</div>
                    <div className="text-xs text-gray-600">Project Completion</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">{selectedItem.keyMetrics.employmentRate}%</div>
                    <div className="text-xs text-gray-600">Employment Rate</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">{selectedItem.keyMetrics.satisfactionScore}/5</div>
                    <div className="text-xs text-gray-600">Satisfaction Score</div>
                  </div>
                </div>
              </div>

              {/* Certifications */}
              {selectedItem.outcomes.certifications.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Certifications Earned</h3>
                  <div className="space-y-2">
                    {selectedItem.outcomes.certifications.map((cert, index) => (
                      <Badge key={index} variant="secondary">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Close
            </Button>
            <Button onClick={() => selectedItem && handleExportData(selectedItem)}>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 