"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, Edit, Trash2, Archive, Loader2, AlertTriangle, Send,
  Download, FileText, Calendar, Users
} from "lucide-react";
import { Program, getAllPrograms, createProgram, updateProgram, deleteProgram, requestApproval } from "@/lib/services/program.service";
import { archiveProgram } from "@/lib/services/archive.service";
import { exportProgramsPDF, exportProgramsExcel, downloadBlob } from "@/lib/services/export.service";
import { toast } from "sonner";
import { useCounts } from "@/lib/contexts/CountsContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const ProgramManagerProgramsView: React.FC = () => {
  const { refreshCounts } = useCounts();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", startDate: "", endDate: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllPrograms();
      setPrograms(data);
    } catch (err) {
      const msg = "Failed to load programs.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const handleOpenModal = (program: Program | null = null) => {
    setEditingProgram(program);
    setFormData(program ? {
      name: program.name,
      description: program.description,
      startDate: program.startDate.split('T')[0],
      endDate: program.endDate.split('T')[0],
    } : { name: "", description: "", startDate: "", endDate: "" });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingProgram) {
        await updateProgram(editingProgram._id, formData);
        toast.success("Program updated!");
      } else {
        await createProgram(formData);
        toast.success("Program created!");
      }
      setIsModalOpen(false);
      await fetchPrograms();
      await refreshCounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!programToDelete) return;
    try {
      await deleteProgram(programToDelete._id);
      toast.success(`Program "${programToDelete.name}" deleted.`);
      setProgramToDelete(null);
      await fetchPrograms();
      await refreshCounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete program.");
    }
  };

  const handleArchive = async (program: Program) => {
    if (!confirm(`Archive "${program.name}"?`)) return;
    try {
      await archiveProgram(program._id);
      toast.success(`${program.name} archived.`);
      await fetchPrograms();
      await refreshCounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to archive program.");
    }
  };
  
  const handleRequestApproval = async (program: Program) => {
    try {
      await requestApproval(program._id);
      toast.success("Submitted for approval!");
      await fetchPrograms();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit.");
    }
  };

  const filteredPrograms = programs.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error) return <div className="p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Program Management</h1>
          <p className="text-muted-foreground">Manage all training programs.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-[#1f497d] text-white hover:bg-[#1a3f6b]">
          <Plus className="h-4 w-4 mr-2" /> Create Program
        </Button>
      </div>

      <Input placeholder="Search programs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrograms.map((program) => (
          <Card key={program._id} className="flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle>{program.name}</CardTitle>
                    <Badge className="capitalize">{program.status}</Badge>
                </div>
                <CardDescription className="line-clamp-2 h-10">{program.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
                <p className="text-sm text-gray-500 flex items-center gap-2"><Users size={14}/> {program.trainees?.length || 0} Trainees</p>
                <p className="text-sm text-gray-500 flex items-center gap-2"><Calendar size={14}/> Start: {new Date(program.startDate).toLocaleDateString()}</p>
            </CardContent>
            <div className="p-4 border-t flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => handleOpenModal(program)}><Edit className="h-3 w-3 mr-1"/> Edit</Button>
              <Button variant="destructive" size="sm" onClick={() => setProgramToDelete(program)}><Trash2 className="h-3 w-3 mr-1"/> Delete</Button>
              <Button variant="secondary" size="sm" onClick={() => handleArchive(program)}><Archive className="h-3 w-3 mr-1"/> Archive</Button>
              {program.status === 'Draft' && (
                <Button size="sm" onClick={() => handleRequestApproval(program)} className="bg-[#1f497d] hover:bg-[#1a3f6b]"><Send className="h-3 w-3 mr-1"/> Submit</Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => !isOpen && setIsModalOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingProgram ? 'Edit Program' : 'Create Program'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required/></div>
            <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required/></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Date</Label><Input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} required/></div>
              <div><Label>End Date</Label><Input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} required/></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin"/> : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!programToDelete} onOpenChange={() => setProgramToDelete(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Deletion</DialogTitle></DialogHeader>
          <DialogDescription>Delete "{programToDelete?.name}"?</DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgramToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};