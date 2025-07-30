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
  UserPlus,
  UserCheck,
  User,
  GraduationCap,
  BookOpen,
  TrendingUp,
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
import { Facilitator } from "@/types/index"
import { createUser, getUsersByRole, updateFacilitatorProfile } from "@/lib/services/user.service"
import { toast } from "sonner"
import { enrollFacilitator, getAllPrograms } from "@/lib/services/program.service"

export default function FacilitatorsPage() {
  const [programs, setPrograms] = useState<{ _id: string; name: string }[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState<string>("")
  const [facilitators, setFacilitators] = useState<Facilitator[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showHireModal, setShowHireModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedFacilitator, setSelectedFacilitator] = useState<Facilitator | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hireFacilitatorId, setHireFacilitatorId] = useState("")
  const [availableFacilitators, setAvailableFacilitators] = useState<any[]>([])
  const [newFacilitatorData, setNewFacilitatorData] = useState({
    name: "",
    email: "",
  })
  const [hireMethod, setHireMethod] = useState<"existing" | "new">("existing")

  // Fetch all programs using the service
  const fetchPrograms = async () => {
    try {
      const programs = await getAllPrograms()
      return programs
    } catch (error: any) {
      console.error("Error fetching programs:", error)
      throw new Error(error.response?.data?.message || "Failed to load programs")
    }
  }

  // Fetch all facilitators using the service  
  const fetchFacilitators = async () => {
    try {
      const facilitators = await getUsersByRole("Facilitator")
      return facilitators
    } catch (error: any) {
      console.error("Error fetching facilitators:", error)
      throw new Error(error.response?.data?.message || "Failed to load facilitators")
    }
  }

  // Fetch available facilitators for hiring
  const fetchAvailableFacilitators = async () => {
    try {
      const facilitators = await getUsersByRole("Facilitator")
      setAvailableFacilitators(facilitators)
    } catch (error) {
      console.error("Error fetching available facilitators:", error)
      toast.error("Failed to load available facilitators")
    }
  }

  // Load programs on mount
  useEffect(() => {
    const loadPrograms = async () => {
      setLoading(true)
      try {
        const progs = await fetchPrograms()
        setPrograms(progs)
        if (progs.length > 0) {
          setSelectedProgramId(progs[0]._id)
        }
        setError(null)
      } catch (err: any) {
        setError(err.message)
        toast.error(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadPrograms()
  }, [])

  // Load all facilitators once (not tied to programId)
  useEffect(() => {
    const loadFacilitators = async () => {
      setLoading(true)
      try {
        const facs = await fetchFacilitators()
        setFacilitators(facs)
        setError(null)
      } catch (err: any) {
        setError(err.message)
        toast.error(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadFacilitators()
  }, [])

  // Filter helpers
  const filteredFacilitators = facilitators.filter((facilitator) => {
    const matchesSearch = facilitator.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || facilitator.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleDeleteFacilitator = (id: string) => {
    setFacilitators((prev) => prev.filter((f) => f._id !== id))
  }

  // UI helpers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Active
          </Badge>
        )
      case "Pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Pending
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "Pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  // Handlers
  const handleHireFacilitator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProgramId) {
      toast.error("Please select a program first")
      return
    }

    setLoading(true)
    try {
      if (hireMethod === "existing") {
        if (!hireFacilitatorId.trim()) {
          toast.error("Please select a facilitator")
          return
        }
        await enrollFacilitator(selectedProgramId, hireFacilitatorId.trim())
        toast.success("Facilitator hired successfully!")
      } else {
        // Create new facilitator
        if (!newFacilitatorData.name.trim() || !newFacilitatorData.email.trim()) {
          toast.error("Please fill in all required fields")
          return
        }
        
        const newUser = await createUser({
          name: newFacilitatorData.name.trim(),
          email: newFacilitatorData.email.trim(),
          role: "Facilitator"
        })
        
        // Enroll the newly created facilitator
        await enrollFacilitator(selectedProgramId, newUser._id)
        toast.success("New facilitator created and hired successfully! Login credentials have been sent to their email.")
      }

      // Fetch all facilitators again
      const updatedFacilitators = await fetchFacilitators()
      setFacilitators(updatedFacilitators)

      setShowHireModal(false)
      setHireFacilitatorId("")
      setNewFacilitatorData({ name: "", email: "" })
      setHireMethod("existing")
    } catch (err: any) {
      console.error("Error hiring facilitator:", err)
      toast.error("Error: " + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenHireModal = () => {
    setShowHireModal(true)
    fetchAvailableFacilitators()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Facilitators</h1>
          <p className="text-muted-foreground">
            Manage facilitators and their assignments
          </p>
        </div>
        <Button onClick={handleOpenHireModal} disabled={loading}>
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

      {/* Search and Filter */}
      <div className="flex items-center space-x-2 mb-4">
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
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredFacilitators.map((facilitator) => (
          <Card key={facilitator._id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{facilitator.name || "N/A"}</CardTitle>
                {getStatusBadge(facilitator.status || "pending")}
              </div>
              <CardDescription>{facilitator.specialization || "No specialization"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Essential contact info */}
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{facilitator.email || "No email"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{facilitator.phone || "No phone"}</span>
                </div>
                
                {/* Key metrics for management decisions */}
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {facilitator.studentsCount ? `${facilitator.studentsCount} students` : "0 students"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Joined: {facilitator.joinDate ? new Date(facilitator.joinDate).toLocaleDateString() : "N/A"}
                  </span>
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

      {/* Hire Facilitator Modal */}
      <Dialog open={showHireModal} onOpenChange={setShowHireModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hire Facilitator</DialogTitle>
            <DialogDescription>
              Choose how you want to hire a facilitator for the selected program.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Method Selection */}
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={hireMethod === "existing" ? "default" : "outline"}
                onClick={() => setHireMethod("existing")}
                className="flex-1"
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Existing Facilitator
              </Button>
              <Button
                type="button"
                variant={hireMethod === "new" ? "default" : "outline"}
                onClick={() => setHireMethod("new")}
                className="flex-1"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                New Facilitator
              </Button>
            </div>

            <form onSubmit={handleHireFacilitator} className="space-y-4">
              {hireMethod === "existing" ? (
                <div>
                  <Label htmlFor="facilitator-select">Select Facilitator</Label>
                  <Select value={hireFacilitatorId} onValueChange={setHireFacilitatorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a facilitator..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFacilitators.map((facilitator) => (
                        <SelectItem key={facilitator._id} value={facilitator._id}>
                          {facilitator.name} ({facilitator.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select from existing facilitators in the system
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="facilitator-name">Full Name</Label>
                    <Input
                      id="facilitator-name"
                      type="text"
                      value={newFacilitatorData.name}
                      onChange={(e) => setNewFacilitatorData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter facilitator's full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="facilitator-email">Email Address</Label>
                    <Input
                      id="facilitator-email"
                      type="email"
                      value={newFacilitatorData.email}
                      onChange={(e) => setNewFacilitatorData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter facilitator's email"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A new account will be created and login credentials will be sent to their email
                  </p>
                </div>
              )}
              
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? "Processing..." : hireMethod === "existing" ? "Hire Facilitator" : "Create & Hire"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Facilitator Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Facilitator Details
            </DialogTitle>
            <DialogDescription>
              Complete profile information for {selectedFacilitator?.name || "facilitator"}
            </DialogDescription>
          </DialogHeader>
          
          {selectedFacilitator ? (
            <div className="space-y-6">
              {/* Basic Information Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-600">Name:</span>
                      <span className="text-sm">{selectedFacilitator.name || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-sm text-gray-600">Email:</span>
                      <span className="text-sm">{selectedFacilitator.email || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-sm text-gray-600">Phone:</span>
                      <span className="text-sm">{selectedFacilitator.phone || "N/A"}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-600">Status:</span>
                      {getStatusBadge(selectedFacilitator.status || "pending")}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-sm text-gray-600">Join Date:</span>
                      <span className="text-sm">
                        {selectedFacilitator.joinDate 
                          ? new Date(selectedFacilitator.joinDate).toLocaleDateString() 
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Information Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Professional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-600">Specialization:</span>
                      <span className="text-sm">{selectedFacilitator.specialization || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-600">Experience:</span>
                      <span className="text-sm">{selectedFacilitator.experience || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-600">Rating:</span>
                      <span className="text-sm">
                        {selectedFacilitator.rating ? `${selectedFacilitator.rating}/5` : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-600">GitHub:</span>
                      <span className="text-sm">
                        {selectedFacilitator.github ? (
                          <a 
                            href={selectedFacilitator.github} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Profile
                          </a>
                        ) : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Program & Performance Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Programs & Performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-sm text-gray-600">Students:</span>
                      <span className="text-sm">{selectedFacilitator.studentsCount || "0"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-600">Programs:</span>
                      <span className="text-sm">{selectedFacilitator.programs || "N/A"}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-sm text-gray-600">Submissions:</span>
                      <span className="text-sm">{selectedFacilitator.contentSubmissions || "0"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-sm text-gray-600">Approved:</span>
                      <span className="text-sm">{selectedFacilitator.approvedContent || "0"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {selectedFacilitator.type === "promoted" && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-lg mb-2 text-blue-800 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Promotion History
                  </h3>
                  <div className="space-y-2 text-sm text-blue-700">
                    <p>Promoted from: {selectedFacilitator.previousProgram || "N/A"}</p>
                    <p>Promotion Date: {selectedFacilitator.promotionDate || "N/A"}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No facilitator selected</p>
            </div>
          )}
          
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
  const [formData, setFormData] = useState({
    specialization: facilitator.specialization || "",
    experience: facilitator.experience || "",
    phone: facilitator.phone || "",
    rating: facilitator.rating || 0,
    github: facilitator.github || "",
    type: facilitator.type as "regular" | "promoted", 
    previousProgram: facilitator.previousProgram || "",
    promotionDate: facilitator.promotionDate || "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const updatedFacilitator = await updateFacilitatorProfile(facilitator._id, formData)
      onSave(updatedFacilitator)
      toast.success("Facilitator profile updated successfully!")
    } catch (error: any) {
      toast.error("Error updating facilitator: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
 <form onSubmit={handleSubmit} className="space-y-4">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <Label htmlFor="specialization">Specialization</Label>
      <Input
        id="specialization"
        type="text"
        value={formData.specialization}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, specialization: e.target.value }))
        }
        placeholder="e.g., Web Development, Data Science"
      />
    </div>

    <div>
      <Label htmlFor="experience">Experience</Label>
      <Input
        id="experience"
        type="text"
        value={formData.experience}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, experience: e.target.value }))
        }
        placeholder="e.g., 5 years, 3+ years"
      />
    </div>

    <div>
      <Label htmlFor="phone">Phone</Label>
      <Input
        id="phone"
        type="tel"
        value={formData.phone}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, phone: e.target.value }))
        }
        placeholder="+1234567890"
      />
    </div>

    <div>
      <Label htmlFor="rating">Rating (0-5)</Label>
      <Input
        id="rating"
        type="number"
        min="0"
        max="5"
        step="0.1"
        value={formData.rating}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            rating: parseFloat(e.target.value) || 0,
          }))
        }
      />
    </div>

    <div>
      <Label htmlFor="github">GitHub Profile</Label>
      <Input
        id="github"
        type="url"
        value={formData.github}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, github: e.target.value }))
        }
        placeholder="https://github.com/username"
      />
    </div>

    <div>
      <Label htmlFor="type">Type</Label>
      <Select
        value={formData.type}
        onValueChange={(value) =>
          setFormData((prev) => ({
            ...prev,
            type: value as "regular" | "promoted",
          }))
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="regular">Regular</SelectItem>
          <SelectItem value="promoted">Promoted</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {formData.type === "promoted" && (
      <>
        <div>
          <Label htmlFor="previousProgram">Previous Program</Label>
          <Input
            id="previousProgram"
            type="text"
            value={formData.previousProgram}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                previousProgram: e.target.value,
              }))
            }
            placeholder="Previous program name"
          />
        </div>
        <div>
          <Label htmlFor="promotionDate">Promotion Date</Label>
          <Input
            id="promotionDate"
            type="date"
            value={formData.promotionDate}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                promotionDate: e.target.value,
              }))
            }
          />
        </div>
      </>
    )}
  </div>

  <DialogFooter>
    <Button type="submit" disabled={loading}>
      {loading ? "Updating..." : "Update Profile"}
    </Button>
    <Button variant="outline" onClick={onClose} disabled={loading}>
      Cancel
    </Button>
  </DialogFooter>
</form>
  )
}