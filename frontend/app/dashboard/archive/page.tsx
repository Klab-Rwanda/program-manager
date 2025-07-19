"use client"

import { useState, useEffect } from "react"
import { Archive, Search, Filter, Eye, Download, Calendar, Users, Award, TrendingUp, X, FileText, MapPin, Clock, DollarSign, Target, BarChart3, RotateCcw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getArchivedPrograms, unarchiveProgram, transformToArchiveItem, ArchivedProgram } from "@/lib/services/archive.service"
import { exportArchivedPDF, exportArchivedExcel, downloadBlob, exportSingleProgramPDF } from "@/lib/services/export.service"
import { toast } from "sonner"


interface ArchiveItem {
  id: string
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
  const [archivedData, setArchivedData] = useState<ArchiveItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unarchiving, setUnarchiving] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  const years = ["2024", "2023", "2022", "2021"]
  const types = ["program", "certificate", "report"]

  // Fetch archived programs from backend
  const fetchArchivedPrograms = async () => {
    setLoading(true)
    setError(null)
    try {
      const programs = await getArchivedPrograms()
      const transformedData = programs.map(transformToArchiveItem)
      setArchivedData(transformedData)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch archived programs')
      toast.error("Failed to fetch archived programs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArchivedPrograms()
  }, [])

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

  const handleUnarchive = async (item: ArchiveItem) => {
    if (!confirm(`Are you sure you want to unarchive "${item.name}"?`)) {
      return
    }

    setUnarchiving(item.id)
    try {
      await unarchiveProgram(item.id)
      toast.success(`${item.name} has been unarchived`)
      // Refresh the archive data
      fetchArchivedPrograms()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to unarchive program")
    } finally {
      setUnarchiving(null)
    }
  }

  const handleExportData = async (item: ArchiveItem) => {
    setExporting(true)
    try {
      const blob = await exportSingleProgramPDF(item.id)
      downloadBlob(blob, `${item.name}-report.pdf`)
      toast.success(`Exported ${item.name} as PDF`)
    } catch (err: any) {
      toast.error("Failed to export program")
    } finally {
      setExporting(false)
    }
  }

  const handleExportAll = async (format: 'pdf' | 'excel') => {
    setExporting(true)
    try {
      let blob: Blob
      if (format === 'pdf') {
        blob = await exportArchivedPDF()
      } else {
        blob = await exportArchivedExcel()
      }
      
      const filename = `archived-programs-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
      downloadBlob(blob, filename)
      toast.success(`Exported all archived programs as ${format.toUpperCase()}`)
      setShowExportModal(false)
    } catch (err: any) {
      toast.error(`Failed to export as ${format.toUpperCase()}`)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Archive</h1>
            <p className="text-muted-foreground">View archived programs, certificates, and reports</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading archived programs...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Archive</h1>
            <p className="text-muted-foreground">View archived programs, certificates, and reports</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchArchivedPrograms}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Archive</h1>
          <p className="text-muted-foreground">View archived programs, certificates, and reports</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowExportModal(true)}
            disabled={exporting || archivedData.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            {exporting ? "Exporting..." : "Export All"}
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
      {filteredArchive.length === 0 ? (
        <div className="text-center py-12">
          <Archive className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No archived items</h3>
          <p className="mt-1 text-sm text-gray-500">
            {archivedData.length === 0 
              ? "No programs have been archived yet." 
              : "No items match your current filters."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredArchive.map((item) => (
            <Card key={item.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(item.type)}
                    {getTypeBadge(item.type)}
                  </div>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnarchive(item)}
                    disabled={unarchiving === item.id}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detailed View Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="w-[70vw] max-w-4xl h-[85vh] max-h-[85vh] overflow-hidden p-0 z-[9999] bg-white !left-[320px] !top-[7vh] !transform-none">
          {/* Custom overlay for better background */}
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[-1]" />
          
          <div className="flex flex-col h-full">
            <DialogHeader className="p-6 pb-4 border-b bg-gray-50 flex-shrink-0">
              <DialogTitle className="text-xl">{selectedItem?.name}</DialogTitle>
              <DialogDescription className="text-base">
                {selectedItem?.type} • {selectedItem?.cohort} • {selectedItem?.location}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto p-6 bg-white min-h-0">
              {selectedItem && (
                <div className="space-y-6 pb-4">
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
            </div>
            
            <DialogFooter className="p-6 pt-4 border-t bg-gray-50 flex-shrink-0">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Close
              </Button>
              <Button onClick={() => selectedItem && handleExportData(selectedItem)}>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
              {selectedItem && (
                <Button 
                  variant="outline" 
                  onClick={() => handleUnarchive(selectedItem)}
                  disabled={unarchiving === selectedItem.id}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Unarchive
                </Button>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Export Archived Programs</DialogTitle>
            <DialogDescription>
              Choose the format to export all archived programs
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4">
            <Button
              onClick={() => handleExportAll('pdf')}
              disabled={exporting}
              className="w-full bg-[#1f497d] hover:bg-[#1a3f6b] text-white"
            >
              <FileText className="mr-2 h-4 w-4" />
              Export as PDF
            </Button>
            <Button
              onClick={() => handleExportAll('excel')}
              disabled={exporting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Export as Excel
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 