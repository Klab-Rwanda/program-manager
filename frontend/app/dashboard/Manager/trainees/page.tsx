"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, BookOpen, Eye, Edit, Trash2, GraduationCap, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getAllTrainees, createTrainee, assignTraineeToProgram } from "@/lib/services/trainee.service";
import { getAllPrograms } from "@/lib/services/program.service";
import { Program, Trainee } from "@/types";
import { useAuth } from "@/lib/contexts/RoleContext";

const initialTraineeData = { name: "", email: "" };

export default function TraineesPage() {
  const { user } = useAuth();
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterProgram, setFilterProgram] = useState("all");

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setAssignModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const [programToAssign, setProgramToAssign] = useState<string>("");
  const [newTraineeData, setNewTraineeData] = useState(initialTraineeData);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [traineeData, programData] = await Promise.all([
        getAllTrainees(),
        getAllPrograms()
      ]);
      setTrainees(traineeData);
      setPrograms(programData);
    } catch (err) {
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateTrainee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createTrainee(newTraineeData);
      toast.success("Trainee created successfully! Credentials sent via email.");
      setCreateModalOpen(false);
      setNewTraineeData(initialTraineeData);
      fetchData(); // Refresh the list
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create trainee.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignProgram = async () => {
    if (!selectedTrainee || !programToAssign) {
      toast.error("Please select a program to assign.");
      return;
    }
    setIsSubmitting(true);
    try {
      await assignTraineeToProgram(programToAssign, selectedTrainee._id);
      toast.success(`${selectedTrainee.name} has been enrolled in the program.`);
      setAssignModalOpen(false);
      fetchData(); // Refresh to see updated enrollments
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to assign program.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAssignModal = (trainee: Trainee) => {
    setSelectedTrainee(trainee);
    if (programs.length > 0) {
      setProgramToAssign(programs[0]._id);
    }
    setAssignModalOpen(true);
  };

  const filteredTrainees = trainees.filter(trainee => {
      const matchesSearch = trainee.name.toLowerCase().includes(searchTerm.toLowerCase()) || trainee.email.toLowerCase().includes(searchTerm.toLowerCase());
      const traineePrograms = programs.filter(p => p.trainees?.some(t => t._id === trainee._id)).map(p => p.name);
      const matchesProgram = filterProgram === 'all' || traineePrograms.includes(filterProgram);
      return matchesSearch && matchesProgram;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trainee Management</h1>
          <p className="text-muted-foreground">Add new trainees and assign them to your programs.</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="bg-[#1f497d] hover:bg-[#1a3f6b]">
          <Plus className="mr-2 h-4 w-4" />
          Add Trainee
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Input placeholder="Search trainees by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm"/>
            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by program" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {programs.map(p => <SelectItem key={p._id} value={p.name}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin"/></div> : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTrainees.map((trainee) => (
                <Card key={trainee._id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center space-x-3">
                            <GraduationCap className="h-8 w-8 text-primary"/>
                            <div>
                               <CardTitle className="text-lg">{trainee.name}</CardTitle>
                               <CardDescription>{trainee.email}</CardDescription>
                            </div>
                       </div>
                       <Badge variant={trainee.isActive ? "default" : "secondary"}>{trainee.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                     <p className="text-sm text-muted-foreground">
                        Enrolled in: {trainee.enrolledPrograms.join(', ') || 'No programs'}
                     </p>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openAssignModal(trainee)}>
                        <UserPlus className="h-4 w-4 mr-2" /> Assign to Program
                      </Button>
                      <Button variant="ghost" size="icon"><Eye className="h-4 w-4"/></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
               {filteredTrainees.length === 0 && <p className="col-span-full text-center text-muted-foreground py-10">No trainees found matching your criteria.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Trainee Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Trainee</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateTrainee} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={newTraineeData.name} onChange={(e) => setNewTraineeData(d => ({...d, name: e.target.value}))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={newTraineeData.email} onChange={(e) => setNewTraineeData(d => ({...d, email: e.target.value}))} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Add Trainee
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Program Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Program to {selectedTrainee?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label>Program</Label>
            <Select value={programToAssign} onValueChange={setProgramToAssign}>
              <SelectTrigger><SelectValue placeholder="Select a program to enroll" /></SelectTrigger>
              <SelectContent>
                {programs.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignProgram} disabled={isSubmitting}>
                 {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}