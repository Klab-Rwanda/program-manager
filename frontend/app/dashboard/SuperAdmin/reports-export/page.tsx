"use client"

import { useState, useEffect } from "react"
import { Download, Loader2, FileText, BarChart3, Users, Calendar } from "lucide-react"
import { useAuth } from "@/lib/contexts/RoleContext"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Program {
  id: string;
  name: string;
}

interface ReportConfig {
  programId: string;
  startDate: string;
  endDate: string;
  format: string;
}

export default function ReportsExportPage() {
  const { user } = useAuth()
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)

  const [attendanceReport, setAttendanceReport] = useState<ReportConfig>({
    programId: "",
    startDate: "",
    endDate: "",
    format: "pdf"
  })

  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        // Get token from user context or authentication provider
        const token = localStorage.getItem('accessToken')

        const response = await fetch("http://localhost:8000/api/v1/programs", {
          method: "GET",
          credentials: "include",
          headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
          }
        });
        if (!response.ok) throw new Error("Failed to fetch programs");
        const json = await response.json();
        // Assuming backend returns { statusCode, data: [...] }
        const programList = Array.isArray(json.data) ? json.data : [];
        setPrograms(programList);
        if (programList.length > 0) {
          setAttendanceReport(prev => ({ ...prev, programId: programList[0].id || programList[0]._id }));
        }
      } catch (err) {
        console.error("Failed to fetch programs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrograms();
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setAttendanceReport(prev => ({ ...prev, [id]: value }))
  }

  const handleGenerateReport = async () => {
    if (!attendanceReport.programId || !attendanceReport.startDate || !attendanceReport.endDate) {
      alert("Please select a program and a date range.")
      return
    }
    
    setIsGenerating(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate file download
      const program = programs.find(p => p.id === attendanceReport.programId)
      const filename = `attendance-report-${program?.name}-${attendanceReport.startDate}-to-${attendanceReport.endDate}.${attendanceReport.format}`
      
      // Create a dummy download link
      const link = document.createElement('a')
      link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(`Attendance Report for ${program?.name}\nDate Range: ${attendanceReport.startDate} to ${attendanceReport.endDate}\nFormat: ${attendanceReport.format.toUpperCase()}\n\nThis is a sample report. In production, this would contain actual attendance data.`)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      alert("Report generated and downloaded successfully!")
    } catch (err) {
      alert(`Failed to generate report: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Data Export</h1>
        <p className="text-muted-foreground">
          Generate and download reports for analysis and record-keeping.
        </p>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Reports</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Daily/Monthly</div>
            <p className="text-xs text-muted-foreground">
              Export attendance logs for specific programs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Program Analytics</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Performance</div>
            <p className="text-xs text-muted-foreground">
              Program completion rates and metrics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Activity</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Logs</div>
            <p className="text-xs text-muted-foreground">
              User login and activity reports
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Attendance Report Generator
          </CardTitle>
          <CardDescription>
            Export daily or monthly attendance logs for a specific program.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="programId">Select Program</Label>
                  <Select 
                    value={attendanceReport.programId} 
                    onValueChange={(value) => setAttendanceReport(prev => ({ ...prev, programId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map(program => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    type="date"
                    id="startDate"
                    value={attendanceReport.startDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    type="date"
                    id="endDate"
                    value={attendanceReport.endDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format">Format</Label>
                  <Select 
                    value={attendanceReport.format} 
                    onValueChange={(value) => setAttendanceReport(prev => ({ ...prev, format: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-end pt-4 border-t">
                <Button 
                  onClick={handleGenerateReport} 
                  disabled={isGenerating || !attendanceReport.programId || !attendanceReport.startDate || !attendanceReport.endDate}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Generate & Export {attendanceReport.format.toUpperCase()}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Export Options</CardTitle>
          <CardDescription>
            Generate common reports with one click.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="font-medium">Current Month Attendance</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Export all attendance data for the current month
              </span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="font-medium">Program Performance</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Get performance metrics for all active programs
              </span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">User Activity Summary</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Summary of user logins and activities
              </span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="font-medium">System Health Report</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Overall system usage and health metrics
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



