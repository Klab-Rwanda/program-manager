"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Clock, CheckCircle, XCircle, MessageSquare, Download, Eye, Loader2, AlertCircle, Award, Users } from "lucide-react"

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
  DialogFooter 
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner" 
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { useAuth } from "@/lib/contexts/RoleContext" 
import { 
  fetchCertificates, 
  fetchEligibleTrainees, 
  fetchTemplates,
  issueCertificatesToTrainees,
  DisplayCertificate,
  TraineeForCert,
  Template
} from "@/lib/services/certificates.services"


export default function CertificatesPage() { 
  const { user, role, loading: authLoading } = useAuth(); 

  // State for certificates
  const [certificates, setCertificates] = useState<DisplayCertificate[]>([]);
  const [eligibleTrainees, setEligibleTrainees] = useState<TraineeForCert[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for certificate issuance
  const [selectedTrainees, setSelectedTrainees] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [isIssuingCertificates, setIsIssuingCertificates] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch all certificate-related data
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [certsData, eligibleData, templatesData] = await Promise.all([
        fetchCertificates(),
        fetchEligibleTrainees(),
        fetchTemplates()
      ]);
      
      setCertificates(certsData);
      setEligibleTrainees(eligibleData);
      setTemplates(templatesData);

      // Set default template if available
      const defaultTemplate = templatesData.find(t => t.isDefault);
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate._id);
      }

    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load certificate data.");
      toast.error(err.response?.data?.message || "Failed to load certificate data.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []); 

  useEffect(() => {
    // Allow both program_manager and super_admin roles
    if (!authLoading && (role === 'program_manager' || role === 'super_admin')) {
      fetchAllData();
    }
  }, [authLoading, role, fetchAllData]);

  // UI Helpers
  const certificateStats = useMemo(() => [
    { 
      title: "Eligible Students", 
      value: eligibleTrainees.length.toString(), 
      description: "Ready for certification", 
      icon: Users, 
      color: "text-blue-500" 
    },
    { 
      title: "Certificates Issued", 
      value: certificates.length.toString(), 
      description: "Total certificates", 
      icon: Award, 
      color: "text-green-500" 
    },
    { 
      title: "Templates Available", 
      value: templates.length.toString(), 
      description: "Certificate designs", 
      icon: MessageSquare, 
      color: "text-purple-500" 
    },
  ], [certificates, eligibleTrainees, templates]);

  // Filtered eligible trainees for display
  const filteredEligibleTrainees = useMemo(() => {
    return eligibleTrainees.filter(trainee => {
      const matchesSearch = searchTerm === '' || 
                            trainee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            trainee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            trainee.program.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [eligibleTrainees, searchTerm]);

  // Handlers
  const handleSelectTrainee = (traineeId: string) => {
    setSelectedTrainees(prev => 
      prev.includes(traineeId) 
        ? prev.filter(id => id !== traineeId)
        : [...prev, traineeId]
    );
  };

  const handleSelectAllTrainees = () => {
    if (selectedTrainees.length === filteredEligibleTrainees.length) {
      setSelectedTrainees([]);
    } else {
      setSelectedTrainees(filteredEligibleTrainees.map(t => t._id));
    }
  };

  const handleIssueCertificates = async () => {
    if (selectedTrainees.length === 0) {
      toast.error("Please select at least one trainee.");
      return;
    }
    if (!selectedTemplate) {
      toast.error("Please select a certificate template.");
      return;
    }

    const traineesToIssue = eligibleTrainees.filter(t => selectedTrainees.includes(t._id));
    
    setIsIssuingCertificates(true);
    try {
      const results = await issueCertificatesToTrainees(traineesToIssue, selectedTemplate);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (successful > 0) {
        toast.success(`Successfully issued ${successful} certificate(s).`);
      }
      if (failed > 0) {
        toast.error(`Failed to issue ${failed} certificate(s).`);
      }

      setIssueModalOpen(false);
      setSelectedTrainees([]);
      fetchAllData(); // Refresh data

    } catch (err: any) {
      toast.error("Failed to issue certificates. Please try again.");
      console.error(err);
    } finally {
      setIsIssuingCertificates(false);
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
            onClick={() => setIssueModalOpen(true)}
            disabled={eligibleTrainees.length === 0}
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

      {/* Filter Section */}
      <Card>
        <CardHeader>
            <CardTitle>Eligible Students</CardTitle>
            <CardDescription>Students who have met the criteria for certificate issuance (80%+ score, 85%+ attendance).</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <Input 
                    placeholder="Search students, programs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleSelectAllTrainees}
                  disabled={filteredEligibleTrainees.length === 0}
                >
                  {selectedTrainees.length === filteredEligibleTrainees.length ? 'Deselect All' : 'Select All'}
                </Button>
            </div>
        </CardContent>
      </Card>

      {/* Eligible Students Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Eligible Students</CardTitle>
          <CardDescription>Select students to issue certificates</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredEligibleTrainees.length === 0 ? (
            <div className="text-center py-8">
                <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No eligible students found</h3>
                <p className="text-muted-foreground text-center">
                    {searchTerm 
                        ? "No students match your current search."
                        : "Students who meet the eligibility criteria will appear here."}
                </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input 
                      type="checkbox" 
                      checked={selectedTrainees.length === filteredEligibleTrainees.length}
                      onChange={handleSelectAllTrainees}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Final Score</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Completion Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEligibleTrainees.map((trainee) => (
                  <TableRow key={trainee._id}>
                    <TableCell>
                      <input 
                        type="checkbox" 
                        checked={selectedTrainees.includes(trainee._id)}
                        onChange={() => handleSelectTrainee(trainee._id)}
                        className="rounded border-gray-300"
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
                      <Badge variant="outline" className="text-green-600 font-semibold">
                        {trainee.finalScore}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-blue-600 font-semibold">
                        {trainee.attendanceRate}%
                      </Badge>
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

      {/* Issue Certificates Dialog */}
      <Dialog open={issueModalOpen} onOpenChange={setIssueModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Issue Certificates</DialogTitle>
            <DialogDescription>
              Issue certificates to {selectedTrainees.length} selected student(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template">Certificate Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger id="template">
                  <SelectValue placeholder="Select a certificate template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template._id} value={template._id}>
                      {template.name} {template.isDefault && "(Default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Selected Students ({selectedTrainees.length})</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {eligibleTrainees
                  .filter(t => selectedTrainees.includes(t._id))
                  .map(trainee => (
                    <div key={trainee._id} className="text-sm text-muted-foreground">
                      {trainee.name} - {trainee.program}
                    </div>
                  ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIssueModalOpen(false)} disabled={isIssuingCertificates}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                onClick={handleIssueCertificates} 
                disabled={isIssuingCertificates || selectedTrainees.length === 0 || !selectedTemplate}
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
    </div>
  )
}