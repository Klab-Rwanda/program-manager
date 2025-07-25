"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Calendar,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ContentSubmission } from "@/types/index"
import {Facilitator} from "@/types/index"

export default function FacilitatorsPage() {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

 const [programs, setPrograms] = useState<{ _id: string; name: string }[]>([])
const [selectedProgramId, setSelectedProgramId] = useState<string>("")
const [facilitators, setFacilitators] = useState<Facilitator[]>([])
const [contentSubmissions, setContentSubmissions] = useState<ContentSubmission[]>([])
const [searchTerm, setSearchTerm] = useState("")
const [filterStatus, setFilterStatus] = useState("all")
const [activeTab, setActiveTab] = useState("facilitators")
const [showHireModal, setShowHireModal] = useState(false)
const [showViewModal, setShowViewModal] = useState(false)
const [showEditModal, setShowEditModal] = useState(false)
const [showContentPreview, setShowContentPreview] = useState(false)
const [selectedFacilitator, setSelectedFacilitator] = useState<Facilitator | null>(null)
const [selectedContent, setSelectedContent] = useState<ContentSubmission | null>(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
const [hireFacilitatorId, setHireFacilitatorId] = useState("")

// Fetch all programs
async function fetchPrograms() {
  if (!token) throw new Error("Missing auth token. Please log in.");

  const res = await fetch("http://localhost:8000/api/v1/programs", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("Fetch error:", res.status, errorData);
    throw new Error(errorData.message || "Failed to load programs");
  }

  const data = await res.json();
  return data.data;
}

// Fetch all facilitators (not program-specific)
async function fetchFacilitators() {
  if (!token) throw new Error("Missing auth token. Please log in.");

  const res = await fetch("http://localhost:8000/api/v1/users/manage?role=Facilitator", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to load facilitators");
  }

  const data = await res.json();
  return data.data;
}

// Enroll facilitator to a selected program
async function enrollFacilitator(programId: string, facilitatorId: string) {
  if (!token) throw new Error("Missing auth token. Please log in.");

  const res = await fetch(`http://localhost:8000/api/v1/programs/${programId}/enroll-facilitator`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ facilitatorId }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("Enroll failed:", res.status, errorData);
    throw new Error(errorData.message || "Failed to enroll facilitator");
  }

  const data = await res.json();
  return data.data;
}

// Load programs on mount
useEffect(() => {
  async function loadPrograms() {
    setLoading(true);
    try {
      const progs = await fetchPrograms();
      setPrograms(progs);
      if (progs.length > 0) {
        setSelectedProgramId(progs[0]._id);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  loadPrograms();
}, []);

// Load all facilitators once (not tied to programId)
useEffect(() => {
  async function loadFacilitators() {
    setLoading(true);
    try {
      const facs = await fetchFacilitators();
      setFacilitators(facs);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  loadFacilitators();
}, []);

// Filter helpers
const filteredFacilitators = facilitators.filter((facilitator) => {
  const matchesSearch = facilitator.name.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesStatus = filterStatus === "all" || facilitator.status === filterStatus;
  return matchesSearch && matchesStatus;
});

const filteredContent = contentSubmissions.filter((content) => {
  const matchesSearch =
    content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    content.facilitatorName.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesStatus = filterStatus === "all" || content.status === filterStatus;
  return matchesSearch && matchesStatus;
});

const handleDeleteFacilitator = (id: string) => {
  setFacilitators((prev) => prev.filter((f) => f._id !== id))
}

const handlePreviewContent = (content: ContentSubmission) => {
  setSelectedContent(content)
  setShowContentPreview(true)
}

const handleApproveContent = (contentId: string) => {
  setContentSubmissions((prev) =>
    prev.map((content) =>
      content._id === contentId ? { ...content, status: "Approved" } : content
    )
  )
}

const handleRejectContent = (contentId: string) => {
  setContentSubmissions((prev) =>
    prev.map((content) =>
      content._id === contentId ? { ...content, status: "Rejected" } : content
    )
  )
}

  // UI helpers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Active
          </Badge>
        )
      case "inactive":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Inactive</Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
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

  // Handlers
  const handleHireFacilitator = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedProgramId) {
    alert("Please select a program first");
    return;
  }
  if (!hireFacilitatorId.trim()) {
    alert("Please enter facilitator user ID");
    return;
  }

  setLoading(true);
  try {
    await enrollFacilitator(selectedProgramId, hireFacilitatorId.trim());

    // Fetch all facilitators again (no selectedProgramId param)
    const updatedFacilitators = await fetchFacilitators();
    setFacilitators(updatedFacilitators);

    setShowHireModal(false);
    setHireFacilitatorId("");
    alert("Facilitator hired successfully!");
  } catch (err: any) {
    alert("Error: " + err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facilitators</h1>
          <p className="text-muted-foreground">
            Manage facilitators and review content submissions
          </p>
        </div>
        <Button onClick={() => setShowHireModal(true)} disabled={loading}>
          <Plus className="mr-2 h-4 w-4" />
          Hire Facilitator
        </Button>
      </div>

      {/* Program selector */}
      <div className="mb-4 max-w-xs">
        <Label htmlFor="program-select">Select Program</Label>
        <select
          id="program-select"
          className="border p-2 rounded w-full"
          value={selectedProgramId}
          onChange={(e) => setSelectedProgramId(e.target.value)}
          disabled={loading}
        >
          <option value="">-- Select Program --</option>
          {programs.map((prog) => (
            <option key={prog._id} value={prog._id}>
              {prog.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="text-red-600 font-semibold mb-2">Error: {error}</div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="facilitators">
            Facilitators ({facilitators.length})
          </TabsTrigger>
          <TabsTrigger value="content">
            Content Submissions ({contentSubmissions.length})
          </TabsTrigger>
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
              <Card key={facilitator._id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{facilitator.name}</CardTitle>
                    {getStatusBadge(facilitator.status)}
                  </div>
                  <CardDescription>{facilitator.specialization}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Essential contact info */}
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{facilitator.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{facilitator.phone}</span>
                    </div>
                    
                    {/* Key metrics for management decisions */}
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {facilitator.studentsCount} students
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Joined: {facilitator.joinDate}</span>
                    </div>

                    {facilitator.type === "promoted" && (
                      <div className="bg-blue-50 p-2 rounded-md">
                        <p className="text-xs text-blue-800">
                          Promoted from {facilitator.previousProgram} on{" "}
                          {facilitator.promotionDate}
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
                      onClick={() => handleDeleteFacilitator(facilitator._id)}
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
              placeholder="Search content submissions..."
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

          {filteredContent.length === 0 ? (
            <p className="text-center text-muted-foreground">No content submissions found.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredContent.map((content) => (
                <Card key={content._id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{content.title}</CardTitle>
                      {getStatusBadge(content.status)}
                    </div>
                    <CardDescription>
                      By {content.facilitatorName} | Program: {content.program}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2 line-clamp-3">{content.description}</p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-2">
                      <FileText className="h-4 w-4" />
                      <span>Type: {content.type}</span>
                      <Clock className="h-4 w-4" />
                      <span>{content.duration}</span>
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewContent(content)}
                      >
                        <Eye className="h-4 w-4" /> Preview
                      </Button>
                      {content.status === "Pending" && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApproveContent(content._id)}
                          >
                            <CheckCircle className="h-4 w-4" /> Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRejectContent(content._id)}
                          >
                            <XCircle className="h-4 w-4" /> Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Hire Facilitator Modal */}
      <Dialog open={showHireModal} onOpenChange={setShowHireModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hire Facilitator</DialogTitle>
            <DialogDescription>
              Enter the user ID of the facilitator you want to hire for the selected program.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleHireFacilitator} className="space-y-4">
            <div>
              <Label htmlFor="facilitator-id">Facilitator User ID</Label>
              <Input
                id="facilitator-id"
                type="text"
                value={hireFacilitatorId}
                onChange={(e) => setHireFacilitatorId(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Hiring..." : "Hire"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Facilitator Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Facilitator Details</DialogTitle>
            <DialogDescription>
              Details of {selectedFacilitator?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedFacilitator ? (
              <>
                <p><strong>Email:</strong> {selectedFacilitator.email}</p>
                <p><strong>Phone:</strong> {selectedFacilitator.phone}</p>
                <p><strong>Specialization:</strong> {selectedFacilitator.specialization}</p>
                <p><strong>Experience:</strong> {selectedFacilitator.experience}</p>
                <p><strong>Status:</strong> {selectedFacilitator.status}</p>
                <p><strong>Programs:</strong> {selectedFacilitator.programs}</p>
                <p><strong>Students Count:</strong> {selectedFacilitator.studentsCount}</p>
                <p><strong>Content Submissions:</strong> {selectedFacilitator.contentSubmissions}</p>
                <p><strong>Approved Content:</strong> {selectedFacilitator.approvedContent}</p>
                <p><strong>GitHub:</strong> {selectedFacilitator.github}</p>
                <p><strong>Rating:</strong> {selectedFacilitator.rating}</p>
                <p><strong>Join Date:</strong> {selectedFacilitator.joinDate}</p>
              </>
            ) : (
              <p>No facilitator selected</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowViewModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Facilitator Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Facilitator</DialogTitle>
            <DialogDescription>
              Edit facilitator details here.
            </DialogDescription>
          </DialogHeader>
          {/* For demonstration, only editing specialization and experience */}
          {selectedFacilitator ? (
            <EditFacilitatorForm
              facilitator={selectedFacilitator}
              onClose={() => setShowEditModal(false)}
              onSave={(updatedFacilitator) => {
                setFacilitators((prev) =>
                  prev.map((f) => (f._id === updatedFacilitator._id ? updatedFacilitator : f))
                )
                setShowEditModal(false)
              }}
            />
          ) : (
            <p>No facilitator selected</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Content Preview Modal */}
      <Dialog open={showContentPreview} onOpenChange={setShowContentPreview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Content Preview</DialogTitle>
            <DialogDescription>
              Preview of content submission: {selectedContent?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedContent ? (
              <>
                <p><strong>Facilitator:</strong> {selectedContent.facilitatorName}</p>
                <p><strong>Program:</strong> {selectedContent.program}</p>
                <p><strong>Submission Date:</strong> {selectedContent.submissionDate}</p>
                <p><strong>Description:</strong> {selectedContent.description}</p>
                <p><strong>Type:</strong> {selectedContent.type}</p>
                <p><strong>Duration:</strong> {selectedContent.duration}</p>
                <div>
                  <strong>Content File:</strong>
                  <a
                    href={selectedContent.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    Download / View
                  </a>
                </div>
                <div className="mt-4">
                  <iframe
                    src={selectedContent.fileUrl}
                    title="Content Preview"
                    width="100%"
                    height="400px"
                    className="border"
                  />
                </div>
              </>
            ) : (
              <p>No content selected</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowContentPreview(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Separate component for editing facilitator details
interface EditFacilitatorFormProps {
  facilitator: Facilitator
  onClose: () => void
  onSave: (updatedFacilitator: Facilitator) => void
}

function EditFacilitatorForm({ facilitator, onClose, onSave }: EditFacilitatorFormProps) {
  const [specialization, setSpecialization] = useState(facilitator.specialization)
  const [experience, setExperience] = useState(facilitator.experience)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const updatedFacilitator = { ...facilitator, specialization, experience }
    onSave(updatedFacilitator)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="specialization">Specialization</Label>
        <Input
          id="specialization"
          type="text"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="experience">Experience</Label>
        <Input
          id="experience"
          type="text"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          required
        />
      </div>
      <DialogFooter>
        <Button type="submit">Save</Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </DialogFooter>
    </form>
  )
}