// app/dashboard/Manager/certificates/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Award,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  Wand2, // Still keeping for AI sections, though not integrated
  Send,
  Edit3, // Still keeping for template editing, though simplified
  Users,
  FileText,
  Star,
  Loader2, // For general loading
  X,
  AlertCircle, // For error alerts
  XCircle, // For closing error alerts
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner" // Import toast for notifications
import { Alert, AlertDescription } from "@/components/ui/alert" // For error display

import { useAuth } from "@/lib/contexts/RoleContext" // Import useAuth
// Import types and functions from the new service file
import {
  fetchCertificates,
  fetchTemplates,
  fetchEligibleTrainees,
  fetchPrograms,
  issueCertificatesToTrainees,
  DisplayCertificate,
  Template,
  TraineeForCert
} from "@/lib/services/certificates.services"
import { Program as BackendProgram, User as BackendUser } from "@/types" // Import BackendProgram, BackendUser for type consistency


export default function CertificatesPage() {
  const { user, role, loading: authLoading } = useAuth(); // Get user and role from context

  const [searchTerm, setSearchTerm] = useState("")
  const [filterProgram, setFilterProgram] = useState("all") // For program ID filter
  const [filterStatus, setFilterStatus] = useState("all") // Only 'issued' from backend
  const [activeTab, setActiveTab] = useState("certificates") // Default tab

  const [isLoading, setIsLoading] = useState(true); // General loading state for API calls
  const [error, setError] = useState<string | null>(null); // Error state for API calls

  // Data fetched via services
  const [programs, setPrograms] = useState<BackendProgram[]>([]);
  const [allBackendTrainees, setAllBackendTrainees] = useState<BackendUser[]>([]); // Raw trainees for eligibility calculation
  const [issuedCertificates, setIssuedCertificates] = useState<DisplayCertificate[]>([]);

  // Frontend-only states for modals and mock features (templates and AI)
  const [templates, setTemplates] = useState<Template[]>([]); // Templates are mocked
  const [eligibleTrainees, setEligibleTrainees] = useState<TraineeForCert[]>([]); // Derived from allBackendTrainees
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState("1"); // Default selected template ID (string)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]) // Store _id of selected trainees for issuance
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)


  // --- Data Fetching ---
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch programs and all trainees for dropdowns and eligibility calculations
      const [programsRes, traineesRes] = await Promise.all([
        fetchPrograms(), // Service to get all programs
        fetchAllTrainees(), // Service to get all trainees
      ]);
      setPrograms(programsRes);
      setAllBackendTrainees(traineesRes);

      // Fetch certificates based on user role
      const fetchedCerts = await fetchCertificates(role); // Pass role to service
      setIssuedCertificates(fetchedCerts);

      // Recalculate eligible trainees when programs or allBackendTrainees change
      const calculatedEligibleTrainees = await fetchEligibleTrainees(programsRes, traineesRes);
      setEligibleTrainees(calculatedEligibleTrainees);

      // Fetch templates (mocked)
      const fetchedTemplates = await fetchTemplates();
      setTemplates(fetchedTemplates);
      if (fetchedTemplates.length > 0 && !selectedTemplate) { // Only set default if not already set
        setSelectedTemplate(fetchedTemplates[0].id.toString()); // Select first template by default
      }

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load certificate data.');
      toast.error(err.response?.data?.message || 'Failed to load certificate data.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [role, selectedTemplate]); // Added selectedTemplate to dependencies to avoid re-setting default if already set

  useEffect(() => {
    if (!authLoading) { // Only fetch data once authentication state is resolved
      fetchAllData();
    }
  }, [authLoading, fetchAllData]); // fetchAllData is a dependency because it's memoized


  // --- Derived Data / Filters ---
  const filteredCertificates = issuedCertificates.filter((cert) => {
    const matchesSearch = cert.traineeName.toLowerCase().includes(searchTerm.toLowerCase()) || cert.programName.toLowerCase().includes(searchTerm.toLowerCase());
    // Filter by program ID/name (assuming filterProgram is program._id or "all")
    const matchesProgram = filterProgram === "all" || cert.program._id === filterProgram || cert.programName === filterProgram;
    // Status filter is based on frontend-derived status for flexibility
    const matchesStatus = filterStatus === "all" || cert.status === filterStatus;
    return matchesSearch && matchesProgram && matchesStatus;
  });

  // --- UI Helpers ---
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "issued": return <CheckCircle className="h-4 w-4 text-green-600" />
      case "ready": return <Clock className="h-4 w-4 text-blue-600" /> // Use Clock for "ready"
      case "pending": return <Clock className="h-4 w-4 text-orange-600" /> // Use Clock for "pending"
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A+": case "A": return "bg-green-100 text-green-800"
      case "A-": case "B+": return "bg-blue-100 text-blue-800"
      case "B": case "B-": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  // --- Handlers ---
  const handleGenerateWithAI = async (formData: any) => {
    setIsGeneratingAI(true)
    // Simulate AI generation time
    await new Promise((resolve) => setTimeout(resolve, 3000))
    const newTemplate: Template = {
      id: templates.length + 1, name: `AI ${formData.style} Certificate`, description: `AI-generated ${formData.style.toLowerCase()} certificate with ${formData.colorScheme} color scheme`, isDefault: false, style: formData.style, colorScheme: formData.colorScheme,
    }
    setTemplates([...templates, newTemplate])
    setIsGeneratingAI(false)
    setShowTemplateModal(false)
    toast.success("AI template generated successfully!")
  }

  const handlePreviewTemplate = (template: Template) => {
    setPreviewTemplate(template)
    setShowPreviewModal(true)
  }

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template)
    setShowEditModal(true)
  }

  const handleSaveTemplate = (updatedTemplate: Template) => {
    setTemplates(templates.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)))
    setShowEditModal(false)
    setEditingTemplate(null)
    toast.success("Template updated successfully!")
  }

  const handleIssueCertificates = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one trainee to issue certificates.")
      return;
    }
    if (!selectedTemplate) {
      toast.error("Please select a certificate template.")
      return;
    }

    setIsLoading(true); // Indicate loading for the issuance process
    try {
      // Find the full trainee objects for the selected IDs to pass to the service
      const traineesToIssue = eligibleTrainees.filter(t => selectedStudents.includes(t._id));

      if (traineesToIssue.length === 0) {
        toast.error("No valid trainees selected for issuance.");
        setIsLoading(false);
        return;
      }

      // Call the service function to issue certificates
      const results = await issueCertificatesToTrainees(traineesToIssue, selectedTemplate);

      let successCount = 0;
      let failCount = 0;

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value?.data.success) {
          successCount++;
        } else {
          failCount++;
          console.error("Failed to issue certificate for one trainee:", result);
        }
      });

      if (successCount > 0) {
        toast.success(`Successfully issued ${successCount} certificate(s)! Trainees have been notified.`);
        await fetchAllData(); // Re-fetch all data to update the certificates list
      }
      if (failCount > 0) {
        toast.warning(`Failed to issue ${failCount} certificate(s). Some may already exist or an error occurred.`);
      }

      setSelectedStudents([]); // Clear selections
      setShowGenerateModal(false); // Close modal

    } catch (err: any) {
      toast.error(err.response?.data?.message || "An unexpected error occurred while issuing certificates.");
      console.error(err);
    } finally {
      setIsLoading(false); // End loading
    }
  }

  const handleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    )
  }

  // --- Statistics ---
  const certificateStats = {
    total: issuedCertificates.length,
    issued: issuedCertificates.filter((c) => c.status === "issued").length,
    ready: issuedCertificates.filter((c) => c.status === "ready").length, // 'ready' is frontend derived
    eligible: eligibleTrainees.length,
  }

  // Render loading spinner if authentication or data is loading
  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Role-based access control for the whole page
  // Only Program Manager, Super Admin, or Trainee should see this page
  if (!user || (role !== 'program_manager' && role !== 'super_admin' && role !== 'trainee')) {
    return (
        <Card>
            <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">You do not have permission to view this page.</p></CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certificate Management</h1>
          <p className="text-muted-foreground">Generate, customize and distribute certificates</p>
        </div>
        {(role === 'program_manager' || role === 'super_admin') && ( // Only PM/SA can see these buttons
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setShowTemplateModal(true)}>
              <Wand2 className="mr-2 h-4 w-4" />
              AI Templates
            </Button>
            <Button onClick={() => setShowGenerateModal(true)} disabled={eligibleTrainees.length === 0}>
              <Award className="mr-2 h-4 w-4" />
              Issue Certificates
            </Button>
          </div>
        )}
      </div>

      {error && ( // Display general error messages
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
                {error}
                <Button variant="ghost" size="sm" onClick={() => setError(null)}><XCircle className="h-4 w-4" /></Button>
            </AlertDescription>
        </Alert>
      )}

      {/* Statistics for Program Manager/Super Admin */}
      {(role === 'program_manager' || role === 'super_admin') && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                <Award className="h-6 w-6 text-custom-blue" />
              </div>
              <div>
                <p className="text-2xl font-bold">{certificateStats.total}</p>
                <p className="text-sm text-muted-foreground">Total Certificates</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                <CheckCircle className="h-6 w-6 text-custom-blue" />
              </div>
              <div>
                <p className="text-2xl font-bold">{certificateStats.issued}</p>
                <p className="text-sm text-muted-foreground">Issued</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                <Clock className="h-6 w-6 text-custom-blue" />
              </div>
              <div>
                <p className="text-2xl font-bold">{certificateStats.ready}</p>
                <p className="text-sm text-muted-foreground">Ready (Frontend derived)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                <Users className="h-6 w-6 text-custom-blue" />
              </div>
              <div>
                <p className="text-2xl font-bold">{certificateStats.eligible}</p>
                <p className="text-sm text-muted-foreground">Eligible Trainees (Frontend derived)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="certificates" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>My Certificates</span>
          </TabsTrigger>
          {(role === 'program_manager' || role === 'super_admin') && ( // Only PM/SA see these tabs
            <>
              <TabsTrigger value="templates" className="flex items-center space-x-2">
                <Edit3 className="h-4 w-4" />
                <span>Templates</span>
              </TabsTrigger>
              <TabsTrigger value="eligible" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Eligible Trainees</span>
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="certificates" className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search certificates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Programs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program._id} value={program._id}> {/* Use program._id for filter */}
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="issued">Issued</SelectItem>
                {/* Only 'issued' comes from backend, others are frontend derived/mocked */}
                <SelectItem value="ready">Ready (Frontend derived)</SelectItem>
                <SelectItem value="pending">Pending (Frontend derived)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredCertificates.length === 0 ? (
            <EmptyState
              type="certificates"
              title="No certificates found"
              description="No certificates match your current search criteria. If you are a trainee, this is where your earned certificates will appear."
            />
          ) : (
            <div className="space-y-4">
              {filteredCertificates.map((certificate) => (
                <Card key={certificate._id}> {/* Use _id for key */}
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                          <span className="text-sm font-semibold text-blue-600">
                            {certificate.traineeName.split(" ").map((n) => n[0]).join("")}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{certificate.traineeName}</h3>
                          <p className="text-sm text-muted-foreground">{certificate.traineeEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline">{certificate.programName}</Badge>
                        <Badge className={getGradeColor(certificate.grade)}>{certificate.grade}</Badge>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(certificate.status)}
                          <span className="text-sm capitalize">{certificate.status}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {(role === 'program_manager' || role === 'super_admin') && ( // Only PM/SA see Templates tab content
          <TabsContent value="templates" className="space-y-4">
            {templates.length === 0 ? (
              <EmptyState
                type="templates"
                title="No certificate templates"
                description="Create your first certificate template using AI to get started with issuing certificates."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {template.name}
                        {template.isDefault && (
                          <Badge variant="secondary" className="flex items-center space-x-1">
                            <Star className="h-3 w-3" />
                            <span>Default</span>
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="h-32 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                        <span className="text-sm text-muted-foreground">Certificate Preview</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>
                          <Edit3 className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handlePreviewTemplate(template)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center p-6 h-full">
                    <Wand2 className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Generate with AI</h3>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Create custom certificate templates using AI
                    </p>
                    <Button onClick={() => setShowTemplateModal(true)}>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Template
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        )}

        {(role === 'program_manager' || role === 'super_admin') && ( // Only PM/SA see Eligible Trainees tab content
          <TabsContent value="eligible" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {eligibleTrainees.length === 0 ? (
                  <EmptyState
                    type="eligible"
                    title="No eligible trainees"
                    description="No trainees meet the criteria for certificate eligibility yet. Once they do, they will appear here."
                  />
              ) : (
                  eligibleTrainees.map((trainee) => (
                    <Card key={trainee._id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          {trainee.name}
                          <Badge className="bg-green-100 text-green-800">Eligible</Badge>
                        </CardTitle>
                        {/* Ensure trainee.program is correctly accessed (it's a full object from fetchEligibleTrainees) */}
                        <CardDescription>{trainee.program.name}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Final Score</span>
                          <span className="font-semibold">{trainee.finalScore}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Attendance</span>
                          <span className="font-semibold">{trainee.attendanceRate}%</span>
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => {
                            setSelectedStudents([trainee._id]) // Select this one student
                            setShowGenerateModal(true) // Open the generate modal
                          }}
                        >
                          <Award className="mr-2 h-4 w-4" />
                          Generate Certificate
                        </Button>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* AI Template Generation Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Certificate Template with AI</DialogTitle>
            <DialogDescription>
              Create custom certificate templates using AI
            </DialogDescription>
          </DialogHeader>
          {isGeneratingAI ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mb-4" />
              <h3 className="font-semibold mb-2">AI is generating your template...</h3>
              <p className="text-sm text-muted-foreground">This may take a few moments</p>
            </div>
          ) : (
            <AITemplateForm onGenerate={handleGenerateWithAI} />
          )}
        </DialogContent>
      </Dialog>

      {/* Certificate Generation Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Issue Certificates</DialogTitle>
            <DialogDescription>
              Select template and trainees to issue certificates
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label>Select Template</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 border rounded-lg cursor-pointer ${
                      selectedTemplate === template.id.toString() ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    }`}
                    onClick={() => setSelectedTemplate(template.id.toString())}
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-muted-foreground">{template.description}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Select Trainees ({selectedStudents.length} selected)</Label>
              <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                {eligibleTrainees.length === 0 ? (
                    <p className="text-sm italic text-muted-foreground">No eligible trainees found.</p>
                ) : (
                    eligibleTrainees.map((trainee) => (
                      <div key={trainee._id} className="flex items-center space-x-3 p-2 border rounded-lg">
                        <Checkbox
                          checked={selectedStudents.includes(trainee._id)}
                          onCheckedChange={() => handleStudentSelection(trainee._id)}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{trainee.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {trainee.program.name} • {trainee.finalScore}% • {trainee.attendanceRate}% attendance
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleIssueCertificates}
              disabled={isLoading || !selectedTemplate || selectedStudents.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Issuing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Issue & Send {selectedStudents.length} Certificate{selectedStudents.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Certificate Preview - {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-8 text-center">
            <div className="text-2xl font-bold mb-4">KLAB</div>
            <div className="text-xl font-semibold mb-2">Certificate of Achievement</div>
            <div className="text-sm text-muted-foreground mb-4">This is to certify that</div>
            <div className="text-lg font-medium mb-2">[Trainee Name]</div>
            <div className="text-sm mb-8">has successfully completed the [Program Name] program</div>
            <div className="flex justify-between">
              <div className="text-center">
                <div className="border-t border-gray-300 w-32 mx-auto mb-2"></div>
                <div className="text-sm font-medium">Program Manager</div>
              </div>
              <div className="text-center">
                <div className="border-t border-gray-300 w-32 mx-auto mb-2"></div>
                <div className="text-sm font-medium">Director</div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
              Close
            </Button>
            <Button onClick={() => previewTemplate && handleEditTemplate(previewTemplate)}>
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Template - {editingTemplate?.name}</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <EditTemplateForm
              template={editingTemplate}
              onSave={handleSaveTemplate}
              onCancel={() => setShowEditModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// AI Template Form Component (remains unchanged as it's frontend-only mock)
function AITemplateForm({ onGenerate }: { onGenerate: (formData: any) => void }) {
  const [formData, setFormData] = useState({
    style: "professional",
    colorScheme: "blue",
    elements: {
      logo: true,
      signature: true,
      partners: false,
      qrCode: false,
    },
  })

  const handleSubmit = () => {
    onGenerate(formData)
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Template Style</Label>
        <Select value={formData.style} onValueChange={(value) => setFormData({ ...formData, style: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="professional">Professional & Clean</SelectItem>
            <SelectItem value="modern">Modern & Creative</SelectItem>
            <SelectItem value="classic">Classic & Traditional</SelectItem>
            <SelectItem value="minimalist">Minimalist</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Color Scheme</Label>
        <div className="flex space-x-2 mt-2">
          {["blue", "gray", "black"].map((color) => (
            <div
              key={color}
              className={`w-8 h-8 rounded-full border-2 cursor-pointer ${
                formData.colorScheme === color ? "border-blue-500" : "border-gray-300"
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setFormData({ ...formData, colorScheme: color })}
            />
          ))}
        </div>
      </div>
      <div>
        <Label>Include Elements</Label>
        <div className="space-y-2 mt-2">
          {Object.entries(formData.elements).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                checked={value}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    elements: { ...formData.elements, [key]: checked },
                  })
                }
              />
              <Label className="text-sm capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</Label>
            </div>
          ))}
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit}>
          <Wand2 className="mr-2 h-4 w-4" />
          Generate Template
        </Button>
      </DialogFooter>
    </div>
  )
}

// Edit Template Form Component
function EditTemplateForm({
  template,
  onSave,
  onCancel
}: {
  template: Template
  onSave: (template: Template) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: template.name,
    description: template.description,
    style: template.style || "professional",
    colorScheme: template.colorScheme || "blue",
    elements: {
      logo: true,
      signature: true,
      partners: false,
      qrCode: false,
    },
  })

  const handleSubmit = () => {
    const updatedTemplate: Template = {
      ...template,
      ...formData,
    }
    onSave(updatedTemplate)
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Template Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div>
        <Label>Description</Label>
        <textarea
          className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <div>
        <Label>Template Style</Label>
        <Select value={formData.style} onValueChange={(value) => setFormData({ ...formData, style: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="professional">Professional & Clean</SelectItem>
            <SelectItem value="modern">Modern & Creative</SelectItem>
            <SelectItem value="classic">Classic & Traditional</SelectItem>
            <SelectItem value="minimalist">Minimalist</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Color Scheme</Label>
        <div className="flex space-x-2 mt-2">
          {["blue", "gray", "black"].map((color) => (
            <div
              key={color}
              className={`w-8 h-8 rounded-full border-2 cursor-pointer ${
                formData.colorScheme === color ? "border-blue-500" : "border-gray-300"
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setFormData({ ...formData, colorScheme: color })}
            />
          ))}
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          <Edit3 className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </DialogFooter>
    </div>
  )
}