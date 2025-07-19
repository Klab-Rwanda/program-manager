"use client"

import { useEffect, useState } from "react"
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Award,
  Send,
  XCircle,
  Calendar,
  BookOpen,
  UserPlus,
  Settings,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getAllTrainees } from "@/lib/services/tarinee.service"
import { getAllPrograms } from "@/lib/services/program.service"
import { Program, Trainee } from "@/types/index"

export default function TraineesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProgram, setFilterProgram] = useState("all");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const handleCreateTrainee = async () => { /*...*/ };
 const handleEditTrainee = async () => { /*...*/ };
  const handleDeleteTrainee = async (id: string) => { /*...*/ };

const [newTrainee, setNewTrainee] = useState<Trainee>({
  _id: "",
  name: "",
  email: "",
  role: "Trainee",
  status: "Pending",
  isActive: true,
  createdAt: "",
  updatedAt: "",
  phone: "",
  location: "",
  enrolledPrograms: [],
  progress: 0,
  attendance: 0,
  completedProjects: 0,
  totalProjects: 0,
  joinDate: "",
  lastActive: "",
});

useEffect(() => {
  async function loadData() {
    const [traineeData, programData] = await Promise.all([
      getAllTrainees(),
      getAllPrograms()
    ]);
    setTrainees(traineeData);
    setPrograms(programData);
  }
  loadData();
}, []);

  const filteredTrainees = trainees.filter((trainee) => {
    const matchesSearch =
      trainee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || trainee.status === filterStatus;
    const matchesProgram =
      filterProgram === "all" || trainee.enrolledPrograms?.includes(filterProgram);
    return matchesSearch && matchesStatus && matchesProgram;
  });

  const openEditModal = (trainee: Trainee) => {
    setSelectedTrainee(trainee);
    setSelectedPrograms(trainee.enrolledPrograms || []);
    setShowEditModal(true);
  };

  const openDeleteModal = (trainee: Trainee) => {
    setSelectedTrainee(trainee);
    setShowDeleteModal(true);
  };

  const openViewModal = (trainee: Trainee) => {
    setSelectedTrainee(trainee);
    setShowViewModal(true);
  };

  const openAssignModal = (trainee: Trainee) => {
    setSelectedTrainee(trainee);
    setSelectedPrograms(trainee.enrolledPrograms || []);
    setShowAssignModal(true);
  };

  const handleAssignPrograms = () => {
    if (!selectedTrainee) return;
    const updated = trainees.map((trainee) =>
      trainee._id === selectedTrainee._id
        ? { ...trainee, enrolledPrograms: selectedPrograms }
        : trainee
    );
    setTrainees(updated);
    setShowAssignModal(false);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return { label: "Active", variant: "default" as const };
      case "inactive":
        return { label: "Inactive", variant: "secondary" as const };
      case "completed":
        return { label: "Completed", variant: "default" as const };
      default:
        return { label: status, variant: "outline" as const };
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "text-green-600";
    if (progress >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trainee Assignment</h1>
          <p className="text-muted-foreground">
            Manage trainee enrollments and program assignments
          </p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Trainee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Trainee</DialogTitle>
              <DialogDescription>
                Enroll a new trainee in the system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newTrainee.name}
                  onChange={(e) => setNewTrainee({ ...newTrainee, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newTrainee.email}
                  onChange={(e) => setNewTrainee({ ...newTrainee, email: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={newTrainee.phone}
                  onChange={(e) => setNewTrainee({ ...newTrainee, phone: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  Location
                </Label>
                <Input
                  id="location"
                  value={newTrainee.location}
                  onChange={(e) => setNewTrainee({ ...newTrainee, location: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Programs
                </Label>
                <div className="col-span-3 space-y-2">
  {Array.isArray(programs) && programs.length > 0 ? (
    programs.map((program) => (
      <div key={program._id} className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={`program-${program._id}`}
          checked={selectedPrograms.includes(program.name)}
          onChange={(e) => {
            setSelectedPrograms((prev) =>
              e.target.checked
                ? [...prev, program.name]
                : prev.filter((p) => p !== program.name)
            );
          }}
        />
                     <label htmlFor={`program-${program._id}`} className="text-sm">
          {program.name}
        </label>
      </div>
    ))
  ) : ( <p className="text-sm italic text-muted-foreground">No programs available.</p>
  )}

                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateTrainee}>
                Add Trainee
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search trainees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterProgram} onValueChange={setFilterProgram}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by program" />
          </SelectTrigger>
          <SelectContent>
  <SelectItem value="all">All Programs</SelectItem>
  {Array.isArray(programs) && programs.length > 0 ? (
    programs.map((program) => (
      <SelectItem key={program._id} value={program.name}>
        {program.name}
      </SelectItem>
    ))
  ) : (
    <SelectItem value="none" disabled>
      No programs found
    </SelectItem>
  )}
</SelectContent>

        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTrainees.map((trainee) => {
          const statusConfig = getStatusConfig(trainee.status)
          return (
            <Card key={trainee._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{trainee.name}</CardTitle>
                      <CardDescription>{trainee.email}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">{trainee.phone}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Location</p>
                      <p className="font-medium">{trainee.location}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Progress</p>
                      <p className={`font-medium ${getProgressColor(trainee.progress)}`}>
                        {trainee.progress}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Attendance</p>
                      <p className="font-medium">{trainee.attendance}%</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Enrolled Programs</p>
<div className="space-y-1">
  {Array.isArray(trainee.enrolledPrograms) && trainee.enrolledPrograms.length > 0 ? (
    trainee.enrolledPrograms.map((program, index) => (
      <Badge key={index} variant="outline" className="text-xs">
        {program}
      </Badge>
    ))
  ) : (
    <p className="text-xs text-gray-400 italic">No programs enrolled</p>
  )}
</div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Projects</p>
                    <p className="text-sm font-medium">
                      {trainee.completedProjects}/{trainee.totalProjects} completed
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Joined: {trainee.joinDate}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openViewModal(trainee)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(trainee)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAssignModal(trainee)}
                      >
                        <BookOpen className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteModal(trainee)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Assign Programs Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Programs to {selectedTrainee?.name}</DialogTitle>
            <DialogDescription>
              Select programs to assign to this trainee.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {programs.map((program) => (
              <div key={program._id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`assign-program-${program._id}`}
                  checked={selectedPrograms.includes(program.name)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPrograms([...selectedPrograms, program.name])
                    } else {
                      setSelectedPrograms(selectedPrograms.filter(p => p !== program.name))
                    }
                  }}
                />
                <Label htmlFor={`assign-program-${program._id}`} className="text-sm">
                  {program.name}
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={handleAssignPrograms}>
              Assign Programs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Trainee</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTrainee?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
            variant="destructive"  onClick={() => selectedTrainee && handleDeleteTrainee(selectedTrainee._id)}>
                 Delete
                </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Trainee Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Trainee</DialogTitle>
            <DialogDescription>
              Update the trainee details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={newTrainee.name}
                onChange={(e) => setNewTrainee({ ...newTrainee, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={newTrainee.email}
                onChange={(e) => setNewTrainee({ ...newTrainee, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-phone" className="text-right">
                Phone
              </Label>
              <Input
                id="edit-phone"
                value={newTrainee.phone}
                onChange={(e) => setNewTrainee({ ...newTrainee, phone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-location" className="text-right">
                Location
              </Label>
              <Input
                id="edit-location"
                value={newTrainee.location}
                onChange={(e) => setNewTrainee({ ...newTrainee, location: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditTrainee}>
              Update Trainee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Trainee Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedTrainee?.name}</DialogTitle>
            <DialogDescription>
              Detailed view of the trainee information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedTrainee?.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedTrainee?.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedTrainee?.location}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium">Progress Overview</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Overall Progress:</span>
                    <span className={`ml-2 font-medium ${getProgressColor(selectedTrainee?.progress || 0)}`}>
                      {selectedTrainee?.progress}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Attendance Rate:</span>
                    <span className="ml-2 font-medium">{selectedTrainee?.attendance}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Projects Completed:</span>
                    <span className="ml-2 font-medium">
                      {selectedTrainee?.completedProjects}/{selectedTrainee?.totalProjects}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium">Enrolled Programs</h4>
              <div className="mt-2 space-y-2">
                {Array.isArray(selectedTrainee?.enrolledPrograms) &&
  selectedTrainee.enrolledPrograms.map((program, index) => (

                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{program}</span>
                    <Badge variant="outline" className="text-xs">
                      Enrolled
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium">Activity Timeline</h4>
              <div className="mt-2 space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Joined:</span>
                  <span className="ml-2">{selectedTrainee?.joinDate}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Active:</span>
                  <span className="ml-2">{selectedTrainee?.lastActive}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 