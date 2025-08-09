"use client"

import { useState, useEffect, useCallback } from "react"
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
  ArrowRight, 
  AlertTriangle,
  UserX, // Import UserX icon for unassign
  Loader2
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
import {
  AlertDialog, // Import AlertDialog
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { Facilitator } from "@/types/index"
import { createUser, getUsersByRole, updateFacilitatorProfile, deleteUser } from "@/lib/services/user.service" 
import { toast } from "sonner"
import { enrollFacilitator, getAllPrograms, unenrollFacilitator } from "@/lib/services/program.service" 

export default function FacilitatorsPage() {
  // Enhanced Program type for frontend use to include populated facilitators
  // This helps check if a facilitator is assigned to a program in the frontend filter
  const [programs, setPrograms] = useState<{ _id: string; name: string; facilitators: (string | { _id: string })[] }[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState<string>("all") // Default to 'all'
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
  const [isSubmitting, setIsSubmitting] = useState(false) // For general submission loading

  // State for confirmation dialogs
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: '', description: '', onConfirm: () => {} });

  // Helper to refresh all data (programs and facilitators)
  const refreshAllData = useCallback(async () => {
    setLoading(true);
    try {
      // Programs are fetched with populated facilitators
      const progs = await getAllPrograms(); 
      setPrograms(progs);
      
      const facs = await fetchFacilitators();
      setFacilitators(facs);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load data.");
      toast.error(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []); // Depend on nothing for a full refresh


  // Fetch all programs using the service
  const fetchPrograms = async () => {
    try {
      // Ensure facilitators are populated to check assignment
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

  // Fetch available facilitators for hiring (those not assigned to selected program)
  const fetchAvailableFacilitators = async () => {
    try {
      const facilitators = await getUsersByRole("Facilitator");
      if (selectedProgramId !== "all") {
        const currentProgram = programs.find(p => p._id === selectedProgramId);
        // Ensure program.facilitators contains populated objects to get _id
        const assignedFacilitatorIds = currentProgram?.facilitators?.map(f => typeof f === 'object' ? f._id : f.toString()) || [];
        const notAssigned = facilitators.filter(f => !assignedFacilitatorIds.includes(f._id));
        setAvailableFacilitators(notAssigned);
      } else {
        setAvailableFacilitators(facilitators); // If no program selected, all are "available" for assignment
      }
    } catch (error) {
      console.error("Error fetching available facilitators:", error);
      toast.error("Failed to load available facilitators");
    }
  }

  // Load data on mount
  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Filter helpers
  const filteredFacilitators = facilitators.filter((facilitator) => {
    const matchesSearch = facilitator.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || facilitator.status === filterStatus;
    
    // Filter by selected program
    let matchesProgram = true;
    if (selectedProgramId !== "all") {
        const program = programs.find(p => p._id === selectedProgramId);
        if (program) {
             const isAssignedToSelectedProgram = program.facilitators?.some(f => 
                 (typeof f === 'object' ? f._id : f.toString()) === facilitator._id
             );
            matchesProgram = !!isAssignedToSelectedProgram; // Only show if assigned to selected program
        } else {
            matchesProgram = false; // Program not found, so facilitator can't be assigned
        }
    }

    return matchesSearch && matchesStatus && matchesProgram;
  });

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

  // Handlers
  const handleHireFacilitator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramId || selectedProgramId === "all") {
      toast.error("Please select a specific program to hire for.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (hireMethod === "existing") {
        if (!hireFacilitatorId.trim()) {
          toast.error("Please select a facilitator to assign.");
          return;
        }
        await enrollFacilitator(selectedProgramId, hireFacilitatorId.trim());
        toast.success("Facilitator assigned successfully!");
      } else { // New facilitator
        if (!newFacilitatorData.name.trim() || !newFacilitatorData.email.trim()) {
          toast.error("Please fill in all required fields for the new facilitator.");
          return;
        }
        const newUser = await createUser({
          name: newFacilitatorData.name.trim(),
          email: newFacilitatorData.email.trim(),
          role: "Facilitator"
        });
        await enrollFacilitator(selectedProgramId, newUser._id);
        toast.success("New facilitator created and assigned! Login credentials sent to their email.");
      }

      setShowHireModal(false);
      setHireFacilitatorId("");
      setNewFacilitatorData({ name: "", email: "" });
      setHireMethod("existing");
      refreshAllData(); // Re-fetch to update lists
    } catch (err: any) {
      console.error("Error hiring/assigning facilitator:", err);
      toast.error("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassignFacilitator = (facilitator: Facilitator) => {
    if (!selectedProgramId || selectedProgramId === "all") {
        toast.error("Please select a program first in the filter dropdown to unassign from.");
        return;
    }

    setConfirmationDialog({
        open: true,
        title: "Unassign Facilitator",
        description: `Are you sure you want to unassign ${facilitator.name} from program "${programs.find(p => p._id === selectedProgramId)?.name || 'the selected program'}"? This will not delete their account.`,
        onConfirm: async () => {
            setIsSubmitting(true);
            try {
                await unenrollFacilitator(selectedProgramId, facilitator._id);
                toast.success(`${facilitator.name} unassigned from the program.`);
                refreshAllData();
            } catch (err: any) {
                console.error("Error unassigning facilitator:", err);
                toast.error("Error unassigning: " + (err.response?.data?.message || err.message));
            } finally {
                setIsSubmitting(false);
                setConfirmationDialog({ open: false, title: '', description: '', onConfirm: () => {} }); // Close dialog
            }
        }
    });
  };

  const handleDeleteFacilitator = (facilitator: Facilitator) => {
    setConfirmationDialog({
        open: true,
        title: "Delete Facilitator Account",
        description: `Are you sure you want to delete ${facilitator.name}'s account? This action cannot be undone and will permanently remove them from the system.`,
        onConfirm: async () => {
            setIsSubmitting(true);
            try {
                await deleteUser(facilitator._id); // Call the backend delete service
                toast.success(`${facilitator.name}'s account deleted successfully.`);
                refreshAllData(); // Re-fetch all data to update lists
            } catch (err: any) {
                console.error("Error deleting facilitator:", err);
                toast.error("Error deleting account: " + (err.response?.data?.message || err.message));
            } finally {
                setConfirmationDialog({ open: false, title: '', description: '', onConfirm: () => {} }); // Close dialog
                setIsSubmitting(false);
            }
        }
    });
  };


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
          Hire / Assign Facilitator
        </Button>
      </div>

      {/* Program selector */}
      <div className="mb-4 max-w-xs">
        <Label htmlFor="program-select">Filter by Program Assignment</Label>
        <Select
          value={selectedProgramId}
          onValueChange={setSelectedProgramId}
          disabled={loading || programs.length === 0}
        >
          <SelectTrigger id="program-select">
            <SelectValue placeholder="All Programs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            {programs.map((prog) => (
              <SelectItem key={prog._id} value={prog._id}>
                {prog.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin"/></div>
      ) : filteredFacilitators.length === 0 ? (
        <Card className="text-center py-10">
            <CardContent>
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4"/>
                <p className="text-muted-foreground">No facilitators found matching your filters.</p>
            </CardContent>
        </Card>
      ) : (
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
                    {/* Unassign button - Conditionally rendered */}
                    {selectedProgramId !== "all" && facilitator.programs?.includes(selectedProgramId) && ( 
                        <Button
                            variant="destructive" // Use destructive for unassign for clarity
                            size="sm"
                            onClick={() => handleUnassignFacilitator(facilitator)}
                            disabled={isSubmitting} // Disable during any submission
                        >
                            <UserX className="h-4 w-4" /> {/* UserX icon for unassign */}
                        </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteFacilitator(facilitator)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
      )}

      {/* Hire Facilitator Modal */}
      <Dialog open={showHireModal} onOpenChange={setShowHireModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hire / Assign Facilitator</DialogTitle>
            <DialogDescription>
              Choose how you want to assign a facilitator to a program.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="program-select-hire">Select Program</Label>
                <Select
                    value={selectedProgramId}
                    onValueChange={setSelectedProgramId}
                    disabled={programs.length === 0}
                >
                    <SelectTrigger id="program-select-hire">
                        <SelectValue placeholder="Select a program to assign to..." />
                    </SelectTrigger>
                    <SelectContent>
                        {programs.map((prog) => (
                            <SelectItem key={prog._id} value={prog._id}>
                                {prog.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {selectedProgramId === "all" && programs.length > 0 && (
                    <p className="text-red-500 text-xs">Please select a specific program to assign facilitators.</p>
                )}
                {programs.length === 0 && (
                     <p className="text-muted-foreground text-xs">No programs available. Create a program first.</p>
                )}
            </div>

            {selectedProgramId !== "all" && ( // Only show assignment methods if a program is selected
                <>
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
                                        {availableFacilitators.length === 0 && (
                                            <div className="p-2 text-center text-muted-foreground text-sm">No unassigned facilitators.</div>
                                        )}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Select from existing facilitators not yet assigned to this program.
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
                                    A new account will be created and login credentials will be sent to their email.
                                </p>
                            </div>
                        )}
                        
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting || (hireMethod === 'existing' && !hireFacilitatorId) || (hireMethod === 'new' && (!newFacilitatorData.name || !newFacilitatorData.email))}>
                                {isSubmitting ? "Processing..." : hireMethod === "existing" ? "Assign Facilitator" : "Create & Assign"}
                            </Button>
                        </DialogFooter>
                    </form>
                </>
            )}
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
                      <Phone className="h-4 w-4 text-muted-foreground" /> {/* Changed text-gray-500 to text-muted-foreground for consistency */}
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
                      <Calendar className="h-4 w-4 text-muted-foreground" /> {/* Changed text-gray-500 to text-muted-foreground */}
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
                      <Users className="h-4 w-4 text-muted-foreground" /> {/* Changed text-gray-500 to text-muted-foreground */}
                      <span className="font-medium text-sm text-gray-600">Students:</span>
                      <span className="text-sm">{selectedFacilitator.studentsCount || "0"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-600">Programs:</span>
                      {/* Display a list of program names */}
                      <span className="text-sm">
                        {Array.isArray(selectedFacilitator.programs) && selectedFacilitator.programs.length > 0 ? (
                            selectedFacilitator.programs.map(p => typeof p === 'object' ? p.name : p).join(', ') // Handle both string and object types
                        ) : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" /> {/* Changed text-gray-500 to text-muted-foreground */}
                      <span className="font-medium text-sm text-gray-600">Submissions:</span>
                      <span className="text-sm">{selectedFacilitator.contentSubmissions || "0"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" /> {/* Changed text-gray-500 to text-muted-foreground */}
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
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" /> {/* Changed text-gray-400 to text-muted-foreground */}
              <p className="text-muted-foreground">No facilitator selected</p>
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

      {/* Reusable Confirmation Dialog */}
      <AlertDialog open={confirmationDialog.open} onOpenChange={(open) => setConfirmationDialog({ ...confirmationDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>{confirmationDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmationDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmationDialog.onConfirm} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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