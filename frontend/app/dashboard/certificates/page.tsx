"use client"

import { useEffect, useState } from "react"
import {
  Award,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  Wand2,
  Send,
  Edit3,
  Users,
  FileText,
  Star,
  Calendar,
  Loader2,
  X,
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
import { Trainee, Program, Certificate, Template } from "@/types"
import {
  fetchCertificates,
  fetchTemplates,
  fetchEligibleTrainees,
  fetchPrograms,
  issueCertificatesToTrainees,
} from "@/lib/services/certificates.services"

export default function CertificatesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProgram, setFilterProgram] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(1);
  const [activeTab, setActiveTab] = useState("certificates");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [selectedTrainees, setSelectedTrainees] = useState<string[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [eligibleTrainees, setEligibleTrainees] = useState<Trainee[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [certData, templateData, traineeData, programData] = await Promise.all([
          fetchCertificates(),
          fetchTemplates(),
          fetchEligibleTrainees(),
          fetchPrograms(),
        ]);

        setCertificates(certData);
        setTemplates(templateData);
        setEligibleTrainees(traineeData);
        setPrograms(programData);
      } catch (error) {
        console.error("Failed to fetch certificate page data:", error);
      }
    };

    fetchData();
  }, []);

  const filteredCertificates = certificates.filter((cert) => {
    const matchesSearch = cert.traineeName.toLowerCase().includes(searchTerm.toLowerCase());
    // Handle program filtering - compare by program name or ID depending on your data structure
    const matchesProgram = filterProgram === "all" || 
      cert.program === filterProgram || 
      (programs.find(p => p._id === filterProgram)?.name === cert.program);
    const matchesStatus = filterStatus === "all" || cert.status === filterStatus;
    return matchesSearch && matchesProgram && matchesStatus;
  });

  const handleTraineeSelection = (traineeId: string) => {
    setSelectedTrainees((prev) =>
      prev.includes(traineeId) ? prev.filter((id) => id !== traineeId) : [...prev, traineeId]
    );
  };

  const handleIssueCertificates = async () => {
    if (selectedTrainees.length === 0) {
      alert("Please select at least one trainee");
      return;
    }

    try {
      await issueCertificatesToTrainees(selectedTrainees, selectedTemplate);
      alert("Certificates issued successfully!");
      setSelectedTrainees([]);
      setShowGenerateModal(false);
      // Refresh certificates data
      const certData = await fetchCertificates();
      setCertificates(certData);
    } catch (err) {
      console.error("Error issuing certificates:", err);
      alert("Failed to issue certificates. Please try again.");
    }
  };

  const handleGenerateWithAI = async (formData: any) => {
    setIsGeneratingAI(true);
    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      // Add AI generation logic here
      setIsGeneratingAI(false);
      setShowTemplateModal(false);
    } catch (error) {
      console.error("Error generating template:", error);
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

  const handleSaveTemplate = (template: Template) => {
    // Update template logic here
    setTemplates(prev => prev.map(t => t.id === template.id ? template : t));
    setShowEditModal(false);
    setEditingTemplate(null);
  };

  const getGradeColor = (grade: string) => {
    switch (grade.toLowerCase()) {
      case 'a': return 'bg-green-100 text-green-800';
      case 'b': return 'bg-blue-100 text-blue-800';
      case 'c': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'issued':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'ready':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const certificateStats = {
    total: certificates.length,
    issued: certificates.filter((c) => c.status === "issued").length,
    ready: certificates.filter((c) => c.status === "ready").length,
    eligible: eligibleTrainees.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certificate Management</h1>
          <p className="text-muted-foreground">Generate, customize and distribute certificates</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowTemplateModal(true)}>
            <Wand2 className="mr-2 h-4 w-4" />
            AI Templates
          </Button>
          <Button onClick={() => setShowGenerateModal(true)}>
            <Award className="mr-2 h-4 w-4" />
            Issue Certificates
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center space-x-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
              <Award className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{certificateStats.total}</p>
              <p className="text-sm text-muted-foreground">Total Certificates</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center space-x-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{certificateStats.issued}</p>
              <p className="text-sm text-muted-foreground">Issued</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center space-x-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{certificateStats.ready}</p>
              <p className="text-sm text-muted-foreground">Ready</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center space-x-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{certificateStats.eligible}</p>
              <p className="text-sm text-muted-foreground">Eligible</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="certificates" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Certificates</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center space-x-2">
            <Edit3 className="h-4 w-4" />
            <span>Templates</span>
          </TabsTrigger>
          <TabsTrigger value="eligible" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Eligible Students</span>
          </TabsTrigger>
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
                  <SelectItem key={program._id} value={program._id}>
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
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredCertificates.map((certificate) => (
              <Card key={certificate.id}>
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
                      <Badge variant="outline">{certificate.program}</Badge>
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
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="eligible" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {eligibleTrainees.map((trainee) => (
              <Card key={trainee._id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {trainee.name}
                    <Badge className="bg-green-100 text-green-800">Eligible</Badge>
                  </CardTitle>
                  <CardDescription>{trainee.program}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Progress</span>
                    <span className="font-semibold">{trainee.progress}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Attendance</span>
                    <span className="font-semibold">{trainee.attendance}%</span>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      setSelectedTrainees([trainee._id])
                      setShowGenerateModal(true)
                    }}
                  >
                    <Award className="mr-2 h-4 w-4" />
                    Generate Certificate
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
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
              Select template and students to issue certificates
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
                      selectedTemplate === template.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-muted-foreground">{template.description}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Select Students ({selectedTrainees.length} selected)</Label>
              <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                {eligibleTrainees.map((trainee) => (
                  <div key={trainee._id} className="flex items-center space-x-3 p-2 border rounded-lg">
                    <Checkbox
                      checked={selectedTrainees.includes(trainee._id)}
                      onCheckedChange={() => handleTraineeSelection(trainee._id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{trainee.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {trainee.program} • {trainee.progress}% • {trainee.attendance}% attendance
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleIssueCertificates}
              disabled={!selectedTemplate || selectedTrainees.length === 0}
            >
              <Send className="mr-2 h-4 w-4" />
              Issue & Send {selectedTrainees.length} Certificate{selectedTrainees.length !== 1 ? "s" : ""}
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