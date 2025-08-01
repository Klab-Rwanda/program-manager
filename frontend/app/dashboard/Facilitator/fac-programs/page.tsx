"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, Users, BookOpen, Star, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/contexts/RoleContext";
import { getAllPrograms, getProgramById } from "@/lib/services/program.service";
import { Program as BackendProgram, Trainee, Facilitator, Course } from "@/types";
import { getProgramSessionCounts } from "@/lib/services/attendance.service"; // Import the new service

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress"; // Keep Progress for now, but remove its data points
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Updated Program interface to hold actual session counts and next session time
interface Program extends BackendProgram {
  totalSessionsCount?: number;
  completedSessionsCount?: number;
  nextSessionTime?: string | null; // Date string or null
}

export default function FacilitatorProgramsPage() {
  const { role, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("active");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the "View Students" modal
  const [isStudentsModalOpen, setStudentsModalOpen] = useState(false);
  const [selectedProgramForStudentsModal, setSelectedProgramForStudentsModal] = useState<Program | null>(null);
  const [studentList, setStudentList] = useState<Trainee[]>([]);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);

  // State for the "Details" modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProgramForDetailsModal, setSelectedProgramForDetailsModal] = useState<Program | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);


  const fetchFacilitatorPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const backendPrograms: BackendProgram[] = await getAllPrograms();
      
      const programsWithSessionCounts: Program[] = await Promise.all(
        backendPrograms.map(async (p) => {
          // Fetch session counts for each program
          const sessionStats = await getProgramSessionCounts(p._id);
          return {
            ...p,
            totalSessionsCount: sessionStats.totalSessions,
            completedSessionsCount: sessionStats.completedSessions,
            nextSessionTime: sessionStats.nextSessionTime,
            // `status` is already from backend, so no change here unless you want frontend-derived.
          };
        })
      );
      setPrograms(programsWithSessionCounts);
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to load your programs.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && role === 'facilitator') {
      fetchFacilitatorPrograms();
    }
  }, [authLoading, role, fetchFacilitatorPrograms]);
  
  // Function to open the students modal and fetch student list
  const openStudentsModal = async (program: Program) => {
    setSelectedProgramForStudentsModal(program);
    setStudentsModalOpen(true);
    setIsStudentsLoading(true);
    try {
      const detailedProgram = await getProgramById(program._id);
      setStudentList(detailedProgram.trainees as Trainee[] || []); // Ensure trainees is an array
    } catch (err) {
      toast.error("Failed to load student list.");
      setStudentList([]);
    } finally {
      setIsStudentsLoading(false);
    }
  };

  // Function to open the details modal and fetch detailed program info
  const openDetailsModal = async (program: Program) => {
    setSelectedProgramForDetailsModal(program);
    setIsDetailsModalOpen(true);
    setIsDetailsLoading(true);
    try {
      // Fetch the full program details, which includes populated trainees, facilitators, courses
      const detailedProgram = await getProgramById(program._id);
      setSelectedProgramForDetailsModal(detailedProgram); // Update with full data
    } catch (err) {
      toast.error("Failed to load program details.");
      setSelectedProgramForDetailsModal(null);
    } finally {
      setIsDetailsLoading(false);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "bg-green-100 text-green-800";
      case "upcoming": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-gray-100 text-gray-800";
      case "draft": return "bg-yellow-100 text-yellow-800";
      case "pendingapproval": return "bg-purple-100 text-purple-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredPrograms = programs.filter((program) => {
    if (activeTab === "all") return true;
    return program.status.toLowerCase() === activeTab;
  });
  
  if (authLoading || loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  const getInitials = (name: string = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <h1 className="text-3xl font-bold tracking-tight">My Programs</h1>
      
      {/* Programs Section */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="all">All Programs</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
            <div className="space-y-4 mt-4">
              {filteredPrograms.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No {activeTab} programs found.</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredPrograms.map((program) => (
                    <Card key={program._id} className="flex flex-col hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex justify-between items-start gap-2">
                                <CardTitle className="text-lg leading-snug">{program.name}</CardTitle>
                                <Badge className={`flex-shrink-0 ${getStatusColor(program.status)}`}>
                                    {program.status}
                                </Badge>
                            </div>
                            <CardDescription className="text-xs line-clamp-2">{program.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4">
                            {/* Removed Progress and Rating entirely */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm border-t pt-3">
                                <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /><span>{program.trainees?.length || 0} Students</span></div>
                                <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /><span>{program.completedSessionsCount || 0}/{program.totalSessionsCount || 0} Sessions</span></div>
                                <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /><span className="truncate">Next: {program.nextSessionTime ? new Date(program.nextSessionTime).toLocaleDateString() : 'N/A'}</span></div>
                                {/* Removed Rating - Star icon and related text */}
                                {/* <div className="flex items-center gap-2 text-muted-foreground"><Star className="h-4 w-4 text-yellow-400"/><span>N/A Rating</span></div> */}
                            </div>
                        </CardContent>
                        <div className="p-4 pt-0 mt-auto">
                            <div className="flex gap-2">
                                {/* Details button to open new modal with program details */}
                                <Button className="flex-1 bg-[#1f497d] hover:bg-[#1a3f6b]" size="sm" onClick={() => openDetailsModal(program)}><BookOpen className="mr-2 h-4 w-4" />Details</Button>
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => openStudentsModal(program)}><Users className="mr-2 h-4 w-4" />Students</Button>
                            </div>
                        </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
        </CardContent>
      </Card>

      {/* View Students Modal */}
      <Dialog open={isStudentsModalOpen} onOpenChange={setStudentsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Students in {selectedProgramForStudentsModal?.name}</DialogTitle>
                <DialogDescription>List of all trainees currently enrolled in this program.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
                {isStudentsLoading ? (
                    <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin"/></div>
                ) : studentList.length === 0 ? (
                    <p className="text-center text-muted-foreground py-10">No students are enrolled in this program yet.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {studentList.map(trainee => (
                                <TableRow key={trainee._id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${trainee.name}`} />
                                                <AvatarFallback>{getInitials(trainee.name)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{trainee.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{trainee.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={trainee.isActive ? 'default' : 'secondary'} className={trainee.isActive ? 'bg-green-100 text-green-800' : ''}>
                                            {trainee.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setStudentsModalOpen(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Program Details: {selectedProgramForDetailsModal?.name}</DialogTitle>
                <DialogDescription>{selectedProgramForDetailsModal?.description}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6">
                {isDetailsLoading ? (
                    <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin"/></div>
                ) : selectedProgramForDetailsModal ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Basic Info</h3>
                                <div className="space-y-2 text-sm">
                                    <p><strong>Status:</strong> {selectedProgramForDetailsModal.status && <Badge className={getStatusColor(selectedProgramForDetailsModal.status)}>{selectedProgramForDetailsModal.status}</Badge>}</p>
                                    <p><strong>Start Date:</strong> {new Date(selectedProgramForDetailsModal.startDate).toLocaleDateString()}</p>
                                    <p><strong>End Date:</strong> {new Date(selectedProgramForDetailsModal.endDate).toLocaleDateString()}</p>
                                    <p><strong>Manager:</strong> {selectedProgramForDetailsModal.programManager?.name || 'N/A'}</p>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Participants</h3>
                                <div className="space-y-2 text-sm">
                                    <p><strong>Total Trainees:</strong> {selectedProgramForDetailsModal.trainees?.length || 0}</p>
                                    <p><strong>Total Facilitators:</strong> {selectedProgramForDetailsModal.facilitators?.length || 0}</p>
                                    <p><strong>Total Courses:</strong> {selectedProgramForDetailsModal.courses?.length || 0}</p>
                                </div>
                            </div>
                        </div>

                        {selectedProgramForDetailsModal.rejectionReason && (
                            <Card className="bg-red-50 border-red-200">
                                <CardHeader><CardTitle className="text-red-800 text-base">Rejection Reason</CardTitle></CardHeader>
                                <CardContent className="text-sm text-red-700">
                                    {selectedProgramForDetailsModal.rejectionReason}
                                </CardContent>
                            </Card>
                        )}

                        <div>
                            <h3 className="font-semibold text-lg mb-2">Assigned Facilitators</h3>
                            {selectedProgramForDetailsModal.facilitators?.length > 0 ? (
                                <Table>
                                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {selectedProgramForDetailsModal.facilitators.map(f => (
                                            <TableRow key={f._id}>
                                                <TableCell>{f.name}</TableCell>
                                                <TableCell>{f.email}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-sm text-muted-foreground">No facilitators assigned to this program yet.</p>
                            )}
                        </div>

                        <div>
                            <h3 className="font-semibold text-lg mb-2">Enrolled Courses</h3>
                            {selectedProgramForDetailsModal.courses?.length > 0 ? (
                                <Table>
                                    <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Facilitator</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {selectedProgramForDetailsModal.courses.map(c => (
                                            <TableRow key={c._id}>
                                                <TableCell>{c.title}</TableCell>
                                                <TableCell>{c.facilitator?.name || 'N/A'}</TableCell>
                                                <TableCell><Badge className={getStatusColor(c.status)}>{c.status}</Badge></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-sm text-muted-foreground">No courses created for this program yet.</p>
                            )}
                        </div>
                    </>
                ) : (
                    <p className="text-center text-muted-foreground">No program details available.</p>
                )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}