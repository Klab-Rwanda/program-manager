"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Award,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  Wand2,
  Send, // Keep Send icon for resend button
  Edit3,
  Users,
  FileText,
  Star,
  Calendar,
  Loader2,
  XCircle,
  AlertCircle, // Added AlertCircle for ineligible reasons
  Trash2 
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner" 

import { useAuth } from "@/lib/contexts/RoleContext" 
import { 
  fetchCertificates, 
  fetchStudentsEligibility, 
  fetchTemplates,
  issueCertificatesToTrainees,
  resendCertificateNotification, // NEW: Import resend service
  DisplayCertificate,
  TraineeForCert, 
  Template,
  createCertificateTemplate,
  updateCertificateTemplate,
  deleteCertificateTemplate
} from "@/lib/services/certificates.services"
import { Alert, AlertDescription } from "@/components/ui/alert"


export default function CertificatesPage() { 
  const { user, role, loading: authLoading } = useAuth(); 

  // State for certificates
  const [certificates, setCertificates] = useState<DisplayCertificate[]>([]);
  // Store ALL students with eligibility status
  const [allStudentsWithEligibility, setAllStudentsWithEligibility] = useState<TraineeForCert[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for certificate issuance
  const [selectedTraineeIds, setSelectedTraineeIds] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(""); // Use _id for templates
  const [isIssuingCertificates, setIsIssuingCertificates] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);

  // Filter states for students table
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEligibility, setFilterEligibility] = useState("all"); // 'all', 'eligible', 'not-eligible'

  // State for template management modals
  const [showTemplateModal, setShowTemplateModal] = useState(false); // AI Generate Template
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // Edit Template
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false); // Preview Template
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const [isResendingNotification, setIsResendingNotification] = useState<string | null>(null); // To track loading state for individual resend buttons


  // Fetch all certificate-related data
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [certsData, studentsEligibilityData, templatesData] = await Promise.all([
        fetchCertificates(), 
        fetchStudentsEligibility(), 
        fetchTemplates()
      ]);
      
      setCertificates(certsData);
      setAllStudentsWithEligibility(studentsEligibilityData); // Store all students
      setTemplates(templatesData);

      // Set default template if available
      const defaultTemplate = templatesData.find(t => t.isDefault);
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate._id);
      } else if (templatesData.length > 0) {
          setSelectedTemplateId(templatesData[0]._id); // Fallback to first if no default
      } else {
          setSelectedTemplateId(""); // No templates available
      }

    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load certificate data.");
      toast.error(err.response?.data?.message || "Failed to load certificate data.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [role, user]); // Depend on role and user as filtering may depend on them

  useEffect(() => {
    if (!authLoading && (role === 'program_manager' || role === 'super_admin')) {
      fetchAllData();
    }
  }, [authLoading, role, fetchAllData]);

  // UI Helpers
  const certificateStats = useMemo(() => [
    { 
      title: "Eligible Students", 
      value: allStudentsWithEligibility.filter(s => s.isEligible).length.toString(), 
      description: "Ready for certification", 
      icon: Users, 
      color: "text-blue-600" 
    },
    { 
      title: "Certificates Issued", 
      value: certificates.length.toString(), 
      description: "Total certificates", 
      icon: Award, 
      color: "text-blue-600" 
    },
    { 
      title: "Templates Available", 
      value: templates.length.toString(), 
      description: "Certificate designs", 
      icon: FileText, 
      color: "text-blue-600" 
    },
  ], [certificates, allStudentsWithEligibility, templates]);

  // Filtered students for display in the table
  const filteredStudents = useMemo(() => {
    return allStudentsWithEligibility.filter(student => {
      const matchesSearch = searchTerm === '' || 
                            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            student.program.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesEligibilityFilter = filterEligibility === "all" ||
                                       (filterEligibility === "eligible" && student.isEligible) ||
                                       (filterEligibility === "not-eligible" && !student.isEligible);
      
      return matchesSearch && matchesEligibilityFilter;
    });
  }, [allStudentsWithEligibility, searchTerm, filterEligibility]);

  // Handlers for student selection
  const handleSelectTrainee = (traineeId: string, isEligible: boolean) => {
    if (!isEligible) {
        toast.warning("You can only issue certificates to eligible students.");
        return;
    }
    setSelectedTraineeIds(prev => 
      prev.includes(traineeId) 
        ? prev.filter(id => id !== traineeId)
        : [...prev, traineeId]
    );
  };

  const handleSelectAllEligibleTrainees = () => {
    const eligibleFiltered = filteredStudents.filter(t => t.isEligible);
    if (selectedTraineeIds.length === eligibleFiltered.length) {
      setSelectedTraineeIds([]);
    } else {
      setSelectedTraineeIds(eligibleFiltered.map(t => t._id)); 
    }
  };

  const handleIssueCertificates = async () => {
    if (selectedTraineeIds.length === 0) {
      toast.error("Please select at least one eligible trainee.");
      return;
    }
    if (!selectedTemplateId) {
      toast.error("Please select a certificate template.");
      return;
    }

    // Filter to ensure only truly eligible students (selected AND eligible) are processed
    const traineesToIssue = allStudentsWithEligibility.filter(t => selectedTraineeIds.includes(t._id) && t.isEligible);
    
    if (traineesToIssue.length === 0) {
        toast.error("No eligible students selected for issuance.");
        return;
    }

    setIsIssuingCertificates(true);
    try {
      const results = await issueCertificatesToTrainees(traineesToIssue, selectedTemplateId);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (successful > 0) {
        toast.success(`Successfully issued ${successful} certificate(s).`);
      }
      if (failed > 0) {
        toast.error(`Failed to issue ${failed} certificate(s).`);
      }

      setIssueModalOpen(false);
      setSelectedTraineeIds([]); 
      fetchAllData(); 
    } catch (err: any) {
      toast.error("Failed to issue certificates. Please try again.");
      console.error(err);
    } finally {
      setIsIssuingCertificates(false);
    }
  };

  // NEW: Handle Resend Notification
  const handleResendNotification = async (certificateId: string, traineeName: string) => {
    setIsResendingNotification(certificateId);
    try {
      await resendCertificateNotification(certificateId);
      toast.success(`Notification resent to ${traineeName}.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to resend notification to ${traineeName}.`);
      console.error(err);
    } finally {
      setIsResendingNotification(null);
    }
  };


  // Template management handlers (from previous code)
  const handleGenerateWithAI = async (formData: Partial<Template>) => {
    setIsGeneratingAI(true);
    try {
      const newTemplate = await createCertificateTemplate(formData);
      toast.success("AI template generated and saved!");
      setTemplates(prev => [...prev, newTemplate]);
      setShowTemplateModal(false);
      setSelectedTemplateId(newTemplate._id);
    } catch (error: any) {
      console.error("Error generating template:", error);
      toast.error(error.response?.data?.message || "Failed to generate template.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handlePreviewTemplate = (template: Template) => {
    setPreviewTemplate(template);
    setShowPreviewModal(true);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setShowEditModal(true);
    setShowPreviewModal(false);
  };

  const handleSaveTemplate = async (updatedTemplate: Template) => {
    try {
      await updateCertificateTemplate(updatedTemplate._id, updatedTemplate);
      toast.success("Template updated successfully!");
      fetchAllData(); 
      setShowEditModal(false);
      setEditingTemplate(null);
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast.error(error.response?.data?.message || "Failed to save template.");
    } finally {
      // Ensure that if the updated template becomes the new default, it's selected
      if (updatedTemplate.isDefault) {
          setSelectedTemplateId(updatedTemplate._id);
      } else {
          // If the previously selected default is no longer default, find a new default
          const currentDefault = templates.find(t => t._id === selectedTemplateId && t.isDefault);
          if (!currentDefault && templates.length > 0) {
              const newDefault = templates.find(t => t.isDefault) || templates[0];
              setSelectedTemplateId(newDefault._id);
          }
      }
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    toast(`Are you sure you want to delete this template?`, {
        description: "This action cannot be undone.",
        action: {
            label: "Delete",
            onClick: async () => {
                try {
                    await deleteCertificateTemplate(templateId);
                    toast.success("Template deleted successfully!");
                    fetchAllData(); 
                } catch (error: any) {
                    toast.error(error.response?.data?.message || "Failed to delete template.");
                }
            }
        },
        cancel: { label: "Cancel" }
    });
  };

  const getGradeColor = (grade: number) => { 
    if (grade >= 90) return 'bg-green-100 text-green-800';
    if (grade >= 80) return 'bg-blue-100 text-blue-800';
    if (grade >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  
  const getEligibilityBadge = (isEligible: boolean, reason: string) => {
      if (isEligible) {
          return <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="h-3 w-3"/>Eligible</Badge>;
      } else {
          return <Badge variant="destructive" className="flex items-center gap-1" title={reason}><AlertCircle className="h-3 w-3"/>{reason}</Badge>;
      }
  };


  // Render nothing or a loading spinner if authentication is still loading
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Access control: Only program_manager and super_admin should see this page
  if (!user || (role !== 'program_manager' && role !== 'super_admin')) {
    return (
        <Card>
            <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You do not have permission to view this page. This page is restricted to Program Managers and Super Administrators.
              </p>
            </CardContent>
        </Card>
    );
  }

  if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certificate Management</h1>
          <p className="text-muted-foreground">Manage and issue certificates to eligible students</p>
        </div>
        <div className="flex gap-2">
          <Button 
            type="button" 
            onClick={() => setShowTemplateModal(true)}
          >
            <Wand2 className="mr-2 h-4 w-4" />
            AI Templates
          </Button>
          <Button 
            type="button" 
            onClick={() => setIssueModalOpen(true)}
            disabled={allStudentsWithEligibility.filter(s => s.isEligible).length === 0} 
          >
            <Award className="mr-2 h-4 w-4" />
            Issue Certificates
          </Button>
          <Button type="button" variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {error && ( 
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
                {error}
                <Button type="button" variant="ghost" size="sm" onClick={() => setError(null)}>
                  <XCircle className="h-4 w-4" />
                </Button>
            </AlertDescription>
        </Alert>
      )}

      {/* Certificate Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {certificateStats.map((stat, index) => (
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

      {/* Certificates Table Section */}
      <Card>
        <CardHeader>
            <CardTitle>Issued Certificates</CardTitle>
            <CardDescription>View and manage all certificates that have been issued.</CardDescription>
        </CardHeader>
        <CardContent>
            {certificates.length === 0 && !isLoading ? (
                <div className="text-center py-8">
                    <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No certificates issued yet</h3>
                    <p className="text-muted-foreground text-center">
                        Certificates issued to eligible students will appear here.
                    </p>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Program</TableHead>
                            <TableHead>Issued On</TableHead>
                            <TableHead>Certificate ID</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {certificates.map((cert) => (
                            <TableRow key={cert._id}>
                                <TableCell>
                                    <div className="font-medium">{cert.traineeName}</div>
                                    <div className="text-xs text-muted-foreground">{cert.traineeEmail}</div>
                                </TableCell>
                                <TableCell>{cert.program}</TableCell>
                                <TableCell>{new Date(cert.issueDate).toLocaleDateString()}</TableCell>
                                <TableCell className="font-mono text-sm">{cert.certificateId}</TableCell>
                                <TableCell className="text-right">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleDownloadCertificate(cert._id, cert.traineeName, cert.program)}
                                        title="Download Certificate"
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleResendNotification(cert._id, cert.traineeName)}
                                        disabled={isResendingNotification === cert._id}
                                        title="Resend Notification"
                                    >
                                        {isResendingNotification === cert._id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>

      {/* Students Table Section */}
      <Card>
        <CardHeader>
            <CardTitle>All Students & Eligibility</CardTitle>
            <CardDescription>View all students in completed programs, their performance, and eligibility status.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <Input 
                    placeholder="Search students, programs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={filterEligibility} onValueChange={setFilterEligibility}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by eligibility" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Students</SelectItem>
                        <SelectItem value="eligible">Eligible Only</SelectItem>
                        <SelectItem value="not-eligible">Not Eligible</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {filteredStudents.length === 0 && !isLoading ? (
                <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No students found</h3>
                    <p className="text-muted-foreground text-center">
                        {searchTerm || filterEligibility !== 'all'
                            ? "No students match your current filters."
                            : "Students from completed programs will appear here with their eligibility status."}
                    </p>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <input 
                                    type="checkbox" 
                                    checked={selectedTraineeIds.length === filteredStudents.filter(t => t.isEligible).length && filteredStudents.filter(t => t.isEligible).length > 0}
                                    onChange={handleSelectAllEligibleTrainees}
                                    className="rounded border-gray-300"
                                    disabled={filteredStudents.filter(t => t.isEligible).length === 0}
                                />
                            </TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Program</TableHead>
                            <TableHead>Final Score</TableHead>
                            <TableHead>Attendance</TableHead>
                            <TableHead>Eligibility</TableHead> {/* New column */}
                            <TableHead>Completion Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStudents.map((trainee) => (
                            <TableRow key={trainee._id}>
                                <TableCell>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedTraineeIds.includes(trainee._id)}
                                        onChange={() => handleSelectTrainee(trainee._id, trainee.isEligible)}
                                        className="rounded border-gray-300"
                                        disabled={!trainee.isEligible} // Disable checkbox if not eligible
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage
                                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${trainee.email}`}
                                                alt={trainee.name}
                                            />
                                            <AvatarFallback className="text-xs">
                                                {trainee.name.split(" ").map((n) => n[0]).join("")}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-foreground">{trainee.name}</p>
                                            <p className="text-xs text-muted-foreground">{trainee.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">{trainee.program}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={getGradeColor(trainee.finalScore)}>
                                        {trainee.finalScore}%
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={trainee.attendanceRate >= 85 ? 'text-blue-600 font-semibold' : 'text-red-600 font-semibold'}>
                                        {trainee.attendanceRate}%
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {getEligibilityBadge(trainee.isEligible, trainee.eligibilityReason)} {/* New cell */}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {new Date(trainee.completionDate).toLocaleDateString()}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>

      {/* Templates Tab (moved from main tabs for better structure, now a dedicated section) */}
      <Card>
        <CardHeader>
            <CardTitle>Certificate Templates</CardTitle>
            <CardDescription>Manage and customize the design of your certificates.</CardDescription>
        </CardHeader>
        <CardContent>
            {templates.length === 0 ? (
                <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No certificate templates</h3>
                    <p className="text-muted-foreground text-center mb-4">
                        Create your first certificate template using AI to get started.
                    </p>
                    <Button onClick={() => setShowTemplateModal(true)}>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generate Template
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                        <Card key={template._id}>
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
                                {/* Placeholder for template preview */}
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
                                    <Button variant="destructive" size="sm" onClick={() => handleDeleteTemplate(template._id)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {templates.length > 0 && ( // Only show "Generate with AI" card if there are already templates
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
                    )}
                </div>
            )}
        </CardContent>
      </Card>


      {/* Issue Certificates Dialog */}
      <Dialog open={issueModalOpen} onOpenChange={setIssueModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Issue Certificates</DialogTitle>
            <DialogDescription>
              Issue certificates to {selectedTraineeIds.length} selected student(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template">Certificate Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger id="template">
                  <SelectValue placeholder="Select a certificate template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template._id} value={template._id}>
                      {template.name} {template.isDefault && "(Default)"}
                    </SelectItem>
                  ))}
                  {templates.length === 0 && <p className="text-sm text-muted-foreground p-2">No templates available</p>}
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Selected Students ({selectedTraineeIds.length})</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {allStudentsWithEligibility
                  .filter(t => selectedTraineeIds.includes(t._id))
                  .map(trainee => (
                    <div key={trainee._id} className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600"/>
                      {trainee.name} - {trainee.program}
                    </div>
                  ))}
              </div>
              {selectedTraineeIds.length === 0 && (
                  <p className="text-sm text-muted-foreground">No students selected.</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIssueModalOpen(false)} disabled={isIssuingCertificates}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                onClick={handleIssueCertificates} 
                disabled={isIssuingCertificates || selectedTraineeIds.length === 0 || !selectedTemplateId}
              >
                {isIssuingCertificates ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Issuing...
                  </>
                ) : (
                  <>
                    <Award className="mr-2 h-4 w-4" />
                    Issue Certificates
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Template Generation Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Certificate Template with AI</DialogTitle>
            <DialogDescription>
              Create custom certificate templates by describing your needs or selecting styles.
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

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Certificate Preview - {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-8 text-center bg-gray-50">
            {/* This is a static mock. In a real app, you'd use a dynamic rendering engine based on htmlContent */}
            <div className="text-2xl font-bold mb-4">KLAB</div>
            <div className="text-xl font-semibold mb-2">Certificate of Achievement</div>
            <div className="text-sm text-muted-foreground mb-4">This is to certify that</div>
            <div className="text-lg font-medium mb-2">[Student Name]</div>
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
            {previewTemplate?.htmlContent && (
                <div className="mt-4 p-2 border-t border-dashed text-xs text-muted-foreground">
                    Note: This template uses custom HTML content, which might render differently.
                </div>
            )}
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

// AI Template Form Component
interface AITemplateFormProps {
  onGenerate: (formData: Partial<Template>) => void;
}

function AITemplateForm({ onGenerate }: AITemplateFormProps) {
  const [formData, setFormData] = useState<Partial<Template>>({
    name: "",
    description: "",
    style: "professional",
    colorScheme: "blue",
    isDefault: false,
  });

  const colorOptions = ["blue", "gray", "black", "green", "purple", "red"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
        toast.error("Template name is required.");
        return;
    }
    onGenerate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="templateName">Template Name</Label>
        <Input 
            id="templateName" 
            value={formData.name} 
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
            required 
            placeholder="e.g., KLab Completion Certificate"
        />
      </div>
      <div>
        <Label htmlFor="templateDescription">Description (Optional)</Label>
        <textarea
          id="templateDescription"
          className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Briefly describe this template's purpose and design."
        />
      </div>
      <div>
        <Label htmlFor="templateStyle">Template Style</Label>
        <Select value={formData.style} onValueChange={(value) => setFormData({ ...formData, style: value as string })}>
          <SelectTrigger id="templateStyle">
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
          {colorOptions.map((color) => (
            <div
              key={color}
              className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-all duration-200 ${
                formData.colorScheme === color ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-300"
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setFormData({ ...formData, colorScheme: color })}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center space-x-2">
          <Checkbox 
              id="isDefault" 
              checked={formData.isDefault} 
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: !!checked }))}
          />
          <Label htmlFor="isDefault">Set as Default Template</Label>
      </div>
      <DialogFooter>
        <Button type="submit">
          <Wand2 className="mr-2 h-4 w-4" />
          Generate Template
        </Button>
      </DialogFooter>
    </form>
  )
}

// Edit Template Form Component
interface EditTemplateFormProps {
  template: Template
  onSave: (template: Template) => void
  onCancel: () => void
}

function EditTemplateForm({ template, onSave, onCancel }: EditTemplateFormProps) {
  const [formData, setFormData] = useState<Partial<Template>>({
    _id: template._id,
    name: template.name,
    description: template.description,
    style: template.style,
    colorScheme: template.colorScheme,
    isDefault: template.isDefault,
    htmlContent: template.htmlContent,
  });

  const colorOptions = ["blue", "gray", "black", "green", "purple", "red"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
        toast.error("Template name is required.");
        return;
    }
    onSave(formData as Template); // Cast back to Template since we know _id exists
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="editTemplateName">Template Name</Label>
        <Input
          id="editTemplateName"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="editTemplateDescription">Description</Label>
        <textarea
          id="editTemplateDescription"
          className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="editTemplateStyle">Template Style</Label>
        <Select value={formData.style} onValueChange={(value) => setFormData({ ...formData, style: value })}>
          <SelectTrigger id="editTemplateStyle">
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
          {colorOptions.map((color) => (
            <div
              key={color}
              className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-all duration-200 ${
                formData.colorScheme === color ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-300"
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setFormData({ ...formData, colorScheme: color })}
            />
          ))}
        </div>
      </div>
      <div>
          <Label htmlFor="editHtmlContent">Custom HTML Content (Advanced)</Label>
          <textarea
              id="editHtmlContent"
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
              value={formData.htmlContent || ''}
              onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
              placeholder="Paste custom HTML for advanced template design. Variables like [STUDENT_NAME], [PROGRAM_NAME] can be used."
          />
          <p className="text-xs text-muted-foreground mt-1">This will override selected style/color.</p>
      </div>
      <div className="flex items-center space-x-2">
          <Checkbox 
              id="editIsDefault" 
              checked={formData.isDefault} 
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: !!checked }))}
          />
          <Label htmlFor="editIsDefault">Set as Default Template</Label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Edit3 className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  )
}