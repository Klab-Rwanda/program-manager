"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, Users, BookOpen, Star, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/contexts/RoleContext";
import { getAllPrograms, getProgramById } from "@/lib/services/program.service";
import { Program as BackendProgram, Trainee } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Program extends BackendProgram {
  progress: number;
  rating: number;
  sessionsCompleted: number;
  totalSessions: number;
  nextSession: string;
}

export default function FacilitatorProgramsPage() {
  const { role, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("active");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the "View Students" modal
  const [isStudentsModalOpen, setStudentsModalOpen] = useState(false);
  const [selectedProgramForModal, setSelectedProgramForModal] = useState<Program | null>(null);
  const [studentList, setStudentList] = useState<Trainee[]>([]);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);

  const fetchFacilitatorPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const backendPrograms: BackendProgram[] = await getAllPrograms();
      const transformedPrograms: Program[] = backendPrograms.map(p => ({
        ...p,
        status: new Date(p.endDate) < new Date() ? 'Completed' : 'Active',
        progress: new Date(p.endDate) < new Date() ? 100 : Math.floor(40 + Math.random() * 50),
        rating: 4.5 + Math.random() * 0.5,
        sessionsCompleted: Math.floor(Math.random() * 40),
        totalSessions: 45,
        nextSession: `Tomorrow, ${Math.floor(9 + Math.random() * 5)}:00 AM`,
      }));
      setPrograms(transformedPrograms);
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
  
  // Function to open the modal and fetch students
  const openStudentsModal = async (program: Program) => {
    setSelectedProgramForModal(program);
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


  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "bg-green-100 text-green-800";
      case "upcoming": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-gray-100 text-gray-800";
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
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Progress</span>
                                    <span className="font-bold text-primary">{program.progress}%</span>
                                </div>
                                <Progress value={program.progress} className="h-2" />
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm border-t pt-3">
                                <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /><span>{program.trainees?.length || 0} Students</span></div>
                                <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /><span>{program.sessionsCompleted}/{program.totalSessions} Sessions</span></div>
                                <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /><span className="truncate">Next: {program.nextSession}</span></div>
                                <div className="flex items-center gap-2 text-muted-foreground"><Star className="h-4 w-4 text-yellow-400"/><span>{program.rating.toFixed(1)} Rating</span></div>
                            </div>
                        </CardContent>
                        <div className="p-4 pt-0 mt-auto">
                            <div className="flex gap-2">
                                <Button className="flex-1 bg-[#1f497d] hover:bg-[#1a3f6b]" size="sm"><BookOpen className="mr-2 h-4 w-4" />Details</Button>
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
                <DialogTitle>Students in {selectedProgramForModal?.name}</DialogTitle>
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
    </div>
  );
}